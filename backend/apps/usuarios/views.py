from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Usuario, Comentario, EstadoUsuario, RolUsuario
from .serializers import UsuarioSerializer, UsuarioCreateSerializer, ComentarioSerializer
from .permissions import EsProfesor, EsProfesorOAlumnoPropio

# RF.3: el alumno solo puede modificar estos campos de su propio usuario.
# DNI (RF.1) y estado (RF.2) quedan reservados al profesor.
CAMPOS_AUTOEDITABLES_ALUMNO = {"first_name", "apellido", "fecha_nacimiento"}


class PaginacionUsuarios(PageNumberPagination):
    page_size = 12


class UsuarioViewSet(viewsets.ModelViewSet):
    """RF.1, RF.2, RF.3, RF.4: CRUD de usuarios. Alta reservada al profesor."""
    queryset = Usuario.objects.all()
    pagination_class = PaginacionUsuarios

    def get_serializer_class(self):
        if self.action == "create":
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def get_permissions(self):
        if self.action in ["create", "destroy", "list", "stats"]:
            return [EsProfesor()]
        if self.action in ["retrieve", "update", "partial_update"]:
            # RF.3: el profesor ve/modifica cualquier usuario; el alumno solo el propio.
            return [IsAuthenticated(), EsProfesorOAlumnoPropio()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Usuario.objects.all().order_by("apellido", "first_name")
        params = self.request.query_params

        rol = params.get("rol")
        if rol:
            qs = qs.filter(rol=rol)

        estado = params.get("estado")
        if estado:
            qs = qs.filter(estado=estado)

        busqueda = params.get("search")
        if busqueda:
            qs = qs.filter(
                Q(first_name__icontains=busqueda)
                | Q(apellido__icontains=busqueda)
                | Q(dni__icontains=busqueda)
            )

        fecha_desde = params.get("fecha_desde")
        if fecha_desde:
            qs = qs.filter(date_joined__date__gte=fecha_desde)

        fecha_hasta = params.get("fecha_hasta")
        if fecha_hasta:
            qs = qs.filter(date_joined__date__lte=fecha_hasta)

        return qs

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas para el panel de gestión (por rol, default alumno)."""
        rol = request.query_params.get("rol", RolUsuario.ALUMNO)
        base = Usuario.objects.filter(rol=rol)
        hace_una_semana = timezone.now() - timedelta(days=7)
        return Response({
            "total": base.count(),
            "activos": base.filter(estado=EstadoUsuario.ACTIVO).count(),
            "inactivos": base.filter(estado=EstadoUsuario.INACTIVO).count(),
            "nuevos_ultima_semana": base.filter(date_joined__gte=hace_una_semana).count(),
        })

    def create(self, request, *args, **kwargs):
        if request.data.get("rol") == "profesor" and not request.user.is_superuser:
            raise PermissionDenied(
                "Solo el administrador del sistema puede dar de alta profesores."
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        data = request.data
        if not request.user.es_profesor:
            # RF.3: se ignora cualquier campo fuera de lo autoeditable por el alumno.
            data = {k: v for k, v in request.data.items() if k in CAMPOS_AUTOEDITABLES_ALUMNO}
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class ComentarioViewSet(viewsets.ModelViewSet):
    """RF.24, RF.25: comentarios. Crea el Alumno, visualizan Alumno y Profesor."""
    serializer_class = ComentarioSerializer

    def get_queryset(self):
        user = self.request.user
        if user.es_profesor:
            return Comentario.objects.all()
        return Comentario.objects.filter(usuario=user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_alumno(request):
    """
    Login del alumno por DNI (ver mockup 'Ingrese su DNI o credencial de socio').
    RF: acceso mediante DNI a información personal.
    """
    dni = request.data.get("dni")
    if not dni:
        return Response({"detail": "Debe ingresar un DNI."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        usuario = Usuario.objects.get(dni=dni, rol="alumno")
    except Usuario.DoesNotExist:
        return Response(
            {"detail": "No se encontraron datos para ese DNI."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if usuario.estado != EstadoUsuario.ACTIVO:
        return Response(
            {"detail": "El usuario se encuentra inactivo. Contacte a su profesor."},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(usuario)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "usuario": UsuarioSerializer(usuario).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    """RF.29: el usuario ve su estado de actividad (Activo/Inactivo)."""
    return Response(UsuarioSerializer(request.user).data)



from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.usuarios.permissions import EsProfesor
from .models import TipoRutina, Rutina
from .serializers import TipoRutinaSerializer, RutinaSerializer, RutinaWriteSerializer


class TipoRutinaViewSet(viewsets.ModelViewSet):
    """RF.14, RF.15: crear/modificar (profesor), visualizar (alumno y profesor)."""
    queryset = TipoRutina.objects.all()
    serializer_class = TipoRutinaSerializer

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [EsProfesor()]
        return [IsAuthenticated()]


class RutinaViewSet(viewsets.ModelViewSet):
    """
    RF.12, RF.13, RF.18, RF.19, RF.20.
    La lógica de create/update sigue el diagrama de secuencia "Crear rutina" /
    "Modificar rutina" del informe: validar datos -> aplicar reglas de negocio ->
    persistir -> confirmar. Los pasos 2 y 3 (validar/reglas) se resuelven acá;
    si la app crece, migrar a una capa de servicios (services.py) separada del view.
    """
    queryset = Rutina.objects.all().prefetch_related("items__ejercicio", "cronograma")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RutinaWriteSerializer
        return RutinaSerializer

    def _datos_lectura(self, rutina):
        """Rutina recién guardada, serializada con el formato de lectura (items completos)."""
        rutina = self.queryset.get(pk=rutina.pk)
        return RutinaSerializer(rutina, context=self.get_serializer_context()).data

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.order_by("-fecha_inicio", "-id")
        if not user.es_profesor:
            return qs.filter(usuario=user)  # RF.13: alumno ve solo su rutina
        usuario_id = self.request.query_params.get("usuario")
        if usuario_id:
            qs = qs.filter(usuario_id=usuario_id)
        return qs

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [EsProfesor()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        # Paso "Validar datos de rutina" del diagrama de secuencia
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Rama [Datos inválidos] -> Mostrar error de validación
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # Rama [Datos válidos] -> Almacenar nueva rutina
        self.perform_create(serializer)
        return Response(self._datos_lectura(serializer.instance), status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(self._datos_lectura(serializer.instance))

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Seguimiento, LineaSeguimiento
from .serializers import SeguimientoSerializer, LineaSeguimientoSerializer


class SeguimientoViewSet(viewsets.ModelViewSet):
    """
    RF.5, RF.6, RF.7: crear/modificar/visualizar plan de seguimiento (Alumno crea el suyo,
    Profesor puede asociarlo a un usuario). Sigue el flujo del diagrama de secuencia
    "Crear plan de seguimiento": validar datos -> validar reglas de negocio -> guardar.
    """
    serializer_class = SeguimientoSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.es_profesor:
            return Seguimiento.objects.filter(usuario=user)  # RF.6: alumno ve su propio plan
        qs = Seguimiento.objects.all()
        usuario_id = self.request.query_params.get("usuario")
        if usuario_id:
            qs = qs.filter(usuario_id=usuario_id)
        return qs

    def perform_create(self, serializer):
        # Si es alumno, el plan se asocia a sí mismo (RF.5)
        usuario = self.request.data.get("usuario") if self.request.user.es_profesor else self.request.user
        serializer.save(usuario=usuario)


class LineaSeguimientoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LineaSeguimientoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.es_profesor:
            return LineaSeguimiento.objects.all()
        return LineaSeguimiento.objects.filter(seguimiento__usuario=user)

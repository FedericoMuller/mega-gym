from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from apps.usuarios.permissions import EsProfesor
from .models import Accesorio, Ejercicio, Peso, Serie, Repeticion
from .serializers import (
    AccesorioSerializer, EjercicioSerializer, PesoSerializer,
    SerieSerializer, RepeticionSerializer,
)


class SoloLecturaParaAlumno:
    """RF.8, RF.9, RF.11: profesor gestiona (CRUD); alumno solo visualiza."""
    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [EsProfesor()]
        return [IsAuthenticated()]


class AccesorioViewSet(SoloLecturaParaAlumno, viewsets.ModelViewSet):
    queryset = Accesorio.objects.all()
    serializer_class = AccesorioSerializer


class PaginacionEjercicios(PageNumberPagination):
    # El catálogo se filtra/ordena en el cliente: permite pedir todo en una sola página.
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 500


class EjercicioViewSet(SoloLecturaParaAlumno, viewsets.ModelViewSet):
    queryset = (
        Ejercicio.objects.all()
        .order_by("nombre_ejercicio")
        .prefetch_related("accesorios", "series", "pesos")
    )
    serializer_class = EjercicioSerializer
    pagination_class = PaginacionEjercicios

    def perform_update(self, serializer):
        imagen_anterior = serializer.instance.imagen.name if serializer.instance.imagen else None
        ejercicio = serializer.save()
        if imagen_anterior and ejercicio.imagen.name != imagen_anterior:
            ejercicio.imagen.storage.delete(imagen_anterior)

    def perform_destroy(self, instance):
        if instance.imagen:
            instance.imagen.delete(save=False)
        instance.delete()


class PesoViewSet(SoloLecturaParaAlumno, viewsets.ModelViewSet):
    queryset = Peso.objects.all()
    serializer_class = PesoSerializer


class SerieViewSet(SoloLecturaParaAlumno, viewsets.ModelViewSet):
    queryset = Serie.objects.all()
    serializer_class = SerieSerializer


class RepeticionViewSet(SoloLecturaParaAlumno, viewsets.ModelViewSet):
    queryset = Repeticion.objects.all()
    serializer_class = RepeticionSerializer

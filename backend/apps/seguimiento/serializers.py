from rest_framework import serializers
from .models import Seguimiento, LineaSeguimiento


class LineaSeguimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineaSeguimiento
        fields = ["id", "seguimiento", "fecha_actualizacion", "peso_actualizacion"]
        read_only_fields = ["id", "fecha_actualizacion"]


class SeguimientoSerializer(serializers.ModelSerializer):
    lineas = LineaSeguimientoSerializer(many=True, read_only=True)

    class Meta:
        model = Seguimiento
        fields = [
            "id", "usuario", "objetivo", "fecha_inicio", "fecha_objetivo",
            "peso_actual", "peso_objetivo", "lineas",
        ]
        read_only_fields = ["id", "usuario"]

import re

from django.db import transaction
from rest_framework import serializers

from apps.ejercicios.serializers import EjercicioSerializer
from .models import TipoRutina, Rutina, RutinaEjercicio, Cronograma

PATRON_REPETICIONES = re.compile(r"^(\d{1,3})(?:-(\d{1,3}))?$")


class TipoRutinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoRutina
        fields = ["id", "nombre"]


class CronogramaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cronograma
        fields = ["id", "rutina", "dia", "enfoque"]


class RutinaEjercicioSerializer(serializers.ModelSerializer):
    """Lectura: el ejercicio completo con su día, series y repeticiones."""
    ejercicio = EjercicioSerializer(read_only=True)

    class Meta:
        model = RutinaEjercicio
        fields = ["id", "dia", "orden", "series", "repeticiones", "ejercicio"]


class RutinaSerializer(serializers.ModelSerializer):
    """
    Serializer de lectura: los ejercicios vienen en `items`, cada uno con su día,
    series y repeticiones (el alumno tiene una lista distinta por día).
    """
    items = RutinaEjercicioSerializer(many=True, read_only=True)
    cronograma = CronogramaSerializer(many=True, read_only=True)
    tipo_rutina = TipoRutinaSerializer(read_only=True)

    class Meta:
        model = Rutina
        fields = [
            "id", "usuario", "nombre", "tipo_rutina", "fecha_inicio", "objetivo",
            "nivel", "estado", "items", "cronograma", "plan_seguimiento",
        ]


class RutinaEjercicioWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RutinaEjercicio
        fields = ["ejercicio", "dia", "series", "repeticiones"]

    def validate_series(self, valor):
        if not 1 <= valor <= 20:
            raise serializers.ValidationError("Las series deben estar entre 1 y 20.")
        return valor

    def validate_repeticiones(self, valor):
        valor = valor.replace(" ", "")
        coincidencia = PATRON_REPETICIONES.match(valor)
        if not coincidencia:
            raise serializers.ValidationError("Usá un número (10) o un rango (8-10).")
        minimo, maximo = coincidencia.group(1), coincidencia.group(2)
        if int(minimo) < 1 or (maximo is not None and int(maximo) < int(minimo)):
            raise serializers.ValidationError("Las repeticiones no son válidas.")
        return valor


class RutinaWriteSerializer(serializers.ModelSerializer):
    """
    RF.12, RF.18, RF.19, RF.20: crear/modificar rutina junto con sus ejercicios por día.
    `items` reemplaza por completo la lista de ejercicios de la rutina.
    """
    nombre = serializers.CharField(max_length=100)
    items = RutinaEjercicioWriteSerializer(many=True)

    class Meta:
        model = Rutina
        fields = [
            "id", "usuario", "nombre", "tipo_rutina", "fecha_inicio", "objetivo",
            "nivel", "estado", "items", "plan_seguimiento",
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("La rutina necesita al menos un ejercicio.")
        vistos = set()
        for item in items:
            clave = (item["dia"], item["ejercicio"].pk)
            if clave in vistos:
                raise serializers.ValidationError(
                    f"'{item['ejercicio']}' está repetido en el mismo día."
                )
            vistos.add(clave)
        return items

    @staticmethod
    def _guardar_items(rutina, items):
        RutinaEjercicio.objects.bulk_create(
            RutinaEjercicio(rutina=rutina, orden=orden, **datos)
            for orden, datos in enumerate(items)
        )

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        rutina = super().create(validated_data)
        self._guardar_items(rutina, items)
        return rutina

    @transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        rutina = super().update(instance, validated_data)
        if items is not None:
            rutina.items.all().delete()
            self._guardar_items(rutina, items)
        return rutina

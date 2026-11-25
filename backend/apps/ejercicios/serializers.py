from rest_framework import serializers
from apps.maquinas.models import Maquina
from apps.maquinas.serializers import MaquinaSerializer
from .models import Accesorio, Ejercicio, Peso, Serie, Repeticion


class AccesorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accesorio
        fields = ["id", "descripcion"]


class RepeticionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repeticion
        fields = ["id", "serie", "cantidad"]


class SerieSerializer(serializers.ModelSerializer):
    repeticiones = RepeticionSerializer(many=True, read_only=True)

    class Meta:
        model = Serie
        fields = ["id", "ejercicio", "cantidad", "repeticiones"]


class PesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Peso
        fields = ["id", "ejercicio", "cantidad"]


class EjercicioSerializer(serializers.ModelSerializer):
    accesorios = AccesorioSerializer(many=True, read_only=True)
    accesorio_ids = serializers.PrimaryKeyRelatedField(
        source="accesorios", queryset=Accesorio.objects.all(), many=True, write_only=True, required=False
    )
    # RF.11: asociar máquinas a un ejercicio (mismo patrón que accesorios: nested para
    # lectura, ids aparte para poder enviar la lista vacía sin ambigüedad por multipart).
    maquinas = MaquinaSerializer(many=True, read_only=True)
    maquina_ids = serializers.PrimaryKeyRelatedField(
        source="maquinas", queryset=Maquina.objects.all(), many=True, write_only=True, required=False
    )
    series = SerieSerializer(many=True, read_only=True)
    pesos = PesoSerializer(many=True, read_only=True)

    class Meta:
        model = Ejercicio
        fields = [
            "id", "nombre_ejercicio", "url_ejercicio", "categoria", "tipo",
            "imagen", "maquinas", "maquina_ids",
            "accesorios", "accesorio_ids", "series", "pesos",
        ]

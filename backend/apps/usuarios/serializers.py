from rest_framework import serializers
from .models import Usuario, Comentario


class UsuarioSerializer(serializers.ModelSerializer):
    tiene_rutina = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id", "username", "first_name", "apellido", "dni",
            "fecha_nacimiento", "email", "rol", "estado",
            "profesor_asignado", "is_superuser",
            "tiene_rutina", "last_login", "date_joined",
        ]
        read_only_fields = ["id", "is_superuser", "last_login", "date_joined"]

    def get_tiene_rutina(self, obj) -> bool:
        return obj.rutinas.exists()


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """RF.1: creación de usuarios (solo Profesor)."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id", "username", "password", "first_name", "apellido", "dni",
            "fecha_nacimiento", "email", "rol", "estado", "profesor_asignado",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class ComentarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comentario
        fields = ["id", "usuario", "comentario", "fecha"]
        read_only_fields = ["id", "fecha"]
from rest_framework import serializers
from .models import Usuario, Comentario, RolUsuario


def validar_profesor_asignado(valor):
    """RF.4: un usuario solo puede asociarse a un profesor."""
    if valor is not None and valor.rol != RolUsuario.PROFESOR:
        raise serializers.ValidationError("El profesor asignado debe tener rol Profesor.")
    return valor


class UsuarioSerializer(serializers.ModelSerializer):
    tiene_rutina = serializers.SerializerMethodField()
    profesor_asignado_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id", "username", "first_name", "apellido", "dni",
            "fecha_nacimiento", "email", "rol", "estado",
            "profesor_asignado", "profesor_asignado_nombre", "is_superuser",
            "tiene_rutina", "last_login", "date_joined",
        ]
        read_only_fields = ["id", "is_superuser", "last_login", "date_joined"]

    def get_tiene_rutina(self, obj) -> bool:
        return obj.rutinas.exists()

    def get_profesor_asignado_nombre(self, obj) -> str | None:
        p = obj.profesor_asignado
        return f"{p.first_name} {p.apellido}".strip() if p else None

    def validate_profesor_asignado(self, valor):
        return validar_profesor_asignado(valor)


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """RF.1: creación de usuarios (solo Profesor)."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id", "username", "password", "first_name", "apellido", "dni",
            "fecha_nacimiento", "email", "rol", "estado", "profesor_asignado",
        ]

    def validate_profesor_asignado(self, valor):
        return validar_profesor_asignado(valor)

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
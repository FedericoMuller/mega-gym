from django.db import models
from django.conf import settings


class NivelRutina(models.TextChoices):
    """<<enum: Rutina>> Nivel = Adaptativo, Intermedio, Avanzado"""
    ADAPTATIVO = "adaptativo", "Adaptativo"
    INTERMEDIO = "intermedio", "Intermedio"
    AVANZADO = "avanzado", "Avanzado"


class EstadoRutina(models.TextChoices):
    """<<enum: Rutina>> estado = Activa, Inactiva"""
    ACTIVA = "activa", "Activa"
    INACTIVA = "inactiva", "Inactiva"


class DiaSemana(models.TextChoices):
    LUNES = "lun", "Lunes"
    MARTES = "mar", "Martes"
    MIERCOLES = "mie", "Miércoles"
    JUEVES = "jue", "Jueves"
    VIERNES = "vie", "Viernes"
    SABADO = "sab", "Sábado"
    DOMINGO = "dom", "Domingo"


class TipoRutina(models.Model):
    """RF.14, RF.15: tipos de rutina (Incluye: nombre del tipo de rutina)."""
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class Rutina(models.Model):
    """
    RF.12, RF.13: crear/modificar/visualizar rutina.
    Incluye: fecha de inicio, objetivo, nivel, estado.
    """
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rutinas"
    )  # RF.19: asociar la rutina con un usuario
    tipo_rutina = models.ForeignKey(
        TipoRutina, on_delete=models.SET_NULL, null=True, related_name="rutinas"
    )
    nombre = models.CharField(max_length=100, blank=True)
    fecha_inicio = models.DateField()
    objetivo = models.CharField(max_length=200, blank=True)  # se muestra como "Descripción"
    nivel = models.CharField(max_length=15, choices=NivelRutina.choices)
    estado = models.CharField(
        max_length=10, choices=EstadoRutina.choices, default=EstadoRutina.ACTIVA
    )
    plan_seguimiento = models.ForeignKey(
        "seguimiento.Seguimiento",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rutinas",
    )  # RF.20: asociar la rutina con un plan de seguimiento

    def __str__(self):
        return f"Rutina {self.id} - {self.usuario}"


class RutinaEjercicio(models.Model):
    """
    RF.18 + RF.10: ejercicio de una rutina para un día de la semana, con las
    series y repeticiones (por serie) a realizar. El alumno tiene una lista
    distinta de ejercicios por cada día.
    """
    rutina = models.ForeignKey(Rutina, on_delete=models.CASCADE, related_name="items")
    ejercicio = models.ForeignKey(
        "ejercicios.Ejercicio", on_delete=models.CASCADE, related_name="usos_en_rutinas"
    )
    dia = models.CharField(max_length=3, choices=DiaSemana.choices)
    orden = models.PositiveSmallIntegerField(default=0)
    series = models.PositiveSmallIntegerField()
    repeticiones = models.CharField(max_length=15)  # "10" o un rango, ej. "8-10"

    class Meta:
        ordering = ["orden", "id"]

    def __str__(self):
        return f"{self.get_dia_display()}: {self.ejercicio} {self.series}x{self.repeticiones}"


class Cronograma(models.Model):
    """RF.16, RF.17: cronograma de la rutina (Incluye: dia, enfoque)."""
    rutina = models.ForeignKey(Rutina, on_delete=models.CASCADE, related_name="cronograma")
    dia = models.CharField(max_length=20)
    enfoque = models.CharField(max_length=100)  # ej: Espalda, Biceps, Triceps, Hombros

    def __str__(self):
        return f"{self.dia} - {self.enfoque}"

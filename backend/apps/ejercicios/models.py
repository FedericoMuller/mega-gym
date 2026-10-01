from django.db import models


class Accesorio(models.Model):
    """RF.9: Accesorio/Elemento (Incluye: descripción)."""
    descripcion = models.CharField(max_length=200)

    def __str__(self):
        return self.descripcion


class CategoriaEjercicio(models.TextChoices):
    PECHO = "pecho", "Pecho"
    ESPALDA = "espalda", "Espalda"
    PIERNAS = "piernas", "Piernas"
    HOMBROS = "hombros", "Hombros"
    BRAZOS = "brazos", "Brazos"
    CORE = "core", "Core"
    CARDIO = "cardio", "Cardio"


class TipoEjercicio(models.TextChoices):
    COMPUESTO = "compuesto", "Compuesto"
    AISLAMIENTO = "aislamiento", "Aislamiento"


class EquipamientoEjercicio(models.TextChoices):
    MAQUINA = "maquina", "Máquina"
    MANCUERNAS = "mancuernas", "Mancuernas"
    BARRA = "barra", "Barra"
    POLEA = "polea", "Polea"
    PESO_CORPORAL = "peso_corporal", "Peso corporal"
    OTRO = "otro", "Otro"


class Ejercicio(models.Model):
    """RF.8: Ejercicio (Incluye: nombre de ejercicio, URL ejercicio)."""
    nombre_ejercicio = models.CharField(max_length=150)
    url_ejercicio = models.URLField(blank=True, null=True)
    categoria = models.CharField(max_length=10, choices=CategoriaEjercicio.choices, blank=True)
    tipo = models.CharField(max_length=12, choices=TipoEjercicio.choices, blank=True)
    equipamiento = models.CharField(max_length=15, choices=EquipamientoEjercicio.choices, blank=True)
    imagen = models.ImageField(upload_to="ejercicios/", blank=True, null=True)
    accesorios = models.ManyToManyField(Accesorio, blank=True, related_name="ejercicios")
    maquinas = models.ManyToManyField(
        "maquinas.Maquina", blank=True, related_name="ejercicios"
    )

    def __str__(self):
        return self.nombre_ejercicio


class Peso(models.Model):
    """RF.10: peso asociado a un ejercicio dentro de una rutina."""
    ejercicio = models.ForeignKey(Ejercicio, on_delete=models.CASCADE, related_name="pesos")
    cantidad = models.IntegerField()


class Serie(models.Model):
    """RF.10: series de un ejercicio."""
    ejercicio = models.ForeignKey(Ejercicio, on_delete=models.CASCADE, related_name="series")
    cantidad = models.IntegerField()


class Repeticion(models.Model):
    """RF.10: repeticiones asociadas a una serie."""
    serie = models.ForeignKey(Serie, on_delete=models.CASCADE, related_name="repeticiones")
    cantidad = models.IntegerField()

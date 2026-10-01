from django.contrib import admin
from .models import TipoRutina, Rutina, RutinaEjercicio, Cronograma


class RutinaEjercicioInline(admin.TabularInline):
    model = RutinaEjercicio
    extra = 0


@admin.register(Rutina)
class RutinaAdmin(admin.ModelAdmin):
    inlines = [RutinaEjercicioInline]


admin.site.register(TipoRutina)
admin.site.register(Cronograma)

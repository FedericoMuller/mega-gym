from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("tipos", views.TipoRutinaViewSet, basename="tipo-rutina")
router.register("", views.RutinaViewSet, basename="rutina")

urlpatterns = [
    path("items/<int:item_id>/toggle/", views.alternar_completado, name="rutina-item-toggle"),
] + router.urls

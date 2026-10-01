from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth (JWT para profesor, login por DNI para alumno -> ver apps/usuarios)
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Rutas de cada app del dominio
    path("api/usuarios/", include("apps.usuarios.urls")),
    path("api/ejercicios/", include("apps.ejercicios.urls")),
    path("api/maquinas/", include("apps.maquinas.urls")),
    path("api/rutinas/", include("apps.rutinas.urls")),
    path("api/seguimiento/", include("apps.seguimiento.urls")),
    path("api/socios/", include("apps.socios.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

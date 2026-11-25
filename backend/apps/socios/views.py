import io
from datetime import date
from pathlib import Path

from django.http import FileResponse
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor

from apps.usuarios.permissions import EsProfesor
from .models import Descuento, EstadoSocio, Socio
from .serializers import DescuentoSerializer, SocioSerializer

AZUL = HexColor("#0B2876")
ROJO = HexColor("#FB0100")
ESCUDO_PATH = Path(__file__).resolve().parent / "assets" / "escudo_rivadavia.png"
MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


class DescuentoViewSet(viewsets.ModelViewSet):
    """RF.21: crear y modificar descuentos (solo Profesor)."""
    queryset = Descuento.objects.all()
    serializer_class = DescuentoSerializer
    permission_classes = [EsProfesor]


class SocioViewSet(viewsets.ModelViewSet):
    """RF.27, RF.28: agregar/modificar/visualizar socios y su estado."""
    queryset = Socio.objects.all()
    serializer_class = SocioSerializer

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [EsProfesor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.es_profesor:
            return Socio.objects.all()
        return Socio.objects.filter(usuario=user)


def _texto_espaciado(texto, espacio=" "):
    """'DE CONCEPCION' -> 'D E   C O N C E P C I O N' (imita el tracking del modelo)."""
    palabras = texto.split(" ")
    return (espacio * 3).join(espacio.join(palabra) for palabra in palabras)


def _dibujar_constancia(pdf, ancho, alto, socio):
    """
    Constancia de Socio Activo del Club Atlético Rivadavia de Concepción del
    Uruguay, siguiendo el modelo real del club (marco doble, franjas
    azul/rojo/azul detrás del escudo, título subrayado y firma del
    presidente de la institución).
    """
    centro_x = ancho / 2

    # Marco doble
    pdf.setStrokeColor(AZUL)
    pdf.setLineWidth(2)
    pdf.rect(12 * mm, 12 * mm, ancho - 24 * mm, alto - 24 * mm)
    pdf.setLineWidth(0.6)
    pdf.rect(16 * mm, 16 * mm, ancho - 32 * mm, alto - 32 * mm)

    # Franjas azul/rojo/azul detrás del escudo
    y_franjas = alto - 34 * mm
    gap = 16 * mm
    for color, alto_franja, desplazamiento in ((AZUL, 2.6, 0), (ROJO, 1.6, -3.2), (AZUL, 2.6, -5.6)):
        pdf.setFillColor(color)
        y = y_franjas + desplazamiento * mm
        pdf.rect(26 * mm, y, (centro_x - gap) - 26 * mm, alto_franja * mm, stroke=0, fill=1)
        pdf.rect(centro_x + gap, y, (ancho - 26 * mm) - (centro_x + gap), alto_franja * mm, stroke=0, fill=1)

    tam_escudo = 32 * mm
    if ESCUDO_PATH.exists():
        pdf.drawImage(
            str(ESCUDO_PATH),
            centro_x - tam_escudo / 2,
            alto - 20 * mm - tam_escudo,
            width=tam_escudo,
            height=tam_escudo,
            mask="auto",
            preserveAspectRatio=True,
        )

    pdf.setFillColor(AZUL)
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(centro_x, alto - 58 * mm, "CLUB ATLÉTICO RIVADAVIA")
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawCentredString(centro_x, alto - 64 * mm, _texto_espaciado("DE CONCEPCION DEL URUGUAY"))

    # Título
    pdf.setFillColor(AZUL)
    pdf.setFont("Helvetica-Bold", 28)
    y_titulo = alto - 85 * mm
    pdf.drawCentredString(centro_x, y_titulo, "CONSTANCIA DE SOCIO")
    pdf.setStrokeColor(AZUL)
    pdf.setLineWidth(1.5)
    pdf.line(26 * mm, y_titulo - 5 * mm, ancho - 26 * mm, y_titulo - 5 * mm)

    # Cuerpo
    y = y_titulo - 18 * mm
    pdf.setFillColor(HexColor("#1a1a1a"))
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(centro_x, y, "El Club Atlético Rivadavia de Concepción del Uruguay")
    y -= 7 * mm
    pdf.drawCentredString(centro_x, y, "deja constancia de que")

    y -= 14 * mm
    nombre_completo = f"{socio.nombre} {socio.apellido}"
    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawCentredString(centro_x, y, nombre_completo)
    ancho_nombre = pdf.stringWidth(nombre_completo, "Helvetica-Bold", 15)
    pdf.setStrokeColor(HexColor("#1a1a1a"))
    pdf.setLineWidth(0.6)
    pdf.line(
        centro_x - ancho_nombre / 2 - 10 * mm, y - 2 * mm,
        centro_x + ancho_nombre / 2 + 10 * mm, y - 2 * mm,
    )

    y -= 12 * mm
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(centro_x, y, f"DNI N°: {socio.dni}")

    y -= 9 * mm
    pdf.drawCentredString(
        centro_x, y, f"Vencimiento de membresía: {socio.fecha_vencimiento.strftime('%d/%m/%Y')}"
    )

    # "es SOCIO ACTIVO de nuestra institución," con esas palabras en negrita
    y -= 16 * mm
    texto_a, texto_b, texto_c = "es ", "SOCIO ACTIVO", " de nuestra institución,"
    ancho_a = pdf.stringWidth(texto_a, "Helvetica", 12)
    ancho_b = pdf.stringWidth(texto_b, "Helvetica-Bold", 12)
    ancho_c = pdf.stringWidth(texto_c, "Helvetica", 12)
    x = centro_x - (ancho_a + ancho_b + ancho_c) / 2
    pdf.setFont("Helvetica", 12)
    pdf.drawString(x, y, texto_a)
    x += ancho_a
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x, y, texto_b)
    x += ancho_b
    pdf.setFont("Helvetica", 12)
    pdf.drawString(x, y, texto_c)

    y -= 7 * mm
    pdf.drawCentredString(centro_x, y, "manteniendo vigente su condición societaria")
    y -= 7 * mm
    pdf.drawCentredString(centro_x, y, "a la fecha de emisión del presente certificado.")

    y -= 18 * mm
    hoy = date.today()
    pdf.setFont("Helvetica-Oblique", 11)
    pdf.drawCentredString(
        centro_x, y,
        f"Concepción del Uruguay, {hoy.day} de {MESES[hoy.month - 1]} de {hoy.year}.",
    )

    # Firma
    y_firma = 46 * mm
    pdf.setStrokeColor(HexColor("#1a1a1a"))
    pdf.setLineWidth(0.6)
    pdf.line(centro_x - 35 * mm, y_firma, centro_x + 35 * mm, y_firma)
    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(HexColor("#1a1a1a"))
    pdf.drawCentredString(centro_x, y_firma - 5 * mm, "EL PRESIDENTE DE LA INSTITUCIÓN")

    # Franjas decorativas inferiores (versión simplificada de la cinta azul/roja
    # del modelo). Se rota alrededor del centro de la página para que la
    # inclinación sea simétrica en vez de "hundirse" hacia uno de los bordes.
    pdf.saveState()
    pdf.translate(centro_x, 20 * mm)
    pdf.rotate(-2.5)
    mitad = ancho / 2 + 10 * mm
    pdf.setFillColor(AZUL)
    pdf.rect(-mitad, -2 * mm, 2 * mitad, 5 * mm, stroke=0, fill=1)
    pdf.setFillColor(ROJO)
    pdf.rect(-mitad, -9 * mm, 2 * mitad, 4 * mm, stroke=0, fill=1)
    pdf.restoreState()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def certificado_socio_activo(request):
    """
    RF.30, RF.31: generar y descargar en PDF la constancia de socio activo.
    Datos a mostrar: Nombre y apellido, DNI, estado, último vencimiento membresía.
    """
    try:
        socio = request.user.socio
    except Socio.DoesNotExist:
        return Response({"detail": "El usuario no tiene un registro de socio asociado."}, status=404)

    if socio.estado != EstadoSocio.ACTIVO:
        return Response({"detail": "El socio no está activo."}, status=403)

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    ancho, alto = A4
    _dibujar_constancia(pdf, ancho, alto, socio)
    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return FileResponse(
        buffer, as_attachment=True, filename=f"constancia_socio_{socio.dni}.pdf"
    )

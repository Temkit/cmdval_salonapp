"""QR code generation service."""

import io

import qrcode
from qrcode.image.pil import PilImage


class QRService:
    """Service for generating QR codes."""

    def generate_qr_code(self, data: str) -> bytes:
        """Generate a QR code PNG image from the given data.

        Args:
            data: The string content to encode in the QR code (e.g. patient code_carte).

        Returns:
            PNG image bytes of the generated QR code.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img: PilImage = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer.getvalue()

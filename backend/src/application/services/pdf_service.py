"""PDF document generation service for clinic documents."""

import io
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


# Default template content for each document type (used when no DB template exists)
DEFAULT_TEMPLATES: dict[str, dict] = {
    "consent": {
        "title": "Formulaire de Consentement",
        "intro": (
            "Je soussigne(e) <b>{prenom} {nom}</b>, reconnais avoir ete informe(e) "
            "de maniere claire et complete des points suivants concernant "
            "le traitement par laser propose par le centre Optiskin :"
        ),
        "sections": [
            {
                "heading": "Nature du traitement",
                "content": (
                    "Le traitement consiste en des seances d'epilation laser. "
                    "Le nombre de seances necessaires depend de la zone traitee, "
                    "du type de peau et de la pilosite du patient."
                ),
            },
            {
                "heading": "Risques et effets secondaires",
                "content": (
                    "Les effets secondaires possibles incluent : rougeurs temporaires, "
                    "sensation de chaleur, leger gonflement de la zone traitee, "
                    "et dans de rares cas, des modifications de pigmentation cutanee. "
                    "Ces effets sont generalement temporaires."
                ),
            },
            {
                "heading": "Contre-indications",
                "content": (
                    "J'ai ete informe(e) des contre-indications au traitement laser, "
                    "notamment : grossesse, exposition recente au soleil ou aux UV, "
                    "prise de medicaments photosensibilisants, maladies dermatologiques "
                    "actives sur la zone a traiter, et antecedents de cicatrisation anormale."
                ),
            },
            {
                "heading": "Engagement du patient",
                "content": (
                    "Je m'engage a respecter les consignes pre et post-traitement "
                    "qui m'ont ete communiquees, et a signaler tout changement de "
                    "mon etat de sante susceptible de modifier les conditions du traitement."
                ),
            },
            {
                "heading": "Droit de retractation",
                "content": (
                    "Je suis informe(e) que je peux interrompre le traitement "
                    "a tout moment, sans avoir a justifier ma decision."
                ),
            },
        ],
        "closing": (
            "En signant ce document, je declare avoir pris connaissance de "
            "l'ensemble des informations ci-dessus et donne mon consentement "
            "libre et eclaire pour la realisation du traitement laser."
        ),
    },
    "rules": {
        "title": "Reglement Interieur - Securite Laser",
        "intro": (
            "Le present reglement a pour objet de definir les regles de "
            "securite et de fonctionnement du centre Optiskin. "
            "Tout patient s'engage a le respecter."
        ),
        "sections": [
            {
                "heading": "Article 1 - Securite laser",
                "items": [
                    "Le port de lunettes de protection est obligatoire pendant toute la duree du traitement, tant pour le patient que pour le praticien.",
                    "Il est strictement interdit de retirer les lunettes de protection pendant que le laser est en fonctionnement.",
                    "Tout dysfonctionnement ou sensation anormale doit etre signale immediatement au praticien.",
                ],
            },
            {
                "heading": "Article 2 - Preparation avant seance",
                "items": [
                    "La zone a traiter doit etre rasee 24 a 48 heures avant la seance.",
                    "Aucun produit cosmetique (creme, deodorant, parfum) ne doit etre applique sur la zone a traiter le jour de la seance.",
                    "Toute exposition au soleil ou aux UV (cabine de bronzage) doit etre evitee pendant les 4 semaines precedant la seance.",
                ],
            },
            {
                "heading": "Article 3 - Deroulement de la seance",
                "items": [
                    "Le patient doit arriver a l'heure de son rendez-vous. Un retard de plus de 15 minutes pourra entrainer l'annulation de la seance.",
                    "Le patient doit informer le praticien de tout changement de son etat de sante, de tout nouveau traitement medicamenteux ou de toute grossesse.",
                    "Le praticien se reserve le droit de refuser ou de reporter une seance si les conditions de securite ne sont pas reunies.",
                ],
            },
            {
                "heading": "Article 4 - Apres la seance",
                "items": [
                    "Appliquer la creme apaisante fournie selon les indications du praticien.",
                    "Eviter toute exposition au soleil ou aux UV pendant les 4 semaines suivant la seance.",
                    "Ne pas gratter ni frotter la zone traitee.",
                    "En cas de reaction inhabituelle, contacter immediatement le centre.",
                ],
            },
            {
                "heading": "Article 5 - Annulation et report",
                "items": [
                    "Toute annulation doit etre effectuee au moins 24 heures avant le rendez-vous.",
                    "En cas d'annulation tardive ou d'absence sans prevenir, la seance pourra etre consideree comme effectuee.",
                ],
            },
            {
                "heading": "Article 6 - Responsabilite",
                "items": [
                    "Le centre Optiskin decline toute responsabilite en cas de non-respect des consignes par le patient.",
                    "Le patient s'engage a fournir des informations exactes et completes sur son etat de sante.",
                ],
            },
        ],
        "closing": (
            "Je reconnais avoir pris connaissance du present reglement "
            "interieur et m'engage a le respecter."
        ),
    },
    "precautions": {
        "title": "Precautions Pre et Post-Traitement Laser",
        "intro": (
            "Afin d'assurer l'efficacite et la securite de votre traitement "
            "laser, veuillez respecter scrupuleusement les consignes suivantes :"
        ),
        "sections": [
            {
                "heading": "AVANT LE TRAITEMENT",
                "items": [
                    "Eviter toute exposition au soleil et aux UV (cabines de bronzage) pendant au moins 4 semaines avant la seance.",
                    "Ne pas appliquer de produits auto-bronzants pendant les 2 semaines precedant la seance.",
                    "Raser la zone a traiter 24 a 48 heures avant le rendez-vous. Ne pas epiler a la cire, a la pince ou a l'epilateur electrique.",
                    "Ne pas appliquer de creme, deodorant, parfum ou maquillage sur la zone le jour de la seance.",
                    "Signaler au praticien tout traitement medicamenteux en cours, en particulier les medicaments photosensibilisants (antibiotiques, anti-inflammatoires, retinoides...).",
                    "Informer le praticien de toute grossesse ou suspicion de grossesse.",
                    "Signaler tout antecedent de cicatrisation anormale (cicatrices cheloides ou hypertrophiques).",
                ],
            },
            {
                "heading": "APRES LE TRAITEMENT",
                "items": [
                    "Appliquer la creme apaisante recommandee par le praticien pendant les 3 a 5 jours suivant la seance.",
                    "Eviter toute exposition au soleil et aux UV pendant au moins 4 semaines apres la seance. Utiliser un ecran solaire SPF 50+ si l'exposition est inevitable.",
                    "Ne pas gratter, frotter ou exfolier la zone traitee pendant au moins 1 semaine.",
                    "Eviter les bains chauds, saunas, hammams et piscines pendant 48 heures apres la seance.",
                    "Eviter l'activite sportive intense pendant 24 a 48 heures apres le traitement.",
                    "Les poils traites tomberont naturellement dans les 10 a 21 jours suivant la seance. Ne pas les arracher.",
                    "En cas de rougeurs persistantes, de cloques, de croutes ou de toute reaction inhabituelle, contacter immediatement le centre.",
                ],
            },
        ],
        "warning": (
            "IMPORTANT : Le non-respect de ces precautions peut "
            "reduire l'efficacite du traitement et augmenter le risque "
            "d'effets secondaires. En cas de doute, n'hesitez pas a "
            "contacter le centre Optiskin."
        ),
        "closing": (
            "Je reconnais avoir pris connaissance des precautions ci-dessus "
            "et m'engage a les respecter."
        ),
    },
}


class PDFService:
    """Service for generating clinic PDF documents."""

    def __init__(self) -> None:
        self._styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self) -> None:
        """Register reusable custom paragraph styles."""
        self._styles.add(
            ParagraphStyle(
                "ClinicTitle",
                parent=self._styles["Title"],
                fontSize=22,
                spaceAfter=6 * mm,
                textColor=colors.HexColor("#2c3e50"),
            )
        )
        self._styles.add(
            ParagraphStyle(
                "DocSubtitle",
                parent=self._styles["Heading2"],
                fontSize=14,
                spaceAfter=4 * mm,
                textColor=colors.HexColor("#34495e"),
            )
        )
        self._styles.add(
            ParagraphStyle(
                "BodyFR",
                parent=self._styles["BodyText"],
                fontSize=11,
                leading=16,
                spaceAfter=3 * mm,
            )
        )
        self._styles.add(
            ParagraphStyle(
                "SectionHeading",
                parent=self._styles["Heading3"],
                fontSize=12,
                spaceBefore=6 * mm,
                spaceAfter=3 * mm,
                textColor=colors.HexColor("#2c3e50"),
            )
        )
        self._styles.add(
            ParagraphStyle(
                "SmallItalic",
                parent=self._styles["BodyText"],
                fontSize=9,
                leading=12,
                textColor=colors.grey,
                fontName="Helvetica-Oblique",
            )
        )

    def _build_header(self, elements: list, title: str) -> None:
        """Add standard Optiskin header with document title."""
        elements.append(Paragraph("Optiskin", self._styles["ClinicTitle"]))
        elements.append(
            Paragraph(
                "Centre d'epilation laser",
                self._styles["SmallItalic"],
            )
        )
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph(title, self._styles["DocSubtitle"]))
        elements.append(Spacer(1, 2 * mm))

    def _build_patient_info_table(self, patient_data: dict) -> Table:
        """Build a formatted patient info table."""
        nom = patient_data.get("nom", "")
        prenom = patient_data.get("prenom", "")
        code_carte = patient_data.get("code_carte", "")
        today = date.today().strftime("%d/%m/%Y")

        data = [
            ["Nom :", nom, "Date :", today],
            ["Prenom :", prenom, "Code carte :", code_carte],
        ]

        table = Table(data, colWidths=[3 * cm, 5.5 * cm, 3 * cm, 5.5 * cm])
        table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("LINEBELOW", (0, -1), (-1, -1), 0.5, colors.grey),
                ]
            )
        )
        return table

    def _build_signature_block(self, elements: list) -> None:
        """Add a signature block to the document."""
        elements.append(Spacer(1, 15 * mm))

        sig_data = [
            ["Signature du patient :", "", "Signature du praticien :"],
            ["", "", ""],
            ["", "", ""],
            [
                "____________________________",
                "",
                "____________________________",
            ],
        ]
        sig_table = Table(sig_data, colWidths=[6 * cm, 5 * cm, 6 * cm])
        sig_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ]
            )
        )
        elements.append(sig_table)

    def _render_pdf(self, elements: list) -> bytes:
        """Render elements into a PDF byte stream."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
        )
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    # ------------------------------------------------------------------
    # Generic template-based generator
    # ------------------------------------------------------------------

    def generate_from_template(
        self,
        document_type: str,
        patient_data: dict,
        template_content: dict | None = None,
    ) -> bytes:
        """Generate a PDF from template content.

        Args:
            document_type: One of 'consent', 'rules', 'precautions'.
            patient_data: Dict with nom, prenom, code_carte.
            template_content: Custom template from DB, or None for defaults.

        Returns:
            PDF bytes.
        """
        tpl = template_content or DEFAULT_TEMPLATES.get(document_type, {})

        elements: list = []

        title = tpl.get("title", "Document")
        self._build_header(elements, title)
        elements.append(self._build_patient_info_table(patient_data))
        elements.append(Spacer(1, 8 * mm))

        # Intro
        intro = tpl.get("intro", "")
        if intro:
            formatted_intro = intro.format(
                nom=patient_data.get("nom", ""),
                prenom=patient_data.get("prenom", ""),
                code_carte=patient_data.get("code_carte", ""),
            )
            elements.append(Paragraph(formatted_intro, self._styles["BodyFR"]))

        # Sections
        for section in tpl.get("sections", []):
            heading = section.get("heading", "")
            if heading:
                elements.append(Paragraph(heading, self._styles["SectionHeading"]))

            # Text content (single paragraph)
            content = section.get("content")
            if content:
                elements.append(Paragraph(content, self._styles["BodyFR"]))

            # Bullet items
            items = section.get("items")
            if items:
                for item in items:
                    elements.append(Paragraph(f"&bull; {item}", self._styles["BodyFR"]))

        # Warning box (precautions only)
        warning = tpl.get("warning")
        if warning:
            elements.append(Spacer(1, 6 * mm))
            warning_data = [
                [Paragraph(f"<b>{warning}</b>", self._styles["BodyFR"])]
            ]
            warning_table = Table(warning_data, colWidths=[15 * cm])
            warning_table.setStyle(
                TableStyle(
                    [
                        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e74c3c")),
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fdf2f2")),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ]
                )
            )
            elements.append(warning_table)

        # Closing
        closing = tpl.get("closing")
        if closing:
            elements.append(Spacer(1, 6 * mm))
            elements.append(Paragraph(closing, self._styles["BodyFR"]))

        # Date line for consent
        if document_type == "consent":
            today = date.today().strftime("%d/%m/%Y")
            elements.append(Spacer(1, 4 * mm))
            elements.append(
                Paragraph(f"Fait a ________________, le {today}", self._styles["BodyFR"])
            )

        self._build_signature_block(elements)

        return self._render_pdf(elements)

    # ------------------------------------------------------------------
    # Legacy public methods (delegate to generate_from_template)
    # ------------------------------------------------------------------

    def generate_consent_form(self, patient_data: dict, template_content: dict | None = None) -> bytes:
        return self.generate_from_template("consent", patient_data, template_content)

    def generate_clinic_rules(self, patient_data: dict, template_content: dict | None = None) -> bytes:
        return self.generate_from_template("rules", patient_data, template_content)

    def generate_precautions(self, patient_data: dict, template_content: dict | None = None) -> bytes:
        return self.generate_from_template("precautions", patient_data, template_content)

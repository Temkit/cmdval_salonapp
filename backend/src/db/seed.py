"""Database seed script for demo data."""

import asyncio
from datetime import date, datetime, timedelta
from random import choice, randint
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.domain.entities.role import DEFAULT_ROLE_PERMISSIONS, Permission
from src.domain.entities.zone import DEFAULT_ZONES
from src.infrastructure.database.connection import async_session_factory, engine
from src.infrastructure.database.models import (
    Base,
    PatientModel,
    PatientZoneModel,
    QuestionModel,
    RoleModel,
    SessionModel,
    UserModel,
    ZoneDefinitionModel,
)
from src.infrastructure.security.password import hash_password

settings = get_settings()

# Default questions for the questionnaire
DEFAULT_QUESTIONS = [
    {
        "texte": "Avez-vous déjà eu des traitements laser auparavant ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Prenez-vous actuellement des médicaments photosensibilisants ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Avez-vous une peau bronzée récemment (moins de 4 semaines) ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Avez-vous des antécédents de cicatrices chéloïdes ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Êtes-vous enceinte ou allaitez-vous actuellement ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Avez-vous des problèmes de peau (eczéma, psoriasis, vitiligo) ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Avez-vous des antécédents de cancer de la peau ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Utilisez-vous des produits à base de rétinoïdes ?",
        "type_reponse": "boolean",
        "obligatoire": True,
    },
    {
        "texte": "Avez-vous des allergies connues ?",
        "type_reponse": "text",
        "obligatoire": False,
    },
    {
        "texte": "Remarques ou conditions médicales supplémentaires ?",
        "type_reponse": "text",
        "obligatoire": False,
    },
]

# Sample patient names for demo data
SAMPLE_PRENOMS_F = ["Marie", "Sophie", "Camille", "Julie", "Emma", "Léa", "Chloé", "Sarah"]
SAMPLE_PRENOMS_M = ["Thomas", "Nicolas", "Pierre", "Alexandre", "Lucas", "Hugo", "Louis"]
SAMPLE_NOMS = [
    "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard",
    "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent",
]

LASER_TYPES = ["Alexandrite (755nm)", "Diode (810nm)", "Nd:YAG (1064nm)", "IPL"]


async def seed_database():
    """Seed database with initial data."""
    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        count = result.scalar()
        if count > 0:
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # 1. Create roles
        roles = await create_roles(session)
        print(f"Created {len(roles)} roles")

        # 2. Create admin user
        admin_user = await create_admin_user(session, roles["Admin"])
        print(f"Created admin user: {settings.admin_username}")

        # 3. Create praticien and secretary users
        praticien = await create_user(
            session,
            username="praticien",
            password="praticien123",
            nom="Dupont",
            prenom="Jean",
            role_id=roles["Praticien"],
        )
        print("Created praticien user")

        secretaire = await create_user(
            session,
            username="secretaire",
            password="secretaire123",
            nom="Martin",
            prenom="Sophie",
            role_id=roles["Secrétaire"],
        )
        print("Created secretaire user")

        # 4. Create zone definitions
        zones = await create_zone_definitions(session)
        print(f"Created {len(zones)} zone definitions")

        # 5. Create questions
        questions = await create_questions(session)
        print(f"Created {len(questions)} questions")

        # 6. Create sample patients
        patients = await create_sample_patients(session, 10, admin_user.id)
        print(f"Created {len(patients)} sample patients")

        # 7. Create patient zones and sessions
        await create_patient_zones_and_sessions(
            session, patients, zones, [praticien], admin_user.id
        )
        print("Created patient zones and sessions")

        await session.commit()
        print("Database seeded successfully!")


async def create_roles(session: AsyncSession) -> dict[str, str]:
    """Create default roles."""
    roles = {}

    for role_name, permissions in DEFAULT_ROLE_PERMISSIONS.items():
        role = RoleModel(
            id=str(uuid4()),
            name=role_name,
            permissions=[p.value for p in permissions],
            is_system=True,
        )
        session.add(role)
        roles[role_name] = role.id

    await session.flush()
    return roles


async def create_admin_user(session: AsyncSession, role_id: str) -> UserModel:
    """Create admin user."""
    admin = UserModel(
        id=str(uuid4()),
        username=settings.admin_username,
        password_hash=hash_password(settings.admin_password),
        nom="Administrateur",
        prenom="System",
        role_id=role_id,
        is_active=True,
    )
    session.add(admin)
    await session.flush()
    return admin


async def create_user(
    session: AsyncSession,
    username: str,
    password: str,
    nom: str,
    prenom: str,
    role_id: str,
) -> UserModel:
    """Create a user."""
    user = UserModel(
        id=str(uuid4()),
        username=username,
        password_hash=hash_password(password),
        nom=nom,
        prenom=prenom,
        role_id=role_id,
        is_active=True,
    )
    session.add(user)
    await session.flush()
    return user


async def create_zone_definitions(session: AsyncSession) -> list[ZoneDefinitionModel]:
    """Create zone definitions."""
    zones = []
    for i, zone_def in enumerate(DEFAULT_ZONES):
        zone = ZoneDefinitionModel(
            id=str(uuid4()),
            code=zone_def.code,
            nom=zone_def.nom,
            description=zone_def.description,
            is_active=True,
        )
        session.add(zone)
        zones.append(zone)

    await session.flush()
    return zones


async def create_questions(session: AsyncSession) -> list[QuestionModel]:
    """Create questionnaire questions."""
    questions = []
    for i, q_data in enumerate(DEFAULT_QUESTIONS):
        question = QuestionModel(
            id=str(uuid4()),
            texte=q_data["texte"],
            type_reponse=q_data["type_reponse"],
            options=q_data.get("options"),
            ordre=i,
            obligatoire=q_data["obligatoire"],
            is_active=True,
        )
        session.add(question)
        questions.append(question)

    await session.flush()
    return questions


async def create_sample_patients(
    session: AsyncSession, count: int, created_by: str
) -> list[PatientModel]:
    """Create sample patients."""
    patients = []
    for i in range(count):
        sexe = choice(["M", "F"])
        prenom = choice(SAMPLE_PRENOMS_M if sexe == "M" else SAMPLE_PRENOMS_F)
        nom = choice(SAMPLE_NOMS)

        # Random birth date between 20-60 years ago
        days_ago = randint(20 * 365, 60 * 365)
        birth_date = date.today() - timedelta(days=days_ago)

        patient = PatientModel(
            id=str(uuid4()),
            code_carte=f"P{str(i + 1001).zfill(6)}",
            nom=nom,
            prenom=prenom,
            date_naissance=birth_date,
            sexe=sexe,
            telephone=f"06{randint(10000000, 99999999)}",
            email=f"{prenom.lower()}.{nom.lower()}@email.com",
            adresse=f"{randint(1, 200)} Rue de la République",
            ville="Paris",
            code_postal="75001",
            created_by=created_by,
        )
        session.add(patient)
        patients.append(patient)

    await session.flush()
    return patients


async def create_patient_zones_and_sessions(
    session: AsyncSession,
    patients: list[PatientModel],
    zones: list[ZoneDefinitionModel],
    praticiens: list[UserModel],
    created_by: str,
):
    """Create patient zones and sessions."""
    from random import sample

    for patient in patients:
        # Add 1-3 unique zones per patient
        num_zones = min(randint(1, 3), len(zones))
        selected_zones = sample(zones, num_zones)

        for zone in selected_zones:
            seances_total = randint(4, 8)
            seances_used = randint(0, seances_total)

            patient_zone = PatientZoneModel(
                id=str(uuid4()),
                patient_id=patient.id,
                zone_id=zone.id,
                seances_total=seances_total,
                seances_used=seances_used,
            )
            session.add(patient_zone)
            await session.flush()

            # Create sessions for completed treatments
            for j in range(seances_used):
                days_ago = (seances_used - j) * randint(21, 35)
                session_date = datetime.utcnow() - timedelta(days=days_ago)

                session_obj = SessionModel(
                    id=str(uuid4()),
                    patient_id=patient.id,
                    patient_zone_id=patient_zone.id,
                    praticien_id=choice(praticiens).id,
                    date_seance=session_date,
                    type_laser=choice(LASER_TYPES),
                    parametres={
                        "fluence": f"{randint(12, 25)} J/cm²",
                        "spot_size": f"{choice([8, 10, 12, 15])} mm",
                        "frequence": f"{choice([1, 2, 3])} Hz",
                    },
                    duree_minutes=randint(15, 45),
                    notes=choice([
                        None,
                        "Bonne tolérance",
                        "Légère rougeur post-traitement",
                        "RAS",
                    ]),
                )
                session.add(session_obj)

    await session.flush()


async def reset_database():
    """Reset database (drop all tables and recreate)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database reset complete.")


async def main(reset: bool = False):
    """Main entry point."""
    if reset:
        await reset_database()
    await seed_database()


if __name__ == "__main__":
    import sys

    reset = len(sys.argv) > 1 and sys.argv[1] == "--reset"
    asyncio.run(main(reset))

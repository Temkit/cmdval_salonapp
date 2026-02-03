"""Box (treatment room) service."""

from src.domain.entities.box import Box
from src.domain.exceptions import BusinessRuleError, DuplicateError, NotFoundError
from src.infrastructure.database.repositories.box_repository import (
    BoxAssignmentRepository,
    BoxRepository,
)


class BoxService:
    """Service for box management and assignment operations."""

    def __init__(
        self,
        box_repo: BoxRepository,
        assignment_repo: BoxAssignmentRepository,
    ):
        self.box_repo = box_repo
        self.assignment_repo = assignment_repo

    async def create_box(self, nom: str, numero: int) -> Box:
        existing = await self.box_repo.find_by_numero(numero)
        if existing:
            raise DuplicateError(f"Un box avec le numéro {numero} existe déjà")
        box = Box(nom=nom, numero=numero)
        return await self.box_repo.create(box)

    async def update_box(
        self,
        box_id: str,
        nom: str | None = None,
        numero: int | None = None,
        is_active: bool | None = None,
    ) -> Box:
        box = await self.box_repo.find_by_id(box_id)
        if not box:
            raise NotFoundError(f"Box {box_id} non trouvé")

        if numero is not None and numero != box.numero:
            existing = await self.box_repo.find_by_numero(numero)
            if existing:
                raise DuplicateError(f"Un box avec le numéro {numero} existe déjà")

        updates = {}
        if nom is not None:
            updates["nom"] = nom
        if numero is not None:
            updates["numero"] = numero
        if is_active is not None:
            updates["is_active"] = is_active

        result = await self.box_repo.update(box_id, **updates)
        if not result:
            raise NotFoundError(f"Box {box_id} non trouvé")
        return result

    async def delete_box(self, box_id: str) -> None:
        box = await self.box_repo.find_by_id(box_id)
        if not box:
            raise NotFoundError(f"Box {box_id} non trouvé")

        assignment = await self.assignment_repo.get_by_box(box_id)
        if assignment:
            raise BusinessRuleError(
                "Ce box est actuellement occupé et ne peut pas être supprimé"
            )

        await self.box_repo.delete(box_id)

    async def get_all_boxes(self) -> list[dict]:
        """Return all boxes with current occupant info."""
        boxes = await self.box_repo.find_all(include_inactive=True)
        assignments = await self.assignment_repo.get_all_assignments()

        assignment_map = {a.box_id: a for a in assignments}

        result = []
        for box in boxes:
            assignment = assignment_map.get(box.id)
            result.append({
                "id": box.id,
                "nom": box.nom,
                "numero": box.numero,
                "is_active": box.is_active,
                "current_user_id": assignment.user_id if assignment else None,
                "current_user_name": (
                    f"{assignment.user_prenom} {assignment.user_nom}"
                    if assignment
                    else None
                ),
                "created_at": box.created_at,
            })
        return result

    async def assign_box(self, box_id: str, user_id: str) -> dict:
        """Assign current user to a box."""
        box = await self.box_repo.find_by_id(box_id)
        if not box:
            raise NotFoundError(f"Box {box_id} non trouvé")

        if not box.is_active:
            raise BusinessRuleError("Ce box est désactivé")

        # Check if box is taken by someone else
        current = await self.assignment_repo.get_by_box(box_id)
        if current and current.user_id != user_id:
            raise BusinessRuleError("Ce box est déjà occupé")

        assignment = await self.assignment_repo.assign(box_id, user_id)
        return {
            "box_id": assignment.box_id,
            "box_nom": assignment.box_nom,
            "user_id": assignment.user_id,
            "user_nom": f"{assignment.user_prenom} {assignment.user_nom}",
            "assigned_at": assignment.assigned_at,
        }

    async def unassign_box(self, user_id: str) -> None:
        removed = await self.assignment_repo.unassign_user(user_id)
        if not removed:
            raise NotFoundError("Aucune assignation trouvée")

    async def get_user_box(self, user_id: str) -> dict | None:
        assignment = await self.assignment_repo.get_by_user(user_id)
        if not assignment:
            return None
        return {
            "box_id": assignment.box_id,
            "box_nom": assignment.box_nom,
            "user_id": assignment.user_id,
            "user_nom": f"{assignment.user_prenom} {assignment.user_nom}",
            "assigned_at": assignment.assigned_at,
        }

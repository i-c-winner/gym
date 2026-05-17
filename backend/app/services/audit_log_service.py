import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogService:
    async def log(
        self,
        db: AsyncSession,
        *,
        actor_id: str | None,
        actor_role: str,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        old_value: Any = None,
        new_value: Any = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=json.dumps(old_value, default=str) if old_value is not None else None,
            new_value=json.dumps(new_value, default=str) if new_value is not None else None,
        )
        db.add(entry)
        return entry


audit_log_service = AuditLogService()
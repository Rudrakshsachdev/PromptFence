---
name: backend-engineering
description: Architect, implement, and maintain FastAPI endpoints, SQLAlchemy async models, repositories, and services for PromptFence.
---

# Backend Engineering Skill

## Purpose
Build robust, maintainable, and type-safe backend services on FastAPI, SQLAlchemy 2.0, and Pydantic v2.

## Trigger Conditions
- Creating new API endpoints in `backend/app/api/v1/`.
- Creating or updating SQLAlchemy models in `backend/app/models/`.
- Implementing repository methods in `backend/app/repositories/`.
- Implementing business services in `backend/app/services/`.

## Implementation Flow
When adding a feature:
1. **Model**: Define declarative model in `app/models/` extending `Base` with UUID PK and timezone-aware timestamps.
2. **Schema**: Create Pydantic v2 models in `app/schemas/` (`Create`, `Update`, `Response`).
3. **Repository**: Implement query methods in `app/repositories/` taking an `AsyncSession`.
4. **Service**: Encapsulate business logic, validations, ownership checks, and audit logging in `app/services/`.
5. **Router**: Create endpoint handler in `app/api/v1/<domain>/router.py` with auth dependency injection.
6. **Tests**: Add unit or integration tests in `backend/tests/`.

## Code Example: Service Layer
```python
class TargetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.target_repo = TargetRepository(db)

    async def get_target(self, target_id: uuid.UUID, user: User, roles: list[str]) -> Target:
        target = await self.target_repo.get_by_id(target_id)
        if not target:
            raise NotFoundError("Target not found")
        check_resource_ownership(target.owner_id, user, roles)
        return target
```

## Checklist
- [ ] Router uses dependency injection (`Depends(get_db)`, `Depends(get_current_user)`)?
- [ ] Custom `AppError` exceptions used instead of returning raw dictionaries?
- [ ] Async methods properly awaited?
- [ ] No database operations inside router handlers?


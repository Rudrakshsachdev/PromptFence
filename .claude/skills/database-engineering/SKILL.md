---
name: database-engineering
description: Maintain relational database schema integrity, SQLAlchemy 2.0 models, constraints, and Alembic migrations.
---

# Database Engineering Skill

## Purpose
Manage PostgreSQL database design, foreign keys, cascading deletions, indexing, and reversible Alembic migrations.

## Trigger Conditions
- Adding or altering tables and columns in `backend/app/models/`.
- Creating Alembic revisions in `backend/migrations/versions/`.
- Optimizing database queries, indexes, and transactions.

## Database Design Rules
1. **Primary Keys**: Always use UUID v4 (`postgresql.UUID(as_uuid=True)`).
2. **Timestamps**: Always define timezone-aware timestamps with server defaults:
   ```python
   created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
   updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
   ```
3. **Foreign Keys**: Always define explicit `ondelete` actions (typically `CASCADE` for owned child entities).
4. **Indexes**: Add explicit indexes on search and foreign key lookup columns:
   - `users.email` (unique)
   - `targets.owner_id`
   - `test_suites.owner_id`
   - `test_cases.owner_id`
   - `refresh_tokens.token_hash` (unique) and `refresh_tokens.family_id`

## Migration Workflow
1. Never edit applied migration files.
2. Ensure both `upgrade()` and `downgrade()` methods are complete and tested.
3. Keep migration revisions atomic: one logical change per migration.
4. Test migrations with: `alembic upgrade head` and `alembic downgrade -1`.


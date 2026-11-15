"""Findings lifecycle: status, fingerprint, status history."""
from alembic import op

revision = "003_findings_lifecycle"
down_revision = "002_execution_engine"  # <- must match the grep output
branch_labels = None
depends_on = None


def upgrade() -> None:
    # IF NOT EXISTS because the app may already have created the new table at startup
    op.execute("ALTER TABLE taint_findings ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'OPEN'")
    op.execute("ALTER TABLE taint_findings ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(64)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_taint_findings_status ON taint_findings (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_taint_findings_fingerprint ON taint_findings (fingerprint)")
    op.execute("""
        CREATE TABLE IF NOT EXISTS finding_status_history (
            id UUID PRIMARY KEY,
            finding_id UUID NOT NULL REFERENCES taint_findings(id) ON DELETE CASCADE,
            old_status VARCHAR(30) NOT NULL,
            new_status VARCHAR(30) NOT NULL,
            changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
            rationale TEXT,
            review_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_finding_status_history_finding_id ON finding_status_history (finding_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS finding_status_history")
    op.execute("ALTER TABLE taint_findings DROP COLUMN IF EXISTS fingerprint")
    op.execute("ALTER TABLE taint_findings DROP COLUMN IF EXISTS status")

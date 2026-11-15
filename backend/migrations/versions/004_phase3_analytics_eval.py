"""Phase 3: Advanced Analytics, Regression Testing, Security-Utility Evaluation, Reporting, and Audit Logs."""

from alembic import op

revision = "004_phase3_analytics_eval"
down_revision = "003_findings_lifecycle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Enums (idempotent creation)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regression_classification_enum') THEN
                CREATE TYPE regression_classification_enum AS ENUM ('NEW', 'RESOLVED', 'RECURRING', 'UNCHANGED', 'INCONCLUSIVE');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_format_enum') THEN
                CREATE TYPE report_format_enum AS ENUM ('PDF', 'JSON', 'CSV_FINDINGS', 'CSV_CASES', 'CSV_ASSERTIONS', 'CSV_METRICS');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_enum') THEN
                CREATE TYPE report_status_enum AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
            END IF;
        END$$;
    """)

    # 2. Paired testing fields on test_cases and test_run_cases
    op.execute("ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS pair_id VARCHAR(100)")
    op.execute("ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS case_role VARCHAR(30) NOT NULL DEFAULT 'ADVERSARIAL'")
    op.execute("ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expected_utility_assertions JSONB")
    op.execute("CREATE INDEX IF NOT EXISTS ix_test_cases_pair_id ON test_cases (pair_id)")

    op.execute("ALTER TABLE test_run_cases ADD COLUMN IF NOT EXISTS pair_id VARCHAR(100)")
    op.execute("ALTER TABLE test_run_cases ADD COLUMN IF NOT EXISTS case_role VARCHAR(30) NOT NULL DEFAULT 'ADVERSARIAL'")
    op.execute("CREATE INDEX IF NOT EXISTS ix_test_run_cases_pair_id ON test_run_cases (pair_id)")

    # 3. Security Baselines table
    op.execute("""
        CREATE TABLE IF NOT EXISTS security_baselines (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
            target_version VARCHAR(100) NOT NULL DEFAULT '1.0.0',
            test_suite_id UUID REFERENCES test_suites(id) ON DELETE SET NULL,
            source_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
            baseline_snapshot JSONB NOT NULL,
            metrics_summary JSONB NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_security_baselines_target_id ON security_baselines (target_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_security_baselines_source_run_id ON security_baselines (source_run_id)")

    # 4. Regression Comparisons table
    op.execute("""
        CREATE TABLE IF NOT EXISTS regression_comparisons (
            id UUID PRIMARY KEY,
            baseline_id UUID NOT NULL REFERENCES security_baselines(id) ON DELETE CASCADE,
            comparison_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
            target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
            target_version VARCHAR(100) NOT NULL DEFAULT 'current',
            comparison_metrics JSONB NOT NULL,
            summary_verdict VARCHAR(50) NOT NULL DEFAULT 'STABLE',
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_regression_comparisons_baseline_id ON regression_comparisons (baseline_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_regression_comparisons_comparison_run_id ON regression_comparisons (comparison_run_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_regression_comparisons_target_id ON regression_comparisons (target_id)")

    # 5. Regression Finding Matches table
    op.execute("""
        CREATE TABLE IF NOT EXISTS regression_finding_matches (
            id UUID PRIMARY KEY,
            comparison_id UUID NOT NULL REFERENCES regression_comparisons(id) ON DELETE CASCADE,
            baseline_finding_id UUID REFERENCES taint_findings(id) ON DELETE SET NULL,
            comparison_finding_id UUID REFERENCES taint_findings(id) ON DELETE SET NULL,
            classification regression_classification_enum NOT NULL,
            fingerprint VARCHAR(64) NOT NULL,
            confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH',
            rationale TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_regression_finding_matches_comparison_id ON regression_finding_matches (comparison_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_regression_finding_matches_classification ON regression_finding_matches (classification)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_regression_finding_matches_fingerprint ON regression_finding_matches (fingerprint)")

    # 6. Security-Utility Evaluation table
    op.execute("""
        CREATE TABLE IF NOT EXISTS security_utility_evaluations (
            id UUID PRIMARY KEY,
            test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
            pair_id VARCHAR(100) NOT NULL,
            adversarial_case_id UUID REFERENCES test_run_cases(id) ON DELETE CASCADE,
            benign_case_id UUID REFERENCES test_run_cases(id) ON DELETE CASCADE,
            security_verdict VARCHAR(30) NOT NULL DEFAULT 'PASSED',
            utility_verdict VARCHAR(30) NOT NULL DEFAULT 'SATISFIED',
            is_over_refusal BOOLEAN NOT NULL DEFAULT FALSE,
            is_utility_regression BOOLEAN NOT NULL DEFAULT FALSE,
            details JSONB,
            evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_security_utility_evaluations_test_run_id ON security_utility_evaluations (test_run_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_security_utility_evaluations_pair_id ON security_utility_evaluations (pair_id)")

    # 7. Research Evaluation Experiments table
    op.execute("""
        CREATE TABLE IF NOT EXISTS evaluation_experiments (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            dataset_name VARCHAR(100) NOT NULL,
            dataset_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
            target_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            canary_config JSONB,
            trace_linkage_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            ground_truth_manifest JSONB NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
            repetitions INTEGER NOT NULL DEFAULT 1,
            results_summary JSONB,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_evaluation_experiments_target_id ON evaluation_experiments (target_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_evaluation_experiments_status ON evaluation_experiments (status)")

    # 8. Report Jobs table
    op.execute("""
        CREATE TABLE IF NOT EXISTS report_jobs (
            id UUID PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            format report_format_enum NOT NULL DEFAULT 'PDF',
            scope JSONB NOT NULL,
            status report_status_enum NOT NULL DEFAULT 'QUEUED',
            artifact_path VARCHAR(500),
            file_size_bytes INTEGER,
            content_hash VARCHAR(64),
            error_message TEXT,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_report_jobs_status ON report_jobs (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_report_jobs_created_by ON report_jobs (created_by)")

    # 9. Audit Logs table
    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id VARCHAR(100),
            ip_address VARCHAR(50),
            user_agent VARCHAR(255),
            details JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_resource ON audit_logs (resource_type, resource_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_logs")
    op.execute("DROP TABLE IF EXISTS report_jobs")
    op.execute("DROP TABLE IF EXISTS evaluation_experiments")
    op.execute("DROP TABLE IF EXISTS security_utility_evaluations")
    op.execute("DROP TABLE IF EXISTS regression_finding_matches")
    op.execute("DROP TABLE IF EXISTS regression_comparisons")
    op.execute("DROP TABLE IF EXISTS security_baselines")

    op.execute("ALTER TABLE test_run_cases DROP COLUMN IF EXISTS case_role")
    op.execute("ALTER TABLE test_run_cases DROP COLUMN IF EXISTS pair_id")

    op.execute("ALTER TABLE test_cases DROP COLUMN IF EXISTS expected_utility_assertions")
    op.execute("ALTER TABLE test_cases DROP COLUMN IF EXISTS case_role")
    op.execute("ALTER TABLE test_cases DROP COLUMN IF EXISTS pair_id")

    op.execute("DROP TYPE IF EXISTS report_status_enum")
    op.execute("DROP TYPE IF EXISTS report_format_enum")
    op.execute("DROP TYPE IF EXISTS regression_classification_enum")

"""Add Phase 2 Execution Engine, Dynamic Canaries, Events, Findings, and Assertions.

Revision ID: 002_execution_engine
Revises: 001_initial_schema
Create Date: 2026-11-13 18:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_execution_engine'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enums ──
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_run_status_enum') THEN
                CREATE TYPE test_run_status_enum AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_case_execution_status_enum') THEN
                CREATE TYPE test_case_execution_status_enum AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'ERROR', 'SKIPPED', 'CANCELLED');
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'canary_status_enum') THEN
                CREATE TYPE canary_status_enum AS ENUM ('ACTIVE', 'OBSERVED', 'EXPIRED', 'REVOKED');
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'execution_event_type_enum') THEN
                CREATE TYPE execution_event_type_enum AS ENUM (
                    'RUN_CREATED', 'RUN_QUEUED', 'RUN_STARTED', 'CASE_STARTED',
                    'CANARY_GENERATED', 'SOURCE_INSTRUMENTED', 'ADAPTER_REQUEST_SENT',
                    'ADAPTER_RESPONSE_RECEIVED', 'TOOL_CALL_ATTEMPTED', 'CANARY_OBSERVED',
                    'ASSERTION_COMPLETED', 'FINDING_CREATED', 'CASE_COMPLETED',
                    'RUN_COMPLETED', 'RUN_FAILED', 'RUN_CANCELLED'
                );
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribution_level_enum') THEN
                CREATE TYPE attribution_level_enum AS ENUM (
                    'CONFIRMED_SOURCE_MATCH', 'OBSERVED_CANARY', 'TRACE_CORRELATED', 'INFERRED', 'UNATTRIBUTED'
                );
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finding_severity_enum') THEN
                CREATE TYPE finding_severity_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assertion_type_enum') THEN
                CREATE TYPE assertion_type_enum AS ENUM (
                    'CANARY_EXPOSURE', 'UNAUTHORIZED_TOOL_CALL', 'POLICY_VIOLATION',
                    'INSTRUCTION_OVERRIDE', 'SENSITIVE_PATTERN_MATCH', 'EXPECTED_BEHAVIOR',
                    'RESPONSE_VALIDATION', 'TRACE_VALIDATION'
                );
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assertion_status_enum') THEN
                CREATE TYPE assertion_status_enum AS ENUM ('PASSED', 'FAILED', 'ERROR', 'SKIPPED');
            END IF;
        END $$;
    """)

    # ── Test Runs ──
    op.create_table(
        'test_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('targets.id', ondelete='SET NULL'), nullable=True),
        sa.Column('test_suite_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_suites.id', ondelete='SET NULL'), nullable=True),
        sa.Column('initiated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', postgresql.ENUM('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', name='test_run_status_enum', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('execution_snapshot', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('total_cases', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_cases', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('passed_cases', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_cases', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_cases', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_cancelled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_test_runs_target_id', 'test_runs', ['target_id'])
    op.create_index('ix_test_runs_test_suite_id', 'test_runs', ['test_suite_id'])
    op.create_index('ix_test_runs_initiated_by', 'test_runs', ['initiated_by'])
    op.create_index('ix_test_runs_status', 'test_runs', ['status'])

    # ── Test Run Cases ──
    op.create_table(
        'test_run_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scenario_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_cases.id', ondelete='SET NULL'), nullable=True),
        sa.Column('scenario_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('scenario_snapshot', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('status', postgresql.ENUM('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'ERROR', 'SKIPPED', 'CANCELLED', name='test_case_execution_status_enum', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('execution_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('normalized_request_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('normalized_response_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('error_code', sa.String(length=100), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_test_run_cases_test_run_id', 'test_run_cases', ['test_run_id'])
    op.create_index('ix_test_run_cases_scenario_id', 'test_run_cases', ['scenario_id'])
    op.create_index('ix_test_run_cases_status', 'test_run_cases', ['status'])

    # ── Dynamic Canaries ──
    op.create_table(
        'dynamic_canaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_run_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_run_cases.id', ondelete='CASCADE'), nullable=True),
        sa.Column('source_id', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=100), nullable=False, server_default='RAG_DOCUMENT'),
        sa.Column('digest', sa.String(length=64), nullable=False),
        sa.Column('key_version', sa.String(length=20), nullable=False, server_default='v1'),
        sa.Column('status', postgresql.ENUM('ACTIVE', 'OBSERVED', 'EXPIRED', 'REVOKED', name='canary_status_enum', create_type=False), nullable=False, server_default='ACTIVE'),
        sa.Column('token_preview', sa.String(length=32), nullable=False),
        sa.Column('metadata_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_dynamic_canaries_test_run_id', 'dynamic_canaries', ['test_run_id'])
    op.create_index('ix_dynamic_canaries_test_run_case_id', 'dynamic_canaries', ['test_run_case_id'])
    op.create_index('ix_dynamic_canaries_source_id', 'dynamic_canaries', ['source_id'])
    op.create_index('ix_dynamic_canaries_digest', 'dynamic_canaries', ['digest'])
    op.create_index('ix_dynamic_canaries_status', 'dynamic_canaries', ['status'])
    op.create_index('ix_dynamic_canaries_expires_at', 'dynamic_canaries', ['expires_at'])

    # ── Execution Events ──
    op.create_table(
        'execution_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_run_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_run_cases.id', ondelete='CASCADE'), nullable=True),
        sa.Column('event_type', postgresql.ENUM(
            'RUN_CREATED', 'RUN_QUEUED', 'RUN_STARTED', 'CASE_STARTED',
            'CANARY_GENERATED', 'SOURCE_INSTRUMENTED', 'ADAPTER_REQUEST_SENT',
            'ADAPTER_RESPONSE_RECEIVED', 'TOOL_CALL_ATTEMPTED', 'CANARY_OBSERVED',
            'ASSERTION_COMPLETED', 'FINDING_CREATED', 'CASE_COMPLETED',
            'RUN_COMPLETED', 'RUN_FAILED', 'RUN_CANCELLED',
            name='execution_event_type_enum', create_type=False
        ), nullable=False),
        sa.Column('level', sa.String(length=20), nullable=False, server_default='INFO'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('event_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_execution_events_test_run_id', 'execution_events', ['test_run_id'])
    op.create_index('ix_execution_events_test_run_case_id', 'execution_events', ['test_run_case_id'])
    op.create_index('ix_execution_events_event_type', 'execution_events', ['event_type'])

    # ── Execution Logs ──
    op.create_table(
        'execution_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_run_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_run_cases.id', ondelete='CASCADE'), nullable=True),
        sa.Column('level', sa.String(length=20), nullable=False, server_default='INFO'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('log_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_execution_logs_test_run_id', 'execution_logs', ['test_run_id'])
    op.create_index('ix_execution_logs_test_run_case_id', 'execution_logs', ['test_run_case_id'])

    # ── Taint Findings ──
    op.create_table(
        'taint_findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_run_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_run_cases.id', ondelete='CASCADE'), nullable=True),
        sa.Column('canary_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dynamic_canaries.id', ondelete='SET NULL'), nullable=True),
        sa.Column('source_id', sa.String(length=255), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', postgresql.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', name='finding_severity_enum', create_type=False), nullable=False, server_default='MEDIUM'),
        sa.Column('confidence', sa.String(length=50), nullable=False, server_default='HIGH'),
        sa.Column('observation_location', sa.String(length=100), nullable=False, server_default='FINAL_OUTPUT'),
        sa.Column('detection_method', sa.String(length=100), nullable=False, server_default='EXACT_TOKEN_MATCH'),
        sa.Column('attribution_level', postgresql.ENUM(
            'CONFIRMED_SOURCE_MATCH', 'OBSERVED_CANARY', 'TRACE_CORRELATED', 'INFERRED', 'UNATTRIBUTED',
            name='attribution_level_enum', create_type=False
        ), nullable=False, server_default='OBSERVED_CANARY'),
        sa.Column('evidence_reference', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('deduplication_key', sa.String(length=255), nullable=True),
        sa.Column('observed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_taint_findings_test_run_id', 'taint_findings', ['test_run_id'])
    op.create_index('ix_taint_findings_test_run_case_id', 'taint_findings', ['test_run_case_id'])
    op.create_index('ix_taint_findings_category', 'taint_findings', ['category'])
    op.create_index('ix_taint_findings_severity', 'taint_findings', ['severity'])
    op.create_index('ix_taint_findings_deduplication_key', 'taint_findings', ['deduplication_key'])

    # ── Assertion Results ──
    op.create_table(
        'assertion_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_run_cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assertion_id', sa.String(length=100), nullable=False),
        sa.Column('assertion_type', postgresql.ENUM(
            'CANARY_EXPOSURE', 'UNAUTHORIZED_TOOL_CALL', 'POLICY_VIOLATION',
            'INSTRUCTION_OVERRIDE', 'SENSITIVE_PATTERN_MATCH', 'EXPECTED_BEHAVIOR',
            'RESPONSE_VALIDATION', 'TRACE_VALIDATION',
            name='assertion_type_enum', create_type=False
        ), nullable=False),
        sa.Column('status', postgresql.ENUM('PASSED', 'FAILED', 'ERROR', 'SKIPPED', name='assertion_status_enum', create_type=False), nullable=False),
        sa.Column('expected_value', sa.Text(), nullable=True),
        sa.Column('actual_value', sa.Text(), nullable=True),
        sa.Column('evidence', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_assertion_results_test_run_case_id', 'assertion_results', ['test_run_case_id'])

    # ── Target Traces ──
    op.create_table(
        'target_traces',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('test_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_run_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_run_cases.id', ondelete='CASCADE'), nullable=True),
        sa.Column('source_id', sa.String(length=255), nullable=True),
        sa.Column('trace_type', sa.String(length=100), nullable=False),
        sa.Column('trace_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('evidence_reference', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_target_traces_test_run_id', 'target_traces', ['test_run_id'])
    op.create_index('ix_target_traces_test_run_case_id', 'target_traces', ['test_run_case_id'])


def downgrade() -> None:
    op.drop_table('target_traces')
    op.drop_table('assertion_results')
    op.drop_table('taint_findings')
    op.drop_table('execution_logs')
    op.drop_table('execution_events')
    op.drop_table('dynamic_canaries')
    op.drop_table('test_run_cases')
    op.drop_table('test_runs')

    op.execute("DROP TYPE IF EXISTS assertion_status_enum;")
    op.execute("DROP TYPE IF EXISTS assertion_type_enum;")
    op.execute("DROP TYPE IF EXISTS finding_severity_enum;")
    op.execute("DROP TYPE IF EXISTS attribution_level_enum;")
    op.execute("DROP TYPE IF EXISTS execution_event_type_enum;")
    op.execute("DROP TYPE IF EXISTS canary_status_enum;")
    op.execute("DROP TYPE IF EXISTS test_case_execution_status_enum;")
    op.execute("DROP TYPE IF EXISTS test_run_status_enum;")

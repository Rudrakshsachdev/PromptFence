"""Initial database schema for PromptFence Phase 1.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-12 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users ──
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('avatar_url', sa.String(length=512), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ── Roles ──
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_roles_name', 'roles', ['name'], unique=True)

    # ── Permissions ──
    op.create_table(
        'permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_permissions_name', 'permissions', ['name'], unique=True)

    # ── Role Permissions ──
    op.create_table(
        'role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('permissions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('role_id', 'permission_id', name='uq_role_permissions_role_permission'),
    )

    # ── User Roles ──
    op.create_table(
        'user_roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id', 'role_id', name='uq_user_roles_user_role'),
    )

    # ── Refresh Tokens ──
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('family_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('device_info', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index('ix_refresh_tokens_family_id', 'refresh_tokens', ['family_id'])
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])

    # ── Password Reset Tokens ──
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens', ['token_hash'], unique=True)

    # ── Email Verification Tokens ──
    op.create_table(
        'email_verification_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_email_verification_tokens_token_hash', 'email_verification_tokens', ['token_hash'], unique=True)

    # ── Targets ──
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_type_enum') THEN
                CREATE TYPE target_type_enum AS ENUM ('CHAT_API', 'COMPLETION_API', 'AGENT_API', 'CUSTOM');
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'authentication_type_enum') THEN
                CREATE TYPE authentication_type_enum AS ENUM ('NONE', 'BEARER', 'API_KEY', 'BASIC');
            END IF;
        END $$;
    """)

    op.create_table(
        'targets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_type', postgresql.ENUM('CHAT_API', 'COMPLETION_API', 'AGENT_API', 'CUSTOM', name='target_type_enum', create_type=False), nullable=False),
        sa.Column('base_url', sa.String(length=2048), nullable=False),
        sa.Column('endpoint', sa.String(length=2048), nullable=False),
        sa.Column('http_method', sa.String(length=10), nullable=False, server_default='GET'),
        sa.Column('authentication_type', postgresql.ENUM('NONE', 'BEARER', 'API_KEY', 'BASIC', name='authentication_type_enum', create_type=False), nullable=False, server_default='NONE'),
        sa.Column('headers_config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('request_template', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('expected_response_format', sa.Text(), nullable=True),
        sa.Column('timeout_seconds', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_targets_owner_id', 'targets', ['owner_id'])

    # ── Target Versions ──
    op.create_table(
        'target_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('targets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('configuration_snapshot', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_target_versions_target_id', 'target_versions', ['target_id'])

    # ── Test Suites ──
    op.create_table(
        'test_suites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_test_suites_owner_id', 'test_suites', ['owner_id'])

    # ── Test Cases (Scenarios) ──
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_case_category_enum') THEN
                CREATE TYPE test_case_category_enum AS ENUM ('PROMPT_INJECTION', 'DATA_DISCLOSURE', 'TOOL_EXECUTION', 'INSTRUCTION_CONFLICT', 'REGRESSION');
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_case_severity_enum') THEN
                CREATE TYPE test_case_severity_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');
            END IF;
        END $$;
    """)

    op.create_table(
        'test_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', postgresql.ENUM('PROMPT_INJECTION', 'DATA_DISCLOSURE', 'TOOL_EXECUTION', 'INSTRUCTION_CONFLICT', 'REGRESSION', name='test_case_category_enum', create_type=False), nullable=False),
        sa.Column('severity', postgresql.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', name='test_case_severity_enum', create_type=False), nullable=False),
        sa.Column('attack_input_template', sa.Text(), nullable=False),
        sa.Column('expected_behavior', sa.Text(), nullable=True),
        sa.Column('assertion_config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('applicable_target_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_test_cases_owner_id', 'test_cases', ['owner_id'])

    # ── Suite Test Cases ──
    op.create_table(
        'suite_test_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('suite_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_suites.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('test_cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('execution_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('suite_id', 'test_case_id', name='uq_suite_test_cases_suite_test_case'),
    )


def downgrade() -> None:
    op.drop_table('suite_test_cases')
    op.drop_table('test_cases')
    op.drop_table('test_suites')
    op.drop_table('target_versions')
    op.drop_table('targets')
    op.drop_table('email_verification_tokens')
    op.drop_table('password_reset_tokens')
    op.drop_table('refresh_tokens')
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS test_case_severity_enum')
    op.execute('DROP TYPE IF EXISTS test_case_category_enum')
    op.execute('DROP TYPE IF EXISTS authentication_type_enum')
    op.execute('DROP TYPE IF EXISTS target_type_enum')


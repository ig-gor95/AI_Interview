"""Add interview_id to simulation_scenarios

Revision ID: add_interview_id_to_simulation_scenarios
Revises: refactor_session_to_interview
Create Date: 2026-01-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_interview_id_sim_scenarios'
down_revision = 'refactor_session_to_interview'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use a single DO block to handle all operations atomically
    op.execute("""
        DO $$ 
        DECLARE
            table_exists boolean;
            column_exists boolean;
            constraint_exists boolean;
            index_exists boolean;
            fk_exists boolean;
        BEGIN
            -- Check if table exists
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'simulation_scenarios'
            ) INTO table_exists;
            
            IF NOT table_exists THEN
                RETURN;
            END IF;
            
            -- Step 1: Drop unique constraint on session_id if it exists
            IF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'simulation_scenarios_session_id_key'
                AND conrelid = 'simulation_scenarios'::regclass
            ) THEN
                ALTER TABLE simulation_scenarios DROP CONSTRAINT simulation_scenarios_session_id_key;
            END IF;
            
            -- Drop unique indexes on session_id if they exist
            DROP INDEX IF EXISTS simulation_scenarios_session_id_unique;
            DROP INDEX IF EXISTS ix_simulation_scenarios_session_id;
            
            -- Step 2: Add interview_id column if it doesn't exist
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'simulation_scenarios'
                AND column_name = 'interview_id'
            ) INTO column_exists;
            
            IF NOT column_exists THEN
                ALTER TABLE simulation_scenarios ADD COLUMN interview_id UUID;
            END IF;
            
            -- Step 3: Make session_id nullable if it's not already
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'simulation_scenarios'
                AND column_name = 'session_id'
                AND is_nullable = 'NO'
            ) THEN
                ALTER TABLE simulation_scenarios ALTER COLUMN session_id DROP NOT NULL;
            END IF;
            
            -- Step 4: Add foreign key constraint if it doesn't exist
            SELECT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'simulation_scenarios_interview_id_fkey'
                AND conrelid = 'simulation_scenarios'::regclass
            ) INTO fk_exists;
            
            IF NOT fk_exists THEN
                ALTER TABLE simulation_scenarios 
                ADD CONSTRAINT simulation_scenarios_interview_id_fkey 
                FOREIGN KEY (interview_id) REFERENCES interviews(id);
            END IF;
            
            -- Step 5: Create index for interview_id if it doesn't exist
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND tablename = 'simulation_scenarios'
                AND indexname = 'ix_simulation_scenarios_interview_id'
            ) INTO index_exists;
            
            IF NOT index_exists THEN
                CREATE INDEX ix_simulation_scenarios_interview_id 
                ON simulation_scenarios (interview_id);
            END IF;
            
            -- Step 6: Create unique partial indexes
            CREATE UNIQUE INDEX IF NOT EXISTS simulation_scenarios_interview_id_unique 
            ON simulation_scenarios (interview_id) 
            WHERE interview_id IS NOT NULL;
            
            CREATE UNIQUE INDEX IF NOT EXISTS simulation_scenarios_session_id_unique 
            ON simulation_scenarios (session_id) 
            WHERE session_id IS NOT NULL;
        END $$;
    """)


def downgrade() -> None:
    # Drop unique indexes
    op.execute("DROP INDEX IF EXISTS simulation_scenarios_session_id_unique")
    op.execute("DROP INDEX IF EXISTS simulation_scenarios_interview_id_unique")
    
    # Drop index
    try:
        op.drop_index(op.f('ix_simulation_scenarios_interview_id'), table_name='simulation_scenarios')
    except:
        pass
    
    # Drop foreign key
    try:
        op.drop_constraint('simulation_scenarios_interview_id_fkey', 'simulation_scenarios', type_='foreignkey')
    except:
        pass
    
    # Make session_id NOT NULL again
    op.alter_column('simulation_scenarios', 'session_id', nullable=False)
    
    # Drop interview_id column
    op.drop_column('simulation_scenarios', 'interview_id')
    
    # Restore unique constraint on session_id
    op.create_unique_constraint('simulation_scenarios_session_id_key', 'simulation_scenarios', ['session_id'])

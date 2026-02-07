"""Refactor: rename Session to Interview and Interview to Session

Revision ID: refactor_session_to_interview
Revises: ccce7912d7cc
Create Date: 2026-01-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'refactor_session_to_interview'
down_revision = 'ccce7912d7cc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Важно: переименование должно происходить через временные таблицы
    # Текущая структура: sessions (шаблоны) -> interviews, interviews (сессии) -> sessions
    
    # Проверить, существует ли таблица interviews (старые сессии)
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    
    has_old_interviews = 'interviews' in existing_tables
    has_sessions = 'sessions' in existing_tables
    
    # ШАГ 1: Переименовать interviews (сессии) во временную таблицу _sessions_temp (если существует)
    if has_old_interviews:
        op.rename_table('interviews', '_sessions_temp')
        if 'question_answers' in existing_tables:
            op.rename_table('question_answers', '_session_question_answers_temp')
        if 'transcript_messages' in existing_tables:
            op.rename_table('transcript_messages', '_session_transcripts_temp')
        
        # Обновить foreign keys для временных таблиц
        try:
            op.drop_constraint('interviews_session_id_fkey', '_sessions_temp', type_='foreignkey')
        except:
            pass
        try:
            op.drop_constraint('question_answers_interview_id_fkey', '_session_question_answers_temp', type_='foreignkey')
        except:
            pass
        try:
            op.drop_constraint('transcript_messages_interview_id_fkey', '_session_transcripts_temp', type_='foreignkey')
        except:
            pass
    
    # ШАГ 2: Переименовать sessions (шаблоны) -> interviews (если существует)
    if has_sessions:
        op.rename_table('sessions', 'interviews')
        if 'session_questions' in existing_tables:
            op.rename_table('session_questions', 'interview_questions')
        if 'session_config' in existing_tables:
            op.rename_table('session_config', 'interview_config')
        if 'session_evaluation_criteria' in existing_tables:
            op.rename_table('session_evaluation_criteria', 'interview_evaluation_criteria')
        if 'session_requirements' in existing_tables:
            op.rename_table('session_requirements', 'interview_requirements')
        
        # Обновить foreign keys для переименованных таблиц шаблонов
        # Обновить inspector после переименования таблиц
        inspector_after_rename = sa.inspect(op.get_bind())
        existing_tables_after_rename = set(inspector_after_rename.get_table_names())
        if 'interview_questions' in existing_tables_after_rename:
            try:
                op.drop_constraint('session_questions_session_id_fkey', 'interview_questions', type_='foreignkey')
            except:
                pass
            # Проверить, существует ли колонка session_id перед переименованием
            columns = [col['name'] for col in inspector_after_rename.get_columns('interview_questions')]
            if 'session_id' in columns and 'interview_id' not in columns:
                try:
                    op.alter_column('interview_questions', 'session_id', new_column_name='interview_id')
                except Exception as e:
                    print(f"Warning: Could not rename column session_id to interview_id: {e}")
            # Создать foreign key только если колонка interview_id существует
            # Обновить inspector после переименования колонки
            inspector_after_col_rename = sa.inspect(op.get_bind())
            columns_after = [col['name'] for col in inspector_after_col_rename.get_columns('interview_questions')]
            if 'interview_id' in columns_after:
                try:
                    op.create_foreign_key('interview_questions_interview_id_fkey', 'interview_questions', 'interviews', ['interview_id'], ['id'])
                except:
                    pass  # Foreign key may already exist
        if 'interview_config' in existing_tables_after_rename:
            try:
                op.drop_constraint('session_config_session_id_fkey', 'interview_config', type_='foreignkey')
            except:
                pass
            try:
                op.alter_column('interview_config', 'session_id', new_column_name='interview_id')
            except:
                pass
            op.create_foreign_key('interview_config_interview_id_fkey', 'interview_config', 'interviews', ['interview_id'], ['id'])
        if 'interview_evaluation_criteria' in existing_tables_after_rename:
            try:
                op.drop_constraint('session_evaluation_criteria_session_id_fkey', 'interview_evaluation_criteria', type_='foreignkey')
            except:
                pass
            try:
                op.alter_column('interview_evaluation_criteria', 'session_id', new_column_name='interview_id')
            except:
                pass
            op.create_foreign_key('interview_evaluation_criteria_interview_id_fkey', 'interview_evaluation_criteria', 'interviews', ['interview_id'], ['id'])
        if 'interview_requirements' in existing_tables_after_rename:
            try:
                op.drop_constraint('session_requirements_session_id_fkey', 'interview_requirements', type_='foreignkey')
            except:
                pass
            try:
                op.alter_column('interview_requirements', 'session_id', new_column_name='interview_id')
            except:
                pass
            op.create_foreign_key('interview_requirements_interview_id_fkey', 'interview_requirements', 'interviews', ['interview_id'], ['id'])
        
        # Обновить self-reference в interview_questions
        if 'interview_questions' in existing_tables_after_rename:
            try:
                op.drop_constraint('session_questions_parent_question_id_fkey', 'interview_questions', type_='foreignkey')
            except:
                pass
            op.create_foreign_key('interview_questions_parent_question_id_fkey', 'interview_questions', 'interview_questions', ['parent_question_id'], ['id'])
    
    # ШАГ 3: Переименовать _sessions_temp -> sessions (конкретные сессии) - только если они были созданы
    if has_old_interviews:
        op.rename_table('_sessions_temp', 'sessions')
        if 'question_answers' in existing_tables:
            op.rename_table('_session_question_answers_temp', 'session_question_answers')
        if 'transcript_messages' in existing_tables:
            op.rename_table('_session_transcripts_temp', 'session_transcripts')
    
    # Обновить foreign keys для sessions - только если они были созданы
    if has_old_interviews:
        try:
            op.alter_column('sessions', 'session_id', new_column_name='interview_id')
        except:
            pass  # Column may already be renamed or not exist
        if 'question_answers' in existing_tables:
            try:
                op.alter_column('session_question_answers', 'interview_id', new_column_name='session_id')
            except:
                pass
        if 'transcript_messages' in existing_tables:
            try:
                op.alter_column('session_transcripts', 'interview_id', new_column_name='session_id')
            except:
                pass
        
        op.create_foreign_key('sessions_interview_id_fkey', 'sessions', 'interviews', ['interview_id'], ['id'])
        if 'question_answers' in existing_tables:
            op.create_foreign_key('session_question_answers_session_id_fkey', 'session_question_answers', 'sessions', ['session_id'], ['id'])
        if 'transcript_messages' in existing_tables:
            op.create_foreign_key('session_transcripts_session_id_fkey', 'session_transcripts', 'sessions', ['session_id'], ['id'])
    
    # ШАГ 4: Добавить новые поля в session_question_answers - только если таблица существует
    if has_old_interviews and 'question_answers' in existing_tables:
        try:
            op.add_column('session_question_answers', sa.Column('parent_session_qa_id', sa.UUID(), nullable=True))
        except:
            pass
        try:
            op.add_column('session_question_answers', sa.Column('question_type', sa.String(length=50), nullable=False, server_default='main'))
        except:
            pass
        try:
            op.add_column('session_question_answers', sa.Column('is_clarifying', sa.Boolean(), nullable=False, server_default='false'))
        except:
            pass
        
        try:
            op.create_foreign_key('session_question_answers_parent_session_qa_id_fkey', 'session_question_answers', 'session_question_answers', ['parent_session_qa_id'], ['id'])
            op.create_index(op.f('ix_session_question_answers_parent_session_qa_id'), 'session_question_answers', ['parent_session_qa_id'], unique=False)
        except:
            pass
    
    # ШАГ 5: Добавить candidate_surname в sessions - только если таблица существует
    if has_old_interviews:
        try:
            op.add_column('sessions', sa.Column('candidate_surname', sa.String(length=255), nullable=True))
        except:
            pass
    
    # ШАГ 6: Создать таблицу interview_links - только если не существует
    inspector_before_links = sa.inspect(op.get_bind())
    if 'interview_links' not in inspector_before_links.get_table_names():
        op.create_table('interview_links',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('interview_id', sa.UUID(), nullable=False),
    sa.Column('token', sa.String(length=500), nullable=False),
    sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('session_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['interview_id'], ['interviews.id'], ),
    sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
        op.create_index(op.f('ix_interview_links_interview_id'), 'interview_links', ['interview_id'], unique=False)
        op.create_index(op.f('ix_interview_links_token'), 'interview_links', ['token'], unique=True)
        op.create_index(op.f('ix_interview_links_session_id'), 'interview_links', ['session_id'], unique=False)
    
    # ШАГ 7: Обновить evaluations -> session_evaluations и связанные таблицы - только если существуют
    inspector_before_eval = sa.inspect(op.get_bind())
    existing_tables_final = set(inspector_before_eval.get_table_names())
    if 'evaluations' in existing_tables_final:
        op.rename_table('evaluations', 'session_evaluations')
        try:
            op.drop_constraint('evaluations_interview_id_fkey', 'session_evaluations', type_='foreignkey')
        except:
            pass
        try:
            op.alter_column('session_evaluations', 'interview_id', new_column_name='session_id')
        except:
            pass
        try:
            op.create_foreign_key('session_evaluations_session_id_fkey', 'session_evaluations', 'sessions', ['session_id'], ['id'])
        except:
            pass
    
    if 'evaluation_observations' in existing_tables_final:
        op.rename_table('evaluation_observations', 'session_evaluation_observations')
        try:
            op.drop_constraint('evaluation_observations_evaluation_id_fkey', 'session_evaluation_observations', type_='foreignkey')
            op.create_foreign_key('session_evaluation_observations_evaluation_id_fkey', 'session_evaluation_observations', 'session_evaluations', ['evaluation_id'], ['id'])
        except:
            pass
    
    if 'evaluation_strengths' in existing_tables_final:
        op.rename_table('evaluation_strengths', 'session_evaluation_strengths')
        try:
            op.drop_constraint('evaluation_strengths_evaluation_id_fkey', 'session_evaluation_strengths', type_='foreignkey')
            op.create_foreign_key('session_evaluation_strengths_evaluation_id_fkey', 'session_evaluation_strengths', 'session_evaluations', ['evaluation_id'], ['id'])
        except:
            pass
    
    if 'evaluation_improvements' in existing_tables_final:
        op.rename_table('evaluation_improvements', 'session_evaluation_improvements')
        try:
            op.drop_constraint('evaluation_improvements_evaluation_id_fkey', 'session_evaluation_improvements', type_='foreignkey')
            op.create_foreign_key('session_evaluation_improvements_evaluation_id_fkey', 'session_evaluation_improvements', 'session_evaluations', ['evaluation_id'], ['id'])
        except:
            pass
    
    if 'evaluation_key_phrases' in existing_tables_final:
        op.rename_table('evaluation_key_phrases', 'session_evaluation_key_phrases')
        try:
            op.drop_constraint('evaluation_key_phrases_evaluation_id_fkey', 'session_evaluation_key_phrases', type_='foreignkey')
            op.create_foreign_key('session_evaluation_key_phrases_evaluation_id_fkey', 'session_evaluation_key_phrases', 'session_evaluations', ['evaluation_id'], ['id'])
        except:
            pass
    
    # ШАГ 8: Обновить candidate_status - только если существует
    if 'candidate_status' in existing_tables_final:
        try:
            op.drop_constraint('candidate_status_interview_id_fkey', 'candidate_status', type_='foreignkey')
        except:
            pass
        try:
            op.alter_column('candidate_status', 'interview_id', new_column_name='session_id')
        except:
            pass
        try:
            op.create_foreign_key('candidate_status_session_id_fkey', 'candidate_status', 'sessions', ['session_id'], ['id'])
        except:
            pass
    
    # ШАГ 9: Обновить simulation_scenarios - только если существует
    if 'simulation_scenarios' in existing_tables_final:
        try:
            op.drop_constraint('simulation_scenarios_interview_id_fkey', 'simulation_scenarios', type_='foreignkey')
        except:
            pass
        try:
            op.alter_column('simulation_scenarios', 'interview_id', new_column_name='session_id')
        except:
            pass
        try:
            op.create_foreign_key('simulation_scenarios_session_id_fkey', 'simulation_scenarios', 'sessions', ['session_id'], ['id'])
        except:
            pass
    
    # ШАГ 10: Обновить enum для SessionStatus (переименовать InterviewStatus) - только если существует
    try:
        op.execute("ALTER TYPE interviewstatus RENAME TO sessionstatus")
    except:
        pass  # Enum may not exist or already renamed
    
    # ШАГ 11: Обновить индексы - только после того, как все колонки переименованы
    # Обновить inspector после всех изменений
    inspector_final_check = sa.inspect(op.get_bind())
    existing_tables_final_check = set(inspector_final_check.get_table_names())
    
    # Индексы для sessions -> только если таблица существует
    if has_old_interviews and 'sessions' in existing_tables_final_check:
        try:
            op.drop_index(op.f('ix_interviews_session_id'), table_name='sessions')
        except:
            pass
        # Проверить, что колонка interview_id существует
        columns_sessions = [col['name'] for col in inspector_final_check.get_columns('sessions')]
        if 'interview_id' in columns_sessions:
            try:
                indexes_sessions = [idx['name'] for idx in inspector_final_check.get_indexes('sessions')]
                if 'ix_sessions_interview_id' not in indexes_sessions:
                    op.create_index(op.f('ix_sessions_interview_id'), 'sessions', ['interview_id'], unique=False)
            except Exception as e:
                print(f"Warning: Could not create index ix_sessions_interview_id: {e}")
    
    # Индексы для interviews -> только если таблица существует
    if has_sessions and 'interviews' in existing_tables_final_check:
        columns_interviews = [col['name'] for col in inspector_final_check.get_columns('interviews')]
        indexes_interviews = [idx['name'] for idx in inspector_final_check.get_indexes('interviews')]
        
        # Индекс для organizer_id
        try:
            op.drop_index(op.f('ix_sessions_organizer_id'), table_name='interviews')
        except:
            pass
        if 'organizer_id' in columns_interviews:
            try:
                if 'ix_interviews_organizer_id' not in indexes_interviews:
                    op.create_index(op.f('ix_interviews_organizer_id'), 'interviews', ['organizer_id'], unique=False)
            except Exception as e:
                print(f"Warning: Could not create index ix_interviews_organizer_id: {e}")
        
        # Индекс для share_url
        try:
            op.drop_index(op.f('ix_sessions_share_url'), table_name='interviews')
        except:
            pass
        if 'share_url' in columns_interviews:
            try:
                if 'ix_interviews_share_url' not in indexes_interviews:
                    op.create_index(op.f('ix_interviews_share_url'), 'interviews', ['share_url'], unique=True)
            except Exception as e:
                print(f"Warning: Could not create index ix_interviews_share_url: {e}")
        
        # Обновить индекс для session_questions -> interview_questions - только если таблица существует
        if 'interview_questions' in existing_tables_final_check:
            inspector_final = sa.inspect(op.get_bind())
            columns_final = [col['name'] for col in inspector_final.get_columns('interview_questions')]
            
            try:
                op.drop_index(op.f('ix_session_questions_session_id'), table_name='interview_questions')
            except:
                pass
            
            # Проверить, что колонка interview_id существует перед созданием индекса
            if 'interview_id' in columns_final:
                try:
                    # Проверить, существует ли индекс перед созданием
                    indexes = [idx['name'] for idx in inspector_final.get_indexes('interview_questions')]
                    if 'ix_interview_questions_interview_id' not in indexes:
                        op.create_index(op.f('ix_interview_questions_interview_id'), 'interview_questions', ['interview_id'], unique=False)
                except Exception as e:
                    print(f"Warning: Could not create index ix_interview_questions_interview_id: {e}")
            elif 'session_id' in columns_final:
                # Если колонка еще не переименована, создать индекс на session_id
                try:
                    indexes = [idx['name'] for idx in inspector_final.get_indexes('interview_questions')]
                    if 'ix_interview_questions_session_id' not in indexes:
                        op.create_index(op.f('ix_interview_questions_session_id'), 'interview_questions', ['session_id'], unique=False)
                except:
                    pass
            
            # Обновить индекс для parent_question_id
            try:
                op.drop_index(op.f('ix_session_questions_parent_question_id'), table_name='interview_questions')
            except:
                pass
            
            # Проверить, что колонка parent_question_id существует перед созданием индекса
            if 'parent_question_id' in columns_final:
                try:
                    indexes = [idx['name'] for idx in inspector_final.get_indexes('interview_questions')]
                    if 'ix_interview_questions_parent_question_id' not in indexes:
                        op.create_index(op.f('ix_interview_questions_parent_question_id'), 'interview_questions', ['parent_question_id'], unique=False)
                except Exception as e:
                    print(f"Warning: Could not create index ix_interview_questions_parent_question_id: {e}")


def downgrade() -> None:
    # Откат изменений - очень сложная операция, лучше не делать автоматический откат
    pass

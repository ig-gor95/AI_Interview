"""Session service for managing session history and question-answers"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from app.models.session import Session, SessionQuestionAnswer, SessionStatus
from app.schemas.session import SessionQuestionAnswerSummary


async def save_session_question_answer(
    db: AsyncSession,
    session_id: UUID,
    question_text: str,
    answer_text: str,
    question_type: str,  # "main" | "clarifying" | "dynamic"
    parent_session_qa_id: Optional[UUID] = None,
    analysis_note: Optional[str] = None
) -> SessionQuestionAnswer:
    """Сохраняет вопрос-ответ в историю сессии
    
    Args:
        db: Database session
        session_id: ID сессии
        question_text: Фактический текст вопроса, заданного GPT
        answer_text: Ответ кандидата
        question_type: Тип вопроса ("main" | "clarifying" | "dynamic")
        parent_session_qa_id: ID родительского SessionQuestionAnswer (для clarifying/dynamic)
        analysis_note: Анализ ответа AI (опционально)
        
    Returns:
        SessionQuestionAnswer: Созданная запись
        
    - question_text содержит фактический текст вопроса, заданного GPT
    - Связь с шаблоном не хранится, так как GPT может изменять текст вопроса
    """
    # Определяем order_index на основе текущего количества записей в сессии
    result = await db.execute(
        select(SessionQuestionAnswer)
        .where(SessionQuestionAnswer.session_id == session_id)
        .order_by(SessionQuestionAnswer.order_index.desc())
    )
    last_qa = result.scalar_one_or_none()
    next_order_index = (last_qa.order_index + 1) if last_qa else 0
    
    # Определяем is_clarifying на основе question_type
    is_clarifying = question_type in ("clarifying", "dynamic")
    
    # Создаем новую запись
    session_qa = SessionQuestionAnswer(
        session_id=session_id,
        question_text=question_text,
        answer_text=answer_text,
        question_type=question_type,
        is_clarifying=is_clarifying,
        parent_session_qa_id=parent_session_qa_id,
        analysis_note=analysis_note,
        order_index=next_order_index
    )
    
    db.add(session_qa)
    await db.commit()
    await db.refresh(session_qa)
    
    return session_qa


async def get_session_history(
    db: AsyncSession,
    session_id: UUID
) -> List[SessionQuestionAnswer]:
    """Получить историю диалога сессии
    
    Args:
        db: Database session
        session_id: ID сессии
        
    Returns:
        List[SessionQuestionAnswer]: Список вопросов-ответов, отсортированный по order_index
    """
    result = await db.execute(
        select(SessionQuestionAnswer)
        .where(SessionQuestionAnswer.session_id == session_id)
        .order_by(SessionQuestionAnswer.order_index)
    )
    return list(result.scalars().all())


async def get_session_question_answer_tree(
    db: AsyncSession,
    session_id: UUID
) -> Dict[str, Any]:
    """Получить историю в виде дерева (для удобства отображения)
    
    Args:
        db: Database session
        session_id: ID сессии
        
    Returns:
        Dict[str, Any]: Дерево вопросов-ответов с вложенностью
    """
    # Получаем все записи
    history = await get_session_history(db, session_id)
    
    # Создаем словарь для быстрого доступа
    qa_dict = {qa.id: qa for qa in history}
    
    # Разделяем на корневые и дочерние
    root_items = []
    child_items_map: Dict[UUID, List[SessionQuestionAnswer]] = {}
    
    for qa in history:
        if qa.parent_session_qa_id is None:
            root_items.append(qa)
        else:
            parent_id = qa.parent_session_qa_id
            if parent_id not in child_items_map:
                child_items_map[parent_id] = []
            child_items_map[parent_id].append(qa)
    
    # Строим дерево
    def build_tree_node(qa: SessionQuestionAnswer) -> Dict[str, Any]:
        node = {
            "id": str(qa.id),
            "questionText": qa.question_text,
            "answerText": qa.answer_text,
            "questionType": qa.question_type,
            "isClarifying": qa.is_clarifying,
            "orderIndex": qa.order_index,
            "analysisNote": qa.analysis_note,
            "createdAt": qa.created_at.isoformat() if qa.created_at else None,
            "children": []
        }
        
        # Добавляем дочерние элементы
        if qa.id in child_items_map:
            for child in sorted(child_items_map[qa.id], key=lambda x: x.order_index):
                node["children"].append(build_tree_node(child))
        
        return node
    
    # Строим дерево из корневых элементов
    tree = [build_tree_node(root) for root in sorted(root_items, key=lambda x: x.order_index)]
    
    return {
        "sessionId": str(session_id),
        "tree": tree,
        "totalItems": len(history)
    }


async def get_session_question_answer_summaries(
    db: AsyncSession,
    session_id: UUID
) -> List[SessionQuestionAnswerSummary]:
    """Получить краткую историю сессии для контекста GPT
    
    Args:
        db: Database session
        session_id: ID сессии
        
    Returns:
        List[SessionQuestionAnswerSummary]: Список кратких описаний вопросов-ответов
    """
    history = await get_session_history(db, session_id)
    
    return [
        SessionQuestionAnswerSummary(
            questionText=qa.question_text,
            answerText=qa.answer_text,
            questionType=qa.question_type,
            parentSessionQuestionAnswerId=str(qa.parent_session_qa_id) if qa.parent_session_qa_id else None
        )
        for qa in history
    ]


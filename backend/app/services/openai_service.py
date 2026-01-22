"""OpenAI service for Whisper STT, GPT-4, and TTS"""
from openai import AsyncOpenAI
from typing import Optional, List, Dict, Any
import io
import json
import re
from app.config import settings
from app.schemas.session import GPTContextRequest, GPTResponse


class OpenAIService:
    """Service for OpenAI API integration"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model_gpt = "gpt-4-turbo-preview"  # Можно использовать gpt-4 или gpt-3.5-turbo
        self.model_tts = "tts-1"  # или "tts-1-hd" для лучшего качества
        self.voice_tts = "alloy"  # alloy, echo, fable, onyx, nova, shimmer
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: Optional[str] = "ru",
        filename: Optional[str] = "audio.webm"
    ) -> str:
        """
        Transcribe audio to text using Whisper API
        
        Args:
            audio_data: Raw audio bytes
            language: Language code (ru, en, etc.)
            filename: Filename for the audio file
            
        Returns:
            Transcribed text
        """
        try:
            # Create file-like object from bytes
            audio_file = io.BytesIO(audio_data)
            audio_file.name = filename
            
            # Call Whisper API
            transcription = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="text"
            )
            
            return transcription if isinstance(transcription, str) else transcription.text
            
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
    
    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = 1000
    ) -> str:
        """
        Generate chat response using GPT-4
        
        Args:
            messages: List of messages with role and content
            system_prompt: System prompt for conversation context
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated text response
        """
        try:
            # Prepare messages
            chat_messages = []
            
            if system_prompt:
                chat_messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            
            chat_messages.extend(messages)
            
            # Call GPT API
            response = await self.client.chat.completions.create(
                model=self.model_gpt,
                messages=chat_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Error generating chat response: {str(e)}")
    
    async def generate_interview_question(
        self,
        session_params: Dict[str, Any],
        conversation_history: List[Dict[str, str]],
        question_index: int
    ) -> str:
        """
        Generate interview question based on session parameters
        
        Args:
            session_params: Session configuration
            conversation_history: Previous messages in conversation
            question_index: Index of current question
            
        Returns:
            Generated question text
        """
        # Build system prompt for interview
        system_prompt = self._build_interview_system_prompt(session_params)
        
        # Get specific question if available
        questions = session_params.get("questions", [])
        if questions and question_index < len(questions):
            # Use predefined question, but GPT can rephrase if needed
            specific_question = questions[question_index]
            
            prompt = f"""You are an AI interviewer conducting an interview for the position: {session_params.get('position', 'N/A')}.

The next question to ask is: "{specific_question}"

Ask this question naturally in a {session_params.get('personality', 'professional')} manner. 
If the candidate has already answered this question partially, ask a follow-up or move to the next topic.
Keep the question concise and clear."""
        else:
            # Generate question based on context
            prompt = f"""You are an AI interviewer conducting an interview for the position: {session_params.get('position', 'N/A')}.

Generate the next question (question #{question_index + 1}) for the interview based on:
- Position: {session_params.get('position', 'N/A')}
- Evaluation criteria: {session_params.get('evaluation_criteria', [])}
- Interview type: {session_params.get('interview_type', 'screening')}

Ask a relevant question in a {session_params.get('personality', 'professional')} manner. 
Keep it concise and focused on assessing the candidate's suitability for the role."""

        messages = conversation_history + [
            {"role": "user", "content": prompt}
        ]
        
        return await self.generate_chat_response(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=200
        )
    
    async def generate_interview_response(
        self,
        user_message: str,
        session_params: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """
        Generate AI response during interview conversation
        
        Args:
            user_message: Candidate's message
            session_params: Session configuration
            conversation_history: Previous conversation
            question_index: Current question index
            
        Returns:
            AI response text
        """
        system_prompt = self._build_interview_system_prompt(session_params)
        
        messages = conversation_history + [
            {"role": "user", "content": user_message}
        ]
        
        return await self.generate_chat_response(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=300
        )
    
    async def text_to_speech(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = "ru"
    ) -> bytes:
        """
        Convert text to speech using TTS API
        
        Args:
            text: Text to convert
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            language: Language code
            
        Returns:
            Audio bytes in mp3 format
        """
        try:
            voice = voice or self.voice_tts
            
            # Call TTS API
            response = await self.client.audio.speech.create(
                model=self.model_tts,
                voice=voice,
                input=text
            )
            
            # Read audio bytes
            audio_bytes = b""
            async for chunk in response:
                audio_bytes += chunk
            
            return audio_bytes
            
        except Exception as e:
            raise Exception(f"Error converting text to speech: {str(e)}")
    
    def _build_interview_system_prompt(self, session_params: Dict[str, Any]) -> str:
        """Build system prompt for interview based on session parameters"""
        position = session_params.get("position", "the position")
        company = session_params.get("company", "")
        personality = session_params.get("personality", "professional")
        interview_type = session_params.get("interview_type", "screening")
        evaluation_criteria = session_params.get("evaluation_criteria", [])
        
        personality_descriptions = {
            "friendly": "friendly, warm, and encouraging",
            "professional": "professional, courteous, and structured",
            "motivating": "motivating, enthusiastic, and supportive"
        }
        
        personality_desc = personality_descriptions.get(personality, "professional")
        
        prompt = f"""You are an AI interviewer conducting a {interview_type} interview for the position: {position}"""
        
        if company:
            prompt += f" at {company}"
        
        prompt += f"""

Your role:
- Conduct the interview in a {personality_desc} manner
- Ask relevant questions based on the position requirements
- Listen actively and ask follow-up questions when needed
- Keep responses concise and professional
- Guide the conversation naturally
"""
        
        if evaluation_criteria:
            prompt += f"\nFocus on evaluating: {', '.join(evaluation_criteria[:5])}"
        
        prompt += """
- If you need clarification, ask: "Не могли бы вы уточнить?" or "Could you clarify?"
- If you didn't hear clearly, ask: "Не могли бы вы повторить?" or "Could you repeat that?"
- When moving to next question, use natural transitions
"""
        
        return prompt
    
    async def analyze_transcript(
        self,
        transcript: List[Dict[str, Any]],
        session_params: Dict[str, Any],
        evaluation_criteria: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze interview transcript using GPT-4 for evaluation
        
        Args:
            transcript: List of transcript messages
            session_params: Session configuration
            evaluation_criteria: Criteria for evaluation
            
        Returns:
            Analysis results with observations, strengths, improvements
        """
        # Build transcript text
        transcript_text = "\n".join([
            f"{msg.get('role', 'unknown')}: {msg.get('message', '')}"
            for msg in transcript
        ])
        
        system_prompt = f"""You are an expert HR analyst evaluating a job interview transcript.

Position: {session_params.get('position', 'N/A')}
Evaluation Criteria: {', '.join(evaluation_criteria)}

Analyze the candidate's responses and provide a comprehensive evaluation."""
        
        user_prompt = f"""Analyze this interview transcript and provide:

1. Overall assessment score (0-100)
2. Summary of the interview
3. Observations by category (stressHandling, empathy, problemSolving, conflictResolution, communication)
4. Strengths (at least 3)
5. Areas for improvement (at least 2)
6. Key effective phrases used by candidate
7. Key phrases that could be improved
8. Recommendation on readiness to work

Format your response as JSON with the following structure:
{{
    "score": <number 0-100>,
    "summary": "<text>",
    "readiness": "<text>",
    "observations": {{
        "stressHandling": "<observation>",
        "empathy": "<observation>",
        "problemSolving": "<observation>",
        "conflictResolution": "<observation>",
        "communication": "<observation>"
    }},
    "strengths": ["<strength1>", "<strength2>", ...],
    "improvements": ["<improvement1>", "<improvement2>", ...],
    "keyPhrases": {{
        "effective": [
            {{"text": "<phrase>", "note": "<why effective>"}}
        ],
        "toImprove": [
            {{"text": "<phrase>", "note": "<how to improve>"}}
        ]
    }},
    "recommendation": "<text>"
}}

Transcript:
{transcript_text}"""
        
        messages = [
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.generate_chat_response(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.5,
            max_tokens=2000
        )
        
        # Parse JSON response (GPT sometimes wraps in markdown)
        import json
        import re
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Fallback: return structured response
        return {
            "score": 75,
            "summary": response[:500] if response else "Analysis completed",
            "readiness": "Further evaluation needed",
            "observations": {},
            "strengths": [],
            "improvements": [],
            "keyPhrases": {"effective": [], "toImprove": []},
            "recommendation": "Review transcript manually"
        }
    
    async def generate_session_question_structured(
        self, 
        context: GPTContextRequest
    ) -> GPTResponse:
        """Генерирует вопрос с использованием структурированного контекста
        
        Args:
            context: GPTContextRequest с полным контекстом интервью
            
        Returns:
            GPTResponse со структурированным ответом
        """
        return await self.generate_session_question_with_json_mode(context)
    
    async def generate_session_question_with_json_mode(
        self,
        context: GPTContextRequest
    ) -> GPTResponse:
        """Использует JSON mode для гарантированного JSON ответа
        
        Args:
            context: GPTContextRequest с полным контекстом интервью
            
        Returns:
            GPTResponse со структурированным ответом от GPT
        """
        try:
            # Формируем системный промпт
            system_prompt = self._build_session_system_prompt(context)
            
            # Определяем, является ли это восстановлением сессии (если есть история больше чем приветствие)
            is_resume = len(context.conversation_history) > 1
            
            # Формируем промпт для GPT с инструкциями
            user_prompt = self._build_session_user_prompt(context, is_resume=is_resume)
            
            # Подготовка сообщений
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Вызов GPT API с JSON mode
            response = await self.client.chat.completions.create(
                model=self.model_gpt,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"}  # Включаем JSON mode
            )
            
            response_text = response.choices[0].message.content
            
            # Парсим JSON ответ
            try:
                response_data = json.loads(response_text)
                return GPTResponse(**response_data)
            except json.JSONDecodeError:
                # Если JSON невалидный, пытаемся извлечь его
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    response_data = json.loads(json_match.group())
                    return GPTResponse(**response_data)
                else:
                    raise Exception(f"Invalid JSON response from GPT: {response_text}")
                    
        except Exception as e:
            raise Exception(f"Error generating session question: {str(e)}")
    
    def _build_session_system_prompt(self, context: GPTContextRequest) -> str:
        """Формирует системный промпт для скрининг-собеседования"""
        interview = context.interview
        personality_descriptions = {
            "friendly": "дружелюбным, теплым и поддерживающим",
            "professional": "профессиональным, вежливым и структурированным",
            "motivating": "мотивирующим, энтузиастичным и поддерживающим"
        }
        
        personality_desc = personality_descriptions.get(interview.personality, "профессиональным")
        
        prompt = f"""Ты AI-интервьюер, проводящий скрининг-собеседование в компанию {interview.company or "компанию"} на позицию {interview.position}.

ВАЖНО: Это скрининг-собеседование (первичный отбор), а не полное интервью. Цель - быстро оценить базовые компетенции, мотивацию и коммуникативные навыки кандидата.

ПРАВИЛА ПОВЕДЕНИЯ:

0. ПРИВЕТСТВИЕ И ПРОВЕРКА ГОТОВНОСТИ (только при старте сессии):
   - При первом сообщении поздоровайся и спроси о готовности: "Здравствуйте! Я провожу скрининг-собеседование в компанию {interview.company or "компанию"} на позицию {interview.position}. Готовы ли вы начать?"
   - Если кандидат отвечает, что готов (да, конечно, готов и т.д.) - задай первый вопрос из шаблона
   - Если кандидат отвечает, что не готов (нет, подождите, не готов и т.д.) - вежливо попроси подать сигнал о готовности: "Хорошо, пожалуйста, дайте знать, когда будете готовы начать"
   - Если ответ неясный - уточни готовность

1. ДИНАМИЧЕСКИЕ ВОПРОСЫ:"""
        
        # Меняем текст в зависимости от allow_dynamic_questions
        if context.allow_dynamic_questions:
            prompt += """
   - Ты можешь задавать дополнительные вопросы, если считаешь это необходимым
   - НО вопросы из шаблона всегда в приоритете
   - Если в контексте указан следующий вопрос из шаблона, сначала задай его, а дополнительные вопросы задавай только если это действительно важно для оценки кандидата
   - Если ты решил задать дополнительный вопрос перед вопросом из шаблона, укажи в ответе isDynamic = true"""
        else:
            prompt += """
   - Ты можешь задавать ТОЛЬКО вопросы из шаблона и их уточняющие подвопросы
   - Не придумывай свои вопросы
   - Не задавай динамические вопросы (isDynamic всегда должен быть false)"""
        
        prompt += f"""

2. ОСТАВШЕЕСЯ ВРЕМЯ:
   - Если времени < 5 минут: НЕ задавай дополнительные вопросы, даже если разрешены
   - Если времени много: можешь задавать уточняющие вопросы для лучшего понимания
   - Если время истекло: интервью завершено, но пользователь может задать дополнительный вопрос или дополнение

3. УТОЧНЯЮЩИЕ ВОПРОСЫ:
   - Используй подвопросы из шаблона, если ответ кандидата недостаточно точен
   - Если есть потенциально важный момент, который стоит уточнить - уточни его
   - Задавай уточняющие вопросы по одному

4. ПЕРЕСПРОС:
   - Если времени много и кандидат дал невнятный ответ - можешь переспросить вопрос, сформулировав его по-другому

5. ЗАДАВАЙ ВОПРОСЫ ПО ОДНОМУ - никогда не задавай несколько вопросов сразу"""
        
        # Добавляем информацию о customer_simulation, если оно есть
        if interview.config and interview.config.customer_simulation:
            cs_data = interview.config.customer_simulation
            if isinstance(cs_data, dict) and cs_data.get("enabled"):
                prompt += f"""

6. МОДЕЛИРОВАНИЕ РЕАЛЬНОЙ РАБОЧЕЙ СИТУАЦИИ (customer_simulation):
   - В конце интервью (когда все основные вопросы заданы или осталось < 5 минут) можно провести симуляцию
   - Ты должен сыграть роль клиента согласно сценарию:
     * Роль клиента: {cs_data.get("role", "не указана")}
     * Описание сценария: {cs_data.get("scenario", "не указан")}
   - Веди себя как указанный клиент (например, недовольный клиент, гость, заказчик)
   - Задавай вопросы или высказывай претензии от лица этого клиента
   - Оценивай реакцию кандидата на стрессовую ситуацию
   - Симуляция должна быть реалистичной и соответствовать описанному сценарию
   - После симуляции можно завершить интервью"""
        
        prompt += f"""

СТИЛЬ ОБЩЕНИЯ:
- Проводи интервью {personality_desc} образом
- Задавай релевантные вопросы на основе требований к позиции
- Слушай активно и задавай уточняющие вопросы при необходимости
- Держи ответы краткими и профессиональными
- Веди беседу естественно"""
        
        if context.interview.instructions:
            prompt += f"\n\nДополнительные инструкции: {context.interview.instructions}\n"
        
        prompt += """

ФОРМАТ ОТВЕТА: Ты должен возвращать ответ ТОЛЬКО в формате JSON. Структура ответа должна быть:
{
  "question": {
    "text": "текст вопроса",
    "type": "main" | "clarifying" | "dynamic",
    "isClarifying": true/false,
    "isDynamic": true/false,
    "parentSessionQuestionAnswerId": "uuid или null"
  },
  "metadata": {
    "needsClarification": true/false,
    "answerQuality": "complete" | "partial" | "insufficient",
    "shouldMoveNext": true/false,
    "estimatedTimeRemaining": число (минуты)
  },
  "analysis": {
    "keyPoints": ["ключевой момент 1", "ключевой момент 2"],
    "suggestedFollowUps": ["вопрос 1", "вопрос 2"]
  }
}
"""
        
        return prompt
    
    def _build_session_user_prompt(self, context: GPTContextRequest, is_resume: bool = False) -> str:
        """Формирует пользовательский промпт с контекстом"""
        interview = context.interview
        remaining_minutes = context.remaining_time.minutes
        remaining_seconds = context.remaining_time.seconds
        
        prompt = f"""КОНТЕКСТ СКРИНИНГ-СОБЕСЕДОВАНИЯ:"""
        
        # Добавляем информацию о восстановлении сессии
        if is_resume:
            prompt += f"""

⚠️ ВАЖНО: Сессия была прервана и восстановлена. Ниже полная история диалога."""
        
        prompt += f"""

Позиция: {interview.position}
Компания: {interview.company or "Не указана"}
Оставшееся время: {remaining_minutes} минут {remaining_seconds} секунд"""
        
        # Влияние времени на поведение
        if remaining_minutes < 5:
            prompt += "\n⚠️ ВНИМАНИЕ: Времени осталось мало! НЕ задавай дополнительные вопросы, даже если они разрешены."
        elif remaining_minutes < 10:
            prompt += "\n⚠️ Времени осталось немного. Сфокусируйся на основных вопросах."
        else:
            prompt += "\n✅ Времени достаточно. Можешь задавать уточняющие вопросы для лучшего понимания."
        
        # Следующий вопрос из шаблона (ВСЕГДА указывать)
        if context.current_interview_question:
            current_q = context.current_interview_question
            prompt += f"""

СЛЕДУЮЩИЙ ВОПРОС ИЗ ШАБЛОНА:
- Текст: {current_q.text}
- Порядковый номер: {current_q.order_index + 1}"""
            
            if current_q.clarifying_questions:
                prompt += f"\n- Уточняющие подвопросы для этого вопроса:\n"
                for i, clar_q in enumerate(current_q.clarifying_questions, 1):
                    prompt += f"  {i}. {clar_q}\n"
            
            # Инструкции о возможности задать динамический вопрос
            if context.allow_dynamic_questions:
                prompt += f"""
\nИНСТРУКЦИЯ: Следующий вопрос из шаблона: "{current_q.text}"
Ты можешь:
1. Задать этот вопрос из шаблона (isDynamic = false)
2. ИЛИ если считаешь это действительно важным для оценки кандидата, сначала задать свой дополнительный вопрос (isDynamic = true), а затем задать вопрос из шаблона
НО: вопросы из шаблона всегда в приоритете!"""
            else:
                prompt += f"""
\nИНСТРУКЦИЯ: Задай следующий вопрос из шаблона: "{current_q.text}"
Ты можешь использовать уточняющие подвопросы, если ответ кандидата недостаточно точен.
НЕ придумывай свои вопросы (isDynamic должен быть false)."""
        else:
            # Если вопросов из шаблона больше нет
            prompt += "\n\n⚠️ Все основные вопросы из шаблона заданы."
            if context.allow_dynamic_questions:
                prompt += " Ты можешь задать дополнительные вопросы, если это важно для оценки."
        
        # История диалога
        if context.conversation_history:
            prompt += "\n\nИСТОРИЯ ДИАЛОГА:"
            # Показываем последние 5-10 сообщений для контекста
            recent_history = context.conversation_history[-10:] if len(context.conversation_history) > 10 else context.conversation_history
            for msg in recent_history:
                role_label = "AI" if msg.role == "ai" else "Кандидат"
                prompt += f"\n{role_label}: {msg.message}"
        
        # История вопросов и ответов
        if context.session_history:
            prompt += "\n\nИСТОРИЯ ВОПРОСОВ И ОТВЕТОВ:"
            for i, qa in enumerate(context.session_history[-5:], 1):  # Последние 5 для контекста
                prompt += f"\n{i}. [{qa.question_type.upper()}] {qa.question_text}"
                prompt += f"\n   Ответ кандидата: {qa.answer_text}"
        
        # Последний ответ пользователя
        if context.user_response:
            prompt += f"\n\nПОСЛЕДНИЙ ОТВЕТ КАНДИДАТА:\n{context.user_response.text}"
        
        # Прогресс
        progress = context.question_progress
        prompt += f"""

ПРОГРЕСС:
- Текущий вопрос: {progress.current_question_index + 1} из {progress.total_questions}
- Отвечено основных вопросов: {progress.answered_questions}"""
        
        # Информация о customer_simulation
        if interview.config and interview.config.customer_simulation:
            cs_data = interview.config.customer_simulation
            if isinstance(cs_data, dict) and cs_data.get("enabled"):
                # Проверяем, подходит ли интервью к концу
                all_questions_asked = progress.current_question_index >= progress.total_questions
                time_low = remaining_minutes < 5
                
                if all_questions_asked or time_low:
                    prompt += f"""

🎭 МОДЕЛИРОВАНИЕ РЕАЛЬНОЙ РАБОЧЕЙ СИТУАЦИИ:
Интервью подходит к концу. Ты можешь провести симуляцию реальной рабочей ситуации.
- Роль клиента: {cs_data.get("role", "не указана")}
- Описание сценария: {cs_data.get("scenario", "не указан")}

ИНСТРУКЦИЯ: Сыграй роль этого клиента и проведи симуляцию. Веди себя соответственно сценарию.
Оценивай реакцию кандидата на стрессовую ситуацию. После симуляции можно завершить интервью."""
        
        prompt += "\n\nЗадай следующий вопрос на основе этого контекста. Верни ответ ТОЛЬКО в JSON формате согласно структуре из системного промпта."
        
        return prompt


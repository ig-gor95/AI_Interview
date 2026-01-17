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
            
            # Формируем промпт для GPT с инструкциями
            user_prompt = self._build_session_user_prompt(context)
            
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
        """Формирует системный промпт для интервью"""
        interview = context.interview
        personality_descriptions = {
            "friendly": "дружелюбным, теплым и поддерживающим",
            "professional": "профессиональным, вежливым и структурированным",
            "motivating": "мотивирующим, энтузиастичным и поддерживающим"
        }
        
        personality_desc = personality_descriptions.get(interview.personality, "профессиональным")
        
        prompt = f"""Ты AI-интервьюер, проводящий интервью для позиции: {interview.position}"""
        
        if interview.company:
            prompt += f" в компании {interview.company}"
        
        prompt += f"""

Твоя роль:
- Проводи интервью {personality_desc} образом
- Задавай релевантные вопросы на основе требований к позиции
- Слушай активно и задавай уточняющие вопросы при необходимости
- Держи ответы краткими и профессиональными
- Веди беседу естественно
"""
        
        if context.interview.instructions:
            prompt += f"\nДополнительные инструкции: {context.interview.instructions}\n"
        
        prompt += """
ВАЖНО: Ты должен возвращать ответ ТОЛЬКО в формате JSON. Структура ответа должна быть:
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
    
    def _build_session_user_prompt(self, context: GPTContextRequest) -> str:
        """Формирует пользовательский промпт с контекстом"""
        interview = context.interview
        remaining_minutes = context.remaining_time.minutes
        
        prompt = f"""Контекст интервью:

Позиция: {interview.position}
Компания: {interview.company or "Не указана"}
Оставшееся время: {remaining_minutes} минут
"""
        
        # Текущий вопрос из шаблона
        if context.current_interview_question:
            current_q = context.current_interview_question
            prompt += f"""
Текущий вопрос из шаблона:
- Текст: {current_q.text}
- Порядковый номер: {current_q.order_index + 1}
"""
            if current_q.clarifying_instructions:
                prompt += f"- Инструкции по уточнению: {', '.join(current_q.clarifying_instructions)}\n"
            if current_q.clarifying_questions:
                prompt += f"- Возможные уточняющие вопросы: {', '.join(current_q.clarifying_questions)}\n"
        
        # История сессии
        if context.session_history:
            prompt += "\nИстория вопросов и ответов в этой сессии:\n"
            for i, qa in enumerate(context.session_history, 1):
                prompt += f"{i}. {qa.question_type.upper()}: {qa.question_text}\n"
                prompt += f"   Ответ: {qa.answer_text}\n"
        
        # Последний ответ пользователя
        if context.user_response:
            prompt += f"\nПоследний ответ кандидата:\n{context.user_response.text}\n"
        
        # Прогресс
        progress = context.question_progress
        prompt += f"""
Прогресс:
- Текущий вопрос: {progress.current_question_index + 1} из {progress.total_questions}
- Отвечено вопросов: {progress.answered_questions}
"""
        
        # Разрешение на динамические вопросы
        if context.allow_dynamic_questions:
            prompt += "\nВАЖНО: Разрешены динамические вопросы. Ты можешь задавать дополнительные вопросы, которых нет в шаблоне.\n"
        
        prompt += "\nЗадай следующий вопрос на основе этого контекста. Верни ответ в JSON формате согласно структуре из системного промпта."
        
        return prompt


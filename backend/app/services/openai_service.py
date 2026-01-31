"""AI Service — только DeepSeek (OpenAI-совместимый API). TTS — через Google или отключено."""
import asyncio
import os
from openai import AsyncOpenAI
from typing import Optional, List, Dict, Any
import io
import json
import re
from app.config import settings
from app.schemas.session import GPTContextRequest, GPTResponse


def _fix_llm_json(text: str) -> str:
    """Fix common LLM JSON output issues before parsing."""
    if not text or not text.strip():
        return text
    s = text.strip()
    # Remove markdown code blocks
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    # Remove trailing commas before } or ] (common LLM mistake)
    s = re.sub(r",\s*([}\]])", r"\1", s)
    return s


class AIService:
    """Сервис для DeepSeek API (чат-модели). TTS не используется — только Google в core."""

    def __init__(self):
        self.provider = "deepseek"
        api_key = (
            (settings.deepseek_api_key or os.environ.get("DEEPSEEK_API_KEY") or "")
            .strip()
        )
        if not api_key:
            raise ValueError(
                "DEEPSEEK_API_KEY пустой. Добавьте в backend/.env: DEEPSEEK_API_KEY=sk-..."
            )
        base_url = "https://api.deepseek.com"
        self.model_gpt = "deepseek-chat"
        print(f"[AI Service] Using DeepSeek API with model: {self.model_gpt}")

        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=120.0
        )
    
    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = 1000
    ) -> str:
        """
        Generate chat response using DeepSeek API
        
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
            
            # Call DeepSeek API
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
            # Use predefined question, but DeepSeek can rephrase if needed
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
        """OpenAI TTS убран из проекта. Используйте tts_service=google в конфиге."""
        raise RuntimeError("OpenAI TTS удалён. Используйте tts_service=google в .env")
    
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
        Analyze interview transcript using DeepSeek API for evaluation
        
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
        
        # Parse JSON response (DeepSeek sometimes wraps in markdown)
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
            GPTResponse со структурированным ответом от DeepSeek
        """
        try:
            # Формируем системный промпт
            system_prompt = self._build_session_system_prompt(context)
            
            # Определяем, является ли это восстановлением сессии (если есть история больше чем приветствие)
            is_resume = len(context.conversation_history) > 1
            
            # Формируем промпт для DeepSeek с инструкциями
            user_prompt = self._build_session_user_prompt(context, is_resume=is_resume)

            # For DeepSeek, add explicit JSON formatting instructions since response_format might not work
            if self.provider == "deepseek":
                user_prompt += "\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON. The response must be parseable JSON."

            # Подготовка сообщений
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Вызов DeepSeek API с JSON mode
            print(f"[AI] Calling DeepSeek API with model {self.model_gpt}")
            print(f"[AI] System prompt length: {len(system_prompt)}")
            print(f"[AI] User prompt length: {len(user_prompt)}")
            
            # Prepare API call parameters
            # Optimized for faster responses:
            # - Lower temperature for more deterministic (faster) responses
            # - Reduced max_tokens since interview questions are typically concise
            api_params = {
                "model": self.model_gpt,
                "messages": messages,
                "temperature": 0.5,  # Reduced from 0.7 for faster, more deterministic responses
                # Interview реплики короткие, поэтому агрессивно ограничиваем длину ответа
                # Это уменьшает задержку и стоимость. Для длинных аналитических запросов
                # (например, финальный разбор интервью) используются отдельные методы
                # с собственными max_tokens.
                "max_tokens": 256,
            }

            # Enable streaming for faster response times
            # Streaming provides incremental responses and better perceived performance
            use_streaming = True
            if use_streaming:
                api_params["stream"] = True

            # Enable JSON mode for DeepSeek
            # DeepSeek supports response_format according to their documentation
            api_params["response_format"] = {"type": "json_object"}

            # Handle streaming vs non-streaming responses (retry on connection error)
            response_text = None
            for attempt in range(3):
                try:
                    if use_streaming:
                        print(f"[{self.provider.upper()}] Starting streaming request with model {self.model_gpt} (attempt {attempt + 1}/3)")
                        response_text = await self._handle_streaming_response(api_params)
                    else:
                        response = await self.client.chat.completions.create(**api_params)
                        response_text = response.choices[0].message.content
                    break
                except Exception as req_err:
                    err_str = str(req_err).lower()
                    if ("connection" in err_str or "connect" in err_str) and attempt < 2:
                        print(f"[AI] Connection error (attempt {attempt + 1}/3), retrying in 2s: {req_err}")
                        await asyncio.sleep(2)
                        continue
                    raise
            
            print(f"[{self.provider.upper()}] Response received, length: {len(response_text) if response_text else 0}")
            print(f"[{self.provider.upper()}] Response preview: {response_text[:200] if response_text else 'EMPTY'}...")

            # Handle empty response
            if not response_text or response_text.strip() == "":
                print(f"[{self.provider.upper()}] Empty response received, using fallback")
                # Create a fallback response
                fallback_response = {
                    "question": {
                        "text": "Расскажите о вашем опыте работы по данной специальности.",
                        "type": "main",
                        "isClarifying": False,
                        "isDynamic": False,
                        "parentSessionQuestionAnswerId": None
                    },
                    "metadata": {
                        "needsClarification": False,
                        "answerQuality": "complete",
                        "shouldMoveNext": True,
                        "estimatedTimeRemaining": 25
                    }
                }
                return GPTResponse(**fallback_response)

            # Парсим JSON ответ (fix common LLM output issues first)
            fixed_text = _fix_llm_json(response_text)
            try:
                response_data = json.loads(fixed_text)
                print(f"[AI] JSON parsed successfully")
                
                # Process metadata to handle None values and type conversions
                if "metadata" in response_data and response_data["metadata"]:
                    metadata = response_data["metadata"]

                    # Convert estimatedTimeRemaining from float to int if present
                    if "estimatedTimeRemaining" in metadata:
                        estimated_time = metadata["estimatedTimeRemaining"]
                        if isinstance(estimated_time, float):
                            metadata["estimatedTimeRemaining"] = int(estimated_time)
                            print(f"[AI] Converted estimatedTimeRemaining from float to int: {estimated_time} -> {int(estimated_time)}")

                    # Ensure answerQuality is not None (set default if needed)
                    if "answerQuality" in metadata and metadata["answerQuality"] is None:
                        metadata["answerQuality"] = "complete"
                        print(f"[AI] Set default answerQuality: complete")

                    # Ensure other metadata fields are not None
                    if "needsClarification" in metadata and metadata["needsClarification"] is None:
                        metadata["needsClarification"] = False
                    if "shouldMoveNext" in metadata and metadata["shouldMoveNext"] is None:
                        metadata["shouldMoveNext"] = False
                else:
                    # If no metadata provided, add default metadata
                    response_data["metadata"] = {
                        "needsClarification": False,
                        "answerQuality": "complete",
                        "shouldMoveNext": False,
                        "estimatedTimeRemaining": None
                    }
                    print(f"[AI] Added default metadata")
                
                result = GPTResponse(**response_data)
                print(f"[AI] GPTResponse created, question: {result.question.text[:100]}...")
                print(f"[AI] Metadata: {result.metadata}")
                return result
            except json.JSONDecodeError as e:
                print(f"[AI] JSON decode error: {e}")
                print(f"[AI] Response text (first 500 chars): {response_text[:500]}")
                # Extract JSON block and retry with fixes
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    extracted = _fix_llm_json(json_match.group())
                    try:
                        response_data = json.loads(extracted)
                        result = GPTResponse(**response_data)
                        print(f"[AI] JSON parsed from extracted block")
                        return result
                    except json.JSONDecodeError:
                        pass
                # Fallback: return a safe default so the interview can continue
                print(f"[AI] Using fallback response due to JSON parse failure")
                fallback = {
                    "question": {
                        "text": "Расскажите о вашем опыте работы по данной специальности.",
                        "type": "main",
                        "isClarifying": False,
                        "isDynamic": False,
                        "parentSessionQuestionAnswerId": None,
                    },
                    "metadata": {
                        "needsClarification": False,
                        "answerQuality": "complete",
                        "shouldMoveNext": True,
                        "estimatedTimeRemaining": 25,
                    },
                }
                return GPTResponse(**fallback)
                    
        except Exception as e:
            print(f"[AI] Exception in generate_session_question_with_json_mode: {str(e)}")
            import traceback
            traceback.print_exc()
            hint = ""
            if "connection" in str(e).lower() or "connect" in str(e).lower():
                hint = " Проверьте DEEPSEEK_API_KEY в .env, интернет и доступность https://api.deepseek.com"
            raise Exception(f"Error generating session question: {str(e)}.{hint}")

    async def _handle_streaming_response(self, api_params: dict) -> str:
        """
        Handle streaming response from API and accumulate chunks into complete JSON
        
        Args:
            api_params: API parameters for the request
            
        Returns:
            Complete response text as string
        """
        try:
            print(f"[{self.provider.upper()}] Starting streaming response handling")
            # When stream=True, create() is async — await returns the async iterator
            stream = await self.client.chat.completions.create(**api_params)
            
            accumulated_text = ""
            chunk_count = 0
            
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        content = delta.content
                        accumulated_text += content
                        chunk_count += 1
                        
                        # Log progress every 10 chunks
                        if chunk_count % 10 == 0:
                            print(f"[{self.provider.upper()}] Received {chunk_count} chunks, {len(accumulated_text)} chars so far...")
            
            print(f"[{self.provider.upper()}] Streaming complete: {chunk_count} chunks, {len(accumulated_text)} total chars")
            return accumulated_text.strip()
            
        except Exception as e:
            print(f"[{self.provider.upper()}] Error in streaming response: {e}")
            import traceback
            traceback.print_exc()
            # Fallback: try non-streaming request
            print(f"[{self.provider.upper()}] Falling back to non-streaming request")
            api_params_no_stream = api_params.copy()
            api_params_no_stream.pop("stream", None)
            response = await self.client.chat.completions.create(**api_params_no_stream)
            return response.choices[0].message.content if response.choices[0].message.content else ""
    
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

5. ЗАДАВАЙ ВОПРОСЫ ПО ОДНОМУ - никогда не задавай несколько вопросов сразу

6. НЕ ПОВТОРЯЙ ВОПРОСЫ - СТРОГО ЗАПРЕЩЕНО:
   - НИКОГДА не задавай вопрос, который уже был задан в этом интервью
   - Все заданные вопросы перечислены в разделе "УЖЕ ЗАДАННЫЕ ВОПРОСЫ"
   - Если вопрос был задан - переходи к следующему вопросу из шаблона
   - Если все вопросы из шаблона заданы - переходи к симуляции или заверши интервью"""
        
        # Добавляем информацию о customer_simulation, если оно есть
        if interview.customer_simulation and interview.customer_simulation.enabled:
            if getattr(context, "simulation_done", False):
                prompt += """

6. СИМУЛЯЦИЯ УЖЕ ПРОВЕДЕНА — ОБЯЗАТЕЛЬНО:
   - Кандидат уже ответил на вопрос по ситуации. Симуляция завершена.
   - НЕ задавай новых вопросов по сценарию. НЕ повторяй вопрос по ситуации.
   - Заверши интервью: поблагодари кандидата и кратко подведи итог (например: «Спасибо за ответы. На этом интервью завершено.»)."""
            else:
                prompt += f"""

6. МОДЕЛИРОВАНИЕ РЕАЛЬНОЙ РАБОЧЕЙ СИТУАЦИИ (customer_simulation):
   - В конце интервью (когда все основные вопросы заданы или осталось < 5 минут) можно провести симуляцию
   - В рамках одной симуляции задай не более 1–2 вопросов; после ответа кандидата сразу завершай симуляцию и переходи к завершению интервью
   - Перед первым вопросом в симуляции обязательно произнеси короткую вводную фразу, например: «Давайте представим ситуацию» или «Представьте, что…»
   - Ты должен сыграть роль клиента согласно сценарию:
     * Роль клиента: {interview.customer_simulation.role or "не указана"}
     * Описание сценария: {interview.customer_simulation.scenario or "не указан"}
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
    "estimatedTimeRemaining": число (минуты),
    "interviewComplete": true/false  // ОБЯЗАТЕЛЬНО true, когда завершаешь интервью (фраза типа "Спасибо за ответы. На этом интервью завершено.")
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
        
        # Проверяем, является ли это первым сообщением (приветствием)
        is_first_message = len(context.conversation_history) == 0
        
        if is_first_message:
            # Первое сообщение - приветствие
            prompt += f"""

🎯 ИНСТРУКЦИЯ ДЛЯ ПЕРВОГО СООБЩЕНИЯ (ПРИВЕТСТВИЕ):
Ты должен поздороваться и спросить о готовности начать интервью.
Формат: "Здравствуйте! Я провожу скрининг-собеседование в компанию {interview.company or "компанию"} на позицию {interview.position}. Готовы ли вы начать?"

ВАЖНО: Это приветствие, НЕ задавай первый вопрос из шаблона сейчас. Сначала дождись подтверждения готовности от кандидата."""
        else:
            # Следующий вопрос из шаблона (ВСЕГДА указывать для последующих сообщений)
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
            # Показываем только последние 4–6 сообщений для контекста, чтобы не раздувать промпт
            recent_history = context.conversation_history[-6:] if len(context.conversation_history) > 6 else context.conversation_history
            for msg in recent_history:
                role_label = "AI" if msg.role == "ai" else "Кандидат"
                prompt += f"\n{role_label}: {msg.message}"
        
        # История вопросов и ответов
        if context.session_history:
            prompt += "\n\nИСТОРИЯ ВОПРОСОВ И ОТВЕТОВ:"
            # Показываем последние 3–4 Q&A для контекста
            recent_qas = context.session_history[-4:] if len(context.session_history) > 4 else context.session_history
            for i, qa in enumerate(recent_qas, 1):
                prompt += f"\n{i}. [{qa.question_type.upper()}] {qa.question_text}"
                prompt += f"\n   Ответ кандидата: {qa.answer_text}"

            # Список всех уже заданных вопросов для предотвращения повторений
            # Чтобы не передавать в промпт всю историю, ограничиваемся последними 10 вопросами
            recent_for_dedup = context.session_history[-10:] if len(context.session_history) > 10 else context.session_history
            all_asked_questions = [qa.question_text for qa in recent_for_dedup]
            if all_asked_questions:
                prompt += f"\n\nУЖЕ ЗАДАННЫЕ ВОПРОСЫ (НЕЛЬЗЯ ПОВТОРЯТЬ):"
                for i, question in enumerate(all_asked_questions, 1):
                    prompt += f"\n{i}. {question}"
        
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
        if interview.customer_simulation and interview.customer_simulation.enabled:
            simulation_done = getattr(context, "simulation_done", False)
            if simulation_done:
                prompt += """

🎭 СИМУЛЯЦИЯ УЖЕ ПРОВЕДЕНА:
Кандидат уже ответил на вопрос по ситуации. НЕ задавай новых вопросов по сценарию. НЕ повторяй вопрос по ситуации.
ИНСТРУКЦИЯ: Заверши интервью — поблагодари кандидата и кратко подведи итог (например: «Спасибо за ответы. На этом интервью завершено.»)."""
            else:
                # Проверяем, подходит ли интервью к концу
                all_questions_asked = progress.current_question_index >= progress.total_questions
                time_low = remaining_minutes < 5
                
                if all_questions_asked or time_low:
                    prompt += f"""

🎭 МОДЕЛИРОВАНИЕ РЕАЛЬНОЙ РАБОЧЕЙ СИТУАЦИИ:
Интервью подходит к концу. Ты можешь провести симуляцию реальной рабочей ситуации.
- Роль клиента: {interview.customer_simulation.role or "не указана"}
- Описание сценария: {interview.customer_simulation.scenario or "не указан"}

ИНСТРУКЦИЯ: Сыграй роль этого клиента и проведи симуляцию. Веди себя соответственно сценарию.
Задай в этой симуляции не более 1–2 вопросов. После ответа кандидата заверши симуляцию, не продолжай разыгрывать сценарий.
Начни с вводной фразы, например: «Давайте представим ситуацию» или «Представьте, что…».
Оценивай реакцию кандидата на стрессовую ситуацию. После симуляции можно завершить интервью."""
        
        prompt += "\n\nЗадай следующий вопрос на основе этого контекста. Верни ответ ТОЛЬКО в JSON формате согласно структуре из системного промпта."
        
        return prompt


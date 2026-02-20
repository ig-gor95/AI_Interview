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


def _extract_question_text_from_raw(response_text: str) -> Optional[str]:
    """Извлекает текст вопроса из сырого ответа при ошибке парсинга JSON."""
    if not response_text or not response_text.strip():
        return None
    idx = response_text.find('"question"')
    if idx == -1:
        idx = 0
    rest = response_text[idx:]
    # "text": "..." — либо до закрывающей ", либо до конца (обрезанный JSON)
    m = re.search(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', rest)
    if not m:
        # обрезанный JSON без закрывающей кавычки: "text": "...
        m2 = re.search(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)', rest)
        if m2:
            s = m2.group(1).strip()
            if 5 < len(s) <= 500:
                return s.replace("\\n", "\n").replace('\\"', '"')
        return None
    s = m.group(1)
    if s and 5 < len(s) < 500:
        return s.replace("\\n", "\n").replace('\\"', '"')
    return None


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
            
            prompt = f"""Вы - Анна, приятная AI-интервьюер, проводящая собеседование на позицию: {session_params.get('position', 'N/A')}.

Следующий вопрос, который нужно задать: "{specific_question}"

Задайте этот вопрос естественно, в {session_params.get('personality', 'профессиональной')} манере.
Если кандидат уже частично ответил на этот вопрос, задайте уточняющий вопрос или перейдите к следующей теме.
Вопрос должен быть кратким и понятным."""
        else:
            # Generate question based on context
            prompt = f"""Вы - Анна, приятная AI-интервьюер, проводящая собеседование на позицию: {session_params.get('position', 'N/A')}.

Сгенерируйте следующий вопрос (вопрос №{question_index + 1}) для интервью на основе:
- Позиция: {session_params.get('position', 'N/A')}
- Критерии оценки: {session_params.get('evaluation_criteria', [])}
- Тип интервью: {session_params.get('interview_type', 'скрининг')}

Задайте релевантный вопрос в {session_params.get('personality', 'профессиональной')} манере.
Вопрос должен быть кратким и сфокусированным на оценке пригодности кандидата для роли."""

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
        
        prompt = f"""Вы - Анна, приятная AI-интервьюер, проводящая {interview_type} собеседование на позицию: {position}"""

        if company:
            prompt += f" в компании {company}"

        prompt += f"""

Ваша роль:
- Проводите интервью в {personality_desc} манере
- Задавайте релевантные вопросы на основе требований к позиции
- Активно слушайте и задавайте уточняющие вопросы при необходимости
- Держите ответы краткими и профессиональными
- Направляйте разговор естественно
"""

        if evaluation_criteria:
            prompt += f"\nСфокусируйтесь на оценке: {', '.join(evaluation_criteria[:5])}"

        prompt += """
- Если вам нужно уточнение, спросите: "Не могли бы вы уточнить?"
- Если вы не расслышали, спросите: "Не могли бы вы повторить?"
- При переходе к следующему вопросу используйте естественные переходы
"""
        
        return prompt
    
    async def analyze_transcript(
        self,
        transcript: List[Dict[str, Any]],
        session_params: Dict[str, Any],
        evaluation_criteria: Any  # List[str] or List[dict] with id, criterion_name, is_required
    ) -> Dict[str, Any]:
        """
        Analyze interview transcript using DeepSeek API for evaluation
        
        Args:
            transcript: List of transcript messages
            session_params: Session configuration
            evaluation_criteria: List of criterion names (str) or List[dict] with id, criterion_name, is_required
            
        Returns:
            Analysis results with observations, strengths, improvements, criterionResults
        """
        # Normalize criteria to list of dicts for processing
        criteria_objs = []
        criteria_names = []
        for c in (evaluation_criteria or []):
            if isinstance(c, dict):
                criteria_objs.append({
                    "id": str(c.get("id", "")),
                    "criterion_name": c.get("criterion_name", str(c)),
                    "is_required": c.get("is_required", True),
                })
                criteria_names.append(c.get("criterion_name", str(c)))
            else:
                criteria_objs.append({"id": "", "criterion_name": str(c), "is_required": True})
                criteria_names.append(str(c))

        # Build transcript text
        transcript_text = "\n".join([
            f"{msg.get('role', 'unknown')}: {msg.get('message', '')}"
            for msg in transcript
        ])
        
        criteria_list_str = '; '.join([
            f"{c['criterion_name']} (обязательный)" if c['is_required'] else f"{c['criterion_name']} (желательный)"
            for c in criteria_objs
        ])
        position = session_params.get('position', 'N/A')
        company = session_params.get('company', '')
        goals = session_params.get('goals', [])
        focus_areas = session_params.get('focus_areas', [])
        expected_knowledge = session_params.get('expected_knowledge', [])
        role_context = session_params.get('role_context', '')
        
        goals_str = '\n'.join([f"- {g}" for g in goals]) if goals else "Not specified"
        focus_areas_str = ', '.join(focus_areas) if focus_areas else "Not specified"
        expected_knowledge_str = '\n'.join([f"- {k}" for k in expected_knowledge]) if expected_knowledge else "Not specified"
        
        system_prompt = f"""You are an expert HR analyst evaluating a job interview transcript.

Position: {position}
Company: {company}
Role Context: {role_context if role_context else "Not specified"}
Goals: {goals_str}
Focus Areas: {focus_areas_str}
Expected Knowledge: {expected_knowledge_str}
Evaluation Criteria: {criteria_list_str}

IMPORTANT NOTE ABOUT SPEECH RECOGNITION:
- Candidate responses were obtained through voice-to-text transcription
- May contain transcription errors, especially in:
  * English technical terms (e.g., "Фигма" instead of "Figma", "джира" instead of "Jira")
  * Company names, tools, technologies
  * Abbreviations and acronyms
- When analyzing, try to understand the candidate's intent and infer the correct spelling of technical terms
- Focus on the content and meaning rather than exact wording

CRITICAL RULE FOR EVALUATION CRITERIA:
- You can ONLY evaluate criteria that were actually checked during the interview
- If a criterion was NOT mentioned or checked in the interview questions, you MUST mark it as:
  * passes: 0 (unknown/not checked)
  * justification: "Критерий не был проверен в ходе интервью"
- DO NOT make negative conclusions about criteria that were not checked
- DO NOT assume candidate doesn't meet a criterion just because it wasn't asked
- ONLY evaluate criteria where you have actual evidence from candidate's responses

For each criterion: (1) Determine if the candidate meets the criterion using a 3-level scale:
  1 = подходит (clearly meets the criterion)
  0 = возможно подойдет (partially meets or unclear)
  -1 = не подходит (does not meet the criterion)
(2) Extract the FACT from candidate's responses (e.g. "опыт 4 года" for experience requirement).
(3) Provide a brief justification. Example: criterion "Опыт работы не менее 3 лет" + candidate said "4 года" -> passes: 1, fact: "опыт 4 года", justification: "Кандидат соответствует требованию".
Also provide a numeric score 0-100 for each criterion."""
        
        criteria_json_example = ",\n        ".join([f'"{c["criterion_name"]}": {{"score": <0-100>, "justification": "<text>"}}' for c in criteria_objs])
        criteria_with_ids = [c for c in criteria_objs if c.get("id")]
        criterion_results_example = ",\n        ".join([
            f'{{"criterionId": "{c["id"]}", "criterionName": "{c["criterion_name"]}", "passes": "<-1|0|1>", "fact": "<extracted from candidate>", "justification": "<brief>", "score": <0-100>}}'
            for c in criteria_with_ids
        ])
        criterion_results_section = f',\n    "criterionResults": [\n        {criterion_results_example}\n    ]' if criterion_results_example else ""
        
        user_prompt = f"""Analyze this interview transcript and provide:

1. Overall assessment score (0-100)
2. Summary of the interview
3. For EACH evaluation criterion: passes (1=подходит, 0=возможно, -1=не подходит), fact (what candidate said), justification, score (0-100)
4. Observations by category (stressHandling, empathy, problemSolving, conflictResolution, communication)
5. Strengths (at least 3)
6. Areas for improvement (at least 2)
7. Key effective phrases used by candidate
8. Key phrases that could be improved
9. Recommendation on readiness to work

Format your response as JSON:
{{
    "score": <number 0-100>,
    "summary": "<text>",
    "readiness": "<text>",
    "criterionScores": {{
        {criteria_json_example}
    }}{criterion_results_section},
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
            max_tokens=4000
        )

        # Parse JSON response (DeepSeek sometimes wraps in markdown)
        import json
        import re

        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError as e:
                print(f"[GPT-Eval] JSON parse error: {e}")
                print(f"[GPT-Eval] Raw response (first 1000 chars): {response[:1000]}")
                pass

        # Fallback: return structured response
        print(f"[GPT-Eval] No valid JSON found in response. Using fallback.")
        print(f"[GPT-Eval] Raw response: {response[:1000]}")
        fallback_criterion_scores = {c["criterion_name"]: {"score": 50, "justification": "Evaluation incomplete"} for c in criteria_objs}
        fallback_result = {
            "score": 75,
            "summary": response[:500] if response else "Analysis completed",
            "readiness": "Further evaluation needed",
            "criterionScores": fallback_criterion_scores,
            "observations": {},
            "strengths": [],
            "improvements": [],
            "keyPhrases": {"effective": [], "toImprove": []},
            "recommendation": "Review transcript manually"
        }
        if criteria_with_ids:
            fallback_result["criterionResults"] = [
                {"criterionId": c["id"], "criterionName": c["criterion_name"], "passes": False, "fact": None, "justification": "Evaluation incomplete", "score": 50}
                for c in criteria_with_ids
            ]
        return fallback_result

    def analyze_answer_quality(
        self,
        question: str,
        answer: str
    ) -> str:
        """
        Analyze the quality of a candidate's answer

        Args:
            question: The interview question
            answer: The candidate's answer

        Returns:
            Quality assessment: "complete", "partial", or "insufficient"
        """
        # Basic quality checks
        answer_length = len(answer.strip())

        # Insufficient answer indicators
        if answer_length < 20:
            return "insufficient"

        answer_lower = answer.lower()

        # Check for evasive responses
        evasive_phrases = [
            "не знаю", "не помню", "может быть", "наверное",
            "не уверен", "сложно сказать", "затрудняюсь ответить"
        ]
        if any(phrase in answer_lower for phrase in evasive_phrases) and answer_length < 50:
            return "insufficient"

        # Check for yes/no only answers
        simple_answers = ["да", "нет", "да.", "нет.", "конечно", "разумеется"]
        if answer.strip().lower() in simple_answers:
            return "insufficient"

        # Partial answer indicators (20-100 chars, not very detailed)
        if answer_length < 100:
            return "partial"

        # Check for good answer indicators (examples, details, specific information)
        quality_indicators = [
            "например", "к примеру", "в частности", "конкретно",
            "работал", "делал", "использовал", "применял",
            "проект", "команда", "результат", "достижение",
            "опыт", "практика", "задача", "решение"
        ]

        indicator_count = sum(1 for indicator in quality_indicators if indicator in answer_lower)

        # Complete answer: detailed with examples
        if answer_length >= 100 and indicator_count >= 2:
            return "complete"
        elif answer_length >= 150:
            return "complete"
        else:
            return "partial"

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
            # API без состояния: каждый запрос независим, модель не «помнит» прошлые вызовы.
            # Поэтому каждый раз отправляем полный контекст: системные правила + текущее состояние
            # (история, прогресс, последний ответ) — иначе у модели нет информации для следующего вопроса.
            system_prompt = self._build_session_system_prompt(context)
            is_resume = len(context.conversation_history) > 1
            user_prompt = self._build_session_user_prompt(context, is_resume=is_resume)

            if self.provider == "deepseek":
                user_prompt += " Only valid JSON, no text before/after."

            # Подготовка сообщений
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Логирование промптов для проверки (что уходит в DeepSeek)
            print("\n" + "=" * 60 + "\n[AI] DEEPSEEK REQUEST PROMPTS\n" + "=" * 60)
            print(f"[AI] Model: {self.model_gpt}")
            print(f"[AI] System prompt length: {len(system_prompt)}, user prompt length: {len(user_prompt)}")
            print("\n--- SYSTEM PROMPT ---\n")
            print(system_prompt)
            print("\n--- USER PROMPT ---\n")
            print(user_prompt)
            print("\n" + "=" * 60 + "\n")
            
            # Prepare API call parameters
            # Optimized for faster responses:
            # - Lower temperature for more deterministic (faster) responses
            # - Reduced max_tokens since interview questions are typically concise
            api_params = {
                "model": self.model_gpt,
                "messages": messages,
                "temperature": 0.3,  # Reduced from 0.5 for more deterministic responses (less repetition)
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
                fallback_text = "Что бы вы хотели уточнить или добавить?"
                fallback_response = {
                    "question": {
                        "text": fallback_text,
                        "type": "main",
                        "isClarifying": False,
                        "isDynamic": False,
                        "parentSessionQuestionAnswerId": None
                    },
                    "metadata": {
                        "needsClarification": False,
                        "answerQuality": "complete",
                        "shouldMoveNext": True,
                        "estimatedTimeRemaining": 25,
                        "interviewComplete": False,
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
                # Сначала пробуем вытащить JSON-блок и починить
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
                # Повторный запрос: просим ответить ещё раз только валидным JSON
                print(f"[AI] Requesting DeepSeek to respond again with valid JSON only")
                retry_user = user_prompt + "\n\n[Твой предыдущий ответ содержал невалидный JSON. Ответь ещё раз только валидным JSON по структуре из системного промпта, без лишнего текста.]"
                api_params_retry = {**api_params, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": retry_user}]}
                try:
                    if api_params_retry.get("stream"):
                        response_text = await self._handle_streaming_response(api_params_retry)
                    else:
                        response = await self.client.chat.completions.create(**api_params_retry)
                        response_text = response.choices[0].message.content
                except Exception as retry_err:
                    print(f"[AI] Retry request failed: {retry_err}")
                    response_text = None
                if response_text and response_text.strip():
                    fixed_retry = _fix_llm_json(response_text)
                    try:
                        response_data = json.loads(fixed_retry)
                        result = GPTResponse(**response_data)
                        print(f"[AI] JSON parsed successfully after retry")
                        return result
                    except json.JSONDecodeError:
                        json_match_retry = re.search(r'\{[\s\S]*\}', response_text)
                        if json_match_retry:
                            try:
                                response_data = json.loads(_fix_llm_json(json_match_retry.group()))
                                result = GPTResponse(**response_data)
                                print(f"[AI] JSON parsed from extracted block after retry")
                                return result
                            except json.JSONDecodeError:
                                pass
                # Fallback: извлекаем текст из ответа (первого или повторного) или нейтральная реплика
                extracted = _extract_question_text_from_raw(response_text) if response_text else None
                fallback_text = extracted if extracted else "Что бы вы хотели уточнить или добавить?"
                preview = fallback_text[:80] + "..." if len(fallback_text) > 80 else fallback_text
                print(f"[AI] Using fallback response after retry/parse failure, question: {preview}")
                fallback = {
                    "question": {
                        "text": fallback_text,
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
                        "interviewComplete": False,
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
        
        prompt = f"""Ты - Анна, приятная AI-интервьюер (женщина), проводящая скрининг-собеседование в компанию {interview.company or "компанию"} на позицию {interview.position}.

ВАЖНО: Это скрининг-собеседование (первичный отбор), а не полное интервью. Цель - быстро оценить базовые компетенции, мотивацию и коммуникативные навыки кандидата."""

        # Добавляем информацию о критериях оценки
        must_have = getattr(interview, 'evaluation_criteria_must_have', None) or []
        nice_to_have = getattr(interview, 'evaluation_criteria_nice_to_have', None) or []

        if must_have or nice_to_have:
            prompt += "\n\nКРИТЕРИИ ОЦЕНКИ КАНДИДАТА:"

        if must_have:
            prompt += "\n\nОБЯЗАТЕЛЬНЫЕ КРИТЕРИИ (must-have) - КРИТИЧЕСКИ ВАЖНО ПРОВЕРИТЬ ВСЕ:"
            for i, criterion in enumerate(must_have, 1):
                prompt += f"\n{i}. {criterion}"
            prompt += "\n\nВАЖНО: Ты ОБЯЗАН задать вопросы, чтобы проверить ВСЕ обязательные критерии."
            prompt += "\nЕсли основные вопросы из шаблона не покрывают какой-то обязательный критерий - задай дополнительный уточняющий вопрос."
            prompt += "\nНЕ делай выводов о критерии, если не задал вопрос для его проверки!"

        if nice_to_have:
            prompt += "\n\nЖЕЛАТЕЛЬНЫЕ КРИТЕРИИ (nice-to-have) - проверяй по возможности:"
            for i, criterion in enumerate(nice_to_have, 1):
                prompt += f"\n{i}. {criterion}"
            prompt += "\nЭти критерии желательно проверить, но не обязательно. Если времени мало или кандидат уже много рассказал - можно пропустить."

        prompt += """

ОСОБЕННОСТИ РАСПОЗНАВАНИЯ РЕЧИ:
- Ответы кандидата получены через голосовое распознавание речи (Speech-to-Text)
- Могут содержаться ошибки транскрипции, особенно в:
  * Английских технических терминах (например, "Фигма" вместо "Figma", "джира" вместо "Jira")
  * Специальных названиях компаний, инструментов, технологий
  * Сокращениях и аббревиатурах
- При анализе ответов старайся понять намерение кандидата и догадаться о правильном написании технических терминов
- Если ответ кажется странным или непонятным, возможно это ошибка транскрипции - попробуй переспросить или уточнить

ПРАВИЛА ПОВЕДЕНИЯ:

0. ПРИВЕТСТВИЕ И ПРОВЕРКА ГОТОВНОСТИ (только при старте сессии):
   - При первом сообщении поздоровайся и представься: "Здравствуйте! Меня зовут Анна, я провожу скрининг-собеседование в компанию {interview.company or "компанию"} на позицию {interview.position}. Готовы ли вы начать?"
   - Если кандидат отвечает, что готов (да, конечно, готов и т.д.) - задай первый вопрос из шаблона
   - Если кандидат отвечает, что не готов (нет, подождите, не готов и т.д.) - вежливо попроси подать сигнал о готовности: "Хорошо, пожалуйста, дайте знать, когда будете готовы начать"
   - Если ответ неясный - уточни готовность

1. СТРОГО СЛЕДУЙ СЦЕНАРИЮ - КРИТИЧЕСКИ ВАЖНО:
   - Ты ОБЯЗАН задавать вопросы СТРОГО ПО ПОРЯДКУ из заданного шаблона
   - НЕ придумывай свои вопросы
   - НЕ задавай вопросы не из шаблона (кроме уточняющих подвопросов, которые указаны в шаблоне)
   - НЕ меняй порядок вопросов
   - Если в контексте указан "Следующий вопрос шаблона" - ты ОБЯЗАН задать именно этот вопрос
   - isDynamic всегда должен быть false (кроме специального случая проверки непокрытых критериев - см. раздел 7)"""
        
        prompt += f"""

2. ОСТАВШЕЕСЯ ВРЕМЯ:
   - Если времени < 5 минут: задавай только вопросы из шаблона, без уточнений
   - Если времени достаточно: можешь использовать уточняющие подвопросы из шаблона
   - Если время истекло: интервью завершено

3. УТОЧНЯЮЩИЕ ВОПРОСЫ ИЗ ШАБЛОНА:
   - Используй ТОЛЬКО уточняющие подвопросы, которые указаны в шаблоне для текущего вопроса
   - Если в шаблоне нет подвопросов для текущего вопроса - НЕ задавай уточняющих вопросов
   - Задавай уточняющие вопросы по одному
   - После уточняющего подвопроса переходи к следующему основному вопросу из шаблона

4. ПЕРЕСПРОС ПРИ НЕВНЯТНОМ ОТВЕТЕ (МАКСИМУМ 1 РАЗ):
   - Если кандидат дал невнятный ответ (< 20 символов, "не знаю", "не помню"), можешь переспросить ОДИН РАЗ
   - Используй простое переформулирование: "Можете рассказать подробнее?" или "Расскажите, пожалуйста, чуть детальнее"
   - НЕ перефразируй вопрос полностью - просто попроси уточнить
   - После одного переспроса переходи к следующему вопросу из шаблона, даже если ответ всё ещё невнятный

5. ЗАДАВАЙ ВОПРОСЫ ПО ОДНОМУ - никогда не задавай несколько вопросов сразу

6. НЕ ПОВТОРЯЙ ВОПРОСЫ - СТРОГО ЗАПРЕЩЕНО:
   - НИКОГДА не задавай вопрос, который уже был задан в этом интервью
   - Все заданные вопросы перечислены в разделе "УЖЕ ЗАДАННЫЕ ВОПРОСЫ"
   - Если вопрос был задан - переходи к следующему вопросу из шаблона
   - НЕ задавай похожие вопросы с той же темой

7. ПРОВЕРКА НЕПОКРЫТЫХ КРИТЕРИЕВ И ЗАВЕРШЕНИЕ ИНТЕРВЬЮ (КРИТИЧЕСКИ ВАЖНО):

   КОГДА ВСЕ ВОПРОСЫ ИЗ ШАБЛОНА ЗАДАНЫ (current_question_index >= total_questions):

   Шаг 1: АНАЛИЗ НЕПОКРЫТЫХ КРИТЕРИЕВ
   - Проверь, какие ОБЯЗАТЕЛЬНЫЕ критерии (must-have) НЕ были проверены в ходе интервью
   - Критерий считается "непокрытым", если:
     * О нём НЕ спрашивали напрямую
     * Кандидат НЕ упоминал его в своих ответах
     * Нет информации для оценки этого критерия

   Шаг 2: РЕШЕНИЕ О ДОПОЛНИТЕЛЬНЫХ ВОПРОСАХ
   - Если непокрытых ОБЯЗАТЕЛЬНЫХ критериев >= 3 И есть время (> 3 минут):
     * Задай 1-2 целевых вопроса для проверки самых важных непокрытых критериев
     * Укажи isDynamic = true для этих вопросов
     * Формулируй вопрос прямо и конкретно: "Расскажите о вашем опыте с [критерий]"

   - Если непокрытых критериев < 3 ИЛИ времени мало (<= 3 минут):
     * Сразу переходи к Шагу 3 (завершение)

   Шаг 3: ЗАВЕРШЕНИЕ ИНТЕРВЬЮ
   - После проверки критериев (или если она не нужна) ОБЯЗАТЕЛЬНО заверши интервью
   - НЕ задавай вопросы повторно
   - НЕ придумывай новые вопросы (кроме проверки критериев из Шага 2)
   - Если есть симуляция и она НЕ проведена - можешь провести её перед завершением
   - Заверши интервью фразой: "Спасибо за ваши ответы. На этом скрининг-собеседование завершено. Мы свяжемся с вами в ближайшее время."
   - Установи interviewComplete = true в metadata"""
        
        # Добавляем информацию о customer_simulation, если оно есть
        if interview.customer_simulation and interview.customer_simulation.enabled:
            if getattr(context, "simulation_done", False):
                prompt += """

8. СИМУЛЯЦИЯ УЖЕ ПРОВЕДЕНА:
   - Симуляция завершена - НЕ задавай новых вопросов по сценарию
   - Заверши интервью (см. раздел 7, Шаг 3)"""
            else:
                prompt += f"""

8. МОДЕЛИРОВАНИЕ РЕАЛЬНОЙ РАБОЧЕЙ СИТУАЦИИ (customer_simulation):
   - Проводится только в конце интервью (когда все основные вопросы заданы)
   - Задай 1-2 вопроса в роли клиента, затем сразу заверши интервью
   - Начни с вводной фразы: "Давайте представим ситуацию" или "Представьте, что..."
   - Роль клиента: {interview.customer_simulation.role or "не указана"}
   - Сценарий: {interview.customer_simulation.scenario or "не указан"}
   - Веди себя как указанный клиент (недовольный клиент, гость, заказчик и т.д.)
   - После ответа кандидата - сразу заверши интервью (см. раздел 7, Шаг 3)"""
        
        prompt += f"""

СТИЛЬ ОБЩЕНИЯ:
- Проводи интервью {personality_desc} образом
- Задавай вопросы из шаблона последовательно
- Держи ответы краткими и профессиональными
- Веди беседу естественно без излишних комментариев

9. РЕАКЦИИ НА ОТВЕТЫ КАНДИДАТА (МИНИМАЛЬНО И К МЕСТУ):
   - После ответа кандидата сразу переходи к следующему вопросу из шаблона
   - Можешь изредка (не чаще 1 раза на 3-4 вопроса) кратко отреагировать:
     * "Спасибо", "Понятно", "Хорошо"
   - НЕ комментируй каждый ответ
   - НЕ давай оценочные суждения ("Отличный ответ", "Интересно")
   - Цель: эффективное интервью, а не светская беседа"""
        
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
        """Формирует пользовательский промпт: только переменные данные (правила уже в system)."""
        interview = context.interview
        remaining_minutes = context.remaining_time.minutes
        remaining_seconds = context.remaining_time.seconds
        
        # Краткий контекст без дублирования правил из system
        prompt = f"Позиция: {interview.position}. Компания: {interview.company or 'Не указана'}. Время: {remaining_minutes} мин {remaining_seconds} сек."
        if is_resume:
            prompt += " [Сессия восстановлена.]"
        if remaining_minutes < 5:
            prompt += " Мало времени."
        elif remaining_minutes < 10:
            prompt += " Мало времени, фокус на главном."
        
        # Сначала собираем список всех уже заданных вопросов для проверки дубликатов
        all_asked_questions = []
        if context.session_history:
            recent_for_dedup = context.session_history[-10:] if len(context.session_history) > 10 else context.session_history
            all_asked_questions = [qa.question_text for qa in recent_for_dedup]
            
            # Также извлекаем вопросы из conversation_history (включая только что заданные, еще без ответа)
            ai_messages_from_history = [
                msg.message for msg in context.conversation_history 
                if msg.role == "ai" and msg.message.strip()
            ]
            for ai_msg in ai_messages_from_history:
                msg_lower = ai_msg.lower()
                is_greeting = (
                    "готовы ли вы начать" in msg_lower or 
                    "здравствуйте" in msg_lower or
                    (len(ai_msg) < 30 and "?" not in ai_msg)
                )
                is_question = (
                    len(ai_msg) > 20 and 
                    not is_greeting and
                    ("?" in ai_msg or ai_msg.strip().startswith(("Расскажите", "Какие", "Как", "Что", "Где", "Когда", "Почему", "Опишите", "Объясните")))
                )
                if is_question:
                    question_normalized = ai_msg.strip()
                    msg_words = set(msg_lower.split())
                    is_duplicate = False
                    for q in all_asked_questions:
                        q_lower = q.lower()
                        if q.strip().lower() == question_normalized.lower():
                            is_duplicate = True
                            break
                        if len(q) > 30 and len(question_normalized) > 30:
                            if question_normalized[:50].lower() == q[:50].lower():
                                is_duplicate = True
                                break
                        q_words = set(q_lower.split())
                        common_keywords = msg_words & q_words
                        if len(common_keywords) >= 3 and len(msg_words) >= 5 and len(q_words) >= 5:
                            key_phrases = [
                                ("опыт работы", "опыт", "работал"),
                                ("ключевые задачи", "задачи", "решали"),
                                ("инструменты", "использовали", "используете"),
                                ("специальность", "профессия", "должность"),
                            ]
                            for phrase_group in key_phrases:
                                if any(p in msg_lower for p in phrase_group) and any(p in q_lower for p in phrase_group):
                                    is_duplicate = True
                                    break
                            if is_duplicate:
                                break
                    if not is_duplicate:
                        all_asked_questions.append(question_normalized)
        
        is_first_message = len(context.conversation_history) == 0
        if is_first_message:
            prompt += "\n\nПервое сообщение: задай приветствие и спроси о готовности (не задавай вопрос из шаблона)."
        else:
            if context.current_interview_question:
                current_q = context.current_interview_question
                print(f"[UserPrompt] Adding template question to prompt: '{current_q.text}' (index {current_q.order_index})")
                prompt += f"\n\nСлед. вопрос шаблона ({current_q.order_index + 1}): {current_q.text}"
                if current_q.clarifying_questions:
                    for i, cq in enumerate(current_q.clarifying_questions[:3], 1):
                        prompt += f"\n  Подвопрос {i}: {cq}"
                # Проверяем, не задавали ли уже похожий вопрос
                template_q_lower = current_q.text.lower()
                already_asked_similar = False
                if all_asked_questions:
                    for asked_q in all_asked_questions:
                        asked_q_lower = asked_q.lower()
                        template_words = set(template_q_lower.split())
                        asked_words = set(asked_q_lower.split())
                        if len(template_words & asked_words) >= 3:
                            key_phrases = [
                                ("опыт работы", "опыт", "работал", "работали"),
                                ("специальность", "сфере", "профессии", "должности"),
                                ("метрики", "показатели", "kpi"),
                                ("a/b", "тестирование", "эксперименты"),
                            ]
                            for phrase_group in key_phrases:
                                if any(p in template_q_lower for p in phrase_group) and any(p in asked_q_lower for p in phrase_group):
                                    already_asked_similar = True
                                    break
                            if already_asked_similar:
                                break
                if already_asked_similar:
                    prompt += "\n(Похожий вопрос уже задан — переходи к следующему или заверши.)"
            else:
                print(f"[UserPrompt] No current_interview_question - all template questions asked or none available")
                prompt += "\n\nВСЕ ВОПРОСЫ ШАБЛОНА ЗАДАНЫ - СЛЕДУЙ ПРОТОКОЛУ ЗАВЕРШЕНИЯ (см. раздел 7):"
                prompt += "\n\nШаг 1: Проверь ОБЯЗАТЕЛЬНЫЕ критерии (must-have):"

                # Добавляем список обязательных критериев для проверки
                must_have = getattr(interview, 'evaluation_criteria_must_have', None) or []
                if must_have:
                    prompt += f"\nОбязательных критериев: {len(must_have)}"
                    prompt += "\n\nПроанализируй диалог и Q&A - какие критерии НЕ проверены?"
                    prompt += f"\nКритерий считается непроверенным, если о нём не спрашивали и кандидат его не упоминал."
                    prompt += f"\n\nШаг 2: Реши о дополнительных вопросах:"
                    prompt += f"\n- Если непокрытых ОБЯЗАТЕЛЬНЫХ критериев >= 3 И времени > 3 минут:"
                    prompt += f"\n  → Задай 1-2 целевых вопроса для проверки ключевых критериев (isDynamic = true)"
                    prompt += f"\n- Иначе → сразу переходи к Шагу 3"
                else:
                    prompt += "\nОбязательных критериев нет - сразу переходи к Шагу 3"

                prompt += "\n\nШаг 3: Завершение интервью:"
                if interview.customer_simulation and interview.customer_simulation.enabled and not getattr(context, "simulation_done", False):
                    prompt += "\n- Можно провести симуляцию (если еще не проведена), затем заверши"
                else:
                    prompt += "\n- Заверши интервью с благодарностью"
                prompt += "\n- Установи interviewComplete = true в metadata"
                prompt += "\n- НЕ задавай вопросы повторно, НЕ придумывай новые вопросы"
        
        # История: последние сообщения и Q&A (коротко)
        if context.conversation_history:
            recent = context.conversation_history[-4:] if len(context.conversation_history) > 4 else context.conversation_history
            prompt += "\n\nДиалог:"
            for msg in recent:
                r = "AI" if msg.role == "ai" else "Кандидат"
                prompt += f"\n{r}: {msg.message[:200]}{'...' if len(msg.message) > 200 else ''}"
        if context.session_history:
            recent_qas = context.session_history[-3:] if len(context.session_history) > 3 else context.session_history
            prompt += "\n\nQ&A:"
            for qa in recent_qas:
                prompt += f"\n- [{qa.question_type}] {qa.question_text[:100]}{'...' if len(qa.question_text) > 100 else ''}"
                prompt += f"\n  Ответ: {qa.answer_text[:150]}{'...' if len(qa.answer_text) > 150 else ''}"
            if all_asked_questions:
                prompt += "\n\nУже заданы (не повторять):"
                for q in (all_asked_questions[-7:] if len(all_asked_questions) > 7 else all_asked_questions):
                    prompt += f"\n- {q[:120]}{'...' if len(q) > 120 else ''}"
        if context.user_response:
            prompt += f"\n\nПОСЛЕДНИЙ ОТВЕТ КАНДИДАТА:"
            prompt += f"\n{context.user_response.text[:400]}{'...' if len(context.user_response.text) > 400 else ''}"
        progress = context.question_progress
        prompt += f"\n\nПрогресс: вопрос {progress.current_question_index + 1}/{progress.total_questions}, отвечено {progress.answered_questions}."
        
        if interview.customer_simulation and interview.customer_simulation.enabled:
            simulation_done = getattr(context, "simulation_done", False)
            if simulation_done:
                prompt += "\n\nСимуляция проведена — заверши интервью (поблагодари, итог)."
            else:
                if progress.current_question_index >= progress.total_questions or remaining_minutes < 5:
                    prompt += f"\n\nМожно симуляция: роль {interview.customer_simulation.role or 'клиент'}, сценарий: {(interview.customer_simulation.scenario or '')[:80]}..."
        prompt += "\n\nОтветь только валидным JSON по структуре из системного промпта."
        return prompt


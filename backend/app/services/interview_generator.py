"""Interview Generation Service - AI-powered generation of interview questions and criteria"""
import json
import re
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from app.config import settings


class InterviewGeneratorService:
    """Service for generating interview content using DeepSeek AI"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com"
        )

    def _fix_json(self, text: str) -> str:
        """Fix common LLM JSON output issues"""
        if not text or not text.strip():
            return text
        s = text.strip()
        # Remove markdown code blocks
        if s.startswith("```"):
            s = re.sub(r"^```(?:json)?\s*", "", s)
            s = re.sub(r"\s*```$", "", s)
        # Remove trailing commas
        s = re.sub(r",\s*([}\]])", r"\1", s)
        return s

    async def generate_interview_content(
        self,
        job_description: str,
        position: Optional[str] = None
    ) -> Dict:
        """
        Generate interview questions, clarifications, criteria and simulation scenario

        Args:
            job_description: Full job description
            position: Job title (optional)

        Returns:
            Dict with keys:
                - questions: List[Dict] with 'text' and optional 'clarifications'
                - mustHaveRequirements: List[str]
                - niceToHaveRequirements: List[str]
                - simulation: Dict with 'role' and 'scenario'
        """

        prompt = f"""Ты эксперт по найму и проведению собеседований. На основе описания вакансии создай структурированный контент для AI-интервью для первичного отбора кандидатов (скрининг).

Описание вакансии:
{job_description}

{"Позиция: " + position if position else ""}

Сгенерируй следующее (СТРОГО в указанном порядке):

1. **3-5 обязательных требований (Must Have)** - критичные требования к кандидату, без которых он не подходит на позицию. Например: "Опыт работы в сфере от 2 лет", "Готовность к работе по сменному графику", "Проживание в городе N".

2. **3-5 желательных требований (Nice to Have)** - дополнительные плюсы, которые было бы хорошо иметь, но не критичны. Например: "Знание английского языка", "Опыт работы с CRM", "Высшее образование".

3. **5-7 вопросов для скрининг-собеседования** - КРИТИЧЕСКИ ВАЖНО: каждый вопрос ОБЯЗАН быть направлен на проверку КОНКРЕТНЫХ критериев из пунктов 1 и 2. Вопросы должны позволить выявить, соответствует ли кандидат обязательным и желательным требованиям.

   Для каждого вопроса:
   - Сформулируй основной вопрос так, чтобы ответ кандидата позволил проверить конкретные требования
   - Добавь 2-3 уточняющих подвопроса для более глубокого понимания
   - Убедись, что все требования из пунктов 1 и 2 покрыты вопросами

   Фокус на коммуникации, мотивации, базовых навыках и стрессоустойчивости, подходящих для первичного отбора (скрининга), а не для глубокого технического интервью.

4. **Сценарий моделирования реальной рабочей ситуации** - стрессовая ситуация с клиентом/посетителем, которую AI будет симулировать в конце интервью для оценки реакции кандидата и проверки стрессоустойчивости.

Верни результат СТРОГО в формате JSON:
{{
  "questions": [
    {{
      "text": "Основной вопрос",
      "clarifications": ["Уточняющий вопрос 1", "Уточняющий вопрос 2"]
    }}
  ],
  "mustHaveRequirements": ["Требование 1", "Требование 2"],
  "niceToHaveRequirements": ["Требование 1", "Требование 2"],
  "simulation": {{
    "role": "Роль клиента (например: недовольный клиент, агрессивный гость)",
    "scenario": "Подробное описание ситуации - что произошло, почему клиент недоволен, что он требует"
  }}
}}

Только JSON, без дополнительного текста."""

        try:
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "Ты эксперт по найму. Генерируешь только валидный JSON без дополнительного текста."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI")

            # Fix and parse JSON
            fixed_content = self._fix_json(content)
            result = json.loads(fixed_content)

            # Validate structure
            if not isinstance(result.get("questions"), list):
                raise ValueError("Invalid questions format")
            if not isinstance(result.get("mustHaveRequirements"), list):
                raise ValueError("Invalid mustHaveRequirements format")
            if not isinstance(result.get("niceToHaveRequirements"), list):
                raise ValueError("Invalid niceToHaveRequirements format")
            if not isinstance(result.get("simulation"), dict):
                raise ValueError("Invalid simulation format")

            return result

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to generate interview content: {e}")

    async def generate_criteria_only(
        self,
        position: str,
        company: Optional[str] = None
    ) -> Dict[str, List[str]]:
        """
        Generate only evaluation criteria based on position

        Args:
            position: Job title
            company: Company name (optional)

        Returns:
            Dict with keys:
                - mustHaveRequirements: List[str]
                - niceToHaveRequirements: List[str]
        """

        prompt = f"""На основе названия вакансии сгенерируй критерии оценки кандидата для первичного отбора.

Позиция: {position}
{"Компания: " + company if company else ""}

Сгенерируй:
1. **3-5 обязательных требований (Must Have)** - без которых кандидат не подходит
2. **3-5 желательных требований (Nice to Have)** - дополнительные плюсы

Верни результат СТРОГО в формате JSON:
{{
  "mustHaveRequirements": ["Требование 1", "Требование 2", "Требование 3"],
  "niceToHaveRequirements": ["Требование 1", "Требование 2", "Требование 3"]
}}

Только JSON, без дополнительного текста."""

        try:
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "Ты эксперт по найму. Генерируешь только валидный JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI")

            fixed_content = self._fix_json(content)
            result = json.loads(fixed_content)

            # Validate structure
            if not isinstance(result.get("mustHaveRequirements"), list):
                raise ValueError("Invalid mustHaveRequirements format")
            if not isinstance(result.get("niceToHaveRequirements"), list):
                raise ValueError("Invalid niceToHaveRequirements format")

            return result

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to generate criteria: {e}")


# Singleton instance
_generator_service: Optional[InterviewGeneratorService] = None


def get_interview_generator_service() -> InterviewGeneratorService:
    """Get singleton instance of InterviewGeneratorService"""
    global _generator_service
    if _generator_service is None:
        _generator_service = InterviewGeneratorService()
    return _generator_service

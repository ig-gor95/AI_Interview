"""Lightweight transcript enhancement service - cleans up STT output without AI (no delays)."""
import re
from typing import Optional


# Слова-паразиты на русском (ээ, ммм, и т.д.)
FILLER_WORDS_RU = [
    r'\bээ+\b', r'\bэ+м+\b', r'\bм+\b', r'\bаа+\b', r'\bну+\b(?!\s+(?:да|нет|хорошо|ладно))',
    r'\bвот+\b(?!\s+(?:это|так|и))', r'\bкак\s+бы\b', r'\bтипа\b', r'\bблин\b', r'\bкароче\b',
    r'\bчё\b', r'\bзнаешь\b', r'\bпонимаешь\b', r'\bкороче\b', r'\bтак\s+сказать\b'
]

# Общие ошибки распознавания технических терминов
TECH_FIXES = {
    # Design tools
    r'\b(?:фигма|фигм|figm)\b': 'Figma',
    r'\b(?:скетч|sketch)\b': 'Sketch',

    # Development
    r'\b(?:апи|эй\s*пи\s*ай)\b': 'API',
    r'\b(?:гит|git)\b': 'Git',
    r'\b(?:гитхаб|github)\b': 'GitHub',
    r'\b(?:докер|docker)\b': 'Docker',
    r'\b(?:реакт|react)\b': 'React',
    r'\b(?:вью|vue)\b': 'Vue',
    r'\b(?:ноде|node)\b': 'Node',
    r'\b(?:питон|python)\b': 'Python',
    r'\b(?:джава|java)\b(?!script)': 'Java',
    r'\b(?:джаваскрипт|javascript)\b': 'JavaScript',
    r'\b(?:тайпскрипт|typescript)\b': 'TypeScript',

    # Project management
    r'\b(?:джира|jira)\b': 'Jira',
    r'\b(?:трелло|trello)\b': 'Trello',
    r'\b(?:слак|slack)\b': 'Slack',

    # Cloud
    r'\b(?:амазон|aws)\b': 'AWS',
    r'\b(?:эйзур|azure)\b': 'Azure',
    r'\b(?:гугл клауд|google cloud)\b': 'Google Cloud',
}


def enhance_transcript_fast(text: str) -> str:
    """
    Fast, non-AI transcript cleanup:
    - Remove filler words (ээ, ммм, etc.)
    - Fix common tech term transcription errors (Figma, API, Git, etc.)
    - Normalize whitespace

    This is FAST (< 1ms) and doesn't block real-time STT.
    For final results only - don't apply to interim results.

    Args:
        text: Raw transcript from Google Cloud Speech

    Returns:
        Enhanced transcript
    """
    if not text or not text.strip():
        return text

    result = text.lower()  # Работаем в нижнем регистре

    # 1. Удаляем слова-паразиты
    for pattern in FILLER_WORDS_RU:
        result = re.sub(pattern, '', result, flags=re.IGNORECASE)

    # 2. Исправляем технические термины
    for pattern, replacement in TECH_FIXES.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # 3. Нормализация пробелов
    result = re.sub(r'\s+', ' ', result)  # Множественные пробелы в один
    result = re.sub(r'\s+([.,!?;:])', r'\1', result)  # Убрать пробел перед пунктуацией
    result = result.strip()

    # 4. Первая буква заглавная
    if result:
        result = result[0].upper() + result[1:]

    return result


def should_enhance(text: str, is_final: bool) -> bool:
    """
    Decide whether to enhance transcript.
    - Only enhance final results (not interim)
    - Skip very short texts (< 5 chars)

    Args:
        text: Transcript text
        is_final: Whether this is final result from STT

    Returns:
        True if should enhance
    """
    return is_final and len(text.strip()) >= 5


# Example usage
if __name__ == "__main__":
    # Test cases
    test_cases = [
        "ээ я работал с фигмой и апи",
        "ммм использовал гит и докер",
        "ну вот я знаю реакт и питон",
        "как бы я типа работал с джирой",
    ]

    for test in test_cases:
        enhanced = enhance_transcript_fast(test)
        print(f"Original: {test}")
        print(f"Enhanced: {enhanced}")
        print()

#!/usr/bin/env python3
"""
Smoke test для проверки работоспособности backend после изменений.

Использование:
    # Из корня проекта:
    python backend/smoke_test.py
    
    # Или из директории backend:
    cd backend && python smoke_test.py
    
    # Или напрямую (если есть права на выполнение):
    ./backend/smoke_test.py

Тест проверяет:
- Импорты всех основных модулей
- Конфигурацию приложения
- Подключение к базе данных
- Инициализацию AI сервиса (DeepSeek)
- Инициализацию TTS сервиса (Google Cloud)
- Регистр анализаторов
- Сервис оценки
- FastAPI приложение и роуты
- Установленные зависимости
"""

import sys
import os
import asyncio
from pathlib import Path

# Добавляем backend в путь
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

# Цвета для вывода
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

# Счетчики результатов
passed = 0
failed = 0
warnings = 0

def test_passed(name):
    global passed
    passed += 1
    print_success(f"{name}")

def test_failed(name, error=None):
    global failed
    failed += 1
    if error:
        print_error(f"{name}: {error}")
    else:
        print_error(f"{name}")

def test_warning(name, msg=None):
    global warnings
    warnings += 1
    if msg:
        print_warning(f"{name}: {msg}")
    else:
        print_warning(f"{name}")

# Тесты
def test_imports():
    """Тест 1: Проверка импортов основных модулей"""
    print_header("Тест 1: Импорты модулей")
    
    try:
        from app.config import settings
        test_passed("app.config")
    except Exception as e:
        test_failed("app.config", str(e))
        return False
    
    try:
        from app.database import engine, AsyncSessionLocal, get_db
        test_passed("app.database")
    except Exception as e:
        test_failed("app.database", str(e))
        # Не останавливаем выполнение - продолжим другие тесты
        # return False
    
    try:
        from app.core import openai_service, tts_service, evaluation_service, analyzer_registry
        test_passed("app.core")
    except Exception as e:
        test_failed("app.core", str(e))
        return False
    
    try:
        from app.main import app
        test_passed("app.main")
    except Exception as e:
        test_failed("app.main", str(e))
        return False
    
    try:
        from app.services.openai_service import AIService
        test_passed("app.services.openai_service")
    except Exception as e:
        test_failed("app.services.openai_service", str(e))
    
    try:
        from app.services.google_cloud_tts_service import GoogleCloudTTSService
        test_passed("app.services.google_cloud_tts_service")
    except Exception as e:
        test_warning("app.services.google_cloud_tts_service", f"Не критично: {e}")
    
    try:
        from app.websocket import session
        test_passed("app.websocket.session")
    except Exception as e:
        test_failed("app.websocket.session", str(e))
    
    try:
        from app.api import auth, interviews, results, public
        test_passed("app.api routers")
    except Exception as e:
        test_failed("app.api routers", str(e))
    
    return True

def test_configuration():
    """Тест 2: Проверка конфигурации"""
    print_header("Тест 2: Конфигурация")
    
    try:
        from app.config import settings
        
        # Проверка обязательных настроек
        if not settings.database_url:
            test_failed("database_url не задан")
        else:
            test_passed(f"database_url: {settings.database_url[:30]}...")
        
        if not settings.deepseek_api_key:
            test_warning("deepseek_api_key не задан (проверьте .env)")
        else:
            test_passed(f"deepseek_api_key: {'*' * 20}...{settings.deepseek_api_key[-4:]}")
        
        test_passed(f"tts_service: {settings.tts_service}")
        test_passed(f"cors_origins: {settings.cors_origins}")
        
        return True
    except Exception as e:
        test_failed("Конфигурация", str(e))
        return False

async def test_database_connection():
    """Тест 3: Проверка подключения к базе данных"""
    print_header("Тест 3: Подключение к базе данных")
    
    try:
        from app.database import engine, AsyncSessionLocal
        from sqlalchemy import text
        
        # Проверка подключения
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.fetchone()
            if row and row[0] == 1:
                test_passed("Подключение к базе данных успешно")
            else:
                test_failed("Подключение к базе данных: неожиданный результат")
                return False
        
        # Проверка создания сессии
        async with AsyncSessionLocal() as session:
            test_passed("Создание сессии базы данных успешно")
        
        return True
    except Exception as e:
        test_failed("Подключение к базе данных", str(e))
        test_warning("Убедитесь, что PostgreSQL запущен и доступен")
        return False

def test_ai_service():
    """Тест 4: Проверка AI сервиса (DeepSeek)"""
    print_header("Тест 4: AI сервис (DeepSeek)")
    
    try:
        from app.core import openai_service
        
        if openai_service is None:
            test_failed("openai_service не инициализирован")
            return False
        
        # Проверка наличия клиента
        if not hasattr(openai_service, 'client'):
            test_failed("openai_service.client отсутствует")
            return False
        
        test_passed("AI сервис инициализирован")
        test_passed(f"Модель: {getattr(openai_service, 'model_gpt', 'unknown')}")
        
        return True
    except Exception as e:
        test_failed("AI сервис", str(e))
        return False

def test_tts_service():
    """Тест 5: Проверка TTS сервиса"""
    print_header("Тест 5: TTS сервис")
    
    try:
        from app.core import tts_service, get_tts_service
        from app.config import settings
        
        if settings.tts_service == "google":
            if tts_service is None:
                test_warning("TTS сервис не инициализирован (возможно, отсутствуют credentials)")
            else:
                test_passed("TTS сервис (Google Cloud) инициализирован")
                # Проверка голоса
                if hasattr(tts_service, 'voice_name'):
                    voice = tts_service.voice_name
                    if voice in ["ru-RU-Chirp3-HD-Kore", "ru-RU-Chirp3-HD-Aoede"]:
                        test_passed(f"Голос выбран случайно: {voice}")
                    else:
                        test_passed(f"Голос: {voice}")
        else:
            print_info(f"TTS отключен (tts_service={settings.tts_service})")
        
        return True
    except Exception as e:
        test_warning("TTS сервис", f"Не критично: {e}")
        return True  # TTS не критичен для работы системы

def test_analyzer_registry():
    """Тест 6: Проверка регистра анализаторов"""
    print_header("Тест 6: Регистр анализаторов")
    
    try:
        from app.core import analyzer_registry
        
        if analyzer_registry is None:
            test_failed("analyzer_registry не инициализирован")
            return False
        
        # Проверка наличия анализаторов
        analyzers = getattr(analyzer_registry, 'analyzers', {})
        if not analyzers:
            test_warning("Нет зарегистрированных анализаторов")
        else:
            test_passed(f"Зарегистрировано анализаторов: {len(analyzers)}")
            for name in analyzers.keys():
                test_passed(f"  - {name}")
        
        return True
    except Exception as e:
        test_failed("Регистр анализаторов", str(e))
        return False

def test_evaluation_service():
    """Тест 7: Проверка сервиса оценки"""
    print_header("Тест 7: Сервис оценки")
    
    try:
        from app.core import evaluation_service
        
        if evaluation_service is None:
            test_failed("evaluation_service не инициализирован")
            return False
        
        test_passed("Сервис оценки инициализирован")
        
        # Проверка наличия registry
        if hasattr(evaluation_service, 'analyzer_registry'):
            test_passed("analyzer_registry подключен")
        
        return True
    except Exception as e:
        test_failed("Сервис оценки", str(e))
        return False

def test_fastapi_app():
    """Тест 8: Проверка FastAPI приложения"""
    print_header("Тест 8: FastAPI приложение")
    
    try:
        from app.main import app
        
        if app is None:
            test_failed("FastAPI app не инициализирован")
            return False
        
        test_passed("FastAPI app инициализирован")
        
        # Проверка роутеров
        routes = [route.path for route in app.routes]
        expected_routes = ["/", "/health", "/api/auth", "/api/interviews", "/api/results", "/ws/session"]
        
        for expected in expected_routes:
            found = any(expected in route for route in routes)
            if found:
                test_passed(f"Роут найден: {expected}")
            else:
                test_warning(f"Роут не найден: {expected}")
        
        return True
    except Exception as e:
        test_failed("FastAPI app", str(e))
        return False

def test_dependencies():
    """Тест 9: Проверка зависимостей"""
    print_header("Тест 9: Зависимости")
    
    required_packages = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("sqlalchemy", "sqlalchemy"),
        ("pydantic", "pydantic"),
        ("openai", "openai"),  # Используется для DeepSeek
        ("google.cloud.texttospeech", "google.cloud.texttospeech"),
        ("websockets", "websockets"),
        ("aiofiles", "aiofiles"),
    ]
    
    optional_packages = [
        ("pydub", "pydub"),  # Для audio merging
    ]
    
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            test_passed(f"{package_name}")
        except ImportError:
            test_failed(f"{package_name} не установлен")
    
    for package_name, import_name in optional_packages:
        try:
            __import__(import_name)
            test_passed(f"{package_name} (опционально)")
        except ImportError:
            test_warning(f"{package_name} не установлен (опционально)")
    
    return True

async def run_all_tests():
    """Запуск всех тестов"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "SMOKE TEST - Backend Health Check" + " " * 16 + "║")
    print("╚" + "═" * 58 + "╝")
    print(Colors.RESET)
    
    # Синхронные тесты
    test_imports()  # Продолжаем выполнение даже при ошибках импорта
    test_configuration()
    test_dependencies()
    test_ai_service()
    test_tts_service()
    test_analyzer_registry()
    test_evaluation_service()
    test_fastapi_app()
    
    # Асинхронные тесты
    await test_database_connection()
    
    # Итоги
    print_header("Результаты тестирования")
    print(f"{Colors.GREEN}✅ Пройдено: {passed}{Colors.RESET}")
    if warnings > 0:
        print(f"{Colors.YELLOW}⚠️  Предупреждений: {warnings}{Colors.RESET}")
    if failed > 0:
        print(f"{Colors.RED}❌ Провалено: {failed}{Colors.RESET}")
    
    print("\n" + "=" * 60)
    
    # Определяем успешность на основе критических ошибок
    # Критическими считаются: импорты основных модулей, база данных, AI сервис
    critical_failed = failed  # Все ошибки считаем критическими для строгой проверки
    
    if critical_failed == 0:
        print_success("Все критические тесты пройдены! ✅")
        if warnings > 0:
            print_warning(f"Есть {warnings} предупреждений (не критично)")
        return True
    else:
        print_error(f"Обнаружены критические ошибки ({critical_failed})! ❌")
        if warnings > 0:
            print_warning(f"Также есть {warnings} предупреждений")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_error("\n\nТестирование прервано пользователем")
        sys.exit(130)
    except Exception as e:
        print_error(f"\n\nКритическая ошибка при запуске тестов: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

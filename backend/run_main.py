#!/usr/bin/env python
"""
Alternative way to run the backend server directly through main.py
Usage: python run_main.py

Make sure to activate virtual environment first:
    source venv/bin/activate
    python run_main.py
"""
import sys
import os

# Проверка версии Python
if sys.version_info < (3, 11) or sys.version_info >= (3, 14):
    print("⚠️  ВНИМАНИЕ: Используется Python", sys.version.split()[0])
    print("   Рекомендуется Python 3.11 или 3.12")
    print("   Текущая версия может вызвать проблемы с установкой зависимостей")
    print("")
    print("   Для PyCharm:")
    print("   1. File → Settings → Project → Python Interpreter")
    print("   2. Выберите интерпретатор из виртуального окружения проекта")
    print("")
    if sys.version_info >= (3, 14):
        print("   ⚠️  Python 3.14 слишком новый! Некоторые пакеты могут не работать.")
        response = input("   Продолжить? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import uvicorn
except ImportError:
    print("❌ uvicorn не установлен!")
    print("")
    print("Установите зависимости:")
    print("  1. Активируйте виртуальное окружение:")
    print("     source venv/bin/activate")
    print("")
    print("  2. Установите зависимости:")
    print("     pip install -r requirements.txt")
    print("")
    sys.exit(1)

if __name__ == "__main__":
    print("🚀 Запуск backend сервера...")
    print("📍 API: http://localhost:8000")
    print("📚 Документация: http://localhost:8000/docs")
    print("")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

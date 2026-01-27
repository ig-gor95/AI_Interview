#!/usr/bin/env python3
"""Run backend server in test mode without database"""

import os
import uvicorn

# Set environment to skip database initialization
os.environ['SKIP_DATABASE'] = 'true'

if __name__ == "__main__":
    print("🚀 Запуск backend сервера в тестовом режиме (без базы данных)...")
    print("📍 API: http://localhost:8000")
    print("📚 Документация: http://localhost:8000/docs")
    print("⚠️  Только для тестирования TTS - база данных отключена!")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["/Users/igorlapin/PycharmProjects/AI_Interview/backend"]
    )
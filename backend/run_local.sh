#!/bin/bash
# Скрипт для локального запуска бэкенда (без Docker)

echo "🚀 Запуск бэкенда локально..."

# Проверка что PostgreSQL работает
echo "📊 Проверка PostgreSQL..."
docker-compose ps postgres | grep -q "Up" && echo "✅ PostgreSQL работает" || echo "❌ PostgreSQL не запущен. Запустите: docker-compose up -d postgres"

# Установка зависимостей если нужно
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

echo "📦 Активация виртуального окружения..."
source venv/bin/activate

echo "📥 Установка зависимостей..."
pip install -r requirements.txt

# Изменение DATABASE_URL для локального подключения
echo "⚙️  Настройка подключения к БД..."
export DATABASE_URL="postgresql+asyncpg://ai_hr_user:secure_password@localhost:5432/ai_hr_db"

echo "🎯 Запуск сервера..."
echo "API будет доступен на: http://localhost:8000"
echo "Документация: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


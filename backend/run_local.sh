#!/bin/bash
# Скрипт для локального запуска бэкенда (без Docker)

set -e

echo "🚀 Запуск бэкенда локально..."

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен. Установите Python 3.11+"
    exit 1
fi

# Проверка PostgreSQL
echo "📊 Проверка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql не найден. Убедитесь, что PostgreSQL установлен."
else
    if psql -h localhost -U ${POSTGRES_USER:-root} -d ${POSTGRES_DB:-taskdb} -c "SELECT 1" > /dev/null 2>&1; then
        echo "✅ PostgreSQL доступен"
    else
        echo "⚠️  Не удалось подключиться к PostgreSQL. Убедитесь, что:"
        echo "   1. PostgreSQL запущен"
        echo "   2. База данных создана"
        echo "   3. Учетные данные в .env правильные"
    fi
fi

# Создание виртуального окружения если нужно
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активация виртуального окружения
echo "📦 Активация виртуального окружения..."
source venv/bin/activate

# Установка зависимостей
echo "📥 Установка/обновление зависимостей..."
pip install --upgrade pip setuptools wheel

# Установка зависимостей
echo "📦 Установка зависимостей..."
if [ -f "install_deps.sh" ]; then
    bash install_deps.sh
else
    # Попытка установить только бинарные пакеты (wheels) - быстрее и не требует компиляции
    echo "   Пробуем установить бинарные пакеты..."
    pip install --only-binary :all: -r requirements.txt 2>/dev/null || {
        echo "   ⚠️  Некоторые пакеты требуют компиляции, пробуем обычную установку..."
        pip install -r requirements.txt
    }
fi

# Загрузка переменных окружения из .env если есть
if [ -f ".env" ]; then
    echo "📄 Загрузка переменных из .env..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Установка значений по умолчанию если не заданы
export DATABASE_URL=${DATABASE_URL:-postgresql+asyncpg://root:root@localhost:5432/taskdb}
export POSTGRES_USER=${POSTGRES_USER:-root}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-root}
export POSTGRES_DB=${POSTGRES_DB:-taskdb}
export CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:5173,http://localhost:3000}

echo ""
echo "🎯 Запуск сервера..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 API: http://localhost:8000"
echo "📚 Документация: http://localhost:8000/docs"
echo "🔍 Health check: http://localhost:8000/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

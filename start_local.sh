#!/bin/bash
# Скрипт для запуска всего приложения локально (без Docker)

set -e

echo "🚀 Запуск приложения локально..."
echo ""

# Проверка что PostgreSQL запущен (опционально, можно использовать Docker только для БД)
if command -v docker &> /dev/null; then
    if docker ps | grep -q "ai_hr_postgres\|postgres"; then
        echo "✅ PostgreSQL запущен в Docker"
    else
        echo "⚠️  PostgreSQL не запущен. Запустите:"
        echo "   docker-compose up -d postgres"
        echo "   или установите PostgreSQL локально"
        read -p "Продолжить без проверки? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Функция для очистки при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM

# Запуск backend
echo "🔧 Запуск Backend..."
cd backend
bash run_local.sh &
BACKEND_PID=$!
cd ..

# Ждем немного чтобы backend запустился
sleep 3

# Запуск frontend
echo "🎨 Запуск Frontend..."
cd "AI Tutor Dashboard"
bash run_local.sh &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Приложение запущено!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ждем завершения
wait


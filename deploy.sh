#!/bin/bash

# Скрипт первичного развертывания на VK Cloud
# Использование: ./deploy.sh

set -e  # Остановка при ошибке

echo "🚀 Начинаем развертывание AI HR Interview Platform на VK Cloud..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Файл .env.production не найден!${NC}"
    echo "Создайте его на основе .env.production.example"
    echo "cp .env.production.example .env.production"
    echo "Затем заполните необходимые значения"
    exit 1
fi

# Проверка наличия GCP credentials
if [ ! -f gcp-credentials.json ]; then
    echo -e "${YELLOW}⚠️  Файл gcp-credentials.json не найден${NC}"
    echo "Если вы используете Google Cloud TTS/STT, добавьте файл gcp-credentials.json"
    read -p "Продолжить без GCP credentials? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Загрузка переменных окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Конфигурация загружена${NC}"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker и Docker Compose установлены${NC}"

# Остановка старых контейнеров (если есть)
echo "🛑 Остановка старых контейнеров..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Удаление старых образов (опционально)
read -p "Удалить старые Docker образы? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Очистка старых образов..."
    docker system prune -f
fi

# Создание сети (если не существует)
docker network create ai_hr_network 2>/dev/null || true

# Сборка образов
echo "🔨 Сборка Docker образов..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Проверка соединения с базой данных
echo "🔍 Проверка соединения с базой данных..."
if ! docker run --rm --network=host postgres:15-alpine pg_isready -h $(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p') -U $POSTGRES_USER &> /dev/null; then
    echo -e "${YELLOW}⚠️  Не удалось подключиться к базе данных${NC}"
    echo "Убедитесь, что:"
    echo "1. Managed PostgreSQL создан в VK Cloud"
    echo "2. DATABASE_URL правильный в .env.production"
    echo "3. Firewall правила разрешают подключение"
    read -p "Продолжить деплой? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Запуск миграций базы данных
echo "📊 Запуск миграций базы данных..."
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head || {
    echo -e "${YELLOW}⚠️  Миграции не выполнены (возможно, Alembic не настроен)${NC}"
}

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверка здоровья контейнеров
echo "🏥 Проверка состояния контейнеров..."
docker-compose -f docker-compose.prod.yml ps

# Проверка логов
echo ""
echo "📋 Последние логи backend:"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo ""
echo "📋 Последние логи frontend:"
docker-compose -f docker-compose.prod.yml logs --tail=20 frontend

# Финальная проверка
echo ""
echo "🔍 Проверка доступности сервисов..."
sleep 5

if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend работает (http://localhost:8000)${NC}"
else
    echo -e "${RED}❌ Backend не отвечает${NC}"
fi

if curl -s http://localhost/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend работает (http://localhost)${NC}"
else
    echo -e "${RED}❌ Frontend не отвечает${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Развертывание завершено!${NC}"
echo ""
echo "Полезные команды:"
echo "  docker-compose -f docker-compose.prod.yml logs -f          # Логи в реальном времени"
echo "  docker-compose -f docker-compose.prod.yml ps               # Статус контейнеров"
echo "  docker-compose -f docker-compose.prod.yml restart          # Перезапуск всех сервисов"
echo "  docker-compose -f docker-compose.prod.yml down             # Остановка всех сервисов"
echo "  ./update.sh                                                # Обновление приложения"
echo ""

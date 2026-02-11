#!/bin/bash

# Скрипт первичного развертывания на Timeweb Cloud
# Использование: ./deploy-timeweb.sh

set -e  # Остановка при ошибке

echo "🚀 Начинаем развертывание AI HR Interview Platform на Timeweb Cloud..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo "Создайте его на основе .env.timeweb.example"
    echo "cp .env.timeweb.example .env"
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
export $(cat .env | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Конфигурация загружена${NC}"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен${NC}"
    echo "Установите Docker:"
    echo "curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "sudo sh get-docker.sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker и Docker Compose установлены${NC}"

# Проверка docker-compose.timeweb.yml
if [ ! -f docker-compose.timeweb.yml ]; then
    echo -e "${RED}❌ docker-compose.timeweb.yml не найден${NC}"
    exit 1
fi

# Остановка старых контейнеров (если есть)
echo "🛑 Остановка старых контейнеров..."
docker-compose -f docker-compose.timeweb.yml down 2>/dev/null || true

# Удаление старых образов (опционально)
read -p "Удалить старые Docker образы? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Очистка старых образов..."
    docker system prune -f
fi

# Создание директорий
echo "📁 Создание необходимых директорий..."
mkdir -p postgres-config
mkdir -p backups

# Сборка образов
echo "🔨 Сборка Docker образов..."
docker-compose -f docker-compose.timeweb.yml build --no-cache

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker-compose -f docker-compose.timeweb.yml up -d

# Ожидание запуска PostgreSQL
echo "⏳ Ожидание запуска PostgreSQL..."
sleep 15

# Проверка PostgreSQL
echo "🔍 Проверка PostgreSQL..."
if docker exec ai_hr_postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL работает${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL еще запускается, ждем еще...${NC}"
    sleep 10
fi

# Запуск миграций базы данных
echo "📊 Запуск миграций базы данных..."
docker-compose -f docker-compose.timeweb.yml exec -T backend alembic upgrade head 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Миграции не выполнены (возможно, Alembic не настроен)${NC}"
    echo "Создаем базовую структуру БД..."
}

# Ожидание запуска всех сервисов
echo "⏳ Ожидание запуска всех сервисов..."
sleep 10

# Проверка здоровья контейнеров
echo "🏥 Проверка состояния контейнеров..."
docker-compose -f docker-compose.timeweb.yml ps

# Проверка логов
echo ""
echo "📋 Последние логи PostgreSQL:"
docker-compose -f docker-compose.timeweb.yml logs --tail=10 postgres

echo ""
echo "📋 Последние логи backend:"
docker-compose -f docker-compose.timeweb.yml logs --tail=20 backend

echo ""
echo "📋 Последние логи frontend:"
docker-compose -f docker-compose.timeweb.yml logs --tail=20 frontend

# Финальная проверка
echo ""
echo "🔍 Проверка доступности сервисов..."
sleep 5

# Проверка backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend работает (http://localhost:8000)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend еще запускается или есть проблемы${NC}"
    echo "Проверьте логи: docker-compose -f docker-compose.timeweb.yml logs backend"
fi

# Проверка frontend
if curl -s http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend работает (http://localhost)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend еще запускается или есть проблемы${NC}"
    echo "Проверьте логи: docker-compose -f docker-compose.timeweb.yml logs frontend"
fi

# Проверка PostgreSQL
DB_SIZE=$(docker exec ai_hr_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" 2>/dev/null | xargs)
if [ ! -z "$DB_SIZE" ]; then
    echo -e "${GREEN}✅ PostgreSQL работает (размер БД: $DB_SIZE)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Развертывание завершено!${NC}"
echo ""
echo "📊 Информация о сервере:"
echo "  IP адрес: $(curl -s ifconfig.me 2>/dev/null || echo 'Не определен')"
echo "  Frontend: http://$(curl -s ifconfig.me 2>/dev/null)"
echo "  Backend API: http://$(curl -s ifconfig.me 2>/dev/null):8000"
echo ""
echo "💡 Полезные команды:"
echo "  docker-compose -f docker-compose.timeweb.yml logs -f          # Логи в реальном времени"
echo "  docker-compose -f docker-compose.timeweb.yml ps               # Статус контейнеров"
echo "  docker-compose -f docker-compose.timeweb.yml restart          # Перезапуск всех сервисов"
echo "  docker-compose -f docker-compose.timeweb.yml down             # Остановка всех сервисов"
echo "  ./update-timeweb.sh                                           # Обновление приложения"
echo "  ./backup-timeweb.sh                                           # Создание бэкапа БД"
echo ""
echo "⚠️  ВАЖНО:"
echo "  1. Настройте firewall: sudo ufw allow 80/tcp && sudo ufw allow 443/tcp"
echo "  2. Настройте SSL сертификат (Let's Encrypt)"
echo "  3. Настройте автоматические бэкапы (cron)"
echo ""

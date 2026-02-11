#!/bin/bash

# Скрипт обновления приложения на VK Cloud
# Использование: ./update.sh [--no-build] [--backend-only] [--frontend-only]

set -e

echo "🔄 Начинаем обновление AI HR Interview Platform..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Параметры
NO_BUILD=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        *)
            echo "Неизвестный параметр: $1"
            echo "Использование: ./update.sh [--no-build] [--backend-only] [--frontend-only]"
            exit 1
            ;;
    esac
done

# Проверка, что находимся в правильной директории
if [ ! -f docker-compose.prod.yml ]; then
    echo -e "${RED}❌ docker-compose.prod.yml не найден${NC}"
    echo "Убедитесь, что вы находитесь в корневой директории проекта"
    exit 1
fi

# Создание бэкапа базы данных перед обновлением
echo "💾 Создание бэкапа базы данных..."
./backup.sh 2>/dev/null || echo -e "${YELLOW}⚠️  Бэкап не создан (возможно, скрипт backup.sh отсутствует)${NC}"

# Получение последних изменений из Git (если используется)
if [ -d .git ]; then
    echo "📥 Получение последних изменений из Git..."
    git pull origin main || git pull origin master || echo -e "${YELLOW}⚠️  Git pull не выполнен${NC}"
fi

# Загрузка переменных окружения
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Определение сервисов для обновления
SERVICES=""
if [ "$BACKEND_ONLY" = true ]; then
    SERVICES="backend"
    echo "🎯 Обновление только backend..."
elif [ "$FRONTEND_ONLY" = true ]; then
    SERVICES="frontend"
    echo "🎯 Обновление только frontend..."
else
    SERVICES="backend frontend"
    echo "🎯 Обновление всех сервисов..."
fi

# Пересборка образов (если не --no-build)
if [ "$NO_BUILD" = false ]; then
    echo "🔨 Пересборка Docker образов..."
    for service in $SERVICES; do
        docker-compose -f docker-compose.prod.yml build $service
    done
else
    echo "⏭️  Пропуск пересборки образов (--no-build)"
fi

# Остановка и удаление старых контейнеров
echo "🛑 Остановка старых контейнеров..."
docker-compose -f docker-compose.prod.yml stop $SERVICES

# Запуск миграций (только для backend)
if [[ "$SERVICES" == *"backend"* ]]; then
    echo "📊 Запуск миграций базы данных..."
    docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Миграции не выполнены (возможно, Alembic не настроен)${NC}"
    }
fi

# Запуск новых контейнеров
echo "🚀 Запуск обновленных контейнеров..."
docker-compose -f docker-compose.prod.yml up -d $SERVICES

# Удаление неиспользуемых образов
echo "🧹 Очистка неиспользуемых образов..."
docker image prune -f

# Ожидание запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверка состояния
echo ""
echo "🏥 Статус контейнеров:"
docker-compose -f docker-compose.prod.yml ps

# Показать логи
echo ""
echo "📋 Последние логи обновленных сервисов:"
for service in $SERVICES; do
    echo ""
    echo "--- Логи $service ---"
    docker-compose -f docker-compose.prod.yml logs --tail=30 $service
done

# Проверка здоровья
echo ""
echo "🔍 Проверка работоспособности..."
sleep 3

SUCCESS=true

if [[ "$SERVICES" == *"backend"* ]]; then
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✅ Backend работает${NC}"
    else
        echo -e "${RED}❌ Backend не отвечает${NC}"
        SUCCESS=false
    fi
fi

if [[ "$SERVICES" == *"frontend"* ]]; then
    if curl -s http://localhost/ > /dev/null; then
        echo -e "${GREEN}✅ Frontend работает${NC}"
    else
        echo -e "${RED}❌ Frontend не отвечает${NC}"
        SUCCESS=false
    fi
fi

echo ""
if [ "$SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 Обновление успешно завершено!${NC}"
else
    echo -e "${RED}⚠️  Обновление завершено с ошибками${NC}"
    echo "Проверьте логи: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "Полезные команды:"
echo "  docker-compose -f docker-compose.prod.yml logs -f $SERVICES    # Логи в реальном времени"
echo "  docker-compose -f docker-compose.prod.yml restart $SERVICES    # Перезапуск сервисов"
echo "  docker-compose -f docker-compose.prod.yml ps                   # Статус контейнеров"
echo ""

#!/bin/bash

# Скрипт восстановления PostgreSQL из бэкапа на Timeweb Cloud
# Использование: ./restore-timeweb.sh [путь_к_бэкапу]

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Проверка аргументов
if [ $# -eq 0 ]; then
    echo "Использование: ./restore-timeweb.sh <путь_к_бэкапу>"
    echo ""
    echo "Доступные бэкапы:"
    ls -lh backups/backup_*.sql.gz 2>/dev/null || echo "Нет доступных бэкапов"
    exit 1
fi

BACKUP_FILE=$1

# Проверка существования файла
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Файл $BACKUP_FILE не найден${NC}"
    exit 1
fi

# Загрузка переменных окружения
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден${NC}"
    exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Это действие удалит текущую базу данных!${NC}"
echo "База данных: ${POSTGRES_DB:-ai_hr_db}"
echo "Бэкап: $BACKUP_FILE"
echo ""
read -p "Вы уверены? Введите 'yes' для продолжения: " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "Отменено"
    exit 0
fi

# Проверка, что контейнер запущен
if ! docker ps | grep ai_hr_postgres > /dev/null; then
    echo -e "${RED}❌ Контейнер PostgreSQL не запущен${NC}"
    echo "Запустите контейнеры: docker-compose -f docker-compose.timeweb.yml up -d"
    exit 1
fi

# Остановка backend (чтобы не было подключений к БД)
echo "🛑 Остановка backend..."
docker-compose -f docker-compose.timeweb.yml stop backend

echo "💾 Восстановление из бэкапа..."

# Распаковка и восстановление
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker exec -i ai_hr_postgres \
        psql -U ${POSTGRES_USER:-aihr_user} -d ${POSTGRES_DB:-ai_hr_db}
else
    cat $BACKUP_FILE | docker exec -i ai_hr_postgres \
        psql -U ${POSTGRES_USER:-aihr_user} -d ${POSTGRES_DB:-ai_hr_db}
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Восстановление успешно завершено${NC}"

    # Запуск backend обратно
    echo "🚀 Запуск backend..."
    docker-compose -f docker-compose.timeweb.yml start backend

    echo ""
    echo -e "${GREEN}🎉 База данных успешно восстановлена из бэкапа${NC}"
else
    echo -e "${RED}❌ Ошибка восстановления${NC}"

    # Все равно пытаемся запустить backend
    docker-compose -f docker-compose.timeweb.yml start backend
    exit 1
fi

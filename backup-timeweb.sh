#!/bin/bash

# Скрипт бэкапа PostgreSQL из Docker контейнера на Timeweb Cloud
# Использование: ./backup-timeweb.sh

set -e

echo "💾 Создание бэкапа базы данных..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Загрузка переменных окружения
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден${NC}"
    exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

# Создание директории для бэкапов
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Генерация имени файла с датой и временем
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📊 Параметры подключения:"
echo "  Container: ai_hr_postgres"
echo "  Database: ${POSTGRES_DB:-ai_hr_db}"
echo "  User: ${POSTGRES_USER:-aihr_user}"
echo ""

# Проверка, что контейнер запущен
if ! docker ps | grep ai_hr_postgres > /dev/null; then
    echo -e "${RED}❌ Контейнер PostgreSQL не запущен${NC}"
    echo "Запустите контейнеры: docker-compose -f docker-compose.timeweb.yml up -d"
    exit 1
fi

# Проверка готовности PostgreSQL
if ! docker exec ai_hr_postgres pg_isready -U ${POSTGRES_USER:-aihr_user} > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL не готов к подключению${NC}"
    exit 1
fi

# Создание бэкапа
echo "⏳ Создание бэкапа..."

docker exec ai_hr_postgres pg_dump \
    -U ${POSTGRES_USER:-aihr_user} \
    -d ${POSTGRES_DB:-ai_hr_db} \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists > $BACKUP_FILE

# Проверка успешности
if [ $? -eq 0 ] && [ -s $BACKUP_FILE ]; then
    # Получение размера файла
    BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)

    echo -e "${GREEN}✅ Бэкап успешно создан${NC}"
    echo "  Файл: $BACKUP_FILE"
    echo "  Размер: $BACKUP_SIZE"

    # Сжатие бэкапа
    echo "🗜️  Сжатие бэкапа..."
    gzip $BACKUP_FILE
    BACKUP_FILE="$BACKUP_FILE.gz"
    COMPRESSED_SIZE=$(du -h $BACKUP_FILE | cut -f1)

    echo -e "${GREEN}✅ Бэкап сжат${NC}"
    echo "  Файл: $BACKUP_FILE"
    echo "  Размер: $COMPRESSED_SIZE"

    # Удаление старых бэкапов (оставляем последние 7)
    echo "🧹 Очистка старых бэкапов (оставляем последние 7)..."
    BACKUP_COUNT=$(ls -1 $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 7 ]; then
        ls -t $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true
        echo "Удалено старых бэкапов: $((BACKUP_COUNT - 7))"
    fi

    echo ""
    echo "📋 Список бэкапов:"
    ls -lh $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | tail -n 7 || echo "Нет сохраненных бэкапов"

    # Показать общий размер всех бэкапов
    TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)
    echo ""
    echo "💾 Общий размер всех бэкапов: $TOTAL_SIZE"

else
    echo -e "${RED}❌ Ошибка создания бэкапа${NC}"
    rm -f $BACKUP_FILE
    exit 1
fi

echo ""
echo "💡 Для восстановления из бэкапа используйте:"
echo "  gunzip -c $BACKUP_FILE | docker exec -i ai_hr_postgres \\"
echo "    psql -U ${POSTGRES_USER:-aihr_user} -d ${POSTGRES_DB:-ai_hr_db}"
echo ""
echo "⚠️  Или используйте скрипт restore-timeweb.sh (если доступен)"
echo ""

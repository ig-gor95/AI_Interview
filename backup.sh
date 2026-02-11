#!/bin/bash

# Скрипт бэкапа базы данных PostgreSQL из VK Cloud
# Использование: ./backup.sh

set -e

echo "💾 Создание бэкапа базы данных..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Загрузка переменных окружения
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Файл .env.production не найден${NC}"
    exit 1
fi

export $(cat .env.production | grep -v '^#' | xargs)

# Создание директории для бэкапов
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Генерация имени файла с датой и временем
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# Извлечение параметров подключения из DATABASE_URL
# Формат: postgresql+asyncpg://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo "📊 Параметры подключения:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $POSTGRES_DB"
echo "  User: $POSTGRES_USER"
echo ""

# Создание бэкапа
echo "⏳ Создание бэкапа..."

# Используем pg_dump через Docker контейнер
docker run --rm \
    -e PGPASSWORD=$POSTGRES_PASSWORD \
    postgres:15-alpine \
    pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $POSTGRES_USER \
    -d $POSTGRES_DB \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists > $BACKUP_FILE

# Проверка успешности
if [ $? -eq 0 ]; then
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
    ls -t $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true

    echo ""
    echo "📋 Список бэкапов:"
    ls -lh $BACKUP_DIR/backup_*.sql.gz 2>/dev/null || echo "Нет сохраненных бэкапов"

else
    echo -e "${RED}❌ Ошибка создания бэкапа${NC}"
    rm -f $BACKUP_FILE
    exit 1
fi

echo ""
echo "Для восстановления из бэкапа используйте:"
echo "  gunzip -c $BACKUP_FILE | docker run --rm -i \\"
echo "    -e PGPASSWORD=$POSTGRES_PASSWORD \\"
echo "    postgres:15-alpine \\"
echo "    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""

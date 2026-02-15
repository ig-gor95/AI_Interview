#!/bin/bash
# Скрипт для обновления SSL-сертификатов Let's Encrypt

# Цвета для логов
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Начало обновления SSL-сертификатов...${NC}"

# Останавливаем frontend контейнер для освобождения порта 80
echo -e "${YELLOW}Останавливаем frontend контейнер...${NC}"
docker-compose -f docker-compose.timeweb.yml stop frontend

# Обновляем сертификаты
echo -e "${YELLOW}Обновляем сертификаты...${NC}"
certbot renew --standalone --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Сертификаты успешно обновлены${NC}"

    # Запускаем frontend контейнер обратно
    echo -e "${YELLOW}Запускаем frontend контейнер...${NC}"
    docker-compose -f docker-compose.timeweb.yml start frontend

    echo -e "${GREEN}✓ Готово! SSL-сертификаты обновлены и контейнер перезапущен${NC}"
else
    echo -e "${RED}✗ Ошибка при обновлении сертификатов${NC}"

    # Всё равно запускаем контейнер обратно
    echo -e "${YELLOW}Запускаем frontend контейнер обратно...${NC}"
    docker-compose -f docker-compose.timeweb.yml start frontend

    exit 1
fi

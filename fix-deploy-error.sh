#!/bin/bash
# Исправление ошибки ContainerConfig

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Исправление ошибки Docker ContainerConfig...${NC}"
echo ""

echo -e "${YELLOW}[1/5] Остановка всех контейнеров...${NC}"
docker-compose -f docker-compose.timeweb.yml down

echo ""
echo -e "${YELLOW}[2/5] Удаление старых контейнеров backend...${NC}"
docker ps -a | grep ai_hr_backend | awk '{print $1}' | xargs -r docker rm -f

echo ""
echo -e "${YELLOW}[3/5] Пересборка backend (принудительная)...${NC}"
docker-compose -f docker-compose.timeweb.yml build --no-cache backend

echo ""
echo -e "${YELLOW}[4/5] Пересборка frontend...${NC}"
docker-compose -f docker-compose.timeweb.yml build frontend

echo ""
echo -e "${YELLOW}[5/5] Запуск всех контейнеров...${NC}"
docker-compose -f docker-compose.timeweb.yml up -d

echo ""
echo -e "${YELLOW}Ожидание запуска (15 секунд)...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}Проверка статуса:${NC}"
docker-compose -f docker-compose.timeweb.yml ps

echo ""
echo -e "${GREEN}✅ Готово! Проверьте статус контейнеров выше.${NC}"
echo ""
echo -e "${YELLOW}Если все контейнеры Up, изменения применены:${NC}"
echo "  • Женский голос AI"
echo "  • Галочка согласия"
echo "  • Отложенное использование ссылок"
echo "  • Лимит 30 ссылок"
echo ""

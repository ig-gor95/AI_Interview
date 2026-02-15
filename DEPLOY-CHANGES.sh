#!/bin/bash
# Скрипт для деплоя изменений на сервер

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Деплой изменений для screenme.pro           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}[1/4] Пересборка frontend с исправлениями микрофона...${NC}"
docker-compose -f docker-compose.timeweb.yml build frontend

echo ""
echo -e "${YELLOW}[2/4] Перезапуск контейнеров...${NC}"
docker-compose -f docker-compose.timeweb.yml up -d

echo ""
echo -e "${YELLOW}[3/4] Проверка статуса контейнеров...${NC}"
sleep 5
docker-compose -f docker-compose.timeweb.yml ps

echo ""
echo -e "${YELLOW}[4/4] Проверка логов frontend...${NC}"
docker logs ai_hr_frontend --tail 30

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           ДЕПЛОЙ ЗАВЕРШЕН!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Что было исправлено:${NC}"
echo "   1. Микрофон теперь отключается при нажатии кнопки"
echo "   2. Микрофон автоматически отключается когда AI говорит"
echo "   3. Кнопка микрофона заблокирована когда AI говорит"
echo ""
echo -e "${YELLOW}📋 Проверьте:${NC}"
echo "   1. Откройте https://screenme.pro в браузере"
echo "   2. Очистите кэш (Ctrl+Shift+Delete)"
echo "   3. Попробуйте интервью и проверьте микрофон"
echo ""
echo -e "${YELLOW}Если домен не открывается:${NC}"
echo "   bash check-status.sh"
echo ""

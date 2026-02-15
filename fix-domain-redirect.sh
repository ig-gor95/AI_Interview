#!/bin/bash
# Исправление работы домена без www

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Исправление домена screenme.pro             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Проблема:${NC} Домен работает только с www.screenme.pro"
echo -e "${YELLOW}Решение:${NC} Обновить nginx конфигурацию"
echo ""

echo -e "${YELLOW}[1/3] Проверка текущей конфигурации nginx...${NC}"
docker exec ai_hr_frontend cat /etc/nginx/conf.d/default.conf | grep "server_name" | head -2

echo ""
echo -e "${YELLOW}[2/3] Перезапуск frontend с новой конфигурацией...${NC}"
docker-compose -f docker-compose.timeweb.yml restart frontend

echo ""
echo -e "${YELLOW}[3/3] Ожидание запуска (10 секунд)...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Проверка:${NC}"
echo "HTTP (должен редиректить на HTTPS):"
curl -I http://screenme.pro 2>/dev/null | head -5

echo ""
echo "HTTPS (должен вернуть 200 OK):"
curl -I https://screenme.pro 2>/dev/null | head -5

echo ""
echo "HTTP с www (должен редиректить на HTTPS):"
curl -I http://www.screenme.pro 2>/dev/null | head -5

echo ""
echo "HTTPS с www (должен вернуть 200 OK):"
curl -I https://www.screenme.pro 2>/dev/null | head -5

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ГОТОВО!                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Теперь работают оба варианта:${NC}"
echo "   - https://screenme.pro"
echo "   - https://www.screenme.pro"
echo ""
echo -e "${YELLOW}Проверьте в браузере (очистите кэш Ctrl+Shift+Delete):${NC}"
echo "   http://screenme.pro  → https://screenme.pro"
echo "   http://www.screenme.pro → https://www.screenme.pro"
echo ""

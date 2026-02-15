#!/bin/bash
# Скрипт для быстрой проверки статуса проекта

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Проверка статуса screenme.pro             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}[1] Статус контейнеров:${NC}"
docker-compose -f docker-compose.timeweb.yml ps
echo ""

echo -e "${YELLOW}[2] Открытые порты:${NC}"
netstat -tulpn | grep -E ':(80|443|8000)' || echo "Порты не открыты"
echo ""

echo -e "${YELLOW}[3] DNS проверка:${NC}"
echo "screenme.pro:"
nslookup screenme.pro 8.8.8.8 | grep "Address" | tail -1
echo "www.screenme.pro:"
nslookup www.screenme.pro 8.8.8.8 | grep "Address" | tail -1
echo ""

echo -e "${YELLOW}[4] SSL сертификаты:${NC}"
if [ -d "/etc/letsencrypt/live/screenme.pro" ]; then
    echo -e "${GREEN}✓ SSL сертификат существует${NC}"
    ls -la /etc/letsencrypt/live/screenme.pro/
else
    echo -e "${RED}✗ SSL сертификат не найден${NC}"
fi
echo ""

echo -e "${YELLOW}[5] Тест HTTP (порт 80):${NC}"
curl -I http://localhost 2>/dev/null | head -5 || echo -e "${RED}✗ HTTP не работает${NC}"
echo ""

echo -e "${YELLOW}[6] Тест HTTPS (порт 443):${NC}"
curl -Ik https://localhost 2>/dev/null | head -5 || echo -e "${RED}✗ HTTPS не работает${NC}"
echo ""

echo -e "${YELLOW}[7] Логи frontend (последние 20 строк):${NC}"
docker logs ai_hr_frontend --tail 20 2>/dev/null || echo -e "${RED}✗ Контейнер не запущен${NC}"
echo ""

echo -e "${YELLOW}[8] Логи backend (последние 20 строк):${NC}"
docker logs ai_hr_backend --tail 20 2>/dev/null || echo -e "${RED}✗ Контейнер не запущен${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Тест с вашего компьютера:${NC}"
echo "curl -I http://screenme.pro"
echo "curl -I https://screenme.pro"
echo ""

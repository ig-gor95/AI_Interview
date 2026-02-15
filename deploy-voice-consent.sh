#!/bin/bash
# Деплой изменений: женский голос + галочка согласия

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Деплой: Женский голос + Галочка согласия    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Что будет изменено:${NC}"
echo "  1. Голос AI изменен с мужского (Orus) на женский (Leda)"
echo "  2. Добавлена обязательная галочка согласия на обработку данных"
echo "  3. Кнопка 'Начать интервью' неактивна без галочки"
echo ""

read -p "Продолжить деплой? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отмена"
    exit 0
fi

echo ""
echo -e "${YELLOW}[1/4] Получение изменений из git...${NC}"
git pull origin master

echo ""
echo -e "${YELLOW}[2/4] Пересборка backend (новый голос)...${NC}"
docker-compose -f docker-compose.timeweb.yml build backend

echo ""
echo -e "${YELLOW}[3/4] Пересборка frontend (галочка согласия)...${NC}"
docker-compose -f docker-compose.timeweb.yml build frontend

echo ""
echo -e "${YELLOW}[4/4] Перезапуск контейнеров...${NC}"
docker-compose -f docker-compose.timeweb.yml up -d

echo ""
echo -e "${YELLOW}Ожидание запуска контейнеров (15 секунд)...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}Проверка статуса:${NC}"
docker-compose -f docker-compose.timeweb.yml ps

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ДЕПЛОЙ ЗАВЕРШЕН!                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Изменения применены:${NC}"
echo ""
echo -e "${YELLOW}1. Женский голос AI (Leda):${NC}"
echo "   - Откройте https://screenme.pro"
echo "   - Начните новое интервью"
echo "   - AI теперь говорит женским голосом"
echo ""
echo -e "${YELLOW}2. Галочка согласия:${NC}"
echo "   - Перейдите по ссылке на интервью"
echo "   - Заполните имя и фамилию"
echo "   - Галочка 'Я даю согласие...' обязательна"
echo "   - Без галочки кнопка 'Начать интервью' неактивна"
echo ""
echo -e "${YELLOW}Проверьте работу:${NC}"
echo "   curl -I https://screenme.pro"
echo "   docker logs ai_hr_backend --tail 50"
echo ""

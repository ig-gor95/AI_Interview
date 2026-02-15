#!/bin/bash
# Полный деплой всех изменений

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Деплой всех новых изменений            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Что будет изменено:${NC}"
echo ""
echo -e "${YELLOW}1. Голос AI:${NC}"
echo "   • Изменен с мужского (Orus) на женский (Leda)"
echo ""
echo -e "${YELLOW}2. Регистрация кандидатов:${NC}"
echo "   • Добавлена обязательная галочка согласия на обработку данных"
echo "   • Кнопка 'Начать интервью' неактивна без галочки"
echo ""
echo -e "${YELLOW}3. Система ссылок:${NC}"
echo "   • Ссылка помечается использованной только при ЗАВЕРШЕНИИ сессии"
echo "   • Ранее помечалась сразу при регистрации"
echo ""
echo -e "${YELLOW}4. Ограничение количества ссылок:${NC}"
echo "   • Максимум 30 активных (неиспользованных) ссылок на интервью"
echo "   • При превышении лимита показывается понятное сообщение об ошибке"
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
echo -e "${YELLOW}[2/4] Пересборка backend (новый голос + ограничение ссылок)...${NC}"
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
echo -e "${GREEN}✅ Все изменения применены:${NC}"
echo ""
echo -e "${YELLOW}Как проверить:${NC}"
echo ""
echo "1. Женский голос AI (Leda):"
echo "   • Откройте https://screenme.pro"
echo "   • Начните новое интервью"
echo "   • AI теперь говорит женским голосом"
echo ""
echo "2. Галочка согласия:"
echo "   • Перейдите по ссылке на интервью"
echo "   • Заполните имя и фамилию"
echo "   • Галочка 'Я даю согласие...' обязательна"
echo "   • Без галочки кнопка 'Начать интервью' неактивна"
echo ""
echo "3. Система ссылок:"
echo "   • Создайте ссылку на интервью"
echo "   • Кандидат регистрируется - ссылка еще активна"
echo "   • Завершите интервью - ссылка помечается использованной"
echo ""
echo "4. Лимит ссылок:"
echo "   • Попробуйте создать больше 30 активных ссылок"
echo "   • Должно показаться сообщение: 'Достигнут лимит активных ссылок'"
echo ""
echo -e "${YELLOW}Логи для отладки:${NC}"
echo "   docker logs ai_hr_backend --tail 100"
echo "   docker logs ai_hr_frontend --tail 100"
echo ""

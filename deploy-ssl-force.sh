#!/bin/bash
# Установка SSL БЕЗ проверки DNS (если DNS настроен, но еще не распространился)
# Запускайте с sudo: sudo ./deploy-ssl-force.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="screenme.pro"
WWW_DOMAIN="www.screenme.pro"
PROJECT_DIR=$(pwd)

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Установка HTTPS для screenme.pro             ║${NC}"
echo -e "${BLUE}║  БЕЗ проверки DNS (принудительная)            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}✗ Запускайте с sudo${NC}"
   exit 1
fi

echo -e "${YELLOW}Введите ваш email для Let's Encrypt:${NC}"
read -p "Email: " EMAIL

if [[ -z "$EMAIL" ]]; then
    echo -e "${RED}✗ Email обязателен${NC}"
    exit 1
fi

echo ""
echo -e "${RED}⚠ ВАЖНО: Убедитесь что DNS записи настроены!${NC}"
echo "A-запись для $DOMAIN должна указывать на этот сервер"
echo ""
read -p "DNS записи настроены? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Сначала настройте DNS, затем запустите снова"
    exit 1
fi

echo ""
echo -e "${YELLOW}[1/4] Установка Certbot...${NC}"
apt update -qq
apt install -y certbot > /dev/null 2>&1
echo -e "${GREEN}✓ Certbot установлен${NC}"

echo ""
echo -e "${YELLOW}[2/4] Остановка frontend контейнера...${NC}"
cd "$PROJECT_DIR"
docker-compose -f docker-compose.timeweb.yml stop frontend 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Frontend остановлен${NC}"

echo ""
echo -e "${YELLOW}[3/4] Получение SSL-сертификата...${NC}"
echo "Попытка получить сертификат для: $DOMAIN, $WWW_DOMAIN"
echo ""

if certbot certonly --standalone \
    -d $DOMAIN \
    -d $WWW_DOMAIN \
    --agree-tos \
    --email "$EMAIL" \
    --non-interactive \
    --keep-until-expiring; then
    echo -e "${GREEN}✓ SSL-сертификат получен!${NC}"
else
    echo -e "${RED}✗ Ошибка при получении сертификата${NC}"
    echo ""
    echo -e "${YELLOW}Возможные причины:${NC}"
    echo "1. DNS записи еще не распространились (подождите 5-30 минут)"
    echo "2. Порт 80 занят другим процессом"
    echo "3. Домен не указывает на этот сервер"
    echo ""
    echo "Проверьте DNS:"
    echo "  nslookup $DOMAIN 8.8.8.8"
    echo ""
    echo "Проверьте порт 80:"
    echo "  netstat -tulpn | grep :80"
    echo ""
    docker-compose -f docker-compose.timeweb.yml start frontend
    exit 1
fi

echo ""
echo -e "${YELLOW}[4/4] Перезапуск контейнеров с HTTPS...${NC}"
docker-compose -f docker-compose.timeweb.yml down
docker-compose -f docker-compose.timeweb.yml up -d
sleep 10
echo -e "${GREEN}✓ Контейнеры запущены${NC}"

# Настройка автообновления
chmod +x "$PROJECT_DIR/renew-ssl.sh"
if ! crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    (crontab -l 2>/dev/null; echo "0 3 1 */2 * cd $PROJECT_DIR && $PROJECT_DIR/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1") | crontab -
    echo -e "${GREEN}✓ Автообновление настроено${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           УСТАНОВКА ЗАВЕРШЕНА!                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Проверьте: https://screenme.pro${NC}"
echo ""
echo "Обновите .env:"
echo "  CORS_ORIGINS=https://screenme.pro,https://www.screenme.pro"
echo ""
echo "Перезапустите backend:"
echo "  docker-compose -f docker-compose.timeweb.yml restart backend"
echo ""

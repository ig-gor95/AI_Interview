#!/bin/bash
# Автоматическая установка SSL-сертификата Let's Encrypt для screenme.pro
# Запускайте с sudo: sudo ./deploy-ssl.sh

set -e  # Остановка при ошибке

# Цвета для логов
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="screenme.pro"
WWW_DOMAIN="www.screenme.pro"
PROJECT_DIR=$(pwd)

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Установка HTTPS для screenme.pro             ║${NC}"
echo -e "${BLUE}║  Let's Encrypt (бесплатно)                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Проверка что скрипт запущен с sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}✗ Этот скрипт должен быть запущен с sudo${NC}"
   echo "Используйте: sudo ./deploy-ssl.sh"
   exit 1
fi

# Запрос email для Let's Encrypt
echo -e "${YELLOW}Введите ваш email для уведомлений Let's Encrypt:${NC}"
read -p "Email: " EMAIL

if [[ -z "$EMAIL" ]]; then
    echo -e "${RED}✗ Email обязателен для получения сертификата${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[1/6] Проверка DNS настроек...${NC}"
echo "Проверяем что $DOMAIN указывает на этот сервер..."

DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

echo "  IP домена $DOMAIN: $DOMAIN_IP"
echo "  IP этого сервера: $SERVER_IP"

if [[ -z "$DOMAIN_IP" ]]; then
    echo -e "${RED}✗ Домен $DOMAIN не найден в DNS${NC}"
    echo "Пожалуйста, настройте A-запись в DNS перед продолжением"
    exit 1
fi

if [[ "$DOMAIN_IP" != "$SERVER_IP" ]]; then
    echo -e "${YELLOW}⚠ Внимание: IP домена не совпадает с IP сервера${NC}"
    echo "Это может быть нормально если используется CDN/прокси"
    read -p "Продолжить? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ DNS проверка пройдена${NC}"
echo ""

echo -e "${YELLOW}[2/6] Установка Certbot...${NC}"
apt update -qq
apt install -y certbot > /dev/null 2>&1
echo -e "${GREEN}✓ Certbot установлен${NC}"
echo ""

echo -e "${YELLOW}[3/6] Остановка frontend контейнера для освобождения порта 80...${NC}"
cd "$PROJECT_DIR"
docker-compose -f docker-compose.timeweb.yml stop frontend 2>/dev/null || true
echo -e "${GREEN}✓ Frontend остановлен${NC}"
echo ""

echo -e "${YELLOW}[4/6] Получение SSL-сертификата от Let's Encrypt...${NC}"
echo "Домены: $DOMAIN, $WWW_DOMAIN"

if certbot certonly --standalone \
    -d $DOMAIN \
    -d $WWW_DOMAIN \
    --agree-tos \
    --email "$EMAIL" \
    --non-interactive \
    --keep-until-expiring; then
    echo -e "${GREEN}✓ SSL-сертификат успешно получен!${NC}"
    echo "  Сертификат сохранен в: /etc/letsencrypt/live/$DOMAIN/"
else
    echo -e "${RED}✗ Ошибка при получении сертификата${NC}"
    echo "Запускаем frontend контейнер обратно..."
    docker-compose -f docker-compose.timeweb.yml start frontend
    exit 1
fi
echo ""

echo -e "${YELLOW}[5/6] Перезапуск контейнеров с HTTPS...${NC}"
docker-compose -f docker-compose.timeweb.yml down
docker-compose -f docker-compose.timeweb.yml up -d

echo "Ожидание запуска контейнеров (15 сек)..."
sleep 15

echo -e "${GREEN}✓ Контейнеры запущены с HTTPS${NC}"
echo ""

echo -e "${YELLOW}[6/6] Настройка автообновления сертификатов...${NC}"

# Делаем скрипт обновления исполняемым
chmod +x "$PROJECT_DIR/renew-ssl.sh"

# Проверяем есть ли уже задача в crontab
if crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    echo -e "${YELLOW}⚠ Автообновление уже настроено в crontab${NC}"
else
    # Добавляем задачу в crontab
    (crontab -l 2>/dev/null; echo "# Обновление SSL-сертификатов для screenme.pro каждые 60 дней в 3:00"; echo "0 3 1 */2 * cd $PROJECT_DIR && $PROJECT_DIR/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1") | crontab -
    echo -e "${GREEN}✓ Автообновление настроено (каждые 60 дней в 3:00)${NC}"
fi
echo ""

# Проверка работы
echo -e "${YELLOW}Проверка работы HTTPS...${NC}"
sleep 3

if docker ps | grep -q ai_hr_frontend; then
    echo -e "${GREEN}✓ Frontend контейнер работает${NC}"
else
    echo -e "${RED}✗ Frontend контейнер не запущен${NC}"
fi

if docker ps | grep -q ai_hr_backend; then
    echo -e "${GREEN}✓ Backend контейнер работает${NC}"
else
    echo -e "${RED}✗ Backend контейнер не запущен${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           УСТАНОВКА ЗАВЕРШЕНА!                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ HTTPS успешно настроен для:${NC}"
echo "   🔒 https://screenme.pro"
echo "   🔒 https://www.screenme.pro"
echo ""
echo -e "${YELLOW}📋 Следующие шаги:${NC}"
echo ""
echo "1. Откройте в браузере: https://screenme.pro"
echo "   Проверьте что замок зеленый и нет предупреждений"
echo ""
echo "2. Обновите .env файл - добавьте HTTPS домены в CORS_ORIGINS:"
echo "   ${BLUE}CORS_ORIGINS=https://screenme.pro,https://www.screenme.pro${NC}"
echo ""
echo "3. Перезапустите backend:"
echo "   ${BLUE}docker-compose -f docker-compose.timeweb.yml restart backend${NC}"
echo ""
echo "4. Проверьте качество SSL (цель: A или A+):"
echo "   ${BLUE}https://www.ssllabs.com/ssltest/analyze.html?d=screenme.pro${NC}"
echo ""
echo "5. После проверки включите HSTS (строка 33 в nginx-ssl.conf):"
echo "   Раскомментируйте add_header Strict-Transport-Security"
echo "   И перезапустите: docker-compose -f docker-compose.timeweb.yml restart frontend"
echo ""
echo -e "${GREEN}💰 Стоимость: 0₽ (бесплатно навсегда!)${NC}"
echo -e "${GREEN}🔄 Автообновление: настроено (каждые 60 дней)${NC}"
echo ""
echo "Логи контейнеров:"
echo "  docker logs ai_hr_frontend"
echo "  docker logs ai_hr_backend"
echo ""
echo -e "${GREEN}Готово! 🎉${NC}"

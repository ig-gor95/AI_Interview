#!/bin/bash
# Скрипт для просмотра логов с локального компьютера
# Запускайте на вашем компьютере (не на сервере!)

# НАСТРОЙКИ - ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ
SERVER_USER="root"
SERVER_IP="45.89.190.11"
PROJECT_PATH="/opt/apps/ai-interview"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Просмотр логов screenme.pro               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Меню
echo "Выберите что показать:"
echo "  1) Логи frontend (последние 50 строк)"
echo "  2) Логи backend (последние 50 строк)"
echo "  3) Логи всех контейнеров"
echo "  4) Статус контейнеров"
echo "  5) Логи frontend в реальном времени (Ctrl+C чтобы выйти)"
echo "  6) Логи backend в реальном времени (Ctrl+C чтобы выйти)"
echo "  7) Полная диагностика"
echo ""
read -p "Введите номер (1-7): " choice

case $choice in
    1)
        echo -e "${YELLOW}Frontend логи:${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_frontend --tail 50"
        ;;
    2)
        echo -e "${YELLOW}Backend логи:${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_backend --tail 50"
        ;;
    3)
        echo -e "${YELLOW}=== Frontend ===${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_frontend --tail 30"
        echo ""
        echo -e "${YELLOW}=== Backend ===${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_backend --tail 30"
        echo ""
        echo -e "${YELLOW}=== PostgreSQL ===${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_postgres --tail 20"
        ;;
    4)
        echo -e "${YELLOW}Статус контейнеров:${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker-compose -f docker-compose.timeweb.yml ps"
        ;;
    5)
        echo -e "${YELLOW}Frontend логи в реальном времени (Ctrl+C чтобы выйти):${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_frontend -f"
        ;;
    6)
        echo -e "${YELLOW}Backend логи в реальном времени (Ctrl+C чтобы выйти):${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && docker logs ai_hr_backend -f"
        ;;
    7)
        echo -e "${YELLOW}Запуск полной диагностики...${NC}"
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && bash check-status.sh"
        ;;
    *)
        echo -e "${RED}Неверный выбор${NC}"
        exit 1
        ;;
esac

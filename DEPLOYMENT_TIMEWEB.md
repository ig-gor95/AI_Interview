# 🚀 Развертывание на Timeweb Cloud

Полное руководство по развертыванию AI HR Interview Platform на Timeweb Cloud.

**💰 Стоимость: 490₽/месяц** (VPS Cloud 2: 2 vCPU, 4GB RAM, 40GB SSD)

---

## 📋 Содержание

1. [Преимущества Timeweb](#преимущества-timeweb)
2. [Предварительные требования](#предварительные-требования)
3. [Создание VPS на Timeweb](#создание-vps-на-timeweb)
4. [Настройка сервера](#настройка-сервера)
5. [Развертывание приложения](#развертывание-приложения)
6. [Настройка SSL](#настройка-ssl)
7. [Обновление приложения](#обновление-приложения)
8. [Бэкапы и восстановление](#бэкапы-и-восстановление)
9. [Мониторинг](#мониторинг)
10. [Troubleshooting](#troubleshooting)

---

## 💎 Преимущества Timeweb

✅ **В 5-6 раз дешевле VK Cloud** (490₽ vs 2850₽)
✅ **Оплата МИР** - работает из России
✅ **Простая панель управления** - интуитивно понятная
✅ **Больше ресурсов** - 40 GB диск vs 20 GB на VK Cloud
✅ **Быстрая поддержка** - чат 24/7
✅ **Нет скрытых платежей** - все включено в цену

**Минусы:**
⚠️ PostgreSQL в Docker (не managed) - нужны ручные бэкапы
⚠️ Нет enterprise SLA

---

## 📦 Предварительные требования

### Аккаунты и API ключи

1. **Timeweb аккаунт** - [https://timeweb.cloud/](https://timeweb.cloud/)
2. **DeepSeek API ключ** - [https://platform.deepseek.com/](https://platform.deepseek.com/)
3. **Google Cloud аккаунт** (для TTS/STT) - [https://console.cloud.google.com/](https://console.cloud.google.com/)

### Локально

- Git установлен
- SSH ключи
- (Опционально) FileZilla для SFTP

---

## 🏗️ Создание VPS на Timeweb

### Шаг 1: Регистрация и вход

1. Перейдите на [timeweb.cloud](https://timeweb.cloud/)
2. Нажмите **"Регистрация"**
3. Заполните данные (подтвердите email)
4. Войдите в панель управления

### Шаг 2: Создание VPS

1. В панели нажмите **"Облачные серверы"** → **"Создать сервер"**

2. **Выберите конфигурацию:**
   - **Рекомендуется: VPS Cloud 2** - 490₽/мес
     - 2 vCPU
     - 4 GB RAM
     - 40 GB SSD
   - **Для экономии: VPS Cloud 1** - 290₽/мес (может не хватить памяти)
   - **Для запаса: VPS Cloud 4** - 990₽/мес

3. **Операционная система:**
   - Выберите **Ubuntu 22.04 LTS**

4. **Настройки:**
   - Имя: `ai-hr-interview` (или любое)
   - SSH ключ: Добавьте свой публичный SSH ключ
   - ИЛИ создайте пароль root

5. **Нажмите "Заказать"**

6. Дождитесь создания (1-2 минуты)

7. **Запишите:**
   - IP адрес сервера
   - Логин: `root`
   - Пароль (если не используете SSH ключ)

---

## 🔧 Настройка сервера

### Шаг 1: Подключение к серверу

```bash
# Подключитесь через SSH
ssh root@YOUR_SERVER_IP

# Если используете пароль, введите его
```

### Шаг 2: Обновление системы

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка необходимых утилит
apt install -y curl git wget htop nano ufw
```

### Шаг 3: Настройка Firewall

```bash
# Настройка UFW (Uncomplicated Firewall)
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS

# Включение firewall
ufw --force enable

# Проверка статуса
ufw status
```

### Шаг 4: Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Проверка
docker --version
```

### Шаг 5: Установка Docker Compose

```bash
# Установка Docker Compose v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ИЛИ старый способ (если первый не работает)
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверка
docker-compose --version
# ИЛИ
docker compose version
```

### Шаг 6: Настройка swap (опционально, для 4GB RAM)

```bash
# Создание swap файла 2GB (на случай нехватки RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Добавить в fstab для автозагрузки
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Проверка
free -h
```

---

## 🚀 Развертывание приложения

### Шаг 1: Клонирование репозитория

```bash
# Создание директории
mkdir -p /opt/apps
cd /opt/apps

# Клонирование
git clone https://github.com/YOUR_USERNAME/ai-interview.git
cd ai-interview

# ИЛИ загрузка через SFTP, если нет Git репозитория
```

### Шаг 2: Настройка конфигурации

```bash
# Копирование примера
cp .env.timeweb.example .env

# Редактирование
nano .env
```

**Обязательные параметры:**

```env
# PostgreSQL (создайте надежный пароль!)
POSTGRES_USER=aihr_user
POSTGRES_PASSWORD=ваш_супер_надежный_пароль_12345
POSTGRES_DB=ai_hr_db

# DeepSeek API
DEEPSEEK_API_KEY=sk-ваш_ключ_deepseek

# Security (сгенерируйте новый!)
SECRET_KEY=ваш_секретный_ключ_32_символа_минимум

# CORS (замените на ваш IP или домен)
CORS_ORIGINS=http://YOUR_SERVER_IP,https://yourdomain.ru
```

**Генерация SECRET_KEY:**

```bash
# Используйте эту команду для генерации
openssl rand -hex 32
```

**Сохраните файл:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Настройка Google Cloud Credentials

```bash
# Создайте файл
nano gcp-credentials.json

# Вставьте JSON содержимое из Google Cloud Console
# (Service Account Key)

# Сохраните: Ctrl+O, Enter, Ctrl+X
```

### Шаг 4: Запуск деплоя

```bash
# Запуск скрипта развертывания
./deploy-timeweb.sh
```

**Что произойдет:**
1. Проверка конфигурации
2. Сборка Docker образов (5-10 минут)
3. Запуск контейнеров (PostgreSQL, Backend, Frontend)
4. Проверка здоровья сервисов

### Шаг 5: Проверка работы

```bash
# Проверка контейнеров
docker-compose -f docker-compose.timeweb.yml ps

# Логи
docker-compose -f docker-compose.timeweb.yml logs -f

# Проверка в браузере
# Откройте: http://YOUR_SERVER_IP
```

---

## 🔒 Настройка SSL (HTTPS)

**Для production обязательно настройте HTTPS!**

### Вариант 1: Собственный домен + Let's Encrypt (Рекомендуется)

#### 1. Настройте DNS

Добавьте A-запись в DNS вашего домена:
```
Тип: A
Имя: @
Значение: YOUR_SERVER_IP
TTL: 300
```

Дождитесь распространения DNS (5-30 минут).

#### 2. Установите Nginx и Certbot

```bash
# Установка
apt install -y nginx certbot python3-certbot-nginx

# Создание конфигурации Nginx
nano /etc/nginx/sites-available/ai-interview
```

**Содержимое файла:**

```nginx
server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;

    # Временная переадресация для получения сертификата
    location / {
        proxy_pass http://localhost/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket поддержка
    location /ws/ {
        proxy_pass http://localhost/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Активация конфигурации
ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx

# Получение SSL сертификата
certbot --nginx -d yourdomain.ru -d www.yourdomain.ru

# Следуйте инструкциям (введите email, согласитесь с ToS)
```

Certbot автоматически:
- Получит сертификат
- Настроит HTTPS редирект
- Настроит автообновление

#### 3. Проверка автообновления

```bash
# Тест обновления сертификата
certbot renew --dry-run

# Автообновление уже настроено через systemd timer
systemctl status certbot.timer
```

### Вариант 2: Cloudflare (Бесплатный SSL + CDN)

1. Добавьте домен в Cloudflare
2. Измените NS серверы у регистратора
3. В Cloudflare включите:
   - SSL/TLS → Full
   - Always Use HTTPS
4. Готово! Cloudflare автоматически выдаст SSL

---

## 🔄 Обновление приложения

### Автоматическое обновление

```bash
cd /opt/apps/ai-interview

# Обновление всех компонентов
./update-timeweb.sh

# Только backend
./update-timeweb.sh --backend-only

# Только frontend
./update-timeweb.sh --frontend-only

# Без пересборки образов (быстрое обновление конфигурации)
./update-timeweb.sh --no-build
```

### Ручное обновление

```bash
cd /opt/apps/ai-interview

# 1. Получить изменения
git pull origin main

# 2. Пересобрать образы
docker-compose -f docker-compose.timeweb.yml build

# 3. Перезапустить контейнеры
docker-compose -f docker-compose.timeweb.yml up -d

# 4. Проверить логи
docker-compose -f docker-compose.timeweb.yml logs -f
```

---

## 💾 Бэкапы и восстановление

### Создание бэкапа

```bash
# Ручное создание
./backup-timeweb.sh

# Бэкапы сохраняются в ./backups/
```

### Автоматические бэкапы (cron)

```bash
# Редактировать crontab
crontab -e

# Добавить строку (бэкап каждый день в 3:00)
0 3 * * * cd /opt/apps/ai-interview && ./backup-timeweb.sh >> /var/log/ai-hr-backup.log 2>&1

# ИЛИ каждые 6 часов
0 */6 * * * cd /opt/apps/ai-interview && ./backup-timeweb.sh >> /var/log/ai-hr-backup.log 2>&1

# Сохранить: Ctrl+O, Enter, Ctrl+X
```

### Восстановление из бэкапа

```bash
# Посмотреть список бэкапов
ls -lh backups/

# Восстановить
./restore-timeweb.sh backups/backup_20240211_030000.sql.gz
```

### Скачивание бэкапов на локальный компьютер

```bash
# На вашем компьютере
scp root@YOUR_SERVER_IP:/opt/apps/ai-interview/backups/*.gz ./local-backups/
```

---

## 📊 Мониторинг

### Полезные команды

```bash
# Статус контейнеров
docker-compose -f docker-compose.timeweb.yml ps

# Логи в реальном времени
docker-compose -f docker-compose.timeweb.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.timeweb.yml logs -f backend
docker-compose -f docker-compose.timeweb.yml logs -f postgres

# Использование ресурсов
docker stats

# Свободное место на диске
df -h

# Использование памяти
free -h

# Процессы
htop

# Сетевые соединения
netstat -tuln
```

### Проверка здоровья сервисов

```bash
# Backend API
curl http://localhost:8000/health

# Frontend
curl http://localhost/

# PostgreSQL
docker exec ai_hr_postgres pg_isready -U aihr_user

# Размер базы данных
docker exec ai_hr_postgres psql -U aihr_user -d ai_hr_db -c \
  "SELECT pg_size_pretty(pg_database_size('ai_hr_db'));"
```

---

## 🐛 Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker-compose -f docker-compose.timeweb.yml logs [service_name]

# Проверить статус
docker-compose -f docker-compose.timeweb.yml ps

# Перезапустить
docker-compose -f docker-compose.timeweb.yml restart [service_name]
```

### Нехватка памяти

```bash
# Проверить использование
free -h
docker stats

# Увеличить swap (если еще не создан)
# См. "Шаг 6: Настройка swap" выше

# Или обновить VPS до Cloud 4 (8GB RAM)
```

### Нехватка места на диске

```bash
# Проверить использование
df -h

# Очистка Docker
docker system prune -a --volumes

# Удаление старых логов
journalctl --vacuum-time=7d

# Удаление старых бэкапов
rm -f backups/backup_*.sql.gz
# Оставьте только последние 3-5
```

### PostgreSQL не запускается

```bash
# Проверить логи
docker-compose -f docker-compose.timeweb.yml logs postgres

# Проверить владельца директории
ls -la /var/lib/docker/volumes/

# Пересоздать volume (УДАЛИТ ДАННЫЕ!)
docker-compose -f docker-compose.timeweb.yml down -v
docker-compose -f docker-compose.timeweb.yml up -d
```

### Backend не подключается к PostgreSQL

```bash
# Проверить, что PostgreSQL готов
docker exec ai_hr_postgres pg_isready

# Проверить переменные окружения
docker-compose -f docker-compose.timeweb.yml config

# Проверить сеть
docker network ls
docker network inspect ai-interview_ai_hr_network
```

### WebSocket не работает

```bash
# Если используете Nginx, проверьте конфигурацию
# location /ws/ должен иметь Upgrade заголовки

# Проверьте CORS настройки
docker-compose -f docker-compose.timeweb.yml exec backend env | grep CORS
```

---

## 💰 Оптимизация затрат

### Текущие затраты (VPS Cloud 2)

- VPS: **490₽/мес**
- DeepSeek API: зависит от использования (~$0.14 за 1M токенов)
- Google Cloud TTS/STT: зависит от использования (~$4 за 1M символов)

**Всего: ~490-800₽/мес** (с учетом API)

### Как снизить затраты

1. **Используйте VPS Cloud 1 (290₽/мес)**
   - Подходит для малого трафика
   - Может не хватить памяти при большой нагрузке

2. **Оптимизируйте API запросы:**
   - Кэшируйте результаты
   - Используйте более дешевые модели DeepSeek

3. **Настройте CDN** (Cloudflare бесплатный)
   - Снижает трафик к серверу
   - Улучшает скорость

---

## 📚 Дополнительные ресурсы

- [Документация Timeweb](https://timeweb.cloud/help)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🆘 Поддержка

**Timeweb Cloud:**
- Чат поддержки: 24/7 в панели управления
- Email: support@timeweb.ru
- Telegram: @timeweb_cloud

**Проблемы с приложением:**
1. Проверьте логи: `docker-compose -f docker-compose.timeweb.yml logs`
2. Создайте issue в GitHub репозитории

---

**Готово! 🎉**

Ваше приложение развернуто на Timeweb Cloud за **490₽/месяц**.

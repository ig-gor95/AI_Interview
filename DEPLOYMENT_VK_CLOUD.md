# 🚀 Развертывание на VK Cloud

Полное руководство по развертыванию AI HR Interview Platform на VK Cloud.

## 📋 Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Создание инфраструктуры в VK Cloud](#создание-инфраструктуры-в-vk-cloud)
3. [Настройка сервера](#настройка-сервера)
4. [Настройка приложения](#настройка-приложения)
5. [Первичное развертывание](#первичное-развертывание)
6. [Обновление приложения](#обновление-приложения)
7. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Предварительные требования

### Аккаунты и API ключи

1. **VK Cloud аккаунт** - зарегистрируйтесь на [https://cloud.vk.com/](https://cloud.vk.com/)
2. **DeepSeek API ключ** - получите на [https://platform.deepseek.com/](https://platform.deepseek.com/)
3. **Google Cloud аккаунт** (для TTS/STT) - [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Создайте проект
   - Включите Cloud Text-to-Speech API
   - Включите Cloud Speech-to-Text API
   - Создайте Service Account и скачайте JSON ключ

### Локальная подготовка

- Git установлен
- SSH ключи для доступа к серверу
- (Опционально) FileZilla или другой SFTP клиент

---

## 🏗️ Создание инфраструктуры в VK Cloud

### Шаг 1: Создание Cloud Server (Виртуальная машина)

1. Войдите в панель VK Cloud
2. Перейдите в **"Облачные вычисления"** → **"Виртуальные машины"**
3. Нажмите **"Создать инстанс"**

**Рекомендуемая конфигурация:**

- **Операционная система**: Ubuntu 22.04 LTS
- **Конфигурация**: STD3-2-4 (2 vCPU, 4 GB RAM) - ~800₽/мес
- **Диск**: SSD 30-50 GB
- **SSH ключ**: Добавьте свой публичный SSH ключ или создайте новый
- **Сеть**: Создайте новую или используйте существующую
- **Внешний IP**: Обязательно включите (для доступа из интернета)

4. Нажмите **"Создать инстанс"**
5. Дождитесь создания (2-5 минут)
6. Запомните/запишите **внешний IP адрес**

### Шаг 2: Создание Managed PostgreSQL

1. Перейдите в **"Базы данных"** → **"Инстансы БД"**
2. Нажмите **"Создать инстанс БД"**

**Рекомендуемая конфигурация:**

- **Тип**: PostgreSQL 15
- **Конфигурация**: Single (1 инстанс) - ~600₽/мес
- **Ресурсы**: STD3-1-2 (1 vCPU, 2 GB RAM)
- **Диск**: SSD 10 GB (можно увеличить позже)
- **Имя БД**: `ai_hr_db`
- **Имя пользователя**: укажите свое (например, `aihr_user`)
- **Пароль**: сгенерируйте надежный пароль (сохраните его!)
- **Сеть**: Та же, что и у VM
- **Доступ**: Разрешите подключение с IP вашей VM

3. Нажмите **"Создать"**
4. Дождитесь создания (5-10 минут)
5. Запишите:
   - **Хост**: `xxxx.postgres.vkcloud.ru`
   - **Порт**: `5432`
   - **Имя БД**
   - **Пользователь**
   - **Пароль**

### Шаг 3: Настройка Firewall

1. Перейдите в **"Сети"** → **"Группы безопасности"**
2. Найдите группу безопасности вашей VM
3. Добавьте правила:

**Входящие правила:**

| Протокол | Порт | Источник | Описание |
|----------|------|----------|----------|
| TCP | 22 | 0.0.0.0/0 | SSH доступ |
| TCP | 80 | 0.0.0.0/0 | HTTP (основной доступ) |
| TCP | 443 | 0.0.0.0/0 | HTTPS (для SSL) |

**Исходящие правила:**
- Разрешить все (по умолчанию)

---

## 🔧 Настройка сервера

### Шаг 1: Подключение к серверу

```bash
# Замените IP на ваш внешний IP
ssh ubuntu@YOUR_SERVER_IP
```

### Шаг 2: Обновление системы

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка необходимых утилит
sudo apt install -y curl git wget htop nano
```

### Шаг 3: Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Применение изменений (перелогиньтесь)
newgrp docker

# Проверка установки
docker --version
```

### Шаг 4: Установка Docker Compose

```bash
# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Права на выполнение
sudo chmod +x /usr/local/bin/docker-compose

# Проверка
docker-compose --version
```

### Шаг 5: Настройка Git (опционально, но рекомендуется)

```bash
# Конфигурация Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Для приватных репозиториев настройте SSH ключ
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub  # Добавьте этот ключ в GitHub/GitLab
```

---

## ⚙️ Настройка приложения

### Шаг 1: Клонирование репозитория

```bash
# Создание директории для приложения
mkdir -p ~/apps
cd ~/apps

# Клонирование репозитория
git clone https://github.com/your-username/ai-interview.git
cd ai-interview

# Или загрузка через SFTP/SCP, если нет Git репозитория
```

### Шаг 2: Настройка переменных окружения

```bash
# Копирование примера конфигурации
cp .env.production.example .env.production

# Редактирование конфигурации
nano .env.production
```

**Заполните следующие обязательные параметры:**

```env
# Database (из VK Cloud Managed PostgreSQL)
DATABASE_URL=postgresql+asyncpg://aihr_user:YOUR_PASSWORD@xxxx.postgres.vkcloud.ru:5432/ai_hr_db
POSTGRES_USER=aihr_user
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DB=ai_hr_db

# DeepSeek API
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Security - ОБЯЗАТЕЛЬНО сгенерируйте новый!
SECRET_KEY=$(openssl rand -hex 32)  # Выполните эту команду отдельно и вставьте результат

# CORS - замените на ваш реальный домен
CORS_ORIGINS=http://YOUR_SERVER_IP,https://yourdomain.ru
```

**Сохраните файл**: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Настройка Google Cloud Credentials

```bash
# Создайте файл gcp-credentials.json
nano gcp-credentials.json

# Вставьте содержимое JSON файла из Google Cloud Console
# (тот, что вы скачали при создании Service Account)

# Сохраните: Ctrl+O, Enter, Ctrl+X
```

**Проверка структуры файла:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  ...
}
```

---

## 🚀 Первичное развертывание

### Шаг 1: Запуск деплоя

```bash
# Убедитесь, что находитесь в директории проекта
cd ~/apps/ai-interview

# Запуск скрипта развертывания
./deploy.sh
```

**Что происходит:**
1. Проверка конфигурации
2. Сборка Docker образов (занимает 5-10 минут)
3. Запуск миграций базы данных
4. Запуск контейнеров
5. Проверка здоровья сервисов

### Шаг 2: Проверка работоспособности

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Логи frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Проверка API
curl http://localhost:8000/health

# Проверка frontend
curl http://localhost/
```

### Шаг 3: Настройка SSL (опционально, но рекомендуется)

**Для production обязательно настройте HTTPS!**

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Установка nginx (если еще не установлен)
sudo apt install -y nginx

# Создание конфигурации nginx
sudo nano /etc/nginx/sites-available/ai-interview
```

**Содержимое файла:**

```nginx
server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;

    location / {
        proxy_pass http://localhost/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://localhost/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка nginx
sudo systemctl reload nginx

# Получение SSL сертификата (замените yourdomain.ru на ваш домен)
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
```

---

## 🔄 Обновление приложения

### Быстрое обновление

```bash
cd ~/apps/ai-interview

# Самый простой способ - запустить скрипт обновления
./update.sh
```

### Обновление конкретного сервиса

```bash
# Только backend
./update.sh --backend-only

# Только frontend
./update.sh --frontend-only

# Без пересборки образов (быстрое обновление)
./update.sh --no-build
```

### Ручное обновление

```bash
# 1. Получить изменения
git pull origin main

# 2. Пересобрать образы
docker-compose -f docker-compose.prod.yml build

# 3. Перезапустить контейнеры
docker-compose -f docker-compose.prod.yml up -d

# 4. Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Мониторинг и обслуживание

### Полезные команды

```bash
# Статус всех контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f backend

# Рестарт сервиса
docker-compose -f docker-compose.prod.yml restart backend

# Остановка всех сервисов
docker-compose -f docker-compose.prod.yml down

# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Использование ресурсов
docker stats

# Свободное место на диске
df -h

# Память
free -h
```

### Бэкапы базы данных

```bash
# Создание бэкапа
./backup.sh

# Просмотр бэкапов
ls -lh backups/

# Восстановление из бэкапа
gunzip -c backups/backup_20240211_120000.sql.gz | docker run --rm -i \
  -e PGPASSWORD=YOUR_PASSWORD \
  postgres:15-alpine \
  psql -h xxxx.postgres.vkcloud.ru -p 5432 -U aihr_user -d ai_hr_db
```

### Автоматические бэкапы

```bash
# Создание cron job для ежедневных бэкапов в 3:00
crontab -e

# Добавьте строку:
0 3 * * * cd ~/apps/ai-interview && ./backup.sh >> ~/backup.log 2>&1
```

### Очистка диска

```bash
# Удаление неиспользуемых Docker образов
docker system prune -f

# Удаление всех неиспользуемых ресурсов (включая volumes - ОСТОРОЖНО!)
docker system prune -a --volumes

# Очистка логов
sudo journalctl --vacuum-time=7d
```

---

## 🐛 Troubleshooting

### Backend не запускается

```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs backend

# Частые проблемы:
# 1. Неверный DATABASE_URL
# 2. Нет доступа к базе данных (firewall)
# 3. Отсутствует DEEPSEEK_API_KEY
# 4. Отсутствует gcp-credentials.json
```

### Frontend не отображается

```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs frontend

# Проверить, что backend доступен
curl http://localhost:8000/health

# Пересобрать frontend
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### WebSocket не работает

```bash
# Убедитесь, что nginx правильно проксирует WebSocket
# Проверьте конфигурацию nginx (location /ws/)

# Проверьте CORS настройки в .env.production
CORS_ORIGINS=https://yourdomain.ru
```

### База данных недоступна

```bash
# Проверить подключение к PostgreSQL
docker run --rm postgres:15-alpine pg_isready -h xxxx.postgres.vkcloud.ru -p 5432 -U aihr_user

# Проверить firewall в VK Cloud
# Убедитесь, что IP вашей VM разрешен в правилах доступа к БД
```

### Нехватка памяти

```bash
# Проверить использование памяти
free -h

# Проверить использование Docker
docker stats

# Увеличить VM в VK Cloud или оптимизировать контейнеры
```

---

## 💰 Ориентировочная стоимость

**Минимальная конфигурация** (~1400-2000₽/мес):
- Cloud Server STD3-2-4: ~800₽/мес
- PostgreSQL STD3-1-2: ~600₽/мес
- Трафик: обычно бесплатно/минимально

**+ Внешние сервисы:**
- DeepSeek API: зависит от использования (~$0.14 за 1M токенов)
- Google Cloud TTS/STT: зависит от использования (~$4 за 1M символов)

---

## 📚 Дополнительные ресурсы

- [Документация VK Cloud](https://cloud.vk.com/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Google Cloud TTS](https://cloud.google.com/text-to-speech/docs)

---

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте секцию Troubleshooting выше
2. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
3. Создайте issue в GitHub репозитории проекта

---

**Успешного развертывания! 🚀**

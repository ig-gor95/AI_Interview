# ⚡ Quick Start - Timeweb Cloud

Быстрый старт для развертывания на Timeweb Cloud за 10 минут.

**💰 Стоимость: 490₽/месяц**

---

## 🎯 За 5 шагов к запуску

### 1️⃣ Создайте VPS на Timeweb (3 минуты)

1. **Зарегистрируйтесь:** [timeweb.cloud](https://timeweb.cloud/)
2. **"Облачные серверы"** → **"Создать сервер"**
3. **Выберите:**
   - **VPS Cloud 2** (490₽/мес) - 2 vCPU, 4GB RAM, 40GB SSD
   - OS: **Ubuntu 22.04 LTS**
4. **Создайте сервер**
5. **Запишите IP адрес**

---

### 2️⃣ Настройте сервер (3 минуты)

```bash
# Подключитесь к серверу
ssh root@YOUR_SERVER_IP

# Установите все необходимое одной командой
apt update && apt upgrade -y && \
apt install -y curl git ufw && \
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable && \
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && \
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
chmod +x /usr/local/bin/docker-compose

# Проверка
docker --version
docker-compose --version
```

---

### 3️⃣ Загрузите приложение (1 минута)

```bash
# Создайте директорию и клонируйте репозиторий
mkdir -p /opt/apps && cd /opt/apps
git clone YOUR_REPO_URL ai-interview
cd ai-interview

# ИЛИ загрузите через SFTP
```

---

### 4️⃣ Настройте конфигурацию (2 минуты)

```bash
# Создайте .env
cp .env.timeweb.example .env
nano .env
```

**Минимальная конфигурация:**

```env
# PostgreSQL
POSTGRES_USER=aihr_user
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
POSTGRES_DB=ai_hr_db

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-deepseek-key

# Security (сгенерируйте: openssl rand -hex 32)
SECRET_KEY=your_generated_secret_key_here

# CORS (замените на ваш IP)
CORS_ORIGINS=http://YOUR_SERVER_IP
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Добавьте Google Cloud credentials:**

```bash
nano gcp-credentials.json
# Вставьте JSON из Google Cloud Console
# Ctrl+O, Enter, Ctrl+X
```

---

### 5️⃣ Запустите деплой (1 минута)

```bash
# Запустите развертывание
./deploy-timeweb.sh

# Дождитесь завершения (5-10 минут)
```

---

## ✅ Готово!

Откройте в браузере: **http://YOUR_SERVER_IP**

---

## 🔄 Обновление

```bash
ssh root@YOUR_SERVER_IP
cd /opt/apps/ai-interview
./update-timeweb.sh
```

---

## 💾 Бэкапы

```bash
# Создание бэкапа
./backup-timeweb.sh

# Автоматические бэкапы (каждый день в 3:00)
crontab -e
# Добавьте:
0 3 * * * cd /opt/apps/ai-interview && ./backup-timeweb.sh >> /var/log/ai-hr-backup.log 2>&1
```

---

## 🔒 SSL (опционально, но рекомендуется)

**Если у вас есть домен:**

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx nginx

# Настройте Nginx
nano /etc/nginx/sites-available/ai-interview
```

**Добавьте:**

```nginx
server {
    listen 80;
    server_name yourdomain.ru;

    location / {
        proxy_pass http://localhost/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://localhost/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Активируйте
ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Получите SSL
certbot --nginx -d yourdomain.ru
```

---

## 💡 Полезные команды

```bash
# Статус контейнеров
docker-compose -f docker-compose.timeweb.yml ps

# Логи
docker-compose -f docker-compose.timeweb.yml logs -f

# Рестарт
docker-compose -f docker-compose.timeweb.yml restart

# Использование ресурсов
docker stats

# Свободное место
df -h
```

---

## 🐛 Проблемы?

```bash
# Смотрите логи
docker-compose -f docker-compose.timeweb.yml logs -f

# Проверьте статус
docker-compose -f docker-compose.timeweb.yml ps

# Перезапустите
docker-compose -f docker-compose.timeweb.yml restart

# Полная документация
cat DEPLOYMENT_TIMEWEB.md
```

---

## 📊 Что получилось

✅ **Backend API:** http://YOUR_IP:8000
✅ **Frontend:** http://YOUR_IP
✅ **PostgreSQL** в Docker (автоматические бэкапы)
✅ **Автообновление:** `./update-timeweb.sh`
✅ **Стоимость:** 490₽/месяц

---

## 📈 Масштабирование

**Если нужно больше мощности:**

1. В панели Timeweb увеличьте VPS до **Cloud 4** (990₽/мес)
   - 4 vCPU, 8GB RAM, 80GB SSD
2. Перезапустите контейнеры:
   ```bash
   docker-compose -f docker-compose.timeweb.yml restart
   ```

**Если нужна отказоустойчивость:**
- Мигрируйте на VK Cloud с Managed PostgreSQL
- См. `DEPLOYMENT_VK_CLOUD.md`

---

## 🎉 Поздравляем!

Ваше приложение работает на Timeweb Cloud.

**Следующие шаги:**
1. ✅ Настройте домен и SSL
2. ✅ Настройте автоматические бэкапы (cron)
3. ✅ Добавьте мониторинг

**Вопросы?** См. полную документацию: `DEPLOYMENT_TIMEWEB.md`

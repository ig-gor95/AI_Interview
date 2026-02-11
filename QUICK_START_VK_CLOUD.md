# ⚡ Quick Start - VK Cloud

Быстрый старт для развертывания на VK Cloud за 15 минут.

## 🎯 Пошаговая инструкция

### 1️⃣ Создайте инфраструктуру в VK Cloud

**VM (Виртуальная машина):**
- OS: Ubuntu 22.04 LTS
- Тип: STD3-2-4 (2 vCPU, 4GB RAM)
- Диск: 30GB SSD
- ✅ Включите внешний IP

**PostgreSQL (База данных):**
- Версия: PostgreSQL 15
- Тип: Single STD3-1-2 (1 vCPU, 2GB RAM)
- Диск: 10GB
- Имя БД: `ai_hr_db`
- Сохраните: хост, порт, логин, пароль

**Firewall:**
- Разрешите порты: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Разрешите VM доступ к PostgreSQL

---

### 2️⃣ Настройте сервер

```bash
# Подключитесь к серверу
ssh ubuntu@YOUR_SERVER_IP

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка
docker --version
docker-compose --version
```

---

### 3️⃣ Подготовьте приложение

```bash
# Клонируйте репозиторий
cd ~
git clone YOUR_REPO_URL ai-interview
cd ai-interview

# ИЛИ загрузите код через SFTP
```

---

### 4️⃣ Настройте конфигурацию

```bash
# Создайте .env.production
cp .env.production.example .env.production
nano .env.production
```

**Минимальная конфигурация:**

```env
# Database (из VK Cloud)
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/ai_hr_db
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ai_hr_db

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-key

# Security (сгенерируйте: openssl rand -hex 32)
SECRET_KEY=your_generated_secret_key

# CORS
CORS_ORIGINS=http://YOUR_SERVER_IP
```

**Добавьте Google Cloud credentials:**

```bash
# Создайте файл
nano gcp-credentials.json

# Вставьте JSON из Google Cloud Console
# Сохраните: Ctrl+O, Enter, Ctrl+X
```

---

### 5️⃣ Разверните приложение

```bash
# Запустите развертывание
./deploy.sh

# Дождитесь завершения (5-10 минут)
```

---

### 6️⃣ Проверьте работу

```bash
# Проверьте статус
docker-compose -f docker-compose.prod.yml ps

# Откройте в браузере
http://YOUR_SERVER_IP
```

---

## 🔄 Обновление приложения

```bash
# Зайдите на сервер
ssh ubuntu@YOUR_SERVER_IP
cd ~/ai-interview

# Получите изменения
git pull

# Обновите
./update.sh
```

---

## 🆘 Проблемы?

```bash
# Смотрите логи
docker-compose -f docker-compose.prod.yml logs -f

# Перезапустите
docker-compose -f docker-compose.prod.yml restart

# Полная документация
cat DEPLOYMENT_VK_CLOUD.md
```

---

## 💡 Полезные команды

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Логи frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Рестарт сервиса
docker-compose -f docker-compose.prod.yml restart backend

# Бэкап БД
./backup.sh

# Использование ресурсов
docker stats
```

---

## 📊 Итого: что получилось

✅ Backend API на `http://YOUR_IP:8000`
✅ Frontend на `http://YOUR_IP`
✅ PostgreSQL база данных
✅ Автоматические обновления через `./update.sh`
✅ Бэкапы через `./backup.sh`

**Цена:** ~1400-2000₽/месяц + API использование

---

**Готово! 🎉**

Для production не забудьте:
1. Настроить домен
2. Установить SSL сертификат
3. Настроить автоматические бэкапы

См. полную документацию: `DEPLOYMENT_VK_CLOUD.md`

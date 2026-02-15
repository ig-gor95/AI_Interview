# Быстрая установка HTTPS для screenme.pro

## 🚀 Автоматическая установка (РЕКОМЕНДУЕТСЯ)

Подключитесь к серверу Timeweb и выполните:

```bash
cd /путь/к/AI_Interview-main

# Делаем скрипт исполняемым
chmod +x deploy-ssl.sh

# Запускаем установку (потребуется ввести email)
sudo ./deploy-ssl.sh
```

Скрипт автоматически:
- ✅ Установит Certbot
- ✅ Получит SSL-сертификат для screenme.pro и www.screenme.pro
- ✅ Настроит nginx с HTTPS
- ✅ Перезапустит контейнеры
- ✅ Настроит автообновление сертификатов

**Стоимость: 0₽ навсегда!**

---

## 📋 После установки

### 1. Проверьте работу
```bash
# Откройте в браузере
https://screenme.pro

# Или проверьте через curl
curl -I https://screenme.pro
```

### 2. Обновите .env файл
```bash
nano .env
```

Добавьте/обновите:
```
CORS_ORIGINS=https://screenme.pro,https://www.screenme.pro
```

Перезапустите backend:
```bash
docker-compose -f docker-compose.timeweb.yml restart backend
```

### 3. Включите HSTS (опционально, после проверки)
```bash
nano nginx-ssl.conf
```

Раскомментируйте строку 33:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Перезапустите frontend:
```bash
docker-compose -f docker-compose.timeweb.yml restart frontend
```

---

## 🔧 Полезные команды

### Проверка статуса
```bash
# Проверка контейнеров
docker-compose -f docker-compose.timeweb.yml ps

# Логи frontend
docker logs ai_hr_frontend

# Логи backend
docker logs ai_hr_backend

# Проверка SSL сертификата
sudo certbot certificates
```

### Управление сертификатами
```bash
# Ручное обновление (если нужно)
sudo ./renew-ssl.sh

# Проверка срока действия
sudo certbot certificates

# Список всех сертификатов
sudo ls -la /etc/letsencrypt/live/
```

### Проблемы?
```bash
# Проверка DNS
nslookup screenme.pro

# Проверка портов
sudo netstat -tulpn | grep -E ':(80|443)'

# Пересоздание контейнеров
docker-compose -f docker-compose.timeweb.yml up -d --force-recreate
```

---

## 📚 Документация

Полная документация: `SSL-SETUP.md`

---

## ✅ Чеклист

- [ ] Выполнен `sudo ./deploy-ssl.sh`
- [ ] Сайт открывается по https://screenme.pro
- [ ] Обновлен .env файл (CORS_ORIGINS)
- [ ] Перезапущен backend
- [ ] Проверен редирект http → https
- [ ] (Опционально) Включен HSTS
- [ ] (Опционально) Проверка на ssllabs.com

---

**Стоимость: 0₽ | Обновление: автоматическое | Срок действия: бессрочно** ✨

# Настройка HTTPS для screenme.pro (бесплатно)

Полная инструкция по настройке SSL-сертификата для проекта на Timeweb.

## Стоимость: 0₽ (бесплатно)

Let's Encrypt предоставляет бесплатные SSL-сертификаты с автоматическим обновлением каждые 90 дней.

---

## Предварительные требования

1. ✅ Домен screenme.pro привязан к серверу (A-запись в DNS указывает на IP вашего сервера)
2. ✅ SSH доступ к серверу Timeweb
3. ✅ Порты 80 и 443 открыты в файрволе

Проверить DNS можно командой:
```bash
nslookup screenme.pro
```

Должен вернуться IP вашего сервера Timeweb.

---

## Быстрая установка (Копируй-Вставляй)

Используйте готовый скрипт:

```bash
# На сервере Timeweb в директории проекта
chmod +x deploy-ssl.sh
sudo ./deploy-ssl.sh
```

Скрипт автоматически:
- Установит Certbot
- Получит сертификат для screenme.pro и www.screenme.pro
- Перезапустит контейнеры с HTTPS
- Настроит автообновление

---

## Ручная установка (пошагово)

### Шаг 1: Установка Certbot на сервере

Подключитесь к серверу по SSH и выполните:

```bash
# Обновляем систему
sudo apt update

# Устанавливаем Certbot
sudo apt install certbot -y
```

---

### Шаг 2: Получение SSL-сертификата

#### 2.1. Остановите frontend контейнер

```bash
cd /path/to/AI_Interview-main
docker-compose -f docker-compose.timeweb.yml stop frontend
```

#### 2.2. Получите сертификат

**Замените your-email@example.com на вашу реальную почту:**

```bash
sudo certbot certonly --standalone \
  -d screenme.pro \
  -d www.screenme.pro \
  --agree-tos \
  --email your-email@example.com \
  --non-interactive
```

После успешного выполнения вы увидите:
```
IMPORTANT NOTES:
 - Congratulations! Your certificate has been saved at:
   /etc/letsencrypt/live/screenme.pro/fullchain.pem
```

---

### Шаг 3: Запуск с HTTPS

Конфигурация уже готова в `nginx-ssl.conf` (домен screenme.pro уже прописан).

```bash
# Перезапустите все контейнеры
docker-compose -f docker-compose.timeweb.yml down
docker-compose -f docker-compose.timeweb.yml up -d
```

#### Проверьте что всё работает

```bash
# Проверка статуса контейнеров
docker-compose -f docker-compose.timeweb.yml ps

# Проверка логов frontend
docker logs ai_hr_frontend

# Проверка HTTPS
curl -I https://screenme.pro
```

---

### Шаг 4: Автоматическое обновление сертификатов

SSL-сертификаты Let's Encrypt действительны 90 дней и требуют обновления.

#### 4.1. Настройте автоматическое обновление

```bash
# Делаем скрипт исполняемым
chmod +x renew-ssl.sh

# Узнайте полный путь к проекту
pwd

# Добавляем в crontab для автоматического обновления каждые 60 дней
sudo crontab -e
```

Добавьте в конец файла (замените `/path/to/AI_Interview-main/` на ваш путь):
```cron
# Обновление SSL-сертификатов каждые 60 дней в 3:00 ночи
0 3 1 */2 * cd /path/to/AI_Interview-main && /path/to/AI_Interview-main/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
```

#### 4.2. Проверка работы обновления (опционально)

```bash
# Тестовый запуск обновления
sudo ./renew-ssl.sh
```

---

## Проверка работы HTTPS

1. ✅ Откройте в браузере: https://screenme.pro
2. ✅ Проверьте что замок в адресной строке зеленый
3. ✅ Проверьте редирект: http://screenme.pro → https://screenme.pro
4. ✅ Проверьте www: http://www.screenme.pro → https://www.screenme.pro

---

## Возможные проблемы и решения

### Ошибка: "Address already in use" при получении сертификата

**Причина:** Порт 80 занят другим процессом.

**Решение:**
```bash
# Проверьте что frontend контейнер остановлен
docker-compose -f docker-compose.timeweb.yml stop frontend

# Проверьте что порт 80 свободен
sudo netstat -tulpn | grep :80

# Если что-то занимает порт, остановите это
sudo systemctl stop nginx  # если установлен nginx вне Docker
```

---

### Ошибка: DNS validation failed

**Причина:** DNS еще не обновился или неправильно настроен.

**Решение:**
```bash
# Проверьте DNS
nslookup screenme.pro

# Если IP неправильный, подождите распространения DNS (до 24 часов)
# Или проверьте настройки в панели управления доменом
```

---

### Ошибка: "Connection refused" при запуске контейнеров

**Причина:** Неправильный путь к сертификатам.

**Решение:**
```bash
# Проверьте что сертификаты существуют
sudo ls -la /etc/letsencrypt/live/screenme.pro/

# Должны быть файлы:
# - fullchain.pem
# - privkey.pem

# Проверьте логи nginx
docker logs ai_hr_frontend
```

---

### Браузер показывает "NET::ERR_CERT_AUTHORITY_INVALID"

**Причина:** Сертификат не применился или указан неправильно.

**Решение:**
```bash
# Проверьте логи nginx
docker logs ai_hr_frontend

# Пересоздайте контейнер
docker-compose -f docker-compose.timeweb.yml up -d --force-recreate frontend

# Проверьте что сертификат загружен в контейнер
docker exec ai_hr_frontend ls -la /etc/letsencrypt/live/screenme.pro/
```

---

## Дополнительные рекомендации

### Включение HSTS (после проверки что всё работает)

Раскомментируйте в `nginx-ssl.conf` строку 33:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Это заставит браузеры всегда использовать HTTPS.

```bash
# После изменения перезапустите frontend
docker-compose -f docker-compose.timeweb.yml restart frontend
```

### Проверка качества SSL

Проверьте конфигурацию SSL на: https://www.ssllabs.com/ssltest/analyze.html?d=screenme.pro

Цель: получить оценку **A** или **A+**

---

## Обновление .env файла

Обновите CORS_ORIGINS в `.env`:

```bash
CORS_ORIGINS=https://screenme.pro,https://www.screenme.pro
```

Перезапустите backend:
```bash
docker-compose -f docker-compose.timeweb.yml restart backend
```

---

## Итоговая стоимость

- **Let's Encrypt SSL**: 0₽
- **Обновление**: автоматическое, 0₽
- **Поддержка**: бесплатная документация

**Итого: 0₽ против 500-5000₽/год за платные сертификаты**

---

## Команды для диагностики

```bash
# Проверка DNS
nslookup screenme.pro
dig screenme.pro

# Проверка портов
sudo netstat -tulpn | grep -E ':(80|443)'

# Проверка сертификатов
sudo certbot certificates

# Проверка логов контейнеров
docker logs ai_hr_frontend
docker logs ai_hr_backend

# Проверка SSL онлайн
curl -vI https://screenme.pro
```

---

## Следующие шаги после установки

1. ✅ Проверьте работу сайта: https://screenme.pro
2. ✅ Настройте автообновление сертификатов через crontab
3. ✅ Включите HSTS для безопасности
4. ✅ Проверьте оценку SSL на ssllabs.com
5. ✅ Обновите CORS_ORIGINS в .env файле

---

Готово! Ваш сайт https://screenme.pro теперь работает по HTTPS с бесплатным SSL-сертификатом. 🔒✨

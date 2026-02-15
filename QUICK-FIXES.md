# Быстрые исправления и диагностика

## ✅ Исправлено: Проблемы с микрофоном

### Что было исправлено:
1. **Микрофон теперь отключается при нажатии кнопки** - исправлена логика в `toggleListening()`
2. **Микрофон автоматически отключается когда AI говорит** - добавлена автоматическая остановка записи
3. **Кнопка микрофона заблокирована когда AI говорит** - показывает "AI ГОВОРИТ" вместо "ОТВЕТ"

### Как применить исправления:

**На сервере выполните:**
```bash
cd /opt/apps/ai-interview

# Пересобрать frontend с исправлениями
docker-compose -f docker-compose.timeweb.yml build frontend

# Перезапустить контейнеры
docker-compose -f docker-compose.timeweb.yml up -d

# Проверить что всё работает
docker logs ai_hr_frontend --tail 50
```

---

## 🔍 Диагностика: Домен не открывается

### Шаг 1: Проверьте статус на сервере

**На сервере выполните:**
```bash
cd /opt/apps/ai-interview
bash check-status.sh
```

Это покажет:
- Статус всех контейнеров
- Открытые порты (80, 443, 8000)
- DNS настройки
- SSL сертификаты
- Логи

### Шаг 2: Частые проблемы и решения

#### Проблема: Порт 80 не открыт
```bash
# Проверка портов
sudo netstat -tulpn | grep -E ':(80|443)'

# Если порты не открыты - перезапустить frontend
docker-compose -f docker-compose.timeweb.yml restart frontend
```

#### Проблема: SSL сертификат не установлен
```bash
# Проверка сертификата
ls -la /etc/letsencrypt/live/screenme.pro/

# Если не найден - установить заново
sudo ./deploy-ssl.sh
```

#### Проблема: Nginx ошибка конфигурации
```bash
# Логи frontend (nginx)
docker logs ai_hr_frontend --tail 100

# Если ошибка в конфигурации - проверить nginx-ssl.conf
docker exec ai_hr_frontend nginx -t
```

#### Проблема: Frontend контейнер не запущен
```bash
# Проверка статуса
docker ps | grep frontend

# Если не работает - посмотреть почему
docker logs ai_hr_frontend

# Перезапуск
docker-compose -f docker-compose.timeweb.yml up -d --force-recreate frontend
```

### Шаг 3: Проверка снаружи

**С вашего компьютера:**
```bash
# Проверка HTTP
curl -I http://screenme.pro

# Проверка HTTPS
curl -I https://screenme.pro

# Проверка DNS
nslookup screenme.pro
```

### Ожидаемый результат:
```
HTTP/2 200
server: nginx
...
```

Если видите:
- `Connection refused` - порты закрыты или nginx не запущен
- `SSL certificate problem` - SSL не настроен
- `Could not resolve host` - DNS не работает

---

## 📊 Просмотр логов без SSH

### С локального компьютера:

**Создан скрипт `view-logs.sh`**

Отредактируйте настройки в файле:
```bash
nano view-logs.sh
```

Измените:
```bash
SERVER_USER="root"
SERVER_IP="45.89.190.11"
PROJECT_PATH="/opt/apps/ai-interview"
```

Затем запускайте:
```bash
chmod +x view-logs.sh
./view-logs.sh
```

Меню:
1. Логи frontend (последние 50 строк)
2. Логи backend (последние 50 строк)
3. Логи всех контейнеров
4. Статус контейнеров
5. Логи frontend в реальном времени
6. Логи backend в реальном времени
7. Полная диагностика

---

## 🚀 Быстрый чеклист при проблемах

### Домен не открывается:

- [ ] Проверить DNS: `nslookup screenme.pro` → должен вернуть 45.89.190.11
- [ ] Проверить контейнеры: `docker ps` → все 3 контейнера должны работать
- [ ] Проверить порты: `netstat -tulpn | grep :80` → должен быть nginx
- [ ] Проверить SSL: `ls /etc/letsencrypt/live/screenme.pro/` → должны быть сертификаты
- [ ] Проверить логи: `docker logs ai_hr_frontend`

### Микрофон не работает:

- [ ] Обновить frontend: `docker-compose build frontend && docker-compose up -d`
- [ ] Очистить кэш браузера: Ctrl+Shift+Delete
- [ ] Проверить разрешения: Settings → Privacy → Microphone → Разрешить для браузера

### Backend не отвечает:

- [ ] Проверить статус: `docker ps | grep backend`
- [ ] Проверить логи: `docker logs ai_hr_backend`
- [ ] Проверить переменные: `cat .env` → все ключи заполнены?
- [ ] Перезапустить: `docker-compose restart backend`

---

## 📝 Полезные команды

### На сервере:

```bash
# Быстрая диагностика
cd /opt/apps/ai-interview && bash check-status.sh

# Проверка всех контейнеров
docker-compose -f docker-compose.timeweb.yml ps

# Логи всех сервисов
docker-compose -f docker-compose.timeweb.yml logs -f

# Перезапуск всего
docker-compose -f docker-compose.timeweb.yml restart

# Пересборка и запуск
docker-compose -f docker-compose.timeweb.yml up -d --build

# Полная перезагрузка (стоп + старт)
docker-compose -f docker-compose.timeweb.yml down
docker-compose -f docker-compose.timeweb.yml up -d
```

### С локального компьютера:

```bash
# Просмотр логов
./view-logs.sh

# Проверка домена
curl -I https://screenme.pro

# SSH на сервер
ssh root@45.89.190.11
```

---

## 🆘 Если ничего не помогает

### 1. Полный перезапуск:
```bash
cd /opt/apps/ai-interview
docker-compose -f docker-compose.timeweb.yml down
docker-compose -f docker-compose.timeweb.yml up -d --build
```

### 2. Проверка файрвола:
```bash
# Проверка правил
sudo ufw status

# Открыть порты если закрыты
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. Переустановка SSL:
```bash
cd /opt/apps/ai-interview
sudo ./deploy-ssl.sh
```

### 4. Обращение в поддержку:

Соберите диагностику:
```bash
cd /opt/apps/ai-interview
bash check-status.sh > diagnostics.txt
docker-compose logs > docker-logs.txt
```

Отправьте файлы `diagnostics.txt` и `docker-logs.txt` в поддержку.

---

## 📞 Контакты

Файлы для диагностики:
- `check-status.sh` - проверка статуса на сервере
- `view-logs.sh` - просмотр логов с локального компьютера
- `SSL-SETUP.md` - полная инструкция по SSL
- `DNS-SETUP-GUIDE.md` - настройка DNS

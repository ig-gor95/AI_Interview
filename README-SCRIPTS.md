# Скрипты и инструкции для screenme.pro

Полный набор скриптов для управления проектом, диагностики и деплоя.

---

## 🚀 Быстрый старт

### На сервере:

```bash
cd /opt/apps/ai-interview

# 1. Применить исправления микрофона
chmod +x DEPLOY-CHANGES.sh
bash DEPLOY-CHANGES.sh

# 2. Проверить статус
chmod +x check-status.sh
bash check-status.sh
```

### На локальном компьютере:

```bash
cd AI_Interview-main

# Просмотр логов без SSH
chmod +x view-logs.sh
./view-logs.sh
```

---

## 📂 Список файлов

### 🔧 Деплой и управление

| Файл | Описание | Использование |
|------|----------|---------------|
| `DEPLOY-CHANGES.sh` | Деплой исправлений микрофона | `bash DEPLOY-CHANGES.sh` |
| `check-status.sh` | Полная диагностика проекта | `bash check-status.sh` |
| `view-logs.sh` | Просмотр логов с локального компьютера | `./view-logs.sh` |

### 🔒 SSL и HTTPS

| Файл | Описание | Использование |
|------|----------|---------------|
| `deploy-ssl.sh` | Автоматическая установка SSL | `sudo ./deploy-ssl.sh` |
| `deploy-ssl-force.sh` | Установка SSL без проверки DNS | `sudo ./deploy-ssl-force.sh` |
| `renew-ssl.sh` | Обновление SSL сертификатов | `sudo ./renew-ssl.sh` |
| `nginx-ssl.conf` | Конфигурация nginx с HTTPS | - |
| `SSL-SETUP.md` | Полная инструкция по SSL | Для чтения |
| `DNS-SETUP-GUIDE.md` | Настройка DNS | Для чтения |
| `QUICK-START-SSL.md` | Быстрая установка SSL | Для чтения |

### 📖 Документация

| Файл | Описание |
|------|----------|
| `QUICK-FIXES.md` | Решение частых проблем |
| `README-SCRIPTS.md` | Этот файл - обзор всех скриптов |

---

## 📝 Сценарии использования

### Сценарий 1: Деплой исправлений

Вы внесли изменения в код (например, исправили микрофон) и хотите применить их на сервере:

```bash
# На сервере
cd /opt/apps/ai-interview
bash DEPLOY-CHANGES.sh
```

### Сценарий 2: Домен не открывается

Домен screenme.pro не открывается, нужно понять почему:

```bash
# На сервере
cd /opt/apps/ai-interview
bash check-status.sh
```

Скрипт покажет:
- Статус контейнеров (работают ли они?)
- Открытые порты (80, 443 открыты?)
- DNS настройки (домен указывает на сервер?)
- SSL сертификаты (установлены ли?)
- Логи (есть ли ошибки?)

### Сценарий 3: Просмотр логов

Нужно быстро посмотреть логи без подключения по SSH:

```bash
# На вашем компьютере
cd AI_Interview-main
./view-logs.sh

# Выберите опцию:
# 1 - Логи frontend
# 2 - Логи backend
# 7 - Полная диагностика
```

### Сценарий 4: Установка HTTPS

Нужно настроить HTTPS для домена:

```bash
# Сначала настройте DNS (см. DNS-SETUP-GUIDE.md)
# Затем на сервере:
cd /opt/apps/ai-interview
sudo ./deploy-ssl.sh

# Если DNS еще не распространился:
sudo ./deploy-ssl-force.sh
```

### Сценарий 5: Проблемы с микрофоном

Микрофон не отключается или записывает когда AI говорит:

```bash
# 1. Применить исправления на сервере
cd /opt/apps/ai-interview
bash DEPLOY-CHANGES.sh

# 2. Очистить кэш браузера на компьютере
# Chrome/Edge: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
# Safari: Cmd+Option+E

# 3. Перезагрузить страницу в браузере
# Ctrl+Shift+R (жесткая перезагрузка)
```

---

## 🎯 Быстрые команды

### Проверка статуса:
```bash
docker ps                                      # Контейнеры работают?
docker logs ai_hr_frontend --tail 50          # Логи frontend
docker logs ai_hr_backend --tail 50           # Логи backend
netstat -tulpn | grep -E ':(80|443)'          # Порты открыты?
curl -I https://screenme.pro                  # Домен работает?
```

### Перезапуск:
```bash
docker-compose -f docker-compose.timeweb.yml restart           # Перезапуск всех контейнеров
docker-compose -f docker-compose.timeweb.yml restart frontend  # Только frontend
docker-compose -f docker-compose.timeweb.yml restart backend   # Только backend
```

### Полная перезагрузка:
```bash
docker-compose -f docker-compose.timeweb.yml down     # Остановить все
docker-compose -f docker-compose.timeweb.yml up -d    # Запустить все
```

### Пересборка:
```bash
docker-compose -f docker-compose.timeweb.yml build frontend  # Пересобрать frontend
docker-compose -f docker-compose.timeweb.yml up -d           # Запустить с новой сборкой
```

---

## 🔍 Что делать если...

### ...домен не открывается?

1. `bash check-status.sh` - диагностика
2. Проверить DNS: `nslookup screenme.pro` → должен быть 45.89.190.11
3. Проверить порты: `netstat -tulpn | grep :80`
4. Проверить логи: `docker logs ai_hr_frontend`

### ...SSL не работает?

1. Проверить сертификат: `ls /etc/letsencrypt/live/screenme.pro/`
2. Если нет - установить: `sudo ./deploy-ssl.sh`
3. Проверить nginx: `docker exec ai_hr_frontend nginx -t`

### ...контейнеры не запускаются?

1. Проверить логи: `docker-compose logs`
2. Проверить .env: `cat .env`
3. Пересобрать: `docker-compose build && docker-compose up -d`

### ...микрофон не работает?

1. Применить исправления: `bash DEPLOY-CHANGES.sh`
2. Очистить кэш браузера
3. Проверить разрешения микрофона в браузере

---

## 📞 Поддержка

### Сбор диагностики для поддержки:

```bash
cd /opt/apps/ai-interview

# Собрать информацию
bash check-status.sh > diagnostics.txt
docker-compose logs > docker-logs.txt

# Отправить файлы в поддержку:
# - diagnostics.txt
# - docker-logs.txt
```

---

## 🎓 Обучение

### Для новых пользователей:

1. Прочитайте `QUICK-FIXES.md` - решение частых проблем
2. Изучите `SSL-SETUP.md` - настройка HTTPS
3. Попробуйте `check-status.sh` - диагностика
4. Настройте `view-logs.sh` - удаленный просмотр логов

### Для опытных:

- Все скрипты используют Docker Compose
- Конфигурация в `docker-compose.timeweb.yml`
- Frontend: React + Vite
- Backend: Python FastAPI
- Database: PostgreSQL

---

**Версия:** 1.0
**Дата:** 2026-02-15
**Домен:** https://screenme.pro
**Сервер:** 45.89.190.11

# Настройка DNS для screenme.pro

## Проблема
```
✗ Домен screenme.pro не найден в DNS
```

Это означает что DNS записи не настроены или еще не распространились.

---

## Шаг 1: Узнайте IPv4 адрес вашего сервера

На сервере выполните:
```bash
curl -4 ifconfig.me
```

Запишите этот IP адрес, например: `95.163.240.222`

---

## Шаг 2: Настройте DNS записи

### Где настраивать?
Зайдите в панель управления где вы купили домен screenme.pro:
- Timeweb: Панель управления → Домены → screenme.pro → DNS
- Reg.ru: Личный кабинет → Домены → Управление доменом
- Cloudflare: Dashboard → screenme.pro → DNS
- Другие регистраторы: обычно раздел "DNS" или "Управление доменом"

### Какие записи добавить?

#### Запись 1: Основной домен
```
Тип: A
Имя: @ (или оставьте пустым, или screenme.pro)
Значение: ВАШ_IPv4_АДРЕС (например 95.163.240.222)
TTL: 3600 (или Auto)
```

#### Запись 2: Поддомен www
```
Тип: A
Имя: www
Значение: ВАШ_IPv4_АДРЕС (например 95.163.240.222)
TTL: 3600 (или Auto)
```

#### Запись 3: IPv6 (опционально, если есть)
```
Тип: AAAA
Имя: @
Значение: 2a03:6f01:1:2::1:c0de
TTL: 3600
```

### Пример настройки в Timeweb:

1. Войдите в панель управления Timeweb
2. Перейдите: Услуги → Домены
3. Найдите screenme.pro → Нажмите "Управление"
4. Вкладка "DNS-записи"
5. Нажмите "Добавить запись"
6. Добавьте записи как показано выше

### Пример настройки в Cloudflare:

1. Dashboard → Выберите домен screenme.pro
2. Раздел DNS → Records
3. Add record:
   - Type: A
   - Name: @
   - IPv4 address: ваш IP
   - Proxy status: OFF (важно!)
   - TTL: Auto
4. Повторите для www

---

## Шаг 3: Проверка DNS

### Сразу после настройки (на сервере):
```bash
# Проверка через Google DNS
nslookup screenme.pro 8.8.8.8

# Проверка через dig
dig screenme.pro +short

# Проверка www
nslookup www.screenme.pro 8.8.8.8
```

### Ожидаемый результат:
```
$ nslookup screenme.pro 8.8.8.8
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
Name:	screenme.pro
Address: 95.163.240.222  <-- ваш IPv4 адрес
```

---

## Шаг 4: Время распространения DNS

**Сколько ждать:**
- Обычно: 5-30 минут
- Максимум: до 24 часов (редко)

**Почему так долго:**
- DNS записи кэшируются на серверах по всему миру
- TTL (Time To Live) определяет как долго запись хранится в кэше

**Проверка распространения:**
- https://dnschecker.org/ - введите screenme.pro
- https://www.whatsmydns.net/ - глобальная проверка DNS

---

## Шаг 5: Установка SSL после настройки DNS

### Вариант A: Подождать распространения (рекомендуется)

Подождите 15-30 минут, проверьте DNS командой:
```bash
nslookup screenme.pro 8.8.8.8
```

Когда DNS вернет ваш IP, запустите:
```bash
sudo ./deploy-ssl.sh
```

### Вариант B: Установка без проверки DNS

Если DNS записи настроены, но еще не распространились:
```bash
chmod +x deploy-ssl-force.sh
sudo ./deploy-ssl-force.sh
```

Этот скрипт попытается получить сертификат даже если DNS проверка не проходит.

---

## Возможные проблемы

### 1. "DNS_PROBE_FINISHED_NXDOMAIN"
**Причина:** Домен не существует или DNS не настроен
**Решение:** Проверьте настройки DNS в панели управления доменом

### 2. DNS возвращает неправильный IP
**Причина:** Старые DNS записи кэшированы
**Решение:**
- Подождите TTL (обычно 1 час)
- Очистите DNS кэш на компьютере:
  ```bash
  # macOS
  sudo dscacheutil -flushcache

  # Linux
  sudo systemd-resolve --flush-caches

  # Windows
  ipconfig /flushdns
  ```

### 3. Certbot ошибка "DNS problem: NXDOMAIN"
**Причина:** Let's Encrypt не может найти домен
**Решение:** DNS еще не распространился, подождите 15-30 минут

### 4. У сервера только IPv6
**Причина:** Сервер не имеет IPv4 адреса
**Решение:**
- Проверьте есть ли IPv4: `curl -4 ifconfig.me`
- Если нет, добавьте IPv4 в панели Timeweb или используйте AAAA записи

---

## Быстрая диагностика

Выполните на сервере:
```bash
echo "=== IPv4 адрес сервера ==="
curl -4 ifconfig.me
echo ""

echo "=== IPv6 адрес сервера ==="
curl -6 ifconfig.me
echo ""

echo "=== DNS для screenme.pro ==="
nslookup screenme.pro 8.8.8.8
echo ""

echo "=== DNS для www.screenme.pro ==="
nslookup www.screenme.pro 8.8.8.8
echo ""

echo "=== Проверка порта 80 ==="
netstat -tulpn | grep :80
```

---

## Контрольный чеклист

- [ ] Узнал IPv4 адрес сервера (`curl -4 ifconfig.me`)
- [ ] Зашел в панель управления доменом
- [ ] Добавил A-запись для @ → IPv4
- [ ] Добавил A-запись для www → IPv4
- [ ] Подождал 15-30 минут
- [ ] Проверил DNS: `nslookup screenme.pro 8.8.8.8`
- [ ] DNS возвращает правильный IP
- [ ] Запустил `sudo ./deploy-ssl.sh` или `sudo ./deploy-ssl-force.sh`

---

## Полезные ссылки

- Проверка DNS: https://dnschecker.org/
- Проверка глобально: https://www.whatsmydns.net/
- Документация Timeweb DNS: https://timeweb.cloud/help/dns
- Let's Encrypt статус: https://letsencrypt.status.io/

---

После настройки DNS и получения сертификата вернитесь к `QUICK-START-SSL.md` для завершения установки.

# Решение проблем

## Проблема с загрузкой Docker образов

Если вы видите ошибку:
```
failed to authorize: failed to fetch anonymous token
write: broken pipe
```

### Решения:

1. **Перезапустить Colima** (если используете):
```bash
colima stop
colima start
```

2. **Проверить интернет-соединение**:
```bash
ping docker.io
```

3. **Попробовать загрузить образ вручную**:
```bash
docker pull python:3.11-slim
```

4. **Использовать другой базовый образ** (если проблема сохраняется):
   Можно временно изменить в Dockerfile на `python:3.11` вместо `python:3.11-slim`

5. **Проверить настройки прокси/VPN**:
   Если используете VPN или прокси, они могут блокировать доступ к Docker Hub

## Альтернативный запуск без Docker

Если Docker не работает, можно запустить локально:

```bash
cd backend

# Установить зависимости
pip install -r requirements.txt

# Настроить PostgreSQL локально или использовать SQLite для тестирования

# Запустить сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Проверка Docker

```bash
# Проверить что Docker работает
docker ps

# Проверить Colima
colima status

# Перезапустить Colima
colima restart
```


# Инструкция по запуску проекта

## Быстрый старт

### 1. Настройка окружения

Файл `.env` уже создан с вашим OpenAI API ключом. Убедитесь, что все переменные настроены правильно.

### 2. Запуск через Docker

```bash
cd backend

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f backendc
```

### 3. Создание базы данных и миграций

После того как PostgreSQL запустится (обычно через 10-15 секунд):

```bash
# Создать начальную миграцию
docker-compose exec backend alembic revision --autogenerate -m "Initial migration: create all tables"

# Применить миграции
docker-compose exec backend alembic upgrade head
```

### 4. Проверка работы

- API доступен на: http://localhost:8000
- API документация: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Переменные окружения

Важные переменные в `.env`:

- `OPENAI_API_KEY` - уже настроен ✅
- `DATABASE_URL` - для подключения к PostgreSQL
- `SECRET_KEY` - для JWT токенов (измените в production!)
- `CORS_ORIGINS` - разрешенные origins для фронтенда

## Остановка

```bash
docker-compose down
```

Для полной очистки (включая volumes):

```bash
docker-compose down -v
```

## Решение проблем

### БД не запускается
- Проверьте логи: `docker-compose logs postgres`
- Убедитесь что порт 5432 свободен

### Backend не запускается
- Проверьте логи: `docker-compose logs backend`
- Убедитесь что `.env` файл существует и содержит все переменные
- Проверьте что OpenAI API ключ валидный

### Миграции не применяются
- Убедитесь что PostgreSQL запущен: `docker-compose ps`
- Проверьте строку подключения в `.env`


# Быстрый старт (локальный запуск)

Если у вас проблемы с Docker build, можно запустить бэкенд локально, используя PostgreSQL из Docker.

## Шаг 1: Запустить только PostgreSQL

```bash
cd backend
docker-compose up -d postgres
```

Подождите 10-15 секунд пока PostgreSQL запустится.

## Шаг 2: Создать виртуальное окружение

```bash
python3 -m venv venv
source venv/bin/activate  # На macOS/Linux
# или
venv\Scripts\activate  # На Windows
```

## Шаг 3: Установить зависимости

```bash
pip install -r requirements.txt
```

## Шаг 4: Настроить подключение к БД

В `.env` файле измените `DATABASE_URL` на:
```
DATABASE_URL=postgresql+asyncpg://ai_hr_user:secure_password@localhost:5432/ai_hr_db
```

## Шаг 5: Создать миграции и применить

```bash
# Создать миграцию
alembic revision --autogenerate -m "Initial migration"

# Применить миграции
alembic upgrade head
```

## Шаг 6: Запустить сервер

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Или используйте готовый скрипт:
```bash
./run_local.sh
```

## Проверка

- API: http://localhost:8000
- Документация: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Остановка

```bash
# Остановить PostgreSQL
docker-compose stop postgres

# Деактивировать виртуальное окружение
deactivate
```


# Инструкция по созданию миграций

После запуска базы данных через Docker Compose, выполните следующие команды для создания и применения миграций:

## Создание первой миграции

```bash
# Войти в контейнер backend
docker-compose exec backend bash

# Создать начальную миграцию
alembic revision --autogenerate -m "Initial migration: create all tables"

# Применить миграцию
alembic upgrade head
```

Или без входа в контейнер:

```bash
docker-compose exec backend alembic revision --autogenerate -m "Initial migration: create all tables"
docker-compose exec backend alembic upgrade head
```

## Создание новых миграций

После изменения моделей:

```bash
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"
docker-compose exec backend alembic upgrade head
```

## Откат миграций

```bash
# Откатить последнюю миграцию
docker-compose exec backend alembic downgrade -1

# Откатить все миграции
docker-compose exec backend alembic downgrade base
```

## Проверка статуса

```bash
docker-compose exec backend alembic current
docker-compose exec backend alembic history
```


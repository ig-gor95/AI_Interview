# AI Interview - Структура проекта для Claude Code

> Этот файл помогает Claude Code быстро ориентироваться в проекте и находить нужные файлы

## Общая информация

**AI Interview** - платформа для проведения AI-интервью кандидатов с автоматической оценкой и аналитикой.

**Архитектура**: Монорепозиторий с фронтендом (React + TypeScript) и бэкендом (FastAPI + Python)

**База данных**: PostgreSQL

**WebSocket**: Для real-time коммуникации во время интервью

## Структура проекта

```
AI_Interview-main/
├── AI Tutor Dashboard-8/    # Frontend (React + TypeScript + Vite)
├── backend/                  # Backend (FastAPI + Python)
├── *.sh                      # Shell скрипты для деплоя и управления
├── docker-compose*.yml       # Docker конфигурации
└── *.md                      # Документация
```

---

## 1. FRONTEND (`AI Tutor Dashboard-8/`)

### Основная структура

```
AI Tutor Dashboard-8/
├── src/
│   ├── App.tsx              # Главный компонент приложения с роутингом
│   ├── main.tsx             # Точка входа React приложения
│   ├── index.css            # Глобальные стили (TailwindCSS)
│   ├── components/          # React компоненты
│   ├── lib/                 # Утилиты и библиотеки
│   ├── types/               # TypeScript типы
│   └── styles/              # Дополнительные стили
├── package.json
└── vite.config.ts
```

### Ключевые компоненты (`src/components/`)

**Дашборды и главные страницы:**
- `OrganizerDashboard.tsx` - Главный дашборд организатора интервью
  - Создание/редактирование/удаление интервью
  - Фильтры по вакансиям и компаниям
  - Генерация QR-кодов и ссылок
  - Статистика по интервью

- `CandidatesTab.tsx` - Таблица кандидатов с фильтрами и оценками
- `InterviewCandidatesPage.tsx` - Страница списка кандидатов по конкретному интервью

**Интервью:**
- `InterviewForm.tsx` - Форма создания/редактирования интервью (вопросы, компетенции, настройки)
- `InterviewLinksManager.tsx` - Управление уникальными ссылками для кандидатов
- `ChatScreen.tsx` - Экран чата во время интервью (WebSocket коммуникация)
- `AIAvatar.tsx` - Аватар AI-интервьюера с анимацией

**Оценка кандидатов:**
- `CandidateEvaluation.tsx` - Детальная оценка одного кандидата
- `CandidateEvaluationNew.tsx` - Новая версия компонента оценки
- `CandidateEvaluationReport_v2.tsx` - Отчет по оценке кандидата
- `ITTechnicalEvaluation.tsx` - Техническая оценка для IT-специалистов

**Kanban и визуализация:**
- `CandidatesKanban.tsx` - Kanban-доска для управления кандидатами
- `CandidatesKanbanDemo.tsx` - Demo-версия Kanban доски
- `CandidatesDemoList.tsx` - Demo-список кандидатов

**Регистрация и авторизация:**
- `CandidateRegistration.tsx` - Форма регистрации кандидата перед интервью
- `LoginPage.tsx` - Страница входа
- `RegisterPage.tsx` - Страница регистрации организатора

**UI компоненты:**
- `Header.tsx` - Шапка приложения
- `ui/` - Переиспользуемые UI-компоненты (кнопки, модалки, input'ы и т.д.)

### Библиотеки и утилиты (`src/lib/`)

- **`api.ts`** - ГЛАВНЫЙ ФАЙЛ для API запросов к бэкенду
  - `authAPI` - Авторизация и регистрация
  - `interviewsAPI` - CRUD интервью
  - `resultsAPI` - Результаты кандидатов
  - `publicAPI` - Публичные endpoints (без авторизации)

- **`i18n.ts`** - Интернационализация (русский/английский)
  - Все переводы текстов приложения
  - Атомы Jotai для переключения языка

- **`auth.ts`** - Функции для работы с авторизацией
- **`qualityRating.ts`** - Логика расчета качества кандидатов
- **`simulationTemplates.ts`** - Шаблоны для симуляции клиентов
- **`mockData.ts`** - Моковые данные для разработки
- **`demoCandidates.ts`** - Demo-кандидаты для демонстрации

### TypeScript типы (`src/types/`)

- `index.ts` - Все основные типы проекта:
  - `User` - Пользователь (организатор)
  - `Session` - Сессия интервью с кандидатом
  - `SessionParams` - Параметры интервью (вопросы, настройки)
  - `Interview` - Шаблон интервью
  - `Candidate` - Кандидат
  - `Result` - Результат оценки

---

## 2. BACKEND (`backend/`)

### Основная структура

```
backend/
├── app/
│   ├── main.py              # Точка входа FastAPI приложения
│   ├── config.py            # Конфигурация (env переменные)
│   ├── database.py          # Подключение к БД
│   ├── core.py              # Базовые настройки и middleware
│   ├── api/                 # API роуты (endpoints)
│   ├── models/              # SQLAlchemy модели БД
│   ├── schemas/             # Pydantic схемы для валидации
│   ├── services/            # Бизнес-логика и интеграции
│   ├── websocket/           # WebSocket handlers
│   ├── analyzers/           # Анализаторы ответов
│   └── utils/               # Утилиты
├── alembic/                 # Миграции БД
├── requirements.txt         # Python зависимости
├── Dockerfile               # Docker образ бэкенда
└── run_main.py              # Скрипт запуска бэкенда
```

### API роуты (`app/api/`)

**`interviews.py`** - Управление интервью (шаблонами)
- `POST /api/interviews` - Создать интервью
- `GET /api/interviews` - Получить список интервью организатора
- `GET /api/interviews/{id}` - Получить детали интервью
- `PUT /api/interviews/{id}` - Обновить интервью
- `DELETE /api/interviews/{id}` - Удалить интервью (soft delete)
- `POST /api/interviews/{id}/links` - Создать уникальную ссылку для кандидата
- `DELETE /api/interviews/{id}/links/{link_id}` - Удалить ссылку

**`public.py`** - Публичные endpoints (без авторизации)
- `POST /api/public/sessions` - Создать сессию кандидата
- `GET /api/public/sessions/{id}` - Получить информацию о сессии
- `POST /api/public/sessions/{id}/audio` - Загрузить аудио от кандидата
- `POST /api/public/sessions/{id}/complete` - Завершить сессию
- `GET /api/public/interviews/link/{access_token}` - Получить интервью по уникальной ссылке

**`results.py`** - Результаты и оценки кандидатов
- `GET /api/results` - Получить список результатов
- `GET /api/results/{id}` - Получить детальный результат
- `PUT /api/results/{id}` - Обновить результат (комментарии, статус)
- `POST /api/results/{id}/regenerate` - Перегенерировать оценку

**`auth.py`** - Авторизация и регистрация
- `POST /api/auth/register` - Регистрация организатора
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя

### Модели БД (`app/models/`)

- **`interview.py`** - Модель Interview (шаблон интервью)
  - Содержит вопросы, критерии оценки, требования
  - Связи: questions, evaluation_criteria, requirements, config

- **`session.py`** - Модель Session (сессия интервью с кандидатом)
  - Статусы: pending, in_progress, completed, abandoned
  - Хранит транскрипты, аудио, оценки

- **`candidate.py`** - Модель Candidate (кандидат)

- **`user.py`** - Модель User (организатор)

- **`evaluation.py`** - Модели для оценки (EvaluationCriteria, EvaluationResult)

- **`simulation.py`** - Модели для симуляции клиента

### Сервисы (`app/services/`)

**`openai_service.py`** - ГЛАВНЫЙ ФАЙЛ для работы с GPT
- ⭐ **Промпты для GPT хранятся здесь!**
- Функции:
  - `build_system_message()` - Создание system prompt для интервьюера
  - `generate_ai_response()` - Генерация ответа AI-интервьюера
  - `evaluate_candidate()` - Оценка кандидата через GPT
  - `generate_interview_questions()` - Генерация вопросов на основе позиции

**`speech_to_text_service.py`** - Распознавание речи (STT)
- Google Cloud Speech-to-Text
- Whisper (OpenAI) как fallback

**`google_cloud_tts_service.py`** - Синтез речи (TTS)
- Google Cloud Text-to-Speech
- Генерация голоса AI-интервьюера

**`evaluation_service.py`** - Сервис оценки кандидатов
- Анализ ответов
- Расчет scores
- Генерация рекомендаций

**`evaluation_background.py`** - Фоновая оценка после интервью

**`interview_generator.py`** - Генерация вопросов и критериев для интервью

**`audio_service.py`** - Обработка аудио файлов

**`session_service.py`** - Управление сессиями

**`stt_metrics.py`** - Метрики для STT

**`transcript_enhancer.py`** - Улучшение транскриптов

### WebSocket (`app/websocket/`)

- WebSocket endpoints для real-time коммуникации во время интервью
- Обмен сообщениями между кандидатом и AI

### Анализаторы (`app/analyzers/`)

- Анализаторы для оценки ответов кандидатов
- Детекция качества ответов, навыков и т.д.

---

## 3. БАЗА ДАННЫХ

**PostgreSQL** - основная БД

### Основные таблицы:

- `users` - Организаторы (рекрутеры)
- `interviews` - Шаблоны интервью
- `interview_questions` - Вопросы для интервью
- `evaluation_criteria` - Критерии оценки
- `sessions` - Сессии интервью с кандидатами
- `candidates` - Кандидаты
- `evaluation_results` - Результаты оценки
- `interview_links` - Уникальные ссылки для кандидатов

### Миграции БД:

- `backend/alembic/` - Alembic миграции
- `backend/alembic/versions/` - Версии миграций

---

## 4. ГДЕ ЧТО ИСКАТЬ

### Где промпты для GPT?

📍 **`backend/app/services/openai_service.py`**
- Функция `build_system_message()` - главный system prompt для AI-интервьюера
- Промпты для оценки кандидата
- Промпты для генерации вопросов

### Где логика интервью (сессий)?

📍 **Backend**:
- `backend/app/models/session.py` - Модель Session
- `backend/app/api/public.py` - API endpoints для сессий
- `backend/app/services/session_service.py` - Бизнес-логика сессий
- `backend/app/websocket/` - WebSocket для real-time интервью

📍 **Frontend**:
- `src/components/ChatScreen.tsx` - UI экрана интервью
- `src/lib/api.ts` - API клиент для сессий

### Где управление интервью (шаблонами)?

📍 **Backend**:
- `backend/app/models/interview.py` - Модель Interview
- `backend/app/api/interviews.py` - API endpoints для интервью

📍 **Frontend**:
- `src/components/OrganizerDashboard.tsx` - Список интервью
- `src/components/InterviewForm.tsx` - Форма создания/редактирования
- `src/components/InterviewLinksManager.tsx` - Управление ссылками
- `src/lib/api.ts` → `interviewsAPI` - API клиент

### Где оценка кандидатов?

📍 **Backend**:
- `backend/app/services/evaluation_service.py` - Логика оценки
- `backend/app/services/openai_service.py` - GPT оценка
- `backend/app/api/results.py` - API для результатов

📍 **Frontend**:
- `src/components/CandidateEvaluation.tsx` - Детальная оценка
- `src/components/CandidatesTab.tsx` - Таблица кандидатов с оценками
- `src/lib/qualityRating.ts` - Расчет качества

### Где список кандидатов?

📍 **Backend**:
- `backend/app/api/results.py` - GET /api/results

📍 **Frontend**:
- `src/components/CandidatesTab.tsx` - Главная таблица
- `src/components/InterviewCandidatesPage.tsx` - Кандидаты по интервью
- `src/components/CandidatesKanban.tsx` - Kanban-доска

### Где работа с аудио и распознавание речи?

📍 **Backend**:
- `backend/app/services/speech_to_text_service.py` - STT (распознавание)
- `backend/app/services/google_cloud_tts_service.py` - TTS (синтез речи)
- `backend/app/services/audio_service.py` - Обработка аудио
- `backend/app/api/public.py` → `/audio` endpoint - Загрузка аудио

### Где авторизация?

📍 **Backend**:
- `backend/app/api/auth.py` - API endpoints
- `backend/app/models/user.py` - Модель User

📍 **Frontend**:
- `src/components/LoginPage.tsx` - Вход
- `src/components/RegisterPage.tsx` - Регистрация
- `src/lib/auth.ts` - Утилиты авторизации
- `src/lib/api.ts` → `authAPI` - API клиент

### Где интернационализация (русский/английский)?

📍 **Frontend**:
- `src/lib/i18n.ts` - ВСЕ переводы
- `languageAtom` - Jotai атом для переключения языка
- `useTranslation()` - Hook для получения переводов

---

## 5. DEPLOYMENT & DEVOPS

### Docker

- `docker-compose.yml` - Dev окружение
- `docker-compose.prod.yml` - Production
- `docker-compose.timeweb.yml` - Timeweb Cloud
- `backend/Dockerfile` - Backend образ

### Deployment скрипты

- `deploy.sh` - Основной деплой
- `deploy-timeweb.sh` - Деплой на Timeweb
- `deploy-ssl.sh` - Деплой с SSL
- `update.sh` - Обновление без полного переразвертывания
- `backup.sh` - Бэкап БД

### Monitoring & Logs

- `view-logs.sh` - Просмотр логов
- `check-status.sh` - Проверка статуса сервисов
- `logs-stt.sh` - Логи STT сервиса

---

## 6. ЧАСТЫЕ ЗАДАЧИ

### Добавить новое поле в интервью:

1. Обновить `backend/app/models/interview.py` (модель БД)
2. Создать миграцию: `alembic revision --autogenerate -m "add field"`
3. Применить: `alembic upgrade head`
4. Обновить `backend/app/schemas/*.py` (Pydantic схемы)
5. Обновить `src/types/index.ts` (TypeScript типы)
6. Обновить `src/components/InterviewForm.tsx` (UI форма)

### Изменить промпты AI:

1. Открыть `backend/app/services/openai_service.py`
2. Найти `build_system_message()` или нужную функцию
3. Изменить промпт
4. Перезапустить бэкенд

### Добавить новый endpoint API:

1. Создать/обновить роутер в `backend/app/api/*.py`
2. Добавить функцию API в `src/lib/api.ts`
3. Использовать в компоненте через `await api.myNewMethod()`

### Добавить новый язык:

1. Обновить `src/lib/i18n.ts`
2. Добавить переводы во все секции `translations`
3. Обновить селектор языка в компонентах

---

## 7. ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Frontend
- React 18 + TypeScript
- Vite (сборщик)
- TailwindCSS (стили)
- Jotai (state management)
- Lucide React (иконки)
- React Hook Form (формы)
- Recharts (графики)
- QRCode (QR-коды)

### Backend
- FastAPI (Python framework)
- SQLAlchemy (ORM)
- Alembic (миграции)
- Pydantic (валидация)
- OpenAI API (GPT)
- Google Cloud (TTS + STT)
- Whisper (fallback STT)
- WebSockets

### Database
- PostgreSQL

### Infrastructure
- Docker + Docker Compose
- Nginx (proxy)
- Let's Encrypt (SSL)
- Timeweb Cloud / VK Cloud

---

## 8. ПОЛЕЗНЫЕ КОМАНДЫ

### Локальная разработка

```bash
# Запустить весь проект
./start_local.sh

# Запустить только бэкенд
cd backend && python run_main.py

# Запустить только фронтенд
cd "AI Tutor Dashboard-8" && npm run dev
```

### Production

```bash
# Деплой
./deploy.sh

# Обновление
./update.sh

# Логи
./view-logs.sh

# Бэкап
./backup.sh
```

### База данных

```bash
# Создать миграцию
cd backend
alembic revision --autogenerate -m "description"

# Применить миграции
alembic upgrade head

# Откатить миграцию
alembic downgrade -1
```

---

## 9. КЛЮЧЕВЫЕ ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЙ

### Изменение логики интервью:
- `backend/app/services/openai_service.py` (промпты)
- `backend/app/websocket/` (real-time логика)
- `src/components/ChatScreen.tsx` (UI интервью)

### Изменение оценки кандидатов:
- `backend/app/services/evaluation_service.py`
- `backend/app/services/openai_service.py` (промпты оценки)
- `src/components/CandidateEvaluation.tsx`

### Изменение UI дашборда:
- `src/components/OrganizerDashboard.tsx`
- `src/components/CandidatesTab.tsx`

### Изменение формы создания интервью:
- `src/components/InterviewForm.tsx`

### Добавление новых API endpoints:
- `backend/app/api/*.py`
- `src/lib/api.ts`

---

## 10. TROUBLESHOOTING

### Не работает STT:
- Проверить `backend/app/services/speech_to_text_service.py`
- Проверить Google Cloud credentials
- Проверить Whisper fallback

### Не работает TTS:
- Проверить `backend/app/services/google_cloud_tts_service.py`
- Проверить Google Cloud API key

### Проблемы с WebSocket:
- Проверить `backend/app/websocket/`
- Проверить CORS настройки в `backend/app/main.py`

### Проблемы с БД:
- Проверить миграции: `alembic current`
- Проверить подключение в `backend/app/database.py`

---

## 11. КОНТАКТЫ И РЕСУРСЫ

### Документация:
- `README.md` - Общая информация
- `backend/README.md` - Backend документация
- `DEPLOYMENT_*.md` - Инструкции по деплою
- `QUICK-START-*.md` - Быстрый старт

### Полезные файлы:
- `.env.production.example` - Пример конфига для production
- `.clauderules` - Правила для Claude Code
- `PLAN.md` - План развития проекта

---

**Последнее обновление**: 2024-02-23

*Этот файл создан для помощи Claude Code в навигации по проекту. Обновляйте его при значительных изменениях структуры.*
*Если что-то меняется - не забыть обновить*
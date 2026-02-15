# Google Cloud Speech-to-Text Timeout - Исправление

## Проблема

Ошибка: **"400 Audio Timeout Error: Long duration elapsed without audio. Audio should be sent close to real time."**

### Причина

Google Cloud Speech-to-Text требует непрерывный поток аудио в **реальном времени**. Если между отправкой аудио чанков проходит больше ~5 секунд, Google закрывает соединение с ошибкой таймаута.

### Что было неправильно

1. **Слишком большой bufferSize**: 4096 сэмплов = ~256ms задержка между обработкой
2. **Слишком большие чанки**: 3200 байт = 100ms аудио в одном чанке
3. **Редкая отправка**: Аудио отправлялось каждые 200-300ms, что создавало разрывы

## Исправления (уже в коде)

### Frontend (InterviewSessionView.tsx)

```typescript
// Было:
const bufferSize = 4096;  // ~256ms между обработкой
const STT_CHUNK_BYTES = 3200;  // 100ms аудио

// Стало:
const bufferSize = 2048;  // ~128ms между обработкой (быстрее в 2 раза)
const STT_CHUNK_BYTES = 1600;  // 50ms аудио (быстрее в 2 раза)
```

### Результат

- Аудио обрабатывается **в 2 раза чаще**
- Аудио отправляется **в 2 раза чаще**
- Между чанками проходит ~50-100ms вместо 200-300ms
- Google Cloud Speech получает непрерывный поток в реальном времени

## Проверка на сервере

### 1. Запустите диагностику

```bash
./check-stt.sh
```

Скрипт проверит:
- Наличие и корректность Google Cloud credentials
- Логи backend на ошибки STT
- Доступность WebSocket endpoint

### 2. Проверьте Google Cloud credentials

```bash
# Файл должен существовать
ls -la gcp-credentials.json

# Файл должен содержать валидный JSON
cat gcp-credentials.json | python3 -m json.tool
```

### 3. Проверьте что файл смонтирован в Docker

```bash
docker exec ai_hr_backend ls -la /app/gcp-credentials.json
```

Должно показать файл размером >100 байт.

### 4. Проверьте логи backend

```bash
docker logs ai_hr_backend --tail 100 | grep -i "stt\|speech"
```

Ищите:
- `[STT-WS] streaming started (ru-RU + en-US)` - STT запустился
- `[STT] Google -> final: "..."` - Google распознает текст
- `[STT] streaming_recognize error` - ошибки от Google

## Возможные проблемы

### 1. Google Cloud credentials не настроены

**Симптом**: В логах `Speech-to-Text not available`

**Решение**:
1. Создайте Service Account в Google Cloud Console
2. Включите "Cloud Speech-to-Text API"
3. Скачайте JSON ключ
4. Положите как `gcp-credentials.json` в корень проекта
5. Пересоберите backend

### 2. У Service Account нет прав

**Симптом**: Ошибки `403 Forbidden` в логах

**Решение**:
1. Откройте Google Cloud Console
2. IAM & Admin → Service Accounts
3. Найдите ваш Service Account
4. Добавьте роль: "Cloud Speech Client" или "Cloud Speech Administrator"

### 3. API не включен

**Симптом**: Ошибки `API not enabled` в логах

**Решение**:
1. Google Cloud Console → APIs & Services
2. Найдите "Cloud Speech-to-Text API"
3. Нажмите "Enable"

### 4. Таймауты всё ещё происходят

**Симптом**: Ошибки `Audio Timeout Error` даже после деплоя

**Возможные причины**:
- Микрофон пользователя не передает аудио (проблема с правами браузера)
- Медленное соединение с сервером (высокий ping)
- Backend контейнер перегружен (проверьте CPU/Memory)

**Проверка**:
```bash
# Проверьте загрузку backend
docker stats ai_hr_backend

# Проверьте что аудио чанки приходят
docker logs ai_hr_backend | grep "first audio chunk"
```

## Деплой исправлений

```bash
git pull origin master
./deploy.sh
```

Исправления будут применены после пересборки frontend контейнера.

## Тестирование

1. Откройте интервью
2. Нажмите кнопку микрофона
3. Начните говорить
4. Текст должен появляться **без задержек** (в течение 1-2 секунд)
5. Не должно быть ошибок в консоли браузера

Если появляется:
- `[Frontend] Backend STT error: Audio Timeout` - см. пункты выше
- `[Frontend] Backend STT connection timeout` - backend не отвечает (проверьте что контейнер запущен)
- `[Frontend] Speech recognition started` - перешло на браузерное распознавание (backend STT не работает)

## Дополнительная информация

### Формат аудио

Google Cloud Speech требует:
- Encoding: LINEAR16 (16-bit PCM)
- Sample Rate: 16000 Hz
- Channels: 1 (mono)

Frontend автоматически конвертирует в этот формат.

### Языки

Настроено распознавание:
- Primary: `ru-RU` (русский)
- Alternative: `en-US` (английский)

Google автоматически выбирает язык при распознавании.

### Speech Context

Добавлены подсказки для технических терминов:
- Figma, Jira, React, TypeScript, Docker, etc.

Это помогает правильно распознавать названия инструментов.

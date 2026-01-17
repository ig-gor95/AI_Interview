import { ArrowLeft, Play, FileText, Pause, Volume2, MessageSquare, Phone, User, Bot, CheckCircle2, AlertCircle, XCircle, Square } from 'lucide-react';
import { useState } from 'react';
import { Session, User as UserType } from '../types';
import { getResultsByOrganizerId } from '../lib/mockData';
import { scoreToQualityRating } from '@/lib/qualityRating';

interface Props {
  session: Session;
  user: UserType | null;
  onComplete: () => void;
  onBack: () => void;
}

export function CandidateEvaluation({ session, user, onComplete, onBack }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [checkedRecommendations, setCheckedRecommendations] = useState<Record<string, boolean>>({});

  const results = user ? getResultsByOrganizerId(user.id) : [];
  const result = results.find(r => r.sessionId === session.id) || results[0];

  const candidate = {
    name: result?.studentName || 'Анна Петрова',
    email: 'anna.petrova@example.com',
    position: session?.params?.position || session?.params?.topic || 'AI Интервью',
    date: result?.completedAt ? new Date(result.completedAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : '15 января 2026',
    duration: '8 мин 42 сек',
  };

  // Конвертация в числовой рейтинг 0-10
  const qualityRating = result?.qualityRating || (result?.score ? scoreToQualityRating(result.score) : 'suitable');
  const numericRating = {
    outstanding: 9.2,
    strong: 7.8,
    promising: 6.1,
    suitable: 4.5
  }[qualityRating] || 5.0;

  // 3 статуса (строго по ТЗ)
  const getInterviewStatus = (rating: number): 'recommended' | 'needs-clarification' | 'not-recommended' => {
    if (rating >= 7.5) return 'recommended';
    if (rating >= 5.0) return 'needs-clarification';
    return 'not-recommended';
  };

  const interviewStatus = getInterviewStatus(numericRating);

  const statusConfig = {
    'recommended': {
      icon: CheckCircle2,
      label: 'Рекомендован к следующему этапу',
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-300'
    },
    'needs-clarification': {
      icon: AlertCircle,
      label: 'Требует уточнений',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-300'
    },
    'not-recommended': {
      icon: XCircle,
      label: 'Не рекомендован',
      color: 'text-gray-700',
      bg: 'bg-gray-50',
      border: 'border-gray-300'
    }
  }[interviewStatus];

  const StatusIcon = statusConfig.icon;

  // Короткий summary (≤350 символов)
  const summary = interviewStatus === 'recommended'
    ? 'Кандидат уверенно справился с типовыми клиентскими ситуациями. Коммуникация понятная, стресс выдерживает. Есть нюансы в выражении эмпатии — рекомендуется уточнить на личной встрече.'
    : interviewStatus === 'needs-clarification'
    ? 'Кандидат показал базовые навыки работы с клиентами. Ответы иногда краткие, требуют уточнений. Рекомендуется дополнительная проверка опыта и навыков эмпатии на следующем этапе.'
    : 'Кандидат демонстрирует недостаточный уровень коммуникации для данной роли. Ответы несвязные, сложности с формулировками. Рекомендуется рассмотреть другие кандидатуры или предложить обучение.';

  const transcript = result?.transcript || [];

  // Ключевые сигналы (вместо сильных сторон/зон внимания)
  const keySignals = {
    confirmed: interviewStatus === 'recommended' ? [
      'Спокойно реагирует на давление',
      'Даёт конкретные решения',
      'Использует профессиональную лексику',
      'Приводит примеры из опыта'
    ] : interviewStatus === 'needs-clarification' ? [
      'Понимает суть вопросов',
      'Старается найти решение',
      'Не показывает агрессии'
    ] : [
      'Проходит интервью до конца',
      'Отвечает на вопросы'
    ],
    attention: interviewStatus === 'recommended' ? [
      'Иногда переходит к процессу без эмпатии',
      'В первой реплике пропустил выражение сочувствия'
    ] : interviewStatus === 'needs-clarification' ? [
      'Кратко отвечает, требует уточнений',
      'Не всегда приводит конкретные примеры',
      'Проверить опыт работы с конфликтами'
    ] : [
      'Несвязная речь',
      'Уходит от прямых ответов',
      'Сложности с формулировками',
      'Низкая стрессоустойчивость'
    ]
  };

  // Рекомендации к проверке (чекбоксы)
  const recommendationsToCheck = interviewStatus === 'recommended' ? [
    'Уточнить формат выражения эмпатии в стрессовых ситуациях',
    'Проверить реальные кейсы из прошлого опыта',
    'Обсудить ожидания по графику и развитию'
  ] : interviewStatus === 'needs-clarification' ? [
    'Уточнить опыт работы в похожих ситуациях',
    'Проверить готовность к обучению',
    'Обсудить конкретные примеры решения проблем',
    'Выявить мотивацию и долгосрочные планы'
  ] : [
    'Оценить возможность базового обучения',
    'Рассмотреть альтернативные позиции',
    'Проверить мотивацию к работе в данной сфере'
  ];

  // Базовые вопросы с интерпретацией (1 строка)
  const questions = session?.params?.questions || [];
  const basicQuestions = (questions.length > 0 ? questions : [
    'Расскажите, где вы живете и как далеко от нашего офиса?',
    'Почему вы хотите работать именно у нас?',
    'Какой у вас опыт работы с клиентами?',
    'Какие ваши сильные стороны?',
    'Какой график работы вам подходит?',
  ]).map((q, idx) => {
    const mockAnswers = [
      { 
        text: 'Живу в центре города, 15 минут от офиса. Готова выходить на работу в любое время.', 
        interpretation: '✓ Конкретный ответ, указаны детали и готовность'
      },
      { 
        text: 'Ваша компания имеет отличную репутацию, и я хочу развиваться в сфере обслуживания клиентов.', 
        interpretation: '✓ Показывает интерес к компании и области развития'
      },
      { 
        text: 'Работала официанткой в кафе год, там научилась общаться с разными типами посетителей.', 
        interpretation: '✓ Приводит релевантный опыт с конкретными примерами'
      },
      { 
        text: 'Я коммуникабельная, стрессоустойчивая и быстро обучаюсь новому.', 
        interpretation: '⚠️ Перечисляет качества без подтверждающих примеров'
      },
      { 
        text: 'Готова начать работу со следующей недели, график устраивает.', 
        interpretation: '⚠️ Ответ краткий, можно уточнить детали графика'
      },
    ];
    
    const answer = mockAnswers[idx % mockAnswers.length];
    return {
      question: typeof q === 'string' ? q : String(q),
      answer: answer.text,
      interpretation: answer.interpretation,
    };
  });

  // Аналитика по стилю речи (без процентов)
  const speechAnalysis = {
    detail: interviewStatus === 'recommended' ? 'высокая' : interviewStatus === 'needs-clarification' ? 'средняя' : 'низкая',
    structure: interviewStatus === 'recommended' ? 'высокая' : interviewStatus === 'needs-clarification' ? 'средняя' : 'низкая',
    relevance: interviewStatus === 'recommended' ? 'высокая' : interviewStatus === 'needs-clarification' ? 'средняя' : 'низкая',
  };

  // Симуляция с клиентом
  const simulationScenario = {
    dialog: [
      { role: 'ai', tone: 'aggressive', message: 'Это просто безобразие! Я жду свой заказ уже 40 минут! Вы вообще работать умеете?' },
      { role: 'user', message: 'Извините, пожалуйста, за ожидание. Сейчас проверю статус вашего заказа. Могу я узнать номер заказа?' },
      { role: 'ai', tone: 'aggressive', message: 'Какой номер? Вы что, издеваетесь? Я же говорю - жду 40 минут!' },
      { role: 'user', message: 'Понимаю ваше недовольство. Давайте я уточню информацию у кухни и сразу сообщу вам точное время. Могу предложить напиток за счет заведения, пока ожидаете.' },
      { role: 'ai', tone: 'calm', message: 'Ну ладно... Давайте кофе тогда. Но это не должно повторяться!' },
      { role: 'user', message: 'Конечно, я передам информацию менеджеру. Спасибо за понимание, ваш кофе будет через минуту.' },
    ],
    summary: [
      { type: 'positive', text: 'Сохранил спокойствие' },
      { type: 'positive', text: 'Предложил компенсацию' },
      { type: 'warning', text: 'В начале не хватило эмпатии' },
    ]
  };

  const toggleRecommendation = (rec: string) => {
    setCheckedRecommendations(prev => ({
      ...prev,
      [rec]: !prev[rec]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{candidate.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                <span>{candidate.position}</span>
                <span>•</span>
                <span>{candidate.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{candidate.date}</span>
                <span>•</span>
                <span>{candidate.duration}</span>
                <span>•</span>
                <span>AI Интервьюер</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Полный диалог
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                Прослушать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* ========== 1. ИТОГ ПЕРВИЧНОГО ИНТЕРВЬЮ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Итог первичного интервью</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Статус */}
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 ${statusConfig.border} ${statusConfig.bg}`}>
              <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
              <div>
                <p className="text-sm text-gray-600 mb-0.5">Статус</p>
                <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
              </div>
            </div>

            {/* Рейтинг */}
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-blue-200 bg-blue-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900">{numericRating.toFixed(1)}</div>
                <div className="text-xs text-blue-700 mt-0.5">из 10</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">Оценка интервью</p>
                <p className="text-xs text-gray-600">(не является решением о найме)</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-800 leading-relaxed">{summary}</p>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Основано на ответах и речи в рамках первичного интервью
          </p>
        </div>

        {/* ========== 2. КЛЮЧЕВЫЕ СИГНАЛЫ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Ключевые сигналы</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Что подтвердилось */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Что подтвердилось</h3>
              </div>
              <ul className="space-y-2">
                {keySignals.confirmed.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* На что обратить внимание */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">На что обратить внимание</h3>
              </div>
              <ul className="space-y-2">
                {keySignals.attention.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ========== 3. ЧТО РЕКОМЕНДУЕТСЯ ПРОВЕРИТЬ НА СЛЕДУЮЩЕМ ЭТАПЕ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Что рекомендуется проверить на следующем этапе</h2>
          
          <div className="space-y-3">
            {recommendationsToCheck.map((rec, i) => (
              <label
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {checkedRecommendations[rec] ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checkedRecommendations[rec] || false}
                  onChange={() => toggleRecommendation(rec)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700 flex-1">{rec}</span>
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4 italic">
            HR-специалист самостоятельно отмечает пункты для проверки
          </p>
        </div>

        {/* ========== 4. ОТВЕТЫ НА ВОПРОСЫ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Ответы на вопросы</h2>
          
          <div className="space-y-5">
            {basicQuestions.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-gray-900 flex-1">{item.question}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2 ml-9">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{item.answer}</p>
                  </div>
                </div>
                
                <div className="ml-9">
                  <p className="text-xs text-gray-600 italic">{item.interpretation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========== 5. АНАЛИТИКА ПО СТИЛЮ РЕЧИ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Аналитика по стилю речи</h2>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Детальность</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{speechAnalysis.detail}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Структурированность</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{speechAnalysis.structure}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Релевантность</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{speechAnalysis.relevance}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">
            Оценка дана относительно типовых ответов на эту роль
          </p>
        </div>

        {/* ========== 6. СИМУЛЯЦИЯ РЕАЛЬНОЙ СИТУАЦИИ ========== */}
        <div className="bg-white rounded-xl border-2 border-purple-200 p-6 sm:p-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-5">
            <p className="text-sm font-semibold text-purple-900">
              💬 Смоделирована реальная стрессовая ситуация с клиентом
            </p>
            <p className="text-xs text-purple-700 mt-1">
              AI сыграл роль агрессивного клиента, недовольного долгим ожиданием
            </p>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Диалог с клиентом</h2>
          
          {/* Диалог */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="space-y-3">
              {simulationScenario.dialog.map((msg, msgIdx) => (
                <div key={msgIdx} className={`${msg.role === 'user' ? 'ml-6' : ''}`}>
                  <div className="flex items-start gap-2 mb-1">
                    {msg.role === 'ai' ? (
                      <>
                        <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-purple-700">AI (клиент)</span>
                          {msg.tone === 'aggressive' && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                              агрессивный
                            </span>
                          )}
                          {msg.tone === 'calm' && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                              спокойный
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-green-700">{candidate.name}</span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm ml-6 ${msg.role === 'ai' ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Короткий итог */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Итог симуляции:</h3>
            <div className="space-y-2">
              {simulationScenario.summary.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  {item.type === 'positive' ? (
                    <span className="text-green-600 text-sm">✔</span>
                  ) : (
                    <span className="text-yellow-600 text-sm">⚠</span>
                  )}
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              ⚠️ <span className="font-semibold">Интерпретация дана на основе речевых паттернов</span>, не заменяет оценку руководителя
            </p>
          </div>
        </div>

      </div>

      {/* Full Transcript Sidebar */}
      {showTranscript && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white border-l border-gray-200 z-50 overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Полный диалог</h3>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Закрыть
            </button>
          </div>

          <div className="px-6 py-6 space-y-4">
            {transcript.map((message: any, i: number) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'ai' ? (
                    <>
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">AI Интервьюер</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{candidate.name}</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 ml-6">{message.message || message.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {isPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-xl">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(false)}
                className="w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center justify-center"
              >
                <Pause className="w-5 h-5" />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Запись интервью • {candidate.name}</span>
                  <span>2:34 / 8:42</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full">
                  <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <Volume2 className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

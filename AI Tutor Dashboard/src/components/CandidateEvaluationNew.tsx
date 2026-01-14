import { ArrowLeft, Play, FileText, Pause, Clock, CheckCircle, AlertCircle, MessageSquare, Phone, User, Bot, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Session, User as UserType } from '../types';
import { getResultsByOrganizerId } from '../lib/mockData';

interface Props {
  session: Session;
  user: UserType | null;
  onComplete: () => void;
  onBack: () => void;
}

export function CandidateEvaluation({ session, user, onComplete, onBack }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

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

  const transcript = result?.transcript || [];
  const userMessages = transcript.filter(t => t && t.role === 'user');
  const totalMessages = userMessages.length;

  // Симуляция реальной ситуации - ГЛАВНЫЙ ФОКУС
  const simulationScenario = {
    scenarioType: 'Недовольный клиент',
    scenarioDescription: 'AI сыграл роль агрессивного клиента, недовольного долгим ожиданием',
    clientBehavior: 'Повышенный тон, раздражение, требования немедленного решения',
    dialog: [
      { role: 'ai', tone: 'aggressive', message: 'Это просто безобразие! Я жду свой заказ уже 40 минут! Вы вообще работать умеете?' },
      { role: 'user', message: 'Извините, пожалуйста, за ожидание. Сейчас проверю статус вашего заказа. Могу я узнать номер заказа?' },
      { role: 'ai', tone: 'aggressive', message: 'Какой номер? Вы что, издеваетесь? Я же говорю - жду 40 минут!' },
      { role: 'user', message: 'Понимаю ваше недовольство. Давайте я уточню информацию у кухни и сразу сообщу вам точное время. Могу предложить напиток за счет заведения, пока ожидаете.' },
      { role: 'ai', tone: 'aggressive', message: 'Ну ладно... Давайте кофе тогда. Но это не должно повторяться!' },
      { role: 'user', message: 'Конечно, я передам информацию менеджеру. Спасибо за понимание, ваш кофе будет через минуту.' },
    ],
    observations: {
      stressHandling: 'Сохранил спокойствие на протяжении всего диалога. Голос оставался ровным даже при повышенном тоне клиента',
      empathy: 'Использовал фразы признания («понимаю ваше недовольство», «извините»), но в первой реплике сразу перешел к процессу вместо выражения сочувствия',
      problemSolving: 'Предложил конкретное решение (компенсация напитком) и четкий план действий (уточнить у кухни)',
      conflictResolution: 'Успешно разрядил напряжение. Клиент изменил тон с агрессивного на нейтральный',
      pacing: 'Небольшая пауза (2-3 сек) перед первым ответом, затем реагировал быстрее'
    },
    strengths: [
      'Быстро предложил компенсацию',
      'Сохранил профессиональный тон',
      'Довел разговор до позитивного финала',
      'Использовал конкретные формулировки («через минуту», «уточню у кухни»)'
    ],
    improvements: [
      'Вопрос про номер заказа мог быть воспринят как игнорирование проблемы',
      'Можно было сразу выразить сочувствие перед переходом к действиям'
    ]
  };

  // Операционные рекомендации (НЕ HR-оценка!)
  const operationalSummary = {
    readiness: 'Готов к работе с базовыми клиентскими ситуациями',
    considerations: [
      'Может самостоятельно работать с недовольными клиентами в стандартных сценариях',
      'Рекомендуется наблюдение в первые 2-3 смены при сложных конфликтах',
      'Хорошо подходит для позиций с четкими протоколами компенсации'
    ],
    nextSteps: [
      'Можно допускать к работе с клиентами после базового обучения стандартам компании',
      'Разобрать несколько примеров фраз для мгновенного выражения эмпатии',
      'Показать  протоколы эскалации сложных ситуаций'
    ]
  };

  // Вопросы о кандидате
  const questions = session?.params?.questions || [];
  const questionAnswers = (questions.length > 0 ? questions : [
    'Расскажите, где вы живете и как далеко от нашего офиса?',
    'Почему вы хотите работать именно у нас?',
    'Какой у вас опыт работы с клиентами?',
    'Какие ваши сильные стороны?',
    'Какой график работы вам подходит?',
    'Расскажите о навыках работы в команде',
  ]).map((q, idx) => {
    const mockAnswers = [
      'Живу в центре города, 15 минут от офиса. Готова выходить на работу в любое время.',
      'Ваша компания имеет отличную репутацию, и я хочу развиваться в сфере обслуживания клиентов.',
      'Работала официанткой в кафе год, там научилась общаться с разными типами посетителей.',
      'Я коммуникабельная, стрессоустойчивая и быстро обучаюсь новому.',
      'Готова начать работу со следующей недели, график устраивает.',
      'Умею работать в команде, хорошо справляюсь с многозадачностью.',
    ];
    
    return {
      question: typeof q === 'string' ? q : String(q),
      answer: mockAnswers[idx % mockAnswers.length],
      note: idx % 3 === 0 
        ? 'Конкретный ответ с деталями'
        : idx % 3 === 1
        ? 'Ответ по существу'
        : 'Краткий ответ без уточнений',
    };
  });

  // Ключевые фразы
  const keyPhrases = {
    effective: [
      {
        text: 'Понимаю ваше недовольство. Могу предложить напиток за счет заведения, пока ожидаете.',
        note: 'Эмпатия + конкретная компенсация'
      },
      {
        text: 'Извините за ожидание. Сейчас проверю статус и сразу вернусь с информацией.',
        note: 'Признание проблемы + план действий'
      }
    ],
    toImprove: [
      {
        text: 'Могу я узнать номер заказа?',
        note: 'В состоянии стресса клиента это может восприниматься как бюрократия. Лучше: «Давайте я сейчас же уточню у кухни статус»'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            
            {/* Готовность к работе */}
            <div className="border-l-4 border-blue-600 bg-blue-50 p-6 rounded-r-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{operationalSummary.readiness}</h2>
                  <div className="space-y-2 mb-4">
                    {operationalSummary.considerations.map((item, i) => (
                      <p key={i} className="text-sm text-gray-700">• {item}</p>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-2">Следующие шаги:</p>
                    {operationalSummary.nextSteps.map((step, i) => (
                      <p key={i} className="text-xs text-gray-700 mb-1">→ {step}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Симуляция - ГЛАВНЫЙ БЛОК */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Симуляция реальной ситуации</h3>
              </div>
              
              <div className="border-2 border-purple-200 rounded-lg">
                {/* Scenario Header */}
                <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{simulationScenario.scenarioType}</h4>
                  <p className="text-xs text-gray-600 mb-2">{simulationScenario.scenarioDescription}</p>
                  <div className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {simulationScenario.clientBehavior}
                  </div>
                </div>

                {/* Dialog */}
                <div className="p-4 space-y-3 bg-gray-50">
                  {simulationScenario.dialog.map((msg, msgIdx) => (
                    <div key={msgIdx} className={`${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                      <div className="flex items-start gap-2 mb-1">
                        {msg.role === 'ai' ? (
                          <>
                            <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-purple-700">AI (клиент)</span>
                                {msg.tone && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                    {msg.tone === 'aggressive' ? '😤 агрессивный тон' : 'нейтральный'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-green-700">{candidate.name}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 ml-6">{msg.message}</p>
                    </div>
                  ))}</div>

                {/* Observations */}
                <div className="border-t-2 border-purple-200 bg-white p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Наблюдения</h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Работа со стрессом:</p>
                      <p className="text-xs text-gray-600">{simulationScenario.observations.stressHandling}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Эмпатия:</p>
                      <p className="text-xs text-gray-600">{simulationScenario.observations.empathy}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Решение проблемы:</p>
                      <p className="text-xs text-gray-600">{simulationScenario.observations.problemSolving}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Результат:</p>
                      <p className="text-xs text-gray-600">{simulationScenario.observations.conflictResolution}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-2">✓ Сильные стороны:</p>
                      <ul className="space-y-1">
                        {simulationScenario.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-yellow-700 mb-2">→ Можно улучшить:</p>
                      <ul className="space-y-1">
                        {simulationScenario.improvements.map((imp, i) => (
                          <li key={i} className="text-xs text-gray-600">• {imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ключевые фразы */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Ключевые фразы</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <h4 className="text-sm font-semibold text-green-900">Эффективные формулировки</h4>
                  </div>
                  <div className="space-y-2">
                    {keyPhrases.effective.map((phrase, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-gray-800 italic mb-2">"{phrase.text}"</p>
                        <p className="text-xs text-green-700">✓ {phrase.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <h4 className="text-sm font-semibold text-yellow-900">Области для доработки</h4>
                  </div>
                  <div className="space-y-2">
                    {keyPhrases.toImprove.map((phrase, i) => (
                      <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-gray-800 mb-2">Фраза: <span className="italic">"{phrase.text}"</span></p>
                        <p className="text-xs text-yellow-700">→ {phrase.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Вопросы о кандидате */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-900">Ответы на вопросы</h3>
              </div>
              
              <div className="space-y-3">
                {questionAnswers.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-500">Вопрос {idx + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-3">{item.question}</p>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{item.answer}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Информация */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Информация</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Позиция</p>
                  <p className="text-gray-900">{candidate.position}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Дата</p>
                  <p className="text-gray-900">{candidate.date}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Длительность</p>
                  <p className="text-gray-900">{candidate.duration}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Реплик в диалоге</p>
                  <p className="text-gray-900">{totalMessages}</p>
                </div>
              </div>
            </div>

            {/* Краткая сводка */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Краткая сводка</h4>
              <div className="space-y-2 text-xs">
                <p className="text-gray-700">
                  <span className="font-medium">Голос:</span> спокойный, без нервозности
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Речь:</span> четкая, профессиональная лексика
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Реакция:</span> небольшая пауза при первом стрессе, затем быстрее
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Подход:</span> решение через компенсацию и конкретные действия
                </p>
              </div>
            </div>

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
            {transcript.map((message, i) => (
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
                    {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 ml-6">{message.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {isPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-xl">
          <div className="max-w-5xl mx-auto px-6 py-4">
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

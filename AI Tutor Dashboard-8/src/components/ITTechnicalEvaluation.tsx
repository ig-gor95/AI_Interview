import { ArrowLeft, Play, FileText, Pause, Volume2, Bot, User, CheckCircle2, AlertCircle, Code, Database, Layers, Server } from 'lucide-react';
import { useState } from 'react';
import { Session, SessionResult } from '../types';

interface Props {
  session: Session;
  result: SessionResult;
  onBack: () => void;
}

export function ITTechnicalEvaluation({ session, result, onBack }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const candidate = {
    name: result.studentName,
    role: session.params.position || 'Senior Developer',
    date: new Date(result.completedAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    duration: '1 час 15 мин (AI-фильтр + Live Coding)',
  };

  // Технические вопросы с экспертной оценкой
  const technicalQuestions = [
    {
      question: 'Как работает планировщик Go (Scheduler) и что такое G-M-P модель?',
      answer: 'Подробно описал взаимодействие горутин, системных потоков и процессоров. Упомянул work-stealing алгоритм.',
      assessment: '✓ Экспертная оценка: Полное понимание внутренностей языка.'
    },
    {
      question: 'В чем разница между Buffered и Unbuffered каналами в плане аллокации памяти?',
      answer: 'Четко объяснил механику блокировок и когда происходит копирование данных.',
      assessment: '✓ Конкретный ответ с техническими деталями.'
    },
    {
      question: 'Как бы вы спроектировали систему лайков для сервиса с 1 млн RPS?',
      answer: 'Предложил схему с кешированием в Redis и асинхронной записью в БД через Kafka. Обосновал выбор стратегии Write-behind.',
      assessment: '✓ Системное мышление и понимание масштабируемости.'
    }
  ];

  // Аналитика компетенций
  const competencies = [
    { name: 'Алгоритмическая база', level: 'Высокая', icon: Code },
    { name: 'Архитектурное мышление', level: 'Высокое', icon: Layers },
    { name: 'Качество кода (Clean Code)', level: 'Выше среднего', icon: FileText },
    { name: 'DevOps-культура', level: 'Средняя', icon: Server }
  ];

  // Code Review симуляция
  const codeReviewDialog = [
    {
      role: 'ai',
      name: 'AI (Team Lead)',
      message: 'Зачем нам здесь простая SQL база? Давай всё переложим в MongoDB, это же быстрее и модно. Схемы нам не нужны.'
    },
    {
      role: 'user',
      name: candidate.name,
      message: 'Не соглашусь. У нас здесь строго реляционные данные и важна ACID-транзакционность. Переход на NoSQL принесет больше проблем с консистентностью, чем выгоды в скорости. Я бы остался на PostgreSQL и настроил партиционирование.'
    },
    {
      role: 'ai',
      name: 'AI (Team Lead)',
      message: 'Но нам нужно масштабироваться вертикально! MongoDB это делает из коробки.'
    },
    {
      role: 'user',
      name: candidate.name,
      message: 'Масштабируемость нужна, но не ценой потери данных. Для наших задач по транзакциям PostgreSQL с лихвой хватит на ближайшие 2 года, если правильно настроить индексы. Давайте сначала оптимизируем запросы.'
    }
  ];

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
            Вернуться к списку
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Итог технического скрининга
              </h1>
              
              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Кандидат:</span>
                  <span className="font-semibold text-gray-900">{candidate.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Роль:</span>
                  <span className="font-medium text-gray-900">{candidate.role}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Дата:</span>
                  <span className="text-gray-700">{candidate.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">Длительность:</span>
                  <span className="text-gray-700">{candidate.duration}</span>
                </div>
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
                Слушать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* ========== 1. СТАТУС И ВЕРДИКТ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            {/* Статус */}
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-green-300 bg-green-50">
              <CheckCircle2 className="w-8 h-8 text-green-700" />
              <div>
                <p className="text-sm text-gray-600 mb-0.5">Статус</p>
                <p className="font-semibold text-green-700">Рекомендован (Strong Hire)</p>
              </div>
            </div>

            {/* Оценка */}
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-blue-200 bg-blue-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900">8.5</div>
                <div className="text-xs text-blue-700 mt-0.5">из 10</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">Техническая оценка</p>
                <p className="text-xs text-gray-600">Итоговый балл</p>
              </div>
            </div>
          </div>

          {/* Вердикт */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">📋 Вердикт</p>
            <p className="text-sm text-gray-800 leading-relaxed">
              Кандидат обладает глубокими знаниями рантайма Go и навыками проектирования распределенных систем. 
              Уверенно аргументирует выбор технологий. После проверки наших экспертов рекомендуется для финального интервью с CTO.
            </p>
          </div>
        </div>

        {/* ========== 2. КЛЮЧЕВЫЕ СИГНАЛЫ (Technical Signals) ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Ключевые сигналы (Technical Signals)</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Что подтвердилось */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Что подтвердилось</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Глубокое понимание Concurrency (Worker pools, Race conditions).</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Опыт работы с высоконагруженными БД (индексы, транзакции).</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Навык написания чистого, тестируемого кода.</span>
                </li>
              </ul>
            </div>

            {/* На что обратить внимание */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">На что обратить внимание</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  <span>Поверхностные знания Kubernetes (использовал только как готовый инструмент).</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  <span>Избыточное использование микросервисов там, где подошел бы монолит.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========== 3. ОТВЕТЫ НА ТЕХНИЧЕСКИЕ ВОПРОСЫ ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Ответы на технические вопросы (Hard Skills Check)</h2>
          
          <div className="space-y-5">
            {technicalQuestions.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5 hover:border-blue-200 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-1">{item.question}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3 ml-10">
                  <p className="text-sm text-gray-800"><strong>Ответ:</strong> {item.answer}</p>
                </div>
                
                <div className="ml-10">
                  <p className="text-sm text-green-700 font-medium">{item.assessment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========== 4. АНАЛИТИКА КОМПЕТЕНЦИЙ (Senior Level) ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Аналитика компетенций (Senior Level)</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {competencies.map((comp, idx) => {
              const Icon = comp.icon;
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">{comp.name}</p>
                    <p className="text-sm font-semibold text-gray-900">{comp.level}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== 5. СИМУЛЯЦИЯ: ТЕХНИЧЕСКИЙ СПОР НА CODE REVIEW ========== */}
        <div className="bg-white rounded-xl border-2 border-purple-200 p-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-5">
            <p className="text-sm font-semibold text-purple-900">
              💬 Симуляция: Технический спор на Code Review
            </p>
            <p className="text-xs text-purple-700 mt-1">
              ИИ сыграл роль Senior-разработчика, который навязывает неоптимальное, но "модное" решение.
            </p>
          </div>

          {/* Диалог */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-5">
            <div className="space-y-4">
              {codeReviewDialog.map((msg, idx) => (
                <div key={idx}>
                  <div className="flex items-start gap-2 mb-2">
                    {msg.role === 'ai' ? (
                      <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <User className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs font-semibold ${msg.role === 'ai' ? 'text-purple-700' : 'text-green-700'}`}>
                      {msg.name}:
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 ml-6 mb-3">
                    "{msg.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Итог симуляции */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Итог симуляции:</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-sm">✔</span>
                <span className="text-sm text-gray-700">Отстоял техническое решение.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-sm">✔</span>
                <span className="text-sm text-gray-700">Аргументировал позицию бизнесовыми метриками (надежность vs мода).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-sm">✔</span>
                <span className="text-sm text-gray-700">Проявил Senior-позицию (не просто исполняет, а думает).</span>
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
            {result.transcript.map((message: any, i: number) => (
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
                  <span>15:34 / 1:15:00</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full">
                  <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: '21%' }} />
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
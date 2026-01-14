import { useState, useEffect, useRef } from 'react';
import { Session, SessionResult, User } from '@/types';
import { AIAvatar } from './AIAvatar';
import { Mic, MicOff, Volume2, VolumeX, Clock, Target, Info, ArrowLeft, Loader2, Users as UsersIcon } from 'lucide-react';
import { saveResult } from '@/lib/mockData';

interface Props {
  session: Session;
  user: User | null;
  onComplete?: () => void;
  onBack?: () => void;
}

export function SessionView({ session, user, onComplete, onBack }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<SessionResult['transcript']>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startSession = () => {
    setSessionStarted(true);
    setShowInfo(false);
    // Приветствие от AI
    const greeting = generateGreeting();
    setIsSpeaking(true);
    setTranscript([{
      role: 'ai',
      message: greeting,
      timestamp: new Date().toISOString()
    }]);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  const generateGreeting = () => {
    const { params } = session;
    const position = params.position || params.topic;
    
    if (params.interviewType === 'screening') {
      return `Здравствуйте! Я проведу с вами интервью на позицию "${position}". Готовы начать?`;
    }
    
    const greetings = {
      friendly: `Привет! Я твой AI-тьютор. Рад помочь тебе изучить "${params.topic}". Готов начать?`,
      professional: `Здравствуйте. Я готов провести занятие по теме "${params.topic}". Приступим к обучению.`,
      motivating: `Отлично! Сегодня мы освоим "${params.topic}". Уверен, у тебя всё получится! Поехали!`
    };
    return greetings[params.personality];
  };

  const toggleListening = () => {
    if (!isMuted && !isProcessing) {
      if (!isListening) {
        // Включаем микрофон
        setIsListening(true);
      } else {
        // Выключаем микрофон и обрабатываем сообщение
        setIsListening(false);
        // Симуляция распознавания речи
        const userMessage = 'Расскажу о своем опыте работы...';
        addMessage('user', userMessage);
        respondToUser(userMessage);
      }
    }
  };

  const addMessage = (role: 'ai' | 'user', message: string) => {
    setTranscript(prev => [...prev, {
      role,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  const respondToUser = (userMessage: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsSpeaking(true);
      const aiResponse = generateAIResponse(userMessage);
      addMessage('ai', aiResponse);
      setTimeout(() => {
        setIsSpeaking(false);
        setIsProcessing(false);
      }, 3000);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string) => {
    const { params } = session;
    
    // Если это интервью, используем вопросы из сессии
    if (params.interviewType === 'screening' && params.questions && params.questions.length > 0) {
      const questionIndex = Math.floor(transcript.filter(t => t.role === 'ai').length / 2);
      if (questionIndex < params.questions.length) {
        return params.questions[questionIndex];
      }
      return 'Отлично! Спасибо за ваши ответы. У вас есть вопросы ко мне?';
    }
    
    // Обычные ответы для обучения
    const responses = [
      `Отличный вопрос! Давай разберём это подробнее...`,
      `Понимаю твой интерес. В контексте "${params.topic}" это работает так...`,
      `Хороший момент для практики. Попробуем разобрать пример...`,
      `Именно! И это напрямую связано с нашей целью обучения.`,
      `Интересное наблюдение! Это важный аспект темы "${params.topic}".`,
      `Да, верно! Продолжай в том же духе, у тебя отлично получается!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const endSession = () => {
    const result: SessionResult = {
      id: `result-${Date.now()}`,
      sessionId: session.id,
      studentId: user?.id,
      studentName: user?.name || 'Гость',
      studentEmail: user?.email,
      startedAt: new Date(Date.now() - timeElapsed * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      transcript,
      summary: session.params.interviewType === 'screening' 
        ? 'Интервью завершено. Кандидат ответил на все вопросы и продемонстрировал соответствующие навыки.'
        : 'Учебная сессия завершена. Студент активно участвовал в диалоге и показал хорошее понимание материала.',
      score: Math.floor(Math.random() * 30) + 70 // 70-100
    };
    
    saveResult(result);
    onComplete?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((timeElapsed / (session.params.duration * 60)) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Вернуться в кабинет"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base text-gray-900 truncate">
                {session.params.position || session.params.topic}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {session.params.company ? `${session.params.company} • ` : ''}{session.organizerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {sessionStarted && (
              <>
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="text-xs sm:text-sm text-blue-900">{formatTime(timeElapsed)}</span>
                  <span className="text-[10px] sm:text-sm text-blue-600">/ {session.params.duration} мин</span>
                </div>
                <button
                  onClick={endSession}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm"
                  title="Завершить интервью"
                >
                  Завершить
                </button>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`hidden sm:block p-2 rounded-lg transition-colors ${
                    showInfo 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={showInfo ? 'Скрыть информацию' : 'Показать информацию'}
                >
                  <Info className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
        {sessionStarted && (
          <div className="max-w-7xl mx-auto mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Avatar + Transcript */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Avatar Section */}
          <div className="flex-1 relative flex flex-col min-h-0">
            {/* Avatar container */}
            <div className="flex-1 relative">
              <AIAvatar isListening={isListening} isSpeaking={isSpeaking} />
            </div>
            
            {/* Mobile Start Session Button */}
            {!sessionStarted && (
              <div className="lg:hidden absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                  <div className="text-center mb-6">
                    <h3 className="text-lg text-gray-900 mb-2">Готовы начать?</h3>
                    <p className="text-sm text-gray-600">{session.params.position || session.params.topic}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-900">Уровень</span>
                      <span className="text-xs text-blue-700">
                        {session.params.difficulty === 'beginner' ? 'Начальный' :
                         session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-xs text-purple-900">Длительность</span>
                      <span className="text-xs text-purple-700">{session.params.duration} мин</span>
                    </div>
                  </div>

                  <button
                    onClick={startSession}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    Начать интервью
                  </button>

                  {!user && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        Вы не авторизованы. Результаты будут отправлены организатору.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Status indicator overlay */}
            {sessionStarted && (
              <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                {isListening && (
                  <div className="px-3 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse text-xs sm:text-sm">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping" />
                    <span>Слушаю вас...</span>
                  </div>
                )}
                {isProcessing && !isListening && (
                  <div className="px-3 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full shadow-lg flex items-center gap-2 text-xs sm:text-sm">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span>Обрабатываю...</span>
                  </div>
                )}
                {isSpeaking && !isListening && !isProcessing && (
                  <div className="px-3 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse text-xs sm:text-sm">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping" />
                    <span>Говорю...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript Panel - всегда видимая на десктопе */}
          {sessionStarted && (
            <div className="lg:w-96 xl:w-[28rem] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-[40vh] lg:max-h-none">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <h3 className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  Транскрипт диалога
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Запись в реальном времени
                </p>
              </div>
              
              {/* Messages - теперь только транскрипт без возможности ввода */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        msg.role === 'ai'
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {msg.role === 'ai' ? '🤖' : '👤'}
                      </div>
                      <span className="text-xs text-gray-600">
                        {msg.role === 'ai' ? 'AI Интервьюер' : (user?.name || 'Кандидат')}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className={`ml-8 p-3 rounded-lg text-sm ${
                      msg.role === 'ai'
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        🤖
                      </div>
                      <span className="text-xs text-gray-600">AI Интервьюер</span>
                    </div>
                    <div className="ml-8 p-3 rounded-lg bg-blue-50 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-900">Анализирую ответ...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="hidden md:block w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            {!sessionStarted ? (
              <div>
                <h3 className="text-gray-900 mb-4">Информация об интервью</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">Уровень</p>
                    <p className="text-blue-700">
                      {session.params.difficulty === 'beginner' ? 'Начальный' :
                       session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900 mb-2">Длительность</p>
                    <p className="text-purple-700">{session.params.duration} минут</p>
                  </div>

                  {session.params.evaluationCriteria && session.params.evaluationCriteria.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-900 mb-2">Критерии оценки</p>
                      <ul className="space-y-1">
                        {session.params.evaluationCriteria.map((criteria, i) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                            <span className="text-green-600">•</span>
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {session.params.questions && session.params.questions.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-gray-700" />
                      <h4 className="text-gray-900">Вопросы интервью</h4>
                    </div>
                    <ul className="space-y-2">
                      {session.params.questions.map((question, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 p-2 bg-gray-50 rounded">
                          <span className="text-blue-600 font-medium min-w-[20px]">{i + 1}.</span>
                          <span className="text-xs">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={startSession}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Начать интервью
                </button>

                {!user && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      Вы не авторизованы. Результаты будут отправлены организатору.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-gray-900 mb-4">Статистика</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">Статус</p>
                    <p className="text-blue-700">
                      {isListening ? '🎤 Слушаю' : 
                       isSpeaking ? '🗣️ Говорю' : 
                       isProcessing ? '⚙️ Обрабатываю' : '✅ Готов'}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900 mb-2">Сообщений в диалоге</p>
                    <p className="text-purple-700">{transcript.length}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900 mb-2">Прогресс</p>
                    <p className="text-green-700">{Math.round(progress)}%</p>
                  </div>
                </div>

                <button
                  onClick={endSession}
                  className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Завершить интервью
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice Controls - только голосовое управление */}
      {sessionStarted && (
        <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center gap-4 sm:gap-6">
              {/* Mute button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 sm:p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {/* Microphone button */}
              <div className="relative">
                <button
                  onClick={toggleListening}
                  disabled={isMuted || isProcessing}
                  className={`p-6 sm:p-8 rounded-full transition-all shadow-lg ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600 scale-110 animate-pulse'
                      : isMuted || isProcessing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                  }`}
                  title={
                    isListening ? 'Остановить запись' : 
                    isMuted ? 'Включите звук' :
                    isProcessing ? 'Подождите ответа' :
                    'Нажмите и говорите'
                  }
                >
                  {isListening ? (
                    <MicOff className="w-7 h-7 sm:w-8 sm:h-8" />
                  ) : (
                    <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
                  )}
                </button>
                
                {/* Recording indicator */}
                {isListening && (
                  <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>

              {/* Status text */}
              <div className="min-w-[180px] sm:min-w-[240px] text-center">
                <p className="text-sm sm:text-base text-gray-700 font-medium">
                  {isListening ? (
                    <span className="text-red-600">🔴 Запись голоса...</span>
                  ) : isMuted ? (
                    <span className="text-gray-500">🔇 Звук выключен</span>
                  ) : isProcessing ? (
                    <span className="text-blue-600">⏳ Обрабатываю...</span>
                  ) : (
                    <span className="text-gray-600">🎤 Нажмите для ответа</span>
                  )}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Только голосовое управление
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Session, SessionResult } from '@/types';
import { saveResult } from '@/lib/mockData';
import { generateQualityRating } from '@/lib/qualityRating';
import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Users, Settings, ChevronUp } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { useAuth } from '@/lib/auth';

interface Props {
  session: Session;
  onComplete?: () => void;
  onBack?: () => void;
}

export function SessionView({ session, onComplete, onBack }: Props) {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<SessionResult['transcript']>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Block body scroll when component is mounted
  useEffect(() => {
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    
    // Apply overflow hidden
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    // Restore on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startSession = () => {
    setSessionStarted(true);
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
        setIsListening(true);
      } else {
        setIsListening(false);
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
    
    if (params.interviewType === 'screening' && params.questions && params.questions.length > 0) {
      const questionIndex = Math.floor(transcript.filter(t => t.role === 'ai').length / 2);
      if (questionIndex < params.questions.length) {
        return params.questions[questionIndex];
      }
      return 'Отлично! Спасибо за ваши ответы. У вас есть вопросы ко мне?';
    }
    
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
      studentId: 'guest',
      studentName: 'Гость',
      studentEmail: null,
      startedAt: new Date(Date.now() - timeElapsed * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      transcript,
      summary: session.params.interviewType === 'screening' 
        ? 'Интервью завершено. Кандидат ответил на все вопросы и продемонстрировал соответствующие навыки.'
        : 'Учебная сессия завершена. Студент активно участвовал в диалоге и показал хорошее понимание материала.',
      qualityRating: generateQualityRating()
    };
    
    saveResult(result);
    onComplete?.();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {session.params.position || session.params.topic}
            </h2>
            <p className="text-gray-600">
              {session.params.company ? `${session.params.company} • ` : ''}{session.organizerName}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Длительность</span>
              <span className="text-sm font-medium text-gray-900">{session.params.duration} минут</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Уровень</span>
              <span className="text-sm font-medium text-gray-900">
                {session.params.difficulty === 'beginner' ? 'Начальный' :
                 session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
              </span>
            </div>

            {session.params.questions && session.params.questions.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Вопросов</span>
                <span className="text-sm font-medium text-gray-900">{session.params.questions.length}</span>
              </div>
            )}
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Войти в интервью
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full mt-3 py-3 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Вернуться назад
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1c1c1c] flex flex-col">
      {/* Top Bar - Professional Video Conference Style */}
      <div className="bg-[#232323] border-b border-gray-800/50 px-2 sm:px-6 py-2 sm:py-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Recording Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-800/60 rounded-lg backdrop-blur-sm">
              <div className="relative flex items-center">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-xs sm:text-sm text-white font-medium tabular-nums tracking-wide">{formatTime(timeElapsed)}</span>
            </div>
            
            {/* Session Title */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <div>
                <h2 className="text-sm font-semibold text-white leading-tight">
                  {session.params.position || session.params.topic}
                </h2>
                <p className="text-xs text-gray-400 leading-tight">
                  {session.params.company || session.organizerName}
                </p>
              </div>
            </div>
          </div>
          
          {/* Top Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-2.5 rounded-lg transition-all ${
                showParticipants ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700/50 text-gray-300'
              }`}
              title="Участники"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2.5 rounded-lg transition-all relative ${
                showChat ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700/50 text-gray-300'
              }`}
              title="Транскрипт"
            >
              <MessageSquare className="w-5 h-5" />
              {transcript.length > 0 && !showChat && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#232323]"></div>
              )}
            </button>
            <div className="w-px h-6 bg-gray-700/50 mx-1"></div>
            <button className="p-2.5 hover:bg-gray-700/50 rounded-lg transition-all text-gray-300" title="Настройки">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" style={{ minHeight: 0 }}>
        {/* Video Gallery */}
        <div className="flex-1 p-3 sm:p-6 flex flex-col lg:flex-row gap-3 sm:gap-6" style={{ minHeight: 0 }}>
          {/* AI Interviewer Video */}
          <div className="relative bg-black rounded-2xl overflow-hidden flex-1 shadow-2xl border border-gray-800/50 group" style={{ minHeight: 0 }}>
            {/* Video Frame */}
            <div className="absolute inset-0">
              <AIAvatar isListening={isListening} isSpeaking={isSpeaking} />
            </div>

            {/* Professional Name Tag */}
            <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/80 backdrop-blur-md rounded-xl flex items-center gap-3 z-10 border border-white/10">
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                </div>
              )}
              <div>
                <span className="text-sm text-white font-semibold">София</span>
                <p className="text-xs text-gray-400">Рекрутер</p>
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute top-4 left-4 px-4 py-2.5 bg-blue-600/90 backdrop-blur-md rounded-xl z-10 border border-blue-400/30 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-white font-medium ml-1">Анализирую отв��т</span>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Video (Self View) */}
          <div className="relative bg-black rounded-2xl overflow-hidden flex-1 shadow-2xl border border-gray-800/50 group" style={{ minHeight: 0 }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
              {/* Subtle background gradient orbs */}
              <div className="absolute inset-0 overflow-hidden opacity-60">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl" />
              </div>
              
              {/* Avatar circle matching recruiter style - фиксированный размер для десктопа */}
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl shadow-teal-500/30 flex items-center justify-center">
                {/* Inner glow layer */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                
                {/* Avatar initials */}
                <div className="relative z-10">
                  <span className="text-6xl font-light text-white/95 tracking-tight">
                    {(user?.name || 'Вы').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Subtle shine effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-full blur-xl" />
                </div>

                {/* Active state ring when listening */}
                {isListening && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full ring-4 ring-red-400/60"
                      style={{
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />
                    <div 
                      className="absolute -inset-2 rounded-full ring-2 ring-red-300/40"
                      style={{
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        animationDelay: '0.3s'
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Professional Name Tag */}
            <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/80 backdrop-blur-md rounded-xl flex items-center gap-3 z-10 border border-white/10">
              {isListening && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                </div>
              )}
              <div>
                <span className="text-sm text-white font-semibold">{user?.name || 'Вы'}</span>
                {isMuted && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MicOff className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">Микрофон выкл</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Speaking Indicator */}
            {isListening && (
              <div className="absolute top-4 left-4 px-4 py-2.5 bg-red-600/90 backdrop-blur-md rounded-xl animate-pulse z-10 border border-red-400/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-sm text-white font-semibold">Запись ответа...</span>
                </div>
              </div>
            )}

            {/* Self View Label */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium border border-white/10">
              Я
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 sm:w-96 bg-[#232323] border-l border-gray-800/50 flex flex-col flex-shrink-0 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-white font-semibold">Транскрипт диалога</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-gray-400 rotate-90" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 0 }}>
              {transcript.map((msg, i) => (
                <div key={i} className="space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      msg.role === 'ai' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      {msg.role === 'ai' ? 'AI' : (user?.name || 'Вы').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-gray-300">
                      {msg.role === 'ai' ? 'София' : (user?.name || 'Вы')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className={`text-sm leading-relaxed rounded-xl p-4 ${
                    msg.role === 'ai'
                      ? 'bg-blue-600/10 text-gray-100 border border-blue-500/20'
                      : 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-72 sm:w-80 bg-[#232323] border-l border-gray-800/50 flex flex-col flex-shrink-0 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-semibold">Участники</h3>
                <p className="text-xs text-gray-400 mt-0.5">2 участника</p>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-gray-400 rotate-90" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: 0 }}>
              {/* AI Interviewer */}
              <div className="flex items-center gap-3 p-3 hover:bg-gray-700/30 rounded-xl transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-sm text-white font-bold">С</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-semibold truncate">София</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">Рекрутер</span>
                    {isSpeaking && (
                      <div className="flex items-center gap-0.5">
                        <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Candidate */}
              <div className="flex items-center gap-3 p-3 hover:bg-gray-700/30 rounded-xl transition-all">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-sm text-white font-semibold">
                    {(user?.name || 'Вы').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-semibold truncate">{user?.name || 'Вы'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">Кандидат</span>
                    {isListening ? (
                      <div className="flex items-center gap-0.5">
                        <div className="w-1 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      </div>
                    ) : isMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-red-400" />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar - Professional Style */}
      <div className="bg-[#232323] border-t border-gray-800/50 px-2 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-2xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-4">
          {/* Left Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex flex-col items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all font-medium ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30' 
                  : 'bg-gray-700/50 hover:bg-gray-700 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span className="text-[9px] sm:text-[10px] leading-none hidden sm:block">{isMuted ? 'Вкл' : 'Mic'}</span>
            </button>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleListening}
              disabled={isMuted || isProcessing}
              className={`flex flex-col items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl transition-all font-semibold shadow-lg ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white scale-105 shadow-red-600/40 animate-pulse'
                  : isMuted || isProcessing
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/40'
              }`}
              title={
                isListening ? 'Остановить запись' : 
                isMuted ? 'Включите микрофон' :
                isProcessing ? 'Подождите ответа' :
                'Нажмите для ответа'
              }
            >
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-bold tracking-wide">
                {isListening ? 'ГОВОРЮ' : 'ОТВЕТ'}
              </span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={endSession}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all flex items-center gap-1.5 sm:gap-2.5 shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Конец</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
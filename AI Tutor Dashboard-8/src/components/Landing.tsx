import { ArrowRight, Sparkles, Target, Brain, Zap, MessageSquare, Video, TrendingUp, CheckCircle, Users, Settings, Clock, ThumbsUp, Filter, BarChart, ClipboardList, Headphones, Play, FileText, Link2, ListChecks, Shield, Lock, Phone, Coffee, Hotel, Scissors, HelpCircle } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { Logo, LogoIcon } from './Logo';
import { useState } from 'react';

interface Props {
  onNavigate: (view: 'login-organizer' | 'login-student' | 'evaluation-demo') => void;
}

export function Landing({ onNavigate }: Props) {
  const [demoListening, setDemoListening] = useState(false);
  const [demoSpeaking, setDemoSpeaking] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [demoStep, setDemoStep] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleDemoInteraction = () => {
    setDemoStep(0);
    setDemoMessage('');
    
    // Step 1: AI приветствие
    setTimeout(() => {
      setDemoStep(1);
      setDemoSpeaking(true);
      setDemoMessage('Здравствуйте! Меня зовут София, я проведу с вами интервью. Расскажите, пожалуйста, о вашем опыте работы с клиентами.');
    }, 500);

    // Step 2: AI слушает ответ
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
      setDemoMessage('Я работал в кафе...'); 
    }, 5000);

    // Step 3: AI задает уточняющий вопрос
    setTimeout(() => {
      setDemoListening(false);
      setDemoSpeaking(true);
      setDemoMessage('Отлично! А с какими сложными ситуациями вы сталкивались при общении с гостями?');
    }, 8000);

    // Step 4: AI снова слушает
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
      setDemoMessage('Был случай с недовольным клиентом...');
    }, 12000);

    // Step 5: AI благодарит
    setTimeout(() => {
      setDemoListening(false);
      setDemoSpeaking(true);
      setDemoMessage('Спасибо! Как бы вы поступили, если гость жалуется на холодное блюдо?');
    }, 15000);

    // Step 6: Симуляция ситуации
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
      setDemoMessage('Я бы извинился и предложил...');
    }, 19000);

    // Step 7: Завершение
    setTimeout(() => {
      setDemoListening(false);
      setDemoSpeaking(false);
      setDemoMessage('Отлично! Интервью завершено.');
      setDemoStep(0);
    }, 22000);

    // Полный сброс
    setTimeout(() => {
      setDemoMessage('');
      setDemoStep(0);
    }, 25000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <Logo size={48} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ScreenMe</h1>
                <p className="text-xs text-gray-500">AI-интервью</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login-student')}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Для кандидатов
              </button>
              <button
                onClick={() => onNavigate('login-organizer')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                Для организаторов
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6 border border-blue-100">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">AI для рекрутинга</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Сценарные собеседования
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  без участия HR
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Массовый найм линейного персонала. Имитация реальных рабочих ситуаций по стандарту компании. 
                Для любых сфер с массовым наймом.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => onNavigate('login-organizer')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span className="font-medium">Настроить интервью</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleDemoInteraction}
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Посмотреть демо</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">70%</div>
                  <div className="text-xs sm:text-sm text-gray-600">Экономия времени</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-xs sm:text-sm text-gray-600">Интервью без выходных</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">100%</div>
                  <div className="text-xs sm:text-sm text-gray-600">Охват кандидатов</div>
                </div>
              </div>
            </div>

            {/* Right Content - AI Avatar Demo */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 rounded-3xl p-6 border border-slate-700/50 shadow-2xl overflow-hidden">
                {/* Animated background effects - улучшенные градиенты */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full blur-3xl opacity-30 animate-pulse" />
                <div className="absolute top-1/2 -left-10 w-48 h-48 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full blur-3xl opacity-25 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-10 right-1/4 w-40 h-40 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
                
                {/* Conference Header */}
                <div className="relative mb-4 flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-700/70 to-gray-800/70 backdrop-blur-xl rounded-2xl border border-slate-500/30 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-sm text-white/90 font-semibold tracking-wide">AI-Интервью</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-gray-600/20">
                    <Clock className="w-3.5 h-3.5 text-blue-400/80" />
                    <span className="text-sm font-mono text-gray-300">05:23</span>
                  </div>
                </div>

                {/* Video Gallery - Grid Layout */}
                <div className="relative space-y-3">
                  {/* Recruiter Video */}
                  <div className="relative bg-gradient-to-br from-gray-800/80 to-black/80 rounded-2xl overflow-hidden shadow-xl border border-gray-600/40" style={{ height: '200px' }}>
                    <div className="absolute inset-0">
                      <AIAvatar isListening={demoListening} isSpeaking={demoSpeaking} />
                    </div>

                    {/* Overlay gradient for better text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Professional Name Tag */}
                    <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/80 backdrop-blur-xl rounded-xl flex items-center gap-3 z-10 border border-white/10 shadow-lg">
                      {demoSpeaking && (
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-white/90 font-bold tracking-wide">София</span>
                        <p className="text-xs text-emerald-400/90 font-medium">AI Рекрутер</p>
                      </div>
                    </div>

                    {/* Processing Indicator */}
                    {demoListening && (
                      <div className="absolute top-4 left-4 px-4 py-2.5 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-xl z-10 border border-blue-400/30 shadow-xl shadow-blue-500/20">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce shadow-lg"></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-sm text-white font-semibold ml-1">Анализирую...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Candidate Video */}
                  <div className="relative bg-gradient-to-br from-gray-700/70 via-gray-800/70 to-slate-900/70 rounded-2xl overflow-hidden border border-gray-600/40 shadow-xl" style={{ height: '200px' }}>
                    {/* Светящийся ореол вокруг аватара */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-teal-500/15 via-cyan-500/8 to-transparent blur-3xl" />
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Animated background ring */}
                      {demoListening && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 rounded-full border-4 border-red-500/30 animate-ping" />
                          <div className="absolute w-44 h-44 rounded-full border-2 border-red-400/20 animate-pulse" />
                        </div>
                      )}
                      
                      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-500/40">
                        {/* Inner glow */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-transparent" />
                        {/* Avatar letter */}
                        <span className="text-6xl font-light text-white relative z-10 tracking-tight">К</span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/40 via-white/10 to-transparent rounded-full blur-2xl" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Name tag */}
                    <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl">
                      <span className="text-sm text-white font-bold tracking-wide">Вы</span>
                      <p className="text-xs text-teal-400 font-medium">Кандидат</p>
                    </div>
                    
                    {/* Active indicator */}
                    {demoListening && (
                      <div className="absolute top-4 right-4 px-3 py-2 bg-red-500/90 backdrop-blur-xl rounded-lg border border-red-400/40 shadow-xl shadow-red-500/30 animate-pulse">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                          <span className="text-xs text-white font-bold">ГОВОРИТ</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control Bar */}
                <div className="relative mt-4 flex items-center justify-center gap-4 px-6 py-4 bg-gradient-to-r from-slate-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-lg">
                  <button className="w-11 h-11 rounded-full bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-slate-600/50">
                    <Video className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl ${
                      demoListening 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50' 
                        : 'bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50'
                    }`}
                  >
                    <div className={`rounded-full ${demoListening ? 'w-4 h-4 bg-white animate-pulse' : 'w-3 h-3 bg-white'}`} />
                  </button>
                  <button className="w-11 h-11 rounded-full bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-slate-600/50">
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                {/* Message bubble */}
                {demoMessage && (
                  <div className="relative mt-4 animate-fade-in">
                    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-2xl border-2 transition-all ${
                      demoListening 
                        ? 'bg-white border-blue-300' 
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-purple-400/50'
                    }`}>
                      {/* Background pattern */}
                      {!demoListening && (
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
                        </div>
                      )}
                      
                      <p className={`relative text-sm leading-relaxed ${demoListening ? 'text-gray-800 font-medium' : 'text-white font-medium'}`}>
                        {demoMessage}
                      </p>
                      
                      {demoListening && (
                        <div className="flex gap-1.5 mt-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                {(demoSpeaking || demoListening) && (
                  <div className="relative mt-4 flex items-center justify-center">
                    <div className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg border ${
                      demoSpeaking 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400/50 shadow-green-500/30' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white animate-pulse border-blue-400/50 shadow-blue-500/30'
                    }`}>
                      {demoSpeaking ? '🎙️ София говорит' : '👂 Вы отвечаете'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Journey Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6 border border-blue-100">
              <Settings className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Путь использования</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              От настройки до найма за 4 шага
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Простой и понятный процесс автоматизации найма сотрудников
            </p>
          </div>

          <div className="relative">
            {/* Vertical connecting line for desktop */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 transform -translate-x-1/2" />

            {/* Steps */}
            <div className="space-y-12 lg:space-y-20">
              {/* Step 1: Setup */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="lg:text-right mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full mb-4 border border-blue-100">
                      <span className="text-xs text-blue-700 font-semibold">ШАГ 1</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      Настройте интервью под вашу компанию
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 mb-6">
                      Создайте список вопросов о навыках и опыте. Добавьте симуляцию реальной ситуации — опишите, какого клиента должен имитировать AI и в каком сценарии.
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Занимает 2-3 минуты</span>
                    </div>
                  </div>
                  <div className="relative lg:pl-8">
                    <div className="absolute left-1/2 lg:left-0 top-0 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-2xl transform -translate-x-1/2 lg:translate-x-0 z-10">
                      1
                    </div>
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-blue-200 shadow-xl ml-8 lg:ml-12">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <ClipboardList className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">Список вопросов</p>
                            <p className="text-sm text-gray-600">Опыт работы, навыки общения, мотивация</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Headphones className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">Симуляция клиента</p>
                            <p className="text-sm text-gray-600">Недовольный гость, сложный заказчик, спешащий клиент</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Share Link */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="order-2 lg:order-1 relative lg:pr-8">
                    <div className="absolute left-1/2 lg:right-0 lg:left-auto top-0 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-2xl transform -translate-x-1/2 lg:translate-x-0 z-10">
                      2
                    </div>
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-purple-200 shadow-xl mr-8 lg:mr-12">
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-purple-600" />
                            <p className="text-xs font-semibold text-purple-700">УНИКАЛЬНАЯ ССЫЛКА</p>
                          </div>
                          <p className="text-sm font-mono text-gray-700 bg-white px-3 py-2 rounded border border-purple-100">
                            screeny.ai/interview/abc123
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900 mb-2">Разместите в:</p>
                          <ul className="space-y-1">
                            <li>• Описание вакансии на hh.ru</li>
                            <li>• Email рассылка кандидатам</li>
                            <li>• Социальные сети компании</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 lg:text-left mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full mb-4 border border-purple-100">
                      <span className="text-xs text-purple-700 font-semibold">ШАГ 2</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Поделитесь ссылкой на интервью
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      Получите уникальную ссылку сразу после создания. Кандидаты смогут пройти интервью в любое удобное время, без участия HR.
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Zap className="w-4 h-4" />
                      <span>Мгновенное создание ссылки</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: AI Conducts Interviews */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="lg:text-right mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 rounded-full mb-4 border border-pink-100">
                      <span className="text-xs text-pink-700 font-semibold">ШАГ 3</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      AI проводит интервью с кандидатами
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      AI-интервьюер София встречает кандидата в формате конференции. Ведёт live диалог голосом, задаёт вопросы, имитирует реальные рабочие ситуации с клиентами и оценивает ответы на основе заданных критериев.
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Video className="w-4 h-4" />
                      <span>24/7, без выходных и праздников</span>
                    </div>
                  </div>
                  <div className="relative lg:pl-8">
                    <div className="absolute left-1/2 lg:left-0 top-0 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-2xl transform -translate-x-1/2 lg:translate-x-0 z-10">
                      3
                    </div>
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-pink-200 shadow-xl ml-8 lg:ml-12">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-purple-700">AI АССИСТЕНТ</p>
                              <p className="text-xs text-gray-600">Веду интервью...</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-sm text-gray-700 border border-purple-100">
                            "Расскажите о вашем опыте работы с клиентами"
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                            <p className="font-semibold text-green-700">Запись</p>
                            <p className="text-green-600">Активна</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                            <p className="font-semibold text-blue-700">Анализ</p>
                            <p className="text-blue-600">В реальном времени</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Get Results */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="order-2 lg:order-1 relative lg:pr-8">
                    <div className="absolute left-1/2 lg:right-0 lg:left-auto top-0 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-2xl transform -translate-x-1/2 lg:translate-x-0 z-10">
                      4
                    </div>
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border-2 border-green-200 shadow-xl mr-8 lg:mr-12">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-500">СПИСОК КАНДИДАТОВ</p>
                          <ListChecks className="w-4 h-4 text-green-600" />
                        </div>
                        {[
                          { name: 'Анна Петрова', score: 'Отлично', color: 'green' },
                          { name: 'Иван Сидоров', score: 'Хорошо', color: 'blue' },
                          { name: 'Мария Иванова', score: 'Средне', color: 'yellow' }
                        ].map((candidate, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-300 rounded-full" />
                              <span className="text-sm font-medium text-gray-900">{candidate.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full bg-${candidate.color}-50 text-${candidate.color}-700 border border-${candidate.color}-200`}>
                              {candidate.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 lg:text-left mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full mb-4 border border-green-100">
                      <span className="text-xs text-green-700 font-semibold">ШАГ 4</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Получите отсортированных кандидатов
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      Смотрите список кандидатов, отсортированных по критериям. Читайте описательную аналитику, слушайте запись интервью или читайте текстовый транскрипт.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Автоматическая фильтрация кандидатов по скиллам</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Описательная аналитика без баллов</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Запись и транскрипт каждого интервью</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="mt-20 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 max-w-3xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Быстрая и честная оценка каждого кандидата
              </h3>
              <p className="text-gray-600 mb-6">
                AI помогает определить соответствие требованиям и даёт всем равные возможности. Кандидаты получают быстрый ответ, а HR экономит до 70% времени на первичный отбор.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Оценка реальных навыков</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Без холодных звонков</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Без ожидания ответов</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Запустите первое интервью за 3 минуты
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Просто опишите вакансию — AI сам подберёт критерии оценки.
            </p>
            <button
              onClick={() => onNavigate('login-organizer')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Начать бесплатно
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>


        </div>
      </section>

      {/* Evaluation Preview Section */}
      <section className="py-20 px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6 border border-purple-100">
                <BarChart className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">Умная аналитика</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Экран оценки кандидата
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  без психотипов
                </span>
              </h2>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Понятная оценка с конкретными примерами из диалога. Сильные стороны, зоны внимания и рекомендации к действию — вся информация для быстрого принятия решения о найме.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: <CheckCircle className="w-5 h-5" />,
                    title: 'Готовность к работе',
                    description: 'Краткое резюме поведения в стандартных и сложных ситуациях'
                  },
                  {
                    icon: <MessageSquare className="w-5 h-5" />,
                    title: 'Ключевые наблюдения',
                    description: 'Описательные формулировки без оценочных суждений'
                  },
                  {
                    icon: <Video className="w-5 h-5" />,
                    title: 'Запись и текст',
                    description: 'Прослушайте запись или прочитайте полный диалог'
                  }
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 text-purple-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-medium mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('evaluation-demo')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-2xl hover:shadow-pink-500/40 transition-all duration-300 inline-flex items-center gap-3"
              >
                <span className="font-medium">Посмотреть пимер оценки</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right: Preview Screenshot */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200 shadow-2xl">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-3xl opacity-40" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl blur-3xl opacity-40" />
                
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl">
                  {/* Mock Interface Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-300 rounded w-32 mb-2" />
                        <div className="h-2 bg-gray-200 rounded w-48" />
                      </div>
                    </div>
                  </div>

                  {/* Mock Content */}
                  <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                      <div className="h-6 bg-gray-900 rounded w-64 mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                      </div>
                    </div>

                    {/* Observations Cards */}
                    <div className="grid grid-cols-2 gap-3 py-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="h-2 bg-gray-300 rounded w-full mb-2" />
                          <div className="h-2 bg-gray-200 rounded w-4/5" />
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <div className="h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex-1 flex items-center justify-center gap-2">
                        <Play className="w-4 h-4 text-white" />
                        <div className="h-2 bg-white/90 rounded w-20" />
                      </div>
                      <div className="h-10 bg-gray-100 border border-gray-300 rounded-lg w-32 flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <div className="h-2 bg-gray-400 rounded w-12" />
                      </div>
                    </div>

                    {/* Recommendation Block */}
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mt-6">
                      <div className="h-3 bg-purple-600 rounded w-48 mb-3" />
                      <div className="space-y-2">
                        <div className="h-2 bg-purple-300 rounded w-full" />
                        <div className="h-2 bg-purple-200 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-700 font-medium">Без баллов и графиков</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with Security */}
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6 border border-blue-100">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Вопросы и ответы</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Часто задаваемые вопросы
            </h2>
            <p className="text-lg text-gray-600">
              Ответы на ключевые вопросы о работе ScreenMe
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {[
              {
                question: 'Насколько точна оценка AI?',
                answer: 'AI анализрует не только содержание ответов, но и тон, скорость речи, паузы и уверенность. Система обучена на тысячах реальных интервью и дает объективную описательну�� оценку без субъективности человека. Вы получаете практический отчет о поведении кандидата, а не абстрактные баллы.'
              },
              {
                question: 'Можно ли настроить под нашу компанию?',
                answer: 'Да, полностью. Вы создаете свои вопросы, описываете нужные симуляции клиентов и задаете критерии оценки. AI адаптируется под стандарты вашей компании и отрабатывает именно те ситуации, которые важны для вашего бизнеса.'
              },
              {
                question: 'Как кандидаты реагируют на робота?',
                answer: 'Большинство кандидатов положительно реагируют на формат — никакого стресса от личной встречи, можно пройти в удобное время, объективная оценка без предвзятости. Робот ведет себя дружелюбно и помогает кандидату раскрыться.'
              },
              {
                question: 'Сколько времени занимает одно интервью?',
                answer: 'В среднем 10-15 минут, зависит от количества вопросов. Кандидат может пройти интервью сразу после получения ссылки, а результаты появляются в вашем кабинете моментально после завершения.'
              },
              {
                question: 'Как начать работу?',
                answer: 'Зарегистрирйтесь, создайте интервью (2-3 минуты), получите ссылку и разместите её в вакансии. Первые кандидаты могут пройти интервью в тот же день. Техническая поддержка доступна на каждом этапе.'
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                  <span className={`text-purple-600 transition-transform flex-shrink-0 ${openFaqIndex === i ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                {openFaqIndex === i && (
                  <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>

          {/* Trust & Security Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Почему выбирают ScreenMe</h3>
                <p className="text-sm text-gray-600">Реальная польза для вашего бизнеса</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Экономия времени HR в 10 раз</h4>
                    <p className="text-sm text-gray-600">AI проводит первичный отбор 24/7, вы работаете только с готовыми кандидатами. Закрывайте вакансии в 3 раза быстрее.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Объективная оценка без предвзятости</h4>
                    <p className="text-sm text-gray-600">AI анализирует только профессиональные навыки, коммуникацию и стрессоустойчивость. Единые стандарты для всех кандидатов.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Снижение текучести на 40%</h4>
                    <p className="text-sm text-gray-600">Реалистичные сценарии интервью показывают кандидату настоящие задачи. Меньше разочарований после найма.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Запуск за 5 минут без интеграций</h4>
                    <p className="text-sm text-gray-600">Зарегистрируйтесь, опишите вакансию, отправьте ссылку кандидатам. Никаких сложных настроек и установок.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 text-center">
                <strong>Начните бесплатно:</strong> Первые 10 интервью в подарок. Оцените качество отбора, увидьте детальную аналитику и почувствуйте разницу уже на первой неделе.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Начните экономить время HR уже сегодня
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10">
            Настройте AI-интервью за 2 минуты и получите первых кандидатов
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('login-organizer')}
              className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:shadow-2xl transition-all duration-300 font-medium text-lg"
            >
              Настроить интервью
            </button>
            <button
              onClick={() => onNavigate('login-student')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium text-lg"
            >
              Пройти демо-интервью
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <LogoIcon size={40} />
              <div>
                <span className="text-white font-semibold block">ScreenMe</span>
                <span className="text-sm text-gray-500">AI-интервью для массового найма</span>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <button onClick={() => onNavigate('login-organizer')} className="hover:text-white transition-colors">
                Для организаторов
              </button>
              <button onClick={() => onNavigate('login-student')} className="hover:text-white transition-colors">
                Для кандидатов
              </button>
              <button onClick={() => onNavigate('evaluation-demo')} className="hover:text-white transition-colors">
                Демо оценки
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2024 ScreenMe AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
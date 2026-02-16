import { ArrowRight, Sparkles, Target, Brain, Zap, MessageSquare, Video, TrendingUp, CheckCircle, Users, Settings, Clock, ThumbsUp, Filter, BarChart, ClipboardList, Headphones, Play, FileText, Link2, ListChecks, Shield, Lock, Phone, Coffee, Hotel, Scissors, HelpCircle, QrCode, Smartphone, Send, Mail, X } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { Logo, LogoIcon } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ITRequestModal } from './ITRequestModal';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '../lib/i18n';

interface Props {
  onNavigate: (view: 'login-organizer' | 'login-student' | 'evaluation-demo') => void;
  onNavigateWithTab: (view: 'evaluation-demo', tab: 'mass' | 'it') => void;
}

export function Landing({ onNavigate, onNavigateWithTab }: Props) {
  const [demoListening, setDemoListening] = useState(false);
  const [demoSpeaking, setDemoSpeaking] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [demoStep, setDemoStep] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);
  const [showITModal, setShowITModal] = useState(false);

  // Shorter journey texts for better readability
  const shortJourney = {
    step1: {
      title: language === 'ru' ? 'Настройте сценарий интервью' : 'Configure Interview Scenario',
      desc: language === 'ru' 
        ? 'Опишите требования к вакансии, и AI сгенерирует вопросы. Для линейных позиций — soft skills, для IT — техстек.' 
        : 'Describe requirements and AI generates questions. Entry-level — soft skills, IT — tech stack.',
      time: language === 'ru' ? '2-3 минуты' : '2-3 minutes'
    },
    step2: {
      title: language === 'ru' ? 'Отправьте ссылку кандидатам' : 'Send Link to Candidates',
      desc: language === 'ru'
        ? 'Разместите уникальную ссылку в вакансии на hh.ru, Habr Career или отправьте напрямую.'
        : 'Post unique link in job boards or send directly to candidates.'
    },
    step3: {
      title: language === 'ru' ? 'AI проводит интервью' : 'AI Conducts Interview',
      desc: language === 'ru'
        ? 'AI ведёт живой диалог с кандидатом, адаптируясь под ответы. Задаёт уточняющие вопросы и оценивает компетенции.'
        : 'AI conducts live dialogue with candidate, adapting to answers. Asks follow-up questions and assesses competencies.'
    },
    step4: {
      title: language === 'ru' ? 'Получите отчёты и наймите' : 'Get Reports and Hire',
      desc: language === 'ru'
        ? 'Автоматический рейтинг с детальной аналитикой. Для IT — развёрнутый отчёт от эксперта с рекомендацией.'
        : 'Automatic ranking with detailed analytics. For IT — comprehensive expert report with recommendation.'
    }
  };
  const [showITRequestModal, setShowITRequestModal] = useState(false);
  const [evaluationTab, setEvaluationTab] = useState<'mass' | 'it'>('mass');

  const handleDemoInteraction = () => {
    setDemoStep(0);
    setDemoMessage('');
    
    // Step 1: AI приветствие
    setTimeout(() => {
      setDemoStep(1);
      setDemoSpeaking(true);
      setDemoMessage(t.demo.greeting);
    }, 500);

    // Step 2: AI слушает ответ
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
      setDemoMessage(t.demo.listening1); 
    }, 5000);

    // Step 3: AI задает уточняющий вопрос
    setTimeout(() => {
      setDemoListening(false);
      setDemoSpeaking(true);
      setDemoMessage(t.demo.question1);
    }, 8000);

    // Step 4: AI снова слушает
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
      setDemoMessage(t.demo.listening2);
    }, 12000);

    // Step 5: AI благодарит
    setTimeout(() => {
      setDemoListening(false);
      setDemoSpeaking(true);
      setDemoMessage(t.demo.question2);
    }, 15000);

    // Step 6: Симуляция ситуации
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
      setDemoMessage(t.demo.listening3);
    }, 19000);

    // Step 7: За��ершен��е
    setTimeout(() => {
      setDemoListening(false);
      setDemoSpeaking(false);
      setDemoMessage(t.demo.complete);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo size={40} className="sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">ScreenMe</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{t.nav.aiInterview}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher variant="light" size="sm" />
              <button
                onClick={() => onNavigate('login-student')}
                className="hidden sm:flex px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.nav.forCandidates}
              </button>
              <button
                onClick={() => onNavigate('login-organizer')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                {t.nav.forOrganizers}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
                <span className="text-sm text-blue-700 font-medium">{t.hero.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t.hero.title}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                {/* Primary CTA - Скрининг + тех интервью */}
                <button
                  onClick={() => setShowITRequestModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  {t.hero.ctaPrimary}
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Secondary CTA - Кабинет организатора */}
                <button
                  onClick={() => onNavigate('login-organizer')}
                  className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all duration-300 font-medium flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  {t.hero.ctaSecondary}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{t.hero.stat1Value}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{t.hero.stat1Label}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{t.hero.stat2Value}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{t.hero.stat2Label}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{t.hero.stat3Value}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{t.hero.stat3Label}</div>
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
                    <span className="text-sm text-white/90 font-semibold tracking-wide">{t.demo.aiInterview}</span>
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
                        <span className="text-sm text-white/90 font-bold tracking-wide">{t.demo.recruiterName}</span>
                        <p className="text-xs text-emerald-400/90 font-medium">{t.demo.recruiterRole}</p>
                      </div>
                    </div>

                    {/* Processing Indicator */}
                    {demoListening && (
                      <div className="absolute top-4 left-4 px-4 py-2.5 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-xl z-10 border border-blue-400/30 shadow-xl shadow-blue-500/20">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce shadow-lg"></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-sm text-white font-semibold ml-1">{t.demo.analyzing}</span>
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
                        <span className="text-6xl font-light text-white relative z-10 tracking-tight">{t.demoDetails.candidateInitial}</span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/40 via-white/10 to-transparent rounded-full blur-2xl" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Name tag */}
                    <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl">
                      <span className="text-sm text-white font-bold tracking-wide">{t.demo.you}</span>
                      <p className="text-xs text-teal-400 font-medium">{t.demo.candidate}</p>
                    </div>
                    
                    {/* Active indicator */}
                    {demoListening && (
                      <div className="absolute top-4 right-4 px-3 py-2 bg-red-500/90 backdrop-blur-xl rounded-lg border border-red-400/40 shadow-xl shadow-red-500/30 animate-pulse">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                          <span className="text-xs text-white font-bold">{t.demoDetails.speaking}</span>
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
                      {demoSpeaking ? `🎙️ ${t.demo.speaking}` : `👂 ${t.demo.youSpeaking}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choice Section - Two-Stage Process */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6 border border-purple-100">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">{t.choice.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t.choice.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t.choice.description}
            </p>
          </div>

          {/* Two-Stage Process */}
          <div className="space-y-8">
            {/* Stage 1: AI Screening */}
            <div className="relative bg-white rounded-3xl border-2 border-blue-200 shadow-xl overflow-hidden">
              {/* Stage Badge */}
              <div className="absolute top-6 left-6 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-full shadow-lg">
                  <Video className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">{t.choice.stage1Badge}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left: Description */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 mt-12 lg:mt-0">
                    {t.choice.stage1Title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    {t.choice.stage1Description}
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">{t.choice.stage1Feature1}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">{t.choice.stage1Feature2}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">{t.choice.stage1Feature3}</span>
                    </li>
                  </ul>

                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{t.choice.stage1Duration}</span>
                  </div>
                </div>

                {/* Right: Zoom Conference Mockup */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 p-6 lg:p-8 flex flex-col justify-center">
                  {/* Zoom Header */}
                  <div className="bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-xl rounded-xl px-4 py-3 mb-4 flex items-center justify-between border border-slate-600/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <span className="text-sm text-white/90 font-semibold">{t.choice.stage1ZoomTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-mono text-gray-300">00:05:23</span>
                    </div>
                  </div>

                  {/* AI Avatar Video */}
                  <div className="relative bg-gradient-to-br from-gray-800/80 to-black/80 rounded-xl overflow-hidden border border-gray-600/40 shadow-2xl mb-4" style={{ height: '280px' }}>
                    <div className="absolute inset-0">
                      <AIAvatar isListening={false} isSpeaking={true} />
                    </div>
                    
                    {/* Name Tag */}
                    <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" />
                          <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <div>
                          <span className="text-sm text-white font-bold block">{t.demo.recruiterName}</span>
                          <span className="text-xs text-emerald-400">{t.choice.stage1AIRole}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Badge */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-xl rounded-lg border border-blue-400/30 shadow-xl">
                      <span className="text-xs font-bold text-white">AI</span>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-4 border-2 border-purple-400/50 shadow-xl">
                    <p className="text-sm text-white font-medium leading-relaxed">
                      {t.choice.stage1Question}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow Connector */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-6 h-6 text-white rotate-90" />
                </div>
                <span className="text-sm font-medium text-gray-600 mt-2">{t.choice.thenLabel}</span>
              </div>
            </div>

            {/* Stage 2: Expert Technical Interview */}
            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-300 shadow-xl overflow-hidden mt-4">
              {/* Premium Badge */}
              <div className="absolute top-3 right-6 z-20">
                <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
                  <span className="text-sm font-bold text-white">PREMIUM</span>
                </div>
              </div>

              {/* Stage Badge */}
              <div className="absolute top-3 left-6 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-full shadow-lg">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">{t.choice.stage2Badge}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left: Zoom Conference with Expert */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 p-6 lg:p-8 flex flex-col justify-center order-2 lg:order-1">
                  {/* Zoom Header */}
                  <div className="bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-xl rounded-xl px-4 py-3 mb-4 flex items-center justify-between border border-slate-600/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <span className="text-sm text-white/90 font-semibold">{t.choice.stage2ZoomTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-500" />
                    </div>
                  </div>

                  {/* Expert Video Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Expert */}
                    <div className="relative bg-gradient-to-br from-gray-800/90 to-black/90 rounded-xl border-2 border-gray-600/50 overflow-hidden shadow-2xl aspect-video">
                      <div className="absolute top-3 left-0 right-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-2xl ring-4 ring-purple-400/30">
                          {t.experts.expert1Name.charAt(0)}
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-md rounded-lg border border-white/20 p-2 shadow-xl">
                          <span className="text-xs text-white font-bold block leading-tight">{t.experts.expert1Name}</span>
                          <span className="text-xs text-purple-300 font-medium">{t.choice.stage2ExpertRole}</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-2.5 py-1 bg-green-500 rounded-md shadow-lg">
                        <span className="text-xs font-bold text-white">LIVE</span>
                      </div>
                    </div>

                    {/* Candidate */}
                    <div className="relative bg-gradient-to-br from-gray-700/70 to-slate-900/70 rounded-xl border-2 border-gray-600/50 overflow-hidden shadow-2xl aspect-video">
                      <div className="absolute top-3 left-0 right-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold shadow-2xl ring-4 ring-teal-300/30">
                          K
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-md rounded-lg border border-white/20 p-2 shadow-xl">
                          <span className="text-xs text-white font-bold leading-tight">{t.demo.candidate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Code Review / Discussion Topic */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-purple-200 mb-1 font-semibold">{t.choice.stage2TopicLabel}</p>
                        <p className="text-sm text-white font-medium">{t.choice.stage2Topic}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Description */}
                <div className="p-8 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 mt-12 lg:mt-0">
                    {t.choice.stage2Title}
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    {t.choice.stage2Description}
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">{t.choice.stage2Feature1}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">{t.choice.stage2Feature2}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">{t.choice.stage2Feature3}</span>
                    </li>
                  </ul>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-purple-200 mb-6">
                    <span className="text-sm font-medium text-gray-600">{t.choice.durationLabel}</span>
                    <span className="text-lg font-bold text-purple-600">{t.choice.stage2Duration}</span>
                  </div>

                  <button 
                    onClick={() => setShowITRequestModal(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                  >
                    {t.choice.stage2Button}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Result Badge */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-900">{t.choice.resultBadge}</p>
                  <p className="text-xs text-green-700">{t.choice.resultDescription}</p>
                </div>
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
              <span className="text-sm text-blue-700 font-medium">{t.journey.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t.journey.title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {language === 'ru' 
                ? 'Полный цикл автоматизации рекрутинга с экспертной проверкой для IT'
                : 'Full recruitment automation cycle with expert verification for IT'}
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
                      <span className="text-xs text-blue-700 font-semibold">{t.journey.step1Badge}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      <span className="lg:hidden text-blue-600">1. </span>{shortJourney.step1.title}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 mb-6">
                      {shortJourney.step1.desc}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{shortJourney.step1.time}</span>
                    </div>
                  </div>
                  <div className="relative lg:pl-8">
                    <div className="hidden lg:flex absolute left-1/2 lg:left-0 top-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl items-center justify-center text-white text-3xl font-bold shadow-2xl transform -translate-x-1/2 lg:translate-x-0 z-10">
                      1
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-blue-200 shadow-xl lg:ml-12">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <ClipboardList className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t.journey.step1Questions}</p>
                            <p className="text-sm text-gray-600">{t.journey.step1QuestionsDesc}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Headphones className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t.journey.step1Simulation}</p>
                            <p className="text-sm text-gray-600">{t.journey.step1SimulationDesc}</p>
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
                    <div className="hidden lg:flex absolute lg:right-0 lg:left-auto top-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl items-center justify-center text-white text-3xl font-bold shadow-2xl transform lg:translate-x-0 z-10">
                      2
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-purple-200 shadow-xl lg:mr-12">
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-purple-600" />
                            <p className="text-xs font-semibold text-purple-700">{t.journey.step2LinkLabel}</p>
                          </div>
                          <p className="text-sm font-mono text-gray-700 bg-white px-3 py-2 rounded border border-purple-100">
                            screeny.ai/interview/abc123
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <QrCode className="w-4 h-4 text-blue-600" />
                            <p className="text-xs font-semibold text-blue-700">{t.journey.step2QrLabel}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center">
                              <QrCode className="w-10 h-10 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600">{t.journey.step2QrDesc}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900 mb-3">{t.journey.step2PlaceIn}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-200">hh.ru</span>
                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">Habr Career</span>
                            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">GetIT</span>
                            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">LinkedIn</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 lg:text-left mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full mb-4 border border-purple-100">
                      <span className="text-xs text-purple-700 font-semibold">{t.journey.step2Badge}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      <span className="lg:hidden text-purple-600">2. </span>{shortJourney.step2.title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      {shortJourney.step2.desc}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Smartphone className="w-4 h-4 text-purple-600" />
                        <span>{t.journey.step2Mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <QrCode className="w-4 h-4 text-purple-600" />
                        <span>{t.journey.step2QrOffline}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span>{t.journey.step2NoApp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: AI Conducts Interviews */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="lg:text-right mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 rounded-full mb-4 border border-pink-100">
                      <span className="text-xs text-pink-700 font-semibold">{t.journey.step3Badge}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      <span className="lg:hidden text-pink-600">3. </span>{shortJourney.step3.title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      {shortJourney.step3.desc}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Video className="w-4 h-4" />
                      <span>{t.journey.step3Time}</span>
                    </div>
                  </div>
                  <div className="relative lg:pl-8">
                    <div className="hidden lg:flex absolute lg:left-0 top-0 w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl items-center justify-center text-white text-3xl font-bold shadow-2xl transform lg:translate-x-0 z-10">
                      3
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-pink-200 shadow-xl lg:ml-12">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-purple-700">{t.step3Details.aiAssistant}</p>
                              <p className="text-xs text-gray-600">{t.step3Details.conducting}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-sm text-gray-700 border border-purple-100">
                            "{t.step3Details.question}"
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                            <p className="font-semibold text-green-700">{t.step3Details.recording}</p>
                            <p className="text-green-600">{t.step3Details.active}</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                            <p className="font-semibold text-blue-700">{t.step3Details.analysis}</p>
                            <p className="text-blue-600">{t.step3Details.realtime}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3.5: Connect IT Expert (half-step) */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="order-2 lg:order-1 relative lg:pr-8">
                    <div className="hidden lg:flex absolute lg:right-0 lg:left-auto top-0 w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl items-center justify-center text-white text-2xl font-bold shadow-2xl transform lg:translate-x-0 z-10">
                      3.5
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-purple-300 shadow-xl lg:mr-12">
                      {/* Zoom-like Expert Interview Interface */}
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Video className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400 font-medium">{language === 'ru' ? 'Live интервью' : 'Live interview'}</span>
                          </div>
                          <Clock className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-700 rounded-lg p-3 relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2">
                              АС
                            </div>
                            <p className="text-xs text-white font-medium">{language === 'ru' ? 'Алексей Смирнов' : 'Alexey Smirnov'}</p>
                            <p className="text-xs text-gray-400">{language === 'ru' ? 'Senior Engineer' : 'Senior Engineer'}</p>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2">
                              КД
                            </div>
                            <p className="text-xs text-white font-medium">{language === 'ru' ? 'Кандидат' : 'Candidate'}</p>
                            <p className="text-xs text-green-400">{language === 'ru' ? 'Идёт интервью' : 'In interview'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-purple-700">
                          <CheckCircle className="w-3 h-3" />
                          <span>{language === 'ru' ? 'Code review в реальном времени' : 'Real-time code review'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-700">
                          <CheckCircle className="w-3 h-3" />
                          <span>{language === 'ru' ? 'System design задачи' : 'System design problems'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-700">
                          <CheckCircle className="w-3 h-3" />
                          <span>{language === 'ru' ? 'Архитектурные решения' : 'Architecture solutions'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 lg:text-left mb-8 lg:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4 border-2 border-purple-300">
                      <Brain className="w-3.5 h-3.5 text-purple-700" />
                      <span className="text-xs text-purple-700 font-bold">{language === 'ru' ? 'ШАГ 3.5 • ДЛЯ IT' : 'STEP 3.5 • FOR IT'}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      <span className="lg:hidden text-purple-600">3.5 </span>
                      {language === 'ru' ? 'Подключите эксперта для глубокой проверки' : 'Connect Expert for Deep Verification'}
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      {language === 'ru' 
                        ? 'После AI-скрининга подключается живой senior-эксперт для технического интервью. Проверяет hard skills, проводит code review и оценивает архитектурные решения.' 
                        : 'After AI screening, live senior expert joins for technical interview. Verifies hard skills, conducts code review and evaluates architectural solutions.'}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 mb-4">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{language === 'ru' ? '45-60 минут' : '45-60 minutes'}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                        <span>{language === 'ru' ? 'Эксперты из крупных компаний' : 'Experts from major companies'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                        <span>{language === 'ru' ? 'Развёрнутый технический отчёт' : 'Detailed technical report'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                        <span>{language === 'ru' ? 'Рекомендация по найму' : 'Hiring recommendation'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Get Results */}
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="order-2 lg:order-1 relative lg:pr-8">
                    <div className="hidden lg:flex absolute lg:right-0 lg:left-auto top-0 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl items-center justify-center text-white text-3xl font-bold shadow-2xl transform lg:translate-x-0 z-10">
                      4
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-green-200 shadow-xl lg:mr-12">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-green-300">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">★</span>
                            </div>
                            <p className="text-xs font-bold text-green-700">{t.demoDetails.topCandidates}</p>
                          </div>
                          <ListChecks className="w-4 h-4 text-green-600" />
                        </div>
                        {[
                          { name: t.demoDetails.candidateName1, score: t.demoDetails.scoreExcellent, color: 'green' },
                          { name: t.demoDetails.candidateName2, score: t.demoDetails.scoreGood, color: 'blue' },
                          { name: t.demoDetails.candidateName3, score: t.demoDetails.scoreAverage, color: 'yellow' }
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
                      <span className="text-xs text-green-700 font-semibold">{t.journey.step4Badge}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                      <span className="lg:hidden text-green-600">4. </span>{shortJourney.step4.title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      {shortJourney.step4.desc}
                    </p>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{t.journey.step4Auto}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{t.journey.step4Analytics}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{t.journey.step4Recording}</span>
                      </div>
                    </div>
                    
                    {/* Report Types */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-xs font-semibold text-gray-700 mb-3">{t.reportTypes.title}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{t.reportTypes.autoRating}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{t.reportTypes.techAudit}</span>
                        </div>
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
                {t.bottomSummary.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {t.bottomSummary.description}
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">{t.bottomSummary.feature1}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">{t.bottomSummary.feature2}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">{t.bottomSummary.feature3}</span>
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
              {t.cta.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {t.cta.description}
            </p>
            <button
              onClick={() => onNavigate('login-organizer')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t.cta.button}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>


        </div>
      </section>

      {/* Evaluation Preview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6 border border-purple-100">
              <BarChart className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">{t.evaluationPreview.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t.evaluationPreview.title}
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.evaluationPreview.subtitle}
              </span>
            </h2>

            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              {t.evaluationPreview.description}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setEvaluationTab('mass')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                evaluationTab === 'mass'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.evaluationPreview.tabMass}
              </div>
            </button>
            <button
              onClick={() => setEvaluationTab('it')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                evaluationTab === 'it'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                {t.evaluationPreview.tabIT}
              </div>
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Features */}
            <div>
              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: <CheckCircle className="w-5 h-5" />,
                    title: t.evaluationPreview.feature1Title,
                    description: t.evaluationPreview.feature1Desc
                  },
                  {
                    icon: <MessageSquare className="w-5 h-5" />,
                    title: t.evaluationPreview.feature2Title,
                    description: t.evaluationPreview.feature2Desc
                  },
                  {
                    icon: <Video className="w-5 h-5" />,
                    title: t.evaluationPreview.feature3Title,
                    description: t.evaluationPreview.feature3Desc
                  }
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${evaluationTab === 'mass' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300`}>
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
                onClick={() => onNavigateWithTab('evaluation-demo', evaluationTab)}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-medium hover:shadow-2xl transition-all duration-300 inline-flex items-center justify-center gap-2 ${
                  evaluationTab === 'mass'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
              >
                <span>{t.evaluationPreview.viewExample}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Preview Screenshot */}
            <div className="relative mt-8 lg:mt-0">
              <div className={`relative rounded-2xl p-6 border-2 shadow-2xl transition-all duration-500 ${
                evaluationTab === 'mass' 
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' 
                  : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
              }`}>
                <div className={`absolute -top-4 -right-4 w-32 h-32 rounded-2xl blur-3xl opacity-40 transition-colors duration-500 ${
                  evaluationTab === 'mass'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`} />
                <div className={`absolute -bottom-4 -left-4 w-32 h-32 rounded-2xl blur-3xl opacity-40 transition-colors duration-500 ${
                  evaluationTab === 'mass'
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                    : 'bg-gradient-to-br from-pink-500 to-purple-500'
                }`} />
                
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl">
                  {/* Mock Interface Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 ${
                        evaluationTab === 'mass' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {evaluationTab === 'mass' ? 'А' : 'А'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {evaluationTab === 'mass' ? t.evaluationPreview.massName : t.evaluationPreview.itName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {evaluationTab === 'mass' ? `${t.evaluationPreview.massPosition} • ${t.evaluationPreview.massExperience}` : `${t.evaluationPreview.itPosition} • ${t.evaluationPreview.itExperience}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mock Content */}
                  <div className="p-6 space-y-4">
                    {/* Overall Rating */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{t.evaluationPreview.overallRating}</h3>
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl font-bold transition-colors duration-300 ${
                          evaluationTab === 'mass' ? 'text-blue-600' : 'text-purple-600'
                        }`}>
                          {evaluationTab === 'mass' ? '8.5' : '8.5'}/10
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className={`h-2 rounded-full transition-colors duration-300 ${
                            evaluationTab === 'mass' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            <div className={`h-full rounded-full transition-all duration-500 ${
                              evaluationTab === 'mass' 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`} style={{width: '85%'}} />
                          </div>
                          <p className="text-xs text-gray-600">
                            {evaluationTab === 'mass' ? t.evaluationPreview.readyForWork : t.evaluationPreview.strongHire}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Skills Cards */}
                    <div className="grid grid-cols-2 gap-3 py-4">
                      {evaluationTab === 'mass' ? (
                        <>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">{t.evaluationPreview.communication}</p>
                            <p className="text-lg font-bold text-blue-600">9/10</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">{t.evaluationPreview.stressResistance}</p>
                            <p className="text-lg font-bold text-blue-600">8/10</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">{t.evaluationPreview.workExperience}</p>
                            <p className="text-lg font-bold text-blue-600">9/10</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">{t.evaluationPreview.motivation}</p>
                            <p className="text-lg font-bold text-blue-600">8/10</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-1">Go Runtime</p>
                            <p className="text-lg font-bold text-purple-600">9/10</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-1">Concurrency</p>
                            <p className="text-lg font-bold text-purple-600">9/10</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-1">System Design</p>
                            <p className="text-lg font-bold text-purple-600">8/10</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-1">Clean Code</p>
                            <p className="text-lg font-bold text-purple-600">8/10</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <div className={`h-10 rounded-lg flex-1 flex items-center justify-center gap-2 text-white font-medium text-sm transition-colors duration-300 ${
                        evaluationTab === 'mass'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600'
                      }`}>
                        <Play className="w-4 h-4" />
                        {t.evaluationPreview.listen}
                      </div>
                      <div className="h-10 bg-gray-100 border border-gray-300 rounded-lg px-4 flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{t.evaluationPreview.text}</span>
                      </div>
                    </div>

                    {/* Recommendation Block */}
                    <div className={`rounded-xl p-4 border-2 mt-6 transition-colors duration-300 ${
                      evaluationTab === 'mass'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <p className="text-sm font-bold text-green-900 mb-2">
                        {evaluationTab === 'mass' ? t.evaluationPreview.recommendedMass : t.evaluationPreview.recommendedIT}
                      </p>
                      <p className="text-xs text-green-700 leading-relaxed">
                        {evaluationTab === 'mass' 
                          ? t.evaluationPreview.recommendationTextMass
                          : t.evaluationPreview.recommendationTextIT
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-700 font-medium">
                    {evaluationTab === 'mass' ? t.demoDetails.clearFormulations : t.demoDetails.expertReview}
                  </span>
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
              <span className="text-sm text-blue-700 font-medium">{t.faqDetails.badge}</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t.faq.title}
            </h2>
            <p className="text-lg text-gray-600">
              {t.faqDetails.subtitle}
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {[
              { question: t.faq.q1, answer: t.faq.a1 },
              { question: t.faq.q2, answer: t.faq.a2 },
              { question: t.faq.q3, answer: t.faq.a3 },
              { question: t.faq.q4, answer: t.faq.a4 },
              { question: t.faq.q5, answer: t.faq.a5 },
              { question: t.faq.q6, answer: t.faq.a6 }
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t.securityDetails.feature1Title}</h3>
                <p className="text-sm text-gray-600">{t.securityDetails.feature1Desc}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{t.securityDetails.timeSavingTitle}</h4>
                    <p className="text-sm text-gray-600">{t.securityDetails.timeSavingDesc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{t.securityDetails.objectiveTitle}</h4>
                    <p className="text-sm text-gray-600">{t.securityDetails.objectiveDesc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{t.additionalBenefits.turnoverReductionTitle}</h4>
                    <p className="text-sm text-gray-600">{t.additionalBenefits.turnoverReductionDesc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{t.additionalBenefits.quickLaunchTitle}</h4>
                    <p className="text-sm text-gray-600">{t.additionalBenefits.quickLaunchDesc}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 text-center">
                <strong>{t.demoDetails.freeStartBold}</strong> {t.demoDetails.freeStartText}
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
            {t.cta.title2}
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10">
            {t.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('login-organizer')}
              className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:shadow-2xl transition-all duration-300 font-medium text-lg"
            >
              {t.cta.setupInterview}
            </button>
            <button
              onClick={() => onNavigate('login-student')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium text-lg"
            >
              {t.cta.tryDemoInterview}
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
                <span className="text-sm text-gray-500">{t.footer.description}</span>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <button onClick={() => onNavigate('login-organizer')} className="hover:text-white transition-colors">
                {t.footer.forOrganizers}
              </button>
              <button onClick={() => onNavigate('login-student')} className="hover:text-white transition-colors">
                {t.footer.forCandidates}
              </button>
              <button onClick={() => onNavigate('evaluation-demo')} className="hover:text-white transition-colors">
                {t.footer.demoEvaluation}
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2024 ScreenMe AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Contact Button */}
      <button
        onClick={() => setShowContactModal(true)}
        className="fixed bottom-6 right-6 z-40 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2 group animate-subtle-float"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <span className="font-medium text-sm sm:text-base">{t.footer.contact}</span>
      </button>

      {/* Contact Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  CEO
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.contact.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t.organizerDashboard.supportSubtitle}
                  </p>
                </div>
              </div>
              <p className="text-gray-600">
                {t.organizerDashboard.chooseContact}
              </p>
            </div>

            {/* Contact Options */}
            <div className="p-6 space-y-3">
              {/* Telegram */}
              <a
                href="https://t.me/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="block group bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-400 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t.organizerDashboard.telegram}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t.organizerDashboard.telegramDesc}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:+79999999999"
                className="block group bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-400 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t.organizerDashboard.callPhone}
                    </h4>
                    <p className="text-sm text-gray-600">
                      +7 (999) 999-99-99
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Email/Contact Form */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t.organizerDashboard.leaveContact}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t.organizerDashboard.leaveContactDesc}
                    </p>
                  </div>
                </div>

                <form 
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(t.organizerDashboard.thankYouMessage);
                    setShowContactModal(false);
                  }}
                >
                  <input
                    type="text"
                    placeholder={t.organizerDashboard.yourName}
                    required
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                  />
                  <input
                    type="tel"
                    placeholder={t.organizerDashboard.phone}
                    required
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                  />
                  <input
                    type="email"
                    placeholder={t.organizerDashboard.emailOptional}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                  >
                    {t.organizerDashboard.send}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IT Request Modal */}
      <ITRequestModal 
        isOpen={showITRequestModal} 
        onClose={() => setShowITRequestModal(false)} 
      />
    </div>
  );
}
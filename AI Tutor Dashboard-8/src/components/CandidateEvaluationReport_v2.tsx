import { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, X, ArrowLeft, Play, Pause, FileText, Bot, User, Code, Layers, Server, Volume2, AlertTriangle } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/i18n';

// Modern design with loading states support

interface RequirementCheck {
  requirement: string;
  fact: string;
  status: 'met' | 'not_met' | 'partial' | 'loading';
}

interface EvaluationCriterion {
  name: string;
  score: number;
  maxScore: number;
  notes: string[];
  specificFacts?: string[];
  requirementsMet?: number;
  totalRequirements?: number;
}

interface SimulationScenario {
  situation: string;
  dialog: Array<{
    role: 'ai' | 'candidate';
    tone?: 'aggressive' | 'calm' | 'neutral';
    message: string;
  }>;
  summary: Array<{
    type: 'positive' | 'warning' | 'negative';
    text: string;
  }>;
}

interface Props {
  candidateName: string;
  role: string;
  overallScore: number;
  verdict: 'recommended' | 'possible' | 'not_recommended';
  meetsRequirements: string[];
  concernsOrMissing: string[];
  requirementChecks?: RequirementCheck[];
  followUpQuestions?: string[];
  recommendation: string;
  practicalInfo: {
    startDate?: string;
    salary?: string;
    location?: string;
  };
  criteria: EvaluationCriterion[];
  transcript: Array<{
    timestamp: string;
    speaker: 'AI' | 'Candidate';
    text: string;
  }>;
  simulation?: SimulationScenario;
  audioUrl?: string;
  isLoadingTranscript?: boolean;
  isEvaluating?: boolean;
  onBack?: () => void;
}

export function CandidateEvaluationReport_v2({
  candidateName,
  role,
  verdict,
  requirementChecks,
  recommendation,
  criteria,
  transcript,
  simulation,
  audioUrl,
  isLoadingTranscript,
  isEvaluating,
  onBack,
}: Props) {
  const [language] = useAtom(languageAtom);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const t = {
    ru: {
      backButton: 'Вернуться к списку',
      title: 'Итог технического скрининга',
      candidate: 'Кандидат:',
      role: 'Роль:',
      date: 'Дата:',
      duration: 'Длительность:',
      fullDialog: 'Полный диалог',
      listen: 'Слушать',
      close: 'Закрыть',
      status: 'Статус',
      verdict: 'Вердикт',
      keySignals: 'Ключевые сигналы (Technical Signals)',
      confirmed: 'Что подтвердилось',
      attention: 'На что обратить внимание',
      technicalQuestions: 'Ответы на технические вопросы (Hard Skills Check)',
      answer: 'Ответ:',
      competencies: 'Аналитика компетенций (Senior Level)',
      simulation: 'Симуляция: Технический спор на Code Review',
      simulationDesc: 'ИИ сыграл роль Senior-разработчика, который навязывает неоптимальное, но "модное" решение.',
      simulationResult: 'Итог симуляции:',
      recommended: 'Рекомендован (Strong Hire)',
      possible: 'Требуется уточнение (Maybe)',
      notRecommended: 'Не подходит для позиции (No Hire)',
      aiInterviewer: 'AI Интервьюер',
      durationValue: '1 час 15 мин (AI-фильтр + Live Coding)',
      recordingLabel: 'Запись интервью',
      evaluating: 'AI анализирует интервью...',
      evaluatingDesc: 'Оценка критериев будет готова через 10-30 секунд',
    },
    en: {
      backButton: 'Back to List',
      title: 'Technical Screening Summary',
      candidate: 'Candidate:',
      role: 'Role:',
      date: 'Date:',
      duration: 'Duration:',
      fullDialog: 'Full Transcript',
      listen: 'Listen',
      close: 'Close',
      status: 'Status',
      verdict: 'Verdict',
      keySignals: 'Key Signals (Technical Signals)',
      confirmed: 'Confirmed',
      attention: 'Points of Attention',
      technicalQuestions: 'Technical Questions Answers (Hard Skills Check)',
      answer: 'Answer:',
      competencies: 'Competencies Analysis (Senior Level)',
      simulation: 'Simulation: Technical Dispute on Code Review',
      simulationDesc: 'AI played the role of a Senior developer pushing suboptimal but "trendy" solutions.',
      simulationResult: 'Simulation Result:',
      recommended: 'Recommended (Strong Hire)',
      possible: 'Needs Clarification (Maybe)',
      notRecommended: 'Not Suitable (No Hire)',
      aiInterviewer: 'AI Interviewer',
      durationValue: '1 hour 15 min (AI filter + Live Coding)',
      recordingLabel: 'Interview Recording',
      evaluating: 'AI is analyzing the interview...',
      evaluatingDesc: 'Evaluation will be ready in 10-30 seconds',
    },
  }[language];

  const getVerdictLabel = () => {
    if (verdict === 'recommended') return t.recommended;
    if (verdict === 'possible') return t.possible;
    return t.notRecommended;
  };

  const getVerdictColor = () => {
    if (verdict === 'recommended') return 'text-green-700';
    if (verdict === 'possible') return 'text-yellow-700';
    return 'text-red-700';
  };

  const getVerdictBorder = () => {
    if (verdict === 'recommended') return 'border-green-300 bg-green-50';
    if (verdict === 'possible') return 'border-yellow-300 bg-yellow-50';
    return 'border-red-300 bg-red-50';
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const confirmedPoints = requirementChecks?.filter(r => r.status === 'met') || [];
  const attentionPoints = requirementChecks?.filter(r => r.status !== 'met' && r.status !== 'loading') || [];
  const loadingPoints = requirementChecks?.filter(r => r.status === 'loading') || [];

  const formattedDate = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get technical questions (first 3 criteria)
  const technicalQuestions = criteria.slice(0, 3).map(item => ({
    question: item.name,
    answer: item.notes[0] || 'Ответ не был записан',
    assessment: item.specificFacts?.[0] || 'Полное понимание темы',
    additionalNotes: item.notes.slice(1),
    allFacts: item.specificFacts || []
  }));

  // Get competencies (rest of criteria)
  const competencies = criteria.slice(3).map(c => ({
    name: c.name,
    level: c.notes[0] || '',
    icon: Code
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backButton}
            </button>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {t.title}
              </h1>

              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">{t.candidate}</span>
                  <span className="font-semibold text-gray-900">{candidateName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">{t.role}</span>
                  <span className="font-medium text-gray-900">{role}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">{t.date}</span>
                  <span className="text-gray-700">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">{t.duration}</span>
                  <span className="text-gray-700">{t.durationValue}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t.fullDialog}
              </button>
              {audioUrl && (
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {t.listen}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* AI Evaluating Banner */}
        {isEvaluating && (
          <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">{t.evaluating}</p>
              <p className="text-xs text-blue-700">{t.evaluatingDesc}</p>
            </div>
          </div>
        )}

        {/* ========== 1. СТАТУС И ВЕРДИКТ (БЕЗ БАЛЛОВ) ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          {/* Только статус - БЕЗ баллов */}
          <div className="flex items-start gap-6 mb-6">
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 ${getVerdictBorder()}`}>
              <CheckCircle2 className={`w-8 h-8 ${getVerdictColor()}`} />
              <div>
                <p className="text-sm text-gray-600 mb-0.5">{t.status}</p>
                <p className={`font-semibold ${getVerdictColor()}`}>{getVerdictLabel()}</p>
              </div>
            </div>
          </div>

          {/* Вердикт */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">📋 {t.verdict}</p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>

        {/* ========== 2. КЛЮЧЕВЫЕ СИГНАЛЫ (Technical Signals) ========== */}
        {requirementChecks && requirementChecks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{t.keySignals}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Что подтвердилось */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">{t.confirmed}</h3>
                </div>
                <ul className="space-y-2">
                  {confirmedPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <div>
                        <span className="font-semibold">{point.requirement}:</span>{' '}
                        <span>{point.fact}</span>
                      </div>
                    </li>
                  ))}
                  {loadingPoints.map((point, index) => (
                    <li key={`loading-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{point.requirement}:</span>{' '}
                        <span className="inline-block h-4 w-48 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* На что обратить внимание */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">{t.attention}</h3>
                </div>
                <ul className="space-y-2">
                  {attentionPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-yellow-600 mt-0.5">⚠</span>
                      <div>
                        <span className="font-semibold">{point.requirement}:</span>{' '}
                        <span className={
                          point.status === 'partial' ? 'text-amber-800' :
                          point.status === 'not_met' ? 'text-red-800' :
                          'text-gray-700'
                        }>{point.fact}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========== 3. ОТВЕТЫ НА ТЕХНИЧЕСКИЕ ВОПРОСЫ ========== */}
        {technicalQuestions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{t.technicalQuestions}</h2>

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
                    <p className="text-sm text-gray-800"><strong>{t.answer}</strong> {item.answer}</p>
                  </div>

                  {item.assessment && (
                    <div className="ml-10">
                      <p className="text-sm text-green-700 font-medium">✓ {language === 'ru' ? 'Экспертная оценка:' : 'Expert Evaluation:'} {item.assessment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 4. АНАЛИТИКА КОМПЕТЕНЦИЙ (Senior Level) ========== */}
        {competencies.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{t.competencies}</h2>

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
        )}

        {/* ========== 5. СИМУЛЯЦИЯ: ТЕХНИЧЕСКИЙ СПОР НА CODE REVIEW ========== */}
        {simulation && (
          <div className="bg-white rounded-xl border-2 border-purple-200 p-8">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-5">
              <p className="text-sm font-semibold text-purple-900">
                💬 {t.simulation}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {t.simulationDesc}
              </p>
            </div>

            {/* Диалог */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-5">
              <div className="space-y-4">
                {simulation.dialog.map((msg, idx) => (
                  <div key={idx}>
                    <div className="flex items-start gap-2 mb-2">
                      {msg.role === 'ai' ? (
                        <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <User className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs font-semibold ${msg.role === 'ai' ? 'text-purple-700' : 'text-green-700'}`}>
                        {msg.role === 'ai' ? 'AI (Team Lead):' : `${candidateName}:`}
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.simulationResult}</h3>
              <div className="space-y-2">
                {simulation.summary.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-600 text-sm">✔</span>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Full Transcript Sidebar */}
      {showTranscript && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white border-l border-gray-200 z-50 overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">{t.fullDialog}</h3>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {t.close}
            </button>
          </div>

          <div className="px-6 py-6 space-y-4">
            {transcript.map((message, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  {message.speaker === 'AI' ? (
                    <>
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">{t.aiInterviewer}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{candidateName}</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">{message.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700 ml-6">{message.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Player - bottom bar when playing */}
      {audioUrl && isPlaying && (
        <>
          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
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
                    <span>{t.recordingLabel} • {candidateName}</span>
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
        </>
      )}
      {audioUrl && !isPlaying && <audio ref={audioRef} src={audioUrl} />}
    </div>
  );
}

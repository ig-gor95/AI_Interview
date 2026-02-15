import { useState, useRef } from 'react';
import { CheckCircle, X, AlertTriangle, ArrowLeft, Play, Pause, Lightbulb, Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/i18n';

// v7-NO-SCORES: Complete rewrite without any score displays
// Only shows: Verdict + Subtitle + Play button + Requirement facts

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
  overallScore: number; // Kept for compatibility but NOT displayed
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
  followUpQuestions,
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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const translations = {
    ru: {
      recommended: 'РЕКОМЕНДУЕТСЯ',
      possible: 'ВОЗМОЖНО ПОДХОДИТ',
      notRecommended: 'НЕ РЕКОМЕНДУЕТСЯ',
      meetsRequirements: 'Ключевые критерии',
      concernsOrMissing: 'Не соответствует / Точки внимания',
      recommendationTitle: 'Рекомендация',
      backButton: 'Назад',
      playRecording: 'Прослушать запись диалога',
      pauseRecording: 'Пауза',
      fullTranscript: 'Полный транскрипт интервью',
      showTranscript: 'Показать транскрипт',
      hideTranscript: 'Скрыть транскрипт',
      aiInterviewer: 'AI Интервьюер',
      detailedAnalysis: 'Детальный анализ',
      showAnalysis: 'Показать анализ',
      hideAnalysis: 'Скрыть анализ',
      simulationTitle: 'Моделирование ситуации',
      showSimulation: 'Показать моделирование',
      hideSimulation: 'Скрыть моделирование',
    },
    en: {
      recommended: 'RECOMMENDED',
      possible: 'POSSIBLY SUITABLE',
      notRecommended: 'NOT RECOMMENDED',
      meetsRequirements: 'Key Criteria',
      concernsOrMissing: 'Does Not Meet / Points of Attention',
      recommendationTitle: 'Recommendation',
      backButton: 'Back',
      playRecording: 'Play Recording',
      pauseRecording: 'Pause',
      fullTranscript: 'Full Interview Transcript',
      showTranscript: 'Show Transcript',
      hideTranscript: 'Hide Transcript',
      aiInterviewer: 'AI Interviewer',
      detailedAnalysis: 'Detailed Analysis',
      showAnalysis: 'Show Analysis',
      hideAnalysis: 'Hide Analysis',
      simulationTitle: 'Situation Simulation',
      showSimulation: 'Show Simulation',
      hideSimulation: 'Hide Simulation',
    }
  };

  const t = translations[language];

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

  const getVerdictBadge = () => {
    switch (verdict) {
      case 'recommended':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          label: t.recommended,
          subtitle: language === 'ru' ? 'Пригласить на интервью' : 'Invite to interview'
        };
      case 'possible':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          label: t.possible,
          subtitle: language === 'ru' ? 'Требуется уточнение' : 'Needs clarification'
        };
      case 'not_recommended':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: X,
          iconColor: 'text-red-600',
          label: t.notRecommended,
          subtitle: language === 'ru' ? 'Не подходит для позиции' : 'Not suitable'
        };
    }
  };

  const verdictBadge = getVerdictBadge();
  const VerdictIcon = verdictBadge.icon;

  console.log('🎯 v2 - CandidateEvaluationReport rendered without scores:', {
    candidateName,
    verdict,
    hasAudio: !!audioUrl,
    hasRequirementChecks: !!requirementChecks,
    requirementChecksLength: requirementChecks?.length
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {onBack && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">{t.backButton}</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* MAIN CONTENT */}
          <div className="flex-1 max-w-4xl mx-auto space-y-6">
            {/* MAIN CARD */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{candidateName}</h1>
                    <p className="text-sm text-gray-600">{role}</p>
                  </div>
                  
                  <div className={`${verdictBadge.bg} ${verdictBadge.border} border-2 rounded-xl px-4 py-3 text-center min-w-[200px]`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <VerdictIcon className={`w-6 h-6 ${verdictBadge.iconColor}`} />
                      <span className={`text-sm font-bold ${verdictBadge.text} uppercase tracking-wide`}>
                        {verdictBadge.label}
                      </span>
                    </div>
                    <p className={`text-xs ${verdictBadge.text} font-semibold`}>{verdictBadge.subtitle}</p>
                  </div>
                </div>

                {/* Audio Player */}
                {audioUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handlePlayPause}
                      className="flex items-center gap-3 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>{t.pauseRecording}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>{t.playRecording}</span>
                        </>
                      )}
                    </button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* NO SCORE BAR - This section is intentionally removed */}

              {/* AI Analyzing Banner */}
              {isEvaluating && (
                <div className="mx-6 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI анализирует интервью...</p>
                    <p className="text-xs text-blue-700">Оценка критериев будет готова через 10-30 секунд</p>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Requirement Checks */}
                {requirementChecks && requirementChecks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base font-bold text-gray-900">{t.meetsRequirements}</h3>
                    </div>
                    <ul className="space-y-2">
                      {requirementChecks.map((check, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          {check.status === 'loading' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0 mt-0.5" />
                          ) : check.status === 'met' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : check.status === 'partial' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold text-gray-900">{check.requirement}:</span>{' '}
                            {check.status === 'loading' ? (
                              <span className="inline-block h-4 w-48 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              <span className={
                                check.status === 'met' ? 'text-gray-700' :
                                check.status === 'partial' ? 'text-amber-800' :
                                'text-red-800'
                              }>{check.fact}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-bold text-gray-900">{t.recommendationTitle}</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                </div>
              </div>
            </div>

            {/* DETAILED ANALYSIS - NO SCORES, only facts */}
            {criteria && criteria.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-gray-900">{t.detailedAnalysis}</h3>
                  {showAnalysis ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {showAnalysis && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-200 space-y-4">
                    {criteria.map((criterion, index) => (
                      <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <h4 className="font-semibold text-gray-900 mb-2">{criterion.name}</h4>
                        <ul className="space-y-1.5">
                          {(criterion.specificFacts || criterion.notes).map((note, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TRANSCRIPT */}
            {transcript && transcript.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowTranscript((prev) => !prev)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-gray-900">{t.fullTranscript}</h3>
                  {showTranscript ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {showTranscript && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-200 space-y-4">
                    {transcript.map((msg, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0">
                          {msg.speaker === 'AI' ? (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-purple-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {msg.speaker === 'AI' ? t.aiInterviewer : candidateName}
                            </span>
                            <span className="text-xs text-gray-500">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SIMULATION (if exists) */}
            {simulation && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowSimulation(!showSimulation)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900">{t.simulationTitle}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{simulation.situation}</p>
                  </div>
                  {showSimulation ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                
                {showSimulation && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3">
                        {language === 'ru' ? 'Итоги' : 'Summary'}
                      </h4>
                      <ul className="space-y-2">
                        {simulation.summary.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            {item.type === 'positive' ? (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : item.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={
                              item.type === 'positive' ? 'text-green-800' :
                              item.type === 'warning' ? 'text-amber-800' :
                              'text-red-800'
                            }>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {simulation.dialog.map((msg, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0">
                            {msg.role === 'ai' ? (
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-purple-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`rounded-lg px-4 py-2.5 ${
                              msg.role === 'ai'
                                ? msg.tone === 'aggressive'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-purple-50 border border-purple-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}>
                              <p className="text-sm text-gray-800">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
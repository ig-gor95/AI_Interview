import { useState, useRef } from 'react';
import { CheckCircle, X, AlertTriangle, ArrowLeft, Target, TrendingUp, Play, Pause, Volume2, Lightbulb, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, DollarSign, MapPin, Bot, User } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/i18n';

interface RequirementCheck {
  requirement: string;
  fact: string;
  status: 'met' | 'not_met' | 'partial';
}

interface EvaluationCriterion {
  name: string;
  score: number;
  maxScore: number;
  notes: string[];
  specificFacts?: string[]; // New: specific facts instead of generic notes
  requirementsMet?: number; // New: for showing "X из Y требований"
  totalRequirements?: number; // New: for showing "X из Y требований"
}

interface SimulationScenario {
  situation: string;
  dialog: Array<{
    role: 'ai' | 'user';
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
  meetsRequirements: string[]; // Deprecated: use requirementChecks instead
  concernsOrMissing: string[]; // Deprecated: use requirementChecks instead
  requirementChecks?: RequirementCheck[]; // New: specific requirement checks
  followUpQuestions?: string[]; // New: specific questions to ask (empty if none)
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
  onBack?: () => void;
}

export function CandidateEvaluationReport({
  candidateName,
  role,
  overallScore,
  verdict,
  meetsRequirements,
  concernsOrMissing,
  requirementChecks,
  followUpQuestions,
  recommendation,
  practicalInfo,
  criteria,
  transcript,
  simulation,
  audioUrl,
  onBack
}: Props) {
  const [language] = useAtom(languageAtom);
  const [showLevel2, setShowLevel2] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // DEBUG: Log received props
  console.log('🎯 CandidateEvaluationReport rendered:', {
    candidateName,
    hasRequirementChecks: !!requirementChecks,
    requirementChecksLength: requirementChecks?.length,
    hasFollowUpQuestions: !!followUpQuestions,
    followUpQuestionsLength: followUpQuestions?.length
  });

  const translations = {
    ru: {
      recommended: 'РЕКОМЕНДУЕТСЯ',
      possible: 'ВОЗМОЖНО ПОДХОДИТ',
      notRecommended: 'НЕ РЕКОМЕНДУЕТСЯ',
      overallScore: 'Общая оценка',
      meetsRequirements: 'Соответствует обязательным требованиям',
      concernsOrMissing: 'Не соответствует / Точки внимания',
      recommendationTitle: 'Рекомендация',
      showDetails: 'Посмотреть детали',
      hideDetails: 'Скрыть детали',
      detailedBreakdown: 'Детальная разбивка оценки',
      fullTranscript: 'Полный транскрипт интервью',
      aiInterviewer: 'AI Интервьюер',
      backButton: 'Назад',
      simulationTitle: 'Моделирование ситуации',
      simulationSubtitle: 'Реакция на стрессовую ситуацию',
      situationDescription: 'Описание ситуации',
      dialogTitle: 'Диалог с клиентом',
      analysisTitle: 'Анализ',
      aggressive: 'агрессивно',
      calm: 'спокойно',
      neutral: 'нейтрально',
      playRecording: 'Прослушать запись диалога',
      pauseRecording: 'Пауза',
      showTranscript: 'Показать транскрипт',
      hideTranscript: 'Скрыть транскрипт'
    },
    en: {
      recommended: 'RECOMMENDED',
      possible: 'POSSIBLY SUITABLE',
      notRecommended: 'NOT RECOMMENDED',
      overallScore: 'Overall Score',
      meetsRequirements: 'Meets Mandatory Requirements',
      concernsOrMissing: 'Does Not Meet / Points of Attention',
      recommendationTitle: 'Recommendation',
      showDetails: 'Show Details',
      hideDetails: 'Hide Details',
      detailedBreakdown: 'Detailed Score Breakdown',
      fullTranscript: 'Full Interview Transcript',
      aiInterviewer: 'AI Interviewer',
      backButton: 'Back',
      simulationTitle: 'Situation Simulation',
      simulationSubtitle: 'Response to stressful situation',
      situationDescription: 'Situation Description',
      dialogTitle: 'Client Dialog',
      analysisTitle: 'Analysis',
      aggressive: 'aggressive',
      calm: 'calm',
      neutral: 'neutral',
      playRecording: 'Play Recording',
      pauseRecording: 'Pause',
      showTranscript: 'Show Transcript',
      hideTranscript: 'Hide Transcript'
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
          {/* MAIN CONTENT - LEFT SIDE */}
          <div className={`flex-1 space-y-6 transition-all duration-300 ${showTranscript ? 'max-w-3xl' : 'max-w-4xl mx-auto'}`}>
            {/* LEVEL 1 - Main Card */}
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

                {/* Audio Player - NEW */}
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

              <div className="p-6 space-y-6">
                {/* Requirement Checks - NEW FORMAT */}
                {requirementChecks && requirementChecks.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-gray-700" />
                      <h3 className="text-base font-bold text-gray-900">{t.meetsRequirements}</h3>
                    </div>
                    <ul className="space-y-2">
                      {requirementChecks.map((check, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          {check.status === 'met' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : check.status === 'partial' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold text-gray-900">{check.requirement}:</span>{' '}
                            <span className={
                              check.status === 'met' ? 'text-gray-700' :
                              check.status === 'partial' ? 'text-amber-800' :
                              'text-red-800'
                            }>{check.fact}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  /* OLD FORMAT - Fallback for backwards compatibility */
                  meetsRequirements.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-base font-bold text-gray-900">{t.meetsRequirements}</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {meetsRequirements.slice(0, 4).map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}

                {/* Follow-up Questions - NEW */}
                {followUpQuestions && followUpQuestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-bold text-gray-900">
                        {language === 'ru' ? 'Уточнить на интервью' : 'Clarify in Interview'}
                      </h3>
                    </div>
                    <ul className="space-y-1.5">
                      {followUpQuestions.map((question, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Old Concerns - Only show if not using new format */}
                {!requirementChecks && concernsOrMissing.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base font-bold text-gray-900">{t.concernsOrMissing}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {concernsOrMissing.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
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

                {/* Practical Info Badges */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {practicalInfo.startDate && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">{practicalInfo.startDate}</span>
                    </div>
                  )}
                  {practicalInfo.salary && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-900">{practicalInfo.salary}</span>
                    </div>
                  )}
                  {practicalInfo.location && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-900">{practicalInfo.location}</span>
                    </div>
                  )}
                </div>

                {/* Show Details Button */}
                <button
                  onClick={() => setShowLevel2(!showLevel2)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg transition-all duration-200 group"
                >
                  <span className="text-sm font-semibold text-purple-700">
                    {showLevel2 ? t.hideDetails : t.showDetails}
                  </span>
                  {showLevel2 ? (
                    <ChevronUp className="w-5 h-5 text-purple-700 group-hover:transform group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-700 group-hover:transform group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>
            </div>

            {/* LEVEL 2 - Detailed Breakdown */}
            {showLevel2 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <h2 className="text-xl font-bold text-gray-900">{t.detailedBreakdown}</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Criteria Breakdown */}
                  <div className="space-y-5">
                    {criteria.map((criterion, index) => {
                      // Check if score conflicts with facts (high score but has failed requirements)
                      const hasConflict = requirementChecks && 
                        criterion.score > 7 && 
                        requirementChecks.some(c => c.status === 'not_met');
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900">{criterion.name}</h4>
                              {criterion.requirementsMet !== undefined && criterion.totalRequirements !== undefined && (
                                <div className="group relative">
                                  <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                                  <div className="absolute left-0 top-6 hidden group-hover:block z-10 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                    {language === 'ru' 
                                      ? `Оценка основана на соответствии ${criterion.requirementsMet} из ${criterion.totalRequirements} требований`
                                      : `Score based on meeting ${criterion.requirementsMet} of ${criterion.totalRequirements} requirements`
                                    }
                                  </div>
                                </div>
                              )}
                              {hasConflict && (
                                <div className="group relative">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                                  <div className="absolute left-0 top-6 hidden group-hover:block z-10 w-48 p-2 bg-amber-900 text-white text-xs rounded-lg shadow-lg">
                                    {language === 'ru' ? 'Проверьте детали' : 'Check details'}
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-bold text-purple-600">
                              {criterion.score.toFixed(1)}/{criterion.maxScore}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                hasConflict 
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
                              }`}
                              style={{ width: `${(criterion.score / criterion.maxScore) * 100}%` }}
                            />
                          </div>
                          
                          {/* Show specific facts if available, otherwise fallback to notes */}
                          {criterion.specificFacts && criterion.specificFacts.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                              {criterion.specificFacts.map((fact, factIndex) => (
                                <li key={factIndex} className="flex items-start gap-2 text-xs text-gray-700">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>{fact}</span>
                                </li>
                              ))}
                            </ul>
                          ) : criterion.notes.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                              {criterion.notes.map((note, noteIndex) => (
                                <li key={noteIndex} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400 mt-0.5">•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Simulation Section */}
                  {simulation && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-purple-600" />
                          <h3 className="text-base font-bold text-gray-900">{t.simulationTitle}</h3>
                        </div>
                        <p className="text-xs text-purple-700 mb-4">{t.simulationSubtitle}</p>

                        <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">{t.situationDescription}</h4>
                          <p className="text-sm text-gray-700">{simulation.situation}</p>
                        </div>

                        <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">{t.dialogTitle}</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {simulation.dialog.slice(0, 3).map((msg, idx) => (
                              <div key={idx} className={`text-xs ${msg.role === 'user' ? 'ml-4' : ''}`}>
                                <div className="flex items-start gap-2 mb-1">
                                  {msg.role === 'ai' ? (
                                    <>
                                      <Bot className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" />
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-purple-700">{t.aiInterviewer}</span>
                                        {msg.tone && msg.tone !== 'neutral' && (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                            msg.tone === 'aggressive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                          }`}>
                                            {t[msg.tone]}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                      <span className="font-medium text-blue-700">{candidateName}</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-gray-700 ml-5">{msg.message}</p>
                              </div>
                            ))}
                            {simulation.dialog.length > 3 && (
                              <p className="text-xs text-gray-500 italic ml-5">...</p>
                            )}
                          </div>
                        </div>

                        <div className="bg-white border border-purple-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">{t.analysisTitle}</h4>
                          <div className="space-y-2">
                            {simulation.summary.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                {item.type === 'positive' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : item.type === 'warning' ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <span className="text-xs text-gray-700">{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TRANSCRIPT SIDEBAR - RIGHT SIDE */}
          <div className={`transition-all duration-300 ${showTranscript ? 'w-96' : 'w-12'}`}>
            <div className="sticky top-6">
              {showTranscript ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
                    <h3 className="text-sm font-bold text-gray-900">{t.fullTranscript}</h3>
                    <button
                      onClick={() => setShowTranscript(false)}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <div className="space-y-3">
                      {transcript.map((entry, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-shrink-0 w-12 text-[10px] text-gray-500 font-mono pt-1">
                            {entry.timestamp}
                          </div>
                          
                          <div className="flex-1">
                            <div className={`px-3 py-2 rounded-lg ${
                              entry.speaker === 'AI'
                                ? 'bg-purple-50 border border-purple-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}>
                              <p className={`text-[10px] font-semibold mb-1 ${
                                entry.speaker === 'AI' ? 'text-purple-900' : 'text-blue-900'
                              }`}>
                                {entry.speaker === 'AI' ? t.aiInterviewer : candidateName}
                              </p>
                              <p className="text-xs text-gray-800 leading-relaxed">{entry.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowTranscript(true)}
                  className="w-12 h-32 bg-white rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                  <div className="transform -rotate-90 text-xs font-semibold text-gray-700 whitespace-nowrap">
                    {t.showTranscript}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
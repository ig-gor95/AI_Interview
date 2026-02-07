import { CheckCircle, AlertTriangle, X, TrendingUp, MessageSquare, Star, AlertCircle, Zap, Target } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/i18n';
import { Session } from '@/types';
import { scoreToQualityRating, type QualityRating } from '@/lib/qualityRating';

interface Result {
  id: string;
  studentName: string;
  studentEmail?: string;
  sessionId: string;
  score?: number;
  qualityRating?: QualityRating;
  completedAt: string;
  transcript?: Array<{ role: string; message?: string; content?: string }>;
  requirementChecks?: Array<{ requirement: string; fact: string; status: 'met' | 'partial' | 'not_met' }>;
}

interface Props {
  results: Result[];
  sessions: Session[];
  onViewEvaluation?: (sessionId: string) => void;
}

export function CandidatesKanban({ results, sessions, onViewEvaluation }: Props) {
  const [language] = useAtom(languageAtom);

  const translations = {
    ru: {
      recommended: 'РЕКОМЕНДУЕТСЯ',
      possible: 'ВОЗМОЖНО',
      notRecommended: 'НЕ ПОДХОДИТ',
    },
    en: {
      recommended: 'RECOMMENDED',
      possible: 'POSSIBLY SUITABLE',
      notRecommended: 'NOT SUITABLE',
    }
  };

  const t = translations[language];

  // Convert result to numeric rating
  const getNumericRating = (result: Result): number => {
    const qualityRating = result.qualityRating || (result.score ? scoreToQualityRating(result.score) : 'suitable');
    
    const ratingMap: Record<QualityRating, number> = {
      outstanding: 9.2,
      strong: 7.8,
      promising: 6.1,
      suitable: 4.5
    };
    
    return ratingMap[qualityRating] || 5.0;
  };

  // Determine verdict based on rating
  const getVerdict = (rating: number): 'recommended' | 'possible' | 'not_recommended' => {
    if (rating >= 7.5) return 'recommended';
    if (rating >= 5.0) return 'possible';
    return 'not_recommended';
  };

  // Generate highlights from requirement checks
  const getHighlights = (result: Result, rating: number): Array<{ type: 'positive' | 'warning' | 'negative'; text: string }> => {
    const highlights: Array<{ type: 'positive' | 'warning' | 'negative'; text: string }> = [];
    
    // If we have requirement checks, use them for highlights
    if (result.requirementChecks && result.requirementChecks.length > 0) {
      result.requirementChecks.forEach(check => {
        if (check.status === 'met') {
          highlights.push({ 
            type: 'positive', 
            text: `${check.requirement}: ${check.fact}` 
          });
        } else if (check.status === 'partial') {
          highlights.push({ 
            type: 'warning', 
            text: `${check.requirement}: ${check.fact}` 
          });
        } else if (check.status === 'not_met') {
          highlights.push({ 
            type: 'negative', 
            text: `${check.requirement}: ${check.fact}` 
          });
        }
      });
      
      return highlights.slice(0, 2);
    }
    
    // Fallback to generic highlights if no requirement checks
    if (rating >= 8) {
      highlights.push({ type: 'positive', text: language === 'ru' ? 'Чёткая речь' : 'Clear speech' });
      highlights.push({ type: 'positive', text: language === 'ru' ? 'Профессиональная лексика' : 'Professional vocabulary' });
    } else if (rating >= 7) {
      highlights.push({ type: 'positive', text: language === 'ru' ? 'Релевантный опыт' : 'Relevant experience' });
      highlights.push({ type: 'warning', text: language === 'ru' ? 'Стандартные ответы' : 'Standard answers' });
    } else if (rating >= 5) {
      highlights.push({ type: 'warning', text: language === 'ru' ? 'Неуверенные ответы' : 'Uncertain answers' });
      highlights.push({ type: 'warning', text: language === 'ru' ? 'Требует уточнений' : 'Requires clarification' });
    } else {
      highlights.push({ type: 'negative', text: language === 'ru' ? 'Бессвязная речь' : 'Incoherent speech' });
      highlights.push({ type: 'negative', text: language === 'ru' ? 'Избегает вопросов' : 'Avoids questions' });
    }
    
    return highlights.slice(0, 2);
  };

  // Convert results to candidates
  const candidates = results.map(result => {
    const rating = getNumericRating(result);
    
    // Debug: log requirement checks
    console.log('🔍 Processing candidate:', result.studentName, 'requirementChecks:', result.requirementChecks);
    
    return {
      id: result.id,
      name: result.studentName,
      score: rating,
      verdict: getVerdict(rating),
      highlights: getHighlights(result, rating),
      sessionId: result.sessionId
    };
  });

  // Group candidates by verdict
  const recommendedCandidates = candidates.filter(c => c.verdict === 'recommended');
  const possibleCandidates = candidates.filter(c => c.verdict === 'possible');
  const notRecommendedCandidates = candidates.filter(c => c.verdict === 'not_recommended');

  const renderCard = (candidate: typeof candidates[0]) => {
    // v2024: Professional white cards with lucide icons
    return (
      <div
        key={candidate.id}
        onClick={() => onViewEvaluation && onViewEvaluation(candidate.sessionId)}
        className="bg-white border border-gray-200 hover:border-gray-400 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg group"
      >
        {/* Header: Name + Score Badge */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
            {candidate.name}
          </h3>
        </div>

        {/* Key Signals - max 2 for decision making */}
        <div className="space-y-2">
          {candidate.highlights.slice(0, 2).map((highlight, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {highlight.type === 'positive' && (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
              {highlight.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              )}
              {highlight.type === 'negative' && (
                <X className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span className="text-xs text-gray-700 leading-tight">{highlight.text}</span>
            </div>
          ))}
        </div>

        {/* Hover indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-500">
            {language === 'ru' ? 'Нажмите для просмотра детального отчёта →' : 'Click to view detailed report →'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Kanban Board */}
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Recommended */}
          <div className="space-y-4">
            <div className="bg-green-100 border-2 border-green-300 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-700" />
                <h2 className="font-bold text-green-900">{t.recommended}</h2>
              </div>
              <span className="bg-green-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {recommendedCandidates.length}
              </span>
            </div>
            <div className="space-y-3">
              {recommendedCandidates.map(candidate => renderCard(candidate))}
            </div>
          </div>

          {/* Column 2: Possible */}
          <div className="space-y-4">
            <div className="bg-amber-100 border-2 border-amber-300 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <h2 className="font-bold text-amber-900">{t.possible}</h2>
              </div>
              <span className="bg-amber-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {possibleCandidates.length}
              </span>
            </div>
            <div className="space-y-3">
              {possibleCandidates.map(candidate => renderCard(candidate))}
            </div>
          </div>

          {/* Column 3: Not Recommended */}
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-300 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-red-900">{t.notRecommended}</h2>
              </div>
              <span className="bg-red-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {notRecommendedCandidates.length}
              </span>
            </div>
            <div className="space-y-3">
              {notRecommendedCandidates.map(candidate => renderCard(candidate))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
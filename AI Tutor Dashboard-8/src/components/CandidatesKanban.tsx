import { CheckCircle, AlertTriangle, X, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/i18n';
import type { QualityRating } from '@/lib/qualityRating';

interface CriterionResult {
  name: string;
  passes: number; // -1 = not met, 0 = partial, 1 = met
}

interface Result {
  id: string;
  studentName: string;
  studentSurname?: string;
  studentEmail?: string;
  sessionId: string;
  score?: number;
  qualityRating?: QualityRating;
  completedAt?: string | null;
  evaluationStatus?: string; // pending | in_progress | completed | failed
  criterionResults?: CriterionResult[];
}

interface Props {
  results: Result[];
  sessions?: unknown[];
  onViewEvaluation?: (sessionId: string) => void;
}

export function CandidatesKanban({ results, onViewEvaluation }: Props) {
  const [language] = useAtom(languageAtom);

  const translations = {
    ru: {
      recommended: 'РЕКОМЕНДУЕТСЯ',
      possible: 'ВОЗМОЖНО',
      notRecommended: 'НЕ ПОДХОДИТ',
      clickToView: 'Нажмите для просмотра детального отчёта →',
      evaluating: 'Оценка формируется...',
      pending: 'Ожидание оценки',
      score: 'Оценка',
      criteria: 'Критерии',
    },
    en: {
      recommended: 'RECOMMENDED',
      possible: 'POSSIBLY SUITABLE',
      notRecommended: 'NOT SUITABLE',
      clickToView: 'Click to view detailed report →',
      evaluating: 'Evaluation in progress...',
      pending: 'Pending evaluation',
      score: 'Score',
      criteria: 'Criteria',
    }
  };

  const t = translations[language];

  // Calculate score from criterion results: (met*1 + partial*0 + not_met*-1 + total) / (2*total) * 10
  const getScoreFromCriteria = (criteria: CriterionResult[]): number | null => {
    if (!criteria || criteria.length === 0) return null;
    const sum = criteria.reduce((acc, c) => acc + c.passes, 0);
    // Map from range [-total, +total] to [0, 10]
    return Math.round(((sum + criteria.length) / (2 * criteria.length)) * 100) / 10;
  };

  const getVerdict = (result: Result): 'recommended' | 'possible' | 'not_recommended' => {
    const criteria = result.criterionResults;
    if (criteria && criteria.length > 0) {
      const score = getScoreFromCriteria(criteria)!;
      if (score >= 7.5) return 'recommended';
      if (score >= 5.0) return 'possible';
      return 'not_recommended';
    }
    // Fallback to backend score
    if (result.score != null) {
      if (result.score >= 75) return 'recommended';
      if (result.score >= 50) return 'possible';
      return 'not_recommended';
    }
    return 'not_recommended';
  };

  const hasEvaluation = (result: Result) => result.evaluationStatus === 'completed';
  const isEvaluating = (result: Result) => result.evaluationStatus === 'in_progress';

  const candidates = results.map(result => ({
    id: result.id,
    name: result.studentName,
    surname: result.studentSurname || '',
    email: result.studentEmail || '',
    verdict: getVerdict(result),
    score: result.score,
    criteriaScore: getScoreFromCriteria(result.criterionResults || []),
    criterionResults: result.criterionResults || [],
    sessionId: result.sessionId,
    evaluated: hasEvaluation(result),
    evaluating: isEvaluating(result),
    evaluationStatus: result.evaluationStatus || 'pending',
  }));

  const recommendedCandidates = candidates.filter(c => c.verdict === 'recommended');
  const possibleCandidates = candidates.filter(c => c.verdict === 'possible');
  const notRecommendedCandidates = candidates.filter(c => c.verdict === 'not_recommended');

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 5.0) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const renderCard = (candidate: typeof candidates[0]) => (
    <div
      key={candidate.id}
      onClick={() => onViewEvaluation?.(candidate.sessionId)}
      className="bg-white border border-gray-200 hover:border-gray-400 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg group"
    >
      {/* Name + Email */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {candidate.name}{candidate.surname ? ` ${candidate.surname}` : ''}
        </h3>
        {candidate.email && (
          <div className="flex items-center gap-1 mt-1">
            <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{candidate.email}</span>
          </div>
        )}
      </div>

      {/* Evaluation content */}
      {!candidate.evaluated ? (
        /* Loading / Pending state */
        <div className="flex items-center gap-2 py-2">
          {candidate.evaluating ? (
            <>
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              <span className="text-xs text-blue-600">{t.evaluating}</span>
            </>
          ) : (
            <>
              <Loader2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">{t.pending}</span>
            </>
          )}
        </div>
      ) : (
        /* Evaluated — show score + criteria */
        <div className="space-y-2">
          {/* Overall score */}
          {candidate.criteriaScore != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{t.score}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded border ${getScoreColor(candidate.criteriaScore)}`}>
                {candidate.criteriaScore.toFixed(1)}/10
              </span>
            </div>
          )}

          {/* Criterion results */}
          {candidate.criterionResults.length > 0 && (
            <div className="space-y-1">
              {candidate.criterionResults.slice(0, 4).map((cr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {cr.passes === 1 && (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  )}
                  {cr.passes === 0 && (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                  {cr.passes === -1 && (
                    <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-700 leading-tight truncate">{cr.name}</span>
                </div>
              ))}
              {candidate.criterionResults.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{candidate.criterionResults.length - 4} {language === 'ru' ? 'ещё' : 'more'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-gray-500">{t.clickToView}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* РЕКОМЕНДУЕТСЯ */}
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

        {/* ВОЗМОЖНО */}
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

        {/* НЕ ПОДХОДИТ */}
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
  );
}

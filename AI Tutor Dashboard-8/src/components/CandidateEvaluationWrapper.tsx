import { useState, useEffect, useRef } from 'react';
import { Session, User as UserType, SessionResult } from '../types';
import { resultsAPI } from '@/lib/api';
import { scoreToQualityRating } from '@/lib/qualityRating';
import { CandidateEvaluationReport_v2 } from './CandidateEvaluationReport_v2';

interface Props {
  sessionId: string;
  session: Session | null;
  user: UserType | null;
  mockResult?: SessionResult;
  onComplete: () => void;
  onBack: () => void;
}

export function CandidateEvaluationWrapper({ sessionId, session, user, mockResult, onComplete, onBack }: Props) {
  const [result, setResult] = useState<any>(mockResult ?? null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!mockResult);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (mockResult) {
      setResult(mockResult);
      setIsLoading(false);
      return;
    }
    if (fetchedRef.current === sessionId) return;
    fetchedRef.current = sessionId;
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await resultsAPI.getCandidateDetail(sessionId);
        if (!cancelled) {
          setResult(res.result);
          setEvaluation(res.evaluation);
          setInterview(res.interview);
          setSimulation(res.simulation ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
          fetchedRef.current = null;
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId, mockResult]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка: {error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  // Transform data for v2 component
  const candidateName = result?.studentName || 'Кандидат';
  const role = interview?.position || session?.params?.position || session?.params?.topic || 'AI Интервью';

  // Calculate verdict
  const qualityRating = result?.qualityRating || (result?.score ? scoreToQualityRating(result.score) : 'suitable');
  const numericRating = {
    outstanding: 9.2,
    strong: 7.8,
    promising: 6.1,
    suitable: 4.5
  }[qualityRating] || 5.0;

  const verdict: 'recommended' | 'possible' | 'not_recommended' =
    numericRating >= 7.5 ? 'recommended' :
    numericRating >= 5.0 ? 'possible' :
    'not_recommended';

  // Extract requirement checks from evaluation criterion_results (backend format)
  const requirementChecks = evaluation?.criterion_results?.length
    ? evaluation.criterion_results.map((cr: any) => ({
        requirement: cr.criterionName || '',
        fact: cr.fact || cr.justification || 'Нет данных',
        status: (cr.passes === 1 ? 'met' : cr.passes === 0 ? 'partial' : 'not_met') as 'met' | 'partial' | 'not_met'
      }))
    : interview?.evaluation_criteria?.map((criterion: any) => ({
        requirement: criterion.criterion_name,
        fact: 'Оценка в процессе',
        status: 'partial' as const
      })) || [];

  // Follow-up questions from improvements
  const followUpQuestions = evaluation?.improvements || [];

  // Recommendation text
  const recommendation = evaluation?.summary || evaluation?.recommendation ||
    (verdict === 'recommended'
      ? 'Кандидат продемонстрировал сильные навыки и рекомендуется для дальнейшего рассмотрения.'
      : verdict === 'possible'
      ? 'Кандидат показал базовые навыки. Рекомендуется дополнительное собеседование для уточнения компетенций.'
      : 'Кандидат не соответствует минимальным требованиям для данной позиции.');

  // Transform criteria from criterion_results
  const criteria = evaluation?.criterion_results?.length
    ? evaluation.criterion_results.map((cr: any) => ({
        name: cr.criterionName || '',
        score: cr.score || 0,
        maxScore: 100,
        notes: [cr.justification || 'Нет комментариев'],
        specificFacts: [cr.fact || 'Нет данных']
      }))
    : [];

  // Transform transcript
  const transcript = (result?.transcript || []).map((msg: any, index: number) => ({
    timestamp: `${Math.floor(index * 0.5)}:${String((index * 30) % 60).padStart(2, '0')}`,
    speaker: msg.role === 'ai' ? 'AI' as const : 'Candidate' as const,
    text: msg.message || msg.content || ''
  }));

  // Transform simulation if exists
  const simulationData = simulation ? {
    situation: simulation.scenario_description || 'Моделирование рабочей ситуации',
    dialog: (simulation.dialog || []).map((msg: any) => ({
      role: msg.role === 'ai' ? 'ai' as const : 'candidate' as const,
      tone: msg.tone || 'neutral' as const,
      message: msg.message || msg.text || ''
    })),
    summary: [
      ...(evaluation?.strengths || []).map((text: string) => ({ type: 'positive' as const, text })),
      ...(evaluation?.improvements || []).map((text: string) => ({ type: 'warning' as const, text }))
    ]
  } : undefined;

  return (
    <CandidateEvaluationReport_v2
      candidateName={candidateName}
      role={role}
      overallScore={numericRating * 10}
      verdict={verdict}
      meetsRequirements={evaluation?.strengths || []}
      concernsOrMissing={evaluation?.improvements || []}
      requirementChecks={requirementChecks}
      followUpQuestions={followUpQuestions}
      recommendation={recommendation}
      practicalInfo={{}}
      criteria={criteria}
      transcript={transcript}
      simulation={simulationData}
      audioUrl={result?.audioUrl}
      onBack={onBack}
    />
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Session } from '@/types';
import { interviewsAPI, resultsAPI } from '@/lib/api';
import { CandidatesKanban } from './CandidatesKanban';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';

export function InterviewCandidatesPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);

  const [interview, setInterview] = useState<Session | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [interviewId]);

  const loadData = async () => {
    if (!interviewId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [interviewData, candidatesResponse] = await Promise.all([
        interviewsAPI.getInterview(interviewId),
        resultsAPI.getCandidates({ interview_id: interviewId })
      ]);

      // Transform interview to Session format for CandidatesTab
      const params = interviewData.params || {};
      const session: Session = {
        id: interviewData.id,
        organizerId: interviewData.organizerId || interviewData.organizer_id || '',
        organizerName: interviewData.organizerName || interviewData.organizer_name || '',
        params: {
          position: params.position || interviewData.position || 'AI Интервью',
          company: params.company || interviewData.company,
          topic: params.topic || interviewData.title,
          questions: params.questions || [],
          ...params
        },
        createdAt: interviewData.createdAt || interviewData.created_at || new Date().toISOString(),
        shareUrl: interviewData.shareUrl || interviewData.share_url || `/interview/${interviewData.id}`
      };
      setInterview(session);

      // Transform results to match expected format
      const transformedResults = (candidatesResponse.results || []).map((result: any) => ({
        id: result.id || result.sessionId,
        sessionId: result.sessionId,
        interviewId: result.interviewId,
        studentName: result.studentName,
        studentEmail: result.studentEmail,
        score: result.score,
        qualityRating: result.qualityRating,
        completedAt: result.completedAt,
        transcript: result.transcript || [],
        requirementChecks: result.criterionResults || []
      }));

      console.log('[InterviewCandidatesPage] Transformed results:', transformedResults);
      setResults(transformedResults);
    } catch (err) {
      console.error('[InterviewCandidatesPage] Ошибка загрузки:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleViewEvaluation = (sessionId: string) => {
    navigate(`/evaluation/${sessionId}`);
  };

  if (!interviewId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.organizerDashboard?.loadingCandidates || 'Загрузка кандидатов...'}</h3>
            <p className="text-sm text-gray-600">{t.organizerDashboard?.loadingCandidatesDesc || 'Подождите, пожалуйста'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад в кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.organizerDashboard?.backToInterviews || 'Назад к интервью'}
        </button>

        {results.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <p className="text-gray-600 mb-2">{t.organizerDashboard?.noCandidates || 'Нет кандидатов'}</p>
            <p className="text-sm text-gray-500">{t.organizerDashboard?.noCandidatesDesc || 'Кандидаты появятся здесь после прохождения интервью'}</p>
          </div>
        ) : (
          <CandidatesKanban
            results={results}
            sessions={interview ? [interview] : []}
            onViewEvaluation={handleViewEvaluation}
          />
        )}
      </div>
    </div>
  );
}

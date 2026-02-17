import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { publicAPI } from '@/lib/api';
import { CandidateEvaluationReport_v2 } from './CandidateEvaluationReport_v2';

export function ThankYouPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Токен интервью не найден');
      setIsLoading(false);
      return;
    }

    loadResults();
  }, [token]);

  // Poll for results if evaluation is in progress
  useEffect(() => {
    if (!results || !results.isEvaluating) {
      return;
    }

    const pollInterval = setInterval(() => {
      console.log('[ThankYouPage] Polling for evaluation results...');
      loadResults();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [results?.isEvaluating]);

  const loadResults = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await publicAPI.getSessionResults(token);
      console.log('[ThankYouPage] Loaded results:', { isEvaluating: data.isEvaluating, hasEvaluation: !!data.evaluation });
      setResults(data);
    } catch (error) {
      console.error('Ошибка при загрузке результатов:', error);

      // If interview not completed yet, show waiting message
      if (error instanceof Error && error.message.includes('not completed')) {
        setError('Интервью еще не завершено. Пожалуйста, завершите интервью перед просмотром результатов.');
      } else {
        setError(error instanceof Error ? error.message : 'Не удалось загрузить результаты интервью');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка результатов интервью...</p>
          <p className="text-sm text-gray-500 mt-2">
            AI анализирует ваши ответы, это займет несколько секунд
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Результаты пока не готовы</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadResults}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Результаты не найдены</h2>
          <p className="text-gray-600 mb-6">
            Не удалось найти результаты вашего интервью.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for CandidateEvaluationReport_v2 component
  const reportProps = {
    candidateName: results.candidateName,
    role: results.role,
    overallScore: results.evaluation?.overallScore || 0,
    verdict: results.evaluation?.verdict || 'not_recommended',
    meetsRequirements: [],
    concernsOrMissing: [],
    requirementChecks: results.evaluation?.requirementChecks || [],
    followUpQuestions: [],
    recommendation: results.evaluation?.recommendation || 'Результаты интервью обрабатываются...',
    practicalInfo: {},
    criteria: results.evaluation?.criteria || [],
    transcript: results.transcript || [],
    simulation: results.simulation || undefined,
    audioUrl: undefined,
    isLoadingTranscript: results.isLoadingTranscript,
    isEvaluating: results.isEvaluating,
    onBack: () => navigate('/'),
  };

  return <CandidateEvaluationReport_v2 {...reportProps} />;
}

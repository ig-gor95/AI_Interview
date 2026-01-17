import { useState } from 'react';
import { Search, Download, Filter as FilterIcon, AlertTriangle, ChevronRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
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
}

interface Props {
  results: Result[];
  sessions: Session[];
  onViewEvaluation?: (sessionId: string) => void;
}

// Строго 3 статуса согласно спеке
type RecommendationStatus = 'recommended' | 'questionable' | 'not-recommended';

export function CandidatesTab({ results, sessions, onViewEvaluation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RecommendationStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<[number, number]>([0, 10]);
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('rating');

  // Конвертация качественного рейтинга в числовой 0-10
  const getNumericRating = (result: Result): number => {
    const qualityRating = result.qualityRating || (result.score ? scoreToQualityRating(result.score) : 'suitable');
    
    // Маппинг качественных оценок в числовые (0-10)
    const ratingMap: Record<QualityRating, number> = {
      outstanding: 9.2,
      strong: 7.8,
      promising: 6.1,
      suitable: 4.5
    };
    
    return ratingMap[qualityRating] || 5.0;
  };

  // Определение статуса рекомендации
  const getRecommendationStatus = (rating: number): RecommendationStatus => {
    if (rating >= 7.5) return 'recommended';
    if (rating >= 5.0) return 'questionable';
    return 'not-recommended';
  };

  // Генерация ключевых сигналов (3-4 маркера)
  const getKeySignals = (result: Result, session: Session | undefined): Array<{ type: 'positive' | 'neutral' | 'negative', text: string }> => {
    const rating = getNumericRating(result);
    const transcript = result.transcript || [];
    const userMessages = transcript.filter(t => t.role === 'user');
    
    const signals: Array<{ type: 'positive' | 'neutral' | 'negative', text: string }> = [];

    if (rating >= 8) {
      signals.push({ type: 'positive', text: 'Чётко формулирует мысли' });
      signals.push({ type: 'positive', text: 'Профессиональная лексика' });
    } else if (rating >= 7) {
      signals.push({ type: 'positive', text: 'Релевантный опыт' });
      signals.push({ type: 'neutral', text: 'Стандартные ответы' });
    } else if (rating >= 5) {
      signals.push({ type: 'neutral', text: 'Неуверенность в ответах' });
      signals.push({ type: 'neutral', text: 'Требует уточнений' });
    } else {
      signals.push({ type: 'negative', text: 'Несвязная речь' });
      signals.push({ type: 'negative', text: 'Уходит от вопросов' });
    }

    // Добавляем сигнал о длине ответов
    if (userMessages.length > 0) {
      const avgLength = userMessages.reduce((sum, m) => sum + ((m.message || m.content || '').length), 0) / userMessages.length;
      if (avgLength < 30) {
        signals.push({ type: 'negative', text: 'Слишком краткие ответы' });
      } else if (avgLength > 200) {
        signals.push({ type: 'positive', text: 'Развёрнутые ответы' });
      }
    }

    return signals.slice(0, 4); // Максимум 4 сигнала
  };

  // Определение источника (для фильтра)
  const getSource = (session: Session | undefined): string => {
    return session?.params?.source || 'Прямая ссылка';
  };

  // Расчет длительности
  const getDuration = (result: Result): string => {
    const transcript = result.transcript || [];
    if (transcript.length === 0) return '0:00';
    
    // Примерная оценка: 5 секунд на сообщение
    const seconds = transcript.length * 5;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Проверка на прерванное интервью
  const isIncomplete = (result: Result, session: Session | undefined): boolean => {
    const questions = session?.params?.questions || [];
    const userMessages = result.transcript?.filter(t => t.role === 'user') || [];
    return questions.length > 0 && userMessages.length < questions.length * 0.7; // <70% ответов
  };

  // Фильтрация
  const filteredResults = results
    .filter(r => {
      // Поиск
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = r.studentName.toLowerCase().includes(query);
        const matchEmail = r.studentEmail?.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }

      // Статус
      const rating = getNumericRating(r);
      const status = getRecommendationStatus(rating);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      // Рейтинг
      if (rating < ratingFilter[0] || rating > ratingFilter[1]) return false;

      // Только с проблемами
      if (showProblemsOnly) {
        const session = sessions.find(s => s.id === r.sessionId);
        const signals = getKeySignals(r, session);
        const hasProblems = signals.some(s => s.type === 'negative');
        if (!hasProblems) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return getNumericRating(b) - getNumericRating(a);
      } else {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    });

  // Статистика
  const stats = {
    total: results.length,
    recommended: results.filter(r => getRecommendationStatus(getNumericRating(r)) === 'recommended').length,
    questionable: results.filter(r => getRecommendationStatus(getNumericRating(r)) === 'questionable').length,
    notRecommended: results.filter(r => getRecommendationStatus(getNumericRating(r)) === 'not-recommended').length,
  };

  // Получение всех уникальных источников
  const allSources = Array.from(new Set(
    sessions.map(s => s.params?.source || 'Прямая ссылка')
  ));

  const exportToCSV = () => {
    const headers = ['Имя', 'Email', 'Рейтинг', 'Статус', 'Позиция', 'Дата', 'Длительность'];
    const rows = filteredResults.map(r => {
      const session = sessions.find(s => s.id === r.sessionId);
      const rating = getNumericRating(r);
      const status = getRecommendationStatus(rating);
      const statusText = status === 'recommended' ? 'Рекомендован' : status === 'questionable' ? 'Сомнительный' : 'Не рекомендован';
      
      return [
        r.studentName,
        r.studentEmail || '',
        rating.toFixed(1),
        statusText,
        session?.params.position || session?.params.topic || 'AI Интервью',
        new Date(r.completedAt).toLocaleDateString('ru-RU'),
        getDuration(r)
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет результатов</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Здесь появятся результаты AI-интервью после прохождения кандидатами
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Вакансия и статистика */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Вакансия: {sessions[0]?.params?.position || 'AI Интервью'}
            </h2>
            <p className="text-sm text-gray-600">
              {stats.total} {stats.total === 1 ? 'кандидат' : stats.total < 5 ? 'кандидата' : 'кандидатов'} • {stats.recommended} рекомендовано
            </p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-600 mb-0.5">Рекомендовано</p>
              <p className="text-xl font-bold text-green-900">{stats.recommended}</p>
            </div>
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-600 mb-0.5">Сомнительно</p>
              <p className="text-xl font-bold text-yellow-900">{stats.questionable}</p>
            </div>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-0.5">Не рекомендовано</p>
              <p className="text-xl font-bold text-gray-900">{stats.notRecommended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры (СВЕРХВАЖНО) */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Поиск и экспорт */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm hover:border-gray-400"
              />
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 bg-white shadow-sm hover:shadow"
            >
              <Download className="w-4 h-4" />
              Экспорт
            </button>
          </div>

          {/* Фильтры */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Статус */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">Все ({stats.total})</option>
                <option value="recommended">Рекомендован ({stats.recommended})</option>
                <option value="questionable">Сомнительный ({stats.questionable})</option>
                <option value="not-recommended">Не рекомендован ({stats.notRecommended})</option>
              </select>
            </div>

            {/* Рейтинг */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Мин. рейтинг</label>
              <select
                value={ratingFilter[0]}
                onChange={(e) => setRatingFilter([Number(e.target.value), ratingFilter[1]])}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="0">0+ (все)</option>
                <option value="5">5+ (выше среднего)</option>
                <option value="7.5">7.5+ (сильные)</option>
                <option value="9">9+ (топ)</option>
              </select>
            </div>

            {/* Сортировка */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Сортировка</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="rating">По рейтингу ↓</option>
                <option value="date">По дате ↓</option>
              </select>
            </div>
          </div>

          {/* Чекбокс: только с проблемами */}
          <div className="pt-3 border-t border-gray-200">
            <label className="flex items-center gap-2.5 cursor-pointer w-fit group">
              <input
                type="checkbox"
                checked={showProblemsOnly}
                onChange={(e) => setShowProblemsOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                Только с проблемами речи / поведения
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Таблица кандидатов */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header табицы */}
        <div className="hidden lg:grid grid-cols-11 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div className="col-span-1">Рейтинг</div>
          <div className="col-span-2">Кандидат</div>
          <div className="col-span-2">Статус</div>
          <div className="col-span-5">Ключевые сигналы</div>
          <div className="col-span-1">Действия</div>
        </div>

        {/* Строки */}
        <div className="divide-y divide-gray-200">
          {filteredResults.map((result) => {
            const session = sessions.find(s => s.id === result.sessionId);
            const rating = getNumericRating(result);
            const status = getRecommendationStatus(rating);
            const signals = getKeySignals(result, session);
            const duration = getDuration(result);
            const incomplete = isIncomplete(result, session);

            const statusConfig = {
              'recommended': { label: 'Рекомендован', icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              'questionable': { label: 'Сомнительный', icon: AlertCircle, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
              'not-recommended': { label: 'Не рекомендован', icon: XCircle, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }
            }[status];

            const StatusIcon = statusConfig.icon;

            // Цвет рейтинга
            const ratingColor = rating >= 7.5 ? 'text-green-700 bg-green-50 border-green-300' :
                               rating >= 5 ? 'text-yellow-700 bg-yellow-50 border-yellow-300' :
                               'text-gray-700 bg-gray-50 border-gray-300';

            return (
              <div
                key={result.id}
                className="grid grid-cols-1 lg:grid-cols-11 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => {
                  if (onViewEvaluation) {
                    onViewEvaluation(result.sessionId);
                  }
                }}
              >
                {/* 1. Рейтинг */}
                <div className="lg:col-span-1 flex lg:flex-col items-start lg:items-center gap-2 lg:gap-1">
                  <div className={`px-3 py-2 rounded-lg border-2 ${ratingColor} min-w-[60px] text-center`}>
                    <p className="text-2xl font-bold">{rating.toFixed(1)}</p>
                  </div>
                  <p className="text-xs text-gray-500 text-center hidden lg:block mt-1">
                    Коммуникация<br/>и ответы
                  </p>
                </div>

                {/* 2. Кандидат */}
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {result.studentName}
                  </h3>
                  <p className="text-xs text-gray-600 mb-0.5">
                    {session?.params.position || 'AI Интервью'}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-gray-500">
                      {new Date(result.completedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {duration}
                    </span>
                  </div>
                  {result.studentEmail && (
                    <p className="text-xs text-gray-400 truncate mt-1">{result.studentEmail}</p>
                  )}
                </div>

                {/* 3. Статус */}
                <div className="lg:col-span-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${statusConfig.border} ${statusConfig.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                </div>

                {/* 4. Ключевые сигналы (САМОЕ ЦЕННОЕ) */}
                <div className="lg:col-span-5">
                  <div className="space-y-1">
                    {signals.map((signal, idx) => {
                      const signalIcon = signal.type === 'positive' ? '+' : signal.type === 'negative' ? '–' : '~';
                      const signalColor = signal.type === 'positive' ? 'text-green-700' : signal.type === 'negative' ? 'text-red-700' : 'text-yellow-700';
                      
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <span className={`font-bold text-sm ${signalColor} flex-shrink-0`}>{signalIcon}</span>
                          <span className="text-sm text-gray-700">{signal.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Действия */}
                <div className="lg:col-span-1 flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewEvaluation) {
                        onViewEvaluation(result.sessionId);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group/btn"
                  >
                    <span className="hidden lg:inline">Подробнее</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State для фильтров */}
      {filteredResults.length === 0 && results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FilterIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Кандидаты не найдены</h3>
          <p className="text-sm text-gray-600 mb-4">
            Попробуйте изменить параметры фильтрации
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setRatingFilter([0, 10]);
              setShowProblemsOnly(false);
            }}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Disclaimer (КРИТИЧНО ДЛЯ ДОВЕРИЯ) */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900 font-medium mb-1">
              ⚠️ Сервис не принимает решение за работодателя
            </p>
            <p className="text-xs text-amber-800">
              Результаты — вспомогательный инструмент для первичного отбора. Финальное решение о найме принимает HR-специалист или руководитель.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
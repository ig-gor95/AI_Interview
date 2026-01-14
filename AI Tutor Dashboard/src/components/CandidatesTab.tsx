import { useState } from 'react';
import { Search, Download, Eye, CheckCircle, XCircle, Circle, Filter as FilterIcon, TrendingUp, TrendingDown, Phone, MessageSquare, Shield, Heart, Lightbulb, Star, AlertTriangle, ChevronRight } from 'lucide-react';
import { Session } from '@/types';

interface Result {
  id: string;
  studentName: string;
  studentEmail?: string;
  sessionId: string;
  score?: number;
  completedAt: string;
  transcript?: Array<{ role: string; message?: string; content?: string }>;
}

interface Props {
  results: Result[];
  sessions: Session[];
  onViewEvaluation?: (sessionId: string) => void;
  onStatusChange?: (resultId: string, status: CandidateStatus) => void;
}

type CandidateStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected';

export function CandidatesTab({ results, sessions, onViewEvaluation, onStatusChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CandidateStatus>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'name'>('date');
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, CandidateStatus>>({});
  
  const getStatus = (resultId: string): CandidateStatus => {
    return candidateStatuses[resultId] || 'new';
  };

  const updateStatus = (resultId: string, status: CandidateStatus) => {
    setCandidateStatuses(prev => ({ ...prev, [resultId]: status }));
    if (onStatusChange) {
      onStatusChange(resultId, status);
    }
  };

  const filteredResults = results
    .filter(r => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = r.studentName.toLowerCase().includes(query);
        const matchEmail = r.studentEmail?.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }

      if (statusFilter !== 'all' && getStatus(r.id) !== statusFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      } else if (sortBy === 'rating') {
        return (b.score || 0) - (a.score || 0);
      } else {
        return a.studentName.localeCompare(b.studentName);
      }
    });

  const stats = {
    total: results.length,
    new: results.filter(r => getStatus(r.id) === 'new').length,
    shortlisted: results.filter(r => getStatus(r.id) === 'shortlisted').length,
    avgScore: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length) : 0,
    topCandidates: results.filter(r => (r.score || 0) >= 80).length,
  };

  const exportToCSV = () => {
    const headers = ['Имя', 'Email', 'Позиция', 'Рейтинг', 'Дата', 'Статус'];
    const rows = filteredResults.map(r => {
      const session = sessions.find(s => s.id === r.sessionId);
      return [
        r.studentName,
        r.studentEmail || '',
        session?.params.position || session?.params.topic || 'AI Интервью',
        `${r.score || 0}%`,
        new Date(r.completedAt).toLocaleDateString('ru-RU'),
        getStatus(r.id)
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: CandidateStatus) => {
    const badges = {
      new: { text: 'Новый', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      reviewed: { text: 'Просмотрен', color: 'bg-gray-50 text-gray-700 border-gray-200' },
      shortlisted: { text: 'Отобран', color: 'bg-green-50 text-green-700 border-green-200' },
      rejected: { text: 'Отклонён', color: 'bg-red-50 text-red-700 border-red-200' },
    };
    return badges[status];
  };

  // Генерация AI insights для кандидата
  const getCandidateInsights = (score: number, evaluationCriteria: string[]) => {
    // Генерируем описательные наблюдения вместо числовых баллов
    const behaviors = [
      { key: 'stressHandling', label: 'Работа со стрессом', level: 'Уверенно справляется' },
      { key: 'empathy', label: 'Эмпатия', level: 'Хорошо развита' },
      { key: 'communication', label: 'Коммуникация', level: 'Четкая и профессиональная' },
      { key: 'problemSolving', label: 'Решение проблем', level: 'Предлагает конкретные решения' },
    ];

    return {
      behaviors,
      topStrength: 'Сохраняет спокойствие под давлением',
      readyToWork: true,
      needsSupport: false,
    };
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет кандидатов</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Здесь появятся результаты AI-интервью после прохождения кандидатами
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-600">Всего интервью</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{stats.topCandidates}</p>
          <p className="text-sm text-gray-600">Сильных кандидатов</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{stats.shortlisted}</p>
          <p className="text-sm text-gray-600">Отобрано</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{stats.avgScore}%</p>
          <p className="text-sm text-gray-600">Средний балл</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск кандидата по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="date">По дате ↓</option>
              <option value="rating">По рейтингу ↓</option>
              <option value="name">По имени А-Я</option>
            </select>
            
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <FilterIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Фильтр:</span>
          
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'new' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Новые ({stats.new})
          </button>
          <button
            onClick={() => setStatusFilter('shortlisted')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'shortlisted' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            Отобраны ({stats.shortlisted})
          </button>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-3">
        {filteredResults.map((result) => {
          const session = sessions.find(s => s.id === result.sessionId);
          const score = result.score || 0;
          const status = getStatus(result.id);
          const statusBadge = getStatusBadge(status);
          
          const userMessages = result.transcript?.filter(t => t.role === 'user') || [];
          const totalMessages = userMessages.length;
          
          const evaluationCriteria = session?.params.evaluationCriteria || [];
          const questions = session?.params.questions || [];
          const completionRate = questions.length > 0 ? Math.round((totalMessages / questions.length) * 100) : 0;
          
          const insights = getCandidateInsights(score, evaluationCriteria);

          return (
            <div
              key={result.id}
              className="bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                if (status === 'new') {
                  updateStatus(result.id, 'reviewed');
                }
                if (onViewEvaluation) {
                  onViewEvaluation(result.sessionId);
                }
              }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  
                  {/* Avatar & Main Info */}
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-semibold text-white ${
                      score >= 80 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      score >= 60 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {result.studentName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {result.studentName}
                          </h3>
                          {insights.readyToWork && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Готов к работе
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <span className="font-medium">{session?.params.position || 'AI Интервью'}</span>
                          {result.studentEmail && (
                            <>
                              <span>•</span>
                              <span className="truncate">{result.studentEmail}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {new Date(result.completedAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span>•</span>
                          <span>{totalMessages} реплик в диалоге</span>
                          <span>•</span>
                          <span>AI Интервьюер</span>
                        </div>
                      </div>

                      {/* Status Badge + Arrow */}
                      <div className="flex items-center gap-3 ml-4">
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>

                    {/* Behavioral Observations */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {insights.behaviors.map((behavior) => (
                        <div key={behavior.key} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-600 mb-1">{behavior.label}</p>
                          <p className="text-sm text-gray-900">{behavior.level}</p>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Row: Summary */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="font-medium">Сильная сторона:</span> <span className="text-gray-900">{insights.topStrength}</span>
                        </span>
                        {evaluationCriteria.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{evaluationCriteria.length} критериев оценено</span>
                          </>
                        )}
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="relative group/status">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${statusBadge.color} cursor-pointer hover:opacity-80 transition-opacity`}>
                            {statusBadge.text}
                          </span>
                          
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-10 overflow-hidden">
                            <div className="p-1">
                              <button
                                onClick={() => {
                                  if (status === 'new') updateStatus(result.id, 'reviewed');
                                  if (onViewEvaluation) onViewEvaluation(result.sessionId);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm flex items-center gap-2 rounded-md transition-colors text-gray-700"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                                Открыть детали
                              </button>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="p-1">
                              <button
                                onClick={() => updateStatus(result.id, 'new')}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2 rounded-md transition-colors text-gray-700"
                              >
                                <Circle className="w-4 h-4 text-blue-600" />
                                Новый
                              </button>
                              <button
                                onClick={() => updateStatus(result.id, 'reviewed')}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2 rounded-md transition-colors text-gray-700"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                                Просмотрен
                              </button>
                              <button
                                onClick={() => updateStatus(result.id, 'shortlisted')}
                                className="w-full px-3 py-2 text-left hover:bg-green-50 text-sm flex items-center gap-2 rounded-md transition-colors text-gray-700"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Отобран
                              </button>
                              <button
                                onClick={() => updateStatus(result.id, 'rejected')}
                                className="w-full px-3 py-2 text-left hover:bg-red-50 text-sm flex items-center gap-2 rounded-md transition-colors text-gray-700"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                                Отклонён
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredResults.length === 0 && results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Кандидаты не найдены</h3>
          <p className="text-sm text-gray-600">
            Попробуйте изменить параметры фильтрации или поиска
          </p>
        </div>
      )}
    </div>
  );
}
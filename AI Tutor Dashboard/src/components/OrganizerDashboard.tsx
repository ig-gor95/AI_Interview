import { useState } from 'react';
import { Plus, Link as LinkIcon, Calendar, Clock, Target, Copy, Check, BarChart3, Users, MessageSquare, Video, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, SlidersHorizontal, Eye, Search, Download, Star, CheckCircle, XCircle, AlertCircle, Circle, MoreVertical, Mail, Phone } from 'lucide-react';
import { Session, SessionParams, User } from '@/types';
import { saveSession, getResultsByOrganizerId } from '@/lib/mockData';
import { InterviewForm } from './InterviewForm';
import { CandidatesTab } from './CandidatesTab';

interface Props {
  user: User;
  sessions: Session[];
  onRefresh: () => void;
  onOpenSession: (sessionId: string) => void;
  onViewEvaluation?: (sessionId: string) => void;
}

export function OrganizerDashboard({ user, sessions, onRefresh, onOpenSession, onViewEvaluation }: Props) {
  const [activeTab, setActiveTab] = useState<'manage' | 'sessions' | 'students'>('manage');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  
  // Candidates tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'shortlisted' | 'rejected'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'name'>('date');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, string>>({});

  const userSessions = sessions.filter(s => s.organizerId === user.id);
  const results = getResultsByOrganizerId(user.id);

  const handleCreateSession = (params: SessionParams) => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      organizerId: user.id,
      organizerName: user.name,
      params,
      createdAt: new Date().toISOString(),
      shareUrl: `/session/session-${Date.now()}`
    };
    
    saveSession(newSession);
    setShowCreateForm(false);
    onRefresh();
  };



  const copyToClipboard = (sessionId: string, url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTranscript = (resultId: string) => {
    setExpandedTranscripts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">Всего интервью</p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">{userSessions.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {results.length === 1 ? 'Кандидат прошёл' : 
                 results.length >= 2 && results.length <= 4 ? 'Кандидата прошли' : 
                 'Кандидатов прошли'}
              </p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">{results.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">Средний балл</p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">
              {results.length > 0 
                ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
                : 0}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl text-gray-900 mb-1">
              {activeTab === 'manage' 
                ? 'Управление интервью' 
                : activeTab === 'sessions'
                ? 'Мои тестовые интервью'
                : 'Статистика кандидатов'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {activeTab === 'manage' 
                ? 'Создавайте и управляйте AI-интервью для отбора кандидатов' 
                : activeTab === 'sessions'
                ? 'Протестируйте интервью сами перед отправкой кандидатам'
                : 'Детальная статистика по всем кандидатам'}
            </p>
          </div>
          {activeTab === 'manage' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Создать интервью</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Управление</span>
            <span className="sm:hidden">Интервью</span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Тестовые интервью</span>
            <span className="sm:hidden">Тест</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Кандидаты</span>
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <InterviewForm 
            onClose={() => setShowCreateForm(false)}
            onCreate={handleCreateSession}
          />
        )}

        {/* Content based on active tab */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {userSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Создайте своё первое интервью</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Настройте AI-интервью для отбора кандидатов и получите ссылку для отправки
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Создать интервью</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {userSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-gray-900 mb-1">
                              {session.params.position || session.params.topic || 'AI Интервью'}
                            </h3>
                            {session.params.company && (
                              <p className="text-sm text-gray-600 mb-2">{session.params.company}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {session.params.duration} мин
                              </span>
                              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                                {session.params.difficulty === 'beginner' ? '🌱 Начальный' :
                                 session.params.difficulty === 'intermediate' ? '📚 Средний' :
                                 '🚀 Продвинутый'}
                              </span>
                              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                                {session.params.language === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pl-13 space-y-2 text-sm">
                          {session.params.goals && session.params.goals.length > 0 && (
                            <div>
                              <span className="text-gray-600">Цели: </span>
                              <span className="text-gray-900">{session.params.goals.join(', ')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Создано: </span>
                            <span className="text-gray-900">
                              {new Date(session.createdAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <button
                          onClick={() => copyToClipboard(session.id, session.shareUrl)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          {copiedId === session.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Скопировано!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Копировать ссылку</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onOpenSession(session.id)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          <Video className="w-4 h-4" />
                          <span>Пройти тест</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {userSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Нет доступных интервью</h3>
                <p className="text-gray-600">
                  Создайте интервью чтобы пройти его в тестовом режиме
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {userSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer" onClick={() => onOpenSession(session.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg text-gray-900 mb-1">
                          {session.params.position || session.params.topic || 'AI Интервью'}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.params.duration} мин
                          </span>
                          <span>•</span>
                          <span>
                            {session.params.difficulty === 'beginner' ? 'Начальный' :
                             session.params.difficulty === 'intermediate' ? 'Средний' :
                             'Продвинутый'} уровень
                          </span>
                        </div>
                      </div>
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        <span>Начать</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <CandidatesTab
            results={results}
            sessions={sessions}
            onViewEvaluation={onViewEvaluation}
          />
        )}
      </div>
    </div>
  );
}
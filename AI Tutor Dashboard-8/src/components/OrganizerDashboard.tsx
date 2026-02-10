import { useState, useEffect, useCallback } from 'react';
import { Plus, Link as LinkIcon, Target, Copy, Check, BarChart3, Users, MessageSquare, HelpCircle, QrCode, Trash2, Edit2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';
import { Session, SessionParams, User } from '@/types';
import { saveSession, getResultsByOrganizerId } from '@/lib/mockData';
import { interviewsAPI, resultsAPI } from '@/lib/api';
import { InterviewForm } from './InterviewForm';
import { CandidatesTab } from './CandidatesTab';
import { InterviewLinksManager } from './InterviewLinksManager';
import { ITRequestModal } from './ITRequestModal';
import { getTopCandidatesPercentage, getOverallQuality, scoreToQualityRating } from '@/lib/qualityRating';

interface Props {
  user: User;
  sessions: Session[];
  onRefresh: () => void;
  onViewEvaluation?: (sessionId: string) => void;
  onViewCandidates?: (interviewId: string) => void;
}

export function OrganizerDashboard({ user, sessions, onRefresh, onViewEvaluation, onViewCandidates }: Props) {
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);
  const [activeTab, setActiveTab] = useState<'manage' | 'students'>('manage');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [selectedSessionForLinks, setSelectedSessionForLinks] = useState<Session | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedSessionForQR, setSelectedSessionForQR] = useState<Session | null>(null);
  
  // Candidates tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'shortlisted' | 'rejected'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'name'>('date');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, string>>({});
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Filter sessions and validate UUID format
  const allUserSessions = sessions.filter(s => {
    if (s.organizerId !== user.id) return false;
    // Validate UUID format to prevent errors with old mockData IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(s.id)) {
      console.warn(`Skipping session with invalid UUID format: ${s.id}`);
      return false;
    }
    return true;
  });

  // Get unique companies for filter
  const uniqueCompanies = Array.from(
    new Set(
      allUserSessions
        .map(s => s.params.company)
        .filter((c): c is string => !!c && c.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b));

  // Filter companies by search input
  const filteredCompanies = uniqueCompanies.filter(company =>
    company.toLowerCase().includes(companyFilter.toLowerCase())
  );

  // Apply company filter to sessions
  const userSessions = allUserSessions.filter(s => {
    if (!companyFilter) return true;
    return s.params.company?.toLowerCase().includes(companyFilter.toLowerCase());
  });
  const [results, setResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  const [statistics, setStatistics] = useState({
    totalInterviews: 0,
    completedCandidates: 0,
    recommendedPercentage: 0
  });
  
  // Load results and statistics from API
  useEffect(() => {
    loadResults();
    loadStatistics();
  }, [user.id]);
  
  // Reload when switching tabs or when selectedInterviewId changes
  useEffect(() => {
    loadResults();
    if (activeTab === 'students') {
      loadStatistics();
    }
  }, [activeTab, selectedInterviewId]);
  
  const loadResults = async () => {
    try {
      setIsLoadingResults(true);
      // On 'manage' tab, always load all results; on 'students' tab, filter by selectedInterviewId
      const params = (activeTab === 'students' && selectedInterviewId) ? { interview_id: selectedInterviewId } : undefined;
      const candidatesResponse = await resultsAPI.getCandidates(params);
      const candidates = candidatesResponse.results || [];
      setResults(candidates);
    } catch (error) {
      console.error('[OrganizerDashboard] Ошибка при загрузке результатов:', error);
      // Fallback to mockData if API fails
      const mockResults = getResultsByOrganizerId(user.id);
      console.log(`[OrganizerDashboard] Fallback to mockData: ${mockResults.length} results`);
      setResults(mockResults);
    } finally {
      setIsLoadingResults(false);
    }
  };
  
  const loadStatistics = async () => {
    try {
      const stats = await resultsAPI.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      // Fallback: calculate from results
      const mockResults = getResultsByOrganizerId(user.id);
      const ratings = mockResults.map(r => 
        r.qualityRating || (r.score ? scoreToQualityRating(r.score) : undefined)
      );
      const topPercentage = getTopCandidatesPercentage(ratings);
      setStatistics({
        totalInterviews: userSessions.length,
        completedCandidates: mockResults.length,
        recommendedPercentage: topPercentage
      });
    }
  };

  const openQRModal = useCallback((session: Session) => {
    setSelectedSessionForQR(session);
    setShowQRModal(true);
  }, []);

  useEffect(() => {
    if (!selectedSessionForQR || !showQRModal) return;
    const url = `${window.location.origin}${selectedSessionForQR.shareUrl}`;
    QRCode.toDataURL(url, { width: 256, margin: 2 })
      .then(setQrCodeDataUrl)
      .catch(() => setQrCodeDataUrl(''));
  }, [selectedSessionForQR, showQRModal]);

  const handleCreateSession = async (params: SessionParams) => {
    try {
      // Отправляем данные на бэкенд
      const newInterview = await interviewsAPI.createInterview({ params });

      // Обновляем локальное хранилище для совместимости (если нужно)
      saveSession({
        id: newInterview.id,
        organizerId: newInterview.organizerId,
        organizerName: newInterview.organizerName,
        params: newInterview.params,
        createdAt: newInterview.createdAt,
        shareUrl: newInterview.shareUrl
      });

      setShowCreateForm(false);
      onRefresh(); // Обновляем список интервью
    } catch (error) {
      console.error('Ошибка при создании интервью:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при создании интервью. Попробуйте еще раз.');
    }
  };

  const handleUpdateSession = async (interviewId: string, params: SessionParams) => {
    try {
      await interviewsAPI.updateInterview(interviewId, { params });
      setEditingSession(null);
      onRefresh(); // Обновляем список интервью
    } catch (error) {
      console.error('Ошибка при обновлении интервью:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при обновлении интервью. Попробуйте еще раз.');
    }
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

  const handleViewCandidates = (interviewId: string) => {
    if (onViewCandidates) {
      onViewCandidates(interviewId);
    } else {
      setSelectedInterviewId(interviewId);
      setActiveTab('students');
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    const msg = language === 'ru' ? 'Удалить это интервью?' : 'Delete this interview?';
    if (!window.confirm(msg)) return;
    try {
      await interviewsAPI.deleteInterview(interviewId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete interview:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedSessionForLinks ? (
        <InterviewLinksManager 
          session={selectedSessionForLinks}
          onBack={() => setSelectedSessionForLinks(null)}
          onViewCandidates={(id) => {
            setSelectedSessionForLinks(null);
            handleViewCandidates(id);
          }}
        />
      ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">{t.organizerDashboard.totalInterviews}</p>
            </div>
              <p className="text-2xl sm:text-3xl text-gray-900">{statistics.totalInterviews || userSessions.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {t.organizerDashboard.candidatesPassed}
              </p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">{statistics.completedCandidates}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base text-gray-600">{t.organizerDashboard.recommendedShare}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.organizerDashboard.recommendedShareDesc}
                </p>
              </div>
            </div>
            {statistics.completedCandidates > 0 ? (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl text-gray-900">{statistics.recommendedPercentage}%</p>
                <span className="text-sm text-gray-500">{t.organizerDashboard.candidatesLabel}</span>
              </div>
            ) : (
              <p className="text-2xl sm:text-3xl text-gray-400">-</p>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl text-gray-900 mb-1">
              {activeTab === 'manage' ? t.organizerDashboard.manageTitle : t.organizerDashboard.candidatesStatsTitle}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {activeTab === 'manage' ? t.organizerDashboard.manageDesc : t.organizerDashboard.candidatesStatsDesc}
            </p>
            {activeTab === 'manage' && (
              <p className="text-xs text-gray-500 mt-1">
                {t.organizerDashboard.manageNote}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t.organizerDashboard.support}</span>
            </button>
            {activeTab === 'manage' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                title={t.dashboard.createInterview}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t.dashboard.createInterview}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs - removed separate Candidates tab, now accessed via interview cards */}
        {activeTab === 'students' && (
          <div className="mb-6">
            <button
              onClick={() => {
                setActiveTab('manage');
                setSelectedInterviewId(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <span>← {t.organizerDashboard.backToInterviews || 'Назад к интервью'}</span>
            </button>
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <InterviewForm
            onClose={() => setShowCreateForm(false)}
            onCreate={handleCreateSession}
          />
        )}

        {/* Edit Form Modal */}
        {editingSession && (
          <InterviewForm
            onClose={() => setEditingSession(null)}
            onCreate={handleCreateSession}
            editMode={true}
            interviewId={editingSession.id}
            initialData={editingSession.params}
            onUpdate={handleUpdateSession}
          />
        )}

        {showSupportModal && (
          <ITRequestModal onClose={() => setShowSupportModal(false)} />
        )}

        {showQRModal && selectedSessionForQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setShowQRModal(false); setSelectedSessionForQR(null); }}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.organizerDashboard.qrCodeTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.organizerDashboard.qrCodeDesc}</p>
              {qrCodeDataUrl && (
                <div className="flex justify-center mb-4">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
                </div>
              )}
              <p className="text-xs text-gray-500 mb-4">{t.organizerDashboard.qrCodePlacement}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}${selectedSessionForQR.shareUrl}`;
                    navigator.clipboard.writeText(url);
                    setCopiedId(selectedSessionForQR.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copiedId === selectedSessionForQR.id ? t.organizerDashboard.copied : t.organizerDashboard.copyLink}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowQRModal(false); setSelectedSessionForQR(null); }}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                >
                  {t.contact.close}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {/* Company filter */}
            {allUserSessions.length > 0 && uniqueCompanies.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ru' ? 'Фильтр по компании' : 'Filter by company'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    onFocus={() => setShowCompanyDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                    placeholder={language === 'ru' ? 'Начните вводить название компании...' : 'Start typing company name...'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {companyFilter && (
                    <button
                      onClick={() => setCompanyFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  {showCompanyDropdown && filteredCompanies.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company}
                          onClick={() => {
                            setCompanyFilter(company);
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                        >
                          {company}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'ru'
                    ? `Показано ${userSessions.length} из ${allUserSessions.length} интервью`
                    : `Showing ${userSessions.length} of ${allUserSessions.length} interviews`
                  }
                </p>
              </div>
            )}

            {userSessions.length === 0 && allUserSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">{t.organizerDashboard.createFirstInterview}</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {t.organizerDashboard.createFirstInterviewDesc}
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t.organizerDashboard.createButton}</span>
                </button>
              </div>
            ) : userSessions.length === 0 && allUserSessions.length > 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <p className="text-gray-600 mb-4">
                  {language === 'ru'
                    ? 'Не найдено интервью для выбранной компании'
                    : 'No interviews found for selected company'}
                </p>
                <button
                  onClick={() => setCompanyFilter('')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {language === 'ru' ? 'Сбросить фильтр' : 'Reset filter'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all relative">
                    {/* Edit button — overlapping top-right corner */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingSession(session); }}
                      className="absolute -top-2 -right-12 p-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-full transition-colors shadow-lg border-2 border-white z-10"
                      title={language === 'ru' ? 'Редактировать' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button — overlapping top-right corner of the card */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteInterview(session.id); }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors shadow-lg border-2 border-white z-10"
                      title={language === 'ru' ? 'Удалить' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Title + company + badges */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {session.params.position || session.params.topic || 'AI Интервью'}
                      </h3>
                      {session.params.company && (
                        <p className="text-base text-blue-600 font-bold mt-1">
                          {session.params.company}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {session.params.questions?.length || 0} {t.organizerDashboard.questions}
                        </span>
                        {session.params.customerSimulation?.enabled && (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                            {t.organizerDashboard.situationModeling}
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          {session.params.language === 'ru' ? t.organizerDashboard.russian : t.organizerDashboard.english}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons — horizontal row, equal width */}
                    <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleViewCandidates(session.id)}
                        className="flex-1 px-2 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-medium rounded-xl relative"
                        style={{ backgroundColor: '#059669', color: '#ffffff' }}
                      >
                        <Users className="w-4 h-4" style={{ color: '#ffffff' }} />
                        <span>{t.organizerDashboard.candidatesButton || 'Кандидаты'}</span>
                        {(() => {
                          const count = results.filter(r => r.sessionId === session.id).length;
                          return count > 0 ? (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                              {count}
                            </span>
                          ) : null;
                        })()}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSessionForLinks(session)}
                        className="flex-1 px-2 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-medium rounded-xl"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span>{language === 'ru' ? 'Создать ссылку' : 'Create link'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openQRModal(session)}
                        className="flex-1 px-2 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1 text-xs font-medium rounded-xl"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>{t.organizerDashboard.downloadQR}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <>
            {isLoadingResults ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.organizerDashboard.loadingCandidates}</h3>
                <p className="text-sm text-gray-600">{t.organizerDashboard.loadingCandidatesDesc}</p>
              </div>
            ) : (
              <CandidatesTab
                results={results}
                sessions={sessions}
                selectedInterviewId={selectedInterviewId}
                onViewEvaluation={onViewEvaluation}
                onClearSelection={() => setSelectedInterviewId(null)}
              />
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
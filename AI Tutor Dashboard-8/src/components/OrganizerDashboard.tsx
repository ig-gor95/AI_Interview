import { useState, useEffect, useCallback } from 'react';
import { Plus, Link as LinkIcon, Target, Copy, Check, BarChart3, Users, MessageSquare, HelpCircle, QrCode } from 'lucide-react';
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
}

export function OrganizerDashboard({ user, sessions, onRefresh, onViewEvaluation }: Props) {
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);
  const [activeTab, setActiveTab] = useState<'manage' | 'students'>('manage');
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  // Filter sessions and validate UUID format
  const userSessions = sessions.filter(s => {
    if (s.organizerId !== user.id) return false;
    // Validate UUID format to prevent errors with old mockData IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(s.id)) {
      console.warn(`Skipping session with invalid UUID format: ${s.id}`);
      return false;
    }
    return true;
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
  
  // Reload when switching to candidates tab
  useEffect(() => {
    if (activeTab === 'students') {
      loadResults();
      loadStatistics();
    }
  }, [activeTab]);
  
  const loadResults = async () => {
    try {
      setIsLoadingResults(true);
      console.log('[OrganizerDashboard] Loading candidates from API...');
      const candidatesResponse = await resultsAPI.getCandidates();
      console.log('[OrganizerDashboard] Received candidates:', candidatesResponse);
      const candidates = candidatesResponse.results || [];
      console.log(`[OrganizerDashboard] Setting ${candidates.length} candidates`);
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
    setSelectedInterviewId(interviewId);
    setActiveTab('students');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedSessionForLinks ? (
        <InterviewLinksManager 
          session={selectedSessionForLinks}
          onBack={() => setSelectedSessionForLinks(null)}
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
            {userSessions.length === 0 ? (
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
                          <div className="flex-1">
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.organizerDashboard.jobLabel}</span>
                              <h3 className="text-lg text-gray-900 mt-0.5">
                                {session.params.position || session.params.topic || 'AI Интервью'}
                              </h3>
                            </div>
                            {session.params.company && (
                              <p className="text-sm text-gray-600 mb-2">{session.params.company}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {session.params.questions?.length || 0} {t.organizerDashboard.questions}
                              </span>
                              {session.params.customerSimulation?.enabled && (
                                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                  {t.organizerDashboard.situationModeling}
                                </span>
                              )}
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                {session.params.language === 'ru' ? t.organizerDashboard.russian : t.organizerDashboard.english}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pl-13 space-y-2 text-sm">
                          {session.params.goals && session.params.goals.length > 0 && (
                            <div>
                              <span className="text-gray-600">{t.organizerDashboard.checkingLabel}: </span>
                              <span className="text-gray-900">{session.params.goals.join(', ')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">{t.organizerDashboard.createdLabel}: </span>
                            <span className="text-gray-900">
                              {new Date(session.createdAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <button
                          onClick={() => handleViewCandidates(session.id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          <Users className="w-4 h-4" />
                          <span>{t.organizerDashboard.candidatesButton || 'Кандидаты'}</span>
                        </button>
                        <button
                          onClick={() => setSelectedSessionForLinks(session)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>{t.organizerDashboard.uniqueLinks}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openQRModal(session)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>{t.organizerDashboard.downloadQR}</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(session.id, session.shareUrl)}
                          className="px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          {copiedId === session.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{t.organizerDashboard.copied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>{t.organizerDashboard.testLink}</span>
                            </>
                          )}
                        </button>
                      </div>
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
              />
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
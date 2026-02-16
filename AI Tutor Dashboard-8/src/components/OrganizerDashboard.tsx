import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Calendar, Clock, Target, Copy, Check, BarChart3, Users, MessageSquare, Video, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, SlidersHorizontal, Eye, Search, Download, Star, CheckCircle, XCircle, AlertCircle, Circle, MoreVertical, Mail, Phone, QrCode, X, Send, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import { Session, SessionParams, User } from '@/types';
import { saveSession, getResultsByOrganizerId } from '@/lib/mockData';
import { InterviewForm } from './InterviewForm';
import { CandidatesKanban } from './CandidatesKanban';
import { InterviewLinksManager } from './InterviewLinksManager';
import { getTopCandidatesPercentage, getOverallQuality, scoreToQualityRating } from '@/lib/qualityRating';
import QRCode from 'qrcode';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';

interface Props {
  user: User;
  sessions: Session[];
  onRefresh: () => void;
  onOpenSession: (sessionId: string) => void;
  onViewEvaluation?: (sessionId: string) => void;
  onViewCandidates?: (sessionId: string) => void;
  currentTab?: 'manage' | 'students';
  onTabChange?: (tab: 'manage' | 'students') => void;
}

export function OrganizerDashboard({ user, sessions, onRefresh, onOpenSession, onViewEvaluation, onViewCandidates, currentTab, onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState<'manage' | 'students'>(currentTab || 'manage');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [selectedSessionForLinks, setSelectedSessionForLinks] = useState<Session | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedSessionForQR, setSelectedSessionForQR] = useState<Session | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);
  
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
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);

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

  // Get unique companies for filter (case-insensitive deduplication)
  const uniqueCompanies = Array.from(
    allUserSessions
      .map(s => s.params.company)
      .filter((c): c is string => !!c && c.trim() !== '')
      .reduce((map, company) => {
        const key = company.toLowerCase();
        if (!map.has(key)) {
          map.set(key, company);
        }
        return map;
      }, new Map<string, string>())
      .values()
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // Get unique positions for filter (case-insensitive deduplication)
  const uniquePositions = Array.from(
    allUserSessions
      .map(s => s.params.position || s.params.topic)
      .filter((p): p is string => !!p && p.trim() !== '')
      .reduce((map, position) => {
        const key = position.toLowerCase();
        if (!map.has(key)) {
          map.set(key, position);
        }
        return map;
      }, new Map<string, string>())
      .values()
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // Filter companies by search input
  const filteredCompanies = uniqueCompanies.filter(company =>
    company.toLowerCase().includes(companyFilter.toLowerCase())
  );

  // Filter positions by search input
  const filteredPositions = uniquePositions.filter(position =>
    position.toLowerCase().includes(positionFilter.toLowerCase())
  );

  // Apply company and position filters to sessions
  const userSessions = allUserSessions.filter(s => {
    const companyMatch = !companyFilter || s.params.company?.toLowerCase().includes(companyFilter.toLowerCase());
    const positionMatch = !positionFilter || (s.params.position || s.params.topic)?.toLowerCase().includes(positionFilter.toLowerCase());
    return companyMatch && positionMatch;
  });

  const results = getResultsByOrganizerId(user.id);

  // Sync activeTab with currentTab when it changes externally
  useEffect(() => {
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

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

  const handleViewCandidates = (interviewId: string) => {
    if (onViewCandidates) {
      onViewCandidates(interviewId);
    } else {
      setSelectedInterviewId(interviewId);
      setActiveTab('students');
      onTabChange?.('students');
    }
  };

  const openQRModal = (session: Session) => {
    setSelectedSessionForQR(session);
    setShowQRModal(true);
    const url = `${window.location.origin}${session.shareUrl}`;
    QRCode.toDataURL(url, { width: 256, margin: 2 })
      .then(setQrCodeDataUrl)
      .catch(() => setQrCodeDataUrl(''));
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

  const generateQRCode = async (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    const qrCode = await QRCode.toDataURL(fullUrl);
    setQrCodeDataUrl(qrCode);
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
            <p className="text-2xl sm:text-3xl text-gray-900">{userSessions.length}</p>
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
            <p className="text-2xl sm:text-3xl text-gray-900">{results.length}</p>
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
            {results.length > 0 ? (() => {
              // Преобразуем старые баллы в качественную оценку
              const ratings = results.map(r => 
                r.qualityRating || (r.score ? scoreToQualityRating(r.score) : undefined)
              );
              const topCandidatesPercentage = getTopCandidatesPercentage(ratings);
              
              return (
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl text-gray-900">{topCandidatesPercentage}%</p>
                  <span className="text-sm text-gray-500">{t.organizerDashboard.candidatesLabel}</span>
                </div>
              );
            })() : (
              <p className="text-2xl sm:text-3xl text-gray-400">-</p>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl text-gray-900 mb-1">
              {activeTab === 'manage' 
                ? t.organizerDashboard.manageTitle
                : t.organizerDashboard.candidatesStatsTitle}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {activeTab === 'manage' 
                ? t.organizerDashboard.manageDesc
                : t.organizerDashboard.candidatesStatsDesc}
            </p>
            {activeTab === 'manage' && (
              <p className="text-xs text-gray-500 mt-1">
                {t.organizerDashboard.manageNote}
              </p>
            )}
          </div>
          {activeTab === 'manage' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t.organizerDashboard.createButton}</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('manage');
              onTabChange?.('manage');
            }}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.organizerDashboard.managementTab}</span>
            <span className="sm:hidden">{t.dashboard.myInterviews}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('students');
              onTabChange?.('students');
            }}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{t.organizerDashboard.candidatesTab}</span>
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
            {/* Filters Section */}
            {allUserSessions.length > 0 && (uniqueCompanies.length > 0 || uniquePositions.length > 0) && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company filter */}
                  {uniqueCompanies.length > 0 && (
                    <div>
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
                          placeholder={language === 'ru' ? 'Компания...' : 'Company...'}
                          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {companyFilter && (
                          <button
                            onClick={() => setCompanyFilter('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        )}
                        {showCompanyDropdown && filteredCompanies.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCompanies.map((company) => (
                              <button
                                key={company}
                                onClick={() => {
                                  setCompanyFilter(company);
                                  setShowCompanyDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                              >
                                {company}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Position filter */}
                  {uniquePositions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ru' ? 'Фильтр по вакансии' : 'Filter by position'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={positionFilter}
                          onChange={(e) => setPositionFilter(e.target.value)}
                          onFocus={() => setShowPositionDropdown(true)}
                          onBlur={() => setTimeout(() => setShowPositionDropdown(false), 200)}
                          placeholder={language === 'ru' ? 'Вакансия...' : 'Position...'}
                          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {positionFilter && (
                          <button
                            onClick={() => setPositionFilter('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        )}
                        {showPositionDropdown && filteredPositions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredPositions.map((position) => (
                              <button
                                key={position}
                                onClick={() => {
                                  setPositionFilter(position);
                                  setShowPositionDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                              >
                                {position}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear filters button */}
                {(companyFilter || positionFilter) && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => {
                        setCompanyFilter('');
                        setPositionFilter('');
                      }}
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {language === 'ru' ? 'Сбросить все' : 'Reset all'}
                    </button>
                  </div>
                )}
              </div>
            )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all relative">
                    {/* Buttons in TOP RIGHT corner */}
                    <div className="absolute flex gap-2 z-20" style={{ top: '12px', right: '12px' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); /* Edit functionality */ }}
                        className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors shadow-md"
                        title={language === 'ru' ? 'Редактировать' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(language === 'ru' ? 'Удалить это интервью?' : 'Delete this interview?')) { /* Delete logic */ } }}
                        className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors shadow-md"
                        title={language === 'ru' ? 'Удалить' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

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
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {t.organizerDashboard.createdLabel}: {new Date(session.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
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
                          const count = results.filter(r => r.interviewId === session.id).length;
                          return count > 0 ? (
                            <span className="absolute top-0 right-0 bg-red-400 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center border-2 border-white">
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
          <CandidatesKanban
            results={results}
            sessions={sessions}
            onViewEvaluation={onViewEvaluation}
          />
        )}

        {/* QR Modal */}
        {showQRModal && selectedSessionForQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
            <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.organizerDashboard.qrCodeTitle}</h3>
                  <p className="text-gray-600 mb-6">
                    {selectedSessionForQR.params.position || selectedSessionForQR.params.topic || 'AI Интервью'}
                  </p>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-4">
                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-full"
                  />
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>{t.organizerDashboard.interviewLink}</strong>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}${selectedSessionForQR.shareUrl}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedSessionForQR.id, selectedSessionForQR.shareUrl)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = 'qr-code.png';
                    link.href = qrCodeDataUrl;
                    link.click();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>{t.organizerDashboard.downloadQR}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span>{t.organizerDashboard.print}</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                {t.organizerDashboard.qrCodePlacement}
              </p>
            </div>
          </div>
        )}

        {/* Support Button */}
        <button
          onClick={() => setShowSupportModal(true)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3 z-40"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <div className="flex flex-col items-start">
          </div>
          <span className="font-medium text-sm sm:text-base">{t.organizerDashboard.support}</span>
        </button>

        {/* Support Modal */}
        {showSupportModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSupportModal(false)}
          >
            <div 
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {t.organizerDashboard.supportTitle}
                    </h3>
                  </div>
                  <div className="ml-15">
                    <p className="text-sm text-gray-500">
                      {t.organizerDashboard.supportSubtitle}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600">
                  {t.organizerDashboard.chooseContact}
                </p>

                <div className="space-y-3 mt-6">
                  <a
                    href="https://t.me/username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {t.organizerDashboard.telegram}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t.organizerDashboard.telegramDesc}
                        </p>
                      </div>
                    </div>
                  </a>

                  <a
                    href="tel:+79000000000"
                    className="block p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {t.organizerDashboard.callPhone}
                        </h4>
                        <p className="text-sm text-gray-600">+7 (900) 000-00-00</p>
                      </div>
                    </div>
                  </a>

                  <div className="p-4 border border-gray-300 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {t.organizerDashboard.leaveContact}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t.organizerDashboard.leaveContactDesc}
                        </p>
                      </div>
                    </div>

                    <form 
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        alert(t.organizerDashboard.thankYouMessage);
                        setShowSupportModal(false);
                      }}
                    >
                      <input
                        type="text"
                        placeholder={t.organizerDashboard.yourName}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      />
                      <input
                        type="tel"
                        placeholder={t.organizerDashboard.phone}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      />
                      <input
                        type="email"
                        placeholder={t.organizerDashboard.emailOptional}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      />
                      <textarea
                        placeholder={t.organizerDashboard.describeIssue}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm resize-none"
                      />
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{t.organizerDashboard.send}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Calendar, Clock, Target, Copy, Check, BarChart3, Users, MessageSquare, Video, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, SlidersHorizontal, Eye, Search, Download, Star, CheckCircle, XCircle, AlertCircle, Circle, MoreVertical, Mail, Phone, QrCode, X, Send, HelpCircle } from 'lucide-react';
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
  currentTab?: 'manage' | 'students';
  onTabChange?: (tab: 'manage' | 'students') => void;
}

export function OrganizerDashboard({ user, sessions, onRefresh, onOpenSession, onViewEvaluation, currentTab, onTabChange }: Props) {
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

  const userSessions = sessions.filter(s => s.organizerId === user.id);
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
                      <div className="flex-1 flex items-start gap-3">
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
                              {session.params.questions?.length || 0} {language === 'ru' ? 'вопросов' : 'questions'}
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

                          <div className="mt-3 space-y-2 text-sm">
                            {session.params.goals && session.params.goals.length > 0 && (
                              <div>
                                <span className="text-gray-600">{t.organizerDashboard.checkingLabel}: </span>
                                <span className="text-gray-900">{session.params.goals.join(', ')}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">{t.organizerDashboard.createdLabel}: </span>
                              <span className="text-gray-900">
                                {new Date(session.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenSession(session.id)}
                          className="px-4 py-2 border border-gray-300 text-gray-600 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 text-sm whitespace-nowrap self-center"
                        >
                          <Video className="w-4 h-4" />
                          <span>{t.organizerDashboard.testLabel}</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <button
                          onClick={() => setSelectedSessionForLinks(session)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>{t.organizerDashboard.uniqueLinks}</span>
                        </button>
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center gap-1 px-2">
                            <div className="h-px flex-1 bg-gray-200"></div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">{t.organizerDashboard.reusableLabel}</span>
                            <div className="h-px flex-1 bg-gray-200"></div>
                          </div>
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
                          <button
                            onClick={() => {
                              generateQRCode(session.shareUrl);
                              setSelectedSessionForQR(session);
                              setShowQRModal(true);
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>{language === 'ru' ? 'QR-код' : 'QR-code'}</span>
                          </button>
                        </div>
                      </div>
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
import { useState, useEffect, useRef } from 'react';
import { Plus, Link as LinkIcon, Target, Copy, Check, BarChart3, Users, MessageSquare, Video, ChevronDown, TrendingUp, TrendingDown, Search, Download, Mail, Phone, QrCode, X, Send, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import { Session, SessionParams, User } from '../types/index';
import { InterviewForm } from './InterviewForm';
import { InterviewLinksManager } from './InterviewLinksManager';
import { getTopCandidatesPercentage, scoreToQualityRating } from '../lib/qualityRating';
import QRCode from 'qrcode';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '../lib/i18n';
import { interviewsAPI } from '../lib/api';

interface Props {
  user: User;
  sessions: Session[];
  results: any[];
  onRefresh: () => void;
  onOpenSession: (sessionId: string) => void;
  onViewEvaluation?: (sessionId: string) => void;
  onViewCandidates?: (interviewId: string) => void;
  currentTab?: 'manage' | 'students';
  onTabChange?: (tab: 'manage' | 'students') => void;
}

export function OrganizerDashboard({ user, sessions, results, onRefresh, onOpenSession, onViewEvaluation, onViewCandidates }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrLinkCopied, setQrLinkCopied] = useState(false);
  const [selectedSessionForLinks, setSelectedSessionForLinks] = useState<Session | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrInterviewUrl, setQrInterviewUrl] = useState<string>('');
  const [selectedSessionForQR, setSelectedSessionForQR] = useState<Session | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [positionSearchQuery, setPositionSearchQuery] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);
  
  const positionDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  const userSessions = sessions.filter(s => s.organizerId === user.id);

  // Get unique positions and companies
  const positions = Array.from(new Set(userSessions.map(s => s.params.position || s.params.topic || 'AI Интервью'))).sort();
  const companies = Array.from(new Set(userSessions.map(s => s.params.company).filter(Boolean) as string[])).sort();

  // Filter sessions
  const filteredSessions = userSessions.filter(session => {
    const position = session.params.position || session.params.topic || 'AI Интервью';
    const company = session.params.company || '';
    
    const matchesPosition = selectedPositionFilter === 'all' || position === selectedPositionFilter;
    const matchesCompany = selectedCompanyFilter === 'all' || company === selectedCompanyFilter;
    
    return matchesPosition && matchesCompany;
  });

  // Filtered positions/companies for search
  const filteredPositions = positions.filter(p => 
    p.toLowerCase().includes(positionSearchQuery.toLowerCase())
  );
  
  const filteredCompanies = companies.filter(c => 
    c.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
        setShowPositionDropdown(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSession = async (params: SessionParams) => {
    try {
      console.log('Creating interview with params:', params);
      await interviewsAPI.createInterview({ params });
      setShowCreateForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating interview:', error);
      alert(language === 'ru' ? 'Ошибка при создании интервью' : 'Error creating interview');
    }
  };

  const handleUpdateSession = async (params: SessionParams) => {
    if (!sessionToEdit) return;

    try {
      console.log('Updating interview:', sessionToEdit.id, 'with params:', params);
      await interviewsAPI.updateInterview(sessionToEdit.id, { params });
      setSessionToEdit(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating interview:', error);
      alert(language === 'ru' ? 'Ошибка при обновлении интервью' : 'Error updating interview');
    }
  };

  const handleEditClick = async (session: Session) => {
    try {
      setIsLoadingEdit(true);
      console.log('Loading full interview data for edit:', session.id);
      const fullInterview = await interviewsAPI.getInterview(session.id);

      console.log('=== EDIT DEBUG ===');
      console.log('Full interview response from API:', fullInterview);
      console.log('fullInterview.params:', fullInterview.params);
      console.log('==================');

      // Transform to Session format with full params
      const sessionWithFullData: Session = {
        ...session,
        params: fullInterview.params
      };

      console.log('Session with full data to be set:', sessionWithFullData);
      setSessionToEdit(sessionWithFullData);
    } catch (error) {
      console.error('Error loading interview for edit:', error);
      alert(language === 'ru' ? 'Ошибка при загрузке данных интервью' : 'Error loading interview data');
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    const confirmMessage = language === 'ru'
      ? `Вы уверены что хотите удалить интервью "${sessionToDelete.params.position || sessionToDelete.params.topic}"?`
      : `Are you sure you want to delete interview "${sessionToDelete.params.position || sessionToDelete.params.topic}"?`;

    if (!confirm(confirmMessage)) {
      setSessionToDelete(null);
      return;
    }

    try {
      console.log('Deleting interview:', sessionToDelete.id);
      await interviewsAPI.deleteInterview(sessionToDelete.id);
      setSessionToDelete(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting interview:', error);
      alert(language === 'ru' ? 'Ошибка при удалении интервью' : 'Error deleting interview');
    }
  };

  const copyToClipboard = (sessionId: string, url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateQRCode = async (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    const qrCode = await QRCode.toDataURL(fullUrl);
    setQrCodeDataUrl(qrCode);
  };

  // Get selected position/company display names
  const selectedPositionName = selectedPositionFilter === 'all' 
    ? (language === 'ru' ? 'Все вакансии' : 'All Positions')
    : selectedPositionFilter;
    
  const selectedCompanyName = selectedCompanyFilter === 'all'
    ? (language === 'ru' ? 'Все компании' : 'All Companies')
    : selectedCompanyFilter;

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

        {/* Header with Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl text-gray-900 mb-1">
                {t.organizerDashboard.manageTitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {t.organizerDashboard.manageDesc}
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t.organizerDashboard.createButton}</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Position Filter */}
            <div className="relative" ref={positionDropdownRef}>
              <button
                onClick={() => {
                  setShowPositionDropdown(!showPositionDropdown);
                  setShowCompanyDropdown(false);
                }}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 truncate">{selectedPositionName}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showPositionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPositionDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={language === 'ru' ? 'Поиск вакансии...' : 'Search position...'}
                        value={positionSearchQuery}
                        onChange={(e) => setPositionSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedPositionFilter('all');
                        setShowPositionDropdown(false);
                        setPositionSearchQuery('');
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                        selectedPositionFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {language === 'ru' ? 'Все вакансии' : 'All Positions'}
                    </button>
                    {filteredPositions.map(position => (
                      <button
                        key={position}
                        onClick={() => {
                          setSelectedPositionFilter(position);
                          setShowPositionDropdown(false);
                          setPositionSearchQuery('');
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                          selectedPositionFilter === position ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {position}
                      </button>
                    ))}
                    {filteredPositions.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        {language === 'ru' ? 'Вакансии не найдены' : 'No positions found'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Company Filter */}
            <div className="relative" ref={companyDropdownRef}>
              <button
                onClick={() => {
                  setShowCompanyDropdown(!showCompanyDropdown);
                  setShowPositionDropdown(false);
                }}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 truncate">{selectedCompanyName}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCompanyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={language === 'ru' ? 'Поиск компании...' : 'Search company...'}
                        value={companySearchQuery}
                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCompanyFilter('all');
                        setShowCompanyDropdown(false);
                        setCompanySearchQuery('');
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                        selectedCompanyFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {language === 'ru' ? 'Все компании' : 'All Companies'}
                    </button>
                    {companies.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        {language === 'ru' ? 'Компании не указаны в интервью' : 'No companies specified in interviews'}
                      </div>
                    ) : (
                      <>
                        {filteredCompanies.map(company => (
                          <button
                            key={company}
                            onClick={() => {
                              setSelectedCompanyFilter(company);
                              setShowCompanyDropdown(false);
                              setCompanySearchQuery('');
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                              selectedCompanyFilter === company ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {company}
                          </button>
                        ))}
                        {filteredCompanies.length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            {language === 'ru' ? 'Компании не найдены' : 'No companies found'}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {(selectedPositionFilter !== 'all' || selectedCompanyFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedPositionFilter('all');
                  setSelectedCompanyFilter('all');
                }}
                className="px-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                <span>{language === 'ru' ? 'Сбросить' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <InterviewForm 
            onClose={() => setShowCreateForm(false)}
            onCreate={handleCreateSession}
          />
        )}

        {/* Edit Form Modal */}
        {sessionToEdit && (
          <InterviewForm
            editMode={true}
            interviewId={sessionToEdit.id}
            onClose={() => setSessionToEdit(null)}
            onCreate={handleUpdateSession}
            initialData={sessionToEdit.params}
          />
        )}

        {/* Content */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                {userSessions.length === 0 
                  ? t.organizerDashboard.createFirstInterview
                  : (language === 'ru' ? 'Интервью не найдены' : 'No interviews found')
                }
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {userSessions.length === 0 
                  ? t.organizerDashboard.createFirstInterviewDesc
                  : (language === 'ru' ? 'Попробуйте изменить фильтры' : 'Try changing the filters')
                }
              </p>
              {userSessions.length === 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t.organizerDashboard.createButton}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filteredSessions.map((session) => {
                const position = session.params.position || session.params.topic || 'AI Интервью';
                // Use candidatesCount from session if available (from API), otherwise count from results
                // Note: session here is Interview template, so we need to filter by interviewId (not sessionId)
                const candidatesCountFromAPI = (session as any).candidatesCount;
                const candidatesCountFromResults = results.filter(r => (r as any).interviewId === session.id).length;
                const candidatesCount = candidatesCountFromAPI ?? candidatesCountFromResults;

                console.log('=== Interview Debug ===');
                console.log('Interview ID:', session.id);
                console.log('Interview position:', position);
                console.log('API count:', candidatesCountFromAPI);
                console.log('Results count:', candidatesCountFromResults);
                console.log('Final count:', candidatesCount);
                console.log('All results array:', results);
                console.log('Filtered results:', results.filter(r => (r as any).interviewId === session.id));
                console.log('========================');
                
                return (
                  <div key={session.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                    {/* Header Section */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t.organizerDashboard.jobLabel}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{position}</h3>
                        {session.params.company && (
                          <p className="text-sm text-gray-600 truncate">{session.params.company}</p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium inline-flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {session.params.questions?.length || 0} {language === 'ru' ? 'вопросов' : 'questions'}
                      </span>
                      {session.params.customerSimulation?.enabled && (
                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {t.organizerDashboard.situationModeling}
                        </span>
                      )}
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {session.params.language === 'ru' ? t.organizerDashboard.russian : t.organizerDashboard.english}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm mb-4 flex-1">
                      {session.params.goals && session.params.goals.length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 flex-shrink-0">{t.organizerDashboard.checkingLabel}:</span>
                          <span className="text-gray-900 font-medium">{session.params.goals.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex gap-2 items-center text-gray-500">
                        <span className="flex-shrink-0">{t.organizerDashboard.createdLabel}:</span>
                        <span className="text-gray-700">
                          {new Date(session.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      {/* Primary Actions - Top Row */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedSessionForLinks(session)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>{t.organizerDashboard.uniqueLinks}</span>
                        </button>

                        <button
                          onClick={() => candidatesCount > 0 && onViewCandidates && onViewCandidates(session.id)}
                          disabled={candidatesCount === 0}
                          style={candidatesCount > 0 ? {
                            background: 'linear-gradient(to right, rgb(22, 163, 74), rgb(5, 150, 105))'
                          } : undefined}
                          className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${
                            candidatesCount > 0
                              ? 'text-white hover:shadow-lg hover:scale-[1.02]'
                              : 'bg-gray-200 text-gray-600 cursor-not-allowed border border-gray-300'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>{language === 'ru' ? 'Кандидаты' : 'Candidates'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            candidatesCount > 0 ? 'bg-white/20' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {candidatesCount}
                          </span>
                        </button>
                      </div>

                      {/* Secondary Actions - Bottom Row */}
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            // Create test link via API and open in new window
                            try {
                              const link = await interviewsAPI.createLink(session.id, false);
                              window.open(`${window.location.origin}${link.url}?test=true`, '_blank');
                            } catch (error) {
                              console.error('Error creating test link:', error);
                              alert(language === 'ru' ? 'Ошибка создания ссылки' : 'Error creating link');
                            }
                          }}
                          className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 text-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span className="hidden sm:inline">{t.organizerDashboard.testLabel}</span>
                        </button>

                        <button
                          onClick={async () => {
                            // Create reusable QR link via API
                            try {
                              const link = await interviewsAPI.createLink(session.id, true);
                              await generateQRCode(link.url);
                              setQrInterviewUrl(link.url);
                              setSelectedSessionForQR(session);
                              setShowQRModal(true);
                            } catch (error) {
                              console.error('Error creating QR link:', error);
                              alert(language === 'ru' ? 'Ошибка создания QR-кода' : 'Error creating QR code');
                            }
                          }}
                          className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 text-sm"
                        >
                          <QrCode className="w-4 h-4" />
                          <span className="hidden sm:inline">{language === 'ru' ? 'QR-код' : 'QR-code'}</span>
                        </button>

                        <button
                          onClick={() => handleEditClick(session)}
                          disabled={isLoadingEdit}
                          className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{isLoadingEdit ? (language === 'ru' ? 'Загрузка...' : 'Loading...') : (language === 'ru' ? 'Редактировать' : 'Edit')}</span>
                        </button>

                        <button
                          onClick={() => setSessionToDelete(session)}
                          className="flex-1 px-3 py-2.5 border border-red-300 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 hover:border-red-400 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{language === 'ru' ? 'Удалить' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {sessionToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSessionToDelete(null)}>
            <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'ru' ? 'Удалить интервью?' : 'Delete Interview?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'ru' 
                  ? `Вы действительно хотите удалить интервью "${sessionToDelete.params.position || sessionToDelete.params.topic}"? Это действие нельзя отменить.`
                  : `Are you sure you want to delete the interview "${sessionToDelete.params.position || sessionToDelete.params.topic}"? This action cannot be undone.`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSessionToDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteSession}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {language === 'ru' ? 'Удалить' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
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
                    value={`${window.location.origin}${qrInterviewUrl}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      const fullUrl = `${window.location.origin}${qrInterviewUrl}`;
                      navigator.clipboard.writeText(fullUrl);
                      setQrLinkCopied(true);
                      setTimeout(() => setQrLinkCopied(false), 2000);
                    }}
                    className={`px-4 py-2 border rounded-lg transition-all flex items-center gap-2 ${
                      qrLinkCopied
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {qrLinkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">{language === 'ru' ? 'Скопировано!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">{language === 'ru' ? 'Копировать' : 'Copy'}</span>
                      </>
                    )}
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
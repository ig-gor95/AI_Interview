import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { User, Session } from '@/types';
import { getCurrentUser, login as authLogin, logout as authLogout, signup as authSignup, refreshCurrentUser } from './lib/auth';
import { getSessions, getSessionById } from './lib/mockData';
import { publicAPI, interviewsAPI, resultsAPI } from './lib/api';
import { Landing } from './components/Landing';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SessionView } from './components/SessionView';
import { InterviewSessionView } from './components/InterviewSessionView';
import { CandidateEvaluationWrapper } from './components/CandidateEvaluationWrapper';
import { EvaluationDemo } from './components/EvaluationDemo';
import { CandidateRegistration } from './components/CandidateRegistration';
import { InterviewCandidatesPage } from './components/InterviewCandidatesPage';
import { ThankYouPage } from './components/ThankYouPage';
import { JotaiProvider } from './components/JotaiProvider';

// User context wrapper
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Add loading state for auth check
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount and validate token
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Validate token by fetching current user from API
      refreshCurrentUser()
        .then((validUser) => {
          if (validUser) {
            setUser(validUser);
            if (validUser.role === 'organizer') {
              loadInterviews();
            } else {
              // For students, still use mockData for now
              setSessions(getSessions());
            }
          }
        })
        .catch((error) => {
          // Token is invalid or expired, clear everything
          console.log('Token validation failed, logging out', error);
          authLogout();
          setUser(null);
        })
        .finally(() => {
          setIsCheckingAuth(false); // Auth check complete
        });
    } else {
      setIsCheckingAuth(false); // No user in localStorage, auth check complete
    }
  }, []);

  // Handle unauthorized events (401 errors during app usage)
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event received, logging out');
      setUser(null);
      navigate('/');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const loadInterviews = async () => {
    try {
      setIsLoadingSessions(true);
      // Use lightweight summary endpoint for dashboard
      const interviews = await interviewsAPI.getInterviewsSummary();
      console.log('Loaded interviews summary from API:', interviews);

      if (!interviews || interviews.length === 0) {
        console.log('No interviews found in database. Using empty array.');
        setSessions([]);
        return;
      }

      // Get current user from localStorage
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found, cannot set organizerId');
        setSessions([]);
        return;
      }

      // Transform summary to Session format for compatibility
      const transformedSessions = interviews.map((interview: any) => {
        const sessionId = interview.id;
        console.log('Processing interview with ID:', sessionId, 'Type:', typeof sessionId);
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
          console.warn(`Skipping interview with invalid UUID format: ${sessionId}`);
          return null;
        }
        return {
          id: sessionId,
          organizerId: currentUser.id, // Set from current user since API already filters by organizer
          organizerName: currentUser.name,
          params: {
            position: interview.position,
            company: interview.company,
            questions: [], // Not loaded in summary
            must_have_requirements: [], // Not loaded in summary
            nice_to_have_requirements: [], // Not loaded in summary
          },
          createdAt: interview.created_at,
          shareUrl: interview.share_url,
          candidatesCount: interview.candidates_count // Add candidates count
        };
      }).filter((s: any) => s !== null); // Remove null entries

      console.log('Transformed sessions:', transformedSessions);
      setSessions(transformedSessions);

      // Load results for organizer
      await loadResults();
    } catch (error) {
      console.error('Ошибка при загрузке интервью:', error);
      // Don't fallback to mockData - set empty array instead
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadResults = async () => {
    try {
      setIsLoadingResults(true);
      const candidatesData = await resultsAPI.getCandidates();
      console.log('Loaded results from API:', candidatesData);

      if (!candidatesData || !candidatesData.results) {
        console.log('No results found in database.');
        setResults([]);
        return;
      }

      // Transform results to match expected format
      const transformedResults = candidatesData.results.map((result: any) => ({
        id: result.id || result.sessionId,
        sessionId: result.sessionId,
        studentName: result.candidateName,
        studentEmail: result.candidateEmail,
        score: result.score,
        qualityRating: result.qualityRating,
        completedAt: result.completedAt,
        transcript: result.transcript || [],
        requirementChecks: result.requirementChecks || []
      }));

      console.log('Transformed results:', transformedResults);
      setResults(transformedResults);
    } catch (error) {
      console.error('Ошибка при загрузке результатов:', error);
      setResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const loggedUser = await authLogin(email, password);
      setUser(loggedUser);
      if (loggedUser.role === 'organizer') {
        await loadInterviews();
      } else {
        setSessions(getSessions());
      }
      navigate('/dashboard');
    } catch (error) {
      throw error; // Re-throw to let LoginForm handle it
    }
  };

  const handleSignup = async (email: string, name: string, password: string, role: 'organizer' | 'student') => {
    try {
      const newUser = await authSignup(email, name, password, role);
      setUser(newUser);
      if (newUser.role === 'organizer') {
        await loadInterviews();
      } else {
        setSessions(getSessions());
      }
      navigate('/dashboard');
    } catch (error) {
      throw error; // Re-throw to let LoginForm handle it
    }
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    navigate('/');
  };

  const refreshSessions = () => {
    if (user?.role === 'organizer') {
      loadInterviews();
    } else {
      setSessions(getSessions());
    }
  };

  const handleSessionComplete = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isCheckingAuth) {
      // Show loading spinner while checking authentication
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  // Landing Page Component
  const LandingPage = () => {
    return (
      <Landing
        onNavigate={(view) => {
          if (view === 'login-organizer') navigate('/login/organizer');
          else if (view === 'login-student') navigate('/login/student');
          else if (view === 'evaluation-demo') navigate('/evaluation-demo');
        }}
        onNavigateWithTab={(view, tab) => {
          if (view === 'evaluation-demo') navigate(`/evaluation-demo?tab=${tab}`);
        }}
      />
    );
  };

  // Login Pages
  const LoginOrganizerPage = () => (
    <LoginForm
      role="organizer"
      onLogin={handleLogin}
      onSignup={(email, name, password) => handleSignup(email, name, password, 'organizer')}
      onBack={() => navigate('/')}
    />
  );

  const LoginStudentPage = () => (
    <LoginForm
      role="student"
      onLogin={handleLogin}
      onSignup={(email, name, password) => handleSignup(email, name, password, 'student')}
      onBack={() => navigate('/')}
    />
  );

  // Dashboard Page Component
  const DashboardPage = () => {
    if (!user) return <Navigate to="/" replace />;

    return user.role === 'organizer' ? (
      <OrganizerDashboard
        user={user}
        sessions={sessions}
        results={results}
        onRefresh={refreshSessions}
        onViewEvaluation={(sessionId) => navigate(`/evaluation/${sessionId}`)}
        onViewCandidates={(interviewId) => navigate(`/interview/${interviewId}/candidates`)}
      />
    ) : (
      <StudentDashboard
        user={user}
        onOpenSession={(sessionId) => navigate(`/session/${sessionId}`)}
      />
    );
  };

  // Session Page Component
  const SessionPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const session = sessionId ? getSessionById(sessionId) : null;

    if (!sessionId || !session) {
      return <Navigate to={user ? '/dashboard' : '/'} replace />;
    }

    return (
      <SessionView
        session={session}
        onComplete={handleSessionComplete}
        onBack={() => navigate(user ? '/dashboard' : '/')}
      />
    );
  };

  // Evaluation Page Component - sessionId is the concrete candidate session ID from /evaluation/:sessionId
  const EvaluationPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const session = sessionId ? getSessionById(sessionId) ?? null : null;

    if (!sessionId) {
      return <Navigate to={user ? '/dashboard' : '/'} replace />;
    }

    return (
      <CandidateEvaluationWrapper
        sessionId={sessionId}
        session={session}
        user={user}
        onComplete={handleSessionComplete}
        onBack={() => navigate(user ? '/dashboard' : '/')}
      />
    );
  };

  // Evaluation Demo Page - tab from query: ?tab=mass | ?tab=it
  const EvaluationDemoPage = () => {
    const [searchParams] = useSearchParams();
    const tab = (searchParams.get('tab') === 'it' ? 'it' : 'mass') as 'mass' | 'it';
    return <EvaluationDemo evaluationTab={tab} onBack={() => navigate('/')} />;
  };

  // Interview Registration Page (public)
  const InterviewRegistrationPage = () => {
    return <CandidateRegistration />;
  };

  // Interview Session Page (public)
  const InterviewSessionPage = () => {
    return <InterviewSessionView />;
  };

  // Header wrapper component to check location
  const HeaderWrapper = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    
    const shouldShowHeader = () => {
      return location.pathname.startsWith('/dashboard') || 
             location.pathname.startsWith('/session/') || 
             location.pathname.startsWith('/evaluation/') ||
             /^\/interview\/[^/]+\/candidates$/.test(location.pathname);
    };

    return (
      <div className="min-h-screen">
        {user && shouldShowHeader() && (
          <Header user={user} onLogout={handleLogout} />
        )}
        {children}
      </div>
    );
  };

  return (
    <HeaderWrapper>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/organizer" element={<LoginOrganizerPage />} />
        <Route path="/login/student" element={<LoginStudentPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/session/:sessionId" 
          element={<SessionPage />} 
        />
        <Route 
          path="/evaluation/:sessionId" 
          element={<EvaluationPage />} 
        />
        <Route path="/evaluation-demo" element={<EvaluationDemoPage />} />
        <Route path="/interview/:token" element={<InterviewRegistrationPage />} />
        <Route path="/interview/:token/session" element={<InterviewSessionPage />} />
        <Route path="/interview/:token/results" element={<ThankYouPage />} />
        <Route
          path="/interview/:interviewId/candidates"
          element={
            <ProtectedRoute>
              <InterviewCandidatesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HeaderWrapper>
  );
}

export default function App() {
  return (
    <JotaiProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </JotaiProvider>
  );
}
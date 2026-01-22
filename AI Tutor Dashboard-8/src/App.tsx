import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { User, Session } from '@/types';
import { getCurrentUser, login as authLogin, logout as authLogout, signup as authSignup } from './lib/auth';
import { getSessions, getSessionById } from './lib/mockData';
import { publicAPI, interviewsAPI } from './lib/api';
import { Landing } from './components/Landing';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SessionView } from './components/SessionView';
import { InterviewSessionView } from './components/InterviewSessionView';
import { CandidateEvaluation } from './components/CandidateEvaluation';
import { EvaluationDemo } from './components/EvaluationDemo';
import { CandidateRegistration } from './components/CandidateRegistration';
import { JotaiProvider } from './components/JotaiProvider';

// User context wrapper
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.role === 'organizer') {
        loadInterviews();
      } else {
        // For students, still use mockData for now
        setSessions(getSessions());
      }
    }
  }, []);

  const loadInterviews = async () => {
    try {
      setIsLoadingSessions(true);
      const interviews = await interviewsAPI.getInterviews();
      console.log('Loaded interviews from API:', interviews);
      
      if (!interviews || interviews.length === 0) {
        console.log('No interviews found in database. Using empty array.');
        setSessions([]);
        return;
      }
      
      // Transform interviews to Session format for compatibility
      // Handle both camelCase (from API) and snake_case responses
      const transformedSessions = interviews.map((interview: any) => {
        const sessionId = interview.id || interview.id;
        console.log('Processing interview with ID:', sessionId, 'Type:', typeof sessionId);
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
          console.warn(`Skipping interview with invalid UUID format: ${sessionId}`);
          return null;
        }
        return {
          id: sessionId,
          organizerId: interview.organizerId || interview.organizer_id,
          organizerName: interview.organizerName || interview.organizer_name,
          params: interview.params,
          createdAt: interview.createdAt || interview.created_at,
          shareUrl: interview.shareUrl || interview.share_url
        };
      }).filter((s: any) => s !== null); // Remove null entries
      
      console.log('Transformed sessions:', transformedSessions);
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Ошибка при загрузке интервью:', error);
      // Don't fallback to mockData - set empty array instead
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
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
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  // Landing Page Component
  const LandingPage = () => {
    return <Landing onNavigate={(view) => {
      if (view === 'login-organizer') navigate('/login/organizer');
      else if (view === 'login-student') navigate('/login/student');
      else if (view === 'evaluation-demo') navigate('/evaluation-demo');
    }} />;
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
        onRefresh={refreshSessions}
        onViewEvaluation={(sessionId) => navigate(`/evaluation/${sessionId}`)}
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

  // Evaluation Page Component
  const EvaluationPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const session = sessionId ? getSessionById(sessionId) : null;

    if (!sessionId || !session) {
      return <Navigate to={user ? '/dashboard' : '/'} replace />;
    }

    return (
      <CandidateEvaluation
        session={session}
        user={user}
        onComplete={handleSessionComplete}
        onBack={() => navigate(user ? '/dashboard' : '/')}
      />
    );
  };

  // Evaluation Demo Page
  const EvaluationDemoPage = () => (
    <EvaluationDemo onBack={() => navigate('/')} />
  );

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
             location.pathname.startsWith('/evaluation/');
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
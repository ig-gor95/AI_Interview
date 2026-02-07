import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser, login as authLogin, logout as authLogout, signup as authSignup } from './lib/mockAuth';
import { getSessions, getSessionById } from './lib/mockData';
import { Landing } from './components/Landing';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SessionView } from './components/SessionView';
import { CandidateEvaluation } from './components/CandidateEvaluation';
import { EvaluationDemo } from './components/EvaluationDemo';
import { CandidateEvaluationReportDemo } from './components/CandidateEvaluationReportDemo';
import { CandidatesKanbanDemo } from './components/CandidatesKanbanDemo';
import { JotaiProvider } from './components/JotaiProvider';

// v7-NO-SCORES-FINAL: Using new CandidateEvaluationReport_v2 without score displays
type View = 'landing' | 'login-organizer' | 'login-student' | 'dashboard' | 'session' | 'evaluation' | 'evaluation-demo' | 'candidate-report-demo' | 'candidates-kanban-demo';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState(getSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [evaluationTab, setEvaluationTab] = useState<'mass' | 'it'>('mass');
  const [dashboardTab, setDashboardTab] = useState<'manage' | 'students'>('manage');

  useEffect(() => {
    const path = window.location.pathname;
    const sessionMatch = path.match(/\/session\/(.+)/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      const session = getSessionById(sessionId);
      if (session) {
        setCurrentSessionId(sessionId);
        setCurrentView('session');
      }
    } else if (path === '/candidate-report-demo') {
      setCurrentView('candidate-report-demo');
    } else if (path === '/candidates-kanban-demo') {
      setCurrentView('candidates-kanban-demo');
    }
  }, []);

  const handleQuickLogin = (role: 'organizer' | 'student') => {
    const mockUser: User = {
      id: role === 'organizer' ? '1' : Date.now().toString(),
      email: role + '@example.com',
      name: role === 'organizer' ? 'Organizer User' : 'Student User',
      role
    };
    setUser(mockUser);
    setCurrentView('dashboard');
  };

  const handleLogin = (email: string, password: string) => {
    const loggedUser = authLogin(email, password);
    if (loggedUser) {
      setUser(loggedUser);
      setCurrentView('dashboard');
    } else {
      alert('User not found. Please sign up.');
    }
  };

  const handleSignup = (email: string, name: string, password: string, role: 'organizer' | 'student') => {
    try {
      const newUser = authSignup(email, name, role);
      setUser(newUser);
      setCurrentView('dashboard');
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setCurrentView('landing');
  };

  const refreshSessions = () => {
    setSessions(getSessions());
  };

  const handleSessionComplete = () => {
    if (user) {
      setCurrentView('dashboard');
      setCurrentSessionId(null);
    } else {
      setCurrentView('landing');
      setCurrentSessionId(null);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <Landing 
          onNavigate={(view) => {
            setCurrentView(view);
          }}
          onNavigateWithTab={(view, tab) => {
            setEvaluationTab(tab);
            setCurrentView(view);
          }}
        />;

      case 'login-organizer':
        return (
          <LoginForm
            role="organizer"
            onLogin={() => handleQuickLogin('organizer')}
            onSignup={() => handleQuickLogin('organizer')}
            onBack={() => setCurrentView('landing')}
          />
        );

      case 'login-student':
        return (
          <LoginForm
            role="student"
            onLogin={() => handleQuickLogin('student')}
            onSignup={() => handleQuickLogin('student')}
            onBack={() => setCurrentView('landing')}
          />
        );

      case 'dashboard':
        if (!user) {
          return <Landing 
            onNavigate={(view) => {
              setCurrentView(view);
            }}
            onNavigateWithTab={(view, tab) => {
              setEvaluationTab(tab);
              setCurrentView(view);
            }}
          />;
        }
        
        return user.role === 'organizer' ? (
          <OrganizerDashboard 
            user={user} 
            sessions={sessions}
            onRefresh={() => setSessions(getSessions())}
            onOpenSession={(sessionId) => {
              setCurrentSessionId(sessionId);
              setCurrentView('session');
            }}
            onViewEvaluation={(sessionId) => {
              setCurrentSessionId(sessionId);
              setDashboardTab('students');
              setCurrentView('evaluation');
            }}
            currentTab={dashboardTab}
            onTabChange={(tab) => setDashboardTab(tab)}
          />
        ) : (
          <StudentDashboard 
            user={user}
            onOpenSession={(sessionId) => {
              setCurrentSessionId(sessionId);
              setCurrentView('session');
            }}
          />
        );

      case 'session':
        if (!currentSessionId) {
          setCurrentView('landing');
          return null;
        }
        const session = getSessionById(currentSessionId);
        if (!session) {
          setCurrentView('landing');
          return null;
        }
        return (
          <SessionView
            session={session}
            onComplete={handleSessionComplete}
            onBack={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setCurrentView('landing');
              }
            }}
          />
        );

      case 'evaluation':
        if (!currentSessionId) {
          setCurrentView('landing');
          return null;
        }
        const evaluationSession = getSessionById(currentSessionId);
        if (!evaluationSession) {
          setCurrentView('landing');
          return null;
        }
        return (
          <CandidateEvaluation
            session={evaluationSession}
            user={user}
            onComplete={handleSessionComplete}
            onBack={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setCurrentView('landing');
              }
            }}
          />
        );

      case 'evaluation-demo':
        return (
          <EvaluationDemo
            evaluationTab={evaluationTab}
            onBack={() => setCurrentView('landing')}
          />
        );

      case 'candidate-report-demo':
        return <CandidateEvaluationReportDemo />;

      case 'candidates-kanban-demo':
        return <CandidatesKanbanDemo />;

      default:
        return <Landing 
          onNavigate={(view) => {
            setCurrentView(view);
          }}
          onNavigateWithTab={(view, tab) => {
            setEvaluationTab(tab);
            setCurrentView(view);
          }}
        />; 
    }
  };

  return (
    <JotaiProvider>
      <div className="min-h-screen">
        {user && (currentView === 'dashboard' || currentView === 'evaluation') && (
          <Header user={user} onLogout={handleLogout} />
        )}
        {renderView()}
      </div>
    </JotaiProvider>
  );
}
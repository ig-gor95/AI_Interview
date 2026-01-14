export type UserRole = 'organizer' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionParams {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  language: 'ru' | 'en';
  goals: string[];
  personality: 'friendly' | 'professional' | 'motivating';
  roleContext?: string;
  contextDescription?: string;
  evaluationCriteria?: string[];
  expectedKnowledge?: string;
  interactionStyle?: 'questions' | 'practice' | 'theory' | 'mixed';
  focusAreas?: string[];
  additionalInstructions?: string;
  
  // Новые поля для HR-интервью
  position?: string; // Название вакансии
  company?: string; // Название компании
  requirements?: string[]; // Ключевые требования к кандидату
  interviewType?: 'screening' | 'technical' | 'behavioral' | 'mixed'; // Тип интервью
  passingScore?: number; // Минимальный проходной балл
  
  // Вопросы для кандидата
  questions?: string[]; // Список вопросов для интервью
  
  // Симуляция общения с клиентами
  customerSimulation?: {
    enabled: boolean; // Включена ли симуляция
    scenario: string; // Описание сценария
    role: string; // Роль клиента (недовольный, агрессивный, нейтральный и т.д.)
  };
}

export interface Session {
  id: string;
  organizerId: string;
  organizerName: string;
  params: SessionParams;
  createdAt: string;
  shareUrl: string;
}

export interface SessionResult {
  id: string;
  sessionId: string;
  studentId?: string;
  studentName?: string;
  startedAt: string;
  completedAt?: string;
  transcript: Array<{
    role: 'ai' | 'user';
    message: string;
    timestamp: string;
  }>;
  summary?: string;
  score?: number;
}
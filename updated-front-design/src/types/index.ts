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
  mustHaveRequirements?: string[]; // Обязательные требования
  niceToHaveRequirements?: string[]; // Желательные требования
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
  
  // Уточняющие вопросы
  clarifyingQuestions?: {
    enabled: boolean; // Может ли робот задавать уточняющие вопросы
    example?: string; // Пример уточняющего вопроса
  };
  
  // Свободные вопросы от робота
  allowDynamicQuestions?: boolean; // Робот может задавать вопросы на свое усмотрение
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
  studentEmail?: string | null;
  startedAt: string;
  completedAt?: string;
  transcript: Array<{
    role: 'ai' | 'user';
    message: string;
    timestamp: string;
  }>;
  summary?: string;
  score?: number; // Legacy, deprecated
  qualityRating?: 'outstanding' | 'strong' | 'promising' | 'suitable';
  audioUrl?: string; // URL to audio recording of the interview
}

export interface InterviewLink {
  id: string;
  sessionId: string;
  url: string;
  createdAt: string;
  usedAt?: string;
  candidateName?: string;
  candidateEmail?: string;
  isUsed: boolean;
  notes?: string;
}
export type UserRole = 'organizer' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Базовый вопрос с дочерними вопросами
export interface Question {
  text: string;
  clarifyingQuestions?: string[]; // Дочерние вопросы для уточнения
}

// Параметры сессии (только поля из формы)
export interface SessionParams {
  // Информация о вакансии
  position: string; // Название вакансии (обязательное)
  company?: string; // Название компании (опциональное)
  topic?: string; // Тема (опциональное, для обратной совместимости со старым кодом)
  
  // Базовые вопросы для первичного отбора
  questions: Question[]; // Вопросы с возможностью уточняющих вопросов (обязательное)
  
  // Дополнительные вопросы на усмотрение робота
  allowDynamicQuestions?: boolean; // Робот может задавать дополнительные вопросы
  
  // Моделирование реальной рабочей ситуации
  customerSimulation?: {
    enabled: boolean;
    role?: string; // Роль клиента
    scenario?: string; // Описание сценария
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
}

export interface InterviewLink {
  id: string;
  interviewId: string; // ID шаблона интервью
  token: string;
  url: string;
  createdAt: string;
  expiresAt?: string | null;
  sessionId?: string | null; // ID сессии после регистрации
  usedAt?: string;
  candidateName?: string;
  candidateEmail?: string;
  isUsed: boolean;
  notes?: string;
}
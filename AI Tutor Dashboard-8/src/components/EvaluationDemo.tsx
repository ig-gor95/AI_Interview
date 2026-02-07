import { CandidateEvaluation } from './CandidateEvaluation';
import { ITTechnicalEvaluation } from './ITTechnicalEvaluation';
import { Session, SessionResult } from '../types';

interface Props {
  evaluationTab?: 'mass' | 'it';
  onBack: () => void;
}

export function EvaluationDemo({ evaluationTab = 'mass', onBack }: Props) {
  const mockSessionMass: Session = {
    id: 'demo-eval-mass',
    organizerId: '1',
    organizerName: 'HR Manager',
    params: {
      position: 'Официант',
      company: 'Ресторан',
      topic: 'Интервью для официанта',
      questions: [
        { text: 'Расскажите о вашем опыте работы в сфере обслуживания' },
        { text: 'Как вы справляетесь со стрессовыми ситуациями?' },
        { text: 'Приведите пример конфликтной ситуации с клиентом' },
        { text: 'Почему вы хотите работать официантом?' }
      ]
    },
    createdAt: new Date('2026-01-15').toISOString(),
    shareUrl: '/session/demo-eval-mass'
  };

  const mockResultMass: SessionResult = {
    id: 'result-demo-mass',
    sessionId: 'demo-eval-mass',
    studentId: '101',
    studentName: 'Анна Иванова',
    startedAt: new Date('2026-01-15T10:00:00').toISOString(),
    completedAt: new Date('2026-01-15T10:08:42').toISOString(),
    score: 78,
    qualityRating: 'strong',
    transcript: [
      { role: 'ai', message: 'Здравствуйте! Я ваш AI-интервьюер. Расскажите о вашем опыте работы в сфере обслуживания.', timestamp: new Date('2026-01-15T10:00:10').toISOString() },
      { role: 'user', message: 'Здравствуйте! Я работала официанткой в кафе около года. Там я научилась общаться с разными типами посетителей и справляться с высокой нагрузкой.', timestamp: new Date('2026-01-15T10:00:35').toISOString() },
      { role: 'ai', message: 'Отлично! Приведите пример конфликтной ситуации с клиентом и как вы ее разрешили.', timestamp: new Date('2026-01-15T10:00:50').toISOString() },
      { role: 'user', message: 'Однажды гость был недоволен задержкой заказа. Я извинилась, предложила комплиментарный напиток и проверила статус на кухне. В итоге он успокоился и даже оставил хорошие чаевые.', timestamp: new Date('2026-01-15T10:01:25').toISOString() }
    ]
  };

  const mockSessionIT: Session = {
    id: 'demo-eval-it',
    organizerId: '1',
    organizerName: 'CTO',
    params: {
      position: 'Senior Go Developer',
      company: 'IT',
      topic: 'Технический скрининг',
      questions: [
        { text: 'Как работает планировщик Go (Scheduler) и что такое G-M-P модель?' },
        { text: 'В чем разница между Buffered и Unbuffered каналами?' },
        { text: 'Как спроектировать систему лайков для 1M RPS?' },
        { text: 'Когда возникает race condition и как ее предотвратить?' },
        { text: 'Как оптимизировать запросы к PostgreSQL?' }
      ]
    },
    createdAt: new Date('2026-02-01').toISOString(),
    shareUrl: '/session/demo-eval-it'
  };

  const mockResultIT: SessionResult = {
    id: 'result-demo-it',
    sessionId: 'demo-eval-it',
    studentId: '201',
    studentName: 'Алексей Волков',
    startedAt: new Date('2026-02-01T14:00:00').toISOString(),
    completedAt: new Date('2026-02-01T15:15:00').toISOString(),
    score: 85,
    qualityRating: 'outstanding',
    transcript: [
      { role: 'ai', message: 'Здравствуйте! Я проведу техническое интервью. Давайте начнем с вопроса по Go Runtime. Как работает планировщик Go и что такое G-M-P модель?', timestamp: new Date('2026-02-01T14:00:00').toISOString() },
      { role: 'user', message: 'G-M-P модель состоит из трех компонентов: Goroutines (G) - легковесные потоки, Machine threads (M) - системные потоки ОС, и Processors (P) - логические процессоры, которые связывают G и M. Планировщик использует work-stealing алгоритм.', timestamp: new Date('2026-02-01T14:01:15').toISOString() },
      { role: 'ai', message: 'Отличный ответ! Теперь по каналам: в чем разница между Buffered и Unbuffered каналами в плане аллокации памяти?', timestamp: new Date('2026-02-01T14:01:30').toISOString() },
      { role: 'user', message: 'Unbuffered каналы требуют синхронной передачи - отправитель блокируется до получения. Buffered каналы выделяют память под буфер заранее при создании.', timestamp: new Date('2026-02-01T14:02:20').toISOString() },
      { role: 'ai', message: 'Теперь симуляция реального Code Review. Я Senior в команде и предлагаю: "Зачем нам здесь простая SQL база? Давай переложим все в MongoDB".', timestamp: new Date('2026-02-01T14:06:00').toISOString() },
      { role: 'user', message: 'Не соглашусь. У нас строго реляционные данные и критична ACID-транзакционность. Я бы остался на PostgreSQL и настроил партиционирование.', timestamp: new Date('2026-02-01T14:07:10').toISOString() }
    ]
  };

  if (evaluationTab === 'it') {
    return (
      <ITTechnicalEvaluation
        session={mockSessionIT}
        result={mockResultIT}
        onBack={onBack}
      />
    );
  }

  return (
    <CandidateEvaluation
      sessionId="demo-eval-mass"
      session={mockSessionMass}
      user={null}
      mockResult={mockResultMass}
      onComplete={onBack}
      onBack={onBack}
    />
  );
}

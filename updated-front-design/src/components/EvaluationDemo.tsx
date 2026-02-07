import { CandidateEvaluation } from './CandidateEvaluation';
import { ITTechnicalEvaluation } from './ITTechnicalEvaluation';
import { Session, SessionResult } from '../types';

interface Props {
  evaluationTab: 'mass' | 'it';
  onBack: () => void;
}

export function EvaluationDemo({ evaluationTab, onBack }: Props) {
  // Mock session data for Mass Hiring
  const mockSessionMass: Session = {
    id: 'demo-eval-mass',
    organizerId: '1',
    organizerName: 'HR Manager',
    params: {
      topic: 'Интервью для официанта',
      position: 'Официант',
      difficulty: 'beginner',
      duration: 15,
      language: 'ru',
      personality: 'professional',
      questions: [
        'Расскажите о вашем опыте работы в сфере обслуживания',
        'Как вы справляетесь со стрессовыми ситуациями?',
        'Приведите пример конфликтной ситуации с клиентом',
        'Почему вы хотите работать официантом?'
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
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Mock audio URL
    transcript: [
      {
        role: 'ai',
        message: 'Здравствуйте! Я ваш AI-интервьюер. Расскажите о вашем опыте работы в сфере обслуживания.',
        timestamp: new Date('2026-01-15T10:00:10').toISOString()
      },
      {
        role: 'user',
        message: 'Здравствуйте! Я работала официанткой в кафе около года. Там я научилась общаться с разными типами посетителей и справляться с высокой нагрузкой.',
        timestamp: new Date('2026-01-15T10:00:35').toISOString()
      },
      {
        role: 'ai',
        message: 'Отлично! Приведите пример конфликтной ситуации с клиентом и как вы ее разрешили.',
        timestamp: new Date('2026-01-15T10:00:50').toISOString()
      },
      {
        role: 'user',
        message: 'Однажды гость был недоволен задержкой заказа. Я извинилась, предложила комплиментарный напиток и проверила статус на кухне. В итоге он успокоился и даже оставил хорошие чаевые.',
        timestamp: new Date('2026-01-15T10:01:25').toISOString()
      }
    ]
  };

  // Mock session data for IT Technical Screening
  const mockSessionIT: Session = {
    id: 'demo-eval-it',
    organizerId: '1',
    organizerName: 'CTO',
    params: {
      topic: 'Технический скрининг',
      position: 'Senior Go Developer',
      difficulty: 'advanced',
      duration: 75,
      language: 'ru',
      personality: 'professional',
      questions: [
        'Как работает планировщик Go (Scheduler) и что такое G-M-P модель?',
        'В чем разница между Buffered и Unbuffered каналами?',
        'Как спроектировать систему лайков для 1M RPS?',
        'Когда возникает race condition и как ее предотвратить?',
        'Как оптимизировать запросы к PostgreSQL?'
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
      {
        role: 'ai',
        message: 'Здравствуйте! Я проведу техническое интервью. Давайте начнем с вопроса по Go Runtime. Как работает планировщик Go и что такое G-M-P модель?',
        timestamp: new Date('2026-02-01T14:00:00').toISOString()
      },
      {
        role: 'user',
        message: 'G-M-P модель состоит из трех компонентов: Goroutines (G) - легковесные потоки, Machine threads (M) - системные потоки ОС, и Processors (P) - логические процессоры, которые связывают G и M. Планировщик использует work-stealing алгоритм: когда процессор простаивает, он может забрать задачи из очереди другого процессора. Это обеспечивает эффективное распределение нагрузки.',
        timestamp: new Date('2026-02-01T14:01:15').toISOString()
      },
      {
        role: 'ai',
        message: 'Отличный ответ! Теперь по каналам: в чем разница между Buffered и Unbuffered каналами в плане аллокации памяти?',
        timestamp: new Date('2026-02-01T14:01:30').toISOString()
      },
      {
        role: 'user',
        message: 'Unbuffered каналы требуют синхронной передачи - отправитель блокируется до получения, память выделяется только на descriptor. Buffered каналы выделяют память под буфер заранее при создании, блокировка происходит только при заполнении. Важный момент - данные копируются, а не передаются по ссылке, что безопасно для конкурентности.',
        timestamp: new Date('2026-02-01T14:02:20').toISOString()
      },
      {
        role: 'ai',
        message: 'Превосходно! Теперь системный дизайн. Как бы вы спроектировали систему лайков для сервиса с 1 млн запросов в секунду?',
        timestamp: new Date('2026-02-01T14:02:35').toISOString()
      },
      {
        role: 'user',
        message: 'Я бы использовал схему с кешированием в Redis для счетчиков лайков и асинхронной записью в основную БД через Kafka. Стратегия Write-behind снижает нагрузку на базу. Важно обеспечить идемпотентность обработчиков для устранения дубликатов. Для еще большей нагрузки можно добавить шардирование Redis по user_id или post_id.',
        timestamp: new Date('2026-02-01T14:04:05').toISOString()
      },
      {
        role: 'ai',
        message: 'Отличное системное мышление! Давайте проверим понимание конкурентности. Опишите ситуацию с race condition в Go и способы решения.',
        timestamp: new Date('2026-02-01T14:04:20').toISOString()
      },
      {
        role: 'user',
        message: 'Классический пример - конкурентный доступ к map из нескольких горутин. Map в Go не thread-safe. Решения: sync.Mutex для эксклюзивного доступа, sync.RWMutex когда чтений много, sync.Map для read-heavy workloads, или использовать каналы для передачи данных между горутинами - "share memory by communicating".',
        timestamp: new Date('2026-02-01T14:05:30').toISOString()
      },
      {
        role: 'ai',
        message: 'Теперь симуляция реального Code Review. Я Senior в команде и предлагаю: "Зачем нам здесь простая SQL база? Давай переложим все в MongoDB, это быстрее и модно. Схемы не нужны".',
        timestamp: new Date('2026-02-01T14:06:00').toISOString()
      },
      {
        role: 'user',
        message: 'Не соглашусь. У нас строго реляционные данные и критична ACID-транзакционность. Переход на NoSQL принесет больше проблем с консистентностью, чем выгоды в скорости. Я бы остался на PostgreSQL и настроил партиционирование для масштабирования. Давайте сначала профилируем и оптимизируем запросы, а не меняем фундамент архитектуры без метрик.',
        timestamp: new Date('2026-02-01T14:07:10').toISOString()
      },
      {
        role: 'ai',
        message: 'Но нам нужно горизонтально масштабироваться! MongoDB это делает из коробки.',
        timestamp: new Date('2026-02-01T14:07:20').toISOString()
      },
      {
        role: 'user',
        message: 'Масштабируемость важна, но не ценой потери гарантий. PostgreSQL с правильными индексами и connection pooling справится с нашим load на ближайшие 2 года. Если понадобится шардинг - есть расширения типа Citus. Переход на другую БД - это weeks of migration, риски и tech debt. Нужен solid business case.',
        timestamp: new Date('2026-02-01T14:08:15').toISOString()
      }
    ]
  };

  // Рендерим разные компоненты в зависимости от типа
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
      session={mockSessionMass}
      user={null}
      mockResult={mockResultMass}
      onComplete={onBack}
      onBack={onBack}
    />
  );
}
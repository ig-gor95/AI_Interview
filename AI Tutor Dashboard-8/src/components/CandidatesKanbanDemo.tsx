import { useState } from 'react';
import { CandidatesKanban } from './CandidatesKanban';
import { CandidateEvaluationReport_v2 } from './CandidateEvaluationReport_v2';
import { Session } from '@/types';

export function CandidatesKanbanDemo() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Mock results data with requirement checks for each candidate
  const mockResults = [
    // RECOMMENDED
    {
      id: '1',
      studentName: 'Иван Петров',
      sessionId: 'session-1',
      score: 85,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '6 лет опыта (требовалось 5+)', status: 'met' as const },
        { requirement: 'Django', fact: 'активное использование 6 лет', status: 'met' as const },
        { requirement: 'FastAPI', fact: '3 года в production', status: 'met' as const },
        { requirement: 'Английский', fact: 'B2 уровень', status: 'met' as const },
      ]
    },
    {
      id: '2',
      studentName: 'Мария Смирнова',
      sessionId: 'session-2',
      score: 92,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '8 лет опыта (требовалось 5+)', status: 'met' as const },
        { requirement: 'Django', fact: '7 лет, архитектурный опыт', status: 'met' as const },
        { requirement: 'FastAPI', fact: '4 года, микросервисы', status: 'met' as const },
        { requirement: 'Английский', fact: 'C1 уровень, свободно', status: 'met' as const },
      ]
    },
    {
      id: '3',
      studentName: 'Александр Козлов',
      sessionId: 'session-3',
      score: 81,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '5 лет опыта', status: 'met' as const },
        { requirement: 'Django', fact: '5 лет коммерческий опыт', status: 'met' as const },
        { requirement: 'FastAPI', fact: '2 года, знание основ', status: 'met' as const },
        { requirement: 'Английский', fact: 'B2 уровень', status: 'met' as const },
      ]
    },

    // POSSIBLE
    {
      id: '4',
      studentName: 'Анна Сидорова',
      sessionId: 'session-4',
      score: 68,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '4 года опыта (требовалось 5+)', status: 'partial' as const },
        { requirement: 'Django', fact: 'базовые знания, pet-проекты', status: 'partial' as const },
        { requirement: 'FastAPI', fact: '1 год опыта', status: 'partial' as const },
        { requirement: 'Английский', fact: 'B1 уровень (требуется B2)', status: 'partial' as const },
      ]
    },
    {
      id: '5',
      studentName: 'Дмитрий Новиков',
      sessionId: 'session-5',
      score: 72,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '5 лет опыта', status: 'met' as const },
        { requirement: 'Django', fact: 'не знает (обязательное требование)', status: 'not_met' as const },
        { requirement: 'FastAPI', fact: '3 года активного использования', status: 'met' as const },
        { requirement: 'Английский', fact: 'B1 уровень (требуется B2)', status: 'partial' as const },
      ]
    },
    {
      id: '6',
      studentName: 'Елена Волкова',
      sessionId: 'session-6',
      score: 65,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '3 года опыта (требовалось 5+)', status: 'partial' as const },
        { requirement: 'Django', fact: 'знакома, но нет опыта', status: 'partial' as const },
        { requirement: 'FastAPI', fact: 'базовые знания', status: 'partial' as const },
        { requirement: 'Английский', fact: 'A2 уровень (требуется B2)', status: 'not_met' as const },
      ]
    },
    {
      id: '7',
      studentName: 'Сергей Морозов',
      sessionId: 'session-7',
      score: 70,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '4 года опыта (требовалось 5+)', status: 'partial' as const },
        { requirement: 'Django', fact: '2 года коммерческого опыта', status: 'partial' as const },
        { requirement: 'FastAPI', fact: '1 год, только начал изучать', status: 'partial' as const },
        { requirement: 'Английский', fact: 'B2 уровень', status: 'met' as const },
      ]
    },

    // NOT RECOMMENDED
    {
      id: '8',
      studentName: 'Петр Иванов',
      sessionId: 'session-8',
      score: 42,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '1 год опыта (требовалось 5+)', status: 'not_met' as const },
        { requirement: 'Django', fact: 'не знает (обязательное требование)', status: 'not_met' as const },
        { requirement: 'FastAPI', fact: 'не знает', status: 'not_met' as const },
        { requirement: 'Английский', fact: 'A1 уровень (требуется B2)', status: 'not_met' as const },
      ]
    },
    {
      id: '9',
      studentName: 'Ольга Кузнецова',
      sessionId: 'session-9',
      score: 38,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '6 месяцев опыта (требовалось 5+)', status: 'not_met' as const },
        { requirement: 'Django', fact: 'не знает', status: 'not_met' as const },
        { requirement: 'FastAPI', fact: 'не знает', status: 'not_met' as const },
        { requirement: 'Английский', fact: 'A2 уровень (требуется B2)', status: 'not_met' as const },
      ]
    },
    {
      id: '10',
      studentName: 'Владимир Соколов',
      sessionId: 'session-10',
      score: 51,
      completedAt: new Date().toISOString(),
      transcript: [],
      requirementChecks: [
        { requirement: 'Python', fact: '2 года опыта (требовалось 5+)', status: 'not_met' as const },
        { requirement: 'Django', fact: 'базовые знания, нет практики', status: 'not_met' as const },
        { requirement: 'FastAPI', fact: 'не знает', status: 'not_met' as const },
        { requirement: 'Английский', fact: 'B1 уровень (требуется B2)', status: 'partial' as const },
      ]
    },
  ];

  const mockSessions: Session[] = [];

  // Mock detailed data for selected candidate
  const getMockCandidateDetails = (sessionId: string) => {
    const result = mockResults.find(r => r.sessionId === sessionId);
    if (!result) return null;

    const verdict = result.score >= 75 ? 'recommended' : result.score >= 50 ? 'possible' : 'not_recommended';

    // Use requirementChecks from result if available, otherwise create defaults
    const requirementChecks = result.requirementChecks || (
      verdict === 'recommended' ? [
        { requirement: 'Python', fact: '6 лет опыта (требовалось 5+)', status: 'met' as const },
        { requirement: 'Django', fact: 'активное использование 6 лет', status: 'met' as const },
        { requirement: 'FastAPI', fact: '3 года в production', status: 'met' as const },
        { requirement: 'Английский', fact: 'B2 уровень', status: 'met' as const },
      ] : verdict === 'possible' ? [
        { requirement: 'Python', fact: '4 года опыта (требовалось 5+)', status: 'partial' as const },
        { requirement: 'Django', fact: 'не знает (обязательное требование)', status: 'not_met' as const },
        { requirement: 'FastAPI', fact: 'базовые знания, нет опыта', status: 'partial' as const },
        { requirement: 'Английский', fact: 'A2 уровень', status: 'partial' as const },
      ] : [
        { requirement: 'Python', fact: '1 год опыта (требовалось 5+)', status: 'not_met' as const },
        { requirement: 'Django', fact: 'не знает (обязательное требование)', status: 'not_met' as const },
        { requirement: 'FastAPI', fact: 'не знает', status: 'not_met' as const },
        { requirement: 'Английский', fact: 'A1 уровень', status: 'not_met' as const },
      ]
    );

    return {
      candidateName: result.studentName,
      role: 'Senior Python Developer',
      overallScore: result.score / 10,
      verdict: verdict,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      
      // NEW FORMAT: Specific requirement checks with facts
      requirementChecks: requirementChecks,

      // NEW: Follow-up questions (empty for recommended, specific for others)
      followUpQuestions: verdict === 'recommended' ? [] : verdict === 'possible' ? [
        'Готовы ли пройти интенсивный курс по Django за 2 недели?',
        'Опишите опыт работы с асинхронным Python кодом',
      ] : undefined,

      // OLD FORMAT: Keep for backwards compatibility
      meetsRequirements: verdict === 'recommended' ? [
        'Опыт работы в Python более 5 лет',
        'Отличные навыки работы с Django и FastAPI',
        'Опыт работы в Agile командах',
        'Готовность к гибридному формату работы'
      ] : verdict === 'possible' ? [
        'Базовые навыки Python',
        'Готовность к обучению'
      ] : [
        'Базовые технические навыки'
      ],
      concernsOrMissing: verdict === 'recommended' ? [
        'Ожидания по зарплате выше бюджета на 15%',
      ] : verdict === 'possible' ? [
        'Недостаточный опыт с требуемым стеком',
        'Необходимо дополнительное обучение',
      ] : [
        'Недостаточный опыт работы',
        'Слабые навыки коммуникации',
        'Не соответствует большинству требований'
      ],
      
      recommendation: verdict === 'recommended'
        ? 'Кандидат демонстрирует сильные технические навыки и опыт, соответствующие требованиям позиции. Рекомендуется пригласить на финальное интервью с техническим директором. Возможно обсуждение компенсационного пакета.'
        : verdict === 'possible'
        ? 'Кандидат показывает базовые компетенции, но требуется дополнительная оценка. Рекомендуется провести техническое интервью для проверки практических навыков.'
        : 'Кандидат не соответствует ключевым требованиям позиции. Рекомендуется рассмотреть другие кандидатуры или предложить junior позицию.',
      practicalInfo: {
        startDate: 'Готов с 1 марта',
        salary: 'Ожидания: 250-280 тыс. ₽',
        location: 'Москва, гибрид'
      },
      criteria: [
        {
          name: 'Технические навыки',
          score: result.score / 10 + 0.5,
          maxScore: 10,
          requirementsMet: verdict === 'recommended' ? 4 : verdict === 'possible' ? 2 : 0,
          totalRequirements: 4,
          specificFacts: verdict === 'recommended' 
            ? ['Python: 6 лет, Django: 6 лет, FastAPI: 3 года', 'Опыт с PostgreSQL, Redis, RabbitMQ', 'Знание SOLID, DDD, микросервисов']
            : verdict === 'possible'
            ? ['Python: 4 года, Django: не знает', 'Базовый опыт с PostgreSQL', 'Минимальные знания архитектуры']
            : ['Python: 1 год, Django: нет', 'Нет опыта с БД в production']
        },
        {
          name: 'Опыт работы',
          score: result.score / 10 - 0.3,
          maxScore: 10,
          requirementsMet: verdict === 'recommended' ? 3 : verdict === 'possible' ? 1 : 0,
          totalRequirements: 3,
          specificFacts: verdict === 'recommended'
            ? ['6 лет в продуктовых компаниях', '3 года тимлид-опыта', 'Управлял командами до 8 человек']
            : verdict === 'possible'
            ? ['4 года опыта, в основном аутсорс', 'Нет опыта управления']
            : ['1 год опыта, фриланс проекты']
        },
        {
          name: 'Коммуникация',
          score: result.score / 10 + 0.2,
          maxScore: 10,
          specificFacts: verdict === 'recommended'
            ? ['Чёткая речь, структурированные ответы', 'Английский B2, опыт работы с зарубежными клиентами', 'Отличные soft skills']
            : verdict === 'possible'
            ? ['Базовая коммуникация', 'Английский A2, требуется развитие']
            : ['Слабая артикуляция', 'Английский A1']
        },
        {
          name: 'Культурный фит',
          score: result.score / 10 - 0.1,
          maxScore: 10,
          specificFacts: verdict === 'recommended'
            ? ['Ценности совпадают с компанией', 'Командный игрок с проактивным подходом', 'Готов к менторству juniors']
            : verdict === 'possible'
            ? ['Ценности частично совпадают', 'Требуется оценка в команде']
            : ['Индивидуальный подход, не командный']
        }
      ],
      transcript: [
        { timestamp: '00:00', speaker: 'AI' as const, text: 'Здравствуйте! Расскажите о вашем опыте с Python.' },
        { timestamp: '00:15', speaker: 'Candidate' as const, text: 'Здравствуйте! Я работаю с Python уже 6 лет. Начинал с веб-разработки на Django, последние 3 года активно использую FastAPI для создания микросервисов.' },
        { timestamp: '00:45', speaker: 'AI' as const, text: 'Отлично! Расскажите о самом сложном проекте, который вы реализовали.' },
        { timestamp: '01:00', speaker: 'Candidate' as const, text: 'Самым сложным был проект по миграции монолитного приложения на микросервисную архитектуру. Было около 15 сервисов, которые нужно было правильно декомпозировать и обеспечить их взаимодействие.' },
        { timestamp: '01:30', speaker: 'AI' as const, text: 'Как вы справлялись с проблемами производительности?' },
        { timestamp: '01:45', speaker: 'Candidate' as const, text: 'Использовали Redis для кэширования, оптимизировали SQL-запросы, добавили индексы. Также внедрили профилирование через cProfile для поиска узких мест.' },
      ],
      simulation: {
        situation: 'Клиент агрессивно требует срочный фикс бага в production. Задача — сохранить спокойствие и предложить решение.',
        dialog: [
          { role: 'ai' as const, tone: 'aggressive' as const, message: 'У нас production сломался! Клиенты не могут оплатить заказы! Это катастрофа!' },
          { role: 'candidate' as const, message: 'Понимаю критичность ситуации. Сейчас проверю логи и определю причину. Можете описать, что именно не работает?' },
          { role: 'ai' as const, tone: 'aggressive' as const, message: 'Все платежи падают с ошибкй 500! Мы теряем деньги каждую минуту!' },
          { role: 'candidate' as const, message: 'Уже вижу проблему в логах - issue с payment gateway. Откачу последний деплой и сразу сообщу. Параллельно поднимаю инцидент.' },
          { role: 'ai' as const, tone: 'calm' as const, message: 'Хорошо, действуйте. Как быстро можно решить?' },
          { role: 'candidate' as const, message: 'Rollback займёт 2-3 минуты. После восстановления разберём root cause и сделаем hotfix.' },
        ],
        summary: [
          { type: 'positive' as const, text: 'Сохранил спокойствие под давлением' },
          { type: 'positive' as const, text: 'Быстро предложил план действий' },
          { type: 'positive' as const, text: 'Проактивный подход к решению' },
        ]
      }
    };
  };

  const selectedCandidate = selectedSessionId ? getMockCandidateDetails(selectedSessionId) : null;

  // Debug: log candidate data
  if (selectedCandidate) {
    console.log('🔍 Selected candidate:', selectedSessionId, selectedCandidate.candidateName);
    console.log('📋 Requirement checks:', selectedCandidate.requirementChecks);
    console.log('❓ Follow-up questions:', selectedCandidate.followUpQuestions);
  }

  if (selectedCandidate) {
    return (
      <CandidateEvaluationReport_v2
        {...selectedCandidate}
        onBack={() => setSelectedSessionId(null)}
      />
    );
  }

  return (
    <CandidatesKanban
      results={mockResults}
      sessions={mockSessions}
      onViewEvaluation={setSelectedSessionId}
    />
  );
}
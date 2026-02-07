import { useState, useEffect } from 'react';
import { Session, User, SessionResult } from '@/types';
import { ChatScreen } from './ChatScreen';
import { ResultsScreen } from './ResultsScreen';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/i18n';
import { CandidateEvaluationReport_v2 } from './CandidateEvaluationReport_v2';
import { getResultsByOrganizerId } from '@/lib/mockData';
import { scoreToQualityRating } from '@/lib/qualityRating';

interface Props {
  session: Session;
  user: User | null;
  onComplete: () => void;
  onBack: () => void;
  mockResult?: SessionResult; // Опциональный mock для demo
}

export function CandidateEvaluation({ session, user, onComplete, onBack, mockResult }: Props) {
  const [language] = useAtom(languageAtom);
  
  const results = user ? getResultsByOrganizerId(user.id) : [];
  const result = mockResult || results.find(r => r.sessionId === session.id) || results[0];

  // Конвертация в числовой рейтинг 0-10
  const qualityRating = result?.qualityRating || (result?.score ? scoreToQualityRating(result.score) : 'suitable');
  const overallScore = {
    outstanding: 9.2,
    strong: 7.8,
    promising: 6.5,
    suitable: 4.5
  }[qualityRating] || 5.0;

  // Определение вердикта на основе рейтинга
  const verdict: 'recommended' | 'possible' | 'not_recommended' = 
    overallScore >= 8 ? 'recommended' : 
    overallScore >= 6 ? 'possible' : 
    'not_recommended';

  // Извлечение данных из результата
  const candidateName = result?.studentName || 'Кандидат';
  const role = session?.params?.position || session?.params?.topic || 'AI Интервью';
  
  // NEW FORMAT: Generate requirement checks with facts
  const requirementChecks = verdict === 'recommended' ? [
    { 
      requirement: language === 'ru' ? 'Опыт работы' : 'Work experience', 
      fact: language === 'ru' ? 'есть релевантный опыт в аналогичной должности' : 'has relevant experience in similar position', 
      status: 'met' as const 
    },
    { 
      requirement: language === 'ru' ? 'Коммуникативные навыки' : 'Communication skills', 
      fact: language === 'ru' ? 'хорошие навыки общения и презентации' : 'good communication and presentation skills', 
      status: 'met' as const 
    },
    { 
      requirement: language === 'ru' ? 'Готовность к работе' : 'Readiness to work', 
      fact: language === 'ru' ? 'готов начать работу в указанные сроки' : 'ready to start on time', 
      status: 'met' as const 
    },
    { 
      requirement: language === 'ru' ? 'Культурный фит' : 'Cultural fit', 
      fact: language === 'ru' ? 'соответствует культуре компании' : 'fits company culture', 
      status: 'met' as const 
    },
  ] : verdict === 'possible' ? [
    { 
      requirement: language === 'ru' ? 'Опыт работы' : 'Work experience', 
      fact: language === 'ru' ? 'базовый опыт, но недостаточный' : 'basic but insufficient experience', 
      status: 'partial' as const 
    },
    { 
      requirement: language === 'ru' ? 'Коммуникативные навыки' : 'Communication skills', 
      fact: language === 'ru' ? 'требуется развитие' : 'needs development', 
      status: 'partial' as const 
    },
    { 
      requirement: language === 'ru' ? 'Профессиональные навыки' : 'Professional skills', 
      fact: language === 'ru' ? 'необходимо дополнительное обучение' : 'additional training required', 
      status: 'not_met' as const 
    },
  ] : [
    { 
      requirement: language === 'ru' ? 'Опыт работы' : 'Work experience', 
      fact: language === 'ru' ? 'недостаточный опыт' : 'insufficient experience', 
      status: 'not_met' as const 
    },
    { 
      requirement: language === 'ru' ? 'Профессиональные навыки' : 'Professional skills', 
      fact: language === 'ru' ? 'слабые ответы на ключевые вопросы' : 'weak answers to key questions', 
      status: 'not_met' as const 
    },
    { 
      requirement: language === 'ru' ? 'Готовность к обучению' : 'Willingness to learn', 
      fact: language === 'ru' ? 'требуется дополнительная оценка' : 'requires additional assessment', 
      status: 'not_met' as const 
    },
  ];

  // NEW: Follow-up questions
  const followUpQuestions = verdict === 'recommended' ? [] : verdict === 'possible' ? [
    language === 'ru' ? 'Готовы ли пройти дополнительное обучение?' : 'Are you ready for additional training?',
    language === 'ru' ? 'Опишите свой опыт работы более детально' : 'Describe your work experience in more detail',
  ] : undefined;
  
  // Подготовка данных для отчета
  const meetsRequirements = overallScore >= 7 ? [
    language === 'ru' ? 'Опыт работы в аналогичной должности' : 'Experience in a similar position',
    language === 'ru' ? 'Хорошие коммуникативные навыки' : 'Good communication skills',
    language === 'ru' ? 'Готовность начать работу в указанные сроки' : 'Ready to start work on time',
    language === 'ru' ? 'Соответствует культуре компании' : 'Fits company culture'
  ] : [
    language === 'ru' ? 'Базовые коммуникативные навыки' : 'Basic communication skills',
    language === 'ru' ? 'Готовность к обучению' : 'Willingness to learn'
  ];

  const concernsOrMissing = overallScore >= 7 ? [
    language === 'ru' ? 'Требуется проверка профессиональных навыков' : 'Professional skills need verification',
  ] : [
    language === 'ru' ? 'Недостаточный опыт работы' : 'Insufficient work experience',
    language === 'ru' ? 'Необходимо дополнительное обучение' : 'Additional training required',
    language === 'ru' ? 'Слабые ответы на ключевые вопросы' : 'Weak answers to key questions'
  ];

  const recommendation = verdict === 'recommended'
    ? (language === 'ru' 
      ? 'Кандидат демонстрирует сильные навыки и опыт, соответствующий требованиям позиции. Рекомендуется пригласить на следующий этап отбора для более детальной оценки профессиональных компетенций.'
      : 'The candidate demonstrates strong skills and experience matching the position requirements. Recommended to invite to the next stage for more detailed assessment of professional competencies.')
    : verdict === 'possible'
    ? (language === 'ru'
      ? 'Кандидат показывает базовые компетенции, но требуется дополнительная оценка. Рекомендуется провести уточняющее интервью для принятия окончательного решения.'
      : 'The candidate shows basic competencies but requires additional assessment. Recommended to conduct a clarifying interview for final decision.')
    : (language === 'ru'
      ? 'Кандидат не полностью соответствует требованиям позиции. Рекомендуется рассмотреть другие кандидатуры или предложить альтернативную позицию с меньшими требованиями.'
      : 'The candidate does not fully meet the position requirements. Recommended to consider other candidates or offer an alternative position with lower requirements.');

  const practicalInfo = {
    startDate: result?.practicalInfo?.startDate || (language === 'ru' ? 'Уточнить на интервью' : 'To be clarified'),
    salary: result?.practicalInfo?.salary || (language === 'ru' ? 'Уточнить на интервью' : 'To be clarified'),
    location: result?.practicalInfo?.location || (language === 'ru' ? 'Уточнить на интервью' : 'To be clarified')
  };

  // Подготовка критериев оценки
  const criteria = [
    {
      name: language === 'ru' ? 'Опыт и навыки' : 'Experience & Skills',
      score: Math.min(10, overallScore + Math.random() * 1.5),
      maxScore: 10,
      notes: verdict === 'recommended' 
        ? (language === 'ru' 
          ? ['Релевантный опыт работы', 'Уверенное владение необходимыми инструментами', 'Приводит конкретные примеры']
          : ['Relevant work experience', 'Confident command of necessary tools', 'Provides specific examples'])
        : (language === 'ru'
          ? ['Базовые навыки присутствуют', 'Требуется дополнительное обучение', 'Мало конкретных примеров']
          : ['Basic skills present', 'Additional training required', 'Few specific examples'])
    },
    {
      name: language === 'ru' ? 'Коммуникация' : 'Communication',
      score: Math.min(10, overallScore + Math.random() * 1),
      maxScore: 10,
      notes: verdict === 'recommended'
        ? (language === 'ru'
          ? ['Чёткая артикуляция', 'Умение слушать и задавать вопросы', 'Структурированные ответы']
          : ['Clear articulation', 'Ability to listen and ask questions', 'Structured answers'])
        : (language === 'ru'
          ? ['Базовые коммуникативные навыки', 'Краткие ответы', 'Требуется развитие навыков презентации']
          : ['Basic communication skills', 'Brief answers', 'Presentation skills need development'])
    },
    {
      name: language === 'ru' ? 'Мотивация' : 'Motivation',
      score: Math.min(10, overallScore + Math.random() * 0.8),
      maxScore: 10,
      notes: verdict === 'recommended'
        ? (language === 'ru'
          ? ['Заинтересован в долгосрочном сотрудничестве', 'Понимает специфику работы', 'Готов к развитию']
          : ['Interested in long-term cooperation', 'Understands work specifics', 'Ready for development'])
        : (language === 'ru'
          ? ['Базовая мотивация присутствует', 'Нечёткое понимание роли', 'Требуется уточнение ожиданий']
          : ['Basic motivation present', 'Unclear understanding of role', 'Expectations need clarification'])
    },
    {
      name: language === 'ru' ? 'Культурный фит' : 'Cultural Fit',
      score: Math.min(10, overallScore + Math.random() * 0.7),
      maxScore: 10,
      notes: verdict === 'recommended'
        ? (language === 'ru'
          ? ['Ценности совпадают с корпоративной культурой', 'Командный игрок', 'Позитивный настрой']
          : ['Values align with corporate culture', 'Team player', 'Positive attitude'])
        : (language === 'ru'
          ? ['Требуется дополнительная оценка культурного фита', 'Недостаточно информации о работе в команде']
          : ['Additional cultural fit assessment required', 'Insufficient information about teamwork'])
    }
  ];

  // Подготовка транскрипта
  const transcript = (result?.transcript || []).map((msg: any, idx: number) => ({
    timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : `${Math.floor(idx / 2)}:${(idx * 15) % 60}`,
    speaker: (msg.role === 'ai' ? 'AI' : 'Candidate') as 'AI' | 'Candidate',
    text: msg.message || msg.content || ''
  }));

  // Если транскрипт пустой, добавляем пример
  if (transcript.length === 0) {
    transcript.push(
      { timestamp: '00:00', speaker: 'AI', text: language === 'ru' ? 'Здравствуйте! Расскажите о своём опыте работы.' : 'Hello! Tell me about your work experience.' },
      { timestamp: '00:15', speaker: 'Candidate', text: language === 'ru' ? 'Здравствуйте! У меня есть опыт работы в похожей должности...' : 'Hello! I have experience in a similar position...' }
    );
  }

  // Mock simulation data (stressful situation test)
  const simulation = verdict === 'recommended' || verdict === 'promising' ? {
    situation: language === 'ru' 
      ? 'Тест на стрессоустойчивость: агрессивный клиент'
      : 'Stress resistance test: aggressive client',
    dialog: [
      {
        role: 'ai' as const,
        message: language === 'ru'
          ? 'Я НЕ ПОНИМАЮ, ЧТО ВЫ НЕСЕТЕ! Это полная ерунда! У вас вообще мозги есть?!'
          : 'I DON\'T UNDERSTAND WHAT YOU\'RE SAYING! This is complete nonsense! Do you even have a brain?!',
        tone: 'aggressive' as const
      },
      {
        role: 'candidate' as const,
        message: language === 'ru'
          ? 'Я понимаю, что вы расстроены. Давайте я попробую объяснить иначе. Какая именно часть вызывает у вас вопросы?'
          : 'I understand you\'re upset. Let me try to explain it differently. Which part exactly raises questions for you?'
      },
      {
        role: 'ai' as const,
        message: language === 'ru'
          ? 'ВСЁ вызывает вопросы! Вы вообще знаете, чем занимается ваша компания?!'
          : 'EVERYTHING raises questions! Do you even know what your company does?!',
        tone: 'aggressive' as const
      },
      {
        role: 'candidate' as const,
        message: language === 'ru'
          ? 'Конечно знаю. Предлагаю сосредоточиться на вашей конкретной задаче. Опишите мне ситуацию, и я предложу решение.'
          : 'Of course I do. Let\'s focus on your specific task. Describe the situation to me, and I\'ll suggest a solution.'
      }
    ],
    summary: [
      {
        type: 'positive' as const,
        text: language === 'ru'
          ? 'Сохранил спокойствие и профессионализм при агрессии'
          : 'Maintained composure and professionalism under aggression'
      },
      {
        type: 'positive' as const,
        text: language === 'ru'
          ? 'Перевёл разговор в конструктивное русло'
          : 'Redirected conversation to constructive direction'
      },
      {
        type: 'positive' as const,
        text: language === 'ru'
          ? 'Предложил конкретные шаги для решения проблемы'
          : 'Offered specific steps to solve the problem'
      }
    ]
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CandidateEvaluationReport_v2
        candidateName={candidateName}
        role={role}
        overallScore={overallScore}
        verdict={verdict}
        meetsRequirements={meetsRequirements}
        concernsOrMissing={concernsOrMissing}
        recommendation={recommendation}
        practicalInfo={practicalInfo}
        criteria={criteria}
        transcript={transcript}
        audioUrl={result?.audioUrl}
        simulation={simulation}
        onBack={onBack}
        requirementChecks={requirementChecks}
        followUpQuestions={followUpQuestions}
      />
    </div>
  );
}
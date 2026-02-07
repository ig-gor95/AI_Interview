import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type Language = 'ru' | 'en';

// Atom для хранения текущего языка в localStorage
export const languageAtom = atomWithStorage<Language>('screenme-language', 'ru');

export interface Translations {
  // Navigation & Common
  nav: {
    forCandidates: string;
    forOrganizers: string;
    aiInterview: string;
  };
  
  // Header
  header: {
    organizerDashboard: string;
    candidateDashboard: string;
    organizer: string;
    candidate: string;
  };

  // Landing Hero
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
  };

  // Choice Section (разводящий блок)
  choice: {
    badge: string;
    title: string;
    massCard: {
      title: string;
      subtitle: string;
      feature1: string;
      feature2: string;
      feature3: string;
      price: string;
      button: string;
    };
    itCard: {
      title: string;
      subtitle: string;
      feature1: string;
      feature2: string;
      feature3: string;
      price: string;
      button: string;
    };
  };

  // Report Comparison
  reportComparison: {
    badge: string;
    title: string;
    subtitle: string;
    massReport: {
      title: string;
      metric1: string;
      metric2: string;
      metric3: string;
    };
    itReport: {
      title: string;
      metric1: string;
      metric2: string;
      metric3: string;
      videoLink: string;
    };
  };

  // Experts Section
  experts: {
    badge: string;
    title: string;
    subtitle: string;
    expert1Name: string;
    expert1Role: string;
    expert1Company: string;
    expert2Name: string;
    expert2Role: string;
    expert2Company: string;
    expert3Name: string;
    expert3Role: string;
    expert3Company: string;
  };

  // Demo Interface
  demo: {
    aiInterview: string;
    recruiterName: string;
    recruiterRole: string;
    you: string;
    candidate: string;
    analyzing: string;
    speaking: string;
    youSpeaking: string;
    greeting: string;
    listening1: string;
    question1: string;
    listening2: string;
    question2: string;
    listening3: string;
    complete: string;
  };

  // User Journey
  journey: {
    badge: string;
    title: string;
    description: string;
    step1Badge: string;
    step1Title: string;
    step1Description: string;
    step1Time: string;
    step1Questions: string;
    step1QuestionsDesc: string;
    step1Simulation: string;
    step1SimulationDesc: string;
    step2Badge: string;
    step2Title: string;
    step2Description: string;
    step2LinkLabel: string;
    step2QrLabel: string;
    step2QrDesc: string;
    step2PlaceIn: string;
    step2Place1: string;
    step2Place2: string;
    step2Place3: string;
    step2Place4: string;
    step2Mobile: string;
    step2QrOffline: string;
    step2NoApp: string;
    step3Badge: string;
    step3Title: string;
    step3Description: string;
    step3Voice: string;
    step3Scenario: string;
    step3Analysis: string;
    step3Time: string;
    step4Badge: string;
    step4Title: string;
    step4Description: string;
    step4Auto: string;
    step4Analytics: string;
    step4Recording: string;
  };

  // Industries
  industries: {
    badge: string;
    title: string;
    description: string;
    callCenter: string;
    callCenterDesc: string;
    hotel: string;
    hotelDesc: string;
    cafe: string;
    cafeDesc: string;
    salon: string;
    salonDesc: string;
  };

  // Features
  features: {
    badge: string;
    title: string;
    description: string;
    scenario: string;
    scenarioDesc: string;
    analysis: string;
    analysisDesc: string;
    voice: string;
    voiceDesc: string;
    rating: string;
    ratingDesc: string;
    transcription: string;
    transcriptionDesc: string;
    filter: string;
    filterDesc: string;
  };

  // How It Works
  howItWorks: {
    badge: string;
    title: string;
    description: string;
    step1: string;
    step1Desc: string;
    step1ExampleMass: string;
    step1ExampleIT: string;
    step2: string;
    step2Desc: string;
    step3: string;
    step3Desc: string;
    step3Example: string;
    step4: string;
    step4Desc: string;
  };

  // Evaluation Preview
  evaluationPreview: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    viewExample: string;
    tabMass: string;
    tabIT: string;
    // Mock preview card
    massName: string;
    massPosition: string;
    massExperience: string;
    itName: string;
    itPosition: string;
    itExperience: string;
    overallRating: string;
    readyForWork: string;
    strongHire: string;
    communication: string;
    stressResistance: string;
    workExperience: string;
    motivation: string;
    listen: string;
    text: string;
    recommendedMass: string;
    recommendedIT: string;
    recommendationTextMass: string;
    recommendationTextIT: string;
  };

  // Bottom Summary
  bottomSummary: {
    title: string;
    description: string;
    feature1: string;
    feature2: string;
    feature3: string;
  };

  // Step 3 Details
  step3Details: {
    aiAssistant: string;
    conducting: string;
    question: string;
    recording: string;
    active: string;
    analysis: string;
    realtime: string;
  };

  // Demo Details
  demoDetails: {
    candidateInitial: string;
    speaking: string;
    topCandidates: string;
    clearFormulations: string;
    expertReview: string;
    candidateName1: string;
    candidateName2: string;
    candidateName3: string;
    scoreExcellent: string;
    scoreGood: string;
    scoreAverage: string;
    freeStartBold: string;
    freeStartText: string;
  };

  // Additional Benefits
  additionalBenefits: {
    turnoverReductionTitle: string;
    turnoverReductionDesc: string;
    quickLaunchTitle: string;
    quickLaunchDesc: string;
  };

  // FAQ Details
  faqDetails: {
    badge: string;
    subtitle: string;
  };

  // Security Details  
  securityDetails: {
    feature1Title: string;
    feature1Desc: string;
    timeSavingTitle: string;
    timeSavingDesc: string;
    objectiveTitle: string;
    objectiveDesc: string;
  };

  // Security
  security: {
    badge: string;
    title: string;
    description: string;
    privacy: string;
    privacyDesc: string;
    secure: string;
    secureDesc: string;
  };

  // CTA
  cta: {
    title: string;
    title2: string;
    description: string;
    button: string;
    demo: string;
    setupInterview: string;
    tryDemoInterview: string;
  };

  // FAQ
  faq: {
    title: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    q5: string;
    a5: string;
    q6: string;
    a6: string;
  };

  // Footer
  footer: {
    contact: string;
    description: string;
    email: string;
    phone: string;
    rights: string;
    forOrganizers: string;
    forCandidates: string;
    demoEvaluation: string;
  };

  // Contact Modal
  contact: {
    title: string;
    description: string;
    name: string;
    email: string;
    message: string;
    send: string;
    close: string;
  };

  // Login Form
  login: {
    organizerTitle: string;
    candidateTitle: string;
    organizerDesc: string;
    candidateDesc: string;
    login: string;
    signup: string;
    back: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
    signupButton: string;
    haveAccount: string;
    noAccount: string;
    loginLink: string;
    signupLink: string;
    forOrganizers: string;
    forCandidates: string;
    personalization: string;
    personalizationDesc: string;
    quickStart: string;
    quickStartDesc: string;
    analytics: string;
    analyticsDesc: string;
  };

  // Dashboard & Header
  dashboard: {
    welcome: string;
    logout: string;
    createInterview: string;
    activeInterviews: string;
    completedInterviews: string;
    totalCandidates: string;
    myInterviews: string;
    noCandidates: string;
    viewResults: string;
    openInterview: string;
    candidates: string;
    links: string;
    settings: string;
  };

  // Organizer Dashboard
  organizerDashboard: {
    totalInterviews: string;
    candidatesPassed: string;
    recommendedShare: string;
    recommendedShareDesc: string;
    candidatesLabel: string;
    managementTab: string;
    testInterviewsTab: string;
    testInterviewsTabShort: string;
    candidatesTab: string;
    manageTitle: string;
    manageDesc: string;
    manageNote: string;
    testInterviewsTitle: string;
    testInterviewsDesc: string;
    candidatesStatsTitle: string;
    candidatesStatsDesc: string;
    loadingCandidates: string;
    loadingCandidatesDesc: string;
    createFirstInterview: string;
    createFirstInterviewDesc: string;
    createButton: string;
    jobLabel: string;
    checkingLabel: string;
    createdLabel: string;
    reusableLabel: string;
    noInterviews: string;
    noInterviewsDesc: string;
    russian: string;
    english: string;
    situationModeling: string;
    support: string;
    qrCodeTitle: string;
    qrCodeDesc: string;
    interviewLink: string;
    copyLink: string;
    downloadQR: string;
    print: string;
    qrCodePlacement: string;
    uniqueLinks: string;
    testLink: string;
    copied: string;
    passInterview: string;
    testLabel: string;
    beginnerLevel: string;
    intermediateLevel: string;
    advancedLevel: string;
    level: string;
    minutes: string;
    supportTitle: string;
    supportSubtitle: string;
    contactCEO: string;
    chooseContact: string;
    telegram: string;
    telegramDesc: string;
    callPhone: string;
    leaveContact: string;
    leaveContactDesc: string;
    yourName: string;
    phone: string;
    emailOptional: string;
    describeIssue: string;
    send: string;
    thankYouMessage: string;
    questions: string;
  };

  // Interview Form
  interviewForm: {
    title: string;
    subtitle: string;
    close: string;
    jobInfoTitle: string;
    jobInfoDesc: string;
    jobTitle: string;
    jobTitleRequired: string;
    jobTitlePlaceholder: string;
    companyName: string;
    companyPlaceholder: string;
    aiGenerationTitle: string;
    aiGenerationDesc: string;
    jobDescription: string;
    jobDescriptionPlaceholder: string;
    generateQuestions: string;
    generating: string;
    questionsTitle: string;
    questionsDesc: string;
    questionPlaceholder: string;
    canEdit: string;
    addClarifying: string;
    clarifyingPlaceholder: string;
    clarifyingDesc: string;
    addQuestion: string;
    addQuestionPlaceholder: string;
    recommended: string;
    dynamicQuestionsTitle: string;
    dynamicQuestionsDesc: string;
    simulationTitle: string;
    simulationDesc: string;
    scenarioLabel: string;
    scenarioPlaceholder: string;
    roleLabel: string;
    rolePlaceholder: string;
    exampleDialogTitle: string;
    exampleCustomerMessage: string;
    exampleCandidateMessage: string;
    exampleNote: string;
    howItWorksTitle: string;
    howItWorksStep1: string;
    howItWorksStep2: string;
    howItWorksStep3: string;
    create: string;
    cancel: string;
    alertJobTitle: string;
    alertQuestions: string;
    alertJobDescription: string;
    successMessage: string;
    errorGenerate: string;
  };

  // Candidate Evaluation
  candidateEvaluation: {
    backToList: string;
    aiInterviewer: string;
    fullDialog: string;
    listen: string;
    pause: string;
    play: string;
    interviewSummary: string;
    status: string;
    recommendedToNext: string;
    needsClarification: string;
    notRecommended: string;
    outOf10: string;
    interviewScore: string;
    notHiringDecision: string;
    basedOnAnswers: string;
    keySignals: string;
    whatConfirmed: string;
    whatToPayAttention: string;
    recommendedToCheck: string;
    hrMarksItems: string;
    answersToQuestions: string;
    speechAnalytics: string;
    detail: string;
    structure: string;
    relevance: string;
    high: string;
    medium: string;
    low: string;
    ratedRelativeToRole: string;
    realSituationSimulation: string;
    stressfulSituation: string;
    aiPlayedRole: string;
    dialogWithClient: string;
    aiClient: string;
    aggressive: string;
    calm: string;
    simulationSummary: string;
    disclaimer: string;
    close: string;
    summaryRecommended: string;
    summaryNeedsClarification: string;
    summaryNotRecommended: string;
    signalsCalmUnderPressure: string;
    signalsConcreteActions: string;
    signalsProfessionalVocabulary: string;
    signalsExamplesFromExperience: string;
    signalsUnderstandsQuestions: string;
    signalsTriesToSolve: string;
    signalsNoAggression: string;
    signalsCompletesInterview: string;
    signalsAnswersQuestions: string;
    attentionLacksEmpathy: string;
    attentionMissedEmpathyFirst: string;
    attentionBriefAnswers: string;
    attentionNoExamples: string;
    attentionCheckConflicts: string;
    attentionIncoherentSpeech: string;
    attentionAvoidsAnswers: string;
    attentionFormulationDifficulties: string;
    attentionLowStressResistance: string;
    checkEmpathyFormat: string;
    checkRealCases: string;
    checkExpectations: string;
    checkSimilarExperience: string;
    checkTrainingReadiness: string;
    checkProblemSolving: string;
    checkMotivation: string;
    checkBasicTraining: string;
    checkAlternativePositions: string;
    checkWorkMotivation: string;
    simulationKeptCalm: string;
    simulationOfferedCompensation: string;
    simulationLackedEmpathy: string;
  };

  // Candidates Tab
  candidatesTab: {
    noResults: string;
    noResultsDesc: string;
    vacancy: string;
    candidates: string;
    candidate: string;
    candidatesGenitive: string;
    recommended: string;
    recommendedStatus: string;
    questionable: string;
    questionableStatus: string;
    notRecommended: string;
    notRecommendedStatus: string;
    searchPlaceholder: string;
    export: string;
    status: string;
    all: string;
    minRating: string;
    allRatings: string;
    aboveAverage: string;
    strong: string;
    top: string;
    sorting: string;
    byRating: string;
    byDate: string;
    onlyWithProblems: string;
    rating: string;
    keySignals: string;
    actions: string;
    communication: string;
    communicationAndAnswers: string;
    details: string;
    candidatesNotFound: string;
    candidatesNotFoundDesc: string;
    resetFilters: string;
    clearSpeech: string;
    professionalLexicon: string;
    relevantExperience: string;
    standardAnswers: string;
    uncertainAnswers: string;
    requiresClarification: string;
    incoherentSpeech: string;
    avoidsQuestions: string;
    tooBriefAnswers: string;
    detailedAnswers: string;
    directLink: string;
    csvHeaders: {
      name: string;
      email: string;
      rating: string;
      status: string;
      position: string;
      date: string;
      duration: string;
    };
    disclaimerTitle: string;
    disclaimerText: string;
  };

  // Session View
  sessionView: {
    interview: string;
    analyzing: string;
    speaking: string;
    youSpeaking: string;
    complete: string;
    completeMessage: string;
    thankYou: string;
    backToDashboard: string;
    // New additions for SessionView
    duration: string;
    level: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    questionsCount: string;
    joinInterview: string;
    goBack: string;
    participants: string;
    transcript: string;
    settings: string;
    recruiter: string;
    candidate: string;
    you: string;
    sofia: string;
    micOff: string;
    recording: string;
    endCall: string;
    mic: string;
    turnOn: string;
    speaking2: string;
    answer: string;
    stopRecording: string;
    enableMic: string;
    waitForResponse: string;
    pressToAnswer: string;
    twoParticipants: string;
    dialogTranscript: string;
    speaking3: string;
    minutes: string;
    // Greetings
    greetingScreening: string;
    greetingFriendly: string;
    greetingProfessional: string;
    greetingMotivating: string;
    readyToStart: string;
    // AI responses
    userSampleMessage: string;
    aiResponse1: string;
    aiResponse2: string;
    aiResponse3: string;
    aiResponse4: string;
    aiResponse5: string;
    aiResponse6: string;
    aiFinalQuestion: string;
    // Summary
    summaryScreening: string;
    summaryLearning: string;
  };

  // Evaluation
  evaluation: {
    title: string;
    overallRating: string;
    strengths: string;
    weaknesses: string;
    recommendation: string;
    communication: string;
    professionalism: string;
    problemSolving: string;
    experience: string;
    transcription: string;
    download: string;
    back: string;
  };

  // Candidates Demo List
  candidatesDemoList: {
    backButton: string;
    title: string;
    subtitle: string;
    readyStatus: string;
    notReadyStatus: string;
    interviewDate: string;
    infoTitle: string;
    infoDescription: string;
    // Candidate 1 (Ready)
    candidate1Name: string;
    candidate1Position: string;
    candidate1Date: string;
    candidate1Summary: string;
    candidate1Strength1: string;
    candidate1Strength2: string;
    candidate1Strength3: string;
    // Candidate 2 (Not Ready)
    candidate2Name: string;
    candidate2Position: string;
    candidate2Date: string;
    candidate2Summary: string;
    candidate2Concern1: string;
    candidate2Concern2: string;
    candidate2Concern3: string;
    // Candidate 3 (Not Ready)
    candidate3Name: string;
    candidate3Position: string;
    candidate3Date: string;
    candidate3Summary: string;
    candidate3Concern1: string;
    candidate3Concern2: string;
    candidate3Concern3: string;
    // Candidate 4 (Not Ready)
    candidate4Name: string;
    candidate4Position: string;
    candidate4Date: string;
    candidate4Summary: string;
    candidate4Concern1: string;
    candidate4Concern2: string;
    candidate4Concern3: string;
  };
}

export const translations: Record<Language, Translations> = {
  ru: {
    nav: {
      forCandidates: 'Для кандидатов',
      forOrganizers: 'Для организаторов',
      aiInterview: 'AI-интервью',
    },
    header: {
      organizerDashboard: 'Панель управления организатора',
      candidateDashboard: 'Панель управления кандидата',
      organizer: 'Организатор',
      candidate: 'Кандидат',
    },
    hero: {
      badge: 'AI для рекрутинга',
      title: 'ScreenMe: Проверяем навыки, а не резюме',
      subtitle: 'ИИ-скрининг для массовых позиций и экспертный тех-аудит для IT-команд. Получайте готовых финалистов вместо сотен пустых откликов.',
      ctaPrimary: 'Скрининг + тех интервью с экспертом под ключ',
      ctaSecondary: 'Войти в кабинет организатора',
      stat1Value: '92%',
      stat1Label: 'Точность оценки кандидатов',
      stat2Value: '5-7 мин',
      stat2Label: 'Среднее время интервью',
      stat3Value: '24/7',
      stat3Label: 'Автоматический скрининг',
    },
    choice: {
      badge: 'Выберите направление',
      title: 'Два формата найма — одна платформа',
      massCard: {
        title: 'Mass Recruitment',
        subtitle: 'Автоматизация массовки',
        feature1: 'ИИ-скрининг 24/7 без участия HR',
        feature2: 'Оценка адекватности и коммуникативных навыков',
        feature3: 'Имитация реальных рабочих ситуаций',
        price: 'от 99 ₽ за интервью',
        button: 'Настроить массовое интервью',
      },
      itCard: {
        title: 'IT Recruitment',
        subtitle: 'Экспертный тех-отсев',
        feature1: 'AI-прескрининг + Живое тех-интервью с Senior-экспертом',
        feature2: 'Эксперты с опытом работы в Яндекс, VK, Т-Банк',
        feature3: 'Глубокий аудит Hard Skills',
        price: 'индивидуальный расчет',
        button: 'Подключить IT-экспертов',
      },
    },
    reportComparison: {
      badge: 'Результаты оценки',
      title: 'Отчеты под каждый сценарий найма',
      subtitle: 'От базового скрининга до глубокого тех-аудита',
      massReport: {
        title: 'Отчет: Линейный персонал',
        metric1: 'Коммуникация',
        metric2: 'Стрессоустойчивость',
        metric3: 'Пунктуальность',
      },
      itReport: {
        title: 'Отчет: IT-специалист',
        metric1: 'Code Quality',
        metric2: 'System Design',
        metric3: 'Problem Solving',
        videoLink: 'Видео-фрагмент тех-разбора',
      },
    },
    experts: {
      badge: 'Кто проверяет',
      title: 'IT-интервьюеры — это техлиды из топовых компаний',
      subtitle: 'Проверяют Hard Skills и дают развернутую обратную связь',
      expert1Name: 'Алексей Смирнов',
      expert1Role: 'Senior Backend Engineer',
      expert1Company: 'Яндекс',
      expert2Name: 'Мария Петрова',
      expert2Role: 'Tech Lead Frontend',
      expert2Company: 'Сбер',
      expert3Name: 'Дмитрий Козлов',
      expert3Role: 'Principal Architect',
      expert3Company: 'Т-Банк',
    },
    demo: {
      aiInterview: 'AI-Интервью',
      recruiterName: 'София',
      recruiterRole: 'AI Рекрутер',
      you: 'Вы',
      candidate: 'Кандидат',
      analyzing: 'Анализирую...',
      speaking: 'София говорит',
      youSpeaking: 'Вы отвечаете',
      greeting: 'Здравствуйте! Меня зовут София, я проведу с вами интервью. Расскажите, пожалуйста, о вашем опыте работы с клиентами.',
      listening1: 'Я работал в кафе...',
      question1: 'Отлично! А с какими сложными ситуациями вы сталкивались при общении с гостями?',
      listening2: 'Был случай с недовольным клиентом...',
      question2: 'Спасибо! Как бы вы поступили, если гость жалуется на холодное блюдо?',
      listening3: 'Я бы извинился и предложил...',
      complete: 'Отлично! Интервью завершено.',
    },
    journey: {
      badge: 'Путь использования',
      title: 'От настройки до найма за 4 шага',
      description: 'Простой и понятный процесс автоматизации найма сотрудников',
      step1Badge: 'ШАГ 1',
      step1Title: 'Настройте сценарий под ваш стек или вакансию',
      step1Description: 'Настройте ИИ под любую задачу: от оценки сервисных навыков (кейс "сложный клиент") до глубокого тех-скрининга (Code Review по вашему стеку: Python, Go, SQL и др.)',
      step1Time: 'Занимает 2-3 минуты',
      step1Questions: 'Список вопросов',
      step1QuestionsDesc: 'Массовый найм: Опыт, мотивация, кейс «Конфликт»',
      step1Simulation: 'Для IT',
      step1SimulationDesc: 'IT-найм: Алгоритмы, архитектура, System Design',
      step2Badge: 'ШАГ 2',
      step2Title: 'Запустите поток кандидатов',
      step2Description: 'Отправьте ссылку финалистам после первого фильтра или разместите в описании вакансии на специализированных ресурсах (hh.ru, Habr, GetIT). Кандидат начинает диалог в один клик.',
      step2LinkLabel: 'УНИКАЛЬНАЯ ССЫЛКА',
      step2QrLabel: 'QR-КОД ДЛЯ ОФЛАЙН',
      step2QrDesc: 'Печатайте и размещайте в офисе',
      step2PlaceIn: 'Разместите в:',
      step2Place1: '• Описание вакансии на hh.ru',
      step2Place2: '• Email рассылка кандидатам',
      step2Place3: '• Социальные сети компании',
      step2Place4: '• QR-коды в офисе или на стенде',
      step2Mobile: 'Работает на любых мобильных устройствах',
      step2QrOffline: 'QR-коды для офлайн-рекрутинга',
      step2NoApp: 'Не требует установки приложения',
      step3Badge: 'ШАГ 3',
      step3Title: 'AI проводит глубокое интервью',
      step3Description: 'AI ведет живой диалог, адаптируясь под ответы. Он не просто зачитывает список, а "копает" вглубь: просит привести примеры из практики, объяснить логику решения или разыграть рабочую ситуацию (от конфликта в торговом зале до архитектурного спора). ИИ понимает профессиональный сленг и технические термины.',
      step3Voice: 'Голосовой диалог в реальном времени',
      step3Scenario: 'Ролевая симуляция клиента',
      step3Analysis: 'Автоматический анализ ответов',
      step3Time: 'Среднее время: 5-7 минут',
      step4Badge: 'ШАГ 4',
      step4Title: 'Получите экспертный отчет и рейтинг',
      step4Description: 'Авто-рейтинг для массовых позиций (готовность к работе, софт-скиллы) или тех-аудит для IT (детальная матрица компетенций). Для сложных вакансий на этом этапе подключается наш эксперт, который проводит финальное живое интервью на основе данных от ИИ.',
      step4Auto: 'Автоматическая сортировка кандидатов',
      step4Analytics: 'Подробная аналитика по каждому',
      step4Recording: 'Запись и транскрипт для финальной проверки',
    },
    industries: {
      badge: 'Индустрии',
      title: 'Для любых сфер с массовым наймом',
      description: 'ScreenMe адаптируется под специфику вашего бизнеса',
      callCenter: 'Колл-центры',
      callCenterDesc: 'Проверка навыков общения, работы с возражениями и стрессоустойчивости',
      hotel: 'Отели',
      hotelDesc: 'Оценка гостеприимства, этикета и решения нестандартных ситуаций',
      cafe: 'Кафе и рестораны',
      cafeDesc: 'Тестирование обслуживания гостей и работы в команде',
      salon: 'Салоны красоты',
      salonDesc: 'Проверка клиентоориентированности и профессиональной коммуникации',
    },
    features: {
      badge: 'Возможности',
      title: 'Все необходимое для качественного найма',
      description: 'Современные AI технологии для оценки кандидатов',
      scenario: 'Сценарные собеседования',
      scenarioDesc: 'AI имитирует реальные рабочие ситуации по вашему сценарию',
      analysis: 'Автоматический анализ',
      analysisDesc: 'Оценка п�� навыкам, опыту и soft skills',
      voice: 'Голосовое интервью',
      voiceDesc: 'Естественный диалог без текстовых полей',
      rating: 'Рейтинг кандидатов',
      ratingDesc: 'Автоматическая сортировка от лучших к худшим',
      transcription: 'Полная расшифровка',
      transcriptionDesc: 'Текст и запись каждого интервью для проверки',
      filter: 'Умн��я фильтрация',
      filterDesc: 'Отсев неподходящих кандидатов на ранней стадии',
    },
    howItWorks: {
      badge: 'Процесс работы',
      title: 'От настройки до принятия решения за 4 шага',
      description: 'От простых скриптов для линейного персонала до сложных технических чек-листов для инженеров',
      step1: 'Настройте сценарий под ваш стек или вакансию',
      step1Desc: 'Настройте ИИ под любую задачу: от оценки сервисных навыков (кейс "сложный клиент") до глубокого тех-скрининга (Code Review по вашему стеку: Python, Go, SQL и др.)',
      step1ExampleMass: 'Массовый найм: Опыт, мотивация, кейс «Конфликт»',
      step1ExampleIT: 'IT-найм: Алгоритмы, архитектура, System Design',
      step2: 'Запустите поток кандидатов',
      step2Desc: 'Отправьте ссылку финалистам после первого фильтра или разместите в описании вакансии на специализированных ресурсах (hh.ru, Habr, GetIT). Кандидат начинает диалог в один клик.',
      step3: 'AI проводит глубокое интервью',
      step3Desc: 'AI ведет живой диалог, адаптируясь под ответы. Он не просто зачитывает список, а "копает" вглубь: просит привести примеры из практики, объяснить логику решения или разыграть рабочую ситуацию (от конфликта в торговом зале до архитектурного спора). ИИ понимает профессиональный сленг и технические термины.',
      step3Example: '«Вы упомянули использование Kafka. В каких случаях вы предпочтете её RabbitMQ?»',
      step4: 'Получите экспертный отчет и рейтинг',
      step4Desc: 'Авто-рейтинг для массовых позиций (готовность к работе, софт-скиллы) или тех-аудит для IT (детальная матрица компетенций). Для сложных вакансий на этом этапе подключается наш эксперт, который проводит финальное живое интервью на основе данных от ИИ.',
    },
    evaluationPreview: {
      badge: 'Умная аналитика',
      title: 'Экран оценки кандидата',
      subtitle: 'с практическими примерами',
      description: 'Понятная оценка с конкретными примерами из диалога. Сильные стороны, зоны внимания и рекомендации к действию — вся информация для быстрого принятия решения о найме.',
      feature1Title: 'Готовность к работе',
      feature1Desc: 'Краткое резюме поведения в стандартных и сложных ситуациях',
      feature2Title: 'Ключевые наблюдения',
      feature2Desc: 'Описательные формулировки без оценочных суждений',
      feature3Title: 'Запись и текст',
      feature3Desc: 'Прослушайте запись или прочитайте полный диалог',
      viewExample: 'Посмотреть пример',
      tabMass: 'Массовый найм',
      tabIT: 'IT специалисты',
      // Mock preview card
      massName: 'Анна Иванова',
      massPosition: 'Официант',
      massExperience: '4 года опыта',
      itName: 'Алексей Волков',
      itPosition: 'Senior Go Developer',
      itExperience: '7 лет опыта',
      overallRating: 'Общая оценка',
      readyForWork: 'Готов к работе',
      strongHire: 'Strong Hire',
      communication: 'Коммуникация',
      stressResistance: 'Стрессоустойчивость',
      workExperience: 'Опыт работы',
      motivation: 'Мотивация',
      listen: 'Прослушать',
      text: 'Текст',
      recommendedMass: '✓ Рекомендуется к найму',
      recommendedIT: '✓ Рекомендован (Strong Hire)',
      recommendationTextMass: 'Опытный специалист с хорошими навыками общения и работы в стрессовых ситуациях.',
      recommendationTextIT: 'Глубокие знания рантайма Go и навыки проектирования распределенных систем. Уверенно аргументирует выбор технологий.',
    },
    bottomSummary: {
      title: 'Быстрая и честная оценка каждого кандидата',
      description: 'AI помогает определить соответствие требованиям и даёт всем равные возможности. Кандидаты получают быстрый ответ, а HR экономит до 70% времени на первичный отбор.',
      feature1: 'Оценка реальных навыков',
      feature2: 'Без холодных звонков',
      feature3: 'Без ожидания ответов',
    },
    step3Details: {
      aiAssistant: 'AI АССИСТЕНТ',
      conducting: 'Веду интервью...',
      question: 'Вы упомянули использование Kafka. В каких случаях вы предпочтете её RabbitMQ?',
      recording: 'Запись',
      active: 'Активна',
      analysis: 'Анализ',
      realtime: 'В реальном времени',
    },
    demoDetails: {
      candidateInitial: 'К',
      speaking: 'ГОВОРИТ',
      topCandidates: 'ТОП-КАНДИДАТЫ',
      clearFormulations: 'Понятные формулировки',
      expertReview: 'Экспертная проверка • 1ч 15мин',
      candidateName1: 'Анна Петрова',
      candidateName2: 'Иван Сидоров',
      candidateName3: 'Мария Иванова',
      scoreExcellent: 'Отлично',
      scoreGood: 'Хорошо',
      scoreAverage: 'Средне',
      freeStartBold: 'Начните бесплатно:',
      freeStartText: 'Первые 10 интервью в подарок. Оцените качество отбора, увидьте детальную аналитику и почувствуйте разницу уже на первой неделе.',
    },
    additionalBenefits: {
      turnoverReductionTitle: 'Снижение текучести на 40%',
      turnoverReductionDesc: 'Реалистичные сценарии интервью показывают кандидату настоящие задачи. Меньше разочарований после найма.',
      quickLaunchTitle: 'Запуск за 5 минут без интеграций',
      quickLaunchDesc: 'Зарегистрируйтесь, опишите вакансию, отправьте ссылку кандидатам. Никаких сложных настроек и установок.',
    },
    faqDetails: {
      badge: 'Вопросы и ответы',
      subtitle: 'Ответы на ключевые вопросы о работе ScreenMe',
    },
    securityDetails: {
      feature1Title: 'Почему выбирают ScreenMe',
      feature1Desc: 'Реальная польза для вашего бизнеса',
      timeSavingTitle: 'Экономия времени HR в 10 раз',
      timeSavingDesc: 'AI проводит первичный отбор 24/7, вы работаете только с готовыми кандидатами. Закрывайте вакансии в 3 раза быстрее.',
      objectiveTitle: 'Объективная оценка без предвзятости',
      objectiveDesc: 'AI анализирует только профессиональные навыки, коммуникацию и стрессоустойчивость. Единые стандарты для всех кандидатов.',
    },
    security: {
      badge: 'Безопасность',
      title: 'Конфиденциальность данных',
      description: 'Все данные кандидатов надежно защищены',
      privacy: 'Конфиденциальность',
      privacyDesc: 'Данные кандидатов не передаются третьим лицам',
      secure: 'Безопасное хранение',
      secureDesc: 'Записи интервью хранятся в зашифрованном виде',
    },
    cta: {
      title: 'Готовы автоматизировать найм?',
      title2: 'Начните экономить время HR уже сегодня',
      description: 'Настройте AI-интервью за 2 минуты и получите первых кандидатов',
      button: 'Начать бесплатно',
      demo: 'Посмотреть демо',
      setupInterview: 'Настроить интервью',
      tryDemoInterview: 'Пройти демо-интервью',
    },
    faq: {
      title: 'Часто задаваемые вопросы',
      q1: 'Как эксперты проверяют Hard Skills у IT-кандидатов?',
      a1: 'IT-эксперты из BigTech компаний проводят живое техническое интервью: code review, system design, алгоритмические задачи. Каждый эксперт специализируется на своем стеке технологий и имеет опыт 5+ лет.',
      q2: 'Можно ли обмануть AI на массовом интервью?',
      a2: 'Нет. AI ана��изирует не только текст ответов, но и интонацию, паузы, уверенность речи, логичность изложения. Система детектирует заготовленные ответы и несоответствие контексту вопроса.',
      q3: 'Чем отличается массовое интервью от IT-интервью?',
      a3: 'Массовое интервью — это полностью автоматический AI-скрининг для оценки базовых навыков (коммуникация, адекватность). IT-интервью включает AI-прескрининг + живое тех-интервью с Senior-экспертом для глубокой проверки технических компетенций.',
      q4: 'Как быстро я получу результаты?',
      a4: 'Массовое AI-интервью обрабатывается мгновенно — отчет готов сразу после завершения. IT-интервью с экспертом — в течение 24 часов после проведения.',
      q5: 'Могу ли я посмотреть записи интервью?',
      a5: 'Да, все интервью записываются и расшифровываются. Вы можете прослушать аудио, прочитать текстовую расшифровку и в случае IT-интервью — посмотреть видео-фрагменты с ключевыми моментами.',
      q6: 'Сколько стоит сервис?',
      a6: 'Массовое интервью — от 99₽ за кандидата. IT-интервью с экспертом — индивидуальный тариф в зависимости от стека и сеньорности позиции. Свяжитесь с нами для расчета.',
    },
    footer: {
      contact: 'Связаться с нами',
      description: 'AI-интервью для массового найма',
      email: 'Эл. почта',
      phone: 'Телефон',
      rights: '© 2024 ScreenMe. Все права защищены.',
      forOrganizers: 'Для организаторов',
      forCandidates: 'Для кандидатов',
      demoEvaluation: 'Демо оценки',
    },
    contact: {
      title: 'Связаться с нами',
      description: 'Заполните форму, и мы свяжемся с вами в ближайшее время',
      name: 'Имя',
      email: 'Email',
      message: 'Сообщение',
      send: 'Отправить',
      close: 'Закрыть',
    },
    login: {
      organizerTitle: 'Вход для организаторов',
      candidateTitle: 'Вход для кандидатов',
      organizerDesc: 'Управление интервью и результатами',
      candidateDesc: 'Пройти интервью',
      login: 'Вход',
      signup: 'Регистрация',
      back: 'Назад',
      nameLabel: 'Имя',
      namePlaceholder: 'Введите ваше имя',
      emailLabel: 'Email',
      emailPlaceholder: 'Введите ваш email',
      passwordLabel: 'Пароль',
      passwordPlaceholder: 'Введите ваш пароль',
      loginButton: 'Войти',
      signupButton: 'Зарегистрироваться',
      haveAccount: 'У вас уже есть аккаунт?',
      noAccount: 'У вас нет аккаунта?',
      loginLink: 'Войти',
      signupLink: 'Зарегистрироваться',
      forOrganizers: 'Для организаторов',
      forCandidates: 'Для кандидатов',
      personalization: 'Персонализация интервью',
      personalizationDesc: 'Настройте вопросы и сценарии под вашу компанию',
      quickStart: 'Быстрый старт',
      quickStartDesc: 'Создайте первое интервью за 3 минуты',
      analytics: 'Аналитика результатов',
      analyticsDesc: 'Получайте подробные отчеты о кандидатах',
    },
    dashboard: {
      welcome: 'Добро пожаловать',
      logout: 'Выйти',
      createInterview: 'Создать интервью',
      activeInterviews: 'Активные интервью',
      completedInterviews: 'Завершенные интервью',
      totalCandidates: 'Всего кандидатов',
      myInterviews: 'Мои интервью',
      noCandidates: 'Пока нет кандидатов',
      viewResults: 'Посмотреть результаты',
      openInterview: 'Открыть интервью',
      candidates: 'Кандидаты',
      links: 'Ссылки',
      settings: 'Настройки',
    },
    organizerDashboard: {
      totalInterviews: 'Всего интервью',
      candidatesPassed: 'Кандидатов прошло',
      recommendedShare: 'Рекомендованных',
      recommendedShareDesc: 'Процент кандидатов, рекомендованных для найма',
      candidatesLabel: 'кандидатов',
      managementTab: 'Управление',
      testInterviewsTab: 'Тестовые интервью',
      testInterviewsTabShort: 'Тесты',
      candidatesTab: 'Кандидаты',
      manageTitle: 'Управление интервью',
      manageDesc: 'Создавайте и управляйте первичными интервью для предварительного отбора кандидатов',
      manageNote: 'Интервью помогают сократить ручной скрининг и не заменяют решение HR',
      testInterviewsTitle: 'Тестовые интервью',
      testInterviewsDesc: 'Используется для проверки сценариев. Кандидаты из тестовых интервью не учитываются в статистике.',
      candidatesStatsTitle: 'Статистика кандидатов',
      candidatesStatsDesc: 'Детальная статистика по всем кандидатам',
      loadingCandidates: 'Загрузка данных...',
      loadingCandidatesDesc: 'Получение списка кандидатов',
      createFirstInterview: 'Создайте своё первое интервью',
      createFirstInterviewDesc: 'Настройте AI-интервью для отбора кандидатов и получите ссылку для отправки',
      createButton: 'Создать интервью',
      jobLabel: 'Вакансия',
      checkingLabel: 'Что проверяем',
      createdLabel: 'Создано',
      reusableLabel: 'Многоразовые',
      noInterviews: 'Нет доступных интервью',
      noInterviewsDesc: 'Создайте интервью чтобы пройти его в тестовом режиме',
      russian: 'Русский',
      english: 'English',
      situationModeling: 'Моделирование ситуаций',
      support: 'Поддержка',
      qrCodeTitle: 'QR-код для интервью',
      qrCodeDesc: 'Создайте и скачайте QR-коды для интервью',
      interviewLink: 'Ссылка на интервью:',
      copyLink: 'Скопировать ссылку',
      downloadQR: 'Скачать QR-код',
      print: 'Распечатать',
      qrCodePlacement: 'Разместите QR-код в офисе, на стнде или в печатных материалах. Кандидаты смогут отсканировать его теефоном и сразу начать интервью.',
      uniqueLinks: 'Уникальные ссылки',
      testLink: 'Тестовая ссылка',
      copied: 'Скопировано!',
      passInterview: 'Пройти интервью',
      testLabel: 'ТЕСТ',
      beginnerLevel: 'Начальный',
      intermediateLevel: 'Средний',
      advancedLevel: 'Продвинутый',
      level: 'уровень',
      minutes: '7–10 минут',
      supportTitle: 'Поддержка',
      supportSubtitle: 'Напишите CEO',
      contactCEO: 'Свяжитесь с руководством',
      chooseContact: 'Выберите удобный способ связи',
      telegram: 'Telegram',
      telegramDesc: 'Основной способ связи — отвечаем быстрее всего',
      callPhone: 'Позвонить',
      leaveContact: 'Оставить контакт',
      leaveContactDesc: 'Если сейчас неудобно — оставьте номер или email',
      yourName: 'Ваше имя',
      phone: 'Телефон',
      emailOptional: 'Email (опционально)',
      describeIssue: 'Опишите вашу проблему или вопрос',
      send: 'Отправить',
      thankYouMessage: 'Спасибо! Мы свяжемся с вами в ближайшее время.',
      questions: 'вопросов',
    },
    interviewForm: {
      title: 'Создать AI-интервью',
      subtitle: 'Настройте интервью за 2 минуты',
      close: 'Закрыть',
      jobInfoTitle: 'Информация о вакансии',
      jobInfoDesc: 'Используется для корректной формулировки вопросов и сценариев интервью',
      jobTitle: 'Название вакансии',
      jobTitleRequired: '*',
      jobTitlePlaceholder: 'Например: Администратор / Официант / Оператор колл-центра',
      companyName: 'Название компании',
      companyPlaceholder: 'Например: IT Solutions',
      aiGenerationTitle: '✨ Генерация через AI',
      aiGenerationDesc: 'Опишите вакансию — AI создаст вопросы, уточнения и сценарий автоматически',
      jobDescription: 'Описание вакансии',
      jobDescriptionPlaceholder: 'Например: Ищем оператора колл-центра для обработки входящих звонков. Требования: опыт работы с клиентами, стрессоустой��ивость, грамотная речь. Обязанности: прием звонков, консультирование клиентов, работа в CRM.',
      generateQuestions: 'Сгенерировать вопросы',
      generating: 'Генерируем...',
      questionsTitle: 'Базовые вопросы для первичного отбора',
      questionsDesc: 'Эти вопросы помогают оценить коммуникацию, опыт и мотивацию кандидата',
      questionPlaceholder: 'Введите вопрос',
      canEdit: 'Можно отредактировать под вашу вакансию',
      addClarifying: 'Добавить',
      clarifyingPlaceholder: 'Например: Можете подробнее рассказать об этом опыте?',
      clarifyingDesc: 'Робот может задать эти вопросы для уточнения ответа кандидата',
      addQuestion: 'Добавить вопрос',
      addQuestionPlaceholder: 'Добавить свой вопрос...',
      recommended: 'Рекомендуется 3–6 вопросов',
      dynamicQuestionsTitle: 'Дополнительные вопросы на усмотрение робота',
      dynamicQuestionsDesc: 'Робот может задавать дополнительные вопросы по ходу диалога на основе ответов кандидата для более глубокого понимания его опыта и компетенций',
      simulationTitle: 'Моделирование реальной рабочей ситуации (опционально)',
      simulationDesc: 'Используется для оценки реакции кандидата в стрессовой ситуации',
      scenarioLabel: 'Описание сценария',
      scenarioPlaceholder: 'Кратко опишите ситуацию, с которой кандидат может столкнуться на работе',
      roleLabel: 'Роль клиента',
      rolePlaceholder: 'Например: недовольный клиент, гость, заказчик',
      exampleDialogTitle: 'Пример фрагмента диалога',
      exampleCustomerMessage: '"Алло! Я уже ЖДУ неделю свой заказ! Обещали 3 дня, а прошло СЕМЬ! Это безобразие! Где мой заказ?!"',
      exampleCandidateMessage: 'Понимаю ваше недовольство. Давайте я проверю статус вашего заказа прямо сейчас. Подскажите номер заказа?',
      exampleNote: 'Пример приведён для понимания формата. Реальный диалог формируется автоматически.',
      howItWorksTitle: 'Как это работает:',
      howItWorksStep1: 'Кандидат отвечает на базовые вопросы',
      howItWorksStep2: 'Система моделирует рабочую ситуацию',
      howItWorksStep3: 'Вы получаете запись и краткую сводку для отбора',
      create: 'Создать интервью',
      cancel: 'Отмена',
      alertJobTitle: 'Пожалуйста, укажите название вакансии',
      alertQuestions: 'Пожалуйста, добавьте хотя бы один вопрос',
      alertJobDescription: 'Пожалуйста, укажите описание вакансии',
      successMessage: '✨ Вопросы, уточняющие подвопросы и сценарий успешно сгенерированы!',
      errorGenerate: 'Ошибка при генерации. Попробуйте снова.',
    },
    candidateEvaluation: {
      backToList: 'Назад к списку',
      aiInterviewer: 'AI Интервьюер',
      fullDialog: 'Полный диалог',
      listen: 'Прослушать',
      pause: 'Пауза',
      play: 'Воспроизвести',
      interviewSummary: 'Итог первичного интервью',
      status: 'Статус',
      recommendedToNext: 'Рекомендован к следующему этапу',
      needsClarification: 'Требует уточнений',
      notRecommended: 'Не рекомендован',
      outOf10: 'из 10',
      interviewScore: 'Оценка интервью',
      notHiringDecision: '(не является решением о найме)',
      basedOnAnswers: 'Основано на ответах и речи в рамках первичного интервью',
      keySignals: 'Ключевые сигналы',
      whatConfirmed: 'Что подтвердилось',
      whatToPayAttention: 'На что обратить внимание',
      recommendedToCheck: 'Что реком��ндуется проверить на следующем этапе',
      hrMarksItems: 'HR-специалист самостоятельно отмечает пункты для проверки',
      answersToQuestions: 'Ответы на вопросы',
      speechAnalytics: 'Аналитика по стилю речи',
      detail: 'Детальность',
      structure: 'Структурированность',
      relevance: 'Релевантность',
      high: 'высокая',
      medium: 'средняя',
      low: 'низкая',
      ratedRelativeToRole: 'Оценка дана относительно типовых ответов на эту роль',
      realSituationSimulation: 'Смоделирована реальная стрессовая ситуация с клиентом',
      stressfulSituation: '💬 Смоделирована реальная стрессовая ситуация с клиентом',
      aiPlayedRole: 'AI сыграл роль агрессивного клиента, недовольного долгим ожиданием',
      dialogWithClient: 'Диалог с клиентом',
      aiClient: 'AI (клиент)',
      aggressive: 'агрессивный',
      calm: 'спокойный',
      simulationSummary: 'Итог симуляции:',
      disclaimer: '⚠️ Интерпретация дана на основе речевых паттернов, не заменяет оценку руководителя',
      close: 'Закрыть',
      summaryRecommended: 'Кандидат уверенно справился с типовыми клиентскими ситуациями. Коммуникация понятная, стресс выдерживает. Есть нюансы в выражении эмпатии — рекомендуется уточнить на личной встрече.',
      summaryNeedsClarification: 'Кандидат показал базовые навыки работы с клиентами. Ответы иногда краткие, требуют уточнений. Рекомендуется дополнительная проверка опыта и навыков эмпатии на следующем этапе.',
      summaryNotRecommended: 'Кандидат демонстрирует недостаточный уровень коммуникации для данной роли. Ответы несвязные, сложности с формулировками. Рекомендуется рассмотреть другие кандидатуры или предложить обучение.',
      signalsCalmUnderPressure: 'Спокойно реагирует на давление',
      signalsConcreteActions: 'Даёт конкретные решения',
      signalsProfessionalVocabulary: 'Использует профессиональную лексику',
      signalsExamplesFromExperience: 'Приводит примеры из опыта',
      signalsUnderstandsQuestions: 'Понимает суть вопросов',
      signalsTriesToSolve: 'Старается найти решение',
      signalsNoAggression: 'Не показывает агрессии',
      signalsCompletesInterview: 'Проходит интервью до конца',
      signalsAnswersQuestions: 'Отвечает на вопросы',
      attentionLacksEmpathy: 'Иногда переходит к процессу без эмпатии',
      attentionMissedEmpathyFirst: 'В первой реплике пропустил выражение сочувствия',
      attentionBriefAnswers: 'Кратко отвечает, требует уточнений',
      attentionNoExamples: 'Не всегда приводит конкретные примеры',
      attentionCheckConflicts: 'Проверить опыт работы с конфликтами',
      attentionIncoherentSpeech: 'Несвязная речь',
      attentionAvoidsAnswers: 'Уходит от прямых ответов',
      attentionFormulationDifficulties: 'Сложности с формулировками',
      attentionLowStressResistance: 'Низкая стрессоустойчивость',
      checkEmpathyFormat: 'Уточнить формат выражения эмпатии в стрессовых ситуациях',
      checkRealCases: 'Проверить реальные кейсы из прошлого опыта',
      checkExpectations: 'Обсудить ожидания по графику и развитию',
      checkSimilarExperience: 'Уточнить опыт работы в похожих ситуациях',
      checkTrainingReadiness: 'Проверить готовность к обучению',
      checkProblemSolving: 'Обсудить конкретные примеры решения проблем',
      checkMotivation: 'Выявить мотивацию и долгосрочные планы',
      checkBasicTraining: 'Оценить возможность базового обучения',
      checkAlternativePositions: 'Рассмотреть альтернативные позиции',
      checkWorkMotivation: 'Проверить мотивацию к работе в данной сфере',
      simulationKeptCalm: 'Сохранил спокойствие',
      simulationOfferedCompensation: 'Предложил компенсацию',
      simulationLackedEmpathy: 'В начале не хватило эмпатии',
    },
    candidatesTab: {
      noResults: 'Нет результатов',
      noResultsDesc: 'Здесь появятся результаты AI-интервью после прохождения кандидатами',
      vacancy: 'Вакансия',
      candidates: 'кандидатов',
      candidate: 'кандидат',
      candidatesGenitive: 'кандидата',
      recommended: 'рекомендовано',
      recommendedStatus: 'Рекомендован',
      questionable: 'Сомнительно',
      questionableStatus: 'Сомнительный',
      notRecommended: 'Не рекоменд.',
      notRecommendedStatus: 'Не рекомендован',
      searchPlaceholder: 'Поиск по имени или email...',
      export: 'Экспорт',
      status: 'Статус',
      all: 'Все',
      minRating: 'Мин. рейтинг',
      allRatings: '(все)',
      aboveAverage: '(выше среднего)',
      strong: '(сильные)',
      top: '(топ)',
      sorting: 'Сортировка',
      byRating: 'По рейтинг�� ↓',
      byDate: 'По дате ↓',
      onlyWithProblems: 'Только с проблемами речи / поведения',
      rating: 'Рейтинг',
      keySignals: 'Ключевые сигналы',
      actions: 'Действия',
      communication: 'Рейтинг',
      communicationAndAnswers: 'Коммуникация\nи ответы',
      details: 'Подробнее',
      candidatesNotFound: 'Кандидаты не найдены',
      candidatesNotFoundDesc: 'Попробуйте изменить параметры фильтрации',
      resetFilters: 'Сбросить фильтры',
      clearSpeech: 'Чётко формулирует мысли',
      professionalLexicon: 'Профессиональная лексика',
      relevantExperience: 'Релевантный опыт',
      standardAnswers: 'Стандартные ответы',
      uncertainAnswers: 'Неуверенность в ответах',
      requiresClarification: 'Требует уточнений',
      incoherentSpeech: 'Несвязная речь',
      avoidsQuestions: 'Уходит от вопросов',
      tooBriefAnswers: 'Слишком краткие ответы',
      detailedAnswers: 'Развёрнутые ответы',
      directLink: 'Прямая ссылка',
      csvHeaders: {
        name: 'Имя',
        email: 'Email',
        rating: 'Рейтинг',
        status: 'Статус',
        position: 'Позиция',
        date: 'Дата',
        duration: 'Длительность',
      },
      disclaimerTitle: '⚠️ Сервис не принимает решение за работодателя',
      disclaimerText: 'Резуль��аты — вспомогательный инструмент для первичного отбора. Финальное решение о найме принимает HR-специалист или руководитель.',
    },
    sessionView: {
      interview: 'Интервью',
      analyzing: 'Анализирую ответ',
      speaking: 'София говорит',
      youSpeaking: 'Вы отвечаете',
      complete: 'Интервью завершено!',
      completeMessage: 'Спасибо за ваше время. Мы свяжемся с вами в ближайшее время.',
      thankYou: 'Спасибо!',
      backToDashboard: 'Вернуться в личный кабинет',
      // New additions for SessionView
      duration: 'Длительность',
      level: 'Уровень',
      beginner: 'Начальный',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      questionsCount: 'Вопросов',
      joinInterview: 'Войти в интервью',
      goBack: 'Вернуться назад',
      participants: 'Участники',
      transcript: 'Транскрипт',
      settings: 'Настройки',
      recruiter: 'Рекрутер',
      candidate: 'Кандидат',
      you: 'Вы',
      sofia: 'София',
      micOff: 'Микрофон выкл',
      recording: 'Запись ответа...',
      endCall: 'Конец',
      mic: 'Mic',
      turnOn: 'Вкл',
      speaking2: 'говорит',
      answer: 'ОТВЕТ',
      stopRecording: 'Остановить запись',
      enableMic: 'Включите микрофон',
      waitForResponse: 'Подождите ответа',
      pressToAnswer: 'Нажмите для ответа',
      twoParticipants: '2 участника',
      dialogTranscript: 'Транскрипт диалога',
      speaking3: 'ГОВОРЮ',
      minutes: 'минут',
      // Greetings
      greetingScreening: 'Здравствуйте! Я проведу с вами интервью на позицию "{position}". Готовы начать?',
      greetingFriendly: 'Привет! Я твой AI-тьютор. Рад помочь тебе и��учить "{topic}". Готов начать?',
      greetingProfessional: 'Здравствуйте. Я готов провести занятие по теме "{topic}". Приступ��м к обучению.',
      greetingMotivating: 'Отлично! Сегодня мы освоим "{topic}". Уверен, у тебя всё получится! Поехали!',
      readyToStart: 'Готовы начать?',
      // AI responses
      userSampleMessage: 'Расска��у о своем опыте работы...',
      aiResponse1: 'Отличный вопрос! Давай разберём это подробнее...',
      aiResponse2: 'Понимаю твой интерес. В контексте "{topic}" это работает так...',
      aiResponse3: 'Хороший момент для практики. Попробуем разоб��ать пример...',
      aiResponse4: 'Именно! И это напрямую связано с нашей целью обучения.',
      aiResponse5: 'Интересное наблюдение! Это важный аспект темы "{topic}".',
      aiResponse6: 'Да, верно! Продолжай в том же духе, у тебя отлично получается!',
      aiFinalQuestion: 'Отлично! Спасибо за ваши ответы. У вас есть вопросы ко мне?',
      // Summary
      summaryScreening: 'Интервью завершено. Кандидат ответил на все вопросы и продемонстрировал соответствующие навыки.',
      summaryLearning: 'Учебная сессия завершена. Студент активно участвовал в диалоге и показал хорошее понимание материала.',
    },
    evaluation: {
      title: 'Результаты интервью',
      overallRating: 'Общая оценка',
      strengths: 'Сильные стороны',
      weaknesses: 'Области для улучшения',
      recommendation: 'Рекомендация',
      communication: 'Коммуникация',
      professionalism: 'Профессионализм',
      problemSolving: 'Решение проблем',
      experience: 'Опыт',
      transcription: 'Расшифровка диалога',
      download: 'Скачать отчет',
      back: 'Назад',
    },
    candidatesDemoList: {
      backButton: 'Вернуться на главную',
      title: 'Примеры оценки кандидатов',
      subtitle: 'Посмотрите, как выглядит оценка разных типов кандидатов после интервью',
      readyStatus: 'Готов к найму',
      notReadyStatus: 'Не готов к найму',
      interviewDate: 'Дата интервью',
      infoTitle: '💡 Это демо-примеры',
      infoDescription: 'Нажмите на любого кандидата, чтобы увидеть детальную оценку. В реальной системе здесь будут ваши кандидаты после прохождения AI-интервью.',
      // Candidate 1
      candidate1Name: 'Анна Соколова',
      candidate1Position: 'Официант',
      candidate1Date: '15 января 2026',
      candidate1Summary: 'Демонстрирует уверенность в общении, хороший опыт работы с гостями',
      candidate1Strength1: 'Опыт работы',
      candidate1Strength2: 'Стрессоустойчивость',
      candidate1Strength3: 'Эмпатия',
      // Candidate 2
      candidate2Name: 'Дмитрий Петров',
      candidate2Position: 'Бариста',
      candidate2Date: '14 января 2026',
      candidate2Summary: 'Недостаточно опыта работы с клиентами, нужно дополнительное обучение',
      candidate2Concern1: 'Минимальный опыт',
      candidate2Concern2: 'Неуверенность в ответах',
      candidate2Concern3: 'Нет примеров',
      // Candidate 3
      candidate3Name: 'Елена Иванова',
      candidate3Position: 'Оператор call-центра',
      candidate3Date: '13 января 2026',
      candidate3Summary: 'Слабая коммуникация, короткие ответы без конкретики',
      candidate3Concern1: 'Слабая коммуникация',
      candidate3Concern2: 'Односложные ответы',
      candidate3Concern3: 'Нет инициативы',
      // Candidate 4
      candidate4Name: 'Максим Новиков',
      candidate4Position: 'Администратор отеля',
      candidate4Date: '12 января 2026',
      candidate4Summary: 'Проблемы со стрессоустойчивостью, не справился с симуляцией',
      candidate4Concern1: 'Низкая стрессоустойчивость',
      candidate4Concern2: 'Нет плана действий',
      candidate4Concern3: 'Теряется в ситуациях',
    },
  },
  en: {
    nav: {
      forCandidates: 'For Candidates',
      forOrganizers: 'For Organizers',
      aiInterview: 'AI Interview',
    },
    header: {
      organizerDashboard: 'Organizer Dashboard',
      candidateDashboard: 'Candidate Dashboard',
      organizer: 'Organizer',
      candidate: 'Candidate',
    },
    hero: {
      badge: 'AI for Recruiting',
      title: 'ScreenMe: Testing Skills, Not Resumes',
      subtitle: 'AI screening for mass positions and expert tech audit for IT teams. Get ready finalists instead of hundreds of empty applications.',
      ctaPrimary: 'Screening + Expert Tech Interview Turnkey',
      ctaSecondary: 'Login to Organizer Dashboard',
      stat1Value: '92%',
      stat1Label: 'Candidate Assessment Accuracy',
      stat2Value: '5-7 min',
      stat2Label: 'Average Interview Time',
      stat3Value: '24/7',
      stat3Label: 'Automated Screening',
    },
    choice: {
      badge: 'Choose Your Direction',
      title: 'Two Hiring Formats — One Platform',
      massCard: {
        title: 'Mass Recruitment',
        subtitle: 'Mass Hiring Automation',
        feature1: 'AI screening 24/7 without HR involvement',
        feature2: 'Assessment of adequacy and communication skills',
        feature3: 'Simulation of real work situations',
        price: 'from $2 per interview',
        button: 'Setup Mass Interview',
      },
      itCard: {
        title: 'IT Recruitment',
        subtitle: 'Expert Tech Screening',
        feature1: 'AI pre-screening + Live tech interview with Senior expert',
        feature2: 'Experts from BigTech (Yandex, Sber, T-Bank)',
        feature3: 'Deep Hard Skills audit',
        price: 'custom pricing',
        button: 'Connect IT Experts',
      },
    },
    reportComparison: {
      badge: 'Assessment Results',
      title: 'Reports for Each Hiring Scenario',
      subtitle: 'From basic screening to deep tech audit',
      massReport: {
        title: 'Report: Front-line Staff',
        metric1: 'Communication',
        metric2: 'Stress Resistance',
        metric3: 'Punctuality',
      },
      itReport: {
        title: 'Report: IT Specialist',
        metric1: 'Code Quality',
        metric2: 'System Design',
        metric3: 'Problem Solving',
        videoLink: 'Tech review video excerpt',
      },
    },
    experts: {
      badge: 'Who Reviews',
      title: 'IT Interviewers are Tech Leads from Top Companies',
      subtitle: 'Verify Hard Skills and provide detailed feedback',
      expert1Name: 'Alexey Smirnov',
      expert1Role: 'Senior Backend Engineer',
      expert1Company: 'Yandex',
      expert2Name: 'Maria Petrova',
      expert2Role: 'Tech Lead Frontend',
      expert2Company: 'Sber',
      expert3Name: 'Dmitry Kozlov',
      expert3Role: 'Principal Architect',
      expert3Company: 'T-Bank',
    },
    demo: {
      aiInterview: 'AI Interview',
      recruiterName: 'Sofia',
      recruiterRole: 'AI Recruiter',
      you: 'You',
      candidate: 'Candidate',
      analyzing: 'Analyzing...',
      speaking: 'Sofia is speaking',
      youSpeaking: 'You are responding',
      greeting: 'Hello! My name is Sofia, I will conduct an interview with you. Please tell me about your customer service experience.',
      listening1: 'I worked in a cafe...',
      question1: 'Great! What difficult situations have you encountered when communicating with guests?',
      listening2: 'There was a case with an unhappy customer...',
      question2: 'Thank you! What would you do if a guest complains about a cold dish?',
      listening3: 'I would apologize and offer...',
      complete: 'Excellent! Interview completed.',
    },
    journey: {
      badge: 'User Journey',
      title: 'From setup to hiring in 4 steps',
      description: 'Simple and clear process for automating employee recruitment',
      step1Badge: 'STEP 1',
      step1Title: 'Configure scenario for your stack or position',
      step1Description: 'Configure AI for any task: from service skills assessment ("difficult client" case) to deep tech screening (Code Review based on your stack: Python, Go, SQL, etc.)',
      step1Time: 'Takes 2-3 minutes',
      step1Questions: 'Questions list',
      step1QuestionsDesc: 'Mass hiring: Experience, motivation, "Conflict" case',
      step1Simulation: 'For IT',
      step1SimulationDesc: 'IT hiring: Algorithms, architecture, System Design',
      step2Badge: 'STEP 2',
      step2Title: 'Launch candidate flow',
      step2Description: 'Send link to finalists after first filter or post in job description on specialized resources (job boards, Habr, GetIT). Candidate starts dialogue in one click.',
      step2LinkLabel: 'UNIQUE LINK',
      step2QrLabel: 'QR CODE FOR OFFLINE',
      step2QrDesc: 'Print and place in the office',
      step2PlaceIn: 'Place in:',
      step2Place1: '• Job description on job boards',
      step2Place2: '• Email to candidates',
      step2Place3: '• Company social media',
      step2Place4: '• QR codes in office or booth',
      step2Mobile: 'Works on any mobile device',
      step2QrOffline: 'QR codes for offline recruiting',
      step2NoApp: 'No app installation required',
      step3Badge: 'STEP 3',
      step3Title: 'AI conducts deep interview',
      step3Description: 'AI leads live dialogue, adapting to answers. It doesn\'t just read a list, but "digs" deeper: asks for practical examples, explanation of solution logic, or role-plays work situations (from retail floor conflict to architecture debate). AI understands professional slang and technical terms.',
      step3Voice: 'Voice dialogue in real time',
      step3Scenario: 'Client role-playing simulation',
      step3Analysis: 'Automatic answer analysis',
      step3Time: 'Average time: 5-7 minutes',
      step4Badge: 'STEP 4',
      step4Title: 'Get expert report and rating',
      step4Description: 'Auto-rating for mass positions (work readiness, soft skills) or tech audit for IT (detailed competency matrix). For complex vacancies, our expert joins at this stage to conduct final live interview based on AI data.',
      step4Auto: 'Automatic candidate sorting',
      step4Analytics: 'Detailed analytics for each',
      step4Recording: 'Recording and transcript for final review',
    },
    industries: {
      badge: 'Industries',
      title: 'For any industry with mass hiring',
      description: 'ScreenMe adapts to the specifics of your business',
      callCenter: 'Call Centers',
      callCenterDesc: 'Testing communication skills, objection handling, and stress resistance',
      hotel: 'Hotels',
      hotelDesc: 'Evaluating hospitality, etiquette, and solving non-standard situations',
      cafe: 'Cafes and Restaurants',
      cafeDesc: 'Testing guest service and teamwork',
      salon: 'Beauty Salons',
      salonDesc: 'Checking customer focus and professional communication',
    },
    features: {
      badge: 'Features',
      title: 'Everything you need for quality hiring',
      description: 'Modern AI technologies for candidate evaluation',
      scenario: 'Scenario-based interviews',
      scenarioDesc: 'AI simulates real work situations according to your scenario',
      analysis: 'Automatic analysis',
      analysisDesc: 'Evaluation by skills, experience and soft skills',
      voice: 'Voice interview',
      voiceDesc: 'Natural dialogue without text fields',
      rating: 'Candidate ranking',
      ratingDesc: 'Automatic sorting from best to worst',
      transcription: 'Full transcription',
      transcriptionDesc: 'Text and recording of each interview for review',
      filter: 'Smart filtering',
      filterDesc: 'Early-stage filtering of unsuitable candidates',
    },
    howItWorks: {
      badge: 'Work Process',
      title: 'From Setup to Decision in 4 Steps',
      description: 'From simple scripts for front-line staff to complex technical checklists for engineers',
      step1: 'Configure Scenario for Your Stack or Position',
      step1Desc: 'Configure AI for any task: from service skills assessment ("difficult client" case) to deep tech screening (Code Review based on your stack: Python, Go, SQL, etc.)',
      step1ExampleMass: 'Mass hiring: Experience, motivation, "Conflict" case',
      step1ExampleIT: 'IT hiring: Algorithms, architecture, System Design',
      step2: 'Launch Candidate Flow',
      step2Desc: 'Send link to finalists after first filter or post in job description on specialized resources (hh.ru, Habr, GetIT). Candidate starts dialogue in one click.',
      step3: 'AI Conducts Deep Interview',
      step3Desc: 'AI leads live dialogue, adapting to answers. It doesn\'t just read a list, but "digs" deeper: asks for practical examples, explanation of solution logic, or role-plays work situations (from retail floor conflict to architecture debate). AI understands professional slang and technical terms.',
      step3Example: '"You mentioned using Kafka. In which cases would you prefer it over RabbitMQ?"',
      step4: 'Get Expert Report and Rating',
      step4Desc: 'Auto-rating for mass positions (work readiness, soft skills) or tech audit for IT (detailed competency matrix). For complex vacancies, our expert joins at this stage to conduct final live interview based on AI data.',
    },
    evaluationPreview: {
      badge: 'Smart Analytics',
      title: 'Candidate Assessment Screen',
      subtitle: 'with practical examples',
      description: 'Clear assessment with specific examples from the dialogue. Strengths, areas of attention and recommendations for action — all the information for quick hiring decisions.',
      feature1Title: 'Work Readiness',
      feature1Desc: 'Brief summary of behavior in standard and complex situations',
      feature2Title: 'Key Observations',
      feature2Desc: 'Descriptive formulations without value judgments',
      feature3Title: 'Recording and Text',
      feature3Desc: 'Listen to the recording or read the full dialogue',
      viewExample: 'View Example',
      tabMass: 'Mass Hiring',
      tabIT: 'IT Specialists',
      // Mock preview card
      massName: 'Anna Ivanova',
      massPosition: 'Waiter',
      massExperience: '4 years experience',
      itName: 'Alexey Volkov',
      itPosition: 'Senior Go Developer',
      itExperience: '7 years experience',
      overallRating: 'Overall Rating',
      readyForWork: 'Ready for work',
      strongHire: 'Strong Hire',
      communication: 'Communication',
      stressResistance: 'Stress Resistance',
      workExperience: 'Work Experience',
      motivation: 'Motivation',
      listen: 'Listen',
      text: 'Text',
      recommendedMass: '✓ Recommended for hiring',
      recommendedIT: '✓ Recommended (Strong Hire)',
      recommendationTextMass: 'Experienced specialist with good communication skills and ability to work in stressful situations.',
      recommendationTextIT: 'Deep knowledge of Go runtime and distributed systems design skills. Confidently argues technology choices.',
    },
    bottomSummary: {
      title: 'Fast and Fair Assessment of Every Candidate',
      description: 'AI helps determine compliance with requirements and gives everyone equal opportunities. Candidates get a quick response, and HR saves up to 70% of time on initial screening.',
      feature1: 'Real Skills Assessment',
      feature2: 'No Cold Calls',
      feature3: 'Without Waiting for Responses',
    },
    step3Details: {
      aiAssistant: 'AI ASSISTANT',
      conducting: 'Conducting interview...',
      question: 'You mentioned using Kafka. In which cases would you prefer it over RabbitMQ?',
      recording: 'Recording',
      active: 'Active',
      analysis: 'Analysis',
      realtime: 'Real-time',
    },
    demoDetails: {
      candidateInitial: 'K',
      speaking: 'SPEAKING',
      topCandidates: 'TOP CANDIDATES',
      clearFormulations: 'Clear formulations',
      expertReview: 'Expert Review • 1h 15min',
      candidateName1: 'Anna Petrova',
      candidateName2: 'Ivan Sidorov',
      candidateName3: 'Maria Ivanova',
      scoreExcellent: 'Excellent',
      scoreGood: 'Good',
      scoreAverage: 'Average',
      freeStartBold: 'Start for free:',
      freeStartText: 'First 10 interviews as a gift. Evaluate screening quality, see detailed analytics and feel the difference in the first week.',
    },
    additionalBenefits: {
      turnoverReductionTitle: 'Reduced Turnover by 40%',
      turnoverReductionDesc: 'Realistic interview scenarios show candidates real tasks. Less disappointment after hiring.',
      quickLaunchTitle: 'Launch in 5 minutes without integrations',
      quickLaunchDesc: 'Register, describe the job, send a link to candidates. No complex settings or installations.',
    },
    faqDetails: {
      badge: 'Q&A',
      subtitle: 'Answers to key questions about ScreenMe',
    },
    securityDetails: {
      feature1Title: 'Why Choose ScreenMe',
      feature1Desc: 'Real benefits for your business',
      timeSavingTitle: '10x HR Time Savings',
      timeSavingDesc: 'AI conducts initial screening 24/7, you only work with ready candidates. Close vacancies 3 times faster.',
      objectiveTitle: 'Objective Assessment Without Bias',
      objectiveDesc: 'AI analyzes only professional skills, communication and stress resistance. Uniform standards for all candidates.',
    },
    security: {
      badge: 'Security',
      title: 'Data privacy',
      description: 'All candidate data is securely protected',
      privacy: 'Privacy',
      privacyDesc: 'Candidate data is not shared with third parties',
      secure: 'Secure storage',
      secureDesc: 'Interview recordings are stored encrypted',
    },
    cta: {
      title: 'Ready to automate hiring?',
      title2: 'Start saving HR time today',
      description: 'Set up an AI interview in 2 minutes and get your first candidates',
      button: 'Start for Free',
      demo: 'Watch Demo',
      setupInterview: 'Set Up Interview',
      tryDemoInterview: 'Try Demo Interview',
    },
    faq: {
      title: 'Frequently Asked Questions',
      q1: 'How do experts verify Hard Skills for IT candidates?',
      a1: 'IT experts from BigTech companies conduct live technical interviews: code review, system design, algorithmic tasks. Each expert specializes in their tech stack and has 5+ years of experience.',
      q2: 'Can AI be fooled during mass interview?',
      a2: 'No. AI analyzes not only text responses, but also intonation, pauses, speech confidence, and logical consistency. The system detects prepared answers and context mismatch.',
      q3: 'What is the difference between mass interview and IT interview?',
      a3: 'Mass interview is fully automated AI screening to assess basic skills (communication, adequacy). IT interview includes AI pre-screening + live tech interview with Senior expert for deep verification of technical competencies.',
      q4: 'How quickly will I get results?',
      a4: 'Mass AI interview is processed instantly — report is ready immediately after completion. IT interview with expert — within 24 hours after conducting.',
      q5: 'Can I watch interview recordings?',
      a5: 'Yes, all interviews are recorded and transcribed. You can listen to audio, read text transcription, and for IT interviews — watch video excerpts with key moments.',
      q6: 'How much does the service cost?',
      a6: 'Mass interview — from $2 per candidate. IT interview with expert — custom pricing depending on stack and seniority level. Contact us for calculation.',
    },
    footer: {
      contact: 'Contact Us',
      description: 'AI interviews for mass hiring',
      email: 'Email',
      phone: 'Phone',
      rights: '© 2024 ScreenMe. All rights reserved.',
      forOrganizers: 'For Organizers',
      forCandidates: 'For Candidates',
      demoEvaluation: 'Demo Evaluation',
    },
    contact: {
      title: 'Contact Us',
      description: 'Fill out the form and we will contact you soon',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send',
      close: 'Close',
    },
    login: {
      organizerTitle: 'Organizer Login',
      candidateTitle: 'Candidate Login',
      organizerDesc: 'Manage interviews and results',
      candidateDesc: 'Take the interview',
      login: 'Login',
      signup: 'Sign Up',
      back: 'Back',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      loginButton: 'Login',
      signupButton: 'Sign Up',
      haveAccount: 'Already have an account?',
      noAccount: 'Don\'t have an account?',
      loginLink: 'Login',
      signupLink: 'Sign Up',
      forOrganizers: 'For Organizers',
      forCandidates: 'For Candidates',
      personalization: 'Interview Personalization',
      personalizationDesc: 'Customize questions and scenarios for your company',
      quickStart: 'Quick Start',
      quickStartDesc: 'Create your first interview in 3 minutes',
      analytics: 'Interview Analytics',
      analyticsDesc: 'Get detailed reports on candidates',
    },
    dashboard: {
      welcome: 'Welcome',
      logout: 'Logout',
      createInterview: 'Create Interview',
      activeInterviews: 'Active Interviews',
      completedInterviews: 'Completed Interviews',
      totalCandidates: 'Total Candidates',
      myInterviews: 'My Interviews',
      noCandidates: 'No candidates yet',
      viewResults: 'View Results',
      openInterview: 'Open Interview',
      candidates: 'Candidates',
      links: 'Links',
      settings: 'Settings',
    },
    organizerDashboard: {
      totalInterviews: 'Total Interviews',
      candidatesPassed: 'Candidates Passed',
      recommendedShare: 'Recommended',
      recommendedShareDesc: 'Percentage of candidates recommended for hiring',
      candidatesLabel: 'candidates',
      managementTab: 'Management',
      testInterviewsTab: 'Test Interviews',
      testInterviewsTabShort: 'Tests',
      candidatesTab: 'Candidates',
      manageTitle: 'Interview Management',
      manageDesc: 'Create and manage primary interviews for candidate pre-screening',
      manageNote: 'Interviews help reduce manual screening and do not replace HR decisions',
      testInterviewsTitle: 'Test Interviews',
      testInterviewsDesc: 'Used for scenario testing. Candidates from test interviews are not included in statistics.',
      candidatesStatsTitle: 'Candidate Statistics',
      candidatesStatsDesc: 'Detailed statistics on all candidates',
      loadingCandidates: 'Loading...',
      loadingCandidatesDesc: 'Fetching candidates list',
      createFirstInterview: 'Create your first interview',
      createFirstInterviewDesc: 'Set up an AI interview for candidate selection and get a link to share',
      createButton: 'Create Interview',
      jobLabel: 'Position',
      checkingLabel: 'What we check',
      createdLabel: 'Created',
      reusableLabel: 'Reusable',
      noInterviews: 'No available interviews',
      noInterviewsDesc: 'Create an interview to test it in demo mode',
      russian: 'Russian',
      english: 'English',
      situationModeling: 'Situation Modeling',
      support: 'Support',
      qrCodeTitle: 'QR Code for Interview',
      qrCodeDesc: 'Create and download QR codes for interviews',
      interviewLink: 'Interview Link:',
      copyLink: 'Copy link',
      downloadQR: 'Download QR Code',
      print: 'Print',
      qrCodePlacement: 'Place the QR code in the office, on a stand, or in printed materials. Candidates can scan it with their phone and start the interview immediately.',
      uniqueLinks: 'Unique Links',
      testLink: 'Test Link',
      copied: 'Copied!',
      passInterview: 'Take Interview',
      testLabel: 'TEST',
      beginnerLevel: 'Beginner',
      intermediateLevel: 'Intermediate',
      advancedLevel: 'Advanced',
      level: 'level',
      minutes: '7–10 minutes',
      supportTitle: 'Support',
      supportSubtitle: 'Contact CEO',
      contactCEO: 'Contact Management',
      chooseContact: 'Choose a convenient way to contact',
      telegram: 'Telegram',
      telegramDesc: 'Main way of communication — we respond fastest',
      callPhone: 'Call',
      leaveContact: 'Leave contact',
      leaveContactDesc: 'If it\'s not convenient now — leave a number or email',
      yourName: 'Your Name',
      phone: 'Phone',
      emailOptional: 'Email (optional)',
      describeIssue: 'Describe your problem or question',
      send: 'Send',
      thankYouMessage: 'Thank you! We will contact you shortly.',
      questions: 'questions',
    },
    interviewForm: {
      title: 'Create AI Interview',
      subtitle: 'Set up interview in 2 minutes',
      close: 'Close',
      jobInfoTitle: 'Job Information',
      jobInfoDesc: 'Used for proper formulation of questions and interview scenarios',
      jobTitle: 'Job Title',
      jobTitleRequired: '*',
      jobTitlePlaceholder: 'For example: Receptionist / Waiter / Call Center Operator',
      companyName: 'Company Name',
      companyPlaceholder: 'For example: IT Solutions',
      aiGenerationTitle: '✨ AI Generation',
      aiGenerationDesc: 'Describe the vacancy — AI will create questions, clarifications and scenario automatically',
      jobDescription: 'Job Description',
      jobDescriptionPlaceholder: 'For example: Looking for call center operator to handle incoming calls. Requirements: customer service experience, stress resistance, clear speech. Responsibilities: answering calls, consulting customers, CRM work.',
      generateQuestions: 'Generate Questions',
      generating: 'Generating...',
      questionsTitle: 'Basic Questions for Initial Screening',
      questionsDesc: 'These questions help assess communication, experience and candidate motivation',
      questionPlaceholder: 'Enter question',
      canEdit: 'Can be edited for your vacancy',
      addClarifying: 'Add',
      clarifyingPlaceholder: 'For example: Can you tell more about this experience?',
      clarifyingDesc: 'The bot can ask these questions to clarify candidate\'s answer',
      addQuestion: 'Add Question',
      addQuestionPlaceholder: 'Add your question...',
      recommended: 'Recommended 3–6 questions',
      dynamicQuestionsTitle: 'Additional Questions at Bot\'s Discretion',
      dynamicQuestionsDesc: 'The bot can ask additional questions during the dialogue based on candidate\'s answers for deeper understanding of their experience and competencies',
      simulationTitle: 'Real Work Situation Modeling (optional)',
      simulationDesc: 'Used to assess candidate\'s reaction in stressful situations',
      scenarioLabel: 'Scenario Description',
      scenarioPlaceholder: 'Briefly describe the situation the candidate may face at work',
      roleLabel: 'Customer Role',
      rolePlaceholder: 'For example: upset customer, guest, client',
      exampleDialogTitle: 'Example Dialogue Fragment',
      exampleCustomerMessage: '"Hello! I\'ve been WAITING for my order for a week! You promised 3 days, but it\'s been SEVEN! This is outrageous! Where is my order?!"',
      exampleCandidateMessage: 'I understand your frustration. Let me check your order status right now. Could you provide the order number?',
      exampleNote: 'Example is provided for format understanding. Real dialogue is generated automatically.',
      howItWorksTitle: 'How it works:',
      howItWorksStep1: 'Candidate answers basic questions',
      howItWorksStep2: 'System models work situation',
      howItWorksStep3: 'You receive recording and brief summary for selection',
      create: 'Create Interview',
      cancel: 'Cancel',
      alertJobTitle: 'Please specify job title',
      alertQuestions: 'Please add at least one question',
      alertJobDescription: 'Please specify job description',
      successMessage: '✨ Questions, clarifying sub-questions and scenario successfully generated!',
      errorGenerate: 'Error generating. Please try again.',
    },
    candidateEvaluation: {
      backToList: 'Back to list',
      aiInterviewer: 'AI Interviewer',
      fullDialog: 'Full Dialogue',
      listen: 'Listen',
      pause: 'Pause',
      play: 'Play',
      interviewSummary: 'Initial Interview Summary',
      status: 'Status',
      recommendedToNext: 'Recommended for next stage',
      needsClarification: 'Needs clarification',
      notRecommended: 'Not recommended',
      outOf10: 'out of 10',
      interviewScore: 'Interview Score',
      notHiringDecision: '(not a hiring decision)',
      basedOnAnswers: 'Based on answers and speech during initial interview',
      keySignals: 'Key Signals',
      whatConfirmed: 'What Was Confirmed',
      whatToPayAttention: 'What to Pay Attention To',
      recommendedToCheck: 'Recommended to Check at Next Stage',
      hrMarksItems: 'HR specialist marks items to check independently',
      answersToQuestions: 'Answers to Questions',
      speechAnalytics: 'Speech Style Analytics',
      detail: 'Detail',
      structure: 'Structure',
      relevance: 'Relevance',
      high: 'high',
      medium: 'medium',
      low: 'low',
      ratedRelativeToRole: 'Rating given relative to typical answers for this role',
      realSituationSimulation: 'Real stressful customer situation simulated',
      stressfulSituation: '💬 Real stressful customer situation simulated',
      aiPlayedRole: 'AI played the role of an aggressive customer dissatisfied with long wait',
      dialogWithClient: 'Dialogue with Customer',
      aiClient: 'AI (customer)',
      aggressive: 'aggressive',
      calm: 'calm',
      simulationSummary: 'Simulation Summary:',
      disclaimer: '⚠️ Interpretation based on speech patterns, does not replace manager assessment',
      close: 'Close',
      summaryRecommended: 'Candidate confidently handled typical customer situations. Communication is clear, handles stress well. There are nuances in expressing empathy — recommended to clarify in person.',
      summaryNeedsClarification: 'Candidate showed basic customer service skills. Answers sometimes brief, require clarification. Additional check of experience and empathy skills recommended at next stage.',
      summaryNotRecommended: 'Candidate demonstrates insufficient communication level for this role. Incoherent answers, formulation difficulties. Recommended to consider other candidates or offer training.',
      signalsCalmUnderPressure: 'Reacts calmly to pressure',
      signalsConcreteActions: 'Provides concrete solutions',
      signalsProfessionalVocabulary: 'Uses professional vocabulary',
      signalsExamplesFromExperience: 'Provides examples from experience',
      signalsUnderstandsQuestions: 'Understands question essence',
      signalsTriesToSolve: 'Tries to find solution',
      signalsNoAggression: 'Shows no aggression',
      signalsCompletesInterview: 'Completes interview',
      signalsAnswersQuestions: 'Answers questions',
      attentionLacksEmpathy: 'Sometimes moves to process without empathy',
      attentionMissedEmpathyFirst: 'Missed expressing sympathy in first response',
      attentionBriefAnswers: 'Answers briefly, requires clarification',
      attentionNoExamples: 'Not always provides specific examples',
      attentionCheckConflicts: 'Check conflict resolution experience',
      attentionIncoherentSpeech: 'Incoherent speech',
      attentionAvoidsAnswers: 'Avoids direct answers',
      attentionFormulationDifficulties: 'Formulation difficulties',
      attentionLowStressResistance: 'Low stress resistance',
      checkEmpathyFormat: 'Clarify empathy expression format in stressful situations',
      checkRealCases: 'Check real cases from past experience',
      checkExpectations: 'Discuss schedule and development expectations',
      checkSimilarExperience: 'Clarify experience in similar situations',
      checkTrainingReadiness: 'Check training readiness',
      checkProblemSolving: 'Discuss specific problem-solving examples',
      checkMotivation: 'Identify motivation and long-term plans',
      checkBasicTraining: 'Assess basic training possibility',
      checkAlternativePositions: 'Consider alternative positions',
      checkWorkMotivation: 'Check motivation to work in this field',
      simulationKeptCalm: 'Kept calm',
      simulationOfferedCompensation: 'Offered compensation',
      simulationLackedEmpathy: 'Lacked empathy at the beginning',
    },
    candidatesTab: {
      noResults: 'No Results',
      noResultsDesc: 'AI interview results will appear here after candidates complete them',
      vacancy: 'Vacancy',
      candidates: 'candidates',
      candidate: 'candidate',
      candidatesGenitive: 'candidates',
      recommended: 'recommended',
      recommendedStatus: 'Recommended',
      questionable: 'Questionable',
      questionableStatus: 'Questionable',
      notRecommended: 'Not recomm.',
      notRecommendedStatus: 'Not recommended',
      searchPlaceholder: 'Search by name or email...',
      export: 'Export',
      status: 'Status',
      all: 'All',
      minRating: 'Min. rating',
      allRatings: '(all)',
      aboveAverage: '(above average)',
      strong: '(strong)',
      top: '(top)',
      sorting: 'Sorting',
      byRating: 'By rating ↓',
      byDate: 'By date ↓',
      onlyWithProblems: 'Only with speech / behavior problems',
      rating: 'Rating',
      keySignals: 'Key Signals',
      actions: 'Actions',
      communication: 'Rating',
      communicationAndAnswers: 'Communication\nand answers',
      details: 'Details',
      candidatesNotFound: 'Candidates not found',
      candidatesNotFoundDesc: 'Try changing filter parameters',
      resetFilters: 'Reset filters',
      clearSpeech: 'Clearly articulates thoughts',
      professionalLexicon: 'Professional lexicon',
      relevantExperience: 'Relevant experience',
      standardAnswers: 'Standard answers',
      uncertainAnswers: 'Uncertainty in answers',
      requiresClarification: 'Requires clarification',
      incoherentSpeech: 'Incoherent speech',
      avoidsQuestions: 'Avoids questions',
      tooBriefAnswers: 'Too brief answers',
      detailedAnswers: 'Detailed answers',
      directLink: 'Direct link',
      csvHeaders: {
        name: 'Name',
        email: 'Email',
        rating: 'Rating',
        status: 'Status',
        position: 'Position',
        date: 'Date',
        duration: 'Duration',
      },
      disclaimerTitle: '⚠️ Service does not make decisions for employer',
      disclaimerText: 'Results are a supporting tool for initial screening. Final hiring decision is made by HR specialist or manager.',
    },
    sessionView: {
      interview: 'Interview',
      analyzing: 'Analyzing response',
      speaking: 'Sofia is speaking',
      youSpeaking: 'You are responding',
      complete: 'Interview completed!',
      completeMessage: 'Thank you for your time. We will contact you soon.',
      thankYou: 'Thank you!',
      backToDashboard: 'Back to Dashboard',
      // New additions for SessionView
      duration: 'Duration',
      level: 'Level',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      questionsCount: 'Questions',
      joinInterview: 'Join Interview',
      goBack: 'Go Back',
      participants: 'Participants',
      transcript: 'Transcript',
      settings: 'Settings',
      recruiter: 'Recruiter',
      candidate: 'Candidate',
      you: 'You',
      sofia: 'Sofia',
      micOff: 'Mic Off',
      recording: 'Recording response...',
      endCall: 'End',
      mic: 'Mic',
      turnOn: 'On',
      speaking2: 'speaking',
      answer: 'ANSWER',
      stopRecording: 'Stop recording',
      enableMic: 'Enable microphone',
      waitForResponse: 'Wait for response',
      pressToAnswer: 'Press to answer',
      twoParticipants: '2 participants',
      dialogTranscript: 'Dialog Transcript',
      speaking3: 'SPEAKING',
      minutes: 'minutes',
      // Greetings
      greetingScreening: 'Hello! I will conduct an interview with you for the "{position}" position. Ready to start?',
      greetingFriendly: 'Hi! I am your AI tutor. I am glad to help you study "{topic}". Ready to start?',
      greetingProfessional: 'Hello. I am ready to conduct a lesson on "{topic}". Let\'s begin the training.',
      greetingMotivating: 'Excellent! Today we will master "{topic}". I am sure you will succeed! Let\'s go!',
      readyToStart: 'Ready to start?',
      // AI responses
      userSampleMessage: 'I will tell you about my work experience...',
      aiResponse1: 'Great question! Let\'s explore this in more detail...',
      aiResponse2: 'I understand your interest. In the context of "{topic}" this works like this...',
      aiResponse3: 'Good moment for practice. Let\'s try to analyze an example...',
      aiResponse4: 'Exactly! And this is directly related to our learning goal.',
      aiResponse5: 'Interesting observation! This is an important aspect of the "{topic}" topic.',
      aiResponse6: 'Yes, that\'s right! Keep it up, you are doing great!',
      aiFinalQuestion: 'Excellent! Thank you for your answers. Do you have any questions for me?',
      // Summary
      summaryScreening: 'Interview completed. The candidate answered all the questions and demonstrated relevant skills.',
      summaryLearning: 'Learning session completed. The student actively participated in the dialogue and showed good understanding of the material.',
    },
    evaluation: {
      title: 'Interview Results',
      overallRating: 'Overall Rating',
      strengths: 'Strengths',
      weaknesses: 'Areas for Improvement',
      recommendation: 'Recommendation',
      communication: 'Communication',
      professionalism: 'Professionalism',
      problemSolving: 'Problem Solving',
      experience: 'Experience',
      transcription: 'Dialogue Transcription',
      download: 'Download Report',
      back: 'Back',
    },
    candidatesDemoList: {
      backButton: 'Back to main',
      title: 'Candidate Assessment Examples',
      subtitle: 'See how different types of candidates look after the interview',
      readyStatus: 'Ready for hiring',
      notReadyStatus: 'Not ready for hiring',
      interviewDate: 'Interview date',
      infoTitle: '💡 These are demo examples',
      infoDescription: 'Click on any candidate to see detailed assessment. In the real system, your candidates will be here after completing AI interviews.',
      // Candidate 1
      candidate1Name: 'Anna Sokolova',
      candidate1Position: 'Waiter',
      candidate1Date: 'January 15, 2026',
      candidate1Summary: 'Demonstrates confidence in communication, good experience with guests',
      candidate1Strength1: 'Work experience',
      candidate1Strength2: 'Stress resistance',
      candidate1Strength3: 'Empathy',
      // Candidate 2
      candidate2Name: 'Dmitry Petrov',
      candidate2Position: 'Barista',
      candidate2Date: 'January 14, 2026',
      candidate2Summary: 'Insufficient customer service experience, needs additional training',
      candidate2Concern1: 'Minimal experience',
      candidate2Concern2: 'Uncertainty in answers',
      candidate2Concern3: 'No examples',
      // Candidate 3
      candidate3Name: 'Elena Ivanova',
      candidate3Position: 'Call Center Operator',
      candidate3Date: 'January 13, 2026',
      candidate3Summary: 'Weak communication, short answers without specifics',
      candidate3Concern1: 'Weak communication',
      candidate3Concern2: 'One-word answers',
      candidate3Concern3: 'No initiative',
      // Candidate 4
      candidate4Name: 'Maxim Novikov',
      candidate4Position: 'Hotel Administrator',
      candidate4Date: 'January 12, 2026',
      candidate4Summary: 'Problems with stress resistance, failed simulation',
      candidate4Concern1: 'Low stress resistance',
      candidate4Concern2: 'No action plan',
      candidate4Concern3: 'Gets lost in situations',
    },
  },
};

export function useTranslation(language: Language): Translations {
  return translations[language];
}
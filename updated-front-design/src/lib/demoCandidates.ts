// Mock данные для демонстрации разных типов кандидатов

import type { Language } from './i18n';

const demoCandidatesRu = {
  'ready-1': {
    name: 'Анна Соколова',
    position: 'Официант',
    completedAt: '2026-01-15T14:30:00',
    status: 'ready',
    questionsAnalysis: {
      greeting: {
        question: 'Расскажите о себе и вашем опыте работы с гостями',
        answer: 'Здравствуйте! Меня зовут Анна, мне 24 года. Я работала официантом в ресторане "Panorama" два года. У меня был опыт работы с большим потоком гостей, особенно в выходные дни. Я научилась быстро обслуживать столики, запоминать заказы и всегда стараюсь создать приятную атмосферу для гостей. Мне нравится общаться с людьми и помогать им провести время комфортно.',
        analysis: 'Структурированный ответ с конкретными примерами опыта. Упоминает название заведения, срок работы и специфику. Проявляет энтузиазм к работе с людьми.'
      },
      experience: {
        question: 'Опишите ситуацию, когда вам приходилось работать с недовольным гостем',
        answer: 'Был случай, когда гость заказал стейк medium, но получил medium-well. Он был явно расстроен. Я сразу извинилась, не стала спорить или искать оправдания. Спросила, готов ли он подождать новый стейк или предпочтёт что-то другое. Он согласился подождать. Я передала повару, попросила приготовить с приоритетом, а пока гость ждал, принесла комплимент от шефа - брускетту. В итоге гость остался доволен и даже оставил хорошие чаевые.',
        analysis: 'Детальное описание конкретной ситуации с чёткой последовательностью действий. Демонстрирует признание проблемы, эмпатию, инициативу и способность компенсировать неудобство.'
      },
      teamwork: {
        question: 'Как вы работаете в команде в напряжённые моменты?',
        answer: 'В пиковые часы, когда зал полный, очень важна координация. Я всегда предупреждаю коллег, если вижу, что им нужна помощь - например, отнесу их заказ, если иду мимо. Или подстрахую, если кто-то задерживается с кухни. Однажды моя коллега почувствовала себя плохо, и мы с другим официантом разделили её столики. Главное - не паниковать и поддерживать друг друга.',
        analysis: 'Конкретные примеры взаимопомощи. Понимание командной работы. Проактивность и готовность помогать коллегам.'
      }
    },
    simulationAnalysis: {
      role: 'Гость ресторана, который недоволен остывшим блюдом',
      scenario: 'Гость заказал горячее блюдо, но оно пришло чуть тёплым. Он явно расстроен и хочет пожаловаться.',
      behaviorSummary: 'Анна сразу выразила искреннее сожаление и не пыталась оправдываться. Спросила, может ли забрать блюдо и принести новое. Предложила заменить на другое блюдо, если гость не хочет ждать. Извинилась от имени заведения.',
      strengths: [
        'Признание проблемы без оправданий',
        'Предложила конкретные варианты решения',
        'Сохранила спокойствие и вежливость',
        'Взяла инициативу в свои руки'
      ],
      quotes: [
        'Мне очень жаль, что так получилось. Сейчас я заберу блюдо и попрошу повара приготовить новое, это займёт 10 минут.',
        'Или если не хотите ждать, могу предложить другое блюдо, которое готовится быстрее.'
      ],
      recommendation: 'Анна демонстрирует уверенное владение стандартами обслуживания и способность сохранять профессионализм в стрессовых ситуациях. Готова к работе.'
    }
  },
  'not-ready-1': {
    name: 'Дмитрий Петров',
    position: 'Бариста',
    completedAt: '2026-01-14T11:00:00',
    status: 'not-ready',
    questionsAnalysis: {
      greeting: {
        question: 'Расскажите о себе и вашем опыте работы с клиентами',
        answer: 'Ну... Меня зовут Дима. Мне 19 лет. Я учусь в университете. Работал раньше курьером, развозил еду. Ну и общался немного с клиентами, когда доставлял заказы.',
        analysis: 'Очень краткий ответ без деталей. Нет упоминания конкретного опыта работы в кафе или с кофе. Неуверенная речь с паразитами («ну»). Опыт общения с клиентами минимальный и косвенный.'
      },
      experience: {
        question: 'Как бы вы поступили, если клиент жалуется на качество кофе?',
        answer: 'Наверное... попросил бы прощения? И сказал бы, что могу сделать новый кофе. Или позвал бы старшего, если сам не знаю, что делать.',
        analysis: 'Ответ гипотетический, без примеров из практики. Нет чёткого плана действий. Упоминание «позвал бы старшего» показывает неуверенность в собственных силах. Нет попытки выяснить причину недовольства.'
      },
      coffee: {
        question: 'Что вы знаете о приготовлении кофейных напитков?',
        answer: 'Ну, я пью кофе каждый день. Знаю, что есть капучино, латте, эспрессо. В капучино много молока. Эспрессо - это маленькая порция крепкого кофе.',
        analysis: 'Знания на уровне потребителя, не профессионала. Нет упоминания техники приготовления, пропорций, температуры. Нет опыта работы с кофе-машиной.'
      }
    },
    simulationAnalysis: {
      role: 'Клиент кофейни, который жалуется на холодный капучино',
      scenario: 'Клиент получил капучино, но напиток недостаточно горячий. Он явно недоволен.',
      behaviorSummary: 'Дмитрий растерялся и несколько раз извинился, но не предложил конкретное решение сразу. Спросил «что мне сделать?» вместо того, чтобы взять инициативу. После паузы предложил приготовить новый напиток.',
      concerns: [
        'Неуверенность и замешательство',
        'Нет чёткого алгоритма действий',
        'Переспрашивает вместо того, чтобы действовать',
        'Долгие паузы в ответах'
      ],
      quotes: [
        'Извините... Правда очень жаль... Что мне... что мне сделать?',
        'Ну хорошо, я могу сделать вам новый капучино.'
      ],
      recommendation: 'Дмитрий демонстрирует недостаточный опыт работы с клиентами и низкую уверенность. Требуется обучение стандартам обслуживания и работе с кофе-оборудованием. Рекомендуется стажировка под руководством опытного бариста перед самостоятельной работой.'
    }
  },
  'not-ready-2': {
    name: 'Елена Иванова',
    position: 'Оператор call-центра',
    completedAt: '2026-01-13T16:45:00',
    status: 'not-ready',
    questionsAnalysis: {
      greeting: {
        question: 'Расскажите о себе и вашем опыте работы с клиентами',
        answer: 'Елена. 26 лет. Работала в магазине на кассе.',
        analysis: 'Крайне короткий ответ. Нет деталей об опыте, обязанностях, достижениях. Отсутствует инициатива расширить ответ.'
      },
      communication: {
        question: 'Как вы общаетесь с недовольными клиентами?',
        answer: 'Вежливо. Стараюсь помочь.',
        analysis: 'Односложный ответ без конкретики. Нет примеров, техник, подходов. Не раскрывает, как именно помогает.'
      },
      stress: {
        question: 'Как вы справляетесь со стрессом на работе?',
        answer: 'Нормально справляюсь. Не паникую.',
        analysis: 'Общие фразы без примеров. Не описывает конкретные методы или ситуации. Формальный ответ.'
      }
    },
    simulationAnalysis: {
      role: 'Клиент, который не может найти свой заказ на сайте',
      scenario: 'Клиент звонит в поддержку, он раздражён тем, что не может отследить заказ. Нужно помочь решить проблему.',
      behaviorSummary: 'Елена отвечала очень кратко, задавала закрытые вопросы, требующие односложных ответов. Не проявляла эмпатию, не пыталась успокоить клиента. Общение было сухим и формальным.',
      concerns: [
        'Минимальное вербальное взаимодействие',
        'Отсутствие эмпатии и понимания',
        'Нет попыток разрядить ситуацию',
        'Закрытые вопросы вместо открытых'
      ],
      quotes: [
        'Номер заказа?',
        'Понятно. Сейчас проверю.',
        'Система загружается.'
      ],
      recommendation: 'Елена демонстрирует слабые коммуникативные навыки. Отсутствует навык активного слушания и построения диалога. Необходимо обучение технике общения с клиентами, развитие эмпатии и работа над расширением ответов. Не готова к самостоятельной работе на линии.'
    }
  },
  'not-ready-3': {
    name: 'Максим Новиков',
    position: 'Администратор отеля',
    completedAt: '2026-01-12T10:15:00',
    status: 'not-ready',
    questionsAnalysis: {
      greeting: {
        question: 'Расскажите о себе и вашем опыте работы в сфере гостеприимства',
        answer: 'Меня зовут Максим, мне 28 лет. Я закончил курсы гостиничного бизнеса. Пока не работал в отеле, но очень хочу начать. Я ответственный и исполнительный.',
        analysis: 'Образование есть, но нет практического опыта. Ответ содержит общие качества без подтверждения примерами.'
      },
      conflict: {
        question: 'Как бы вы поступили в конфликтной ситуации с гостем?',
        answer: 'Постарался бы решить проблему. Думаю, нужно выслушать гостя и понять, что его не устраивает. А дальше... ну, зависит от ситуации.',
        analysis: 'Теоретический ответ без структуры. Нет конкретного плана действий. Фраза «зависит от ситуации» показывает отсутствие готовых алгоритмов.'
      },
      priorities: {
        question: 'Как вы расставляете приоритеты, когда нужно решить несколько задач одновременно?',
        answer: 'Стараюсь делать всё по порядку. Сначала одно, потом другое. Но если что-то срочное, то конечно займусь этим сразу.',
        analysis: 'Нет системного подхода к приоритизации. Общие фразы без методики.'
      }
    },
    simulationAnalysis: {
      role: 'Агрессивный гость отеля, который требует возврата денег',
      scenario: 'Гость утверждает, что в номере было грязно и требует полный возврат за проживание. Он повышает голос и угрожает оставить негативный отзыв.',
      behaviorSummary: 'Максим заметно растерялся, когда гость повысил голос. Начал оправдываться и обещать, что «такого больше не повторится». Несколько раз повторял одни и те же фразы. Не смог предложить конкретное решение, кроме «я доложу руководству».',
      concerns: [
        'Потеря самообладания в конфликте',
        'Оборонительная позиция вместо решения',
        'Нет плана действий',
        'Перекладывание ответственности на руководство'
      ],
      quotes: [
        'Я не знал... Извините, я не думал, что так может быть...',
        'Это не должно было случиться, простите...',
        'Мне нужно посоветоваться с менеджером, я не могу решить сам.'
      ],
      recommendation: 'Максим не готов к работе с конфликтными ситуациями и стрессовыми клиентами. Отсутствует стрессоустойчивость и уверенность в принятии решений. Требуется тренинг по работе с конфликтами, отработка стандартных сценариев и развитие навыка сохранения спокойствия. Необходим опытный наставник на начальном этапе.'
    }
  }
};

const demoCandidatesEn = {
  'ready-1': {
    name: 'Anna Sokolova',
    position: 'Waiter',
    completedAt: '2026-01-15T14:30:00',
    status: 'ready',
    questionsAnalysis: {
      greeting: {
        question: 'Tell me about yourself and your experience working with guests',
        answer: 'Hello! My name is Anna, I\'m 24 years old. I worked as a waiter at "Panorama" restaurant for two years. I had experience working with high customer flow, especially on weekends. I learned to serve tables quickly, remember orders, and always try to create a pleasant atmosphere for guests. I enjoy communicating with people and helping them have a comfortable time.',
        analysis: 'Structured response with specific examples of experience. Mentions establishment name, duration of work, and specifics. Shows enthusiasm for working with people.'
      },
      experience: {
        question: 'Describe a situation when you had to deal with an unhappy guest',
        answer: 'There was a case when a guest ordered a medium steak but received medium-well. He was clearly upset. I immediately apologized without arguing or making excuses. I asked if he was willing to wait for a new steak or would prefer something else. He agreed to wait. I informed the chef and asked to prepare it with priority, and while the guest waited, I brought a complimentary bruschetta from the chef. In the end, the guest was satisfied and even left a good tip.',
        analysis: 'Detailed description of a specific situation with a clear sequence of actions. Demonstrates problem acknowledgment, empathy, initiative, and ability to compensate for inconvenience.'
      },
      teamwork: {
        question: 'How do you work in a team during busy moments?',
        answer: 'During peak hours when the hall is full, coordination is very important. I always alert colleagues if I see they need help - for example, I\'ll deliver their order if I\'m passing by. Or I\'ll cover if someone is delayed from the kitchen. Once my colleague felt unwell, and another waiter and I split her tables. The main thing is not to panic and support each other.',
        analysis: 'Specific examples of mutual assistance. Understanding of teamwork. Proactivity and willingness to help colleagues.'
      }
    },
    simulationAnalysis: {
      role: 'Restaurant guest dissatisfied with cold dish',
      scenario: 'Guest ordered a hot dish, but it arrived lukewarm. He is clearly upset and wants to complain.',
      behaviorSummary: 'Anna immediately expressed sincere regret and did not try to make excuses. Asked if she could take the dish and bring a new one. Offered to replace with another dish if the guest didn\'t want to wait. Apologized on behalf of the establishment.',
      strengths: [
        'Acknowledged problem without excuses',
        'Offered specific solution options',
        'Maintained calm and politeness',
        'Took initiative'
      ],
      quotes: [
        'I\'m very sorry this happened. I\'ll take the dish now and ask the chef to prepare a new one, it will take 10 minutes.',
        'Or if you don\'t want to wait, I can offer another dish that cooks faster.'
      ],
      recommendation: 'Anna demonstrates confident command of service standards and ability to maintain professionalism in stressful situations. Ready for work.'
    }
  },
  'not-ready-1': {
    name: 'Dmitry Petrov',
    position: 'Barista',
    completedAt: '2026-01-14T11:00:00',
    status: 'not-ready',
    questionsAnalysis: {
      greeting: {
        question: 'Tell me about yourself and your customer service experience',
        answer: 'Well... My name is Dima. I\'m 19 years old. I\'m studying at university. I used to work as a courier, delivering food. And I communicated a bit with customers when delivering orders.',
        analysis: 'Very brief answer without details. No mention of specific cafe or coffee experience. Uncertain speech with filler words ("well"). Customer service experience is minimal and indirect.'
      },
      experience: {
        question: 'What would you do if a customer complains about coffee quality?',
        answer: 'Probably... I would apologize? And say I can make new coffee. Or I would call the senior if I don\'t know what to do myself.',
        analysis: 'Hypothetical answer without practical examples. No clear action plan. Mentioning "call the senior" shows lack of confidence in own abilities. No attempt to find out the reason for dissatisfaction.'
      },
      coffee: {
        question: 'What do you know about preparing coffee drinks?',
        answer: 'Well, I drink coffee every day. I know there\'s cappuccino, latte, espresso. Cappuccino has a lot of milk. Espresso is a small portion of strong coffee.',
        analysis: 'Consumer-level knowledge, not professional. No mention of preparation technique, proportions, temperature. No experience with coffee machine.'
      }
    },
    simulationAnalysis: {
      role: 'Coffee shop customer complaining about cold cappuccino',
      scenario: 'Customer received cappuccino, but the drink is not hot enough. He is clearly dissatisfied.',
      behaviorSummary: 'Dmitry became confused and apologized several times but didn\'t offer a concrete solution immediately. Asked "what should I do?" instead of taking initiative. After a pause, offered to make a new drink.',
      concerns: [
        'Uncertainty and confusion',
        'No clear action algorithm',
        'Asks back instead of acting',
        'Long pauses in responses'
      ],
      quotes: [
        'Sorry... Really very sorry... What should I... what should I do?',
        'Well okay, I can make you a new cappuccino.'
      ],
      recommendation: 'Dmitry demonstrates insufficient customer service experience and low confidence. Requires training in service standards and coffee equipment operation. Internship under supervision of experienced barista recommended before independent work.'
    }
  },
  'not-ready-2': {
    name: 'Elena Ivanova',
    position: 'Call Center Operator',
    completedAt: '2026-01-13T16:45:00',
    status: 'not-ready',
    questionsAnalysis: {
      greeting: {
        question: 'Tell me about yourself and your customer service experience',
        answer: 'Elena. 26 years old. Worked at store cashier.',
        analysis: 'Extremely short answer. No details about experience, duties, achievements. Lacks initiative to expand answer.'
      },
      communication: {
        question: 'How do you communicate with dissatisfied customers?',
        answer: 'Politely. I try to help.',
        analysis: 'One-word answer without specifics. No examples, techniques, approaches. Doesn\'t explain how exactly she helps.'
      },
      stress: {
        question: 'How do you cope with stress at work?',
        answer: 'I cope normally. Don\'t panic.',
        analysis: 'General phrases without examples. Doesn\'t describe specific methods or situations. Formal answer.'
      }
    },
    simulationAnalysis: {
      role: 'Customer who cannot find their order on the website',
      scenario: 'Customer calls support, frustrated that they cannot track their order. Need to help solve the problem.',
      behaviorSummary: 'Elena answered very briefly, asked closed questions requiring one-word answers. Showed no empathy, made no attempt to calm the customer. Communication was dry and formal.',
      concerns: [
        'Minimal verbal interaction',
        'Lack of empathy and understanding',
        'No attempts to defuse the situation',
        'Closed questions instead of open ones'
      ],
      quotes: [
        'Order number?',
        'Understood. Will check now.',
        'System is loading.'
      ],
      recommendation: 'Elena demonstrates weak communication skills. Lacks active listening skill and dialogue building. Requires training in customer communication techniques, empathy development, and work on expanding responses. Not ready for independent work on the line.'
    }
  },
  'not-ready-3': {
    name: 'Maxim Novikov',
    position: 'Hotel Administrator',
    completedAt: '2026-01-12T10:15:00',
    status: 'not-ready',
    questionsAnalysis: {
      greeting: {
        question: 'Tell me about yourself and your experience in hospitality',
        answer: 'My name is Maxim, I\'m 28 years old. I completed hotel business courses. Haven\'t worked in a hotel yet, but really want to start. I\'m responsible and diligent.',
        analysis: 'Has education but no practical experience. Answer contains general qualities without supporting examples.'
      },
      conflict: {
        question: 'How would you handle a conflict situation with a guest?',
        answer: 'I would try to solve the problem. I think I need to listen to the guest and understand what bothers them. And then... well, depends on the situation.',
        analysis: 'Theoretical answer without structure. No specific action plan. Phrase "depends on the situation" shows lack of ready algorithms.'
      },
      priorities: {
        question: 'How do you prioritize when you need to solve several tasks simultaneously?',
        answer: 'I try to do everything in order. First one thing, then another. But if something is urgent, then of course I\'ll handle it immediately.',
        analysis: 'No systematic approach to prioritization. General phrases without methodology.'
      }
    },
    simulationAnalysis: {
      role: 'Aggressive hotel guest demanding money back',
      scenario: 'Guest claims the room was dirty and demands full refund for the stay. He raises his voice and threatens to leave negative review.',
      behaviorSummary: 'Maxim noticeably became flustered when the guest raised his voice. Started making excuses and promising that "this won\'t happen again". Repeated the same phrases several times. Could not offer a concrete solution other than "I\'ll report to management".',
      concerns: [
        'Loss of composure in conflict',
        'Defensive position instead of solution',
        'No action plan',
        'Shifting responsibility to management'
      ],
      quotes: [
        'I didn\'t know... Sorry, I didn\'t think this could happen...',
        'This shouldn\'t have happened, forgive me...',
        'I need to consult with the manager, I can\'t decide myself.'
      ],
      recommendation: 'Maxim is not ready to work with conflict situations and stressful customers. Lacks stress resistance and confidence in decision-making. Requires conflict management training, practice of standard scenarios, and development of maintaining calm. Experienced mentor needed at initial stage.'
    }
  }
};

export const getDemoCandidates = (language: Language) => {
  return language === 'en' ? demoCandidatesEn : demoCandidatesRu;
};

// Экспорт по умолчанию для обратной совместимости
export const demoCandidatesData = demoCandidatesRu;

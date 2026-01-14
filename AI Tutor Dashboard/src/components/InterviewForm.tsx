import { useState } from 'react';
import { 
  Plus, X, Clock, MessageSquare, Users as UsersIcon, Briefcase, ArrowLeft,
  Phone, UtensilsCrossed, Hotel, ShoppingBag, Coffee, CreditCard, Sparkles, Bike
} from 'lucide-react';
import { SessionParams } from '@/types';

interface RoleTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  questions: string[];
  evaluationCriteria: string[];
  customerSimulation?: {
    enabled: boolean;
    scenario: string;
    role: string;
  };
  personality: 'friendly' | 'professional' | 'motivating';
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'call-center',
    title: 'Оператор колл-центра',
    description: 'Для проверки навыков общения с клиентами по телефону',
    icon: Phone,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    questions: [
      'Расскажите о своем опыте работы с клиентами по телефону',
      'Как вы реагируете на недовольных или агрессивных клиентов?',
      'Опишите ситуацию, когда вам пришлось работать в стрессовых условиях',
      'Почему вы хотите работать именно оператором колл-центра?',
      'Готовы ли вы к посменному графику работы?'
    ],
    evaluationCriteria: ['Четкость речи', 'Вежливость', 'Умение работать с возражениями', 'Скорость реакции'],
    customerSimulation: {
      enabled: true,
      role: 'Недовольный клиент, который получил бракованный товар',
      scenario: 'Клиент звонит в колл-центр с жалобой на бракованный товар. Он раздражен и требует немедленного возврата денег. Кандидат должен успокоить клиента, выяснить детали проблемы и предложить решение.'
    },
    personality: 'professional'
  },
  {
    id: 'waiter',
    title: 'Официант',
    description: 'Для проверки навыков обслуживания в ресторане',
    icon: UtensilsCrossed,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    questions: [
      'Расскажите о вашем опыте работы в сфере HoReCa',
      'Как вы справляетесь с недовольными гостями?',
      'Опишите ситуацию, когда вы превзошли ожидания гостя',
      'Готовы ли вы работать в выходные и праздничные дни?',
      'Что для вас означает качественное обслуживание?'
    ],
    evaluationCriteria: ['Коммуникабельность', 'Опыт работы', 'Стрессоустойчивость', 'Презентабельность'],
    customerSimulation: {
      enabled: true,
      role: 'Гость ресторана, который недоволен качеством блюда',
      scenario: 'Гость жалуется на то, что его стейк пережарен. Он ожидал medium rare, а получил well done. Кандидат должен вежливо извиниться, предложить решение и сохранить позитивное впечатление гостя.'
    },
    personality: 'friendly'
  },
  {
    id: 'receptionist',
    title: 'Администратор / Ресепшионист',
    description: 'Для проверки навыков работы на ресепшене',
    icon: Hotel,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    questions: [
      'Расскажите о вашем опыте работы администратором',
      'Какими программами и системами вы умеете пользоваться?',
      'Как вы организуете свой рабочий день при большом потоке клиентов?',
      'Опишите конфликтную ситуацию с клиентом и как вы её решили',
      'Готовы ли вы к работе в режиме многозадачности?'
    ],
    evaluationCriteria: ['Грамотная речь', 'Навыки многозадачности', 'Знание ПК', 'Стрессоустойчивость'],
    customerSimulation: {
      enabled: true,
      role: 'Клиент, который хочет заселиться, но его номер ещё не готов',
      scenario: 'Клиент прибыл в отель раньше времени заселения. Его номер ещё убирается. Он устал после долгой дороги и требует немедленного заселения. Кандидат должен проявить понимание, предложить альтернативные варианты и сохранить позитивный настрой.'
    },
    personality: 'professional'
  },
  {
    id: 'sales-consultant',
    title: 'Продавец-консультант',
    description: 'Для проверки навыков продаж и консультирования',
    icon: ShoppingBag,
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-100',
    questions: [
      'Расскажите о вашем опыте в продажах',
      'Как вы работаете с возражениями клиентов?',
      'Опишите вашу самую успешную продажу',
      'Что вы делаете, когда клиент долго не может принять решение?',
      'Какие товары/услуги вы продавали раньше?'
    ],
    evaluationCriteria: ['Навыки продаж', 'Работа с возражениями', 'Клиентоориентированность', 'Презентабельность'],
    customerSimulation: {
      enabled: true,
      role: 'Покупатель, который сомневается в покупке дорогого товара',
      scenario: 'Покупатель интересуется дорогим смартфоном, но сомневается в необходимости такой покупки. У него есть бюджетная альтернатива в виде более дешевой модели. Кандидат должен выявить потребности, работать с возражениями и помочь принять решение.'
    },
    personality: 'friendly'
  },
  {
    id: 'barista',
    title: 'Бариста',
    description: 'Для проверки знаний кофе и навыков обслуживания',
    icon: Coffee,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    questions: [
      'Расскажите о вашем опыте приготовления кофе',
      'Какие виды кофейных напитков вы умеете готовить?',
      'Как вы справляетесь с большим потоком заказов в час пик?',
      'Что вы будете делать, если гостю не понравился напиток?',
      'Почему вы хотите работать именно бариста?'
    ],
    evaluationCriteria: ['Знание кофе', 'Скорость работы', 'Коммуникабельность', 'Внимательность'],
    customerSimulation: {
      enabled: true,
      role: 'Гость кофейни, который недоволен вкусом капучино',
      scenario: 'Гость заказал капучино, но жалуется, что кофе недостаточно крепкий и молоко не той температуры. Это его любимый напиток, и он разочарован. Кандидат должен проявить профессионализм, выяснить предпочтения и предложить переделать напиток.'
    },
    personality: 'friendly'
  },
  {
    id: 'cashier',
    title: 'Кассир',
    description: 'Для проверки навыков работы с кассой и клиентами',
    icon: CreditCard,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    questions: [
      'Расскажите о вашем опыте работы кассиром',
      'Как вы справляетесь с очередями и нетерпеливыми покупателями?',
      'Что вы будете делать, если обнаружите ошибку в кассе?',
      'Готовы ли вы работать с материальной ответственностью?',
      'Какими кассовыми системами вы умеете пользоваться?'
    ],
    evaluationCriteria: ['Внимательность', 'Честность', 'Скорость работы', 'Стрессоустойчивость'],
    customerSimulation: {
      enabled: true,
      role: 'Покупатель, который спешит и недоволен медленным обслуживанием',
      scenario: 'В кассе длинная очередь. Покупатель спешит и раздражен тем, что приходится долго ждать. Он требует ускорить процесс. Кандидат должен сохранять спокойствие, работать быстро но аккуратно, и успокоить клиента.'
    },
    personality: 'professional'
  },
  {
    id: 'beauty-master',
    title: 'Мастер салона красоты',
    description: 'Для проверки навыков работы в сфере beauty',
    icon: Sparkles,
    iconColor: 'text-fuchsia-600',
    iconBg: 'bg-fuchsia-100',
    questions: [
      'Расскажите о вашем опыте работы в салоне красоты',
      'Какие услуги вы оказываете?',
      'Как вы работаете с требовательными клиентами?',
      'Что вы будете делать, если клиент недоволен результатом?',
      'Готовы ли вы к гибкому графику работы?'
    ],
    evaluationCriteria: ['Профессионализм', 'Коммуникабельность', 'Креативность', 'Внимательность к деталям'],
    customerSimulation: {
      enabled: true,
      role: 'Клиент с завышенными ожиданиями от процедуры',
      scenario: 'Клиент пришла на маникюр и показывает сложный дизайн из Instagram, который требует 3-4 часа работы, но у неё есть только час времени. Она настаивает на том же результате. Кандидат должен управлять ожиданиями и предложить реалистичные варианты.'
    },
    personality: 'friendly'
  },
  {
    id: 'courier',
    title: 'Курьер',
    description: 'Для проверки ответственности и коммуникабельности',
    icon: Bike,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-100',
    questions: [
      'Расскажите о вашем опыте работы курьером',
      'Как вы справляетесь с ситуациями, когда клиента нет дома?',
      'Что вы будете делать в случае повреждения товара при доставке?',
      'Готовы ли вы работать в любую погоду?',
      'Знаете ли вы город и умеете ли ориентироваться на местности?'
    ],
    evaluationCriteria: ['Ответственность', 'Пунктуальность', 'Коммуникабельность', 'Физическая выносливость'],
    customerSimulation: {
      enabled: true,
      role: 'Клиент, который недоволен опозданием курьера',
      scenario: 'Заказ задержался из-за пробок на 20 минут. Клиент ждал и теперь опаздывает на встречу. Он раздражен и требует объяснений. Кандидат должен извиниться, объяснить ситуацию и сгладить конфликт.'
    },
    personality: 'professional'
  }
];

interface Props {
  onClose: () => void;
  onCreate: (params: SessionParams) => void;
}

export function InterviewForm({ onClose, onCreate }: Props) {
  const [formData, setFormData] = useState<SessionParams>({
    topic: '',
    difficulty: 'intermediate',
    duration: 30,
    language: 'ru',
    goals: [],
    personality: 'professional',
    interactionStyle: 'questions',
    interviewType: 'screening',
    questions: [],
    customerSimulation: {
      enabled: false,
      scenario: '',
      role: 'neutral'
    }
  });

  const [questionInput, setQuestionInput] = useState('');
  const [criteriaInput, setCriteriaInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(true);

  const handleRoleSelect = (roleTemplate: RoleTemplate) => {
    setSelectedRole(roleTemplate.id);
    setFormData({
      ...formData,
      position: roleTemplate.title,
      topic: `Интервью на позицию ${roleTemplate.title}`,
      questions: roleTemplate.questions,
      evaluationCriteria: roleTemplate.evaluationCriteria,
      customerSimulation: roleTemplate.customerSimulation || formData.customerSimulation,
      personality: roleTemplate.personality
    });
    setShowRoleSelector(false);
  };

  const handleResetRole = () => {
    setSelectedRole(null);
    setShowRoleSelector(true);
    setFormData({
      topic: '',
      difficulty: 'intermediate',
      duration: 30,
      language: 'ru',
      goals: [],
      personality: 'professional',
      interactionStyle: 'questions',
      interviewType: 'screening',
      questions: [],
      customerSimulation: {
        enabled: false,
        scenario: '',
        role: 'neutral'
      }
    });
  };

  const addQuestion = () => {
    if (questionInput.trim()) {
      setFormData({
        ...formData,
        questions: [...(formData.questions || []), questionInput.trim()]
      });
      setQuestionInput('');
    }
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions?.filter((_, i) => i !== index)
    });
  };

  const addCriteria = () => {
    if (criteriaInput.trim()) {
      setFormData({
        ...formData,
        evaluationCriteria: [...(formData.evaluationCriteria || []), criteriaInput.trim()]
      });
      setCriteriaInput('');
    }
  };

  const removeCriteria = (index: number) => {
    setFormData({
      ...formData,
      evaluationCriteria: formData.evaluationCriteria?.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 z-10"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {showRoleSelector ? (
          <>
            <h3 className="text-lg sm:text-2xl text-gray-900 mb-2 pr-8">Выберите роль для интервью</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Для каждой роли уже подготовлены вопросы и сценарии
            </p>

            {/* Custom Role Option - Moved to Top */}
            <div className="mb-6 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-gray-900 font-semibold mb-1">Создать свою роль</h4>
                  <p className="text-sm text-gray-600">
                    Настройте интервью с нуля под свои уникальные требования
                  </p>
                </div>
                <button
                  onClick={() => setShowRoleSelector(false)}
                  className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                >
                  Настроить
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Или выберите готовый шаблон</span>
              </div>
            </div>
            
            {/* Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROLE_TEMPLATES.map((role) => {
                const IconComponent = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`${role.iconBg} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                        <IconComponent className={`w-6 h-6 ${role.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 font-semibold mb-1 group-hover:text-purple-600 transition-colors">
                          {role.title}
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{role.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                        {role.questions.length} вопросов
                      </span>
                      {role.customerSimulation?.enabled && (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                          С симуляцией
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                        {role.evaluationCriteria.length} критериев
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            {selectedRole && (
              <button
                onClick={handleResetRole}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Выбрать другую роль</span>
              </button>
            )}

            <h3 className="text-lg sm:text-xl text-gray-900 mb-4 sm:mb-6 pr-8">
              {selectedRole ? `Настройка интервью: ${formData.position}` : 'Создать AI-интервью'}
            </h3>
            
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-medium">Название вакансии *</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    placeholder="Например: Оператор колл-центра"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-medium">Название компании</label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    placeholder="Например: IT Solutions"
                  />
                </div>
              </div>

              {/* Длительность */}
              <div>
                <label className="block text-sm text-gray-700 mb-3 font-medium">Длительность интервью</label>
                <div className="grid grid-cols-4 gap-3">
                  {[15, 30, 45, 60].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.duration === duration
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`flex items-center justify-center gap-1 ${
                        formData.duration === duration ? 'text-purple-700' : 'text-gray-900'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-base">{duration}</span>
                      </div>
                      <div className={`text-xs mt-1 ${
                        formData.duration === duration ? 'text-purple-600' : 'text-gray-600'
                      }`}>
                        минут
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Вопросы для кандидата */}
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Вопросы для кандидата
                </label>
                <p className="text-xs text-gray-500 mb-3">AI будет задавать эти вопросы во время интервью</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Например: Расскажите о вашем опыте работы"
                  />
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.questions?.map((question, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg flex items-start gap-3 group">
                      <span className="text-blue-600 font-medium min-w-[24px]">{index + 1}.</span>
                      <span className="flex-1 text-gray-700">{question}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.questions?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Добавьте вопросы для интервью</p>
                  )}
                </div>
              </div>

              {/* Симуляция общения с клиентами */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-purple-600" />
                    <h4 className="text-gray-900 font-medium">Симуляция общения с клиентами</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.customerSimulation?.enabled || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        customerSimulation: {
                          ...formData.customerSimulation!,
                          enabled: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Включите симуляцию, чтобы проверить, как кандидат справляется с типичными ситуациями
                </p>
                
                {formData.customerSimulation?.enabled && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">Роль клиента</label>
                      <input
                        type="text"
                        value={formData.customerSimulation?.role || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customerSimulation: {
                            ...formData.customerSimulation!,
                            role: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                        placeholder="Например: Недовольный клиент"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">Описание сценария</label>
                      <textarea
                        value={formData.customerSimulation?.scenario || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customerSimulation: {
                            ...formData.customerSimulation!,
                            scenario: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none bg-white"
                        placeholder="Опишите ситуацию, с которой столкнется кандидат..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Критерии оценки */}
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Критерии оценки</label>
                <p className="text-xs text-gray-500 mb-3">По этим критериям AI будет оценивать кандидата</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={criteriaInput}
                    onChange={(e) => setCriteriaInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Например: Четкость речи"
                  />
                  <button
                    type="button"
                    onClick={addCriteria}
                    className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.evaluationCriteria?.map((criteria, index) => (
                    <div key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-2">
                      <span>{criteria}</span>
                      <button
                        type="button"
                        onClick={() => removeCriteria(index)}
                        className="text-green-500 hover:text-green-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSubmit}
                disabled={!formData.position}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Создать интервью
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
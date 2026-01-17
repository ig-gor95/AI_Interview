import { useState } from 'react';
import { 
  Plus, X, MessageSquare, Users as UsersIcon, Briefcase, HelpCircle, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { SessionParams, Question } from '@/types';

interface QuestionWithClarifications {
  text: string;
  clarifications: string[];
}

interface Props {
  onClose: () => void;
  onCreate: (params: SessionParams) => void;
}

export function InterviewForm({ onClose, onCreate }: Props) {
  // Внутреннее состояние формы: вопросы хранятся как string[] для удобства редактирования
  const [position, setPosition] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([
    'Расскажите о вашем опыте работы в этой сфере',
    'Как вы справляетесь с конфликтными ситуациями?',
    'Почему вы хотите работать именно на этой позиции?'
  ]);
  const [allowDynamicQuestions, setAllowDynamicQuestions] = useState<boolean>(false);
  const [customerSimulationEnabled, setCustomerSimulationEnabled] = useState<boolean>(true);
  const [customerSimulationRole, setCustomerSimulationRole] = useState<string>('Недовольный клиент с жалобой на задержку заказа');
  const [customerSimulationScenario, setCustomerSimulationScenario] = useState<string>('Клиент звонит с жалобой на задержку заказа. Он раздражен и требует объяснений. Кандидат должен успокоить клиента, выяснить детали проблемы и предложить решение.');

  const [questionInput, setQuestionInput] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [clarifyingInputs, setClarifyingInputs] = useState<Record<number, string>>({});
  const [questionClarifications, setQuestionClarifications] = useState<Record<number, string[]>>({});

  const addQuestion = () => {
    if (questionInput.trim()) {
      setQuestions([...questions, questionInput.trim()]);
      setQuestionInput('');
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    // Очистка связанных уточняющих вопросов
    const newClarifications = { ...questionClarifications };
    delete newClarifications[index];
    setQuestionClarifications(newClarifications);
    
    const newExpanded = new Set(expandedQuestions);
    newExpanded.delete(index);
    setExpandedQuestions(newExpanded);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const addClarifyingQuestion = (questionIndex: number) => {
    const input = clarifyingInputs[questionIndex]?.trim();
    if (input) {
      const existing = questionClarifications[questionIndex] || [];
      setQuestionClarifications({
        ...questionClarifications,
        [questionIndex]: [...existing, input]
      });
      setClarifyingInputs({
        ...clarifyingInputs,
        [questionIndex]: ''
      });
    }
  };

  const removeClarifyingQuestion = (questionIndex: number, clarIndex: number) => {
    const existing = questionClarifications[questionIndex] || [];
    setQuestionClarifications({
      ...questionClarifications,
      [questionIndex]: existing.filter((_, i) => i !== clarIndex)
    });
  };

  const handleSubmit = () => {
    if (!position.trim()) {
      alert('Пожалуйста, укажите название вакансии');
      return;
    }
    if (!questions || questions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один вопрос');
      return;
    }
    
    // Преобразуем данные в упрощенную структуру Question[]
    // Включаем clarifyingQuestions только если они есть
    const questionsWithClarifications: Question[] = questions.map((text, index) => {
      const clarifyingQuestions = questionClarifications[index] && questionClarifications[index].length > 0
        ? questionClarifications[index]
        : undefined;
      
      // Используем spread operator чтобы включить clarifyingQuestions только если они есть
      return {
        text,
        ...(clarifyingQuestions && clarifyingQuestions.length > 0 
          ? { clarifyingQuestions } 
          : {})
      };
    });
    
    // Формируем упрощенный SessionParams
    const sessionParams: SessionParams = {
      position: position.trim(),
      company: company.trim() || undefined,
      questions: questionsWithClarifications,
      allowDynamicQuestions: allowDynamicQuestions || undefined,
      customerSimulation: customerSimulationEnabled ? {
        enabled: true,
        role: customerSimulationRole.trim() || undefined,
        scenario: customerSimulationScenario.trim() || undefined
      } : undefined
    };
    
    onCreate(sessionParams);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header - Fixed */}
        <div className="border-b border-gray-200 px-6 py-5 flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Создать AI-интервью</h3>
                <p className="text-sm text-gray-600">Настройте интервью за 2 минуты</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/60 text-gray-500 hover:text-gray-700 transition-all"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            {/* Основная информация */}
            <section>
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">
                  Информация о вакансии
                </h4>
                <p className="text-sm text-gray-500">
                  Используется для корректной формулировки вопросов и сценариев интервью
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название вакансии <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-400"
                    placeholder="Например: Администратор / Официант / Оператор колл-центра"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название компании
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-400"
                    placeholder="Например: IT Solutions"
                  />
                </div>
              </div>
            </section>

            {/* Разделитель */}
            <div className="border-t border-gray-200" />

            {/* Вопросы для кандидата */}
            <section>
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">
                  Базовые вопросы для первичного отбора <span className="text-red-500">*</span>
                </h4>
                <p className="text-sm text-gray-500">
                  Эти вопросы помогают оценить коммуникацию, опыт и мотивацию кандидата
                </p>
              </div>
              
              <div className="space-y-3 mb-4">
                {questions.map((question, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea
                          value={question}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = e.target.value;
                            setQuestions(newQuestions);
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm text-gray-800 font-medium mb-1 p-0 resize-none overflow-hidden"
                          placeholder="Введите вопрос"
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                        <p className="text-xs text-gray-500">
                          Можно отредактировать под вашу вакансию
                        </p>
                        
                        {/* Уточняющие вопросы для этого вопроса */}
                        {questionClarifications[index] && questionClarifications[index].length > 0 && (
                          <div className="mt-2 space-y-1">
                            {questionClarifications[index].map((clarification, clarIndex) => (
                              <div key={clarIndex} className="flex items-start gap-2 text-xs bg-blue-100/50 rounded px-2 py-1.5 border border-blue-200">
                                <MessageSquare className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span className="flex-1 text-gray-700 break-words">{clarification}</span>
                                <button
                                  type="button"
                                  onClick={() => removeClarifyingQuestion(index, clarIndex)}
                                  className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Раскрывающаяся секция для добавления уточняющих */}
                        {expandedQuestions.has(index) && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={clarifyingInputs[index] || ''}
                                onChange={(e) => setClarifyingInputs({
                                  ...clarifyingInputs,
                                  [index]: e.target.value
                                })}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addClarifyingQuestion(index);
                                  }
                                }}
                                className="flex-1 px-2 py-1.5 border border-blue-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Например: Можете подробнее рассказать об этом опыте?"
                              />
                              <button
                                type="button"
                                onClick={() => addClarifyingQuestion(index)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Добавить
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                              Робот может задать эти вопросы для уточнения ответа кандидата
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all"
                          title="Добавить уточняющие вопросы"
                        >
                          {expandedQuestions.has(index) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-400"
                  placeholder="Добавить свой вопрос..."
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all font-medium text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить вопрос</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Рекомендуется 3–6 вопросов
              </p>
            </section>

            {/* Разделитель */}
            <div className="border-t border-gray-200" />

            {/* Дополнительные вопросы от робота */}
            <section>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <h4 className="text-base font-semibold text-gray-900">
                        Дополнительные вопросы на усмотрение робота
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Робот может задавать дополнительные вопросы по ходу диалога на основе ответов кандидата для более глубокого понимания его опыта и компетенций
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={allowDynamicQuestions}
                      onChange={(e) => setAllowDynamicQuestions(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-600 peer-checked:to-emerald-600 shadow-sm"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Разделитель */}
            <div className="border-t border-gray-200" />

            {/* Симуляция общения с клиентами */}
            <section>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    Моделирование реальной рабочей ситуации (опционально)
                  </h4>
                  <p className="text-sm text-gray-500">
                    Используется для оценки реакции кандидата в стрессовой ситуации
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={customerSimulationEnabled}
                    onChange={(e) => setCustomerSimulationEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600 shadow-sm"></div>
                </label>
              </div>
              
              {customerSimulationEnabled && (
                <div className="space-y-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Роль клиента
                      </label>
                      <textarea
                        value={customerSimulationRole}
                        onChange={(e) => setCustomerSimulationRole(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm transition-all shadow-sm hover:border-gray-400 resize-none"
                        placeholder="Например: недовольный клиент, гость, заказчик"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание сценария
                      </label>
                      <textarea
                        value={customerSimulationScenario}
                        onChange={(e) => setCustomerSimulationScenario(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white text-sm transition-all shadow-sm hover:border-gray-400"
                        placeholder="Кратко опишите ситуацию, с которой кандидат может столкнуться на работе"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Пример диалога */}
                  <div className="pt-4 border-t border-indigo-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      <h5 className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                        Пример фрагмента диалога
                      </h5>
                    </div>
                    
                    <div className="space-y-2.5">
                      {/* AI as angry customer */}
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-lg px-3 py-2.5 border border-red-200 shadow-sm">
                            <p className="text-xs text-gray-900 break-words font-medium">
                              "Алло! Я уже ЖДУ неделю свой заказ! Обещали 3 дня, а прошло СЕМЬ! Это безобразие! Где мой заказ?!"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expected response */}
                      <div className="flex gap-2.5 justify-end">
                        <div className="flex-1 max-w-[85%] min-w-0">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-3 py-2.5 shadow-sm">
                            <p className="text-xs text-white break-words">
                              Понимаю ваше недовольство. Давайте я проверю статус вашего заказа прямо сейчас. Подскажите номер заказа?
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-xs font-semibold text-white">К</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-3 italic">
                      Пример приведён для понимания формата. Реальный диалог формируется автоматически.
                    </p>

                    <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-indigo-900 font-semibold mb-1.5">
                            Как это работает:
                          </p>
                          <ol className="text-xs text-indigo-800 space-y-1 list-decimal list-inside">
                            <li>Кандидат отвечает на базовые вопросы</li>
                            <li>Система моделирует рабочую ситуацию</li>
                            <li>Вы получаете запись и краткую сводку для отбора</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-5 bg-gradient-to-r from-gray-50 to-blue-50/30 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-all font-medium text-sm"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={!position.trim()}
              className="px-10 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg"
            >
              Создать интервью
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import {
  Plus, X, MessageSquare, Users as UsersIcon, Briefcase, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Sparkles, Loader2
} from 'lucide-react';
import { SessionParams } from '@/types';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';
import { interviewsAPI } from '@/lib/api';

interface QuestionWithClarifications {
  text: string;
  clarifications: string[];
}

interface Props {
  onClose: () => void;
  onCreate: (params: SessionParams) => void;
  editMode?: boolean;
  interviewId?: string;
  initialData?: SessionParams;
  onUpdate?: (id: string, params: SessionParams) => void;
}

export function InterviewForm({ onClose, onCreate, editMode = false, interviewId, initialData, onUpdate }: Props) {
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);

  const defaultFormData: SessionParams = {
    topic: '',
    difficulty: 'intermediate',
    duration: 30,
    language: 'ru',
    goals: [],
    personality: 'professional',
    interactionStyle: 'questions',
    interviewType: 'screening',
    questions: [
      'Расскажите о вашем опыте работы в этой сфере',
      'Как вы справляетесь с конфликтными ситуациями?',
      'Почему вы хотите работать именно на этой позиции?'
    ],
    evaluationCriteria: ['Коммуникабельность', 'Профессионализм', 'Стрессоустойчивость'],
    mustHaveRequirements: [],
    niceToHaveRequirements: [],
    customerSimulation: {
      enabled: true,
      scenario: 'Клиент звонит с жалобой на задержку заказа. Он раздражен и требует объяснений. Кандидат должен успокоить клиента, выяснить детали проблемы и предложить решение.',
      role: 'Недовольный клиент с жалобой на задержку заказа'
    },
    clarifyingQuestions: {
      enabled: false,
      example: ''
    }
  };

  // Transform questions from API format to form format
  const transformInitialData = (data: SessionParams | undefined): SessionParams => {
    if (!data) return defaultFormData;

    return {
      ...data,
      questions: data.questions?.map((q: any) => typeof q === 'string' ? q : q.text) || []
    };
  };

  const [formData, setFormData] = useState<SessionParams>(
    editMode && initialData ? transformInitialData(initialData) : defaultFormData
  );

  const [questionInput, setQuestionInput] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [clarifyingInputs, setClarifyingInputs] = useState<Record<number, string>>({});

  // Initialize questionClarifications from initialData if in edit mode
  const initQuestionClarifications = () => {
    if (editMode && initialData?.questions) {
      const clarifications: Record<number, string[]> = {};
      initialData.questions.forEach((q: any, index: number) => {
        if (typeof q === 'object' && q.clarifyingQuestions) {
          clarifications[index] = q.clarifyingQuestions;
        }
      });
      return clarifications;
    }
    return {};
  };

  const [questionClarifications, setQuestionClarifications] = useState<Record<number, string[]>>(initQuestionClarifications());

  // Новые состояния для AI генерации
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Состояния для критериев оценки
  const [showCriteriaSection, setShowCriteriaSection] = useState(false);
  const [mustHaveInput, setMustHaveInput] = useState('');
  const [niceToHaveInput, setNiceToHaveInput] = useState('');
  const [mustHaveRequirements, setMustHaveRequirements] = useState<string[]>(
    (editMode && initialData?.mustHaveRequirements) ? initialData.mustHaveRequirements : (formData.mustHaveRequirements || [])
  );
  const [niceToHaveRequirements, setNiceToHaveRequirements] = useState<string[]>(
    (editMode && initialData?.niceToHaveRequirements) ? initialData.niceToHaveRequirements : (formData.niceToHaveRequirements || [])
  );

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
    if (!formData.position?.trim()) {
      alert(t.interviewForm.alertJobTitle);
      return;
    }
    if (!formData.questions || formData.questions.length === 0) {
      alert(t.interviewForm.alertQuestions);
      return;
    }

    // Преобразуем questions в формат API: { text, clarifyingQuestions? }[]
    const questions = (formData.questions || []).map((text, index) => {
      const clarifications = questionClarifications[index]?.filter(Boolean);
      return {
        text,
        ...(clarifications?.length ? { clarifyingQuestions: clarifications } : {})
      };
    });

    const params = {
      ...formData,
      questions,
      mustHaveRequirements,
      niceToHaveRequirements,
      clarifyingQuestions: {
        enabled: Object.values(questionClarifications).some(arr => arr?.length > 0),
        example: Object.values(questionClarifications).flat().find(Boolean) || ''
      }
    };

    if (editMode && interviewId && onUpdate) {
      onUpdate(interviewId, params);
    } else {
      onCreate(params);
    }
  };

  const generateQuestions = async () => {
    if (!jobDescription.trim()) {
      alert(t.interviewForm.alertJobDescription);
      return;
    }
    setIsGenerating(true);

    try {
      // Вызов реального API для генерации контента
      const response = await interviewsAPI.generateInterviewContent(
        jobDescription,
        formData.position
      );

      if (!response.success || !response.data) {
        throw new Error('Invalid response from server');
      }

      const { questions, mustHaveRequirements, niceToHaveRequirements, simulation } = response.data;

      // Преобразуем вопросы из формата API в формат формы
      const questionTexts = questions.map(q => q.text);

      // Преобразуем уточняющие вопросы в формат Record<number, string[]>
      const newClarifications: Record<number, string[]> = {};
      questions.forEach((q, index) => {
        if (q.clarifications && q.clarifications.length > 0) {
          newClarifications[index] = q.clarifications;
        }
      });

      // Обновляем форму сгенерированными данными
      setFormData({
        ...formData,
        questions: questionTexts,
        customerSimulation: {
          enabled: true,
          scenario: simulation.scenario,
          role: simulation.role
        }
      });

      // Обновляем уточняющие вопросы
      setQuestionClarifications(newClarifications);

      // Обновляем критерии оценки
      setMustHaveRequirements(mustHaveRequirements);
      setNiceToHaveRequirements(niceToHaveRequirements);
      setShowCriteriaSection(true);

      // Показываем уведомление об успехе
      alert(t.interviewForm.successMessage);

    } catch (error) {
      console.error('Ошибка генерации вопросов:', error);
      alert(error instanceof Error ? error.message : 'Произошла ошибка при генерации вопросов. Попробуйте снова.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper functions for requirements management
  const addMustHaveRequirement = () => {
    if (mustHaveInput.trim()) {
      setMustHaveRequirements([...mustHaveRequirements, mustHaveInput.trim()]);
      setMustHaveInput('');
    }
  };

  const removeMustHaveRequirement = (index: number) => {
    setMustHaveRequirements(mustHaveRequirements.filter((_, i) => i !== index));
  };

  const addNiceToHaveRequirement = () => {
    if (niceToHaveInput.trim()) {
      setNiceToHaveRequirements([...niceToHaveRequirements, niceToHaveInput.trim()]);
      setNiceToHaveInput('');
    }
  };

  const removeNiceToHaveRequirement = (index: number) => {
    setNiceToHaveRequirements(niceToHaveRequirements.filter((_, i) => i !== index));
  };

  const generateCriteriaWithAI = async () => {
    if (!formData.position?.trim()) {
      alert('Пожалуйста, укажите название вакансии');
      return;
    }

    setIsGenerating(true);

    try {
      // Вызов реального API для генерации критериев
      const response = await interviewsAPI.generateCriteria(
        formData.position,
        formData.company
      );

      if (!response.success || !response.data) {
        throw new Error('Invalid response from server');
      }

      const { mustHaveRequirements, niceToHaveRequirements } = response.data;

      setMustHaveRequirements(mustHaveRequirements);
      setNiceToHaveRequirements(niceToHaveRequirements);
      setShowCriteriaSection(true);

    } catch (error) {
      console.error('Ошибка генерации критериев:', error);
      alert(error instanceof Error ? error.message : 'Произошла ошибка при генерации критериев. Попробуйте снова.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-5xl w-full flex flex-col shadow-2xl overflow-hidden shrink-0 my-auto"
        style={{ height: 'calc(100vh - 1.5rem)', maxHeight: 'calc(100vh - 1.5rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{t.interviewForm.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{t.interviewForm.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/60 text-gray-500 hover:text-gray-700 transition-all"
              aria-label={t.interviewForm.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-8">
            {/* Основная информация */}
            <section>
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">
                  {t.interviewForm.jobInfoTitle}
                </h4>
                <p className="text-sm text-gray-500">
                  {t.interviewForm.jobInfoDesc}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.interviewForm.jobTitle} <span className="text-red-500">{t.interviewForm.jobTitleRequired}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-400"
                    placeholder={t.interviewForm.jobTitlePlaceholder}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.interviewForm.companyName}
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-400"
                    placeholder={t.interviewForm.companyPlaceholder}
                  />
                </div>
              </div>
            </section>

            {/* Разделитель */}
            <div className="border-t border-gray-200" />

            {/* Генерация вопросов через AI */}
            <section className="p-5 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t.interviewForm.aiGenerationTitle}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t.interviewForm.aiGenerationDesc}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.interviewForm.jobDescription}
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm transition-all shadow-sm hover:border-blue-300 resize-none"
                    placeholder={t.interviewForm.jobDescriptionPlaceholder}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={generateQuestions}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t.interviewForm.generating}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>{t.interviewForm.generateQuestions}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Разделитель */}
            <div className="border-t border-gray-200" />

            {/* Базовые вопросы для первичного отбора */}
            <section>
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">
                  {t.interviewForm.questionsTitle} <span className="text-red-500">{t.interviewForm.jobTitleRequired}</span>
                </h4>
                <p className="text-sm text-gray-500">
                  {t.interviewForm.questionsDesc}
                </p>
              </div>
              
              <div className="space-y-3 mb-4">
                {formData.questions?.map((question, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea
                          value={question}
                          onChange={(e) => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions[index] = e.target.value;
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm text-gray-800 font-medium mb-1 p-0 resize-none overflow-hidden"
                          placeholder={t.interviewForm.questionPlaceholder}
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                        <p className="text-xs text-gray-500">
                          {t.interviewForm.canEdit}
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
                                placeholder={t.interviewForm.clarifyingPlaceholder}
                              />
                              <button
                                type="button"
                                onClick={() => addClarifyingQuestion(index)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                {t.interviewForm.addClarifying}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                              {t.interviewForm.clarifyingDesc}
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
              
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-400"
                  placeholder={t.interviewForm.addQuestionPlaceholder}
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.interviewForm.addQuestion}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {t.interviewForm.recommended}
              </p>
            </section>

            {/* Разделитель */}
            <div className="border-t border-gray-200" />

            {/* Критерии оценки кандидата */}
            <section>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    {t.interviewForm.evaluationCriteriaTitle}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t.interviewForm.evaluationCriteriaDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateCriteriaWithAI}
                  disabled={isGenerating || !formData.position}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 flex-shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.interviewForm.generating}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t.interviewForm.generateWithAI}</span>
                    </>
                  )}
                </button>
              </div>

              {(showCriteriaSection || mustHaveRequirements.length > 0 || niceToHaveRequirements.length > 0) && (
                <div className="space-y-4">
                  {/* Must Have Requirements */}
                  <div className="bg-white rounded-xl p-5 border-2 border-orange-200 shadow-sm">
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-gray-900 mb-1">
                        {t.interviewForm.mustHaveTitle}
                      </h5>
                      <p className="text-xs text-gray-600">
                        {t.interviewForm.mustHaveSubtitle}
                      </p>
                    </div>

                    {/* List of must-have requirements */}
                    <div className="space-y-2 mb-3">
                      {mustHaveRequirements.map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 group hover:shadow-md transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <span className="flex-1 text-sm text-gray-800">{req}</span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded border border-orange-300">
                            {t.interviewForm.mustHaveTag}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMustHaveRequirement(index)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new must-have requirement */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mustHaveInput}
                        onChange={(e) => setMustHaveInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addMustHaveRequirement();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                        placeholder={t.interviewForm.requirementPlaceholder}
                      />
                      <button
                        type="button"
                        onClick={addMustHaveRequirement}
                        className="px-4 py-2 border-2 border-orange-300 text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.interviewForm.addRequirement}</span>
                      </button>
                    </div>
                  </div>

                  {/* Nice to Have Requirements */}
                  <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-gray-900 mb-1">
                        {t.interviewForm.niceToHaveTitle}
                      </h5>
                      <p className="text-xs text-gray-600">
                        {t.interviewForm.niceToHaveSubtitle}
                      </p>
                    </div>

                    {/* List of nice-to-have requirements */}
                    <div className="space-y-2 mb-3">
                      {niceToHaveRequirements.map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 group hover:shadow-md transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm text-gray-800">{req}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded border border-blue-300">
                            {t.interviewForm.niceToHaveTag}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNiceToHaveRequirement(index)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new nice-to-have requirement */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={niceToHaveInput}
                        onChange={(e) => setNiceToHaveInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addNiceToHaveRequirement();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder={t.interviewForm.requirementPlaceholder}
                      />
                      <button
                        type="button"
                        onClick={addNiceToHaveRequirement}
                        className="px-4 py-2 border-2 border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.interviewForm.addRequirement}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show/Hide button when no criteria */}
              {!showCriteriaSection && mustHaveRequirements.length === 0 && niceToHaveRequirements.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCriteriaSection(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-all text-sm font-medium"
                >
                  + Добавить критерии оценки
                </button>
              )}
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
                        {t.interviewForm.dynamicQuestionsTitle}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t.interviewForm.dynamicQuestionsDesc}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.allowDynamicQuestions || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        allowDynamicQuestions: e.target.checked
                      })}
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
                    {t.interviewForm.simulationTitle}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t.interviewForm.simulationDesc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600 shadow-sm"></div>
                </label>
              </div>
              
              {formData.customerSimulation?.enabled && (
                <div className="space-y-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.interviewForm.roleLabel}
                      </label>
                      <textarea
                        value={formData.customerSimulation?.role || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customerSimulation: {
                            ...formData.customerSimulation!,
                            role: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm transition-all shadow-sm hover:border-gray-400 resize-none"
                        placeholder={t.interviewForm.rolePlaceholder}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.interviewForm.scenarioLabel}
                      </label>
                      <textarea
                        value={formData.customerSimulation?.scenario || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customerSimulation: {
                            ...formData.customerSimulation!,
                            scenario: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white text-sm transition-all shadow-sm hover:border-gray-400"
                        placeholder={t.interviewForm.scenarioPlaceholder}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Пример диалога */}
                  <div className="pt-4 border-t border-indigo-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      <h5 className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                        {t.interviewForm.exampleDialogTitle}
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
                              {t.interviewForm.exampleCustomerMessage}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expected response */}
                      <div className="flex gap-2.5 justify-end">
                        <div className="flex-1 max-w-[85%] min-w-0">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-3 py-2.5 shadow-sm">
                            <p className="text-xs text-white break-words">
                              {t.interviewForm.exampleCandidateMessage}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-xs font-semibold text-white">К</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-3 italic">
                      {t.interviewForm.exampleNote}
                    </p>

                    <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-indigo-900 font-semibold mb-1.5">
                            {t.interviewForm.howItWorksTitle}
                          </p>
                          <ol className="text-xs text-indigo-800 space-y-1 list-decimal list-inside">
                            <li>{t.interviewForm.howItWorksStep1}</li>
                            <li>{t.interviewForm.howItWorksStep2}</li>
                            <li>{t.interviewForm.howItWorksStep3}</li>
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
        <div className="border-t border-gray-200 p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-blue-50/30 flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-all font-medium text-sm"
            >
              {t.interviewForm.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.position}
              className="px-10 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg"
            >
              {editMode ? (language === 'ru' ? 'Обновить' : 'Update') : t.interviewForm.create}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
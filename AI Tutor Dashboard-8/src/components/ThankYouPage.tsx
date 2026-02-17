import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ThankYouPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 sm:p-12 max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Спасибо за прохождение интервью!
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-8">
          <p className="text-lg text-gray-700">
            Ваши ответы успешно записаны и будут проанализированы нашей AI-системой.
          </p>
          <p className="text-gray-600">
            Результаты интервью будут переданы рекрутеру. Если ваша кандидатура подходит для данной позиции, с вами свяжутся в ближайшее время.
          </p>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Что дальше?</h3>
          <ul className="text-sm text-gray-700 space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>AI проанализирует ваши ответы и навыки</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Рекрутер получит детальный отчет с рекомендациями</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>При положительном решении с вами свяжутся для следующего этапа</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Вернуться на главную
        </button>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 mt-8">
          Если у вас есть вопросы, вы можете связаться с рекрутером по контактным данным, указанным в приглашении.
        </p>
      </div>
    </div>
  );
}

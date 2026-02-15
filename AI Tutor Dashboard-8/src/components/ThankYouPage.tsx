import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export function ThankYouPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Спасибо за пройденное интервью!
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          Ваши ответы были записаны и отправлены работодателю.
          Мы свяжемся с вами в ближайшее время для обсуждения результатов.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Если у вас остались вопросы, пожалуйста, свяжитесь с нами по контактам, указанным в приглашении на интервью.
          </p>
        </div>

        <Button
          onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          Закрыть страницу
        </Button>
      </div>
    </div>
  );
}

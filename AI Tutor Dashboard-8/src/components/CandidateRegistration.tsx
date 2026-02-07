import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { publicAPI } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function CandidateRegistration() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInterview, setIsLoadingInterview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<{
    id: string;
    position: string;
    company: string | null;
    params: any;
  } | null>(null);

  useEffect(() => {
    if (token) {
      loadInterview();
    }
  }, [token]);

  const loadInterview = async () => {
    if (!token) return;
    
    try {
      setIsLoadingInterview(true);
      const interviewData = await publicAPI.getInterviewByToken(token);
      setInterview(interviewData);
    } catch (error) {
      console.error('Ошибка при загрузке интервью:', error);
      setError(error instanceof Error ? error.message : 'Интервью не найдено');
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('Пожалуйста, укажите имя и фамилию');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Регистрация кандидата (startSession будет вызван на странице сессии)
      await publicAPI.registerCandidate(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });
      
      // Переход к сессии
      navigate(`/interview/${token}/session`);
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при регистрации. Попробуйте еще раз.');
      setIsLoading(false);
    }
  };

  if (isLoadingInterview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка информации об интервью...</p>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Регистрация для интервью
          </h1>
          {interview && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Вакансия:</p>
              <p className="text-lg text-gray-900">{interview.position}</p>
              {interview.company && (
                <p className="text-sm text-gray-600 mt-1">{interview.company}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">Имя *</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ваше имя"
              required
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Фамилия *</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ваша фамилия"
              required
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email (опционально)</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !firstName.trim() || !lastName.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Регистрация...
              </>
            ) : (
              <>
                Начать интервью
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Нажимая "Начать интервью", вы соглашаетесь с обработкой ваших данных
        </p>
      </div>
    </div>
  );
}


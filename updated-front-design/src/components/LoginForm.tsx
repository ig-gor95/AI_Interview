import { useState } from 'react';
import { ArrowLeft, LogIn, UserPlus, Mail, Lock, User, Target, Zap, BarChart3 } from 'lucide-react';
import { UserRole } from '@/types';
import { Logo } from './Logo';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';

interface LoginFormProps {
  role: 'organizer' | 'student';
  onLogin: () => void;
  onSignup: () => void;
  onBack: () => void;
}

export function LoginForm({ role, onLogin, onSignup, onBack }: LoginFormProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      onSignup();
    } else {
      onLogin();
    }
  };

  const handleLogin = () => {
    onLogin();
  };

  const roleLabel = role === 'organizer' ? t.login.forOrganizers : t.login.forCandidates;
  const roleDescription = role === 'organizer' 
    ? t.login.organizerDesc
    : t.login.candidateDesc;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t.login.back}</span>
          </button>

          <div className="mb-10">
            <Logo size={56} className="mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignup ? t.login.signup : t.login.login}
            </h2>
            <p className="text-gray-600">
              {roleLabel}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.login.nameLabel}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder={t.login.namePlaceholder}
                    required={isSignup}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder={t.login.emailPlaceholder}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder={t.login.passwordPlaceholder}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 font-medium flex items-center justify-center gap-2"
            >
              {isSignup ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>{t.login.signupButton}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{t.login.loginButton}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isSignup ? (
                <>{t.login.haveAccount} <span className="font-medium text-purple-600">{t.login.loginLink}</span></>
              ) : (
                <>{t.login.noAccount} <span className="font-medium text-purple-600">{t.login.signupLink}</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Info panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-4xl font-bold mb-6">
            {roleLabel}
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            {roleDescription}
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t.login.personalization}</h3>
                <p className="text-sm text-white/80">{t.login.personalizationDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t.login.quickStart}</h3>
                <p className="text-sm text-white/80">{t.login.quickStartDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t.login.analytics}</h3>
                <p className="text-sm text-white/80">{t.login.analyticsDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
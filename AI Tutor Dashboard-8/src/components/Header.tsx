import { User as UserType } from '@/types';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface Props {
  user: UserType | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">ScreenMe</h1>
              <p className="text-xs text-gray-500">
                {user?.role === 'organizer' ? t.header.organizerDashboard : t.header.candidateDashboard}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'organizer' ? t.header.organizer : t.header.candidate}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2" ref={menuRef}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.dashboard.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
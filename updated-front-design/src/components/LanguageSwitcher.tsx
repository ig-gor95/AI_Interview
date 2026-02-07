import { Globe, Check, ChevronDown } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom, Language } from '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

const languages = {
  ru: { code: 'ru', name: 'Русский' },
  en: { code: 'en', name: 'English' },
};

export function LanguageSwitcher({ variant = 'light', size = 'md' }: LanguageSwitcherProps) {
  const [language, setLanguage] = useAtom(languageAtom);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2';

  const baseStyles = variant === 'dark'
    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 border-gray-600/50'
    : 'bg-white/50 hover:bg-gray-100 text-gray-700 border-gray-300/50';

  const dropdownStyles = variant === 'dark'
    ? 'bg-gray-800 border-gray-600/50 text-gray-200'
    : 'bg-white border-gray-200 text-gray-700';

  const hoverStyles = variant === 'dark'
    ? 'hover:bg-gray-700/50'
    : 'hover:bg-gray-50';

  const currentLanguage = languages[language];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${padding} ${baseStyles} border backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${textSize} font-medium`}
        title="Select language"
      >
        <Globe className={iconSize} />
        <span className="font-semibold">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className={`${iconSize} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 ${dropdownStyles} border rounded-lg shadow-lg z-50 overflow-hidden`}>
          {Object.values(languages).map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as Language);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 flex items-center gap-3 ${textSize} ${hoverStyles} transition-colors`}
            >
              <span className="flex-1 text-left font-medium">{lang.name}</span>
              {language === lang.code && (
                <Check className={iconSize} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
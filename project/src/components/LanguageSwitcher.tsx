import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const handleLanguageChange = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
    setIsOpen(false);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-gray-300 hover:bg-gray-800"
      >
        <Languages className="w-5 h-5" />
        <span className="flex-1 text-left text-sm font-medium rtl:text-right">
          {currentLanguage.nativeName}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                {t('language.selectLanguage')}
              </p>
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between rtl:text-right ${
                  i18n.language === lang.code ? 'bg-gray-700' : ''
                }`}
              >
                <span className="text-sm text-gray-200">{lang.nativeName}</span>
                {i18n.language === lang.code && (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

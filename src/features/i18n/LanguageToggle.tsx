import { useLanguage } from './LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label={language === 'es' ? 'Selección de idioma' : 'Language selection'}
    >
      <button
        type="button"
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        aria-label="English"
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        <span aria-hidden="true">🇺🇸</span> EN
      </button>
      <button
        type="button"
        className={`lang-btn ${language === 'es' ? 'active' : ''}`}
        aria-label="Español"
        aria-pressed={language === 'es'}
        onClick={() => setLanguage('es')}
      >
        <span aria-hidden="true">🇦🇷</span> ES
      </button>
    </div>
  );
}

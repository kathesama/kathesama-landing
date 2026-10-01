import { useLanguage } from '../../features/i18n/LanguageContext';

export function SkipLink() {
  const { language } = useLanguage();

  return (
    <a
      className="skip-link"
      href="#main-content"
      onClick={() => document.getElementById('main-content')?.focus()}
    >
      {language === 'es' ? 'Saltar al contenido' : 'Skip to content'}
    </a>
  );
}

import { useLanguage } from '../i18n/LanguageContext';

export function BlogRouteFallback() {
  const { language } = useLanguage();

  return (
    <p className="route-loading" role="status">
      {language === 'es' ? 'Cargando artículos…' : 'Loading writing…'}
    </p>
  );
}

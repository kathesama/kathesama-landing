import { Link } from 'react-router-dom';
import { useLanguage } from '../features/i18n/LanguageContext';

export function NotFoundPage() {
  const { language } = useLanguage();

  return (
    <section className="route-placeholder">
      <p className="section-header">404</p>
      <h1>{language === 'es' ? 'Página no encontrada' : 'Page not found'}</h1>
      <Link to={`/?lang=${language}`}>
        {language === 'es' ? 'Volver al inicio' : 'Back home'}
      </Link>
    </section>
  );
}

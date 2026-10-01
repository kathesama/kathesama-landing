import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../../features/i18n/LanguageContext';
import { LanguageToggle } from '../../features/i18n/LanguageToggle';

export function SiteNav() {
  const { language } = useLanguage();
  const languageSearch = `?lang=${language}`;

  return (
    <nav
      aria-label={
        language === 'es' ? 'Navegación principal' : 'Primary navigation'
      }
    >
      <Link className="nav-logo" to={`/${languageSearch}`}>
        KATHESAMA
      </Link>
      <div className="nav-links">
        <NavLink to={`/architecture${languageSearch}`}>
          {language === 'es' ? 'Arquitectura' : 'Architecture'}
        </NavLink>
        <NavLink to={`/blog${languageSearch}`}>
          {language === 'es' ? 'Artículos' : 'Writing'}
        </NavLink>
        <Link to={`/${languageSearch}#about`}>
          {language === 'es' ? 'Sobre mí' : 'About'}
        </Link>
      </div>
      <LanguageToggle />
    </nav>
  );
}

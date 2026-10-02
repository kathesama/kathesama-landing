import { Link } from 'react-router-dom';
import { siteCopy } from '../../content/siteCopy';
import { useLanguage } from '../i18n/LanguageContext';

export function HeroSection() {
  const { language } = useLanguage();
  const copy = siteCopy.hero;
  const titleLead = copy.title[language].replace(' JuanaIA', '');

  return (
    <section id="hero" aria-labelledby="hero-title">
      <p className="hero-label">{copy.label[language]}</p>
      <h1 className="hero-title" id="hero-title">
        {titleLead} <span>JuanaIA</span>
      </h1>
      <p className="hero-sub">{copy.summary[language]}</p>
      <div className="hero-actions">
        <a href="#juana" className="hero-cta hero-cta--project">
          <span>{copy.action[language]}</span>
          <span aria-hidden="true">↓</span>
        </a>
        <Link
          to={`/architecture?lang=${language}`}
          className="hero-cta hero-cta--architecture"
          aria-label={`${copy.architectureAction[language]} ${copy.architectureDetail[language]}`}
        >
          <span className="hero-cta__copy">
            {copy.architectureAction[language]}
            <small>{copy.architectureDetail[language]}</small>
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="hero-scroll" aria-hidden="true">
        {copy.scroll[language]}
      </div>
    </section>
  );
}

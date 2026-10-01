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
      <a href="#juana" className="hero-cta">
        {copy.action[language]} <span aria-hidden="true">→</span>
      </a>
      <div className="hero-scroll" aria-hidden="true">
        {copy.scroll[language]}
      </div>
    </section>
  );
}

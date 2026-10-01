import { siteCopy } from '../../content/siteCopy';
import { useLanguage } from '../i18n/LanguageContext';
import { SocialLinks } from './SocialLinks';

export function BuilderSection() {
  const { language } = useLanguage();
  const copy = siteCopy.builder;

  return (
    <section id="about" aria-labelledby="builder-label">
      <div className="about-text">
        <p className="section-header" id="builder-label">
          {copy.eyebrow[language]}
        </p>
        <h2 className="section-title">{copy.title[language]}</h2>
        <p className="section-body">{copy.body[language]}</p>
        <p className="section-body">{copy.availability[language]}</p>
      </div>
      <div className="about-links">
        <p className="section-header">{copy.linksLabel[language]}</p>
        <SocialLinks />
      </div>
    </section>
  );
}

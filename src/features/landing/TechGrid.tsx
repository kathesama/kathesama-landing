import { Fragment } from 'react';
import { techCards } from '../../content/siteCopy';
import { useLanguage } from '../i18n/LanguageContext';

export function TechGrid() {
  const { language } = useLanguage();

  return (
    <div className="tech-grid">
      {techCards.map((card) => (
        <article className="tech-card" key={card.label.en}>
          <p className="tech-card-label">{card.label[language]}</p>
          <h3 className="tech-card-title">{card.title[language]}</h3>
          <p className="tech-card-body">
            {card.lines.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        </article>
      ))}
    </div>
  );
}

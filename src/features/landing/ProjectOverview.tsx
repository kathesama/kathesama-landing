import { siteCopy } from '../../content/siteCopy';
import { useLanguage } from '../i18n/LanguageContext';
import { StackList } from './StackList';
import { TechGrid } from './TechGrid';

export function ProjectOverview() {
  const { language } = useLanguage();
  const copy = siteCopy.project;

  return (
    <section id="juana" aria-labelledby="project-title">
      <p className="section-header">{copy.eyebrow[language]}</p>
      <h2 className="section-title" id="project-title">
        {copy.title[language]}
      </h2>
      <p className="section-body">{copy.body[language]}</p>
      <TechGrid />
      <StackList />
    </section>
  );
}

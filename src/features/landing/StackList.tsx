import { stackItems } from '../../content/siteCopy';
import { useLanguage } from '../i18n/LanguageContext';

export function StackList() {
  const { language } = useLanguage();

  return (
    <ul
      className="stack-row"
      aria-label={language === 'es' ? 'Stack tecnológico' : 'Technology stack'}
    >
      {stackItems.map((item) => (
        <li className="chip" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

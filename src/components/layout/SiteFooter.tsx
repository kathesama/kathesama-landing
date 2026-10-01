import { useLanguage } from '../../features/i18n/LanguageContext';

export function SiteFooter() {
  const { language } = useLanguage();

  return (
    <footer>
      <span className="footer-logo">KATHESAMA</span>
      <span className="footer-copy">
        <span className="footer-dot" aria-hidden="true" />
        {language === 'es'
          ? 'Buenos Aires, Argentina · JuanaIA está corriendo'
          : 'Buenos Aires, Argentina · JuanaIA is running'}
      </span>
    </footer>
  );
}

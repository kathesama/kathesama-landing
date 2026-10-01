import { AppRoutes, type AppRouteOverrides } from './app/routes';
import { LanguageProvider } from './features/i18n/LanguageContext';
import type { Language } from './features/i18n/language';

export function App({
  initialLanguage,
  routeOverrides,
}: {
  initialLanguage?: Language;
  routeOverrides?: AppRouteOverrides;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <AppRoutes overrides={routeOverrides} />
    </LanguageProvider>
  );
}

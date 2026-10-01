import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  resolveLanguage,
  setLanguageInSearch,
  type Language,
} from './language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = 'kathesama-language';

function readStoredLanguage(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeStoredLanguage(language: Language): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, language);
  } catch {
    // Language selection still works through the URL when storage is unavailable.
  }
}

function readBrowserLanguage(): string {
  return typeof navigator === 'undefined' ? 'en' : navigator.language;
}

type LanguageProviderProps = PropsWithChildren<{ initialLanguage?: Language }>;

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setResolvedLanguage] = useState<Language>(
    () =>
      initialLanguage ??
      resolveLanguage(location.search, readStoredLanguage(), readBrowserLanguage()),
  );

  useEffect(() => {
    const resolved = resolveLanguage(
      location.search,
      readStoredLanguage(),
      readBrowserLanguage(),
    );
    const timeout = window.setTimeout(() => setResolvedLanguage(resolved), 0);

    return () => window.clearTimeout(timeout);
  }, [location.search]);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
    writeStoredLanguage(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        if (nextLanguage === language) return;

        setResolvedLanguage(nextLanguage);
        navigate({
          pathname: location.pathname,
          search: setLanguageInSearch(location.search, nextLanguage),
          hash: location.hash,
        });
      },
    }),
    [language, location.hash, location.pathname, location.search, navigate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// The plan keeps this focused hook beside its provider; consumers should not access the context directly.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);

  if (!value) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return value;
}

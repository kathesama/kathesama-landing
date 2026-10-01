import type { ReactNode } from 'react';

type CodeBlockProps = {
  children: ReactNode;
  language?: string;
  line?: number;
  uiLanguage?: 'en' | 'es';
};

export function CodeBlock({ children, language, line, uiLanguage = 'en' }: CodeBlockProps) {
  const kind = language
    ? uiLanguage === 'es'
      ? `Código ${language}`
      : `${language} code`
    : uiLanguage === 'es'
      ? 'Bloque de código'
      : 'Code block';
  const label = line
    ? uiLanguage === 'es'
      ? `${kind} desde la línea ${line}`
      : `${kind} starting at line ${line}`
    : kind;

  return (
    <div className="code-block">
      {language ? <span className="code-block-language">{language}</span> : null}
      <pre className="code-block-scroll" tabIndex={0} role="region" aria-label={label}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

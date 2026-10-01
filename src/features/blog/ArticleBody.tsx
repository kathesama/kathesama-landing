import { isValidElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown, { type Components, type UrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { BlogLanguage } from '../../content/blog/types';
import { CodeBlock } from './CodeBlock';
import { MarkdownFigure } from './MarkdownFigure';
import {
  isSafeArticleLink,
  isSafeBlogImageSource,
  localizeInternalHref,
} from './urlSafety';

type ArticleBodyProps = {
  markdown: string;
  language?: BlogLanguage;
};

type MarkdownImageNode = {
  type: 'element';
  tagName: 'img';
  properties?: {
    src?: unknown;
    alt?: unknown;
    title?: unknown;
  };
};

type MarkdownParagraphNode = {
  children?: unknown[];
};

function getStandaloneImage(node: MarkdownParagraphNode | undefined): MarkdownImageNode | null {
  if (!node?.children || node.children.length !== 1) return null;
  const child = node.children[0] as Partial<MarkdownImageNode> | undefined;
  return child?.type === 'element' && child.tagName === 'img'
    ? (child as MarkdownImageNode)
    : null;
}

function imageProperty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const safeUrlTransform: UrlTransform = (url, key) => {
  if (key === 'src') return isSafeBlogImageSource(url) ? url : '';
  if (key === 'href') return isSafeArticleLink(url) ? url : '';
  return '';
};

function createMarkdownComponents(language: BlogLanguage): Components {
  let tableIndex = 0;

  return {
    a({ href = '', children, title }) {
      if (!isSafeArticleLink(href)) return <span>{children}</span>;

      if (href.startsWith('/') && !href.startsWith('//')) {
        return (
          <Link to={localizeInternalHref(href, language)} title={title}>
            {children}
          </Link>
        );
      }

      if (href.startsWith('#')) {
        return (
          <a href={href} title={title}>
            {children}
          </a>
        );
      }

      return (
        <a href={href} title={title} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    img({ src = '', alt = '', title }) {
      if (!isSafeBlogImageSource(src) || !alt.trim()) return null;
      return <img src={src} alt={alt} title={title} loading="lazy" decoding="async" />;
    },
    p({ node, children }) {
      const image = getStandaloneImage(node as MarkdownParagraphNode);
      if (!image) return <p>{children}</p>;

      return (
        <MarkdownFigure
          src={imageProperty(image.properties?.src)}
          alt={imageProperty(image.properties?.alt)}
          caption={imageProperty(image.properties?.title) || undefined}
        />
      );
    },
    pre({ children, node }) {
      const code = isValidElement<{ className?: string; children?: ReactNode }>(children)
        ? children
        : null;
      const codeLanguage = code?.props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1];
      return (
        <CodeBlock
          language={codeLanguage}
          line={node?.position?.start.line}
          uiLanguage={language}
        >
          {code?.props.children ?? children}
        </CodeBlock>
      );
    },
    code({ className, children }) {
      return <code className={className}>{children}</code>;
    },
    table({ children, node }) {
      tableIndex += 1;
      const line = node?.position?.start.line;
      const label =
        language === 'es'
          ? line
            ? `Tabla de datos desplazable desde la línea ${line}`
            : `Tabla de datos desplazable ${tableIndex}`
          : line
            ? `Scrollable data table starting at line ${line}`
            : `Scrollable data table ${tableIndex}`;

      return (
        <div
          className="article-table-scroll"
          tabIndex={0}
          role="region"
          aria-label={label}
        >
          <table>{children}</table>
        </div>
      );
    },
  };
}

export function ArticleBody({ markdown, language = 'en' }: ArticleBodyProps) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrlTransform}
        components={createMarkdownComponents(language)}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

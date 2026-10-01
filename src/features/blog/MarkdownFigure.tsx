type MarkdownFigureProps = {
  src: string;
  alt: string;
  caption?: string;
};

export function MarkdownFigure({ src, alt, caption }: MarkdownFigureProps) {
  if (!isSafeBlogImageSource(src) || !alt.trim()) return null;

  return (
    <figure className="article-figure">
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
import { isSafeBlogImageSource } from './urlSafety';

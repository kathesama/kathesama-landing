import { canonicalBlogAssetPaths } from '../../content/blog/assets';

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

const publishedBlogImagePaths = new Set<string>(canonicalBlogAssetPaths);

function decodeUnambiguousUrl(value: string): string | null {
  if (value.includes('\\') || hasControlCharacter(value)) return null;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes('\\') || hasControlCharacter(decoded)) return null;
    if (/%[0-9a-f]{2}/i.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function isSafeBlogImageSource(src: string): boolean {
  return publishedBlogImagePaths.has(src);
}

export function isSafeArticleLink(href: string): boolean {
  const decoded = decodeUnambiguousUrl(href);
  if (!decoded) return false;

  if (href.startsWith('#')) return !decoded.startsWith('#//');

  if (href.startsWith('/')) {
    if (href.startsWith('//') || decoded.startsWith('//')) return false;

    const decodedPath = decoded.split(/[?#]/, 1)[0] ?? '';
    if (decodedPath.split('/').some((segment) => segment === '.' || segment === '..')) {
      return false;
    }

    try {
      const expectedOrigin = 'https://kathesama.ar';
      const resolved = new URL(href, expectedOrigin);
      return resolved.origin === expectedOrigin && resolved.pathname.startsWith('/');
    } catch {
      return false;
    }
  }

  if (!/^https?:\/\//i.test(href)) return false;

  try {
    const url = new URL(href);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
}

export function localizeInternalHref(
  href: string,
  language: 'es' | 'en',
): string {
  if (!href.startsWith('/') || href.startsWith('//') || !isSafeArticleLink(href)) {
    return href;
  }

  try {
    const origin = 'https://kathesama.ar';
    const url = new URL(href, origin);
    if (url.origin !== origin) return href;

    url.searchParams.set('lang', language);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

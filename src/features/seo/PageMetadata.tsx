import { useEffect, useRef } from 'react';
import { renderMetadataHead, type PageMetadataDescriptor } from './pageMetadata';

const marker = 'data-kathesama-meta';
const globalTitle = 'Kathesama — Privacy-First AI Infrastructure';
const globalDescription =
  'JuanaIA — a fully self-hosted personal AI assistant. Built by Katherine E. Aguirre.';

function globalMetadataElements(): Element[] {
  const title = document.createElement('title');
  title.setAttribute(marker, 'title');
  title.textContent = globalTitle;
  const description = document.createElement('meta');
  description.setAttribute('name', 'description');
  description.setAttribute('content', globalDescription);
  description.setAttribute(marker, 'description');
  return [title, description];
}

function selectorForElement(element: Element): string | undefined {
  if (element.tagName === 'TITLE') return 'title';
  if (element.tagName === 'META') {
    const name = element.getAttribute('name');
    const property = element.getAttribute('property');
    if (name) return `meta[name="${name}"]`;
    if (property) return `meta[property="${property}"]`;
  }
  if (element.tagName === 'LINK') {
    const rel = element.getAttribute('rel');
    const hreflang = element.getAttribute('hreflang');
    if (rel === 'alternate' && hreflang) return `link[rel="alternate"][hreflang="${hreflang}"]`;
    if (rel) return `link[rel="${rel}"]`;
  }
  if (element.tagName === 'SCRIPT') return 'script[type="application/ld+json"]';
  return undefined;
}

function synchronizeHead(metadata: PageMetadataDescriptor): void {
  const template = document.createElement('template');
  template.innerHTML = renderMetadataHead(metadata);
  const desiredKeys = new Set<string>();

  for (const next of Array.from(template.content.children)) {
    const key = next.getAttribute(marker);
    if (!key) continue;
    desiredKeys.add(key);

    const owned = Array.from(document.head.querySelectorAll(`[${marker}="${key}"]`));
    const semanticSelector = selectorForElement(next);
    const existing = owned[0] ?? (semanticSelector ? document.head.querySelector(semanticSelector) : null);
    const current = existing && existing.tagName === next.tagName ? existing : next.cloneNode(false) as Element;

    for (const attribute of Array.from(current.attributes)) current.removeAttribute(attribute.name);
    for (const attribute of Array.from(next.attributes)) current.setAttribute(attribute.name, attribute.value);
    current.textContent = next.textContent;
    if (!current.parentNode) document.head.append(current);

    owned.slice(1).forEach((duplicate) => duplicate.remove());
    if (semanticSelector) {
      Array.from(document.head.querySelectorAll(semanticSelector))
        .filter((candidate) => candidate !== current)
        .forEach((duplicate) => duplicate.remove());
    }
  }

  document.head.querySelectorAll(`[${marker}]`).forEach((element) => {
    const key = element.getAttribute(marker);
    if (!key || !desiredKeys.has(key)) element.remove();
  });
}

export function PageMetadata({ metadata }: { metadata: PageMetadataDescriptor }) {
  const originalMetadata = useRef<Element[] | null>(null);

  useEffect(() => {
    const hasRouteMetadata = Boolean(
      document.head.querySelector(
        `[${marker}="canonical"], [${marker}="json-ld"], [${marker}^="alternate-"]`,
      ),
    );
    const originalElements = hasRouteMetadata
      ? globalMetadataElements()
      : Array.from(
          document.head.querySelectorAll(
            `title, meta[name="description"], [${marker}]`,
          ),
        );
    originalMetadata.current = Array.from(new Set(originalElements)).map(
      (element) => element.cloneNode(true) as Element,
    );

    return () => {
      document.head.querySelectorAll(`[${marker}]`).forEach((element) => element.remove());
      document.head
        .querySelectorAll('title, meta[name="description"]')
        .forEach((element) => element.remove());
      originalMetadata.current?.forEach((element) => document.head.append(element));
      originalMetadata.current = null;
    };
  }, []);
  useEffect(() => synchronizeHead(metadata), [metadata]);

  return null;
}

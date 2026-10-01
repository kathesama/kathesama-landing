import type { BlogFrontMatter, ParsedBlogDocument } from './types';

const allowedFields = [
  'id',
  'slug',
  'language',
  'sourceLanguage',
  'sourcePlatform',
  'sourceUrl',
  'sourcePostId',
  'publishedAt',
  'translation',
] as const;

type AllowedField = (typeof allowedFields)[number];

const allowedFieldSet = new Set<string>(allowedFields);
const pollutionFields = new Set(['__proto__', 'prototype', 'constructor']);

export class FrontMatterError extends Error {
  constructor(fileName: string, fieldName: string, reason: string) {
    super(`${fileName}: invalid frontmatter field "${fieldName}" (${reason})`);
    this.name = 'FrontMatterError';
  }
}

function fail(fileName: string, fieldName: string, reason: string): never {
  throw new FrontMatterError(fileName, fieldName, reason);
}

function parseScalar(value: string, fileName: string, fieldName: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return fail(fileName, fieldName, 'expected a JSON scalar');
  }

  if (
    parsed === null ||
    typeof parsed === 'object' ||
    typeof parsed === 'number' ||
    typeof parsed === 'boolean'
  ) {
    return fail(fileName, fieldName, 'expected a JSON string');
  }

  return parsed;
}

function assertStringFields(
  values: Partial<Record<AllowedField, unknown>>,
  fileName: string,
): asserts values is Record<AllowedField, string> {
  for (const field of allowedFields) {
    if (typeof values[field] !== 'string' || values[field].length === 0) {
      fail(fileName, field, 'required string is missing');
    }
  }
}

function assertContract(frontMatter: BlogFrontMatter, fileName: string): void {
  if (frontMatter.language !== 'en' && frontMatter.language !== 'es') {
    fail(fileName, 'language', 'must be en or es');
  }
  if (frontMatter.sourceLanguage !== 'en') {
    fail(fileName, 'sourceLanguage', 'must be en');
  }
  if (frontMatter.sourcePlatform !== 'medium') {
    fail(fileName, 'sourcePlatform', 'must be medium');
  }

  const expectedTranslation =
    frontMatter.language === 'en' ? 'original' : 'local-reviewed';
  if (frontMatter.translation !== expectedTranslation) {
    fail(fileName, 'translation', `must be ${expectedTranslation}`);
  }
}

export function parseBlogDocument(source: string, fileName: string): ParsedBlogDocument {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    fail(fileName, '<document>', 'missing opening delimiter');
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  const endsAtDelimiter = normalized.endsWith('\n---');
  if (closingIndex === -1 && !endsAtDelimiter) {
    fail(fileName, '<document>', 'missing closing delimiter');
  }

  const delimiterIndex = closingIndex === -1 ? normalized.length - 4 : closingIndex;
  const frontMatterSource = normalized.slice(4, delimiterIndex);
  const bodyStart = delimiterIndex + (closingIndex === -1 ? 4 : 5);
  const body = normalized.slice(bodyStart).replace(/^\n+/, '').trimEnd();
  const values: Partial<Record<AllowedField, unknown>> = Object.create(null);
  const seen = new Set<string>();

  for (const line of frontMatterSource.split('\n')) {
    if (line.trim().length === 0) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) {
      fail(fileName, '<line>', 'expected field and value');
    }

    const fieldName = line.slice(0, colonIndex).trim();
    if (pollutionFields.has(fieldName) || !allowedFieldSet.has(fieldName)) {
      fail(fileName, fieldName || '<line>', 'unknown field');
    }
    if (seen.has(fieldName)) {
      fail(fileName, fieldName, 'duplicate field');
    }

    seen.add(fieldName);
    values[fieldName as AllowedField] = parseScalar(
      line.slice(colonIndex + 1).trim(),
      fileName,
      fieldName,
    );
  }

  assertStringFields(values, fileName);
  const frontMatter = values as unknown as BlogFrontMatter;
  assertContract(frontMatter, fileName);

  return { fileName, frontMatter, body };
}

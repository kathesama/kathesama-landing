import { describe, expect, it } from 'vitest';
import { blogCatalog } from '../content/blog/catalog';
import { publicArchitecture } from '../content/architecture';

const expectedLensIds = [
  'layers',
  'request-lifecycle',
  'knowledge-flows',
  'trust',
  'reliability',
  'decisions',
  'capability-status',
  'technologies',
  'contracts',
] as const;

describe('public release contract', () => {
  it('ships the complete bilingual article set', () => {
    expect(blogCatalog).toHaveLength(4);
    expect(
      blogCatalog.every(
        (article) => article.title.es.trim().length > 0 && article.title.en.trim().length > 0,
      ),
    ).toBe(true);
  });

  it('ships the complete public architecture lens set', () => {
    const architectureWithOptionalLenses = publicArchitecture as typeof publicArchitecture & {
      lenses?: Array<{ id?: unknown }>;
    };

    expect(architectureWithOptionalLenses.lenses?.map((lens) => lens.id)).toEqual(
      expectedLensIds,
    );
  });
});

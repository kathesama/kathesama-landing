# Kathesama Bilingual Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan one task at a time. Each task must follow RED → GREEN → REFACTOR, receive spec review, and then receive code-quality review before the next task starts.

**Goal:** Publish Katherine's four existing Medium articles as a local, bilingual English/Spanish technical journal at `/blog` and `/blog/:slug`, add a writing preview to the landing page, and make every article readable, attributable, accessible, and indexable without a runtime dependency on Medium.

**Architecture:** Authored Markdown files and a small typed catalog are the public source of truth. A strict frontmatter parser and content validator reject incomplete pairs, unsafe markup, remote/tracking images, missing alternative text, and inconsistent source metadata. A separate, opt-in import command can reproduce English drafts and local assets from a committed RSS fixture or an explicitly requested live feed refresh, but neither the build nor the browser fetches Medium. The blog route is lazy-loaded; the landing imports metadata only. React Markdown renders the reviewed local body with raw HTML disabled. A small SSR/prerender step emits English HTML, article metadata, sitemap entries, and JSON-LD while the existing `?lang=en|es` provider switches the hydrated reader to the requested language.

**Tech Stack:** React 19, TypeScript, React Router, Vite, React Markdown, remark-gfm, Vitest, React Testing Library, vitest-axe, Node/tsx, fast-xml-parser, Turndown, CSS

---

## Plan Boundary

This is plan 3 of 3. It assumes the React migration plan is complete and is intended to run after the public-architecture plan. It owns the public writing experience, article content pipeline, article metadata, and static publishing support. It does **not** add a CMS, edit articles in the browser, synchronize with Medium at runtime, add Keycloak, expose repository details, or implement the private codebase visualizer.

Commit and pull-request steps are intentionally omitted because the governing user instructions prohibit agent-created commits and pull requests.

The approved query-parameter language trade-off remains in force: the static HTML is English and `?lang=es` switches to the complete local Spanish edition after hydration. If independent Spanish social previews become mandatory later, use localized paths or edge/server rendering; do not silently change the approved URL model in this plan.

## Editorial and Visual Direction

Treat the blog as **Juana field notes**, not a grid of generic cards:

- Continue the existing near-black field, teal signal color, gold annotations, Syne display face, Fraunces reading face, and DM Mono technical labels.
- Make the featured CDKE story a wide editorial lead with an oversized issue number, a thin signal trace, restrained local artwork, and asymmetric metadata—not a rounded dashboard tile.
- Render the complete series as a chronological vertical build log. Each entry has a numbered marker, date, title, summary, tags, and one clear text link connected by a hairline trace.
- Keep article bodies close to `68ch`, with a separate mono metadata rail on wide screens. On narrow screens that rail becomes a compact header above the body.
- Give code blocks a quiet raised surface, visible language label when present, keyboard-scrollable overflow, and no decorative syntax-highlighting dependency in this phase.
- Treat figures as editorial evidence: full-width inside the reading column, localized non-empty alt text, optional caption, and no remote pixels.
- Use motion only for the initial signal-line/entry reveal; preserve complete meaning when motion is reduced.

The memorable element is the numbered signal trace that carries readers from the first local-assistant experiment to the CDKE system. Avoid detached card grids, purple gradients, glassmorphism, and decorative animations that compete with long-form reading.

## Canonical Article Matrix

The catalog must contain exactly these four entries in narrative order. `seriesOrder` is stable even if publication dates or featured selection change later.

| Order | Stable ID | Slug | Published at (UTC) | Medium post ID | Source URL | Featured |
|---|---|---|---|---|---|---|
| 1 | `juana-build-01` | `building-juana-self-hosted-ai` | `2026-03-14T21:22:40Z` | `c5a60ad26791` | `https://medium.com/@kathesama/im-building-a-personal-ai-that-lives-on-my-pc-here-s-what-i-ve-learned-so-far-c5a60ad26791` | no |
| 2 | `juana-build-02` | `juana-orchestration-layer` | `2026-04-08T16:14:22Z` | `c5eb39f8c320` | `https://medium.com/@kathesama/i-gave-my-local-ai-a-brain-how-i-designed-the-orchestration-layer-c5eb39f8c320` | no |
| 3 | `juana-build-03` | `self-hosted-ai-latency-24-to-2` | `2026-04-30T16:58:14Z` | `2085faacab7f` | `https://medium.com/@kathesama/from-24-seconds-to-2-how-i-optimized-response-times-in-a-self-hosted-ai-assistant-2085faacab7f` | no |
| 4 | `juana-build-04` | `curiosity-driven-knowledge-enrichment` | `2026-05-10T05:08:08Z` | `c6e711c0ff8a` | `https://medium.com/@kathesama/when-your-ai-has-photographic-memory-but-no-understanding-designing-curiosity-driven-knowledge-c6e711c0ff8a` | yes |

The exact English titles are:

1. “I’m Building a Personal AI That Lives on My PC — Here’s What I’ve Learned So Far”
2. “I Gave My Local AI a Brain: How I Designed the Orchestration Layer”
3. “From 24 Seconds to 2: How I Optimized Response Times in a Self-Hosted AI Assistant”
4. “When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment”

English is the original publication. Spanish is a complete local editorial translation that preserves technical meaning and authorial tone. Spanish article pages visibly state that they are a locally reviewed translation of the English original; they never imply that Medium published the Spanish edition.

## Canonical Asset Inventory

The importer maps the 11 RSS images to deterministic local paths. Keep the source URL only in the non-public source inventory; rendered Markdown uses only `/images/blog/...` paths.

| Article slug | Local path | Source image | Source alt state |
|---|---|---|---|
| `building-juana-self-hosted-ai` | `public/images/blog/building-juana-self-hosted-ai/figure-01.png` | `https://cdn-images-1.medium.com/max/1024/1*XzB-Tuqt_QMVzeY6qk1-gw.png` | missing; editorial EN/ES alt required |
| `building-juana-self-hosted-ai` | `public/images/blog/building-juana-self-hosted-ai/figure-02.png` | `https://cdn-images-1.medium.com/max/1024/1*MEmuE04cXoLQmh2mwd989A.png` | EN source: “Juana working on Simulated space”; localize ES |
| `building-juana-self-hosted-ai` | `public/images/blog/building-juana-self-hosted-ai/figure-03.png` | `https://cdn-images-1.medium.com/max/1024/1*uhCOMBtUBEASO8pDvuS5XA.png` | EN source: “Juana IA”; localize ES |
| `juana-orchestration-layer` | `public/images/blog/juana-orchestration-layer/figure-01.png` | `https://cdn-images-1.medium.com/max/1024/1*8LhhgIZ9yZ0dmaL7zsLaOA.png` | missing; editorial EN/ES alt required |
| `juana-orchestration-layer` | `public/images/blog/juana-orchestration-layer/figure-02.png` | `https://cdn-images-1.medium.com/max/900/1*XZmBmegI0f086n456rzG-g.png` | missing; editorial EN/ES alt required |
| `juana-orchestration-layer` | `public/images/blog/juana-orchestration-layer/figure-03.png` | `https://cdn-images-1.medium.com/max/900/1*1g0wAI9_-h_lVyBKziFiEQ.png` | missing; editorial EN/ES alt required |
| `self-hosted-ai-latency-24-to-2` | `public/images/blog/self-hosted-ai-latency-24-to-2/figure-01.png` | `https://cdn-images-1.medium.com/max/681/1*R0Jev6tbp4mE_bKB0VwgAA.png` | missing; editorial EN/ES alt required |
| `self-hosted-ai-latency-24-to-2` | `public/images/blog/self-hosted-ai-latency-24-to-2/figure-02.png` | `https://cdn-images-1.medium.com/max/674/1*B8vn6E7ecWnCO16WjNCHCQ.png` | missing; editorial EN/ES alt required |
| `self-hosted-ai-latency-24-to-2` | `public/images/blog/self-hosted-ai-latency-24-to-2/figure-03.png` | `https://cdn-images-1.medium.com/max/683/1*5CIWQPtLwnQGV0IH31cNZQ.png` | missing; editorial EN/ES alt required |
| `self-hosted-ai-latency-24-to-2` | `public/images/blog/self-hosted-ai-latency-24-to-2/figure-04.png` | `https://cdn-images-1.medium.com/max/682/1*8HEMvIFj5VOvgc939HA8WQ.png` | missing; editorial EN/ES alt required |
| `curiosity-driven-knowledge-enrichment` | `public/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png` | `https://cdn-images-1.medium.com/max/1024/1*zW5IaUpykMYsBEaR1ZUWBg.png` | preserve and localize the complete CDKE architecture description |

Task 2 is not GREEN while any of the eight missing source alts remains empty, generic (“image”, “diagram”), filename-derived, or untranslated. Inspect each local image and write a concise functional description. Preserve the full English CDKE alt:

> Figure: CDKE Architecture — Knowledge Map feeds domain awareness into the Curiosity Loop; the Interest Vector governs what the loop is allowed to investigate; both connect to the underlying RAG pipeline via ingestion, gap detection, and Planner integration.

## Content Contract

Each paired Markdown document starts with flat, JSON-scalar frontmatter. The parser deliberately supports no YAML aliases, tags, arbitrary objects, or executable values.

```md
---
id: "juana-build-01"
slug: "building-juana-self-hosted-ai"
language: "en"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/...-c5a60ad26791"
sourcePostId: "c5a60ad26791"
publishedAt: "2026-03-14T21:22:40Z"
translation: "original"
---
```

The Spanish pair uses `language: "es"` and `translation: "local-reviewed"`; all source fields remain identical. The typed catalog owns localized title, summary, tags, cover path/alt, `seriesOrder`, and `featured`. Article Markdown begins with body content, not another `<h1>`.

The validator enforces:

- exactly four unique catalog items and exactly one EN/ES document pair per item;
- exact IDs, slugs, Medium IDs, source URLs, timestamps, `seriesOrder`, and CDKE featured state from the matrix above;
- `sourceLanguage=en`, `sourcePlatform=medium`, `translation=original` for EN, and `translation=local-reviewed` for ES;
- a valid ISO UTC timestamp and stable chronological series order;
- complete localized title, summary, tags, cover alt, and non-trivial body content;
- 11 referenced local image files, correct slug-local paths, non-empty localized Markdown alt text, and no path traversal;
- no `medium.com/_/stat`, `?source=rss`, query/fragment suffix on image URLs, remote image source, raw HTML, iframe, script, event handler, `javascript:` URL, `data:` URL, private key marker, or obvious access-token pattern;
- every in-article external link uses an HTTP(S) URL; the renderer adds safe `target`/`rel` attributes;
- the RSS fixture and source inventory are never present in `public/` or `dist/`.

Automated secret patterns are a tripwire, not a disclosure proof. The final task still requires a human read of all eight editions and the built HTML.

## File Structure

### Content source and assets

- Create `content/blog/source/medium-feed-2026-09-30.xml`: committed four-post RSS fixture used only by the importer.
- Create `content/blog/source/source-inventory.json`: source post/image mapping and optional checksums; never shipped.
- Create `content/blog/articles/building-juana-self-hosted-ai.en.md`.
- Create `content/blog/articles/building-juana-self-hosted-ai.es.md`.
- Create `content/blog/articles/juana-orchestration-layer.en.md`.
- Create `content/blog/articles/juana-orchestration-layer.es.md`.
- Create `content/blog/articles/self-hosted-ai-latency-24-to-2.en.md`.
- Create `content/blog/articles/self-hosted-ai-latency-24-to-2.es.md`.
- Create `content/blog/articles/curiosity-driven-knowledge-enrichment.en.md`.
- Create `content/blog/articles/curiosity-driven-knowledge-enrichment.es.md`.
- Create the 11 `public/images/blog/...` files listed in the canonical asset inventory.

### Content model and tooling

- Create `src/content/blog/types.ts`: article, localized metadata, translation-state, and parsed-document types.
- Create `src/content/blog/catalog.ts`: exact lightweight metadata for four articles; safe to import on the landing page.
- Create `src/content/blog/frontMatter.ts`: restricted flat-frontmatter parser.
- Create `src/content/blog/articleDocuments.ts`: eager raw Markdown imports used only by lazy blog/article modules.
- Create `src/content/blog/selectors.ts`: featured, ordered-series, neighboring-article, date, and reading-time functions.
- Create `src/content/blog/validation.ts`: pure catalog/document/asset-reference validation.
- Create `scripts/import-medium-blog.ts`: explicit RSS fixture/live-feed staging importer.
- Create `scripts/validate-blog-content.ts`: production validation entry point.
- Create `scripts/verify-blog-build.ts`: built-output and non-leakage check.
- Create `scripts/fixtures/medium-feed.test.xml`: tiny synthetic importer fixture containing a tracker, query parameter, image, code, and link.

### Blog UI

- Create `src/features/blog/BlogRouteFallback.tsx`.
- Create `src/features/blog/FeaturedArticle.tsx`.
- Create `src/features/blog/SeriesTimeline.tsx`.
- Create `src/features/blog/FeaturedWriting.tsx`.
- Create `src/features/blog/ArticleHeader.tsx`.
- Create `src/features/blog/ArticleBody.tsx`.
- Create `src/features/blog/MarkdownFigure.tsx`.
- Create `src/features/blog/CodeBlock.tsx`.
- Create `src/features/blog/MediumAttribution.tsx`.
- Create `src/features/blog/SeriesNavigation.tsx`.
- Create `src/features/blog/BlogNotFound.tsx`.
- Create `src/pages/BlogIndexPage.tsx`.
- Create `src/pages/ArticlePage.tsx`.
- Create `src/styles/blog.css`.
- Modify `src/pages/LandingPage.tsx`.
- Modify `src/app/routes.tsx`.
- Modify `src/app/routes.test.tsx`.
- Delete `src/pages/ComingSoonPage.tsx` once both architecture and blog placeholders are gone.

### SEO and static publishing

- Create `src/features/seo/pageMetadata.ts`: pure localized page metadata and canonical/hreflang builders.
- Create `src/features/seo/PageMetadata.tsx`: client-side document-head synchronization.
- Create `src/entry-server.tsx`: streaming SSR entry used only at build time.
- Create `src/app/mountApp.tsx`: create-vs-hydrate browser mounting.
- Create `scripts/prerender-public-routes.ts`: route HTML, sitemap, and robots generation.
- Create `public/robots.txt`.
- Modify `src/main.tsx`.
- Modify `src/App.tsx`.
- Modify `src/features/i18n/LanguageContext.tsx`.
- Modify `index.html`.
- Modify `package.json`, `pnpm-lock.yaml`, `tsconfig.node.json`, `.gitignore`, and `vercel.json` only as specified below.

### Tests

- Create `src/content/blog/frontMatter.test.ts`.
- Create `src/content/blog/validation.test.ts`.
- Create `src/content/blog/content.test.ts`.
- Create `src/content/blog/selectors.test.ts`.
- Create `scripts/import-medium-blog.test.ts`.
- Create `src/pages/BlogIndexPage.test.tsx`.
- Create `src/pages/ArticlePage.test.tsx`.
- Create `src/features/blog/ArticleBody.test.tsx`.
- Create `src/features/blog/FeaturedWriting.test.tsx`.
- Create `src/features/seo/pageMetadata.test.ts`.
- Create `src/features/seo/PageMetadata.test.tsx`.
- Create `scripts/prerender-public-routes.test.ts`.
- Create `src/pages/BlogAccessibility.test.tsx`.

---

## Task 1: Establish the Safe Local Content Contract and Reproducible Importer

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.node.json`
- Modify: `.gitignore`
- Create: `src/content/blog/types.ts`
- Create: `src/content/blog/frontMatter.ts`
- Create: `src/content/blog/validation.ts`
- Create: `scripts/import-medium-blog.ts`
- Create: `scripts/validate-blog-content.ts`
- Create: `scripts/fixtures/medium-feed.test.xml`
- Test: `src/content/blog/frontMatter.test.ts`
- Test: `src/content/blog/validation.test.ts`
- Test: `scripts/import-medium-blog.test.ts`

- [ ] **Step 1: Add only the required content dependencies**

Run:

```powershell
pnpm add react-markdown remark-gfm
pnpm add -D fast-xml-parser turndown @types/turndown tsx @types/node
```

If `tsx` or `@types/node` already exists from the architecture plan, keep the existing compatible version rather than adding a duplicate. Do not add MDX, a browser CMS, a runtime sanitizer that enables raw HTML, syntax highlighting, or an RSS client.

- [ ] **Step 2: Write failing restricted-frontmatter tests**

Test that the parser:

- accepts the exact flat contract shown above;
- returns the body separately;
- rejects missing delimiters, duplicate or unknown keys, non-JSON scalar values, wrong language/translation combinations, YAML tags/aliases, and prototype-pollution keys;
- never evaluates frontmatter as JavaScript.

Run:

```powershell
pnpm test:run -- src/content/blog/frontMatter.test.ts
```

Expected RED: the parser module does not exist.

- [ ] **Step 3: Implement the smallest strict parser and shared types**

Parse between exact `---` delimiters. Split each non-empty frontmatter line at the first colon and parse the value as a JSON scalar or JSON string array. Compare keys against a hard allowlist and return typed errors containing only file name and field name—not the whole body. Do not use `eval`, a general YAML loader, or raw HTML.

Run the Step 2 command.

Expected GREEN: every safe case passes and every malformed/extra field is rejected.

- [ ] **Step 4: Write failing validator and importer tests**

The pure validator tests use in-memory documents and assert every Content Contract rule. The importer test fixture must include:

- one normal Medium item;
- one `medium.com/_/stat` image;
- one CDN image with `?source=rss...`;
- a fenced-code candidate and an external link;
- an absent source alt.

Test that import output drops the tracker, strips query/fragment from image sources, allocates a deterministic local path, preserves code as fenced Markdown, creates English frontmatter, records the missing-alt review item, and does not fetch or write when running in dry-run mode.

Run:

```powershell
pnpm test:run -- src/content/blog/validation.test.ts scripts/import-medium-blog.test.ts
```

Expected RED: validation/import modules or behavior are missing.

- [ ] **Step 5: Implement a staging-only importer**

`scripts/import-medium-blog.ts` supports:

```text
--fixture <path>              read a local RSS snapshot (default workflow)
--feed-url <https-url>        explicit network refresh; never the build default
--output <empty-directory>    required before files are written
--download-assets             explicit; HTTPS and cdn-images-1.medium.com only
--dry-run                     default; print IDs/counts/review items only
```

The importer must refuse an existing non-empty output directory unless an explicit `--force` is added by a future approved change. Derive filenames from the stable slug and ordinal, never from a remote path. Cap each asset response, validate image content type, and keep all output under the resolved staging directory. Convert only the supported Medium HTML subset with Turndown; reject script/style/iframe/object/embed nodes and log missing-alt review items. The importer creates English **drafts** and a source inventory; it never overwrites Spanish translations or the reviewed catalog.

The production build calls `validate:blog`, never `import:medium`, and never makes a network request.

- [ ] **Step 6: Wire scripts without weakening the existing check**

Add:

```json
{
  "scripts": {
    "import:medium": "tsx scripts/import-medium-blog.ts --dry-run",
    "validate:blog": "tsx scripts/validate-blog-content.ts"
  }
}
```

Extend `tsconfig.node.json` to cover `scripts/**/*.ts` while retaining strict settings. Ignore `.blog-import/` and `.ssr-blog/`; do not ignore authored Markdown or public assets.

Run:

```powershell
pnpm test:run -- src/content/blog/frontMatter.test.ts src/content/blog/validation.test.ts scripts/import-medium-blog.test.ts
pnpm typecheck
pnpm lint
```

Expected GREEN: parser/import safety tests, typecheck, and lint pass; no canonical article file has been created yet.

---

## Task 2: Import, Review, Translate, and Validate the Four-Article Corpus

**Files:**
- Create: `content/blog/source/medium-feed-2026-09-30.xml`
- Create: `content/blog/source/source-inventory.json`
- Create: the eight `content/blog/articles/*.md` files listed under File Structure
- Create: the 11 `public/images/blog/...` files listed under Canonical Asset Inventory
- Create: `src/content/blog/catalog.ts`
- Create: `src/content/blog/articleDocuments.ts`
- Create: `src/content/blog/selectors.ts`
- Modify: `scripts/validate-blog-content.ts`
- Modify: `package.json`
- Test: `src/content/blog/content.test.ts`
- Test: `src/content/blog/selectors.test.ts`

- [ ] **Step 1: Write failing canonical-corpus tests**

Assert:

- the exact four rows in the Canonical Article Matrix;
- exact English titles, four sequential series positions, and only CDKE featured;
- eight documents with valid language/translation pairings;
- chronological selectors return 1 → 4 while the featured selector returns order 4;
- prior/next selectors return no previous item for order 1, no next item for order 4, and the expected neighbors in between;
- UTC date formatting cannot shift the displayed calendar day because of the host timezone;
- reading time is derived from normalized prose, excludes frontmatter/Markdown syntax/code fences, and is at least one minute;
- 11 local images exist and every image occurrence has a meaningful localized alt;
- no article Markdown contains a remote image, tracker, `source=rss`, unsafe protocol, raw HTML, or placeholder translation;
- the committed RSS fixture/source inventory is outside `src/` and `public/`.

Run:

```powershell
pnpm test:run -- src/content/blog/content.test.ts src/content/blog/selectors.test.ts
```

Expected RED: the catalog, content pairs, selectors, and/or assets are absent.

- [ ] **Step 2: Capture the source fixture and stage the English import**

Save the authoritative `https://medium.com/feed/@kathesama` response as `content/blog/source/medium-feed-2026-09-30.xml`. Run the importer against that fixture into a fresh `.blog-import/` directory. Confirm the dry-run reports four post IDs and 11 non-tracker images before writing staged output.

Run:

```powershell
pnpm import:medium -- --fixture content/blog/source/medium-feed-2026-09-30.xml
pnpm exec tsx scripts/import-medium-blog.ts --fixture content/blog/source/medium-feed-2026-09-30.xml --output .blog-import --download-assets
```

Expected: the first command changes nothing; the second writes only under `.blog-import/`, produces the exact four IDs and 11 deterministic local asset candidates, and reports eight alt descriptions requiring editorial work.

- [ ] **Step 3: Promote reviewed English content and assets**

Review the staged English Markdown against the RSS `content:encoded` bodies. Preserve prose, headings, lists, blockquotes, links, and code accurately while removing the Medium tracker and presentation-only wrappers. Copy the 11 verified images to their canonical `public/images/blog/...` paths and record source URL, local path, media type, byte size, and SHA-256 in `source-inventory.json`.

Do not retain `?source=rss`, fragments, remote image references, Medium tracking pixels, or generic missing-alt placeholders in a canonical article.

- [ ] **Step 4: Create the typed catalog and complete Spanish editions**

Create the four catalog items with localized title, faithful one- or two-sentence summary, localized tags, cover path/alt, and the exact source metadata. Use each article's first meaningful figure as its cover; CDKE uses `cdke-architecture.png`.

Translate the complete body of each article into Spanish locally. Preserve product names, code, commands, identifiers, numerical measurements, and links; translate prose, headings, captions, and meaningful alt text. Mark only the English files `original` and only the Spanish files `local-reviewed`. A human bilingual read is required before GREEN; machine output alone is not evidence of review.

Inspect the eight images whose source alt was empty and write meaningful EN/ES descriptions based on the actual local image. Never infer their contents from filenames.

- [ ] **Step 5: Load the corpus without pulling bodies into the landing bundle**

`catalog.ts` contains metadata only. `articleDocuments.ts` owns `import.meta.glob('../../../content/blog/articles/*.md', { query: '?raw', import: 'default', eager: true })`, parses the eight documents, and is imported only by lazy blog/article modules and tests. `selectors.ts` remains pure and can operate on the lightweight catalog.

Do not import `articleDocuments.ts`, React Markdown, or any article body from `LandingPage`/`FeaturedWriting`.

- [ ] **Step 6: Make corpus validation a build gate**

Update `validate:blog` to read the real catalog/documents/assets and print only a safe summary such as:

```text
blog: 4 articles, 8 localized documents, 11 local images
```

On failure, report file and field/path without dumping article bodies. Prepend `pnpm validate:blog` to `build`; retain existing lint, typecheck, test, architecture validation, and build behavior from earlier plans.

Run:

```powershell
pnpm validate:blog
pnpm test:run -- src/content/blog/content.test.ts src/content/blog/selectors.test.ts
pnpm typecheck
```

Expected GREEN: exact corpus and asset counts pass, all eight editions are complete, and no Medium request is needed to load or validate content.

---

## Task 3: Build the Safe Long-Form Article Reader and Article Route

**Files:**
- Create: `src/features/blog/BlogRouteFallback.tsx`
- Create: `src/features/blog/ArticleHeader.tsx`
- Create: `src/features/blog/ArticleBody.tsx`
- Create: `src/features/blog/MarkdownFigure.tsx`
- Create: `src/features/blog/CodeBlock.tsx`
- Create: `src/features/blog/MediumAttribution.tsx`
- Create: `src/features/blog/SeriesNavigation.tsx`
- Create: `src/features/blog/BlogNotFound.tsx`
- Create: `src/pages/ArticlePage.tsx`
- Create: `src/styles/blog.css`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/routes.test.tsx`
- Test: `src/features/blog/ArticleBody.test.tsx`
- Test: `src/pages/ArticlePage.test.tsx`

- [ ] **Step 1: Write failing renderer tests**

Test that `ArticleBody`:

- renders headings, paragraphs, blockquotes, ordered/unordered lists, tables, fenced code, and local images from Markdown;
- never renders embedded raw HTML;
- refuses a remote image or unsafe URL even if validation is bypassed;
- wraps a standalone Markdown image/title as a semantic figure/caption without producing `<p><figure>` invalid nesting;
- gives code overflow a keyboard-focusable region;
- adds `target="_blank" rel="noopener noreferrer"` only to external links and leaves internal links in-app;
- exposes meaningful alt text and never uses a background image for article evidence.

Run:

```powershell
pnpm test:run -- src/features/blog/ArticleBody.test.tsx
```

Expected RED: reader components do not exist.

- [ ] **Step 2: Implement the Markdown renderer with raw HTML disabled**

Use `react-markdown` with `remark-gfm` and `skipHtml`. Supply explicit component overrides for links, images/figures, paragraphs containing a standalone image, `pre`, and `code`. Accept only root-relative `/images/blog/` sources for images. Use React text nodes—not `dangerouslySetInnerHTML`—for article Markdown.

`MarkdownFigure` uses the Markdown alt as image alt and the optional title as caption. `CodeBlock` keeps `<pre>` horizontally scrollable and focusable. Do not add syntax highlighting in this phase.

Run the Step 1 command.

Expected GREEN: supported prose renders, unsafe HTML/URLs do not, and figure/code semantics pass.

- [ ] **Step 3: Write failing article-route tests**

Render `/blog/:slug?lang=en|es` through the real `App` and assert:

- exact localized title, summary, date, tags, reading time, and full body language;
- visible original/translation status;
- visible source attribution linking to the exact Medium URL;
- previous/next links follow `seriesOrder` and preserve `?lang=`;
- “Back to the series” preserves language;
- the language toggle stays on the same slug and switches the complete local body;
- unknown slugs render a localized writing-specific 404 with Home and Writing links;
- direct article navigation sits inside the existing `AppShell` and focus behavior still works.

Run:

```powershell
pnpm test:run -- src/pages/ArticlePage.test.tsx src/app/routes.test.tsx
```

Expected RED: `/blog/:slug` is unmatched or the article reader is absent.

- [ ] **Step 4: Implement the article composition and route**

`ArticlePage` resolves only a catalog entry and its current-language document. Compose `ArticleHeader`, `ArticleBody`, `MediumAttribution`, and `SeriesNavigation`; do not put parsing, navigation rules, or document mutation in the page component.

Create the article route with `React.lazy` and a localized `Suspense` fallback. Keep the public architecture route unchanged. Import `blog.css` from the lazy blog feature so long-form rules do not inflate unrelated feature code; landing-specific preview styles may be emitted separately by its component.

- [ ] **Step 5: Apply the editorial reader layout**

Implement:

- a `68ch` body measure and generous vertical rhythm;
- a desktop metadata rail and single-column mobile header;
- visible focus, WCAG AA colors, underlined inline links, and scroll margins for headings;
- responsive figures (`max-width: 100%; height: auto`) and focusable code overflow;
- no fixed heights on prose or figures;
- reduced-motion behavior that keeps all content visible.

Run:

```powershell
pnpm test:run -- src/features/blog/ArticleBody.test.tsx src/pages/ArticlePage.test.tsx src/app/routes.test.tsx
pnpm lint
pnpm typecheck
```

Expected GREEN: both languages and all navigation/fallback behavior pass with no unsafe renderer escape hatch.

---

## Task 4: Build the Editorial Blog Index and Landing Writing Preview

**Files:**
- Create: `src/features/blog/FeaturedArticle.tsx`
- Create: `src/features/blog/SeriesTimeline.tsx`
- Create: `src/features/blog/FeaturedWriting.tsx`
- Create: `src/pages/BlogIndexPage.tsx`
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/routes.test.tsx`
- Modify: `src/styles/blog.css`
- Delete: `src/pages/ComingSoonPage.tsx` after confirming no route imports it
- Test: `src/pages/BlogIndexPage.test.tsx`
- Test: `src/features/blog/FeaturedWriting.test.tsx`
- Modify: `src/pages/LandingPage.test.tsx`

- [ ] **Step 1: Write failing blog-index tests**

Assert in both languages:

- one featured lead is CDKE regardless of catalog array order;
- the full series appears once in chronological `seriesOrder` 1–4;
- every local article link preserves `?lang=`;
- source dates use localized formatting with UTC stability;
- the index does not fetch or link article images from Medium;
- the page has one clear `<h1>` and a meaningful ordered-series landmark;
- the featured lead is not duplicated as a second generic card outside the required complete series timeline.

Run:

```powershell
pnpm test:run -- src/pages/BlogIndexPage.test.tsx
```

Expected RED: `/blog` still renders the placeholder.

- [ ] **Step 2: Implement the index as a feature plus signal timeline**

`BlogIndexPage` composes a short bilingual masthead, `FeaturedArticle`, and `SeriesTimeline`. The feature uses CDKE's local image and links to the local article. The timeline is an ordered list with visible issue numbers and all four entries. Metadata comes only from `catalog.ts`; the index does not load article bodies.

Replace the `/blog` placeholder with a lazy real page and await it in route tests. Preserve the architecture route and query-language behavior.

- [ ] **Step 3: Write failing landing-preview tests**

Assert that the landing:

- keeps all existing hero/project/builder copy;
- places Writing after `ArchitecturePreview` and before `BuilderSection` when Plan 2 is present;
- names and links CDKE as the lead and exposes the other three series steps compactly;
- preserves `?lang=` in every local link;
- imports metadata only, proven by a module-boundary test or build-chunk inspection;
- does not break the existing semantic counts by relying on global `article`/`listitem` counts—scope legacy preservation assertions to the tech grid and stack instead.

Run:

```powershell
pnpm test:run -- src/features/blog/FeaturedWriting.test.tsx src/pages/LandingPage.test.tsx
```

Expected RED: no writing preview exists.

- [ ] **Step 4: Implement the compact landing preview**

Render `FeaturedWriting` immediately after `ArchitecturePreview` and before `BuilderSection`. Use one strong lead link plus a compact signal-line sequence for the remaining entries. Keep summaries brief and avoid loading Markdown or React Markdown on `/`.

If implementation order temporarily lacks `ArchitecturePreview`, place Writing after `ProjectOverview`, then move it to the approved location as part of Plan 2 integration before declaring this task complete.

- [ ] **Step 5: Remove the final placeholder and verify route boundaries**

Delete `ComingSoonPage.tsx` only after `rg` confirms neither architecture nor blog routes reference it. Confirm the landing entry chunk contains no article-body text and no React Markdown module; blog chunks may contain both.

Run:

```powershell
pnpm test:run -- src/pages/BlogIndexPage.test.tsx src/features/blog/FeaturedWriting.test.tsx src/pages/LandingPage.test.tsx src/app/routes.test.tsx
pnpm build
```

Expected GREEN: `/blog` is real, the landing retains its identity/content, and article bodies remain outside the initial landing bundle.

---

## Task 5: Add Canonical Metadata, hreflang, JSON-LD, and Static English Prerendering

**Files:**
- Create: `src/features/seo/pageMetadata.ts`
- Create: `src/features/seo/PageMetadata.tsx`
- Create: `src/entry-server.tsx`
- Create: `src/app/mountApp.tsx`
- Create: `scripts/prerender-public-routes.ts`
- Create: `scripts/verify-blog-build.ts`
- Create: `public/robots.txt`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/features/i18n/LanguageContext.tsx`
- Modify: `src/pages/BlogIndexPage.tsx`
- Modify: `src/pages/ArticlePage.tsx`
- Modify: `index.html`
- Modify: `package.json`
- Modify: `tsconfig.node.json`
- Modify: `.gitignore`
- Modify: `vercel.json` only if filesystem-first serving is not already preserved
- Test: `src/features/seo/pageMetadata.test.ts`
- Test: `src/features/seo/PageMetadata.test.tsx`
- Test: `scripts/prerender-public-routes.test.ts`

- [ ] **Step 1: Write failing pure metadata tests**

For blog index and each article/language, assert:

- localized title and description;
- self-canonical `https://kathesama.ar/...?...lang=en|es`, never the Medium URL;
- alternate links for `en`, `es`, and `x-default` while preserving the route/slug;
- Open Graph/Twitter title, description, image, type, locale, and URL;
- `BlogPosting` JSON-LD with author, `datePublished`, `inLanguage`, local image, series relationship, and `isBasedOn`/source URL;
- JSON serialization escapes `<` and cannot terminate a script element.

Run:

```powershell
pnpm test:run -- src/features/seo/pageMetadata.test.ts
```

Expected RED: metadata builders do not exist.

- [ ] **Step 2: Implement pure metadata plus client head synchronization**

Use `https://kathesama.ar` as the only base URL. `PageMetadata` updates a single owned set of `title`, description, canonical, hreflang, OG/Twitter, and JSON-LD elements identified by stable `data-kathesama-meta` markers. It must update in place on language or slug changes and clean obsolete article-only tags when navigating back to the index.

The original Medium URL appears as attribution and `isBasedOn`; it is not the canonical URL for the local article.

Write DOM tests for route and language changes, duplicate prevention, JSON-LD replacement, and cleanup.

- [ ] **Step 3: Write failing SSR/prerender tests**

Given a minimal built template and fake `render()` result, test that the prerenderer:

- injects non-empty English app HTML into `#root` for `/blog` and all four article paths;
- writes both clean-URL forms needed for preview/Vercel verification (`dist/blog.html` plus `dist/blog/index.html`, and matching article `.html` plus directory `index.html` files);
- injects route-specific English metadata and JSON-LD;
- creates a sitemap with EN/ES query URLs and alternate-language links using XML escaping;
- creates/retains robots policy pointing to the sitemap;
- never includes RSS XML, source inventory, Medium tracker, CDN image URL, or `source=rss` in public output;
- preserves Vite script/style asset tags.

Run:

```powershell
pnpm test:run -- scripts/prerender-public-routes.test.ts
```

Expected RED: no server entry or prerenderer exists.

- [ ] **Step 4: Make language resolution hydration-safe**

Add an optional `initialLanguage` to `App`/`LanguageProvider`. Server rendering always supplies `en`. Hydration uses that same value for the first render, then resolves query → storage → browser → English in an effect; a normal non-prerendered SPA mount keeps the current immediate behavior. Guard all `window`, `document`, storage, and navigator access so the server entry can import the application.

Add focused tests showing:

- server/first hydration markup stays English;
- `?lang=es` switches to Spanish immediately after hydration without changing the slug;
- invalid/missing query still follows the approved fallback order;
- `<html lang>` follows the active client language.

- [ ] **Step 5: Implement streaming SSR and browser hydration**

`src/entry-server.tsx` exports an async `render(url)` built on React's Node streaming server API and waits for `onAllReady`, allowing the lazy blog module to resolve before HTML is written. It uses `MemoryRouter` and `App initialLanguage="en"`, applies a bounded timeout, and rejects on render errors.

`mountApp.tsx` calls `hydrateRoot` when `#root` already contains prerendered children and `createRoot` otherwise. `main.tsx` delegates to it. Do not create a second route tree for SSR.

- [ ] **Step 6: Generate static blog routes and publishing artifacts**

Extend scripts as follows, preserving any architecture validation/build steps already added by Plan 2:

```json
{
  "scripts": {
    "build:client": "tsc -b && vite build",
    "build:ssr": "vite build --ssr src/entry-server.tsx --outDir .ssr-blog",
    "prerender": "tsx scripts/prerender-public-routes.ts",
    "verify:blog-build": "tsx scripts/verify-blog-build.ts",
    "build": "pnpm validate:blog && pnpm build:client && pnpm build:ssr && pnpm prerender && pnpm verify:blog-build"
  }
}
```

If Plan 2 already prefixes architecture preparation/validation, keep it in `build` before `build:client`; do not replace it. `check` continues to run lint, typecheck, tests, and the final build once—avoid a recursive `check`/`build` cycle.

The prerender route list owns `/blog` plus the four article paths. Extend rather than overwrite any existing home/architecture prerender list. Pre-render English only and emit canonical/hreflang for both query languages. Leave `.ssr-blog/` ignored and outside `dist/`.

`vercel.json` must continue to serve generated static files before the SPA fallback. Change it only if a preview proves the catch-all rewrite masks those files.

Run:

```powershell
pnpm test:run -- src/features/seo/pageMetadata.test.ts src/features/seo/PageMetadata.test.tsx scripts/prerender-public-routes.test.ts
pnpm build
```

Expected GREEN: every English blog/article file contains body HTML before JavaScript, assets remain intact, sitemap/robots exist, and the verifier rejects any tracker or remote Medium image.

---

## Task 6: Close Accessibility, Responsive, Editorial, and Runtime Verification

**Files:**
- Create: `src/pages/BlogAccessibility.test.tsx`
- Modify: `src/styles/blog.css` only for defects found by verification
- Modify: affected blog/content/SEO tests only when they encode an actual fixed requirement
- Modify: `README.md` with content-update and validation workflow

- [ ] **Step 1: Write failing accessibility coverage before fixes**

Run `vitest-axe` against:

- English and Spanish blog indexes;
- an English original article;
- its Spanish local-reviewed translation;
- the localized unknown-slug fallback.

Also assert one main heading, ordered heading levels, named navigation regions, visible source link text, non-empty image alts, accessible code overflow, focus-visible controls, and that reduced motion leaves the entire index/article visible.

Run:

```powershell
pnpm test:run -- src/pages/BlogAccessibility.test.tsx
```

Expected RED if any semantic, contrast-detectable, labeling, or focus defect remains.

- [ ] **Step 2: Fix only observed accessibility and responsive defects**

Keep fixes within blog components/styles unless the defect is demonstrably shared. Do not weaken axe rules, hide content from the accessibility tree, or convert meaningful images into decorative backgrounds to make tests pass.

- [ ] **Step 3: Run the full automated gate**

Run:

```powershell
pnpm validate:blog
pnpm check
```

Expected:

- lint passes with no warnings promoted by the repository config;
- TypeScript passes;
- all prior landing, language, architecture, blog, SEO, and accessibility tests pass;
- the production client and SSR builds pass;
- prerender and built-output verification pass;
- summary reports exactly 4 articles, 8 localized documents, and 11 local images.

- [ ] **Step 4: Verify built artifacts directly**

Inspect `dist/` and confirm:

- `blog.html`, `blog/index.html`, and both forms for every slug exist;
- each article file contains its English title and substantive body before client JavaScript;
- `sitemap.xml` and `robots.txt` reference `kathesama.ar` only;
- `architecture.public.json` remains present if Plan 2 is complete;
- no RSS fixture, source inventory, `_stat`, `source=rss`, or `cdn-images-1.medium.com` string is shipped;
- all 11 local image paths resolve;
- the landing's initial JavaScript chunk does not contain full article paragraphs or React Markdown.

- [ ] **Step 5: Perform browser verification at portfolio breakpoints**

Run:

```powershell
pnpm preview --host 127.0.0.1
```

Check at 1440px, 768px, 390px, and 320px:

- `/blog?lang=en` and `/blog?lang=es`;
- all four `/blog/:slug` routes in both languages;
- a direct reload of a clean article URL;
- language toggle, Back to series, and previous/next navigation;
- focus order, skip link, keyboard-scrollable code, reduced motion, 200% zoom, and horizontal overflow;
- figure proportions, captions, and actual alt text in the accessibility tree;
- no article request to Medium/CDN in the network panel before the visitor explicitly activates the attribution link;
- no hydration mismatch, duplicate metadata, console error, or broken route.

- [ ] **Step 6: Complete editorial and disclosure review**

Read all eight local editions side by side. Confirm technical values/code are preserved, Spanish is natural and complete, each summary matches its body, every missing source alt was replaced after viewing the image, and no secret/token/private host/internal repository path was introduced. Confirm the public architecture and article copy do not make contradictory factual claims.

Document the maintenance workflow in `README.md`:

1. refresh/save an RSS fixture intentionally;
2. dry-run and stage with `import:medium`;
3. review/promote English Markdown and local assets;
4. create/review the Spanish pair and alt text;
5. update the typed catalog;
6. run `pnpm validate:blog` and `pnpm check`.

Do not describe live synchronization: publication remains an explicit local-content change.

---

## Completion Criteria

- `/blog?lang=en|es` is a real editorial index with CDKE featured and the complete 1–4 Juana build series in chronological order.
- All four `/blog/:slug?lang=en|es` routes render complete local bodies, not excerpts, placeholders, or runtime Medium embeds.
- English is visibly original; Spanish is visibly a locally reviewed translation.
- The landing includes a lightweight featured-writing preview in the approved composition without importing article bodies.
- Exactly eight Markdown documents and 11 local images pass the content gate; all meaningful images have reviewed EN/ES alt text.
- Medium tracking pixels and `source=rss` parameters are absent from canonical content and built output.
- The exact source URL, post ID, timestamp, platform, and source language remain available as content metadata and visible attribution where appropriate.
- Article routes provide localized date, tags, reading time, previous/next series navigation, Back to series, safe external links, responsive figures, and keyboard-scrollable code.
- Canonical, hreflang, Open Graph/Twitter, article JSON-LD, sitemap, and robots output are generated for `kathesama.ar`; Medium is attribution, not canonical.
- Default-English blog and article HTML is prerendered while `?lang=es` follows the explicitly accepted hydration trade-off.
- Blog/index/fallback axe checks, full tests, lint, typecheck, production build, prerender verification, responsive checks, and human editorial/disclosure review have recorded evidence.
- The site does not contact RSS, Medium, or Medium's image CDN at runtime unless a visitor explicitly opens the original-source link.
- No commits or pull requests are created.

## Implementation References

- React Markdown security and component mapping: <https://github.com/remarkjs/react-markdown#security>
- React DOM server streaming: <https://react.dev/reference/react-dom/server/renderToPipeableStream>
- React DOM hydration: <https://react.dev/reference/react-dom/client/hydrateRoot>
- Google localized versions guidance: <https://developers.google.com/search/docs/specialty/international/localized-versions>
- Schema.org `BlogPosting`: <https://schema.org/BlogPosting>


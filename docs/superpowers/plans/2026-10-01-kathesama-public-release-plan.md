# Kathesama Public Release Implementation Plan

> **For implementers:** Execute this plan task by task. Use test-first changes for behavior, keep the current visual language, and stop at the production approval gate. Do not create commits or pull requests.

**Goal:** Make the bilingual blog readable and reliable, expand the sanitized public architecture explorer, and prepare `kathesama.ar` for an explicitly approved production publication.

**Architecture:** Keep the existing React/TypeScript/Vite single-page application and its local Markdown content. Isolate navigation side effects in the layout layer, keep article URL policy in the blog feature, and extend the existing curated architecture JSON with typed, validated lenses rather than deriving public content from the private repository.

**Tech stack:** React, TypeScript, React Router, Vite, Vitest, Testing Library, CSS, Markdown AST validation, existing SSR/prerender scripts, Vercel static hosting.

**Working directory:** `C:\Users\kathe\.config\superpowers\worktrees\kathesama-landing\kathesama-react-migration`

**Approved design:** `docs/superpowers/specs/2026-10-01-kathesama-public-release-design.md`

**Execution constraints:**

- Do not commit or open a pull request.
- Do not start `codebase.kathesama.ar` work in this repository.
- Do not publish until the preview is explicitly approved.
- Preserve the existing home page content and routes unless a task below names them.
- Never copy private repository paths, endpoints, configuration, credentials, versions, host details, or security findings into public architecture data.

---

## Task 1: Lock the release contract and local planning hygiene

**Files:**

- Modify: `.gitignore`
- Create: `src/test/publicReleaseContract.test.ts`
- Reference: `package.json`
- Reference: `docs/superpowers/specs/2026-10-01-kathesama-public-release-design.md`

### Step 1: Add a failing release-contract test

Create a test that reads the two approved public data surfaces and asserts stable release invariants:

```ts
import { describe, expect, it } from 'vitest'
import { blogCatalog } from '../content/blog/catalog'

describe('public release contract', () => {
  it('ships the complete bilingual article set', () => {
    expect(blogCatalog).toHaveLength(4)
    expect(blogCatalog.every((article) => article.title.es && article.title.en)).toBe(true)
  })
})
```

If the canonical article module uses a different exported name, use its existing public export rather than creating a duplicate catalog.

### Step 2: Run the targeted test and verify the existing invariant

Run:

```powershell
pnpm vitest run src/test/publicReleaseContract.test.ts
```

Expected: PASS. This test freezes already-shipped content rather than introducing new behavior; the lens contract starts RED in Task 6.

### Step 3: Ignore visual-companion scratch output

Append `.superpowers/` to `.gitignore`. The approved specs and plans remain tracked under `docs/superpowers/`; only the local companion runtime is ignored.

### Step 4: Record baseline commands

Run:

```powershell
pnpm test:run
pnpm lint
pnpm typecheck
```

Expected: all commands PASS. Any failure blocks implementation and must be diagnosed before continuing.

---

## Task 2: Make the blog index typography readable

**Files:**

- Modify: `src/pages/BlogIndexPage.tsx`
- Modify: `src/pages/BlogIndexPage.test.tsx`
- Modify: `src/features/blog/FeaturedArticle.tsx`
- Modify: `src/features/blog/SeriesTimeline.tsx`
- Modify: `src/styles/blog-index.css`
- Modify: `src/styles/blogIndexStyles.test.ts`

### Step 1: Add failing semantic and CSS-contract tests

Add component assertions for:

- the masthead title renders as one semantic `h1`;
- the featured title renders as an `h2` and is not split into author-controlled line fragments;
- each timeline title is a single link with a single heading;
- Spanish labels use `NOTAS DE CAMPO`, English labels use `FIELD NOTES`;
- CSS forbids automatic hyphenation and mid-word breaking on display headings;
- display sizes use bounded `clamp()` values and readable measures.

The CSS test should assert the relevant selector block includes the equivalent of:

```css
hyphens: none;
overflow-wrap: normal;
word-break: normal;
text-wrap: balance;
```

### Step 2: Run targeted tests and verify RED

Run:

```powershell
pnpm vitest run src/pages/BlogIndexPage.test.tsx src/styles/blogIndexStyles.test.ts
```

Expected: FAIL on untranslated labels and/or unsafe heading rules.

### Step 3: Implement the approved “Display disciplinada” scale

Refactor the masthead, featured article, and timeline markup so line breaks come from layout width, not inserted fragments or hyphenation. Use bounded sizes appropriate to each surface:

```css
.blog-index__title {
  max-inline-size: 10ch;
  font-size: clamp(4rem, 10vw, 9rem);
  line-height: 0.88;
  letter-spacing: -0.055em;
  text-wrap: balance;
  hyphens: none;
  overflow-wrap: normal;
  word-break: normal;
}

.featured-article__title {
  max-inline-size: 18ch;
  font-size: clamp(2.25rem, 4.8vw, 5.25rem);
  line-height: 0.98;
}

.series-timeline__title {
  max-inline-size: 30ch;
  font-size: clamp(1.5rem, 2.7vw, 2.75rem);
  line-height: 1.08;
}
```

Adapt selector names to the current BEM names. At `max-width: 48rem`, collapse the featured layout to one column and remove any narrow fixed text column that forces one- or two-word lines. At `max-width: 24rem`, ensure content retains at least `1rem` inline padding.

### Step 4: Centralize bilingual index copy

Keep all index labels in the page’s existing localized-copy structure. Required pairs:

| English | Spanish |
|---|---|
| Field notes | Notas de campo |
| Featured field note | Nota de campo destacada |
| Read field note | Leer la nota de campo |
| Open note | Abrir nota |

Do not translate article titles; use the localized article document already selected by `lang`.

### Step 5: Run focused tests and inspect both locales

Run:

```powershell
pnpm vitest run src/pages/BlogIndexPage.test.tsx src/styles/blogIndexStyles.test.ts
```

Expected: PASS.

Start the local server with the repository script and inspect:

- `/blog?lang=es`
- `/blog?lang=en`

at 1440, 768, 390, and 320 CSS pixels. No word may be split and no title may occupy a one-word-per-line column unless the word itself fills the available width.

---

## Task 3: Repair article headers across every post

**Files:**

- Modify: `src/features/blog/ArticleHeader.tsx`
- Modify: `src/pages/ArticlePage.test.tsx`
- Modify: `src/pages/BlogAccessibility.test.tsx`
- Modify: `src/styles/blog.css`

### Step 1: Add failing shared-header tests

Render at least the longest Spanish and English titles through `ArticlePage`. Assert:

- there is exactly one `h1`;
- the title is a single text node/continuous accessible name;
- the eyebrow is localized;
- title markup does not add soft hyphens, `<wbr>`, or manual line-break spans;
- article summary and metadata remain associated with the header.

Add CSS-contract assertions for the shared article-title selector:

```css
max-inline-size: 20ch;
font-size: clamp(2.5rem, 7vw, 6.5rem);
hyphens: none;
overflow-wrap: normal;
word-break: normal;
```

### Step 2: Run the tests and verify RED

Run:

```powershell
pnpm vitest run src/pages/ArticlePage.test.tsx src/pages/BlogAccessibility.test.tsx
```

Expected: FAIL on the present formatting/localization contract.

### Step 3: Fix the shared component, not individual articles

Update `ArticleHeader.tsx` and `blog.css` once so all eight localized documents inherit the correction. Use a wider readable measure, keep the strong display font, and reduce scale progressively below 768 and 420 pixels. Never insert language-specific breaks into Markdown titles.

### Step 4: Verify all eight localized routes

Run:

```powershell
pnpm vitest run src/pages/ArticlePage.test.tsx src/pages/BlogAccessibility.test.tsx
```

Expected: PASS.

Use the canonical article catalog to visit every slug in both languages. Confirm the four article pairs share the same header composition without clipped or split words.

---

## Task 4: Make route scroll and focus behavior deterministic

**Files:**

- Create: `src/components/layout/NavigationManager.tsx`
- Create: `src/components/layout/NavigationManager.test.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/app/routes.test.tsx`

### Step 1: Define failing navigation cases

Use a memory router and mocked `window.scrollTo`. Cover this matrix:

| Navigation | Expected scroll | Expected focus |
|---|---|---|
| PUSH/REPLACE, new path, no hash | top | `main` |
| PUSH/REPLACE, valid hash | target | hash target |
| POP/back/forward | untouched | untouched |
| same article slug, changed `lang` | top | article/main heading |
| initial direct load, no hash | browser initial position/top | main without fighting restoration |
| initial direct load, hash | target after content exists | hash target |

The hash case must retain the existing delayed lookup behavior for asynchronously rendered content, but cancel observers/timeouts on unmount or on a newer navigation.

### Step 2: Run the focused test and verify RED

Run:

```powershell
pnpm vitest run src/components/layout/NavigationManager.test.tsx src/app/routes.test.tsx
```

Expected: FAIL because the current shell focuses on pathname changes but does not implement the matrix.

### Step 3: Implement a single navigation manager

Use `useLocation()` and `useNavigationType()` in `NavigationManager.tsx`. Track the previous `{pathname, search}` in a ref and distinguish the first render from later history navigation. Use this decision order:

1. On the first render, honor an explicit hash; otherwise focus main without forcing a second scroll restoration.
2. On a later `POP`, return without altering scroll or focus.
3. If `location.hash` exists, resolve and focus the target; do not also focus main.
4. If pathname changed, scroll to `{top: 0, left: 0, behavior: 'auto'}` and focus main.
5. If only search changed and `lang` changed, scroll to top and focus the page title/main.
6. Ignore unrelated query-string changes such as architecture lens selection.

Use `tabIndex={-1}` only where required for programmatic focus and avoid visible focus suppression.

### Step 4: Replace competing AppShell effects

Mount `<NavigationManager />` once inside `AppShell.tsx`. Remove the older pathname/hash effects so two mechanisms cannot race.

### Step 5: Verify GREEN and browser history

Run:

```powershell
pnpm vitest run src/components/layout/NavigationManager.test.tsx src/app/routes.test.tsx
```

Expected: PASS.

Manually verify:

1. Scroll midway down `/blog?lang=es`.
2. Open an article and confirm its title is at the top.
3. Press Back and confirm the blog list returns to the previous scroll position.
4. Change language on the article and confirm the localized title is at the top.

---

## Task 5: Keep Juana series links inside Kathesama

**Files:**

- Modify: `src/features/blog/ArticleBody.tsx`
- Modify: `src/features/blog/ArticleBody.test.tsx`
- Modify: `src/features/blog/urlSafety.ts`
- Modify: `src/features/blog/urlSafety.test.ts`
- Modify: `src/content/blog/validation.ts`
- Modify: `src/content/blog/validation.test.ts`
- Modify: `scripts/validate-blog-content.ts`
- Modify: `content/blog/articles/juana-orchestration-layer.en.md`
- Modify: `content/blog/articles/juana-orchestration-layer.es.md`
- Modify: `content/blog/articles/self-hosted-ai-latency-24-to-2.en.md`
- Modify: `content/blog/articles/self-hosted-ai-latency-24-to-2.es.md`

### Step 1: Add failing URL and rendering tests

Add a pure helper such as:

```ts
export function localizeInternalHref(href: string, language: 'es' | 'en'): string
```

Test these exact outcomes:

```ts
expect(localizeInternalHref('/blog/building-juana-self-hosted-ai', 'es'))
  .toBe('/blog/building-juana-self-hosted-ai?lang=es')
expect(localizeInternalHref('/architecture?lens=trust', 'en'))
  .toBe('/architecture?lens=trust&lang=en')
expect(localizeInternalHref('/blog/post?lang=es#part-2', 'en'))
  .toBe('/blog/post?lang=en#part-2')
```

Assert `ArticleBody` passes localized root-relative URLs to React Router links and leaves absolute third-party URLs external.

### Step 2: Add a failing content-policy test

Extend the Markdown validator with code `link.self-source`. A body link fails when its normalized host/path equals one of this site’s canonical Medium source URLs. Frontmatter `sourceUrl`, JSON-LD attribution, and explicit “originally published on Medium” components remain allowed because they are not article-body cross-links.

Run:

```powershell
pnpm vitest run src/features/blog/ArticleBody.test.tsx src/features/blog/urlSafety.test.ts src/content/blog/validation.test.ts
pnpm validate:blog
```

Expected: RED on current Juana series links.

### Step 3: Replace own-article Medium links in all affected Markdown

Use the canonical local slugs for Part 1 and Part 2. Do not add a language query to Markdown; `ArticleBody` adds the current locale at render time. Preserve third-party Medium references.

Audit all eight Markdown files, not only the four currently known to contain cross-links.

### Step 4: Implement URL localization and validator policy

Use `URLSearchParams` so query strings and hashes remain valid. Only transform safe root-relative application URLs. Never reinterpret protocol-relative or absolute URLs as internal.

### Step 5: Verify content and rendering

Run:

```powershell
pnpm vitest run src/features/blog/ArticleBody.test.tsx src/features/blog/urlSafety.test.ts src/content/blog/validation.test.ts
pnpm validate:blog
```

Expected: PASS with zero `link.self-source` findings.

Manually click Part 1 and Part 2 references from both Spanish and English posts; every navigation must stay on the local domain, retain language, and open at the article title.

---

## Task 6: Extend the public architecture contract with nine lenses

**Files:**

- Modify: `src/features/architecture/architecture.types.ts`
- Modify: `src/features/architecture/architecture.schema.ts`
- Modify: `src/features/architecture/architecture.schema.test.ts`
- Modify: `src/content/architecture/architecture.public.json`
- Modify: `src/content/architecture/index.ts`
- Modify: `scripts/prepare-public-architecture.ts`
- Modify: `src/test/publicReleaseContract.test.ts`

### Step 1: Add failing schema tests

Extend `src/test/publicReleaseContract.test.ts` with the approved lens list before modifying the dataset:

```ts
import { publicArchitecture } from '../content/architecture'

const lenses = (publicArchitecture as typeof publicArchitecture & {
  lenses?: Array<{ id: string }>
}).lenses

expect(lenses?.map((lens) => lens.id)).toEqual([
  'layers',
  'request-lifecycle',
  'knowledge-flows',
  'trust',
  'reliability',
  'decisions',
  'capability-status',
  'technologies',
  'contracts',
])
```

This assertion must fail because `lenses` is absent while remaining valid TypeScript.

Define the lens shape:

```ts
export type ArchitectureLensId =
  | 'layers'
  | 'request-lifecycle'
  | 'knowledge-flows'
  | 'trust'
  | 'reliability'
  | 'decisions'
  | 'capability-status'
  | 'technologies'
  | 'contracts'

export interface ArchitectureLens {
  id: ArchitectureLensId
  title: LocalizedText
  summary: LocalizedText
  nodeIds: string[]
  edgeIds: string[]
  flowIds: string[]
  sections: Array<{
    id: string
    title: LocalizedText
    body: LocalizedText
  }>
}
```

Tests must reject:

- missing or duplicate approved lens IDs;
- references to unknown node, edge, or flow IDs;
- empty Spanish or English copy;
- duplicate section IDs inside a lens;
- new keys that could carry source references, endpoints, hosts, versions, or configuration.

### Step 2: Run schema tests and verify RED

Run:

```powershell
pnpm vitest run src/features/architecture/architecture.schema.test.ts src/test/publicReleaseContract.test.ts
```

Expected: FAIL because the JSON has no lenses.

### Step 3: Implement types and validation

Keep the schema strict. Validate referential integrity after nodes, edges, and flows are parsed. Ensure the public-build script consumes only the curated JSON and does not inspect the Juana source repository.

### Step 4: Author the nine bilingual lenses

Each lens must explain only approved concepts and reference existing curated graph IDs. Use these content boundaries:

| Lens | Required content | Forbidden detail examples |
|---|---|---|
| Layers | experience, gateway, cognition, knowledge, infrastructure | package/class names |
| Request lifecycle | ingress, authentication, orchestration, response/stream | exact route/header |
| Knowledge flows | documents, ingestion, retrieval, ranking, memory, tools | index/table/bucket names |
| Trust | identity boundary, policy decision, least privilege | realm/client/scope configuration |
| Reliability | timeout, retry, fallback, audit, observability concepts | thresholds, internal dashboards |
| Decisions | trade-offs and rationale | undisclosed vulnerabilities |
| Capability status | implemented, conditional, future | invented production claims |
| Technologies | broad technology families | versions, model names, private hardware |
| Contracts | HTTP, events, streaming concepts | endpoint/topic/schema internals |

### Step 5: Verify schema and public artifact generation

Run:

```powershell
pnpm vitest run src/features/architecture/architecture.schema.test.ts src/test/publicReleaseContract.test.ts
pnpm architecture:prepare
```

Expected: PASS and a generated artifact containing exactly nine lenses with valid graph references.

---

## Task 7: Build the lens-driven architecture experience

**Files:**

- Create: `src/features/architecture/LensSelector.tsx`
- Create: `src/features/architecture/LensSelector.test.tsx`
- Create: `src/features/architecture/LensPanel.tsx`
- Create: `src/features/architecture/LensPanel.test.tsx`
- Modify: `src/features/architecture/ArchitectureExplorer.tsx`
- Modify: `src/features/architecture/ArchitectureExplorer.test.tsx`
- Modify: `src/features/architecture/ArchitectureCanvas.tsx`
- Modify: `src/features/architecture/ArchitectureFallback.tsx`
- Modify: `src/features/architecture/architectureGraph.ts`
- Modify: `src/features/architecture/architectureGraph.test.ts`
- Modify: `src/styles/architecture.css`

### Step 1: Add failing interaction tests

Cover:

- absent/invalid `lens` query defaults to `layers`;
- selecting a lens updates `?lens=` while preserving `?lang=`;
- browser Back restores the previous lens;
- lens selection highlights its referenced nodes/edges/flows;
- selecting an existing flow still highlights the complete flow path;
- a selected graph node remains inspectable without erasing lens narrative;
- the existing sanitized JSON download remains available and contains the validated lenses;
- keyboard users can operate the selector and reach the narrative panel;
- reduced-motion users get no animated pan/zoom transition;
- fallback mode presents the same lens content without the canvas.

### Step 2: Run focused tests and verify RED

Run:

```powershell
pnpm vitest run src/features/architecture/LensSelector.test.tsx src/features/architecture/LensPanel.test.tsx src/features/architecture/ArchitectureExplorer.test.tsx src/features/architecture/architectureGraph.test.ts
```

Expected: FAIL because lens components and graph projection do not exist.

### Step 3: Implement query-state ownership

`ArchitectureExplorer` owns selected lens ID derived from `useSearchParams`. `LensSelector` receives the resolved value and emits an ID. Updating the lens must preserve language and unrelated safe parameters. Do not make the general navigation manager scroll to top for lens changes.

### Step 4: Implement graph projection

Add a pure projection function:

```ts
projectLens(graph, lens): {
  highlightedNodeIds: Set<string>
  highlightedEdgeIds: Set<string>
  highlightedFlowIds: Set<string>
}
```

Flow selection has the strongest visual emphasis; lens membership has secondary emphasis; unrelated items are visually de-emphasized but remain available. The right rail continues to show flows and component details; the lens narrative sits above it on wide screens and before the graph on narrow screens.

### Step 5: Implement responsive and accessible presentation

Use a native select or an ARIA-correct tab/listbox pattern. At narrow widths, render selector, narrative, graph/fallback, then flow list. At 200% zoom, avoid two-column content that creates horizontal scrolling. Retain visible focus and textual status; never convey implemented/conditional/future only by color.

### Step 6: Verify interactions

Run:

```powershell
pnpm vitest run src/features/architecture
```

Expected: PASS.

Manually verify deep links such as:

- `/architecture?lang=es&lens=trust`
- `/architecture?lang=en&lens=request-lifecycle`

---

## Task 8: Add an explicit public-disclosure gate

**Files:**

- Create: `scripts/audit-public-architecture.ts`
- Create: `scripts/audit-public-architecture.test.ts`
- Modify: `package.json`
- Modify: `scripts/prepare-public-architecture.ts`
- Modify: `README.md`

### Step 1: Add failing denylist tests

Test the audit with fixtures containing:

- IPv4/IPv6 and localhost hosts;
- explicit ports;
- filesystem or repository paths;
- Java/Python/TypeScript source filenames;
- exact API route shapes;
- container, database, table, topic, bucket, realm, client, claim, scope, header, secret-path, model/version, hardware, and security-finding language.

The scanner is defense in depth, not a substitute for human review. Avoid a single broad pattern that rejects ordinary prose; use named rules and print only sanitized location/rule IDs, never suspected secret values.

### Step 2: Run the audit test and verify RED

Run:

```powershell
pnpm vitest run scripts/audit-public-architecture.test.ts
```

Expected: FAIL until the audit exists.

### Step 3: Implement and wire the gate

Add scripts equivalent to:

```json
{
  "audit:architecture": "tsx scripts/audit-public-architecture.ts",
  "validate:public": "pnpm validate:blog && pnpm audit:architecture && pnpm architecture:prepare"
}
```

Use the repository’s existing TypeScript script runner. Make `architecture:prepare` fail before writing its artifact when validation or disclosure audit fails.

### Step 4: Document the human checklist

In `README.md`, document that a reviewer must confirm:

- every technical claim is intentionally public;
- capability status is accurate;
- no live/private GitHub or runtime-documentation link exists;
- technology descriptions omit versions and sensitive configuration;
- contracts remain conceptual.

### Step 5: Verify GREEN

Run:

```powershell
pnpm vitest run scripts/audit-public-architecture.test.ts
pnpm validate:public
```

Expected: PASS with zero disclosure findings.

---

## Task 9: Complete automated and browser acceptance

**Files:**

- Modify only if failures reveal in-scope defects in files named by Tasks 1–8.
- Create: `docs/release/kathesama-public-acceptance.md`

### Step 1: Run the full repository check

Run the canonical command first:

```powershell
pnpm check
```

Expected: lint, type checking, all tests, content validation, architecture preparation, build, SSR, and prerender PASS. If `pnpm check` does not include `validate:public`, update it once and rerun.

### Step 2: Verify generated routes

Serve the production build with the repository preview command. Verify direct loads and refreshes for:

- `/`
- `/blog?lang=es`
- `/blog?lang=en`
- every `/blog/:slug?lang=es|en`
- `/architecture?lang=es&lens=layers`
- `/architecture?lang=en&lens=contracts`
- one valid article hash target.

Expected: no blank page, no fallback-route mismatch, no client hydration warning, and correct title/canonical metadata.

### Step 3: Run the visual matrix

Record pass/fail evidence in `docs/release/kathesama-public-acceptance.md` for:

| Surface | 1440 | 768 | 390 | 320 | 200% zoom | Reduced motion |
|---|---:|---:|---:|---:|---:|---:|
| Blog index | required | required | required | required | required | required |
| Longest ES article title | required | required | required | required | required | required |
| Longest EN article title | required | required | required | required | required | required |
| Architecture, layers | required | required | required | required | required | required |
| Architecture, trust | required | required | required | required | required | required |

Also test keyboard-only navigation, skip link, visible focus, screen-reader names, Back scroll restoration, local series links, and language switching.

### Step 4: Create a production-equivalent preview

Use the already configured hosting workflow if it can create an isolated preview without changing production. If deployment tooling/project binding is absent, preserve the verified production build and document the exact missing prerequisite; do not guess project or account identifiers.

### Step 5: Stop for preview approval

Present:

- preview URL or local production-preview instructions;
- full automated results;
- browser matrix;
- files changed;
- remaining limitations.

Do not publish to production until the user explicitly approves the preview.

---

## Task 10: Publish and verify `kathesama.ar`

**Precondition:** The user has explicitly approved the production-equivalent preview and the Vercel project/environment has been confirmed.

**Files:**

- Modify: `docs/release/kathesama-public-acceptance.md` (verification record only)

### Step 1: Re-run the release gate

Run:

```powershell
pnpm check
pnpm validate:public
```

Expected: PASS immediately before deployment.

### Step 2: Deploy through the confirmed existing workflow

Before changing production, record the currently active deployment identifier/URL and the confirmed rollback action in the acceptance document. Use only the repository/project’s confirmed Vercel workflow. Do not create a second project, change DNS, or link a different account implicitly. Treat credentials and project identifiers as external configuration and never persist them in the repository.

### Step 3: Smoke-test production

Verify over HTTPS:

- home, blog index, all article routes, and architecture deep links;
- Spanish and English query handling;
- article title scroll/focus;
- one local series link;
- one architecture lens change and browser Back;
- canonical/alternate metadata and no console errors.

### Step 4: Record the live result and stop

Append deployment time, verified URL, artifact/build identity if available, smoke results, and any rollback note to `docs/release/kathesama-public-acceptance.md` without recording credentials.

Phase 2 remains blocked until the user explicitly accepts the live public release.

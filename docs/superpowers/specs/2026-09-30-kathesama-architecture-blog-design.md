# Kathesama Architecture and Bilingual Blog Design

**Date:** 2026-09-30  
**Status:** Draft for user review  
**Target repository:** `D:\projects\react\kathesama-landing`

## 1. Purpose

Evolve the existing Kathesama landing page into a bilingual React and TypeScript portfolio site that preserves its current identity and content while adding two public capabilities:

1. A safe, interactive overview of JuanaIA's architecture.
2. A locally hosted bilingual blog containing Katherine's existing Medium articles.

A detailed codebase visualizer protected by Keycloak is intentionally separated into a second delivery phase.

## 2. Existing Context

The repository currently contains a single self-contained `index.html`, a minimal `vercel.json`, and no application framework. The deployed page presents:

- the animated dark-grid visual identity;
- the “Meet JuanaIA” hero;
- project, stack, roadmap, and builder content;
- English and Spanish language toggling;
- LinkedIn, GitHub, and Medium links.

This content and visual identity are retained. Migration changes the structure and delivery mechanism, not the personality of the site.

## 3. Product Decisions

- Use React, TypeScript, and Vite for the public site.
- Preserve the current dark, teal, gold, typographic, and animated visual language.
- Preserve existing copy unless a current factual audit contradicts it.
- Use `?lang=en` and `?lang=es` for shareable language selection on all public routes.
- Default language resolution order: query parameter, stored preference, browser language, English fallback.
- Use a curated and validated public architecture dataset. Never publish a raw repository scan.
- Store articles locally; the rendered site must not depend on Medium at runtime.
- Publish complete English and Spanish article versions rather than runtime machine translation.
- Present the blog as a featured article plus an ordered Juana build series.
- Show an animated architecture preview on the landing page and a dedicated full explorer page.
- Keep the private codebase visualizer out of the public deployment.

## 4. Scope

### Phase 1 — Public portfolio site

- Migrate the existing page to React and TypeScript.
- Preserve and componentize current landing content.
- Add primary navigation for Home, Architecture, Writing, and About.
- Add a lightweight architecture preview to the landing page.
- Add the full public architecture explorer.
- Add the bilingual blog index and article reader.
- Add local English and Spanish content for the four existing articles.
- Add responsive, accessibility, metadata, sitemap, and static-hosting support.

### Phase 2 — Private codebase visualizer

- Proposed deployment under `codebase.kathesama.ar`, subject to a separate Phase 2 approval.
- Protect the entire application with Keycloak before serving any graph data or application shell.
- Generate a richer dataset from repository analysis.
- Include real code ownership, contracts, dependencies, and code navigation only after a separate threat model.

Phase 2 is not required for Phase 1 completion and receives its own security design before implementation.

## 5. Non-goals

- No browser-based CMS or article editor.
- No live synchronization from Medium.
- No raw source-code browsing in the public site.
- No exposure of internal hostnames, IP addresses, ports, secrets, realm details, security rules, deployment identifiers, private repository paths, or unpublished vulnerabilities.
- No authentication added to the public landing, blog, or sanitized architecture view.
- No redesign that discards the existing Kathesama brand.

## 6. Information Architecture

Public routes use a stable path and language query parameter:

| Route | Purpose |
|---|---|
| `/?lang=en` | Landing page |
| `/architecture?lang=en` | Interactive public architecture explorer |
| `/blog?lang=en` | Featured article and ordered series |
| `/blog/:slug?lang=en` | Local article reader |

Spanish uses the same paths with `?lang=es`. The language selector updates the URL and persists the preference without losing the current route.

## 7. Landing Page Composition

The landing keeps the existing content in this order, with two additions:

1. Navigation and language selector.
2. Existing hero.
3. Existing JuanaIA overview and technical cards.
4. New architecture preview with a small animated subset of nodes and a clear “Explore architecture” action.
5. New featured-writing section with the latest article and the remaining series entries.
6. Existing stack.
7. Existing builder profile and social links.
8. Existing footer and runtime-status language, subject to factual verification.

The preview is decorative and explanatory, not a second full graph implementation. It links to the dedicated explorer.

## 8. Public Architecture Explorer

The dedicated page follows the interaction model of the supplied `morgan.grok.me/architecture.html` reference while using Kathesama's identity:

- pannable and zoomable canvas;
- fit and reset controls;
- typed nodes and directional edges;
- category legend;
- hover/focus tooltip for each component;
- flow list and flow-detail panel;
- selecting a flow highlights its full ordered path and dims unrelated elements;
- direct access to the sanitized JSON artifact;
- responsive behavior that moves the flow panel below the graph on narrow screens;
- keyboard-operable nodes, flows, controls, and tooltips.

Use `@xyflow/react` for graph interaction, custom Kathesama nodes, controls, and responsive viewport behavior. The graph is read-only; visitors cannot create, delete, or persist nodes.

### Public data contract

The public JSON is the single source of truth for the explorer and for AI-agent consumption:

```json
{
  "version": 1,
  "nodes": [],
  "edges": [],
  "flows": []
}
```

Each node contains a stable ID, bilingual label and description, category, safe capability summary, and display position. Each edge contains stable source and target IDs plus a safe bilingual label. Each flow contains a stable ID, bilingual title and summary, ordered node IDs, and an optional `primary` marker.

The dataset is validated at build time for:

- unique IDs;
- valid edge endpoints;
- valid ordered flow steps;
- complete English and Spanish labels;
- known categories;
- forbidden sensitive-field names and obvious secret-like values.

Automated validation reduces mistakes but does not replace human review of public content.

## 9. Blog and Article Content

The initial series contains:

1. “I’m Building a Personal AI That Lives on My PC — Here’s What I’ve Learned So Far”
2. “I Gave My Local AI a Brain: How I Designed the Orchestration Layer”
3. “From 24 Seconds to 2: How I Optimized Response Times in a Self-Hosted AI Assistant”
4. “When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment”

Each article is stored locally as paired English and Spanish MDX documents with shared metadata:

- stable article ID and slug;
- localized title and summary;
- publication date;
- series order;
- tags;
- cover image and alt text;
- reading time;
- original Medium URL;
- canonical and language-alternate metadata.

The English version preserves the original publication. The Spanish version is an editorial translation that preserves technical meaning and authorial tone. A visible link identifies the original Medium publication.

The blog index shows the newest article as the feature and the complete series in narrative order. Article pages include previous/next series navigation and a return-to-series action.

## 10. Component Boundaries

Suggested component structure:

- `AppShell`: global navigation, background, footer, and content frame.
- `LanguageProvider`: query parsing, stored preference, fallback, and document metadata.
- `LandingPage`: composition only.
- `HeroSection`, `ProjectOverview`, `TechGrid`, `ArchitecturePreview`, `FeaturedWriting`, `BuilderSection`.
- `ArchitecturePage`: page layout and selected-flow state.
- `ArchitectureCanvas`: read-only graph rendering and viewport controls.
- `ArchitectureNode`, `NodeTooltip`, `ArchitectureLegend`.
- `FlowPanel`, `FlowCard`, `FlowDetails`.
- `BlogIndexPage`, `FeaturedArticle`, `SeriesList`, `ArticleCard`.
- `ArticlePage`, `ArticleHeader`, `ArticleBody`, `SeriesNavigation`, `MediumAttribution`.

Page components compose features. Content, graph state, and language resolution remain outside presentational components.

## 11. Data Flow

### Language

1. Read `lang` from the URL.
2. Accept only `en` or `es`.
3. Fall back to stored preference, browser language, then English.
4. Render localized copy and content.
5. Update `<html lang>`, title, description, canonical, and alternate-language links.
6. When toggled, update the query string and stored preference without changing the route.

### Architecture

1. Import the public JSON at build time.
2. Validate it before a production build succeeds.
3. Convert safe graph records into display nodes and edges.
4. Selecting a flow derives the highlighted node and edge sets from ordered steps.
5. The JSON artifact remains downloadable without exposing any private source dataset.

### Articles

1. Load local MDX and shared metadata during the build.
2. Validate that both languages exist for every published article.
3. Generate the blog manifest, routes, metadata, and sitemap.
4. Render article content locally with no Medium request in the visitor's browser.

## 12. Error, Empty, and Fallback States

- Invalid or absent `lang`: use the documented fallback without an error page.
- Unknown route or article slug: bilingual 404 with links to Home and Writing.
- Missing translation during development: fail the production build rather than silently mixing languages.
- Invalid architecture data: fail the production build with the invalid node, edge, or flow ID.
- Empty flow selection: show explanatory copy and the complete graph.
- Reduced motion preference: disable canvas animation and nonessential transitions.
- Graph rendering failure: show a readable categorized component and flow list instead of a blank page.
- Missing cover image: use a branded local fallback with localized alt text.

## 13. Accessibility and Responsive Behavior

- Meet WCAG AA contrast and visible focus requirements.
- Provide a skip link and semantic landmarks.
- Make graph controls and flows keyboard accessible.
- Provide non-visual text descriptions for graph components and highlighted flows.
- Never make hover the only way to reveal information.
- Respect `prefers-reduced-motion`.
- Desktop architecture uses graph plus side panel; tablet and mobile stack the panel below the graph.
- Article typography targets a comfortable reading width and preserves code-block horizontal scrolling.

## 14. SEO and Publishing

- Keep the site statically deployable on Vercel.
- Pre-render the default English public routes and article content at build time.
- Bundle Spanish content locally and switch it after hydration when `?lang=es` is active.
- Generate `sitemap.xml`, `robots.txt`, Open Graph tags, and article JSON-LD.
- Update document metadata, canonical URLs, and alternate-language links from `?lang=en|es` in the browser.
- Preserve clean route rewrites in `vercel.json`.

### Known query-parameter trade-off

A static host returns the same initial HTML for `?lang=en` and `?lang=es`. Visitors receive the correct language after hydration, but social-preview crawlers and non-JavaScript indexers may see the default English metadata for Spanish URLs. Phase 1 accepts this constraint because query-parameter localization was selected explicitly. If fully independent Spanish indexing or social previews becomes a requirement, the upgrade path is localized paths or edge/server rendering.

## 15. Verification Strategy

### Automated

- TypeScript type checking.
- Production build.
- Unit tests for language resolution and URL preservation.
- Schema and sensitivity tests for `architecture.public.json`.
- Flow highlighting tests verifying ordered nodes and connecting edges.
- Content tests requiring paired EN/ES articles and complete metadata.
- Component tests for navigation, language toggle, blog series, flow selection, and fallbacks.
- Accessibility checks for main public pages.

### Manual

- Compare the migrated landing with the currently deployed Kathesama content and identity.
- Verify desktop, tablet, and mobile layouts.
- Navigate the architecture entirely with keyboard controls.
- Verify reduced-motion behavior.
- Check all four articles in both languages.
- Validate article metadata and social previews.
- Review every public architecture label for disclosure risk before deployment.

## 16. Delivery Sequence

1. Establish the React, TypeScript, Vite, testing, and routing foundation.
2. Migrate the current landing without adding new feature behavior.
3. Add shared localization and `?lang=` URL behavior.
4. Add and validate the public architecture data contract.
5. Implement the landing preview and full architecture explorer.
6. Import the four English articles and create reviewed Spanish translations.
7. Implement blog index and article routes.
8. Add pre-rendering, metadata, sitemap, accessibility, and responsive validation.
9. Perform factual and disclosure review.
10. Build and verify the production artifact.

## 17. Success Criteria

- Current Kathesama content and recognizable visual identity remain present.
- All public routes work with both `?lang=en` and `?lang=es`.
- The landing contains a performant architecture preview and featured writing.
- The full architecture page supports navigation, tooltips, flow selection, and path highlighting.
- A validated public `{nodes, edges, flows}` JSON is available for agents.
- All four articles are readable locally in English and Spanish without Medium availability.
- No sensitive architecture or deployment information appears in public artifacts.
- Production build, tests, responsive checks, and accessibility checks have recorded evidence.

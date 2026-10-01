# Kathesama Public Release Design

**Date:** 2026-10-01  
**Status:** Approved design, implementation not started  
**Delivery order:** This release must be published and accepted before work begins on `codebase.kathesama.ar`.

## Goal

Publish a polished bilingual version of `kathesama.ar` that preserves the existing identity and content, fixes the observed editorial and navigation defects, and expands the sanitized public architecture without exposing operationally sensitive implementation details.

## Scope

The public release includes four sequential gates:

1. editorial readability;
2. navigation and article-link correctness;
3. a deeper but still sanitized public architecture;
4. production preview, human approval, and publication.

The release remains a React 19, TypeScript, Vite, React Router, React Flow, Markdown, SSR/prerender application. It keeps the approved `?lang=en|es` language model.

## Gate 1: Editorial readability

### Chosen visual direction

Use **Option A: disciplined display typography**. Preserve the technological display face and dark visual identity, but stop treating long editorial titles as poster art.

Rules shared by the blog masthead, featured article, timeline titles, and article headers:

- do not hyphenate words automatically;
- do not use `overflow-wrap: anywhere` on editorial headings;
- use `word-break: normal` and language-aware natural wrapping;
- constrain measure and size independently for each surface;
- keep a readable line height and at least one complete word per final line;
- localize every label, including `FIELD NOTES` / `NOTAS DE CAMPO`;
- preserve the existing teal, gold, near-black, Syne, Fraunces, and DM Mono identity.

### Blog masthead

The `/blog` H1 remains the visual entry point but no longer fills most of the initial viewport. It uses a wider measure than the current `11ch`, a lower desktop ceiling, and responsive sizes that preserve whole words at 320 px. The statement rail remains secondary and aligns with the bottom of the masthead on desktop.

### Featured article

The featured CDKE story keeps an editorial two-column layout on wide screens and stacks on narrow screens. The design must:

- reserve enough width for the Spanish title;
- keep the image at its natural 1024:683 ratio;
- contain the issue number inside the artwork without clipping;
- remove the large empty area produced by mismatched column heights;
- keep title, summary, tags, and action in one coherent reading column;
- use the full linked title as the interactive target.

### Article header

`ArticleHeader` owns one consistent long-title treatment for all four articles. The metadata rail stays compact. The title width and size must work for the longest Spanish title without mid-word breaks. The summary follows immediately and the article body begins within a reasonable first-screen distance.

## Gate 2: Navigation and article links

### Scroll and focus behavior

Navigation behavior must distinguish three cases:

- a new path without a hash scrolls to the document start and focuses the main content target;
- a path with a hash preserves the existing delayed-anchor behavior and focuses that target;
- browser POP navigation restores the browser history position instead of forcing the top.

The behavior applies to featured links, timeline titles, `Open note`, previous/next navigation, Back to series, language changes, direct reloads, and not-found recovery links. Query-only language changes stay on the same article, reset to the title/main-content start, and focus the main content target without losing the slug. A direct reload starts at the route or explicit hash requested by the URL.

### Local series links

Editorial references between Katherine's own articles must resolve to local routes. The Markdown source uses canonical local paths such as `/blog/building-juana-self-hosted-ai`; the renderer adds the active `?lang=en|es` parameter.

Medium remains valid only for:

- flat frontmatter source metadata;
- `isBasedOn` in structured data;
- the explicit `Read the original on Medium` attribution;
- third-party Medium articles cited as external references.

The validator must reject links from one Katherine Medium post to another when they appear in the article body. All eight local editions are audited, not only the currently observed Part 1 / Part 2 links.

## Gate 3: Expanded public architecture

### Principle

The public architecture remains a curated conceptual model. It is not generated from raw repository paths and is not a reduced version of the future private codebase graph.

The current nodes, edges, flows, evidence states, fallbacks, keyboard interaction, JSON download, and disclosure scanner remain intact. The public artifact gains a `lenses` collection that references existing or newly curated public-safe node, edge, and flow IDs.

Each lens contains:

- stable ID;
- localized title and summary;
- ordered narrative sections;
- referenced node, edge, and flow IDs;
- public-safe technology and contract labels where applicable;
- evidence/status annotation;
- an explicit disclosure classification validated at build time.

### Nine public lenses

1. **System layers and boundaries** — experience, access, orchestration, context, intelligence, capability, knowledge, platform, and assurance.
2. **End-to-end request lifecycle** — intentional request through identity, planning, retrieval/tool selection, generation/action, streaming, and outcome.
3. **Memory, RAG, tools, and documents** — distinct data lifecycles and how context becomes grounded work.
4. **Trust and authentication** — conceptual identity, trust decisions, approval boundaries, and least privilege without real claims or policies.
5. **Observability and resilience** — traces, metrics, failures, retries, fallbacks, and operator visibility at a conceptual level.
6. **Architecture decisions and rationale** — public summaries of decisions without private ticket IDs or repository paths.
7. **Capability state** — verified, implemented in code, conditional, and next.
8. **Technologies** — technology families without vulnerable versions, deployment coordinates, model artifacts, or hardware inventory.
9. **Conceptual contracts** — HTTP request/response, streaming, asynchronous events, and data exchange without exact endpoints, topics, schemas, or headers.

### Interaction design

The graph remains the primary visualization. A compact lens selector sits above the existing narrative rail. Selecting a lens:

- highlights its relevant subgraph;
- presents the localized explanation in the rail;
- offers related narrated flows;
- preserves keyboard navigation and textual fallback;
- can be shared through the public-safe `lens` query parameter, for example `?lang=es&lens=trust`, without exposing internal identifiers.

The existing flow selection continues to highlight ordered paths. Lens selection and flow selection are complementary; choosing a flow inside a lens narrows the active route without destroying the lens context.

### Public disclosure boundary

Public content must not include:

- repository, module, package, class, function, or filesystem paths;
- internal hostnames, IPs, ports, container names, database names, tables, topics, buckets, or secret locations;
- exact gateway routes, administrative endpoints, claims, scopes, headers, firewall rules, or Keycloak configuration;
- dependency versions, model artifacts, private hardware topology, operational thresholds, or unresolved security findings;
- links to private GitHub resources or authenticated runtime documentation.

## Gate 4: Production acceptance and publication

### Automated release gate

The existing full gate remains mandatory:

- lint;
- TypeScript;
- unit, integration, accessibility, hydration, content, and schema tests;
- blog and architecture validation;
- client and SSR builds;
- prerender and built-output verification;
- disclosure scans and initial-bundle boundaries.

New regression coverage must prove:

- no editorial H1 uses hyphenation or arbitrary word breaking;
- the featured layout keeps its image ratio and does not clip issue metadata;
- path navigation, hash navigation, language changes, and POP restoration behave distinctly;
- all self-references use local blog routes and preserve language;
- all nine public lenses are complete, localized, referentially valid, and disclosure-safe.

### Browser acceptance

Verify English and Spanish at 1440, 768, 390, and 320 px. The review covers:

- masthead, feature, timeline, and all article titles;
- scroll/focus/history behavior;
- local series navigation;
- architecture lens and flow interaction;
- keyboard navigation, reduced motion, 200% zoom, and overflow;
- console, hydration, metadata, asset, and runtime-request behavior.

### Publication gate

Create a production-equivalent preview and obtain Katherine's explicit approval. Only then publish to the existing `kathesama.ar` deployment. Verify the live domain after deployment and retain a rollback artifact from the previous production version.

## Out of scope

- CMS or browser-based article editing;
- live Medium synchronization;
- authentication on the public site;
- raw codebase visualization;
- Keycloak or GitHub integration;
- any implementation of `codebase.kathesama.ar`.

## Success criteria

- Katherine approves the public preview visually in both languages.
- The five reported defects are covered by regression tests and browser evidence.
- The nine architecture topics are discoverable without making the graph unsafe or overwhelming.
- Every link between Katherine's articles stays on `kathesama.ar` and preserves language.
- The deployed public site passes its automated and browser gates without disclosure regressions.

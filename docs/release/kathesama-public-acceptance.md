# Kathesama public release acceptance

**Date:** 2026-10-01  
**Preview:** `http://127.0.0.1:44173/`  
**Scope:** Existing landing page, bilingual local blog, and public JuanaIA architecture atlas.  
**Deployment:** Not performed. Production publication remains behind explicit preview approval.

## Automated release gate

`pnpm check` completed successfully after the final browser-found fixes.

- Public content validation: 4 articles, 8 localized documents, 11 images.
- Architecture disclosure audit: 0 findings.
- Public architecture build: 18 nodes, 43 edges, 8 flows, 9 lenses.
- ESLint: passed.
- TypeScript: passed.
- Tests: 42 files, 495 tests passed.
- Client build, SSR build, 6-route prerender, sitemap, robots, and source-leakage verification: passed.

## Direct-route and metadata matrix

Every route below was opened directly against the production preview, not reached only through client-side navigation.

| Route group | Languages / variants | Result |
| --- | --- | --- |
| `/` | default landing | Pass: existing landing content present, main focused, no horizontal overflow |
| `/blog` | `lang=es`, `lang=en` | Pass: localized title, canonical, heading, and content |
| `/blog/building-juana-self-hosted-ai` | `lang=es`, `lang=en` | Pass |
| `/blog/juana-orchestration-layer` | `lang=es`, `lang=en` | Pass |
| `/blog/self-hosted-ai-latency-24-to-2` | `lang=es`, `lang=en` | Pass |
| `/blog/curiosity-driven-knowledge-enrichment` | `lang=es`, `lang=en` | Pass |
| `/architecture` | `lang=es&lens=layers`, `lang=en&lens=contracts` | Pass: localized title and canonical; selected lens loaded |
| Article hash | `#main-content` | Pass: target exists, is focused, and opens at the top |

The landing route retains the global site metadata. Blog and architecture routes own localized canonical, alternate-language, Open Graph, and Twitter metadata. `/architecture` is emitted as both `dist/architecture.html` and `dist/architecture/index.html`, with English title, canonical, alternates, Open Graph, Twitter metadata, and SSR body content present before JavaScript. Both language variants are present in the sitemap. No browser console warnings or errors were observed across the browser matrix.

## Responsive and visual matrix

The required five surfaces were inspected independently at each directly supported viewport.

| Surface | 1440 × 900 | 768 × 900 | 390 × 844 | 320 × 800 | Actual 200% browser zoom | Visual reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| Blog index | Pass | Pass | Pass | Pass | Not run | Not run |
| Longest Spanish article title | Pass | Pass | Pass | Pass | Not run | Not run |
| Longest English article title | Pass | Pass | Pass | Pass | Not run | Not run |
| Architecture — layers | Pass | Pass | Pass | Pass | Not run | Not run |
| Architecture — trust | Pass | Pass | Pass | Pass | Not run | Not run |

All 20 directly inspected surface/viewport combinations loaded the expected heading or lens and had `scrollWidth === clientWidth`; no horizontal page overflow remained.

Supporting evidence, not a substitute for the two `Not run` columns:

- A 720 × 900 CSS viewport, layout-equivalent to a 1440 px display at 200% zoom, passed for all five surfaces without overflow. The in-app browser did not expose a persistent real zoom control, so actual 200% browser zoom remains a manual check.
- Explicit `prefers-reduced-motion` branches pass automated tests for the blog, article reader, and architecture interactions. The browser did not expose media-emulation controls, so visual reduced-motion inspection remains a manual check.

## Interaction and accessibility acceptance

- Skip link: visible keyboard focus with a 2 px gold outline; Enter moves focus to `#main-content`.
- Route focus: direct loads focus main without scrolling; new article navigation moves immediately to the title.
- Long-title regression: the index masthead, featured article, timeline titles, and article headings fit at all tested widths without arbitrary mid-word splitting.
- Local series links: remain on `kathesama.ar`, preserve `lang=es`, and open the destination with its title visible at `scrollY = 0`.
- Browser Back: restores the blog reading neighborhood; the article link used to navigate remains visible after returning.
- Architecture lens: keyboard selection updates the `lens` query parameter and the narrative panel.
- Architecture node inspection: selecting a node exposes its tooltip while retaining the active lens narrative.
- Architecture disclosure boundary: automated audit passes before generation and emits only the approved public JSON.

## Browser-found corrections included in this acceptance run

- Reduced oversized blog masthead and article-title scales while preserving whole-word wrapping.
- Added narrow-screen typography safeguards for featured and timeline titles.
- Added localized canonical and social metadata to the public architecture atlas.
- Changed pathname navigation to an instant top reset, repeated after paint, so long-page links cannot leave the next article halfway down while global smooth scrolling is enabled.

## Release decision

**Preview candidate: automated gate passed and directly supported browser matrix passed.**  
**Manual checks still pending:** actual 200% browser zoom and OS-level reduced-motion visual inspection.  
**Production decision:** pending explicit user approval after accepting or completing those manual checks.

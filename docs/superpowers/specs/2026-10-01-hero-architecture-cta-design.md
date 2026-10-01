# Hero architecture CTA design

**Date:** 2026-10-01  
**Status:** Approved visual direction; pending written-spec review

## Goal

Expose the public JuanaIA architecture atlas directly from the landing-page hero while preserving the current in-page path to the project overview. Both actions must be immediately distinguishable from the dark hero background and available in English and Spanish.

## Approved composition

The hero presents two adjacent actions on desktop, in this order:

1. **Explore the project / Explorar el proyecto** — links to `#juana` and uses the existing turquoise accent as a solid background.
2. **Explore architecture / Explorar arquitectura** — links to `/architecture?lang={language}` and uses the existing warm yellow editorial accent as a solid background.

The architecture action includes a short supporting line:

- English: `9 lenses · 8 interactive flows`
- Spanish: `9 lentes · 8 flujos interactivos`

The first action preserves the page's narrative reading order. The second action is wider and visually distinct so the architecture atlas remains the portfolio differentiator without displacing the project overview.

## Visual behavior

- Both actions use dark foreground text on solid high-contrast backgrounds.
- The project action uses the existing turquoise token.
- The architecture action uses the existing warm yellow token already present in the site palette; no new arbitrary brand color is introduced.
- Hover and keyboard-focus states must remain visible without reducing text contrast.
- Existing hero entrance motion is applied to the action group as one unit.
- Reduced-motion behavior continues to expose the actions immediately.

## Responsive behavior

- Above the mobile breakpoint, actions form a two-column row: project first, architecture second.
- The architecture action receives the wider column because it carries supporting text.
- At narrow widths, actions stack vertically in the same order.
- Each action keeps a minimum touch target of 44 CSS pixels and must fit at 320 CSS pixels without horizontal overflow or clipped copy.

## Navigation and language

- The project action remains an in-page anchor to `#juana`.
- The architecture action uses an internal React route and preserves the active `lang=en|es` query parameter.
- English and Spanish labels come from the landing-page copy model rather than inline conditionals in the component.
- Browser Back behavior and the existing scroll-management contract remain unchanged.

## Accessibility

- Both actions remain semantic links with visible text.
- Supporting text is part of the architecture link's accessible name.
- Arrow glyphs are decorative and hidden from assistive technology.
- Focus-visible styling must be perceivable against both colored backgrounds.
- Automated accessibility checks must remain free of detectable violations.

## Implementation boundaries

Expected changes are limited to:

- `src/features/landing/HeroSection.tsx`
- `src/content/siteCopy.ts`
- `src/styles/global.css`
- focused landing-page tests

The existing architecture preview section remains in place. No architecture content, routing, deployment configuration, or article content changes are included.

## Acceptance criteria

1. The hero exposes both project and architecture actions in English and Spanish.
2. The project action appears first and navigates to `#juana`.
3. The architecture action appears second, preserves the current language, and navigates to `/architecture`.
4. Both actions use solid, high-contrast backgrounds: turquoise for project and warm yellow for architecture.
5. The architecture action displays the localized `9 lenses · 8 interactive flows` supporting line.
6. The actions form a row on desktop and stack without overflow at 320 CSS pixels.
7. Keyboard focus, reduced motion, and automated accessibility checks remain valid.
8. Existing landing, blog, architecture, language, and navigation tests continue to pass.

## Validation

- Focused component and landing-page tests for labels, URLs, order, and accessibility.
- CSS contract coverage for desktop columns, narrow stacking, solid accent backgrounds, and reduced-motion visibility.
- `pnpm check` before completion.
- Manual production-style inspection at desktop and mobile widths after implementation.

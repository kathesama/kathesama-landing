# Hero Architecture CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two high-contrast bilingual hero actions that preserve the project anchor and expose the public architecture atlas directly.

**Architecture:** Extend the existing localized landing copy with architecture CTA text, render the internal architecture destination with React Router, and style both actions as one responsive action group. Keep routing, scroll management, and the existing architecture preview untouched.

**Tech Stack:** React 19, TypeScript, React Router, CSS, Vitest, Testing Library, vitest-axe, pnpm, Vercel

---

## File map

- Modify `src/content/siteCopy.ts`: own English and Spanish labels and supporting text.
- Modify `src/features/landing/HeroSection.tsx`: render the ordered project and architecture links.
- Modify `src/styles/global.css`: own CTA layout, accent backgrounds, responsive stacking, motion, hover, and focus-compatible presentation.
- Modify `src/pages/LandingPage.test.tsx`: verify localized labels, destinations, DOM order, CSS contracts, and accessibility.

### Task 1: Lock the bilingual navigation contract with failing tests

**Files:**
- Modify: `src/pages/LandingPage.test.tsx`

- [ ] **Step 1: Add English and Spanish link assertions**

Add a test after the existing copy tests:

```tsx
it.each([
  {
    language: 'en' as const,
    project: 'Explore the project',
    architecture: 'Explore architecture 9 lenses · 8 interactive flows',
  },
  {
    language: 'es' as const,
    project: 'Explorar el proyecto',
    architecture: 'Explorar arquitectura 9 lentes · 8 flujos interactivos',
  },
])('exposes ordered high-value hero actions in $language', ({ language, project, architecture }) => {
  renderLanding(language);

  const projectLink = screen.getByRole('link', { name: project });
  const architectureLink = screen.getByRole('link', { name: architecture });

  expect(projectLink).toHaveAttribute('href', '#juana');
  expect(architectureLink).toHaveAttribute(
    'href',
    `/architecture?lang=${language}`,
  );
  expect(projectLink.compareDocumentPosition(architectureLink)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});
```

- [ ] **Step 2: Add responsive and color contract assertions**

Replace the single-CTA CSS assertion with action-group coverage:

```tsx
it('uses a two-column high-contrast hero action group that stacks on narrow screens', () => {
  expect(globalStyles).toMatch(
    /\.hero-actions\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*0\.92fr\)\s+minmax\(0,\s*1\.32fr\);/,
  );
  expect(globalStyles).toMatch(
    /\.hero-cta--project\s*\{[^}]*background:\s*var\(--teal\);/,
  );
  expect(globalStyles).toMatch(
    /\.hero-cta--architecture\s*\{[^}]*background:\s*var\(--gold\);/,
  );
  expect(globalStyles).toMatch(
    /@media\s*\(max-width:\s*560px\)[\s\S]*?\.hero-actions\s*\{[^}]*grid-template-columns:\s*1fr;/,
  );
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```powershell
pnpm vitest run src/pages/LandingPage.test.tsx
```

Expected: FAIL because `Explore architecture` / `Explorar arquitectura`, `.hero-actions`, and the two modifier classes do not exist yet.

### Task 2: Implement localized hero actions

**Files:**
- Modify: `src/content/siteCopy.ts`
- Modify: `src/features/landing/HeroSection.tsx`

- [ ] **Step 1: Extend the localized copy model**

Add these fields beside the existing `action` field in `siteCopy.hero`:

```ts
architectureAction: {
  en: 'Explore architecture',
  es: 'Explorar arquitectura',
},
architectureDetail: {
  en: '9 lenses · 8 interactive flows',
  es: '9 lentes · 8 flujos interactivos',
},
```

- [ ] **Step 2: Render the ordered action group**

Import `Link` and replace the single hero anchor with:

```tsx
<div className="hero-actions">
  <a href="#juana" className="hero-cta hero-cta--project">
    <span>{copy.action[language]}</span>
    <span aria-hidden="true">↓</span>
  </a>
  <Link
    to={`/architecture?lang=${language}`}
    className="hero-cta hero-cta--architecture"
  >
    <span className="hero-cta__copy">
      {copy.architectureAction[language]}
      <small>{copy.architectureDetail[language]}</small>
    </span>
    <span aria-hidden="true">↗</span>
  </Link>
</div>
```

- [ ] **Step 3: Run the focused test and verify the structural assertions advance**

Run:

```powershell
pnpm vitest run src/pages/LandingPage.test.tsx
```

Expected: link-label, destination, language, and order assertions PASS; CSS contract assertions remain FAIL until Task 3.

### Task 3: Apply the approved high-contrast responsive styling

**Files:**
- Modify: `src/styles/global.css`
- Test: `src/pages/LandingPage.test.tsx`

- [ ] **Step 1: Move entrance animation to the action group**

Add the group before `.hero-cta` and remove opacity/animation from the individual link:

```css
.hero-actions {
  display: grid;
  width: min(100%, 680px);
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.32fr);
  gap: 0.75rem;
  opacity: 0;
  animation: fadeUp 0.8s 0.8s forwards;
}
```

- [ ] **Step 2: Define the shared link and two solid accents**

Use this structure for the CTA rules:

```css
.hero-cta {
  display: flex;
  min-height: 60px;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.9rem 1.15rem;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--bg);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition:
    filter 0.2s,
    transform 0.2s;
}

.hero-cta--project {
  background: var(--teal);
}

.hero-cta--architecture {
  background: var(--gold);
}

.hero-cta--architecture:focus-visible {
  outline-color: var(--white);
}

.hero-cta__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.2rem;
}

.hero-cta__copy small {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  opacity: 0.72;
}

.hero-cta:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
}
```

The project action keeps the global gold focus outline. The architecture action overrides only the outline color to white so focus remains visible against its gold background and the dark page.

- [ ] **Step 3: Stack actions at narrow widths**

Add before the 360px media query:

```css
@media (max-width: 560px) {
  .hero-actions {
    grid-template-columns: 1fr;
  }
}
```

In the reduced-motion list, replace `.hero-cta` with `.hero-actions` so the group is visible immediately:

```css
.hero-label,
.hero-title,
.hero-sub,
.hero-actions,
.hero-scroll {
  opacity: 1;
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
pnpm vitest run src/pages/LandingPage.test.tsx
```

Expected: all `LandingPage.test.tsx` tests PASS, including vitest-axe.

- [ ] **Step 5: Commit the implementation**

```powershell
git add src/content/siteCopy.ts src/features/landing/HeroSection.tsx src/styles/global.css src/pages/LandingPage.test.tsx
git -c commit.gpgsign=false commit -m "feat(site): add architecture CTA to hero"
```

### Task 4: Validate, publish, and verify production

**Files:**
- Verify: `docs/superpowers/specs/2026-10-01-hero-architecture-cta-design.md`
- Verify: `docs/superpowers/plans/2026-10-01-hero-architecture-cta.md`

- [ ] **Step 1: Run the complete repository validation**

Run:

```powershell
pnpm check
```

Expected: public-content validation, architecture disclosure audit, lint, typecheck, all Vitest files, client build, SSR build, prerendering, sitemap/robots checks, and source-leakage checks PASS.

- [ ] **Step 2: Inspect desktop and 320px layouts**

Verify both languages in a production build or preview:

- `/?lang=en`
- `/?lang=es`

Expected: two solid-color actions, correct order, readable supporting copy, no clipping at 320 CSS pixels, and no browser-console errors.

- [ ] **Step 3: Push the feature branch and create a PR**

```powershell
git push -u origin feature/hero-architecture-cta
gh pr create --base main --head feature/hero-architecture-cta --title "feat: add architecture CTA to landing hero" --body "Adds the approved high-contrast bilingual hero actions for the project overview and public architecture atlas. Validation: pnpm check and responsive browser inspection."
```

Expected: an open PR targeting `main`, with successful GitGuardian and Vercel preview checks.

- [ ] **Step 4: Merge only after remote checks succeed**

```powershell
$prUrl = gh pr view --json url --jq .url
gh pr merge $prUrl --merge
```

Expected: PR state `MERGED` and a new merge commit on `main`.

- [ ] **Step 5: Verify the Vercel production deployment**

Check the merge commit status until the `Vercel` context reports `success`, then inspect:

- `https://kathesama.ar/?lang=en`
- `https://kathesama.ar/?lang=es`
- `https://kathesama.ar/architecture?lang=es&lens=layers`

Expected: both hero links are visible and functional in production, Spanish renders after hydration, the architecture route loads, and the browser console contains no warnings or errors.

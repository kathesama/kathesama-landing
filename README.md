# kathesama-landing

React and TypeScript portfolio site for [kathesama.ar](https://kathesama.ar).

## Prerequisites

- Node.js 22.13+ within 22.x, or 24+
- pnpm 11

### Toolchain compatibility

`jsdom` is pinned to 29.1.1 because it supports the repository's Node contract
(`^22.13.0 || >=24.0.0`). The newer 30.x line raises that floor beyond the
minimum supported Node 22 and 24 baselines. `@types/node` is pinned to the 22.x
major so static checks model the repository's minimum runtime, and that major
is accepted by Vitest's peer range.

## Local development

```powershell
pnpm install
pnpm dev
```

## Validation

```powershell
pnpm check
```

The public site supports English and Spanish through `?lang=en` and `?lang=es`.

## Publishing a blog update

Blog publication is an intentional local-content change. The deployed site does
not synchronize with Medium, load its RSS feed, or fetch article images at
runtime.

1. Save a dated RSS fixture under `content/blog/source/` and review it before
   using it as an import source.
2. Run a dry import against that fixture:

   ```powershell
   pnpm import:medium -- --fixture content/blog/source/medium-feed-YYYY-MM-DD.xml
   ```

3. Stage the generated drafts and assets into a new, empty review directory.
   This command writes only to that explicit directory:

   ```powershell
   pnpm exec tsx scripts/import-medium-blog.ts --fixture content/blog/source/medium-feed-YYYY-MM-DD.xml --output .blog-import --download-assets
   ```

4. Review the staged English Markdown and every downloaded image, then promote
   only the approved files into `content/blog/articles/` and
   `public/images/blog/`. Replace missing or weak image alt text after inspecting
   the actual image.
5. Create and review the matching Spanish Markdown edition. Preserve code,
   measurements, links, and technical names; mark it as a locally reviewed
   translation in frontmatter.
6. Update the typed metadata in `src/content/blog/catalog.ts`, including source
   identity, local image paths, bilingual title/summary/tags, and series order.
7. Run the content gate and the complete repository gate:

   ```powershell
   pnpm validate:blog
   pnpm check
   ```

The importer is a review aid, not a publishing pipeline. Do not copy its staging
directory, RSS fixtures, source inventories, Medium tracking endpoints, or
remote CDN URLs into public output.

## Public architecture

The curated public graph lives in `src/content/architecture/architecture.public.json`.
Run `pnpm validate:public` after every edit. Development and production builds
publish the validated and audited agent-readable copy at
`/architecture.public.json`.

The public file is intentionally conceptual. Never add deployment coordinates,
credentials, exact infrastructure identifiers, private source paths, or security findings.

### Public disclosure review

The automated disclosure audit is defense in depth; it does not replace human
review. Before publishing, a reviewer must confirm that:

- every technical claim is intentionally public;
- each capability status is current and accurate;
- no link targets live/private GitHub content or runtime-generated documentation;
- technology descriptions omit exact versions and sensitive configuration;
- HTTP, event, and streaming contracts remain conceptual rather than exposing
  operational routes or identifiers.

The audit reports only a sanitized content location and a named rule ID. It
never prints the suspicious value.

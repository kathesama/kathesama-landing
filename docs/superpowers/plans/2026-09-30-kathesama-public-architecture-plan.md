# Kathesama Public Architecture Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a bilingual, public-safe architecture explorer for JuanaIA at `/architecture?lang=en|es`, plus a lightweight landing preview and a validated downloadable `{nodes, edges, flows}` JSON artifact for people and AI agents.

**Architecture:** A hand-curated JSON file is the only source of public architecture truth. A build-time Zod gate rejects structural errors and obvious disclosure risks, then publishes an exact generated copy for download; React consumes the canonical source and derives React Flow nodes, edges, selection state, and localized labels with pure functions. The full explorer is lazy-loaded, read-only, keyboard accessible, responsive, and wrapped by a textual fallback, while the landing preview uses a small CSS/SVG projection so the graph library never enters the home-page bundle.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, React Router 7, `@xyflow/react`, Zod, Vitest, React Testing Library, vitest-axe, CSS

---

## Plan Boundary and Evidence Language

This is plan 2 of 3. It implements only the sanitized public architecture experience described in `docs/superpowers/specs/2026-09-30-kathesama-architecture-blog-design.md`. It does not implement the bilingual blog, inspect repositories at runtime, expose source navigation, add Keycloak, or build the private codebase visualizer.

The public explorer must use evidence language literally:

- `verified`: exercised end to end with direct evidence;
- `implemented-in-code`: present in current source/configuration, not a claim that it is deployed or running;
- `conditional`: used only under a documented condition such as explicit approval;
- `next`: roadmap only, outside the current graph.

Never translate any of those states into “running”, “production”, “live”, or equivalent claims. The roadmap remains visually separate from the current graph: external channels, ambient autonomy, and a knowledge graph appear only in a small “Next” editorial strip below the explorer.

Commit steps are intentionally omitted because the governing user instructions prohibit agent-created commits and pull requests. Do not run Git commands.

## Design Direction

Treat this page as a **technical observatory / editorial systems atlas**, not a generic admin dashboard:

- Retain Kathesama’s Syne display type, Fraunces editorial prose, DM Mono annotations, dark-teal field, gold evidence marks, and animated grid.
- Lead with a compact masthead: “JuanaIA systems atlas / Atlas de sistemas de JuanaIA”, a one-paragraph disclosure-safe summary, and an index line such as `18 components · 8 narrated flows · public edition`.
- Make the graph feel like an annotated technical plate: thin ruled borders, coordinate-like micro-labels, asymmetric negative space, and a restrained glow only on the selected path.
- Use the right side as an editorial contents rail titled “How Juana thinks and acts / Cómo piensa y actúa Juana”. Flow rows are numbered narrative entries, not generic cards.
- Use teal for the active path, gold for evidence/status stamps, green for data edges, muted blue-grey for the resting graph, and strong opacity reduction for unrelated elements.
- Keep motion purposeful: stream edges may move and the landing preview may show one travelling signal; `prefers-reduced-motion` makes both static.
- On narrow screens the graph comes first, followed by a native flow selector and the selected narrative. Do not squeeze the desktop rail beside the canvas.

## Public Disclosure Contract

The public JSON must not contain or imply:

- hostnames, IP addresses, ports, container names, tunnel/admin topology;
- realm/client IDs, private headers, secret paths, credentials, tokens, or keys;
- exact model names, hardware identifiers, VRAM figures, quantization, or deployment IDs;
- broker topics, database table/schema names, prompts, thresholds, retry budgets, or filesystem paths;
- private URLs, security gaps, ticket IDs, or repository/source paths.

The automated scanner is a tripwire, not a security proof. A human disclosure review of the canonical JSON and the built artifact remains a release requirement.

## File Map

### Dependencies and build gate

- Modify `package.json`: add React Flow plus architecture preparation/validation scripts.
- Modify `pnpm-lock.yaml`: generated dependency lock changes.
- Modify `tsconfig.node.json`: type-check `scripts/**/*.ts` with Node types.
- Modify `.gitignore`: ignore the generated public JSON copy.
- Create `scripts/prepare-public-architecture.ts`: validate and publish the safe artifact.

### Data contract

- Create `src/features/architecture/architecture.types.ts`: stable public types and enum values.
- Create `src/features/architecture/architecture.schema.ts`: strict schema, graph integrity checks, and sensitivity tripwires.
- Create `src/features/architecture/architecture.schema.test.ts`: invalid/valid contract coverage.
- Create `src/content/architecture/architecture.public.json`: canonical curated public dataset.
- Create `src/content/architecture/index.ts`: typed in-app export of the canonical dataset.

### Graph derivation

- Create `src/features/architecture/architectureGraph.ts`: pure React Flow projection and path-state derivation.
- Create `src/features/architecture/architectureGraph.test.ts`: repeated-node paths, edge IDs, dimming, filters, labels, and motion tests.
- Create `src/features/architecture/architectureCopy.ts`: bilingual UI, edge/status/category, ARIA, and roadmap copy.

### Explorer UI

- Create `src/pages/ArchitecturePage.tsx`: page composition and document heading.
- Create `src/features/architecture/ArchitectureExplorer.tsx`: selection/filter state and two-column composition.
- Create `src/features/architecture/ArchitectureCanvas.tsx`: read-only React Flow canvas and viewport controls.
- Create `src/features/architecture/ArchitectureNode.tsx`: custom node plate.
- Create `src/features/architecture/NodeTooltip.tsx`: hover/focus/selection detail.
- Create `src/features/architecture/ArchitectureToolbar.tsx`: clear, fit, contracts, observability, copy, and JSON actions.
- Create `src/features/architecture/ArchitectureLegend.tsx`: edge semantics, categories, and evidence states.
- Create `src/features/architecture/FlowPanel.tsx`: desktop narrative rail and mobile selector.
- Create `src/features/architecture/ArchitectureFallback.tsx`: readable graph-failure representation.
- Create `src/features/architecture/ArchitectureErrorBoundary.tsx`: render fallback when the canvas throws.
- Create `src/features/architecture/useReducedMotion.ts`: reactive media-query hook.
- Create `src/features/architecture/architecture.css`: observatory layout, graph theme, states, responsive rules, focus, and reduced motion.
- Create `src/features/architecture/ArchitectureExplorer.test.tsx`: route interactions, JSON actions, accessibility, fallback, and localization.
- Create `src/features/architecture/ArchitectureNode.test.tsx`: tooltip and semantic text behavior.
- Modify `src/app/routes.tsx`: replace the architecture placeholder with a lazy route.
- Modify `src/app/routes.test.tsx`: assert the real explorer and preserve blog placeholder coverage.

### Landing preview

- Create `src/features/landing/ArchitecturePreview.tsx`: lightweight non-React-Flow preview.
- Create `src/features/landing/ArchitecturePreview.test.tsx`: bilingual CTA, safe subset, and motion behavior.
- Modify `src/pages/LandingPage.tsx`: place preview after `ProjectOverview`.
- Modify `src/pages/LandingPage.test.tsx`: assert preview integration without weakening existing preservation tests.
- Modify `src/styles/global.css`: preview section spacing only; explorer-specific styling stays in `architecture.css`.
- Modify `README.md`: document architecture validation and the public artifact.

## Canonical Public Dataset

Use exactly 18 conceptual nodes. This is intentionally a system model, not a repository inventory.

### Node records

Every node contains `id`, localized `label`, localized `description`, localized `capability`, `category`, `evidence`, and `position`.

| ID | EN / ES label | Category | Evidence | Position | Safe description and capability intent |
|---|---|---|---|---|---|
| `person` | Person / Persona | `experience` | `verified` | `0,320` | Starts an intentional interaction / Inicia una interacción intencional; supplies intent and explicit approval / aporta intención y aprobación explícita. |
| `web-pwa` | Web experience / Experiencia web | `experience` | `verified` | `240,220` | Text-first interface / Interfaz centrada en texto; exchanges conversation updates / intercambia actualizaciones de conversación. |
| `voice` | Voice experience / Experiencia de voz | `experience` | `verified` | `240,440` | Spoken interaction boundary / Frontera de interacción hablada; turns voice into a conversational turn and back / convierte voz en un turno y viceversa. |
| `gateway` | Experience gateway / Puerta de experiencia | `access` | `verified` | `500,320` | Public request boundary / Frontera pública de solicitudes; routes safe user interactions / dirige interacciones seguras. |
| `identity` | Identity boundary / Frontera de identidad | `access` | `implemented-in-code` | `500,70` | Confirms who may continue / Confirma quién puede continuar; establishes a trusted user context / establece un contexto confiable. |
| `soul` | Conversation core / Núcleo conversacional | `orchestration` | `verified` | `760,300` | Coordinates each turn / Coordina cada turno; maintains conversational intent / mantiene la intención conversacional. |
| `session` | Session context / Contexto de sesión | `context` | `implemented-in-code` | `760,70` | Keeps short-lived continuity / Mantiene continuidad temporal; provides the active turn context / aporta el contexto activo. |
| `planner` | Planning / Planificación | `orchestration` | `verified` | `1020,300` | Chooses the next safe step / Elige el próximo paso seguro; decomposes intent into bounded work / descompone intención en trabajo acotado. |
| `memory` | Memory / Memoria | `context` | `implemented-in-code` | `1020,70` | Recalls relevant prior context / Recupera contexto previo relevante; stores approved durable knowledge / guarda conocimiento duradero aprobado. |
| `runtime` | Execution runtime / Runtime de ejecución | `intelligence` | `verified` | `1280,300` | Executes planned reasoning work / Ejecuta el trabajo de razonamiento planificado; coordinates intelligence and capabilities / coordina inteligencia y capacidades. |
| `inference` | Language intelligence / Inteligencia de lenguaje | `intelligence` | `verified` | `1540,200` | Produces language and reasoning output / Produce lenguaje y razonamiento; returns a bounded result / devuelve un resultado acotado. |
| `capabilities` | Capability catalog / Catálogo de capacidades | `capability` | `implemented-in-code` | `1540,390` | Describes available safe abilities / Describe capacidades seguras disponibles; exposes only approved operations / expone solo operaciones aprobadas. |
| `actions` | Action approval / Aprobación de acciones | `assurance` | `conditional` | `1800,390` | Gates higher-impact work / Controla trabajo de mayor impacto; requires explicit approval when applicable / requiere aprobación explícita cuando corresponde. |
| `knowledge-worker` | Knowledge worker / Trabajador de conocimiento | `knowledge` | `implemented-in-code` | `1280,590` | Organizes and enriches information / Organiza y enriquece información; prepares reusable knowledge / prepara conocimiento reutilizable. |
| `tasking` | Background tasking / Tareas en segundo plano | `orchestration` | `implemented-in-code` | `1540,590` | Coordinates deferred work / Coordina trabajo diferido; schedules bounded background steps / programa pasos acotados en segundo plano. |
| `events` | Event backbone / Columna de eventos | `platform` | `implemented-in-code` | `1020,560` | Carries asynchronous signals / Transporta señales asíncronas; decouples follow-up work / desacopla trabajo posterior. |
| `data` | Protected data / Datos protegidos | `platform` | `implemented-in-code` | `760,650` | Persists approved information / Persiste información aprobada; provides durable application state / aporta estado duradero. |
| `observability` | Observability / Observabilidad | `assurance` | `implemented-in-code` | `1280,790` | Receives operational signals / Recibe señales operativas; supports diagnosis without exposing content / ayuda al diagnóstico sin exponer contenido. |

Known categories are `experience`, `access`, `orchestration`, `context`, `intelligence`, `capability`, `knowledge`, `platform`, and `assurance`.

### Edge records

Each edge contains `id`, `source`, `target`, localized `label`, and `type`. Edge types are `sync`, `stream`, `async`, `data`, `trust`, and `telemetry`.

| ID | From → to | Type | EN / ES safe exchange label |
|---|---|---|---|
| `person-web` | `person` → `web-pwa` | `sync` | typed intent / intención escrita |
| `web-person` | `web-pwa` → `person` | `stream` | progressive answer / respuesta progresiva |
| `person-voice` | `person` → `voice` | `stream` | spoken intent / intención hablada |
| `voice-person` | `voice` → `person` | `stream` | spoken answer / respuesta hablada |
| `web-gateway` | `web-pwa` → `gateway` | `stream` | conversation request / solicitud conversacional |
| `gateway-web` | `gateway` → `web-pwa` | `stream` | response updates / actualizaciones de respuesta |
| `voice-gateway` | `voice` → `gateway` | `stream` | voice turn / turno de voz |
| `gateway-voice` | `gateway` → `voice` | `stream` | answer stream / flujo de respuesta |
| `gateway-identity` | `gateway` → `identity` | `trust` | identity check / verificación de identidad |
| `identity-gateway` | `identity` → `gateway` | `trust` | trusted context / contexto confiable |
| `gateway-soul` | `gateway` → `soul` | `sync` | accepted turn / turno aceptado |
| `soul-gateway` | `soul` → `gateway` | `stream` | conversational result / resultado conversacional |
| `soul-session` | `soul` → `session` | `data` | active context read / lectura de contexto activo |
| `session-soul` | `session` → `soul` | `data` | session context / contexto de sesión |
| `soul-planner` | `soul` → `planner` | `sync` | bounded intent / intención acotada |
| `planner-soul` | `planner` → `soul` | `stream` | composed result / resultado compuesto |
| `planner-memory` | `planner` → `memory` | `data` | relevant-context query / consulta de contexto relevante |
| `memory-planner` | `memory` → `planner` | `data` | grounded context / contexto fundamentado |
| `planner-runtime` | `planner` → `runtime` | `sync` | execution request / solicitud de ejecución |
| `runtime-planner` | `runtime` → `planner` | `stream` | execution result / resultado de ejecución |
| `runtime-inference` | `runtime` → `inference` | `stream` | reasoning request / solicitud de razonamiento |
| `inference-runtime` | `inference` → `runtime` | `stream` | generated result / resultado generado |
| `runtime-capabilities` | `runtime` → `capabilities` | `sync` | capability request / solicitud de capacidad |
| `capabilities-runtime` | `capabilities` → `runtime` | `sync` | capability result / resultado de capacidad |
| `capabilities-actions` | `capabilities` → `actions` | `trust` | approval request / solicitud de aprobación |
| `actions-capabilities` | `actions` → `capabilities` | `trust` | approval decision / decisión de aprobación |
| `soul-events` | `soul` → `events` | `async` | completed-turn event / evento de turno completado |
| `events-memory` | `events` → `memory` | `async` | memory candidate / candidato a memoria |
| `memory-data` | `memory` → `data` | `data` | approved memory / memoria aprobada |
| `data-memory` | `data` → `memory` | `data` | durable context / contexto duradero |
| `gateway-knowledge` | `gateway` → `knowledge-worker` | `sync` | knowledge input / entrada de conocimiento |
| `knowledge-data` | `knowledge-worker` → `data` | `data` | structured knowledge / conocimiento estructurado |
| `data-knowledge` | `data` → `knowledge-worker` | `data` | source context / contexto fuente |
| `tasking-events` | `tasking` → `events` | `async` | deferred task / tarea diferida |
| `events-knowledge` | `events` → `knowledge-worker` | `async` | enrichment request / solicitud de enriquecimiento |
| `knowledge-capabilities` | `knowledge-worker` → `capabilities` | `sync` | bounded capability / capacidad acotada |
| `inference-knowledge` | `inference` → `knowledge-worker` | `stream` | enrichment result / resultado de enriquecimiento |
| `gateway-observability` | `gateway` → `observability` | `telemetry` | request signal / señal de solicitud |
| `soul-observability` | `soul` → `observability` | `telemetry` | turn signal / señal de turno |
| `runtime-observability` | `runtime` → `observability` | `telemetry` | execution signal / señal de ejecución |
| `memory-observability` | `memory` → `observability` | `telemetry` | memory signal / señal de memoria |
| `actions-observability` | `actions` → `observability` | `telemetry` | approval signal / señal de aprobación |
| `knowledge-observability` | `knowledge-worker` → `observability` | `telemetry` | knowledge signal / señal de conocimiento |

Visual semantics are fixed: `sync` solid, `stream` animated teal, `async` dashed, `data` green, `telemetry` dotted and hidden by default, and `trust` gold with a lock marker. These semantics appear in both the legend and accessible text.

### Flow records

Each flow contains `id`, localized `title`, `summary`, and `outcome`, `evidence`, ordered `steps`, ordered `edgeIds`, three to five localized `stages`, and optional `primary`. `edgeIds[n]` must connect `steps[n]` to `steps[n + 1]`; this explicit list is required because flows legitimately revisit the same node.

1. `real-time-chat` — **verified**, `primary: true`. Title “Real-time chat / Chat en tiempo real”. Outcome “A typed question becomes a progressive, contextual answer / Una pregunta escrita se convierte en una respuesta progresiva y contextual”. Steps: `person, web-pwa, gateway, identity, gateway, soul, planner, runtime, inference, runtime, planner, soul, gateway, web-pwa, person`. Edge IDs: `person-web, web-gateway, gateway-identity, identity-gateway, gateway-soul, soul-planner, planner-runtime, runtime-inference, inference-runtime, runtime-planner, planner-soul, soul-gateway, gateway-web, web-person`. Stages: Ask / Preguntar; Establish trust / Establecer confianza; Plan / Planificar; Reason / Razonar; Stream answer / Transmitir respuesta.
2. `memory-grounded` — **implemented-in-code**. Title “Memory-grounded answer / Respuesta con memoria”. Outcome “Relevant prior context informs the answer without exposing storage details / El contexto previo relevante informa la respuesta sin exponer detalles de almacenamiento”. Steps insert `planner, memory, planner` before the runtime segment of real-time chat. Use `planner-memory, memory-planner` for that detour and the same request/response edge IDs as flow 1. Stages: Ask; Recall; Plan; Reason; Answer, all localized.
3. `tool-assisted` — **implemented-in-code**. Title “Tool-assisted answer / Respuesta asistida por capacidades”. Outcome “A bounded capability contributes to the response / Una capacidad acotada contribuye a la respuesta”. Use the common request path through `planner → runtime`, then `runtime, capabilities, runtime`, then the common response path. Use `runtime-capabilities, capabilities-runtime` for the detour. Stages: Understand; Select capability; Execute; Compose; Answer.
4. `approved-action` — **conditional**. Title “Approved action / Acción aprobada”. Outcome “Higher-impact work continues only after an explicit decision / El trabajo de mayor impacto continúa solo después de una decisión explícita”. Use the tool-assisted path with `capabilities, actions, capabilities` and `capabilities-actions, actions-capabilities`. Stages: Understand; Propose action; Request approval; Execute if approved; Report outcome.
5. `voice-turn` — **verified**. Title “Voice turn / Turno de voz”. Outcome “A spoken request returns as a spoken, contextual answer / Una solicitud hablada vuelve como respuesta hablada y contextual”. Replace the web request/response ends in flow 1 with `person-voice, voice-gateway` and `gateway-voice, voice-person`. Stages: Speak; Establish trust; Plan; Reason; Speak answer.
6. `post-turn-memory` — **implemented-in-code**. Title “Post-turn memory / Memoria posterior al turno”. Outcome “A completed turn produces an approved durable memory candidate / Un turno completado produce un candidato aprobado de memoria duradera”. Steps: `person, web-pwa, gateway, soul, planner, runtime, inference, runtime, planner, soul, events, memory, data`. Edge IDs: `person-web, web-gateway, gateway-soul, soul-planner, planner-runtime, runtime-inference, inference-runtime, runtime-planner, planner-soul, soul-events, events-memory, memory-data`. Stages: Complete turn; Emit event; Evaluate memory; Persist approved context.
7. `knowledge-ingestion` — **implemented-in-code**. Title “Knowledge ingestion / Ingesta de conocimiento”. Outcome “User-provided material becomes reusable, protected context / El material aportado se vuelve contexto reutilizable y protegido”. Steps: `person, web-pwa, gateway, knowledge-worker, data, memory`. Edge IDs: `person-web, web-gateway, gateway-knowledge, knowledge-data, data-memory`. Stages: Provide source; Organize; Persist; Make recallable.
8. `background-enrichment` — **implemented-in-code**. Title “Background enrichment / Enriquecimiento en segundo plano”. Outcome “Deferred work enriches stored knowledge without blocking a conversation / El trabajo diferido enriquece conocimiento sin bloquear una conversación”. Steps: `tasking, events, knowledge-worker, capabilities, runtime, inference, knowledge-worker, data, memory`. Edge IDs: `tasking-events, events-knowledge, knowledge-capabilities, capabilities-runtime, runtime-inference, inference-knowledge, knowledge-data, data-memory`. Stages: Schedule; Gather context; Enrich; Persist.

Summaries must state the boundary, not repeat the outcome. Example for `approved-action`: “Shows the approval gate around a capability whose effect is not read-only / Muestra el control de aprobación alrededor de una capacidad cuyo efecto no es solo lectura.”

Use these exact summaries and stage payloads; they remove any discretion left by the shorthand above:

| Flow | Exact EN / ES summary | Exact stages as `id: nodeIds — EN / ES label` |
|---|---|---|
| `real-time-chat` | Shows the trusted request boundary, turn coordination, reasoning, and progressive return / Muestra la frontera confiable de solicitud, la coordinación del turno, el razonamiento y el retorno progresivo | `ask: person,web-pwa — Ask / Preguntar`; `establish-trust: gateway,identity — Establish trust / Establecer confianza`; `plan: soul,planner — Plan / Planificar`; `reason: runtime,inference — Reason / Razonar`; `stream-answer: runtime,planner,soul,gateway,web-pwa,person — Stream answer / Transmitir respuesta` |
| `memory-grounded` | Adds a bounded recall step to the conversational path without describing storage internals / Agrega una recuperación acotada al recorrido conversacional sin describir el almacenamiento interno | `ask: person,web-pwa,gateway — Ask / Preguntar`; `recall: planner,memory — Recall / Recuperar`; `plan: planner,runtime — Plan with context / Planificar con contexto`; `reason: runtime,inference — Reason / Razonar`; `answer: runtime,planner,soul,gateway,web-pwa,person — Answer / Responder` |
| `tool-assisted` | Shows how planning may select a bounded capability and incorporate its result / Muestra cómo la planificación puede elegir una capacidad acotada e incorporar su resultado | `understand: person,web-pwa,gateway,soul,planner — Understand / Comprender`; `select-capability: runtime,capabilities — Select capability / Elegir capacidad`; `execute: capabilities,runtime — Execute / Ejecutar`; `compose: planner,soul — Compose / Componer`; `answer: gateway,web-pwa,person — Answer / Responder` |
| `approved-action` | Shows the approval gate around a capability whose effect is not read-only / Muestra el control de aprobación alrededor de una capacidad cuyo efecto no es solo lectura | `understand: person,web-pwa,gateway,soul,planner — Understand / Comprender`; `propose: runtime,capabilities — Propose action / Proponer acción`; `request-approval: actions — Request approval / Solicitar aprobación`; `execute-if-approved: capabilities,runtime — Execute if approved / Ejecutar si se aprueba`; `report: planner,soul,gateway,web-pwa,person — Report outcome / Informar resultado` |
| `voice-turn` | Uses the same trusted conversational path with spoken input and output boundaries / Usa el mismo recorrido conversacional confiable con fronteras de entrada y salida habladas | `speak: person,voice — Speak / Hablar`; `establish-trust: gateway,identity — Establish trust / Establecer confianza`; `plan: soul,planner — Plan / Planificar`; `reason: runtime,inference — Reason / Razonar`; `speak-answer: runtime,planner,soul,gateway,voice,person — Speak answer / Responder con voz` |
| `post-turn-memory` | Separates the completed conversation from asynchronous memory evaluation / Separa la conversación completada de la evaluación asíncrona de memoria | `complete-turn: person,web-pwa,gateway,soul,planner,runtime,inference — Complete turn / Completar turno`; `emit-event: soul,events — Emit event / Emitir evento`; `evaluate-memory: events,memory — Evaluate memory / Evaluar memoria`; `persist: memory,data — Persist approved context / Persistir contexto aprobado` |
| `knowledge-ingestion` | Shows a safe conceptual path from user-provided material to recallable context / Muestra un recorrido conceptual seguro desde material aportado hasta contexto recuperable | `provide-source: person,web-pwa,gateway — Provide source / Aportar fuente`; `organize: knowledge-worker — Organize / Organizar`; `persist: knowledge-worker,data — Persist / Persistir`; `make-recallable: data,memory — Make recallable / Hacer recuperable` |
| `background-enrichment` | Shows deferred knowledge work as an asynchronous path distinct from an active turn / Muestra trabajo diferido de conocimiento como un recorrido asíncrono distinto de un turno activo | `schedule: tasking,events — Schedule / Programar`; `gather-context: events,knowledge-worker,capabilities — Gather context / Reunir contexto`; `enrich: runtime,inference,knowledge-worker — Enrich / Enriquecer`; `persist: knowledge-worker,data,memory — Persist / Persistir` |

For the three flows described above by reference to a common path, materialize these exact arrays in JSON:

- `memory-grounded.steps`: `person, web-pwa, gateway, identity, gateway, soul, planner, memory, planner, runtime, inference, runtime, planner, soul, gateway, web-pwa, person`; `edgeIds`: `person-web, web-gateway, gateway-identity, identity-gateway, gateway-soul, soul-planner, planner-memory, memory-planner, planner-runtime, runtime-inference, inference-runtime, runtime-planner, planner-soul, soul-gateway, gateway-web, web-person`.
- `tool-assisted.steps`: `person, web-pwa, gateway, identity, gateway, soul, planner, runtime, capabilities, runtime, planner, soul, gateway, web-pwa, person`; `edgeIds`: `person-web, web-gateway, gateway-identity, identity-gateway, gateway-soul, soul-planner, planner-runtime, runtime-capabilities, capabilities-runtime, runtime-planner, planner-soul, soul-gateway, gateway-web, web-person`.
- `approved-action.steps`: `person, web-pwa, gateway, identity, gateway, soul, planner, runtime, capabilities, actions, capabilities, runtime, planner, soul, gateway, web-pwa, person`; `edgeIds`: `person-web, web-gateway, gateway-identity, identity-gateway, gateway-soul, soul-planner, planner-runtime, runtime-capabilities, capabilities-actions, actions-capabilities, capabilities-runtime, runtime-planner, planner-soul, soul-gateway, gateway-web, web-person`.

## Task 1: Establish and Enforce the Public Data Contract

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.node.json`
- Modify: `.gitignore`
- Create: `scripts/prepare-public-architecture.ts`
- Create: `src/features/architecture/architecture.types.ts`
- Create: `src/features/architecture/architecture.schema.ts`
- Test: `src/features/architecture/architecture.schema.test.ts`
- Create: `src/content/architecture/architecture.public.json`
- Create: `src/content/architecture/index.ts`

- [ ] **Step 1: Install only the graph and validation dependencies**

Run:

```powershell
pnpm add @xyflow/react
pnpm add -D zod tsx @types/node
```

Expected: dependency installation exits 0, `package.json` and `pnpm-lock.yaml` change, and no unrelated package is added.

- [ ] **Step 2: Define the types and write failing schema tests**

Create `src/features/architecture/architecture.types.ts` with these exact public shapes:

```ts
import type { Language } from '../i18n/language';

export const architectureCategories = [
  'experience', 'access', 'orchestration', 'context', 'intelligence',
  'capability', 'knowledge', 'platform', 'assurance',
] as const;
export const architectureEvidence = [
  'verified', 'implemented-in-code', 'conditional', 'next',
] as const;
export const architectureEdgeTypes = [
  'sync', 'stream', 'async', 'data', 'trust', 'telemetry',
] as const;

export type LocalizedText = Record<Language, string>;
export type ArchitectureCategory = (typeof architectureCategories)[number];
export type ArchitectureEvidence = (typeof architectureEvidence)[number];
export type ArchitectureEdgeType = (typeof architectureEdgeTypes)[number];

export type PublicArchitectureNode = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  capability: LocalizedText;
  category: ArchitectureCategory;
  evidence: ArchitectureEvidence;
  position: { x: number; y: number };
};

export type PublicArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  label: LocalizedText;
  type: ArchitectureEdgeType;
};

export type PublicArchitectureStage = {
  id: string;
  label: LocalizedText;
  nodeIds: string[];
};

export type PublicArchitectureFlow = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  outcome: LocalizedText;
  evidence: ArchitectureEvidence;
  steps: string[];
  edgeIds: string[];
  stages: PublicArchitectureStage[];
  primary?: boolean;
};

export type PublicArchitectureDataset = {
  version: 1;
  nodes: PublicArchitectureNode[];
  edges: PublicArchitectureEdge[];
  flows: PublicArchitectureFlow[];
};
```

Create tests with small local fixtures and these exact cases:

```ts
describe('validatePublicArchitecture', () => {
  it('accepts a complete bilingual graph');
  it.each(['nodes', 'edges', 'flows'] as const)('rejects duplicate IDs in %s');
  it('rejects an edge whose source or target is missing');
  it('rejects an edge ID that does not join its two consecutive flow steps');
  it('accepts a flow that revisits a node when edgeIds disambiguate the route');
  it('requires edgeIds.length to equal steps.length - 1');
  it('requires three to five stages and keeps stage nodes inside the flow');
  it('requires non-empty English and Spanish text in every localized field');
  it('rejects unknown categories, evidence states, edge types, and extra fields');
  it('requires exactly one primary flow');
  it.each([
    ['host', 'private-machine'], ['port', 1234], ['clientId', 'private-client'],
    ['secretPath', '/private/secret'], ['model', 'exact-model'],
  ])('rejects forbidden field %s before schema stripping');
  it.each([
    'http://private.example', '127.0.0.1:9999', 'C:\\private\\file',
    '/srv/private/file', 'Bearer private-token', '48 GB VRAM', 'RTX device',
  ])('rejects obvious sensitive value %s');
});
```

Run:

```powershell
pnpm test:run -- src/features/architecture/architecture.schema.test.ts
```

Expected: FAIL because the validator does not exist.

- [ ] **Step 3: Implement strict structural and sensitivity validation**

Create `architecture.schema.ts` with strict Zod objects and an exported function:

```ts
export function validatePublicArchitecture(
  input: unknown,
): PublicArchitectureDataset;
```

Before Zod parsing, recursively scan every key and string/number value. Reject keys matching these case-insensitive concepts: host/hostname, port, container, tunnel, realm, client ID, header, secret, token, key, credential, path, URL, model, hardware, VRAM, topic, table, schema, prompt, threshold, retry, deployment, environment, vulnerability, or ticket. Reject values matching a URL, IPv4 address, `localhost`, `host:port`, Windows/Unix filesystem path, bearer/secret/key marker, common cloud-key marker, exact-hardware/VRAM marker, or exact model/quantization marker.

Then enforce:

1. `.strict()` on every object;
2. non-empty `en` and `es` strings;
3. stable kebab-case IDs;
4. unique node, edge, flow, and per-flow stage IDs;
5. valid edge endpoints;
6. two or more steps per flow;
7. exactly `steps.length - 1` edge IDs;
8. each edge ID exists and joins the corresponding ordered node pair;
9. three to five stages, with non-empty `nodeIds` all present in that flow;
10. exactly one `primary` flow.

Every thrown issue must include a JSON-style path or offending ID without echoing a rejected secret-like value. Run the targeted test again; expect all cases PASS.

- [ ] **Step 4: Create and validate the curated dataset**

Write `src/content/architecture/architecture.public.json` from the canonical node, edge, and flow records above. Keep `version`, `nodes`, `edges`, and `flows` as the only top-level keys. Do not add source references, deployment details, repository paths, or operational claims.

Create `src/content/architecture/index.ts`:

```ts
import rawArchitecture from './architecture.public.json';
import type { PublicArchitectureDataset } from '../../features/architecture/architecture.types';

export const publicArchitecture = rawArchitecture as PublicArchitectureDataset;
```

Add a test that imports this real dataset, validates it, expects 18 nodes and 8 flows, expects `real-time-chat` to be the only primary flow, expects telemetry to target only `observability`, and expects no current node/flow to claim `next`.

- [ ] **Step 5: Publish the exact validated JSON during development and build**

Create `scripts/prepare-public-architecture.ts` to read the canonical source, call `validatePublicArchitecture`, create `public/`, and write `public/architecture.public.json` with two-space indentation plus one trailing newline. It must print only a safe count summary such as `architecture: 18 nodes, 43 edges, 8 flows`; never print the full JSON after a validation error.

Add scripts:

```json
{
  "scripts": {
    "architecture:prepare": "tsx scripts/prepare-public-architecture.ts",
    "predev": "pnpm architecture:prepare",
    "prebuild": "pnpm architecture:prepare",
    "validate:architecture": "tsx scripts/prepare-public-architecture.ts"
  }
}
```

Preserve all existing scripts and extend `check` to run `pnpm validate:architecture` before tests. Add `/public/architecture.public.json` to `.gitignore`. Add `scripts/**/*.ts` and Node types to `tsconfig.node.json` without weakening strictness.

Run:

```powershell
pnpm validate:architecture
pnpm typecheck
```

Expected: both PASS, the generated file exists, and its parsed content is deeply equal to the canonical JSON.

## Task 2: Derive a Stable, Highlightable React Flow Model

**Files:**

- Create: `src/features/architecture/architectureCopy.ts`
- Create: `src/features/architecture/architectureGraph.ts`
- Test: `src/features/architecture/architectureGraph.test.ts`

- [ ] **Step 1: Add failing tests for route derivation and display states**

Use the real canonical dataset and assert:

```ts
describe('createArchitectureGraph', () => {
  it('localizes node and edge text without changing stable IDs');
  it('marks every ordered node and explicit edge in the selected flow as active');
  it('correctly highlights repeated gateway, planner, and runtime nodes');
  it('dims every unrelated visible node and edge when a flow is selected');
  it('leaves the complete graph undimmed when selection is null');
  it('hides telemetry edges and the observability node by default');
  it('shows the observability layer only when requested');
  it('shows conceptual exchange labels only when contracts are enabled');
  it('animates only stream edges when reduced motion is false');
  it('never animates an edge when reduced motion is true');
});
```

Run the file and expect FAIL because the graph projector does not exist.

- [ ] **Step 2: Implement bilingual copy and pure graph derivation**

`architectureCopy.ts` owns all non-dataset labels, including:

- page title, summary, public-edition disclaimer, component/flow counts;
- “How Juana thinks and acts / Cómo piensa y actúa Juana”;
- empty-selection guidance;
- evidence and category labels;
- edge-semantics descriptions;
- Clear, Fit, Contracts, Observability, Copy JSON, Download JSON;
- copy success/failure live-region messages;
- localized React Flow ARIA control and node/edge descriptions;
- roadmap strip for external channels, ambient autonomy, and knowledge graph, each labelled `next`.

`architectureGraph.ts` exports:

```ts
export type GraphOptions = {
  language: 'en' | 'es';
  selectedFlowId: string | null;
  showTelemetry: boolean;
  showContracts: boolean;
  reducedMotion: boolean;
};

export type ArchitectureNodeData = {
  label: string;
  description: string;
  capability: string;
  category: ArchitectureCategory;
  evidence: ArchitectureEvidence;
  visualState: 'resting' | 'active' | 'dimmed';
};

export type ArchitectureEdgeData = {
  label: string;
  semantic: ArchitectureEdgeType;
  visualState: 'resting' | 'active' | 'dimmed';
};

export function getSelectedRoute(
  dataset: PublicArchitectureDataset,
  flowId: string | null,
): { nodeIds: Set<string>; edgeIds: Set<string> };

export function createArchitectureGraph(
  dataset: PublicArchitectureDataset,
  options: GraphOptions,
): { nodes: Node<ArchitectureNodeData, 'architecture'>[]; edges: Edge<ArchitectureEdgeData>[] };
```

Implementation rules:

- Selection comes only from the flow’s explicit `steps` and `edgeIds`; never infer a path from graph connectivity.
- Use sets for display membership so repeated nodes remain active while repeated traversal order stays available to `FlowPanel`.
- When telemetry is off, remove telemetry edges and the `observability` node before visual-state derivation.
- Add deterministic class names: `architecture-node--active|dimmed|resting`, `architecture-edge--<type>`, and `architecture-edge--active|dimmed|resting`.
- Give every edge `markerEnd: { type: MarkerType.ArrowClosed }` so direction is visible independently of animation; trust edges use the same direction marker plus their gold semantic style.
- Only `stream` edges receive `animated: true`, and only when reduced motion is false.
- Keep the graph immutable/read-only; do not create change handlers that persist positions.
- Add localized `ariaLabel`/`domAttributes` to every node and edge. Labels describe component/connection, evidence, and selected state without implementation details.

Run:

```powershell
pnpm test:run -- src/features/architecture/architectureGraph.test.ts
pnpm typecheck
```

Expected: all graph tests and type checking PASS.

## Task 3: Build the Desktop Explorer and Narrative Flow Rail

**Files:**

- Create: `src/pages/ArchitecturePage.tsx`
- Create: `src/features/architecture/ArchitectureExplorer.tsx`
- Create: `src/features/architecture/ArchitectureCanvas.tsx`
- Create: `src/features/architecture/ArchitectureNode.tsx`
- Create: `src/features/architecture/NodeTooltip.tsx`
- Create: `src/features/architecture/ArchitectureToolbar.tsx`
- Create: `src/features/architecture/ArchitectureLegend.tsx`
- Create: `src/features/architecture/FlowPanel.tsx`
- Create: `src/features/architecture/useReducedMotion.ts`
- Create: `src/features/architecture/architecture.css`
- Test: `src/features/architecture/ArchitectureExplorer.test.tsx`
- Test: `src/features/architecture/ArchitectureNode.test.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/routes.test.tsx`

- [ ] **Step 1: Write failing interaction, semantics, and route tests**

Mock only `ArchitectureCanvas` in interaction tests so state and panel behavior remain real and deterministic. The mock must expose received node/edge IDs and `visualState` as DOM data attributes. Add these cases:

```ts
it('renders the real architecture page at /architecture?lang=en');
it('renders Spanish page, controls, statuses, and flow narrative at ?lang=es');
it('starts with the complete graph and primary flow visually identified but not selected');
it('selecting a flow highlights all of its ordered nodes and edges and dims the rest');
it('Clear restores the complete undimmed graph and empty-selection guidance');
it('toggles conceptual exchange labels without changing graph membership');
it('toggles the transverse observability layer without changing a selected flow');
it('copies the validated JSON and announces success in a polite live region');
it('announces a localized failure when clipboard access is rejected');
it('exposes a download link to /architecture.public.json');
it('shows an evidence badge, outcome, and three-to-five numbered stages for a selected flow');
it('has no automatically detectable accessibility violations with the canvas mocked');
```

For `ArchitectureNode.test.tsx`, render the custom node with typed props and assert the localized label, evidence stamp, capability, tooltip `role="tooltip"`, and `aria-describedby` relationship are present. Assert the tooltip is not removed from the accessibility tree when visual opacity changes.

Update the route test that previously expected the architecture bridge. It must await the lazy route and assert the real heading. Keep the blog bridge assertion unchanged.

Run the targeted tests; expect FAIL.

- [ ] **Step 2: Implement the page composition and stable state boundary**

`ArchitecturePage` renders one `<section className="architecture-page">`, the localized masthead, a disclosure note (“Conceptual public view; implementation and deployment details are intentionally omitted”), `ArchitectureExplorer`, and the separate roadmap strip.

`ArchitectureExplorer` owns exactly four state values:

```ts
const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
const [showTelemetry, setShowTelemetry] = useState(false);
const [showContracts, setShowContracts] = useState(false);
const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
```

It derives the graph with `useMemo`, passes one `onFitRequest` registration from the canvas to the toolbar, and serializes exactly `publicArchitecture` for clipboard copy. Do not put node/edge arrays in state. A flow click toggles that flow; choosing the already selected flow clears it.

- [ ] **Step 3: Implement a read-only React Flow canvas and custom node tooltip**

Import `@xyflow/react/dist/style.css` only from the lazy architecture feature. Register `nodeTypes` at module scope. Configure React Flow with:

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  fitView
  fitViewOptions={{ padding: 0.16, minZoom: 0.42, maxZoom: 1.1 }}
  minZoom={0.3}
  maxZoom={1.5}
  nodesDraggable={false}
  nodesConnectable={false}
  elementsSelectable
  deleteKeyCode={null}
  panOnDrag
  zoomOnScroll
  zoomOnPinch
  nodesFocusable
  edgesFocusable
  autoPanOnNodeFocus
  ariaLabelConfig={localizedAriaLabels}
  proOptions={{ hideAttribution: false }}
>
  <Background variant={BackgroundVariant.Dots} gap={28} size={1} />
  <Controls showInteractive={false} />
</ReactFlow>
```

Do not render handles, connection lines, a minimap, or edit controls. The canvas container needs a localized `aria-label` and a visible keyboard-help sentence immediately before it.

`ArchitectureNode` renders an `<article>` with a mono category index, Syne label, evidence stamp, and one-line capability. `NodeTooltip` renders description plus capability with `role="tooltip"` and a stable ID. Show it on node hover, `.react-flow__node:focus-within`, and selected/active state; keep its text in the DOM for screen readers. The node wrapper’s localized `aria-label` contains the same essential description so hover is never the only discovery mechanism.

- [ ] **Step 4: Implement the toolbar, legend, and narrative rail**

Toolbar order is: Clear, Fit, Contracts, Observability, Copy JSON, Download JSON. Requirements:

- Clear is disabled when no flow is selected.
- Fit calls React Flow’s `fitView`; use zero duration under reduced motion and 320 ms otherwise.
- Contracts toggles safe conceptual edge labels only; it does not reveal payloads or APIs.
- Observability toggles the transverse node and telemetry edges.
- Copy uses `navigator.clipboard.writeText(JSON.stringify(publicArchitecture, null, 2))` and updates a persistent `aria-live="polite"` region.
- Download is an ordinary `<a href="/architecture.public.json" download>` so it still works without clipboard permission.

`FlowPanel` desktop markup is an `<aside>` with an ordered list of eight buttons. Each button shows the two-digit sequence, title, one-line outcome, and evidence badge. The selected detail shows summary, outcome, and an ordered list of three to five stages; each stage shows the names of its involved components. No step exposes internal implementation data.

`ArchitectureLegend` has three labelled groups: component families, connection semantics, and evidence states. It must explain that “implemented in code” is not a runtime claim and that “conditional” requires a decision.

- [ ] **Step 5: Apply the observatory visual system**

In `architecture.css`, implement:

- desktop `grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem)` with a 1px ruled divider;
- canvas height `clamp(36rem, 72vh, 52rem)` and no page-level horizontal overflow;
- dark teal radial wash plus fine coordinate grid, without a purple gradient;
- node plates with 2.5px radius, 1px ruled border, category stripe, mono evidence stamp, and no generic drop-shadow card treatment;
- active path at full opacity with teal/gold emphasis; unrelated nodes/edges at `opacity: .14`; resting graph at readable medium contrast;
- stream edge dash animation, dashed async, green data, dotted telemetry, gold trust;
- a sticky desktop flow rail whose own list scrolls without trapping the page;
- visible gold `:focus-visible` treatment for toolbar, flow rows, React Flow nodes/edges, select, and links;
- tooltip width capped at `18rem`, positioned so it does not cover the node label, and allowed to wrap;
- a narrow editorial roadmap rule visually outside the graph frame.

Do not change the global Kathesama tokens or redesign existing landing sections.

- [ ] **Step 6: Lazy-load the route and verify the desktop feature**

In `src/app/routes.tsx`, use `React.lazy` and a localized suspense fallback so `@xyflow/react` is not in the initial landing chunk. Replace only the architecture `ComingSoonPage`; leave the blog placeholder unchanged.

Run:

```powershell
pnpm test:run -- src/features/architecture/ArchitectureExplorer.test.tsx src/features/architecture/ArchitectureNode.test.tsx src/app/routes.test.tsx
pnpm typecheck
pnpm lint
```

Expected: all tests and static checks PASS, and lint produces no warnings.

## Task 4: Add Responsive, Keyboard, Reduced-Motion, and Failure Behavior

**Files:**

- Create: `src/features/architecture/ArchitectureFallback.tsx`
- Create: `src/features/architecture/ArchitectureErrorBoundary.tsx`
- Modify: `src/features/architecture/ArchitectureCanvas.tsx`
- Modify: `src/features/architecture/FlowPanel.tsx`
- Modify: `src/features/architecture/useReducedMotion.ts`
- Modify: `src/features/architecture/architecture.css`
- Modify: `src/features/architecture/ArchitectureExplorer.test.tsx`

- [ ] **Step 1: Write failing tests for non-desktop and resilient states**

Add exact cases:

```ts
it('offers a labelled native flow select for the mobile composition');
it('keeps the selected outcome and numbered stages after mobile selection');
it('localizes React Flow keyboard and control labels');
it('disables animated stream edges when reduced motion is requested');
it('updates reduced-motion state when the media query changes');
it('renders categorized components and all flows when the canvas throws');
it('lets fallback flow controls update the same selected narrative');
it('keeps copy and download JSON available when the graph has failed');
```

Add a CSS source assertion for a breakpoint at or below 900px that changes the explorer to one column, displays the mobile select, hides only the desktop flow list, and gives the canvas a bounded mobile height. Expect the test file to FAIL before implementation.

- [ ] **Step 2: Implement reactive reduced-motion behavior**

`useReducedMotion` must:

1. read `window.matchMedia('(prefers-reduced-motion: reduce)')` lazily;
2. subscribe with `addEventListener('change', ...)` and clean up;
3. return `true` safely when a non-browser environment cannot evaluate motion;
4. feed graph derivation and fit-view duration;
5. never rely only on CSS to stop React Flow edge animation.

Use the existing test setup’s `matchMedia` pattern; do not install another hook library.

- [ ] **Step 3: Implement mobile selector and keyboard-safe graph interaction**

At `max-width: 900px`:

- switch the explorer to one column;
- set canvas height to `min(62vh, 34rem)` with a minimum of `26rem`;
- move the flow narrative below the graph;
- hide the desktop ordered flow buttons with CSS and show a labelled native `<select>` containing “All flows / Todos los flujos” plus the eight flow titles;
- keep the selected detail, outcome, badge, and stages visible below the select;
- let toolbar actions wrap into two rows without clipping;
- keep touch targets at least 44px high and tooltips inside the viewport.

React Flow nodes and edges remain focusable. Enter/Space selection and Escape clearing must work through React Flow callbacks, but delete and dragging remain disabled. Add a small localized keyboard guide outside the canvas and an `aria-live="polite"` sentence that announces the selected flow and number of active steps.

- [ ] **Step 4: Implement a real textual fallback**

`ArchitectureErrorBoundary` catches only rendering failures inside `ArchitectureCanvas` and calls `ArchitectureFallback` with the already validated dataset, language, selected flow, and selection handler. The fallback renders:

- components grouped under localized category headings;
- each component label, description, capability, and evidence;
- all flow buttons with the same selected state;
- the selected outcome and stages;
- a concise message that the interactive map is unavailable while the architecture remains readable.

Do not show an empty rectangle, stack trace, exception message, or implementation detail. Keep toolbar copy/download actions outside the boundary so they remain usable.

- [ ] **Step 5: Complete automated accessibility verification**

Run:

```powershell
pnpm test:run -- src/features/architecture
pnpm typecheck
pnpm lint
```

Expected: all architecture tests PASS, the axe assertion reports zero automatically detectable violations, and lint/type checking exit 0.

## Task 5: Add the Landing Preview and Complete Production Verification

**Files:**

- Create: `src/features/landing/ArchitecturePreview.tsx`
- Test: `src/features/landing/ArchitecturePreview.test.tsx`
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/pages/LandingPage.test.tsx`
- Modify: `src/styles/global.css`
- Modify: `README.md`
- Test: all project checks

- [ ] **Step 1: Write failing landing-preview tests**

Add these cases:

```ts
it('renders a bilingual architecture field note after the Juana overview');
it('links to /architecture with the active lang query intact');
it('uses only the primary flow subset and never renders the full React Flow canvas');
it('names the experience, orchestration, intelligence, and context layers');
it('marks the preview illustration aria-hidden and provides an equivalent text summary');
it('does not add @xyflow/react to the landing module dependency graph');
```

The last case should inspect `ArchitecturePreview.tsx?raw` and reject `@xyflow/react`; it is a bundle-boundary regression guard, not a production runtime assertion.

Run the targeted test and expect FAIL.

- [ ] **Step 2: Implement a lightweight editorial preview**

`ArchitecturePreview` imports only the canonical typed data, selects five conceptual stops from the primary flow (`person`, `gateway`, `soul`, `planner`, `inference`), and renders:

- eyebrow `SYSTEMS ATLAS · PUBLIC EDITION / ATLAS DE SISTEMAS · EDICIÓN PÚBLICA`;
- title and two-sentence localized explanation;
- a compact CSS/SVG line with five labelled stops and one decorative signal;
- equivalent visually hidden text describing the same ordered path;
- four mono layer labels: experience, orchestration, intelligence, context;
- CTA to `/architecture?lang=<active>`.

The SVG is `aria-hidden="true"`; labels needed for understanding also appear in the textual summary. The signal animation stops under reduced motion. Do not initialize React Flow, add graph controls, or duplicate the full flow panel.

- [ ] **Step 3: Place and style the preview without disturbing existing landing content**

Render `<ArchitecturePreview />` immediately after `<ProjectOverview />` and before `<BuilderSection />`. Preserve all existing landing copy and test counts by scoping preview semantics: do not use `<article>` or `<li>` for decorative stops because existing preservation tests count those elements.

Add `.architecture-preview` rules to `global.css`:

- border-top consistent with existing sections;
- max-width matching the current technical grid;
- asymmetric text/diagram grid at desktop and one column at 768px;
- teal/gold system-line treatment with a subtle signal animation;
- 2.5px radius and existing tokens only;
- no full-page height, no generic feature-card grid, and no horizontal overflow.

- [ ] **Step 4: Document the artifact and release checks**

Add to `README.md`:

```md
## Public architecture

The curated public graph lives in `src/content/architecture/architecture.public.json`.
Run `pnpm validate:architecture` after every edit. Development and production
builds publish the validated agent-readable copy at `/architecture.public.json`.

The public file is intentionally conceptual. Never add deployment coordinates,
credentials, exact infrastructure identifiers, private source paths, or security findings.
```

- [ ] **Step 5: Run complete automated verification**

Run:

```powershell
pnpm check
```

Expected:

- lint and type checking exit 0 with no warnings;
- all existing migration tests plus architecture and preview tests PASS;
- the architecture preparation script reports 18 nodes, the exact edge count from the canonical table, and 8 flows;
- the production build exits 0;
- `dist/architecture.public.json` exists and is byte-equivalent after JSON parsing to the canonical source;
- the initial landing chunk does not contain React Flow code, while an architecture route chunk does.

- [ ] **Step 6: Run the production preview and manual acceptance matrix**

Run:

```powershell
pnpm preview --host 127.0.0.1
```

Verify both `?lang=en` and `?lang=es` at desktop, 900px, 768px, 390px, and 320px:

1. Landing content remains recognizable and the preview appears in the approved position.
2. `/architecture` opens with the complete graph and no false runtime/production claim.
3. Each of the eight flows highlights its complete explicit route, including repeated nodes.
4. Unrelated elements dim; Clear restores the complete graph.
5. Fit, Contracts, Observability, Copy JSON, and Download JSON behave as labelled.
6. The right rail becomes a native selector and below-graph narrative on narrow screens.
7. Every node exposes its tooltip by pointer and by keyboard focus/selection.
8. The entire explorer is usable with Tab, Enter/Space, Escape, and zoom controls.
9. Reduced motion makes the stream edges and landing signal static.
10. Forcing the canvas boundary to throw produces the readable grouped fallback.
11. The JSON endpoint downloads exactly `version`, `nodes`, `edges`, and `flows`.
12. Browser console shows no errors and the page has no horizontal overflow.

- [ ] **Step 7: Perform the mandatory human disclosure review**

Inspect both source and built artifact:

```powershell
pnpm validate:architecture
rg -n -i "localhost|127\.0\.0\.1|https?://|bearer|secret|token|client.?id|realm|container|tunnel|vram|rtx|cuda|qwen|awq|gguf|nvfp|ticket|retry|threshold" src/content/architecture/architecture.public.json dist/architecture.public.json
```

Expected: no matches. Then read every label, description, capability, outcome, stage, and edge exchange manually. Confirm that each current claim is `verified`, `implemented-in-code`, or `conditional` according to evidence; that roadmap content is separate and marked `next`; and that no exact operational identifier, sensitive topology, security weakness, or private source detail is inferable.

## Completion Criteria

- `/architecture?lang=en|es` is a real lazy-loaded explorer, not a placeholder.
- The public graph contains exactly the curated 18 conceptual nodes and eight narrative flows.
- Selecting a flow highlights every explicit step/edge and dims unrelated elements.
- Tooltips, edge semantics, evidence states, flow outcomes, and 3–5 stages are bilingual.
- Observability is a transverse opt-in layer rather than default edge spaghetti.
- Desktop right rail and mobile selector/narrative layouts are both usable.
- Keyboard access, visible focus, localized ARIA text, reduced motion, and readable fallback are verified.
- The landing preview adds portfolio value without pulling React Flow into the landing bundle.
- `/architecture.public.json` is validated, downloadable, copyable, and safe for AI-agent consumption.
- Automated validation and a human disclosure review pass without exposing critical information.
- `pnpm check` and the production build pass, with no commits or pull requests created.

## Implementation References

- React Flow custom nodes: <https://reactflow.dev/learn/customization/custom-nodes>
- React Flow accessibility and localized `ariaLabelConfig`: <https://reactflow.dev/learn/advanced-use/accessibility>
- React Flow controls: <https://reactflow.dev/api-reference/components/controls>
- React Flow TypeScript types: <https://reactflow.dev/learn/advanced-use/typescript>

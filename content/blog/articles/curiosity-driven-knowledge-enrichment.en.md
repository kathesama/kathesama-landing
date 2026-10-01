---
id: "juana-build-04"
slug: "curiosity-driven-knowledge-enrichment"
language: "en"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/when-your-ai-has-photographic-memory-but-no-understanding-designing-curiosity-driven-knowledge-c6e711c0ff8a"
sourcePostId: "c6e711c0ff8a"
publishedAt: "2026-05-10T05:08:08Z"
translation: "original"
---

*How I designed a system that transforms a passive RAG store into a self-aware, autonomously learning knowledge engine, without fine-tuning the model.*

If you had 1,000 books loaded into your AI assistant’s knowledge base: technical manuals, history books, finance texts, cookbooks, science papers, tens of thousands of chunks, embedded, indexed, stored in a vector database and ready to be retrieved. Would your assistant actually know what it knows?

That question stopped me cold mid-conversation. I had built a system with photographic memory: precise recall of everything it had seen, but zero awareness of what it knew. If I never asked about fermentation, Juana would never know she had three books on it. The knowledge was there. The understanding wasn’t.

This is the story of how I designed **Curiosity-Driven Knowledge Enrichment (CDKE)**: an architecture that gives an AI assistant not just knowledge, but awareness of its own knowledge, the ability to detect what it’s missing, and a controlled autonomous process to fill those gaps.

## The Problem That Gets Solved Wrong

The majority of the RAG literature covers chunking strategies, embedding models, reranking, and hybrid search. These are real problems worth solving.

But there’s a deeper problem that emerges once your knowledge base grows beyond a few hundred documents: **the system becomes blind to itself.**

A RAG store with 1,000 books is not a knowledge base. It’s a search index. The difference is subtle but critical:

-   A **search index** finds things when you ask for them
-   A **knowledge base** has awareness of what it contains and can reason about coverage, gaps, and depth

When Juana retrieves chunks about sourdough bread because I asked about fermentation, she’s not *knowing* about fermentation. She’s *finding* text that matches my query. The moment I stop asking, that knowledge goes dormant again.

This is photographic memory without comprehension. The brain of someone who memorized an encyclopedia but never understood what they read.

The question I asked myself: *what would it take for Juana to actually know what she knows?*

## Three Observations That Shaped the Design

### 1\. Expertise is synthesis, not retrieval

What distinguishes an expert chef from a cookbook isn’t just memory. It’s the ability to reason about why techniques work, improvise when ingredients change, and transfer knowledge across contexts. That understanding emerges from synthesis: connecting disparate pieces of information into coherent comprehension.

Chunks are not synthesis. A thousand chunks about fermentation don’t make Juana an expert on fermentation. They make her a good search engine for fermentation queries.

### 2\. Gaps are detectable from usage signals

Every time Juana answers a question with poor RAG coverage, few chunks retrieved, low reranker confidence, she’s generating a signal that most systems simply discard: *this topic exists in the world, and I don’t know enough about it.*

That signal is already there. It was being thrown away.

### 3\. Curiosity without direction is noise

I didn’t want Juana to investigate anything and everything autonomously. I wanted her to investigate what’s relevant and avoid what isn’t. Politics, celebrity culture, topics that don’t belong in her scope. The curiosity needed a filter.

That filter had to come from me, as her creator. Not as a static config file but as a living profile that I can adjust as my interests evolve.

## The Architecture: Three Components

CDKE is built on three interdependent components. Each solves one of the problems above.

![Figure: CDKE Architecture — Knowledge Map feeds domain awareness into the Curiosity Loop; the Interest Vector governs what the loop is allowed to investigate; both connect to the underlying RAG pipeline via ingestion, gap detection, and Planner integration.](/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png)

### Component 1: The Knowledge Map

The Knowledge Map gives Juana a structured, queryable representation of what her knowledge base actually contains, at domain level rather than chunk level.

It’s built during ingestion. After parsing and normalizing a document, the knowledge-worker calls the LLM with a schema-constrained prompt that asks for exactly four things:

```
{
  "domain": "gastronomy / culinary techniques",
  "subdomain": "fermentation / preservation",
  "key_concepts": ["lactic fermentation", "kefir", "kimchi", "microbiota"],
  "complexity": "intermediate"
}
```

This characterization is stored alongside the document. A separate table, knowledge\_domain\_index, aggregates this across all documents, giving a domain-level view:

```
CREATE TABLE knowledge_domain_index (
    owner_type        TEXT NOT NULL,  -- GLOBAL or USER
    owner_id          UUID,           -- null for GLOBAL
    domain            TEXT NOT NULL,
    subdomain         TEXT,
    document_count    INTEGER,
    chunk_count       INTEGER,
    coverage_score    FLOAT,          -- 0.0–1.0, concept diversity
    interest_weight   FLOAT,          -- from Interest Vector (USER rows only)
    has_synthesis     BOOLEAN,
    last_synthesis_at TIMESTAMPTZ
);
```

One design decision worth highlighting: **characterization is enrichment, not a gate.** If the LLM call fails, ingestion continues. The document gets indexed without characterization metadata, flagged for async retry. A failure to characterize never blocks a document from being available for retrieval.

With the Knowledge Map in place, Juana can finally answer: *“what do I know about fermentation?”* Not by searching chunks, but by querying a structured index.

### Component 2: The Curiosity Loop

The Curiosity Loop is where autonomous learning happens. It has two sub-processes.

**Gap Detection (event-driven, post-turn)**

After every turn where knowledge retrieval was invoked, the system evaluates two signals:

-   Was the chunk count below threshold? (sparse coverage)
-   Was the reranker top score below threshold? (low confidence)

If either condition is met, a knowledge.gap.detected event is published to the message bus:

```
{
  "event_id": "uuid",
  "user_id": "...",
  "topic": "wild yeast bread fermentation",
  "domain_hint": "gastronomy / fermentation",
  "gap_score": 0.82,
  "source_query_hash": "sha256:...",
  "occurred_at": "..."
}
```

Note the source\_query\_hash: only a SHA256 of the original query is persisted, never the raw query. Privacy matters even in internal event pipelines.

The knowledge-worker consumes this event and writes to knowledge\_gaps. If the domain is EXCLUDED in the user's Interest Vector, the gap is immediately marked as such and never investigated. If it's PENDING, it waits for the nightly loop.

**Domain Synthesis (scheduled, idle-time)**

A scheduled autonomous trigger runs nightly. It does two things.

*Step 1: Gap resolution via web search.* This is where the loop becomes genuinely active. For each PENDING gap that passes the Interest Vector filter, the knowledge-worker doesn’t wait for a human to provide a document. It goes out and finds one.

It does this through web\_search and web\_fetch tools integrated into the system. The flow is straightforward:

```
PENDING gap: "wild yeast bread fermentation"
  → web_search("wild yeast bread fermentation techniques")
  → evaluate results against trusted source whitelist
  → web_fetch(top relevant URLs)
  → extract and clean content
  → run through standard ingestion pipeline
      (characterize → chunk → embed → persist)
  → gap transitions to COMPLETED
```

The trusted source whitelist is a critical guardrail. Not every search result is acceptable. The system only fetches from pre-approved domains: academic sources, reputable publications, official documentation. Content from outside the whitelist is rejected before it ever touches the ingestion pipeline.

What this means in practice: after detecting a gap Tuesday night during a conversation, by Wednesday morning Juana may have already researched the topic, ingested relevant content, and updated her knowledge base, with no instruction from the user. The next time the topic comes up, her retrieval coverage is measurably better.

Failed gaps are not retried indefinitely. After 3 attempts they surface in observability so you can decide whether to manually provide a source.

*Step 2: Domain synthesis.* For domains with sufficient coverage that haven’t been synthesized recently, the loop generates synthesis documents:

```
Retrieve top-K representative chunks (diverse, high authority)
  → LLM generates integrative synthesis document
  → Ingested with source_type = 'SYNTHESIS', authority_score = 0.7
  → knowledge_domain_index updated: has_synthesis = true
```

The authority\_score = 0.7 is a deliberate choice. Juana should prefer primary sources over her own synthesis. If the original book says something, that takes precedence over what Juana derived from it. The reranker uses this score to weight results accordingly.

**This is the step that converts photographic memory into comprehension.** A synthesis document about fermentation doesn’t just retrieve chunks. It integrates the lactic fermentation process, the role of microbiota, the conditions that make kimchi different from kefir, into a coherent understanding that informs every future retrieval on that topic.

### Component 3: The Interest Vector

The Interest Vector is the filter that makes curiosity safe and purposeful.

It’s a user-owned, database-backed domain preference profile:

```
CREATE TABLE interest_vector (
    user_id   TEXT NOT NULL,
    domain    TEXT NOT NULL,
    subdomain TEXT,
    weight    FLOAT,   -- 0.0 to 1.0
    status    TEXT,    -- PREFERRED | ALLOWED | EXCLUDED
    reason    TEXT     -- human-readable, shown in Settings UI
);
```

The weight semantics are intentionally simple:

Weight Status What Juana does 0.9–1.0 PREFERRED Proactively synthesizes; gaps prioritized 0.4–0.89 ALLOWED Investigates when gap\_score is high enough 0.0 EXCLUDED Never investigates or synthesizes

On first activation, all domains default to ALLOWED with weight 0.5. An onboarding questionnaire personalizes it, covering professional interests, personal interests, explicit exclusions, and depth preference. After that, it’s editable from the Settings UI at any time.

Hard exclusions exist at the system level and are not user-overridable: injection-classified content, domains prohibited by the soul prompt, sources outside the trusted web whitelist. These never enter the Curiosity Loop regardless of what the Interest Vector says.

## How It All Connects

The full data flow, from ingestion to intelligent retrieval:

```
Document ingested
  → knowledge-worker characterizes → knowledge_domain_index updated

User asks about fermentation
  → RAG retrieval: 2 chunks, reranker score 0.41 (below threshold)
  → system publishes knowledge.gap.detected
  → domain not EXCLUDED → PENDING in knowledge_gaps

Nightly loop runs
  → Gap resolved: web_search + ingestion → knowledge_gaps COMPLETED
  → Domain synthesis: has_synthesis=false, coverage_score=0.71
    → Synthesis document generated → ingested → index updated

Next time user asks about fermentation
  → Planner queries knowledge_domain_index
  → has_synthesis=true → bias toward synthesis document
  → Richer, integrated answer
```

## Relation to Existing Work

Before settling on this design I reviewed the literature on dynamic retrieval and knowledge-aware RAG. What follows is an honest comparison.

**FLARE** (Jiang et al., EMNLP 2023) \[1\] and **DRAGIN** (Su et al., ACL 2024) \[2\] both address the question of *when* to retrieve during generation. FLARE uses low-confidence token predictions as a retrieval trigger; DRAGIN refines that by incorporating self-attention signals across the full context. Both are reactive and in-context: they operate within a single generation pass and leave no persistent record of what was missing. Once the response is produced, the signal is discarded.

**SIM-RAG** (Yang et al., SIGIR 2025) \[3\] goes further by training an external critic model that judges whether the retrieved context is sufficient before accepting an answer. This is the closest work to gap awareness I found in the literature. The key difference from CDKE is scope: SIM-RAG operates within a single query’s retrieval loop; CDKE persists gaps across sessions and investigates them asynchronously between conversations.

**GraphRAG** (Edge et al., Microsoft Research, 2024) \[4\] addresses structural understanding by building a knowledge graph over the corpus, enabling global sensemaking queries that vector RAG cannot handle. This is orthogonal to CDKE: GraphRAG improves *how* the system retrieves from what it has; it does not detect what is missing or investigate it autonomously.

**Retrieval Augmented Curiosity (RAC)** (Goldman, 2025) \[5\] proposes a conceptual framework for combining RAG with structured curiosity to drive autonomous knowledge expansion. The direction is aligned with CDKE’s motivation. RAC, however, is a design proposal without a documented production implementation, and it does not address domain-level awareness or interest-vector governance.

To my knowledge, no publicly documented system integrates all three of the following as a coherent pipeline: domain-level self-awareness built at ingestion time, a persistent gap registry derived from real usage signals, and autonomous asynchronous investigation with domain synthesis. Each piece appears in isolation in the literature. The integration is, as far as I can determine, an open problem in production RAG systems.

What CDKE contributes specifically:

1.  **Domain-level self-awareness** constructed during ingestion, not derived retroactively from queries
2.  **Usage-grounded gap detection** where gaps emerge from real conversations and persist across sessions as a queryable registry
3.  **The Interest Vector** as a persistent, user-editable domain preference profile that governs what the system is allowed to investigate autonomously

The combination of these three components, implemented as a single integrated pipeline, is the architectural contribution this article documents.

## What This Doesn’t Do

I want to be precise about the boundaries.

CDKE does not fine-tune the model. The underlying LLM doesn’t change. All learning happens through the ingestion pipeline, the same infrastructure that handles user-submitted documents. The model’s weights are untouched.

CDKE doesn’t create genuine curiosity. Juana doesn’t have preferences. The Interest Vector represents my priorities projected onto her behavior. The gap detection responds to my usage patterns. The curiosity is derived, not intrinsic.

What CDKE does create is the functional equivalent of a knowledge worker who notices gaps, fills them during off-hours, and builds coherent understanding from fragmented information, all without human instruction after the initial setup.

## Implementation Roadmap

I’ve split the implementation across two phases.

**Phase A — Foundation:**

-   Domain characterization step in the ingestion pipeline
-   Schema extension for domain metadata
-   knowledge\_domain\_index table and refresh consumer
-   interest\_vector table, onboarding questionnaire, and Settings UI
-   Gap detection event pipeline

**Phase B — Curiosity Loop:**

-   Nightly autonomous trigger
-   Gap investigation via web search and ingestion
-   Domain synthesis document generation
-   Planner integration with retrieval hints
-   Interest Vector editing in Settings UI

The reason for the split: Phase A builds the observability infrastructure. Without the Knowledge Map and gap registry, you’re flying blind. Phase B activates the autonomous behavior on top of a foundation you can inspect and validate.

## A Note on Hardware

This entire system runs on a single node: NVIDIA RTX 5090, 128GB RAM, AMD Ryzen 9 5900XT, WSL2 + Docker. No cloud APIs, no external LLM calls, no Kubernetes.

The synthesis step is the most computationally intensive part. Large domains may require significant context windows across chunks. That’s why the nightly schedule exists: synthesis runs during idle hours, rate-limited to respect the VRAM budget, without competing with interactive requests.

Self-hosted AI at this scale isn’t a constraint. It’s a design principle. Every decision in this architecture prioritizes privacy, control, and long-term independence from external providers.

## Final Thoughts

One of the least addressed problems in RAG systems today is the gap between having information and having knowledge. Recent work like SIM-RAG \[3\] recognizes self-awareness of knowledge boundaries as a fundamental challenge; FLARE \[1\] and DRAGIN \[2\] address it at generation time. What remains open, as far as I can determine, is a system that addresses it at the knowledge base level: awareness of what domains are covered, what is missing, and an autonomous process to fill those gaps over time.

CDKE is my attempt to close that gap in a principled way: structured domain awareness built at ingestion, usage-grounded gap detection that persists across sessions, and controlled autonomous synthesis, all without touching the model, without adding new services, and without giving up control over what the system learns.

The architecture is formalized as an Architectural Decision Record in the JuanaIA project. Phase A implementation starts next.

Whether this pattern proves useful to others building self-hosted AI systems, I hope at minimum it reframes the question: don’t just ask *what* your AI can retrieve. Ask *whether it knows what it knows*.

## References

\[1\] Jiang, Z., Xu, F. F., Gao, L., Sun, Z., Liu, Q., Dwivedi-Yu, J., Yang, Y., Callan, J., & Neubig, G. (2023). Active Retrieval Augmented Generation. *Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing (EMNLP 2023)*, pages 7969–7992. Association for Computational Linguistics. [https://aclanthology.org/2023.emnlp-main.495/](https://aclanthology.org/2023.emnlp-main.495/)

\[2\] Su, W., Tang, Y., Ai, Q., Wu, Z., & Liu, Y. (2024). DRAGIN: Dynamic Retrieval Augmented Generation based on the Real-time Information Needs of Large Language Models. *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (ACL 2024)*, pages 12991–13013. [https://aclanthology.org/2024.acl-long.702/](https://aclanthology.org/2024.acl-long.702/)

\[3\] Yang, D., Zeng, L., Rao, J., & Zhang, Y. (2025). Knowing You Don’t Know: Learning When to Continue Search in Multi-round RAG through Self-Practicing. *Proceedings of the 48th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR 2025)*, Padua, Italy. [https://doi.org/10.1145/3726302.3730018](https://doi.org/10.1145/3726302.3730018)

\[4\] Edge, D., Trinh, H., Cheng, N., Bradley, J., Chao, A., Mody, A., Truitt, S., & Larson, J. (2024). From Local to Global: A Graph RAG Approach to Query-Focused Summarization. *arXiv preprint arXiv:2404.16130*. [https://arxiv.org/abs/2404.16130](https://arxiv.org/abs/2404.16130)

\[5\] Goldman, R. (2025, March). Retrieval Augmented Curiosity: An Autonomous Approach to Knowledge Expansion. *Medium*. [https://medium.com/@ryanbgoldberg/retrieval-augmented-curiosity-an-autonomous-approach-to-knowledge-expansion-2d3dc374e08f](https://medium.com/@ryanbgoldberg/retrieval-augmented-curiosity-an-autonomous-approach-to-knowledge-expansion-2d3dc374e08f)

*I’m Kathy, a Senior Software Engineer and AI Infrastructure Architect based in Buenos Aires, Argentina. I’m currently building JuanaIA, a fully self-hosted personal AI assistant running on local hardware with no external API dependencies. I write about AI architecture, system design, and the practical realities of building production-grade AI systems from scratch.*

*I’m open to Senior Software Engineer, AI Infrastructure Engineer, and Backend Architect roles, remote preferred. If you’re building something ambitious in the AI infrastructure space, I’d love to connect.*

*Medium: @kathesama | LinkedIn: Kathy*

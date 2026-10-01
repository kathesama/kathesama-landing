---
id: "juana-build-02"
slug: "juana-orchestration-layer"
language: "en"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/i-gave-my-local-ai-a-brain-how-i-designed-the-orchestration-layer-c5eb39f8c320"
sourcePostId: "c5eb39f8c320"
publishedAt: "2026-04-08T16:14:22Z"
translation: "original"
---

![Juana beside a glowing digital brain under the title I Gave My Local AI a Brain](/images/blog/juana-orchestration-layer/figure-01.png)

Before your AI can answer anything, it has to decide *how* to answer it. Here’s the architecture I built to make that work.

In my [first article](/blog/building-juana-self-hosted-ai), I introduced Juana IA, a personal AI platform that runs entirely on my own hardware, with no external APIs and no data leaving my local network. I ended that piece with a teaser: *“The next module is the main orchestrator, Soul.”*

This is that article, but before I get into the design, let me ask you something. When you send a message to an AI assistant, what do you think happens? Most people imagine something like: *message goes in → LLM thinks → answer comes out.* That’s roughly how a chatbot works, but it’s not how an AI *agent* works and it’s definitely not how Juana works, the reality is messier, more deliberate, and honestly more interesting.

## The problem: a message is not a query

When you tell Juana *“remind me what we discussed about my investment strategy last week, and then search for the latest news on Argentine bonds”*, that’s not one thing. It’s at least four:

1.  Retrieve personal memory from a past session
2.  Understand that “last week” is a temporal filter
3.  Execute a web search tool
4.  Synthesize two different information sources into one coherent response

A raw LLM call can’t do that reliably. It doesn’t know what tools exist, what data it has access to, or what to do when a tool fails halfway through. You need something in front of the LLM that *thinks before it acts*.

That’s the problem the orchestration layer solves.

## The canonical principle

Early in the design of Juana, I established a single sentence that governs the entire cognitive architecture:

***Planner decides. Soul executes. Memory remembers. Session recalls. LLM infers.***

Every service in the system has exactly one role. No service does what another service already does. When I’m tempted to add logic somewhere, this sentence tells me whether it belongs there.

It sounds simple. In practice it’s the most valuable architectural constraint I’ve made.

## The three actors: Soul, Planner, and Ruflo

![Diagram comparing the Soul executor, Planner strategist, and Ruflo runtime decision loop](/images/blog/juana-orchestration-layer/figure-02.png)

### Soul — the orchestrator

Soul is the entry point for every request after the gateway. It receives the enriched, authenticated message and is responsible for assembling the full context, coordinating all the other services, and ultimately producing a response.

Critically: **Soul does not decide what to do.** It executes what it’s told. It knows *how* to call a memory retrieval tool, *how* to call the LLM, *how* to write a turn to session history — but the decision of *whether* and *in what order* to do those things belongs elsewhere.

This distinction matters. When you mix orchestration and decision-making in the same service, you get a God service that’s impossible to test, audit, or evolve. Keeping Soul as a stateless execution host means I can change the decision logic without touching the execution infrastructure, and vice versa.

### Planner — the strategist

Before Soul executes anything, it calls the Planner.

The Planner receives the incoming message and session context, analyzes the user’s intent, and returns a structured execution plan. It decides:

-   What is the user actually asking for?
-   Which tools are needed to answer it?
-   Which skill (prompt template) should shape the response?
-   Is this a simple conversational reply, or a long-horizon task that needs to run asynchronously?

The Planner returns a PlannerResult — a structured object containing the plan steps, the resolved intent, and a flag indicating whether this is a short synchronous task or something that needs to run in the background.

**The Planner does not execute anything.** It plans. That’s it.

One detail I’m particularly proud of: before the Planner ever calls the LLM for intent analysis, it runs a deterministic pre-classification filter. Simple heuristics classify the query as CONVERSATIONAL, META, INJECTION, or OFF\_TOPIC. Only if the query is genuinely ambiguous does it fall through to the lightweight LLM (Qwen2.5 1.5B, running on GPU). This cuts roughly 30–40% of LLM intent calls entirely. Fast path for simple things; full reasoning only when needed.

### Ruflo — the runtime decision engine

This is the part that took me the longest to get right conceptually.

Once the Planner returns a plan, Soul doesn’t just execute the steps in sequence and hope for the best. That linear model breaks the moment anything goes wrong — a tool times out, a memory retrieval returns nothing useful, a step produces output that invalidates the rest of the plan.

Ruflo is the component that handles this. It’s an explicit decision loop that runs inside Soul, evaluating the execution state after every step and deciding what comes next:

```
while not done:
    decision = ruflo.decide(current_execution_state)

    CONTINUE          → move to next step
    CALL_TOOL         → Soul executes a tool call
    RETRY             → retry the current step (up to MAX_RETRIES)
    REPLAN            → ask Planner for a new plan with updated context
    GENERATE_RESPONSE → compose final context and call LLM
    WAITING_USER      → return a confirmation prompt (for action tools)
    FAIL              → terminate with a structured error
```

Every decision is logged with a request ID and step context. Every loop has hard limits: maximum 20 iterations, 3 retries per step, 2 replans per request. When any limit is exceeded, the result is always a clean, structured failure — never a silent hang or an infinite loop.

Ruflo makes the system resilient. More importantly, it makes it *auditable*. I can look at any request and see exactly what the system decided, in what order, and why.

## Before all of this: the caches

Two optimizations happen before any of the above machinery runs.

**Semantic response cache:** Soul first checks whether this question has already been answered recently, for this user. It embeds the query and runs a cosine similarity search against cached responses (threshold ≥ 0.92). If there’s a match, the response goes back to the user immediately — no Planner, no LLM, no tools. For repeated or similar questions this is a significant latency win.

**Session context:** Soul fetches the user’s recent conversation history from the session service before doing anything else. This context travels with the request through the entire pipeline, giving the Planner and eventually the LLM the conversational thread it needs to produce coherent, contextual responses.

## The complete request flow

![Juana IA architecture blueprint with platform, cognitive, persistence, and security layers](/images/blog/juana-orchestration-layer/figure-03.png)

Here’s what actually happens from the moment you send a message to Juana:

1.  **Gateway** authenticates the request, validates the JWT against Keycloak, injects trusted identity headers, and strips anything the client tried to send themselves.
2.  **Soul** fetches recent session context from the session service.
3.  **Semantic cache check** — if a similar query was answered recently, return it immediately.
4.  **Soul → Planner**: send the enriched message for intent analysis and plan generation.
5.  **Planner pre-filter**: deterministic classification. INJECTION → immediate fail. Simple queries → fast path. Ambiguous → Qwen2.5 1.5B intent analysis.
6.  **Planner** checks knowledge freshness, consults procedural memory (learned patterns from past successful executions), resolves the right skill, and returns a PlannerResult.
7.  **Ruflo loop begins** inside Soul. Steps execute one by one, with runtime decisions after each.
8.  Tool calls happen as needed — memory retrieval, web search, knowledge lookup.
9.  **LLM /generate** is called once, at the end, with the fully assembled context.
10.  Response goes back to the user.
11.  **Asynchronously**: Soul publishes a Kafka event. The memory service consumes it and runs the post-turn ingestion pipeline — extracting what matters from the conversation and storing it for future retrieval.

The LLM is the last thing that runs, not the first. Everything before it exists to give it exactly the right context.

## Why not just use a framework out of the box?

I use LangGraph for the implementation of both the Planner and Ruflo — it’s a good fit for explicit directed state graphs. But I want to be clear: LangGraph is an implementation detail, not an architectural decision.

The Planner’s graph lives in infrastructure/planning/langgraph\_planner.py. Ruflo's loop lives in infrastructure/execution/ruflo.py. Neither one is visible in domain models, application ports, or controllers. If LangGraph releases a breaking change tomorrow, I change two files. The architecture doesn't move.

This is the most important lesson I’ve learned about building on top of AI frameworks: treat them as infrastructure, not as architecture. The decision-making logic belongs to your domain. The framework is just the wire it runs on.

## What this unlocks

Designing the orchestration layer this way — Planner deciding, Soul executing, Ruflo adapting at runtime — means Juana can handle things that a simple LLM call can’t:

-   Queries that require multiple tools chained together
-   Graceful degradation when a tool fails
-   Dynamic replanning when execution reveals that the original plan was wrong
-   Long-horizon tasks that run in the background while the user continues the conversation
-   Deep research queries that decompose into sub-questions and synthesize the results

And because every decision is explicit and logged, I can actually understand what the system did on any given request. That matters when you’re running a production system on your own hardware with no support line to call.

## What’s next

The architecture in this article is what’s being built in Release 2 of Juana, currently in progress. The pieces exist; the integration work is ongoing.

In the next article in this series I’ll go deeper into the hardware side of things: how I’m fitting a full AI stack — generation model, embeddings, reranker, classifier — into 32GB of VRAM, and the decisions I made when the numbers didn’t add up.

If you’re building AI infrastructure and want to talk architecture, LLM orchestration, or production tradeoffs on local hardware — reach out.

I’m also open to remote opportunities as a Senior Software Engineer, AI Infrastructure Engineer, or Backend Architect.

*This is Part 2 of an ongoing series on building Juana IA v2 — a self-hosted personal AI platform.* [*Part 1: I’m Building a Personal AI That Lives on My PC — Here’s What I’ve Learned So Far*](/blog/building-juana-self-hosted-ai)

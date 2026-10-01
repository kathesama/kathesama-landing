---
id: "juana-build-01"
slug: "building-juana-self-hosted-ai"
language: "en"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/im-building-a-personal-ai-that-lives-on-my-pc-here-s-what-i-ve-learned-so-far-c5a60ad26791"
sourcePostId: "c5a60ad26791"
publishedAt: "2026-03-14T21:22:40Z"
translation: "original"
---

![Portrait of Juana against a blue digital interface background](/images/blog/building-juana-self-hosted-ai/figure-01.png)

*A self-hosted LLM platform with microservices, Zero Trust security, RAG pipelines, and local GPU inference — built from scratch.*

A few months ago I asked myself a question that kept me up at night:

Why do all the “AI assistants” we use depend on someone else’s servers,  
process our data in the cloud, and can disappear or get more expensive  
overnight?

That question became a project. I called it Juana IA v2. And I’m still  
building it.

## What is Juana?

Juana is a personal AI platform that runs entirely on my own machine.  
No external APIs. No data leaving to third-party servers. No cost per token.

It’s not a chatbot with a pretty layer on top of GPT-4. It’s a platform  
built from scratch with a microservices architecture, language models  
running locally on GPU, and a persistent memory system that remembers  
context across sessions.

The long-term vision is for Juana to understand my context, learn from  
my documents, help me manage finances, and generate creative content —   
all without leaving my local network. Inspired, if you will, by Jane  
from the Ender saga. An entity that knows its person deeply.

Ambitious? Yes. That’s exactly why I’m building it with rigor from day one.

![Juana seated at a workstation with code screens and an open notebook](/images/blog/building-juana-self-hosted-ai/figure-02.png)

## The Tech Stack (the accessible version)

I chose a hybrid architecture: Java for infrastructure, Python for intelligence.

*Java* handles everything that needs to be robust and secure: the entry  
gateway, authentication, service discovery, centralized configuration,  
and the message broker with Kafka. Spring Boot 3 and Spring Cloud.

*Python* handles the cognitive layer: the services that process language,  
generate embeddings, retrieve memory, and orchestrate reasoning. FastAPI  
as the framework.

*Models run locally* on an NVIDIA RTX 5090 with 32GB VRAM:  
- Mistral-7B-Instruct for text generation
- BAAI/bge-m3 for converting text into mathematical vectors (embeddings)
- bge-reranker-v2-m3 for reordering results by relevance

All three load lazily — the service starts fast and models initialize  
on the first request.

## What Taught Me the Most: Security

When I started connecting services to each other, I ran into a problem  
that’s critical in real production systems:

How does the memory service know that the incoming request actually  
comes from the authorized gateway and not from any client that happens  
to know the internal port?

The solution I implemented is called Zero Trust. The principle is simple:  
no service trusts any other by default, even if they’re on the same  
internal network.

In practice, the gateway:  
1. Validates the user JWT against Keycloak (our identity server)
2. Obtains its own service token to sign internal requests
3. Strips any identity headers coming from the external client
4. Injects a canonical X-User-Context header with the verified identity

Internal services cryptographically validate that the caller has permission.  
No valid token? 401. Period.

This is still being migrated across the Python services — and that’s  
part of the learning too. Real systems always have technical debt that  
needs to be closed with intention, not ignored.

## RAG: How Juana “Learns” From Documents

One of the capabilities I’m most excited about is PDF ingestion. You  
upload a document to Juana and it can answer questions about it.

The process behind it is called RAG — Retrieval Augmented Generation:

1. The PDF is parsed and split into fragments (chunks)
2. Each fragment is converted into a numerical vector using bge-m3
3. The vectors are stored in PostgreSQL with the pgvector extension
4. When you ask a question, it’s also converted into a vector
5. The mathematically most similar fragments are retrieved
6. Those fragments are included in the model’s context to generate the response

The result is that the model doesn’t guess — it responds based on the  
actual text of the document. And everything runs locally.

## What I’m Taking Away So Far

Building Juana is forcing me to integrate areas that normally live  
in separate roles: systems architecture, security, natural language  
processing, data infrastructure, and observability. In a real team  
that involves different people. Here I’m handling it end-to-end, with  
complete technical documentation — SDD, Architecture Decision Records,  
a Jira backlog with real traceability.

And it’s confirming something I suspected: the real complexity of AI  
systems isn’t in the models. It’s in the infrastructure surrounding them.  
The model is one piece. Security, memory, data pipelines, resilience —   
that’s what determines whether an AI system works in production or only  
in a demo.

## What’s Next

![Blue holographic portrait of Juana formed from circuit traces](/images/blog/building-juana-self-hosted-ai/figure-03.png)

The next modules are the main orchestrator (Soul), a financial trading  
module with paper money first, and creative content generation.

If you’re working on a team building AI infrastructure and want to talk  
about architecture, LLM security, or RAG pipelines — I’d love to connect.

I’m open to remote opportunities in Senior Software Engineer,  
AI Infrastructure Engineer, or Backend Architecture roles.

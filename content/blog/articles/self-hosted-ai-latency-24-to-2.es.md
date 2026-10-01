---
id: "juana-build-03"
slug: "self-hosted-ai-latency-24-to-2"
language: "es"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/from-24-seconds-to-2-how-i-optimized-response-times-in-a-self-hosted-ai-assistant-2085faacab7f"
sourcePostId: "2085faacab7f"
publishedAt: "2026-04-30T16:58:14Z"
translation: "local-reviewed"
---

*Esta es la Parte 3 de una serie en curso sobre la construcción de Juana IA, una plataforma de IA personal que corre por completo en mi propio hardware, sin APIs externas y sin datos que salgan de mi red local. El proyecto sigue en construcción activa.*

Hace unas semanas, Juana, el asistente de IA autoalojado que estoy construyendo, tardaba entre 15 y 24 segundos en responder un simple «hola». No era por falta de hardware. Tengo una NVIDIA RTX 5090 con 32 GB de VRAM. El problema estaba en otro lugar, y encontrarlo requirió trabajo sistemático.

Este artículo trata sobre esa investigación: las herramientas que preparé para diagnosticar el cuello de botella, las alternativas que descarté antes de encontrar la correcta y los dos cambios que redujeron el tiempo de respuesta a unos 2 segundos.

Antes de cambiar nada, necesitaba saber *dónde* se estaba yendo el tiempo. Juana tiene una arquitectura de microservicios: las solicitudes pasan por un gateway, un orquestador, Soul, un planificador, Planner, un servicio de sesión, un servicio de memoria, un pipeline de recuperación y, finalmente, el servicio del LLM. Cualquiera de esos saltos podía ser el problema.

Instrumenté todo el stack con trazabilidad distribuida usando OpenTelemetry y Tempo. Cada servicio emite spans con datos de tiempo y Tempo los correlaciona en una única traza por solicitud. Con eso pude ver, milisegundo a milisegundo, cómo era exactamente una solicitud de «hola».

El resultado fue inequívoco. El gateway, el orquestador, la recuperación de sesión y la clasificación de intención sumaban menos de 100 ms. La recuperación de memoria agregaba algo de costo, pero era estable. El pico estaba por completo en `llm-service`, específicamente en el tiempo entre enviar el prompt al motor de generación y recibir el primer token.

Eso me indicó que el cuello de botella era el motor de inferencia, no la capa de aplicación.

## Lo que ejecutaba antes: llama.cpp

El motor de generación original era llama.cpp, una biblioteca de inferencia en C++ que ejecuta modelos de lenguaje en CPU y GPU. Es una herramienta excelente para aquello para lo que fue diseñada: ejecutar modelos de forma portable en una amplia variedad de hardware, incluidas máquinas de consumo con memoria de GPU limitada.

La palabra clave es *portable*. llama.cpp está optimizado para la eficiencia de un único flujo y la portabilidad, no para servir a múltiples usuarios con alto throughput. Funciona bien en casi cualquier hardware, pero no tiene las optimizaciones específicas de GPU que más aprovechan las tarjetas de gran ancho de banda.

El encuadre más preciso no es «llama.cpp no tiene kernels CUDA»: sí tiene soporte CUDA. La diferencia es arquitectónica. El modelo de colas de llama.cpp produce un alto tiempo hasta el primer token y una latencia constante entre tokens, lo que reafirma su conveniencia para procesamiento batch sin conexión o tareas de un solo usuario. Para un asistente conversacional, donde la latencia percibida importa, ese modelo no es ideal.

Además, el motor de inferencia generaba la respuesta completa antes de devolver algo. Sin streaming. El usuario veía una pantalla en blanco durante todo el tiempo de generación, aunque el modelo ya estuviera produciendo tokens.

## Lo que consideré y descarté

Antes de cambiar de motor exploré varias alternativas:

**Optimizar las consultas del pipeline de recuperación.** Ajusté la consulta de búsqueda híbrida, más sobre eso después, y reduje la cantidad de chunks que pasaban por el reranker. Mejoró la etapa de recuperación, pero redujo menos de 500 ms de la latencia total: no era la causa principal.

**Reducir el tamaño del prompt.** Analicé si el prompt de sistema estaba inflado. No era significativo: recortarlo ahorraba quizá 200 ms.

**Ajustar la cuantización del modelo.** Ya estaba ejecutando un modelo cuantizado. Aplicar una cuantización más agresiva degrada perceptiblemente la calidad de un asistente conversacional. No valía la pena.

**Cambios asíncronos en el pipeline.** Moví parte del procesamiento posterior al turno, escrituras de sesión y eventos de Kafka, para que se ejecutara después de la respuesta y no antes. Ayudó un poco. Aun así, no era el cuello de botella.

Los datos de las trazas seguían señalando el mismo lugar: el tiempo entre la llegada del prompt al motor de inferencia y el primer token devuelto. El problema era el motor.

## El cambio: vLLM

**vLLM** es un servidor de inferencia creado en UC Berkeley y diseñado desde cero para el throughput en GPU. Su innovación central es **PagedAttention**, una técnica de gestión de memoria para la caché KV inspirada en la paginación de los sistemas operativos. En lugar de asignar un bloque contiguo y fijo de memoria de GPU por solicitud, desperdiciando espacio y fragmentando la VRAM, PagedAttention administra la caché KV en páginas que pueden asignarse, reutilizarse y liberarse dinámicamente.

El efecto práctico es un uso de VRAM mucho mejor, mayor concurrencia y un tiempo hasta el primer token considerablemente menor en cargas interactivas.

En GPU NVIDIA, vLLM ofrece un Time to First Token casi instantáneo y una menor Inter-Token Latency con baja concurrencia, lo que lo vuelve ideal para aplicaciones interactivas. Ese es exactamente el perfil de un asistente conversacional: un usuario, interacción constante y sensibilidad a la latencia.

vLLM se ejecuta como un servidor independiente que expone una API compatible con OpenAI. Mi servicio de aplicación, `llm-service`, lo llama internamente por HTTP mediante `POST /v1/chat/completions`, exactamente como si llamara a la API de OpenAI, salvo que nada sale de la máquina. Pasar de llama.cpp a vLLM implicó escribir un nuevo adaptador en `llm-service`. El resto de la arquitectura no se movió.

## El modelo: Qwen3 AWQ 4-bit

Para el modelo de generación actualmente ejecuto **Qwen3 30B A3B Instruct AWQ 4-bit**, una arquitectura Mixture-of-Experts en la que solo unos 3B parámetros están activos por inferencia, aunque el modelo tenga 30B parámetros totales. Esto ofrece una calidad de razonamiento muy superior a la de un modelo puramente 3B por una fracción del costo de VRAM.

Digo *actualmente* a propósito. Cuando termine de mover embeddings y reranker fuera de la GPU, ya están en CPU mediante ONNX Runtime, voy a tener más margen de VRAM y podré reconsiderar si conviene un modelo más grande o distinto. La elección del modelo todavía está evolucionando.

Este es el perfil de despliegue al que llegué después de calibrarlo:

```
VLLM_MAX_MODEL_LEN=8192
VLLM_GPU_MEMORY_UTILIZATION=0.65
VLLM_KV_CACHE_DTYPE=fp8
VLLM_MAX_NUM_SEQS=1
VLLM_MAX_NUM_BATCHED_TOKENS=2560
```

La utilización de 0.65 es intencional: no busco saturar la GPU. El 35 % de margen deja espacio para el clasificador de intención y para el servicio de generación de imágenes previsto para una release posterior. Los embeddings y el reranker ya corren en CPU: `llm-service` no tiene visibilidad CUDA y usa solo unos 841 MiB de RAM, dejando toda la GPU dedicada a la generación.

El rendimiento de CPU es aceptable para este caso de uso:

![Tabla de benchmark que compara arranque en frío, p50 directo en caliente y latencia HTTP promedio de bge-m3 y bge-reranker-v2-m3](/images/blog/self-hosted-ai-latency-24-to-2/figure-01.png)

El arranque en frío sucede una sola vez al iniciar el contenedor. Las cifras HTTP de punta a punta incluyen validación JWT, `X-Caller-Service`, middleware, serialización FastAPI/Pydantic y overhead de red de Docker, y resultaron ligeramente *menores* que el benchmark directo del modelo, lo que confirma que el overhead HTTP es mínimo, unos 20 ms. Ningún modelo está en el camino crítico de la generación de tokens: su latencia solo se suma durante la fase de recuperación, antes de llamar al LLM. Ejecutar un único servicio al 100 % de GPU es óptimo localmente, pero no para el sistema completo.

Estas son las cifras observadas en ejecución:

![Tabla de ejecución que muestra uso de memoria GPU, pesos del modelo, caché KV, concurrencia estimada y controles saludables](/images/blog/self-hosted-ai-latency-24-to-2/figure-02.png)

Resultado final: **15–24 segundos → ~2 segundos.** Una reducción de latencia del 87–92 %. Mismo hardware, misma familia de modelos, distinto motor.

Un benchmark posterior midió el throughput real de generación contra la instancia de vLLM en ejecución, con 5 generaciones reales y Qwen3 30B AWQ 4-bit:

![Tabla del benchmark de generación con throughput ponderado, mediano, mínimo, máximo y combinado de tokens](/images/blog/self-hosted-ai-latency-24-to-2/figure-03.png)

Como referencia, el motor anterior generaba aproximadamente 15–20 tok/s en el mismo hardware. Es una **mejora de throughput de 10–14x** solamente por cambiar el motor de inferencia.

## Mantener vLLM aislado: segmentación de red

Algo que no suele aparecer en los benchmarks de inferencia es el modelo de seguridad. En una arquitectura de microservicios, que un motor de inferencia potente sea alcanzable por cualquier contenedor del stack es un problema.

Mi solución fue una red Docker interna dedicada a la que se conectan solo tres servicios: el servidor de inferencia, el servicio que lo llama y el recolector de métricas.

```
# names changed — not the real network names
networks:
  main-network:     # all application services
  inference-net:    # inference server + llm-service + prometheus only
    internal: true  # no external routing

inference-server:
  networks:
    - inference-net  # not visible to soul, gateway, or any app service

llm-service:
  networks:
    - main-network
    - inference-net  # only authorized caller

prometheus:
  networks:
    - main-network
    - inference-net  # metrics scraping only — no API key
```

Soul, el gateway y todos los demás servicios de aplicación no pueden resolver el hostname del servidor de inferencia. La red elimina el problema de alcance en el nivel de infraestructura. La API key es una segunda barrera. mTLS llegará en una fase posterior.

Un matiz importante: Prometheus tiene acceso TCP al puerto del servidor de inferencia dentro de la red de inferencia. Lo que impide que haga llamadas de generación es que no posee la API key y que el servidor exige `Authorization: Bearer` en todos los endpoints `/v1/*`. Aislamiento de red y exigencia de API key juntos: ninguno de los dos es suficiente por sí solo.

## El segundo cambio: búsqueda híbrida

En paralelo a la migración del motor, migré la imagen de base de datos de `pgvector/pgvector:pg16` a `paradedb/paradedb:pg16`.

ParadeDB es PostgreSQL: no es «similar a» PostgreSQL, sino literalmente PostgreSQL con `pg_search` preinstalado. El mismo SQL, los mismos drivers, las mismas cadenas de conexión. El único cambio fue la imagen en `docker-compose`.

`pg_search` agrega búsqueda de texto completo BM25 sobre la búsqueda vectorial que ya ofrecía pgvector. Esto habilita una **búsqueda híbrida con Reciprocal Rank Fusion (RRF)**: ejecutar tanto una búsqueda vectorial semántica como una búsqueda BM25 por palabras clave sobre la misma consulta y combinar después los rankings.

La diferencia práctica es que la búsqueda vectorial es buena para captar significados y sinónimos. BM25 es buena para encontrar términos exactos: nombres técnicos, identificadores de modelos, versiones y fechas. RRF combina ambas señales. Si preguntás a Juana por «benchmarks de Qwen3 AWQ» y el embedding no captura el término exacto, BM25 lo encuentra de todos modos. Si preguntás algo conceptual cuyas palabras exactas no aparecen en el texto almacenado, la búsqueda vectorial completa el vacío.

Cero migración de esquema, cero infraestructura nueva. Un solo cambio de imagen.

## Latencia del pipeline: baseline previo al streaming

Antes de implementar streaming, medí el pipeline completo de punta a punta: gateway → soul → planner → memory/session → llm-service → vLLM. Fueron 5 solicitudes en caliente con un prompt corto.

![Tabla de latencia de punta a punta con promedios del cliente, tiempo hasta el primer token de vLLM, overhead del pipeline y throughput de salida](/images/blog/self-hosted-ai-latency-24-to-2/figure-04.png)

Una aclaración importante: sin streaming activo, `time_starttransfer` de curl equivale al tiempo total de respuesta. El cliente recibe el primer byte recién cuando la respuesta completa está lista. Esto es TTFB con buffer, no TTFT real.

Estas cifras indican que el overhead del pipeline fuera de vLLM es de apenas ~90 ms. El TTFT interno de vLLM es de ~82 ms. Por lo tanto, el TTFT real proyectado en el cliente una vez activo el streaming es:

```
Non-vLLM overhead: ~90ms
vLLM TTFT:         ~82ms
──────────────────────────
Projected TTFT:    ~172ms
Realistic range:   150–250ms
```

El valor real se medirá cuando `POST /api/v1/chat/stream` se propague de punta a punta desde el gateway hasta el primer chunk SSE en el cliente.

## Qué viene después

El tiempo de respuesta de ~2 segundos todavía corresponde a la respuesta completa: Juana genera toda la respuesta antes de mostrar algo. La próxima fase implementa **streaming de punta a punta**. vLLM admite `stream=true` de forma nativa y `soul-service` va a retransmitir el stream SSE directamente al cliente. Se espera que el tiempo hasta el primer token baje a ~300–500 ms. La conversación empieza a sentirse como un intercambio real en lugar de un ciclo de solicitud y respuesta.

Después viene el **presupuesto de contexto consciente de tokens**: un `PromptBudgetBuilder` que cuenta el costo exacto de tokens de cada sección del prompt antes de armarlo, con recorte inteligente cuando el contexto está ajustado. Y **prefix caching**: la parte estática del prompt de sistema, instrucciones, contexto y definiciones de skills, se almacena en caché en VRAM y se reutiliza entre solicitudes. Se espera una reducción del 20–40 % en el tiempo hasta el primer token para turnos conversacionales.

Habrá otro artículo cuando tenga esas cifras.

## Lo que aprendí de todo esto

**Medí antes de optimizar.** Podría haber pasado semanas ajustando tamaños de prompt, índices de base de datos y pipelines asíncronos. Los datos de trazabilidad me mostraron en una tarde que nada de eso importaba tanto como el motor de inferencia.

**El motor de inferencia no es una commodity.** La elección del motor, llama.cpp, vLLM, TensorRT-LLM u Ollama, tiene un impacto mayor en la latencia observada que la mayoría de las mejoras de hardware. Sus filosofías de diseño son realmente distintas: vLLM está diseñado para servir a múltiples usuarios con alto throughput, mientras llama.cpp está optimizado para la eficiencia de un único flujo y la portabilidad. Ninguno está equivocado: fueron creados para trabajos distintos.

**El margen es arquitectura.** El 35 % de VRAM libre no es desperdicio. Es lo que permite que el servicio de generación de imágenes, el modelo de embeddings y el reranker convivan sin eliminarse entre sí. Diseñar con margen desde el comienzo es más barato que rediseñar después de alcanzar el límite.

**PostgreSQL es más capaz de lo que la mayoría aprovecha.** Búsqueda de texto completo BM25 y búsqueda vectorial en la misma consulta, dentro de la misma base de datos y sin infraestructura adicional. No es una concesión: para esta escala, es la herramienta correcta.

## Hardware y stack

- **GPU**: NVIDIA RTX 5090, 32 GB VRAM GDDR7
- **CPU**: AMD Ryzen 9 5900XT
- **RAM**: 128 GB DDR4
- **SO**: Windows 11 + WSL2 + Docker
- **Modelo de generación**: Qwen3 30B A3B Instruct AWQ 4-bit *(candidato actual; puede cambiar a medida que se libere VRAM)*
- **Motor de inferencia**: vLLM, servidor compatible con OpenAI
- **Embeddings**: BAAI/bge-m3, CPU
- **Reranker**: bge-reranker-v2-m3, CPU
- **Clasificador de intención**: Qwen2.5–1.5B, GPU
- **Base de datos**: ParadeDB pg16, PostgreSQL + pgvector + pg_search
- **Backend**: Python/FastAPI + Java/Spring Boot
- **Trazabilidad**: OpenTelemetry + Tempo
- **Orquestación**: Docker Compose

**Estoy abierta a oportunidades remotas como Senior Software Engineer, AI Infrastructure Engineer o Backend Architect.**

*Esta es la Parte 3 de una serie en curso sobre la construcción de Juana IA v2, una plataforma de IA personal autoalojada que todavía está en construcción.* [*Parte 1: Estoy construyendo una IA personal que vive en mi PC*](/blog/building-juana-self-hosted-ai) [*Parte 2: Le di un cerebro a mi IA local: cómo diseñé la capa de orquestación*](/blog/juana-orchestration-layer)

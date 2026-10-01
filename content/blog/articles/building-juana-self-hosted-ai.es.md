---
id: "juana-build-01"
slug: "building-juana-self-hosted-ai"
language: "es"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/im-building-a-personal-ai-that-lives-on-my-pc-here-s-what-i-ve-learned-so-far-c5a60ad26791"
sourcePostId: "c5a60ad26791"
publishedAt: "2026-03-14T21:22:40Z"
translation: "local-reviewed"
---

![Retrato de Juana sobre un fondo azul de interfaces digitales](/images/blog/building-juana-self-hosted-ai/figure-01.png)

*Una plataforma LLM autoalojada con microservicios, seguridad Zero Trust, pipelines RAG e inferencia local en GPU, construida desde cero.*

Hace unos meses me hice una pregunta que no me dejaba dormir:

¿Por qué todos los «asistentes de IA» que usamos dependen de servidores ajenos, procesan nuestros datos en la nube y pueden desaparecer o volverse más caros de un día para otro?

Esa pregunta se convirtió en un proyecto. Lo llamé Juana IA v2. Y todavía lo estoy construyendo.

## ¿Qué es Juana?

Juana es una plataforma de IA personal que se ejecuta por completo en mi propia computadora. Sin APIs externas. Sin datos que salgan hacia servidores de terceros. Sin costo por token.

No es un chatbot con una capa bonita sobre GPT-4. Es una plataforma construida desde cero con una arquitectura de microservicios, modelos de lenguaje que corren localmente en GPU y un sistema de memoria persistente que recuerda el contexto entre sesiones.

La visión a largo plazo es que Juana comprenda mi contexto, aprenda de mis documentos, me ayude a gestionar finanzas y genere contenido creativo, todo sin salir de mi red local. Inspirada, si se quiere, en Jane, de la saga de Ender: una entidad que conoce profundamente a su persona.

¿Ambicioso? Sí. Precisamente por eso lo estoy construyendo con rigor desde el primer día.

![Juana sentada frente a una estación de trabajo con pantallas de código y un cuaderno abierto](/images/blog/building-juana-self-hosted-ai/figure-02.png)

## El stack tecnológico, en una versión accesible

Elegí una arquitectura híbrida: Java para la infraestructura y Python para la inteligencia.

*Java* se encarga de todo lo que debe ser robusto y seguro: el gateway de entrada, la autenticación, el descubrimiento de servicios, la configuración centralizada y el broker de mensajes con Kafka. Spring Boot 3 y Spring Cloud.

*Python* se encarga de la capa cognitiva: los servicios que procesan lenguaje, generan embeddings, recuperan memoria y orquestan el razonamiento. FastAPI como framework.

*Los modelos se ejecutan localmente* en una NVIDIA RTX 5090 con 32 GB de VRAM:

- Mistral-7B-Instruct para generación de texto
- BAAI/bge-m3 para convertir texto en vectores matemáticos, o embeddings
- bge-reranker-v2-m3 para reordenar resultados según su relevancia

Los tres se cargan de forma diferida: el servicio inicia rápido y los modelos se inicializan con la primera solicitud.

## Lo que más me enseñó: la seguridad

Cuando empecé a conectar los servicios entre sí, me encontré con un problema crítico en sistemas reales de producción:

¿Cómo sabe el servicio de memoria que la solicitud entrante realmente viene del gateway autorizado y no de cualquier cliente que conozca el puerto interno?

La solución que implementé se llama Zero Trust. El principio es simple: ningún servicio confía en otro por defecto, aunque estén en la misma red interna.

En la práctica, el gateway:

1. Valida el JWT del usuario contra Keycloak, nuestro servidor de identidad
2. Obtiene su propio token de servicio para firmar solicitudes internas
3. Elimina cualquier header de identidad enviado por el cliente externo
4. Inyecta un header canónico `X-User-Context` con la identidad verificada

Los servicios internos validan criptográficamente que quien llama tenga permiso. ¿No hay un token válido? 401. Punto.

Esto todavía se está migrando en los servicios Python, y eso también forma parte del aprendizaje. Los sistemas reales siempre tienen deuda técnica que debe cerrarse con intención, no ignorarse.

## RAG: cómo «aprende» Juana de los documentos

Una de las capacidades que más me entusiasma es la ingesta de PDF. Subís un documento a Juana y puede responder preguntas sobre él.

El proceso que hay detrás se llama RAG, *Retrieval Augmented Generation*:

1. El PDF se analiza y se divide en fragmentos, o chunks
2. Cada fragmento se convierte en un vector numérico mediante bge-m3
3. Los vectores se almacenan en PostgreSQL con la extensión pgvector
4. Cuando hacés una pregunta, también se la convierte en un vector
5. Se recuperan los fragmentos matemáticamente más similares
6. Esos fragmentos se incorporan al contexto del modelo para generar la respuesta

El resultado es que el modelo no adivina: responde basándose en el texto real del documento. Y todo se ejecuta localmente.

## Lo que me llevo hasta ahora

Construir Juana me está obligando a integrar áreas que normalmente pertenecen a roles separados: arquitectura de sistemas, seguridad, procesamiento de lenguaje natural, infraestructura de datos y observabilidad. En un equipo real esto involucra a distintas personas. Acá me ocupo de todo de punta a punta, con documentación técnica completa: SDD, Architecture Decision Records y un backlog de Jira con trazabilidad real.

Y está confirmando algo que sospechaba: la verdadera complejidad de los sistemas de IA no está en los modelos, sino en la infraestructura que los rodea. El modelo es una pieza. La seguridad, la memoria, los pipelines de datos y la resiliencia son lo que determina si un sistema de IA funciona en producción o solamente en una demo.

## Qué sigue

![Retrato holográfico azul de Juana formado por trazas de circuitos](/images/blog/building-juana-self-hosted-ai/figure-03.png)

Los próximos módulos son el orquestador principal, Soul; un módulo de trading financiero que empezará con dinero simulado; y la generación de contenido creativo.

Si trabajás en un equipo que construye infraestructura de IA y querés conversar sobre arquitectura, seguridad de LLM o pipelines RAG, me encantaría conectar.

Estoy abierta a oportunidades remotas como Senior Software Engineer, AI Infrastructure Engineer o Backend Architect.

---
id: "juana-build-02"
slug: "juana-orchestration-layer"
language: "es"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/i-gave-my-local-ai-a-brain-how-i-designed-the-orchestration-layer-c5eb39f8c320"
sourcePostId: "c5eb39f8c320"
publishedAt: "2026-04-08T16:14:22Z"
translation: "local-reviewed"
---

![Juana junto a un cerebro digital luminoso bajo el título I Gave My Local AI a Brain](/images/blog/juana-orchestration-layer/figure-01.png)

Antes de que tu IA pueda responder algo, tiene que decidir *cómo* responderlo. Esta es la arquitectura que construí para lograrlo.

En mi [primer artículo](/blog/building-juana-self-hosted-ai), presenté Juana IA, una plataforma de IA personal que corre por completo en mi propio hardware, sin APIs externas y sin datos que salgan de mi red local. Cerré ese texto con un adelanto: *«El próximo módulo es el orquestador principal, Soul».*

Este es ese artículo, pero antes de entrar en el diseño quiero preguntarte algo. Cuando enviás un mensaje a un asistente de IA, ¿qué pensás que sucede? La mayoría imagina algo así: *entra un mensaje → el LLM piensa → sale una respuesta.* Eso se parece bastante a cómo funciona un chatbot, pero no es cómo funciona un *agente* de IA y, definitivamente, no es cómo funciona Juana. La realidad es más compleja, más deliberada y, sinceramente, más interesante.

## El problema: un mensaje no es una consulta

Cuando le decís a Juana *«recordame qué conversamos la semana pasada sobre mi estrategia de inversión y después buscá las últimas noticias sobre bonos argentinos»*, no es una sola cosa. Son, como mínimo, cuatro:

1. Recuperar memoria personal de una sesión anterior
2. Entender que «la semana pasada» es un filtro temporal
3. Ejecutar una herramienta de búsqueda web
4. Sintetizar dos fuentes de información distintas en una respuesta coherente

Una llamada directa a un LLM no puede hacer eso de manera confiable. No sabe qué herramientas existen, a qué datos tiene acceso ni qué hacer si una herramienta falla a mitad del proceso. Hace falta algo delante del LLM que *piense antes de actuar*.

Ese es el problema que resuelve la capa de orquestación.

## El principio canónico

Al comienzo del diseño de Juana establecí una única oración que gobierna toda la arquitectura cognitiva:

***Planner decide. Soul ejecuta. Memory recuerda. Session recupera. LLM infiere.***

Cada servicio del sistema tiene exactamente una función. Ningún servicio hace lo que ya hace otro. Cuando siento la tentación de agregar lógica en algún lugar, esta oración me indica si corresponde allí.

Suena simple. En la práctica es la restricción arquitectónica más valiosa que adopté.

## Los tres actores: Soul, Planner y Ruflo

![Diagrama que compara al ejecutor Soul, al estratega Planner y al bucle de decisiones en tiempo de ejecución de Ruflo](/images/blog/juana-orchestration-layer/figure-02.png)

### Soul: el orquestador

Soul es el punto de entrada para cada solicitud después del gateway. Recibe el mensaje enriquecido y autenticado, y se encarga de reunir todo el contexto, coordinar los demás servicios y, finalmente, producir una respuesta.

Algo fundamental: **Soul no decide qué hacer.** Ejecuta lo que se le indica. Sabe *cómo* llamar a una herramienta de recuperación de memoria, *cómo* invocar al LLM y *cómo* escribir un turno en el historial de sesión; pero la decisión de *si* debe hacer esas cosas y *en qué orden* pertenece a otro componente.

Esta distinción importa. Cuando mezclás la orquestación y la toma de decisiones en un mismo servicio, obtenés un servicio Dios imposible de probar, auditar o evolucionar. Mantener a Soul como un host de ejecución sin estado me permite cambiar la lógica de decisión sin tocar la infraestructura de ejecución, y viceversa.

### Planner: el estratega

Antes de que Soul ejecute algo, llama a Planner.

Planner recibe el mensaje entrante y el contexto de sesión, analiza la intención del usuario y devuelve un plan de ejecución estructurado. Decide:

- ¿Qué está pidiendo realmente el usuario?
- ¿Qué herramientas hacen falta para responder?
- ¿Qué skill, o plantilla de prompt, debe darle forma a la respuesta?
- ¿Es una respuesta conversacional simple o una tarea de largo alcance que necesita ejecutarse de manera asíncrona?

Planner devuelve un `PlannerResult`: un objeto estructurado que contiene los pasos del plan, la intención resuelta y una marca que indica si se trata de una tarea síncrona breve o de algo que debe ejecutarse en segundo plano.

**Planner no ejecuta nada.** Planifica. Eso es todo.

Hay un detalle del que estoy particularmente orgullosa: antes de que Planner llame al LLM para analizar la intención, ejecuta un filtro determinista de preclasificación. Heurísticas simples clasifican la consulta como `CONVERSATIONAL`, `META`, `INJECTION` u `OFF_TOPIC`. Solo si la consulta es verdaderamente ambigua pasa al LLM liviano, Qwen2.5 1.5B, que corre en GPU. Así se eliminan por completo alrededor del 30–40 % de las llamadas al LLM para intención. Camino rápido para lo simple; razonamiento completo solo cuando hace falta.

### Ruflo: el motor de decisiones en tiempo de ejecución

Esta es la parte que más tiempo me llevó resolver conceptualmente.

Una vez que Planner devuelve un plan, Soul no se limita a ejecutar los pasos en secuencia y esperar que todo salga bien. Ese modelo lineal se rompe en cuanto algo falla: una herramienta supera su tiempo de espera, una recuperación de memoria no devuelve nada útil o un paso produce una salida que invalida el resto del plan.

Ruflo es el componente que se ocupa de esto. Es un bucle de decisión explícito que corre dentro de Soul, evalúa el estado de ejecución después de cada paso y decide qué viene a continuación:

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

Cada decisión se registra con un ID de solicitud y el contexto del paso. Cada bucle tiene límites estrictos: un máximo de 20 iteraciones, 3 reintentos por paso y 2 replanificaciones por solicitud. Cuando se supera cualquier límite, el resultado siempre es un fallo limpio y estructurado, nunca un bloqueo silencioso ni un bucle infinito.

Ruflo vuelve resiliente al sistema. Más importante todavía: lo vuelve *auditable*. Puedo mirar cualquier solicitud y ver exactamente qué decidió el sistema, en qué orden y por qué.

## Antes de todo esto: las cachés

Dos optimizaciones suceden antes de que se ejecute cualquiera de los mecanismos anteriores.

**Caché semántica de respuestas:** Soul primero comprueba si esta pregunta ya fue respondida recientemente para este usuario. Genera el embedding de la consulta y ejecuta una búsqueda por similitud de coseno sobre las respuestas almacenadas en caché, con un umbral ≥ 0.92. Si hay una coincidencia, la respuesta vuelve de inmediato al usuario: sin Planner, sin LLM y sin herramientas. Para preguntas repetidas o similares, esto representa una mejora significativa de latencia.

**Contexto de sesión:** antes de hacer cualquier otra cosa, Soul recupera del servicio de sesión el historial reciente de conversación del usuario. Ese contexto acompaña a la solicitud por todo el pipeline y le da a Planner, y finalmente al LLM, el hilo conversacional que necesita para producir respuestas coherentes y contextuales.

## El flujo completo de una solicitud

![Plano de la arquitectura de Juana IA con las capas de plataforma, cognición, persistencia y seguridad](/images/blog/juana-orchestration-layer/figure-03.png)

Esto es lo que realmente sucede desde el momento en que enviás un mensaje a Juana:

1. **Gateway** autentica la solicitud, valida el JWT contra Keycloak, inyecta headers de identidad confiables y elimina cualquier identidad que el cliente haya intentado enviar por su cuenta.
2. **Soul** recupera del servicio de sesión el contexto reciente.
3. **Comprobación de caché semántica:** si una consulta similar fue respondida hace poco, devuelve la respuesta de inmediato.
4. **Soul → Planner:** envía el mensaje enriquecido para analizar la intención y generar el plan.
5. **Prefiltro de Planner:** clasificación determinista. `INJECTION` → fallo inmediato. Consultas simples → camino rápido. Ambiguas → análisis de intención con Qwen2.5 1.5B.
6. **Planner** comprueba la vigencia del conocimiento, consulta la memoria procedimental, es decir, patrones aprendidos de ejecuciones exitosas anteriores, resuelve la skill correcta y devuelve un `PlannerResult`.
7. **Comienza el bucle de Ruflo** dentro de Soul. Los pasos se ejecutan uno por uno, con decisiones en tiempo de ejecución después de cada uno.
8. Las herramientas se llaman cuando hace falta: recuperación de memoria, búsqueda web o consulta de conocimiento.
9. Se llama una sola vez a **LLM `/generate`**, al final, con el contexto completamente reunido.
10. La respuesta vuelve al usuario.
11. **De forma asíncrona:** Soul publica un evento en Kafka. El servicio de memoria lo consume y ejecuta el pipeline de ingesta posterior al turno, extrayendo de la conversación lo que importa y almacenándolo para recuperarlo en el futuro.

El LLM es lo último que se ejecuta, no lo primero. Todo lo anterior existe para darle exactamente el contexto correcto.

## ¿Por qué no usar simplemente un framework listo para usar?

Uso LangGraph para implementar tanto Planner como Ruflo: encaja bien con grafos de estado dirigidos y explícitos. Pero quiero dejar algo claro: LangGraph es un detalle de implementación, no una decisión de arquitectura.

El grafo de Planner vive en `infrastructure/planning/langgraph_planner.py`. El bucle de Ruflo vive en `infrastructure/execution/ruflo.py`. Ninguno de los dos es visible en los modelos de dominio, los puertos de aplicación ni los controladores. Si LangGraph publica mañana un cambio incompatible, modifico dos archivos. La arquitectura no se mueve.

Esta es la lección más importante que aprendí al construir sobre frameworks de IA: hay que tratarlos como infraestructura, no como arquitectura. La lógica de decisión pertenece al dominio. El framework es solo el cable por el que corre.

## Lo que esto habilita

Diseñar la capa de orquestación de esta manera, con Planner decidiendo, Soul ejecutando y Ruflo adaptándose en tiempo de ejecución, significa que Juana puede manejar cosas que una llamada simple a un LLM no puede:

- Consultas que requieren encadenar varias herramientas
- Degradación elegante cuando falla una herramienta
- Replanificación dinámica cuando la ejecución demuestra que el plan original era incorrecto
- Tareas de largo alcance que corren en segundo plano mientras el usuario continúa la conversación
- Consultas de investigación profunda que se descomponen en subpreguntas y sintetizan los resultados

Y como cada decisión es explícita y queda registrada, puedo entender qué hizo el sistema en cualquier solicitud. Eso importa cuando ejecutás un sistema de producción en tu propio hardware y no existe una línea de soporte a la que llamar.

## Qué sigue

La arquitectura de este artículo es la que se está construyendo en la Release 2 de Juana, actualmente en curso. Las piezas existen; el trabajo de integración continúa.

En el próximo artículo de esta serie voy a profundizar en el lado del hardware: cómo hago entrar un stack completo de IA, modelo de generación, embeddings, reranker y clasificador, en 32 GB de VRAM, y las decisiones que tomé cuando los números no cerraban.

Si estás construyendo infraestructura de IA y querés conversar sobre arquitectura, orquestación de LLM o decisiones de producción en hardware local, escribime.

También estoy abierta a oportunidades remotas como Senior Software Engineer, AI Infrastructure Engineer o Backend Architect.

*Esta es la Parte 2 de una serie en curso sobre la construcción de Juana IA v2, una plataforma de IA personal autoalojada.* [*Parte 1: Estoy construyendo una IA personal que vive en mi PC: esto es lo que aprendí hasta ahora*](/blog/building-juana-self-hosted-ai)

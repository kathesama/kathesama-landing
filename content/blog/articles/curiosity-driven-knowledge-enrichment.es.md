---
id: "juana-build-04"
slug: "curiosity-driven-knowledge-enrichment"
language: "es"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/when-your-ai-has-photographic-memory-but-no-understanding-designing-curiosity-driven-knowledge-c6e711c0ff8a"
sourcePostId: "c6e711c0ff8a"
publishedAt: "2026-05-10T05:08:08Z"
translation: "local-reviewed"
---

*Cómo diseñé un sistema que transforma un almacén RAG pasivo en un motor de conocimiento consciente de sí mismo y capaz de aprender de forma autónoma, sin hacer fine-tuning del modelo.*

Si tuvieras 1.000 libros cargados en la base de conocimiento de tu asistente de IA, manuales técnicos, libros de historia, textos de finanzas, libros de cocina, papers científicos y decenas de miles de chunks embebidos, indexados, almacenados en una base vectorial y listos para recuperar, ¿tu asistente sabría realmente lo que sabe?

Esa pregunta me detuvo en seco en medio de una conversación. Había construido un sistema con memoria fotográfica: recuerdo preciso de todo lo que había visto, pero cero conciencia de lo que sabía. Si yo nunca preguntaba sobre fermentación, Juana nunca sabría que tenía tres libros sobre el tema. El conocimiento estaba ahí. La comprensión, no.

Esta es la historia de cómo diseñé **Curiosity-Driven Knowledge Enrichment (CDKE)**: una arquitectura que le da a un asistente de IA no solo conocimiento, sino también conciencia sobre su propio conocimiento, capacidad de detectar lo que le falta y un proceso autónomo controlado para completar esos vacíos.

## El problema que suele resolverse mal

La mayor parte de la literatura sobre RAG cubre estrategias de chunking, modelos de embeddings, reranking y búsqueda híbrida. Son problemas reales que vale la pena resolver.

Pero hay un problema más profundo que aparece cuando la base de conocimiento supera unos pocos cientos de documentos: **el sistema se vuelve ciego ante sí mismo.**

Un almacén RAG con 1.000 libros no es una base de conocimiento. Es un índice de búsqueda. La diferencia es sutil, pero crítica:

- Un **índice de búsqueda** encuentra cosas cuando se las pedís
- Una **base de conocimiento** es consciente de lo que contiene y puede razonar sobre cobertura, vacíos y profundidad

Cuando Juana recupera chunks sobre pan de masa madre porque pregunté por fermentación, no está *sabiendo* sobre fermentación. Está *encontrando* texto que coincide con mi consulta. En cuanto dejo de preguntar, ese conocimiento vuelve a quedar dormido.

Esto es memoria fotográfica sin comprensión. El cerebro de alguien que memorizó una enciclopedia pero nunca entendió lo que leyó.

La pregunta que me hice fue: *¿qué haría falta para que Juana supiera realmente lo que sabe?*

## Tres observaciones que dieron forma al diseño

### 1. La experiencia es síntesis, no recuperación

Lo que distingue a una chef experta de un libro de cocina no es solo la memoria. Es la capacidad de razonar por qué funcionan las técnicas, improvisar cuando cambian los ingredientes y transferir conocimiento entre contextos. Esa comprensión surge de la síntesis: conectar piezas de información dispersas para formar una comprensión coherente.

Los chunks no son síntesis. Mil chunks sobre fermentación no vuelven a Juana una experta en fermentación. La convierten en un buen motor de búsqueda para consultas sobre fermentación.

### 2. Los vacíos se pueden detectar a partir de señales de uso

Cada vez que Juana responde una pregunta con baja cobertura RAG, pocos chunks recuperados o poca confianza del reranker, genera una señal que la mayoría de los sistemas simplemente descarta: *este tema existe en el mundo y no sé lo suficiente sobre él.*

La señal ya estaba ahí. Se estaba desperdiciando.

### 3. La curiosidad sin dirección es ruido

No quería que Juana investigara de forma autónoma cualquier cosa. Quería que investigara lo relevante y evitara lo que no lo fuera: política, cultura de celebridades y temas que no pertenecen a su alcance. La curiosidad necesitaba un filtro.

Ese filtro tenía que venir de mí, como su creadora. No como un archivo de configuración estático, sino como un perfil vivo que puedo ajustar a medida que evolucionan mis intereses.

## La arquitectura: tres componentes

CDKE está construido sobre tres componentes interdependientes. Cada uno resuelve uno de los problemas anteriores.

![Figura: Arquitectura de CDKE — Knowledge Map aporta conciencia del dominio al Curiosity Loop; Interest Vector gobierna qué puede investigar el bucle; ambos se conectan con el pipeline RAG subyacente mediante ingesta, detección de vacíos e integración con Planner.](/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png)

### Componente 1: Knowledge Map

Knowledge Map le da a Juana una representación estructurada y consultable de lo que realmente contiene su base de conocimiento, a nivel de dominio y no de chunk.

Se construye durante la ingesta. Después de analizar y normalizar un documento, `knowledge-worker` llama al LLM con un prompt restringido por esquema que pide exactamente cuatro cosas:

```
{
  "domain": "gastronomy / culinary techniques",
  "subdomain": "fermentation / preservation",
  "key_concepts": ["lactic fermentation", "kefir", "kimchi", "microbiota"],
  "complexity": "intermediate"
}
```

Esta caracterización se almacena junto al documento. Una tabla separada, `knowledge_domain_index`, agrega esos datos de todos los documentos para ofrecer una vista por dominio:

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

Hay una decisión de diseño que vale la pena destacar: **la caracterización es enriquecimiento, no una barrera.** Si la llamada al LLM falla, la ingesta continúa. El documento se indexa sin metadatos de caracterización y queda marcado para un reintento asíncrono. Una falla de caracterización nunca impide que un documento esté disponible para recuperación.

Con Knowledge Map, Juana finalmente puede responder: *«¿qué sé sobre fermentación?»* No buscando chunks, sino consultando un índice estructurado.

### Componente 2: Curiosity Loop

Curiosity Loop es donde ocurre el aprendizaje autónomo. Tiene dos subprocesos.

**Detección de vacíos, dirigida por eventos y posterior al turno**

Después de cada turno en el que se invocó la recuperación de conocimiento, el sistema evalúa dos señales:

- ¿La cantidad de chunks quedó por debajo del umbral? Cobertura escasa
- ¿El puntaje superior del reranker quedó por debajo del umbral? Baja confianza

Si se cumple cualquiera de esas condiciones, se publica un evento `knowledge.gap.detected` en el bus de mensajes:

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

Notá `source_query_hash`: solo se persiste un SHA256 de la consulta original, nunca la consulta cruda. La privacidad importa incluso en los pipelines internos de eventos.

`knowledge-worker` consume este evento y escribe en `knowledge_gaps`. Si el dominio está `EXCLUDED` en el Interest Vector del usuario, el vacío se marca inmediatamente como tal y nunca se investiga. Si está `PENDING`, espera al bucle nocturno.

**Síntesis de dominio, programada durante el tiempo inactivo**

Un disparador autónomo programado se ejecuta cada noche. Hace dos cosas.

*Paso 1: resolver vacíos mediante búsqueda web.* Acá el bucle se vuelve realmente activo. Para cada vacío `PENDING` que supera el filtro de Interest Vector, `knowledge-worker` no espera a que una persona le proporcione un documento. Sale a buscar uno.

Lo hace mediante las herramientas `web_search` y `web_fetch` integradas al sistema. El flujo es directo:

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

La lista blanca de fuentes confiables es una protección crítica. No todos los resultados de búsqueda son aceptables. El sistema solo obtiene contenido de dominios aprobados previamente: fuentes académicas, publicaciones reputadas y documentación oficial. El contenido externo a la lista se rechaza antes de que toque el pipeline de ingesta.

En la práctica, esto significa que, después de detectar un vacío durante una conversación el martes por la noche, para el miércoles a la mañana Juana podría haber investigado el tema, ingerido contenido relevante y actualizado su base de conocimiento sin ninguna instrucción del usuario. La próxima vez que aparezca el tema, su cobertura de recuperación será notablemente mejor.

Los vacíos fallidos no se reintentan indefinidamente. Después de 3 intentos aparecen en observabilidad para que puedas decidir si proporcionar una fuente manualmente.

*Paso 2: síntesis de dominio.* Para los dominios con cobertura suficiente que no hayan sido sintetizados recientemente, el bucle genera documentos de síntesis:

```
Retrieve top-K representative chunks (diverse, high authority)
  → LLM generates integrative synthesis document
  → Ingested with source_type = 'SYNTHESIS', authority_score = 0.7
  → knowledge_domain_index updated: has_synthesis = true
```

El valor `authority_score = 0.7` es una elección deliberada. Juana debe preferir las fuentes primarias sobre su propia síntesis. Si el libro original dice algo, tiene prioridad sobre lo que Juana derivó de él. El reranker usa este puntaje para ponderar los resultados.

**Este es el paso que convierte la memoria fotográfica en comprensión.** Un documento de síntesis sobre fermentación no se limita a recuperar chunks. Integra el proceso de fermentación láctica, el rol de la microbiota y las condiciones que diferencian al kimchi del kéfir en una comprensión coherente que informa toda recuperación futura sobre el tema.

### Componente 3: Interest Vector

Interest Vector es el filtro que hace que la curiosidad sea segura y tenga un propósito.

Es un perfil de preferencias de dominio propiedad del usuario y respaldado por una base de datos:

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

La semántica de los pesos es intencionalmente simple:

Peso Estado Qué hace Juana 0.9–1.0 `PREFERRED` Sintetiza proactivamente y prioriza los vacíos 0.4–0.89 `ALLOWED` Investiga cuando `gap_score` es suficientemente alto 0.0 `EXCLUDED` Nunca investiga ni sintetiza

En la primera activación, todos los dominios quedan en `ALLOWED` con peso 0.5. Un cuestionario inicial lo personaliza y cubre intereses profesionales, intereses personales, exclusiones explícitas y preferencia de profundidad. Después puede editarse en cualquier momento desde la interfaz de Settings.

También existen exclusiones estrictas a nivel del sistema que el usuario no puede sobrescribir: contenido clasificado como inyección, dominios prohibidos por el soul prompt y fuentes fuera de la lista blanca de sitios confiables. Nunca ingresan en Curiosity Loop, sin importar lo que diga Interest Vector.

## Cómo se conecta todo

El flujo completo de datos, desde la ingesta hasta la recuperación inteligente, es:

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

## Relación con trabajos existentes

Antes de decidirme por este diseño revisé la literatura sobre recuperación dinámica y RAG consciente del conocimiento. La siguiente es una comparación honesta.

**FLARE** (Jiang et al., EMNLP 2023) \[1\] y **DRAGIN** (Su et al., ACL 2024) \[2\] abordan la pregunta de *cuándo* recuperar durante la generación. FLARE utiliza predicciones de tokens con baja confianza como disparador de recuperación; DRAGIN lo refina incorporando señales de autoatención de todo el contexto. Ambos son reactivos y trabajan dentro del contexto: operan durante una única pasada de generación y no dejan un registro persistente de lo que faltó. Una vez producida la respuesta, la señal se descarta.

**SIM-RAG** (Yang et al., SIGIR 2025) \[3\] avanza un paso más al entrenar un modelo crítico externo que evalúa si el contexto recuperado es suficiente antes de aceptar una respuesta. Es el trabajo más cercano a la conciencia de vacíos que encontré en la literatura. La diferencia clave con CDKE es el alcance: SIM-RAG opera dentro del bucle de recuperación de una sola consulta; CDKE persiste vacíos entre sesiones y los investiga de manera asíncrona entre conversaciones.

**GraphRAG** (Edge et al., Microsoft Research, 2024) \[4\] aborda la comprensión estructural construyendo un grafo de conocimiento sobre el corpus, lo que habilita consultas globales de interpretación que RAG vectorial no puede resolver. Esto es ortogonal a CDKE: GraphRAG mejora *cómo* recupera el sistema a partir de lo que tiene; no detecta lo que falta ni lo investiga de forma autónoma.

**Retrieval Augmented Curiosity (RAC)** (Goldman, 2025) \[5\] propone un marco conceptual para combinar RAG con curiosidad estructurada e impulsar la expansión autónoma del conocimiento. La dirección coincide con la motivación de CDKE. Sin embargo, RAC es una propuesta de diseño sin una implementación productiva documentada y no aborda la conciencia a nivel de dominio ni la gobernanza mediante un vector de intereses.

Hasta donde sé, ningún sistema documentado públicamente integra estas tres capacidades en un único pipeline coherente: autoconciencia a nivel de dominio construida durante la ingesta, un registro persistente de vacíos derivado de señales de uso reales e investigación autónoma asíncrona con síntesis de dominio. Cada pieza aparece por separado en la literatura. La integración es, hasta donde puedo determinar, un problema abierto en los sistemas RAG de producción.

Lo que CDKE aporta específicamente:

1. **Autoconciencia a nivel de dominio** construida durante la ingesta, no derivada retroactivamente de consultas
2. **Detección de vacíos basada en el uso**, donde los vacíos surgen de conversaciones reales y persisten entre sesiones como un registro consultable
3. **Interest Vector** como perfil persistente y editable por el usuario que gobierna qué dominios puede investigar el sistema de forma autónoma

La combinación de estos tres componentes en un único pipeline integrado es el aporte arquitectónico documentado en este artículo.

## Lo que esto no hace

Quiero ser precisa sobre los límites.

CDKE no hace fine-tuning del modelo. El LLM subyacente no cambia. Todo el aprendizaje ocurre a través del pipeline de ingesta, la misma infraestructura que procesa los documentos enviados por los usuarios. Los pesos del modelo quedan intactos.

CDKE no crea curiosidad genuina. Juana no tiene preferencias. Interest Vector representa mis prioridades proyectadas sobre su comportamiento. La detección de vacíos responde a mis patrones de uso. La curiosidad es derivada, no intrínseca.

Lo que CDKE sí crea es el equivalente funcional de una persona dedicada al conocimiento que detecta vacíos, los completa fuera del horario de actividad y construye comprensión coherente a partir de información fragmentada, todo sin intervención humana después de la configuración inicial.

## Hoja de ruta de implementación

Dividí la implementación en dos fases.

**Fase A: fundamentos**

- Paso de caracterización de dominio en el pipeline de ingesta
- Extensión del esquema para metadatos de dominio
- Tabla `knowledge_domain_index` y consumidor de actualización
- Tabla `interest_vector`, cuestionario inicial e interfaz de Settings
- Pipeline de eventos para detección de vacíos

**Fase B: Curiosity Loop**

- Disparador autónomo nocturno
- Investigación de vacíos mediante búsqueda web e ingesta
- Generación de documentos de síntesis de dominio
- Integración de Planner con pistas de recuperación
- Edición de Interest Vector en la interfaz de Settings

La razón de esta división es que la Fase A construye la infraestructura de observabilidad. Sin Knowledge Map y el registro de vacíos, se trabaja a ciegas. La Fase B activa el comportamiento autónomo sobre una base que se puede inspeccionar y validar.

## Una nota sobre el hardware

Todo este sistema se ejecuta en un único nodo: NVIDIA RTX 5090, 128 GB de RAM, AMD Ryzen 9 5900XT, WSL2 + Docker. Sin APIs de nube, sin llamadas a LLM externos y sin Kubernetes.

La síntesis es la parte que exige más cómputo. Los dominios grandes pueden requerir ventanas de contexto importantes para sus chunks. Por eso existe la programación nocturna: la síntesis se ejecuta durante las horas inactivas y está limitada para respetar el presupuesto de VRAM, sin competir con las solicitudes interactivas.

La IA autoalojada a esta escala no es una limitación. Es un principio de diseño. Cada decisión de esta arquitectura prioriza la privacidad, el control y la independencia a largo plazo de proveedores externos.

## Reflexiones finales

Uno de los problemas menos abordados en los sistemas RAG actuales es la distancia entre tener información y tener conocimiento. Trabajos recientes como SIM-RAG \[3\] reconocen la autoconciencia de los límites del conocimiento como un desafío fundamental; FLARE \[1\] y DRAGIN \[2\] lo abordan durante la generación. Lo que sigue abierto, hasta donde pude determinar, es un sistema que lo aborde a nivel de la base de conocimiento: conciencia de qué dominios están cubiertos, qué falta y un proceso autónomo para completar esos vacíos con el tiempo.

CDKE es mi intento de cerrar esa brecha de forma rigurosa: conciencia estructurada del dominio creada durante la ingesta, detección de vacíos basada en el uso y persistente entre sesiones, y síntesis autónoma controlada; todo sin tocar el modelo, sin agregar nuevos servicios y sin perder el control sobre lo que aprende el sistema.

La arquitectura está formalizada como un Architectural Decision Record en el proyecto JuanaIA. La implementación de la Fase A comienza a continuación.

Si este patrón resulta útil para otras personas que construyen sistemas de IA autoalojados, espero que como mínimo reformule la pregunta: no preguntes solamente *qué* puede recuperar tu IA. Preguntá *si sabe lo que sabe*.

## Referencias

\[1\] Jiang, Z., Xu, F. F., Gao, L., Sun, Z., Liu, Q., Dwivedi-Yu, J., Yang, Y., Callan, J., & Neubig, G. (2023). Active Retrieval Augmented Generation. *Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing (EMNLP 2023)*, pages 7969–7992. Association for Computational Linguistics. [https://aclanthology.org/2023.emnlp-main.495/](https://aclanthology.org/2023.emnlp-main.495/)

\[2\] Su, W., Tang, Y., Ai, Q., Wu, Z., & Liu, Y. (2024). DRAGIN: Dynamic Retrieval Augmented Generation based on the Real-time Information Needs of Large Language Models. *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (ACL 2024)*, pages 12991–13013. [https://aclanthology.org/2024.acl-long.702/](https://aclanthology.org/2024.acl-long.702/)

\[3\] Yang, D., Zeng, L., Rao, J., & Zhang, Y. (2025). Knowing You Don’t Know: Learning When to Continue Search in Multi-round RAG through Self-Practicing. *Proceedings of the 48th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR 2025)*, Padua, Italy. [https://doi.org/10.1145/3726302.3730018](https://doi.org/10.1145/3726302.3730018)

\[4\] Edge, D., Trinh, H., Cheng, N., Bradley, J., Chao, A., Mody, A., Truitt, S., & Larson, J. (2024). From Local to Global: A Graph RAG Approach to Query-Focused Summarization. *arXiv preprint arXiv:2404.16130*. [https://arxiv.org/abs/2404.16130](https://arxiv.org/abs/2404.16130)

\[5\] Goldman, R. (2025, March). Retrieval Augmented Curiosity: An Autonomous Approach to Knowledge Expansion. *Medium*. [https://medium.com/@ryanbgoldberg/retrieval-augmented-curiosity-an-autonomous-approach-to-knowledge-expansion-2d3dc374e08f](https://medium.com/@ryanbgoldberg/retrieval-augmented-curiosity-an-autonomous-approach-to-knowledge-expansion-2d3dc374e08f)

*Soy Kathy, Senior Software Engineer y AI Infrastructure Architect radicada en Buenos Aires, Argentina. Actualmente estoy construyendo JuanaIA, un asistente de IA personal completamente autoalojado que corre en hardware local sin dependencias de APIs externas. Escribo sobre arquitectura de IA, diseño de sistemas y las realidades prácticas de construir sistemas de IA con calidad de producción desde cero.*

*Estoy abierta a puestos de Senior Software Engineer, AI Infrastructure Engineer y Backend Architect, preferentemente remotos. Si estás construyendo algo ambicioso en infraestructura de IA, me encantaría conectar.*

*Medium: @kathesama | LinkedIn: Kathy*

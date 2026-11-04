# Plan técnico — 002 Objetivo semanal de estudio

Documento de implementación para `specs/002-objetivo-semanal/spec.md`. No contiene código:
describe archivos, responsabilidades, modelo de datos, lógica pura, cálculo, pintado,
accesibilidad, responsive, decisiones y pruebas.

## 0. Contexto y enfoque

La aplicación ya mide lo que ha pasado (racha, mejor racha, minutos de la semana, mapa de
calor) pero no tiene una meta. Esta funcionalidad añade un objetivo único de minutos por
semana, guardado en el navegador, y un bloque que compara el progreso de la semana actual
con ese objetivo.

Enfoque en cuatro ideas:

1. **Una regla, una fuente**: el objetivo se guarda aparte de las sesiones y el progreso se
   calcula con una función pura que replica la regla exacta de la tarjeta "Minutos semana";
   el bloque no inventa semanas ni sumas propias.
2. **Tres estados y un editor**: sin objetivo, en progreso y cumplido, con un editor que se
   abre sobre el mismo bloque. Nada de vistas nuevas ni ventanas.
3. **La fecha siempre de fuera**: la lógica recibe `today` (la R de la spec) y no mira el
   reloj; por eso no hay temporizadores y el bloque repite el comportamiento de la tarjeta
   cuando la aplicación se queda abierta de un día para otro.
4. **Sin tocar lo que funciona**: ni sesiones, ni racha, ni mapa. El objetivo solo lee esos
   datos y, cuando la spec lo exige, vuelve a ejecutar el renderizador existente de la
   tarjeta para que ambos números no puedan separarse.

## 1. Principios que guían el plan

- **Lógica pura y separada** de DOM y almacenamiento; todas las funciones de cálculo
  reciben `today` como parámetro (constitución, artículo 3). El único "hoy" que usa el
  bloque es la fecha de referencia del último cálculo (R) definida en la spec y en RNF-11.
- **Sin dependencias, sin build y sin módulos ES**: scripts clásicos que funcionan con
  doble clic sobre `index.html` (artículo 1).
- **Tests primero y como puerta**: la lógica se prueba con `node --test`; no se avanza a
  la interfaz con tests en rojo (artículo 4). La suite actual (21 tests) debe seguir en
  verde en todo momento.
- **Datos intactos**: no se cambia la clave ni el formato de `diarioEstudio_sessions`, no
  se escribe en ella desde el objetivo y no se pierde ninguna sesión (artículo 5, RNF-5).
- **Fechas locales**: nada de `toISOString()` ni de `new Date("AAAA-MM-DD")` (artículo 5,
  RNF-6).
- **Código en inglés; interfaz y documentación en español** (artículo 6).
- **Solo lectura sobre lo existente**: el objetivo no modifica la racha, la mejor racha, el
  mapa de calor ni las reglas de "Minutos semana"; únicamente lee las sesiones y vuelve a
  pintar la tarjeta con su propio renderizador cuando la spec lo exige (§11.3).

## 2. Archivos que se crean o modifican

| Archivo | Estado | Responsabilidad | RF que cubre |
| --- | --- | --- | --- |
| `weekly-goal-logic.js` | Crear | Única fuente de verdad de la lógica del objetivo: validación y normalización del valor canónico, fecha del lunes de la semana de R, progreso de la semana actual, porcentaje con tope, estado de cumplimiento y formato de minutos con separador de miles. Sin DOM, sin `localStorage`, sin estado global mutable y sin reloj interno: `today` siempre es un parámetro. Exportación compatible con navegador y con `require` de Node mediante un guardado de exportación CommonJS. | RF-5, RF-6 (formato), RF-8 (cálculo), RF-9 (cálculo), RF-10, RF-11, RNF-6, RNF-8 (formato), RNF-11 |
| `weekly-goal-ui.js` | Crear | Capa de presentación: pinta los tres estados (sin objetivo, en progreso, cumplido), el texto, el porcentaje, la barra accesible, el mensaje de cumplimiento y el aviso de guardado; gestiona el editor (abrir, guardar, cancelar, quitar), la validación al enviar, el foco y los anuncios. No calcula nada: consume `weekly-goal-logic.js` y los datos de `app.js`. | RF-1, RF-2, RF-3, RF-4 (aviso), RF-7, RF-8 (mensaje), RF-12, RF-15, RNF-9, RNF-12 |
| `tests/weekly-goal-logic.test.js` | Crear | Pruebas automáticas de toda la lógica pura con `node:test` y `node:assert/strict`. | Puerta de la constitución; RF-5, RF-6, RF-8, RF-9, RF-10, RF-11 y casos límite |
| `index.html` | Modificar | Añadir la sección del objetivo **entre las tarjetas de resumen y el mapa de calor**, con su esqueleto de estados, el editor y el hueco del aviso; cargar `weekly-goal-logic.js` y `weekly-goal-ui.js` antes de `app.js`, en ese orden. | RF-1, RF-2, RF-3, RF-7, RF-13, RF-15, RNF-1 |
| `styles.css` | Modificar | Estilos de la tarjeta, textos, porcentaje, barra (pista y relleno), mensaje de cumplimiento, editor, errores, foco visible y ajustes responsive de 375 px y 320 px. Sin animaciones ni transiciones en la barra. | RF-6, RF-14, RNF-3, RNF-4, RNF-8, RNF-10 |
| `app.js` | Modificar mínimamente | Añadir la clave y los tres accesos al almacenamiento del objetivo (leer, guardar con verificación, quitar), y llamar a `renderWeeklyGoal()` en el arranque y tras registrar una sesión, junto a los repintados existentes. No se toca la lectura, la escritura ni el formato de las sesiones, ni el cálculo de racha, mejor racha, minutos de la semana o el mapa. | RF-4, RF-9, RF-12, RF-13, RNF-5, RNF-7 |
| `MEMORY.md` | Modificar al terminar | Registrar estado, decisiones y aprendizajes de la implementación. | Proceso del proyecto |

### 2.1 Archivos nuevos que requieren aprobación

`AGENTS.md` pide preguntar antes de crear archivos nuevos. La implementación **necesita
tres** y ninguno más:

1. `weekly-goal-logic.js` — lógica pura, imprescindible para cumplir el artículo 3 de la
   constitución (cálculos fuera de `app.js`, con `today` como parámetro) y para probarla con
   `node --test` sin DOM.
2. `weekly-goal-ui.js` — capa de presentación del bloque y del editor; mantiene `app.js`
   como capa de datos y sigue el precedente de `heatmap-ui.js`.
3. `tests/weekly-goal-logic.test.js` — pruebas de la lógica pura, la única forma de probar
   con `node --test` sin dependencias.

No se crean `package.json`, ni configuración de test, ni carpeta de build, ni se modifican
la spec ni el formato de `diarioEstudio_sessions`. Si el usuario prefiere no crear archivos
nuevos, la alternativa es concentrar todo en `app.js` (ver §12), pero entonces la lógica
deja de ser probable con `node --test` y se incumple el artículo 4.

## 3. Flujo de datos y separación de capas

1. `app.js` es la capa de datos: sesiones (`getSessions`) y objetivo
   (`getGoalRawValue`, `saveGoalMinutes`, `clearGoalValue`), ambos en `localStorage`.
2. `app.js` llama a `renderWeeklyGoal()` en `init()` y tras registrar una sesión, igual que
   hace con `renderWeekMinutes` y `renderHeatmap`.
3. `weekly-goal-ui.js` obtiene el valor guardado, las sesiones y la fecha local
   (`getGoalRawValue()`, `getSessions()`, `getTodayLocalDateString()`), llama a
   `WeeklyGoalLogic.buildWeeklyGoal(sessions, rawGoal, today)` y pinta el resultado.
4. La estructura devuelta ya está resuelta (progreso, porcentaje, cumplimiento): la interfaz
   no hace cuentas ni decide estados.
5. Cuando la persona guarda o quita el objetivo, la propia interfaz vuelve a leer el
   almacenamiento y se repinta; además invita a `app.js` a repintar la tarjeta "Minutos
   semana" con la misma R (§11.3), porque la spec exige que ambos números coincidan.
6. El objetivo **nunca** escribe en las sesiones y el mapa nunca escribe: las tres piezas
   comparten datos en modo lectura.

Consecuencia: `weekly-goal-logic.js` se prueba en Node sin navegador, sin DOM y sin
almacenamiento; la interfaz no duplica reglas de negocio; `app.js` solo gana datos y dos
llamadas.

## 4. Modelo de datos del objetivo

| Aspecto | Decisión |
| --- | --- |
| Clave | `diarioEstudio_weeklyGoal`, independiente de `diarioEstudio_sessions`. |
| Contenido | El valor canónico como **texto de solo dígitos**: `"300"`, `"1"`, `"10080"`. Sin JSON, sin objeto, sin fecha, sin semana y sin decimales. |
| Ausencia | Si la clave no existe, no hay objetivo. |
| Alcance | Un único objetivo, válido para todas las semanas. No se guarda la semana a la que pertenece: sería historial y está fuera de alcance. |
| Lectura | `parseGoalValue(valorGuardado)`. Acepta el texto de solo dígitos (con espacios en los extremos) y, por robustez, un número entero del mismo rango. Cualquier otra cosa devuelve "sin objetivo". |
| Valor inválido guardado | Se trata como "sin objetivo" y **no se borra**: solo se reemplaza cuando se guarda un objetivo válido (RF-11). |
| Escritura | `setItem(clave, String(valorCanónico))` seguido de relectura y comparación. Si la relectura no coincide o lanza, se restaura el valor anterior y se devuelve `false` para que la interfaz muestre "No se ha podido guardar el objetivo". |
| Borrado | `removeItem` verificado por relectura. |
| Compatibilidad | No se modifica `diarioEstudio_sessions`, ni su clave, ni sus campos (`id`, `date`, `topic`, `minutes`, `timestamp`). No hay migración: quien no tenga la clave nueva ve el estado "sin objetivo". |
| Por qué texto y no JSON | `getItem` devuelve siempre texto; guardar el canónico como dígitos hace que lo escrito y lo leído tengan la misma forma (RF-4) y encaja con la aceptación explícita del texto de dígitos en RF-11. |

Alternativas descartadas en la tabla de decisiones (§12): `JSON.stringify({ minutes })`,
guardar el objetivo dentro del array de sesiones y guardar la semana junto al objetivo.

## 5. Funciones puras y su contrato

Todas viven en `weekly-goal-logic.js`, no leen estado global, no acceden al DOM ni a
`localStorage` y reciben `today` cuando el cálculo lo necesita.

| Función | Entrada → salida | Responsabilidad | RF |
| --- | --- | --- | --- |
| `parseGoalValue` | `raw` → entero 1…10.080 o `null` | Normalizar el valor canónico desde el texto del formulario o desde el valor guardado, aplicando la tabla de RF-10. | RF-10, RF-11, CL-2, CL-14, CL-23, CL-25 |
| `getWeekStart` | `"AAAA-MM-DD"` → `"AAAA-MM-DD"` | Devolver el lunes de la semana de una fecha (domingo retrocede seis días). | RF-5, RF-9, CL-11 |
| `calculateWeekProgress` | sesiones, `today` → número ≥ 0 | Sumar los minutos de la semana actual del lunes a `today`, con **exactamente** las reglas de `calculateWeekMinutes` (§7.1). | RF-5, RF-9, CL-7, CL-8, CL-9, CL-11, CL-13, CL-15, RNF-6, RNF-11 |
| `calculatePercent` | progreso, objetivo → entero 0…100 | `floor((X ÷ Y) × 100)` con tope 100 y sin decimales. | RF-6, RF-8, CL-3, CL-4, CL-6, CL-18, CL-20 |
| `formatMinutes` | número → texto | Separador de miles con punto; decimales con coma y sin redondear; solo la parte entera se agrupa. | RF-6, RNF-8, CL-4 |
| `formatProgressText` | progreso, objetivo → texto | Componer `"X de Y min"` con `formatMinutes`. | RF-6 |
| `buildWeeklyGoal` | sesiones, `rawGoal`, `today` → estructura completa | Orquestar validación, progreso, porcentaje, cumplimiento y semana. | RF-5, RF-7, RF-8, RF-9, RF-11 |

Constantes exportadas: `MIN_GOAL_MINUTES = 1`, `MAX_GOAL_MINUTES = 10080`.

Estructura devuelta por `buildWeeklyGoal`:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `status` | `"no-goal"` \| `"goal"` | Estado del bloque. |
| `today` | texto | La R recibida, sin recalcularla. |
| `weekStart` | texto \| `null` | Lunes de la semana de R. |
| `goal` | entero \| `null` | Objetivo canónico, o `null` si no es válido. |
| `progress` | número ≥ 0 | Minutos de la semana actual, del lunes a R. Se calcula siempre, también sin objetivo. |
| `percent` | entero 0…100 | 0 cuando no hay objetivo; con tope 100. |
| `isComplete` | booleano | `false` sin objetivo; `true` cuando el progreso iguala o supera el objetivo. |

## 6. Algoritmo en pseudocódigo

```text
CONSTANTES:
  MIN_GOAL_MINUTES = 1
  MAX_GOAL_MINUTES = 10080

FUNCIÓN parseGoalValue(raw):
  SI raw es número:
    SI es entero Y MIN_GOAL_MINUTES <= raw <= MAX_GOAL_MINUTES: DEVOLVER raw
    DEVOLVER nulo
  SI raw NO es texto: DEVOLVER nulo
  texto = recortar(raw)
  SI texto no cumple /^\d+$/: DEVOLVER nulo
  número = Number(texto)
  SI NO es entero O número < MIN_GOAL_MINUTES O número > MAX_GOAL_MINUTES: DEVOLVER nulo
  DEVOLVER número

FUNCIÓN getWeekStart(fecha):
  SI fecha no es texto: DEVOLVER nulo
  d = parseLocalDate(fecha)
  SI d es inválida: DEVOLVER nulo
  desplazamiento = (d.getDay() + 6) MOD 7      // lunes = 0, domingo = 6
  d.setDate(d.getDate() - desplazamiento)
  DEVOLVER formatLocalDate(d)

FUNCIÓN calculateWeekProgress(sessions, today):
  SI sessions no es lista: DEVOLVER 0
  SI today no es texto: DEVOLVER 0
  lunes = parseLocalDate(getWeekStart(today))
  hoy = parseLocalDate(today)
  SI lunes es inválida O hoy es inválida: DEVOLVER 0
  total = 0
  PARA CADA session EN sessions:
    SI session no es objeto O session.date no es texto: CONTINUAR
    fecha = parseLocalDate(session.date)
    SI fecha es inválida O fecha < lunes O fecha > hoy: CONTINUAR
    minutos = Number(session.minutes) O 0
    SI minutos > 0: total = total + minutos
  DEVOLVER max(total, 0)

FUNCIÓN calculatePercent(progress, goal):
  SI goal no es válido O progress no es finito O progress <= 0: DEVOLVER 0
  bruto = floor((progress / goal) * 100)
  DEVOLVER min(bruto, 100)

FUNCIÓN buildWeeklyGoal(sessions, rawGoal, today):
  progress = calculateWeekProgress(sessions, today)
  goal = parseGoalValue(rawGoal)
  SI goal es nulo:
    DEVOLVER { status: "no-goal", today, weekStart: getWeekStart(today),
               goal: nulo, progress, percent: 0, isComplete: falso }
  DEVOLVER { status: "goal", today, weekStart: getWeekStart(today), goal, progress,
             percent: calculatePercent(progress, goal), isComplete: progress >= goal }

FUNCIÓN formatMinutes(valor):
  SI valor no es finito O valor < 0: DEVOLVER "0"
  texto = String(valor)
  [entera, decimal] = separar texto por "."
  enteraAgrupada = agrupar(entera) en bloques de 3 desde la derecha, unidos por "."
  SI hay decimal: DEVOLVER enteraAgrupada + "," + decimal
  DEVOLVER enteraAgrupada

FUNCIÓN formatProgressText(progress, goal):
  DEVOLVER formatMinutes(progress) + " de " + formatMinutes(goal) + " min"
```

Notas del algoritmo:

- `parseLocalDate` construye la fecha con los componentes del texto
  (`new Date(año, mes - 1, día)`), nunca interpretando el texto como UTC ni pasando por
  `toISOString()`. Es deliberadamente la **misma** interpretación que hace `app.js` para la
  tarjeta: por eso fechas como `"2026-1-3"` se aceptan en ambos sitios y las imposibles
  (`"2026-02-30"`) se descartan en ambos.
- Los cálculos de fecha se hacen a medianoche local, igual que la tarjeta, para que el
  resultado sea idéntico día a día. El mediodía se reserva para otras piezas del proyecto.
- El filtro `fecha > hoy` va antes del acumulador: las sesiones futuras no llegan a sumar.
- `Number(minutos) || 0` y `> 0` replican la tolerancia de la tarjeta a datos corruptos.
- `buildWeeklyGoal` calcula el progreso aunque no haya objetivo: el bloque no lo muestra en
  ese estado, pero la estructura queda completa y comprobable.

## 7. Cálculo del progreso, el porcentaje y el estado

### 7.1 Equivalencia con la tarjeta "Minutos semana"

RF-5 exige que el bloque y la tarjeta muestren **siempre el mismo número**. Este plan no
toca `calculateWeekMinutes` (restricción de esta fase) y, por tanto, `calculateWeekProgress`
replica su tabla de reglas exactamente:

| Regla | `calculateWeekMinutes` (app.js) | `calculateWeekProgress` (lógica pura) |
| --- | --- | --- |
| Sesión nula o sin objeto | se ignora | se ignora |
| `date` que no es texto | se ignora | se ignora |
| Fecha no interpretable (`""`, `"abc"`, `"2026-02-30"`) | se ignora | se ignora |
| Fecha anterior al lunes de la semana | se ignora | se ignora |
| Fecha posterior a hoy | se ignora | se ignora |
| Minutos vacíos, `NaN`, `"abc"`, `0` o negativos | no suman | no suman |
| Varias sesiones del mismo día | suman | suman |
| Decimales válidos | se conservan | se conservan |
| Origen de "hoy" | `getTodayLocalDateString()` dentro de la función | parámetro `today` (RNF-11) |
| Resultado | número ≥ 0 | número ≥ 0 |

Mientras se mantenga esta tabla, los dos números son iguales. La duplicación es el precio
de no modificar la tarjeta; se documenta en §12 y se protege con la verificación manual de
la §14.3, que compara ambos números con un conjunto de datos que incluye sesiones futuras,
fechas descartadas, minutos corruptos y una semana que cruza de año.

### 7.2 Porcentaje

`P = min( floor( (X ÷ Y) × 100 ), 100 )`, entero, nunca negativo, nunca superior a 100.
Con objetivo entero y progreso ≥ 0, `P = 100` implica `X ≥ Y`, así que una barra llena
siempre significa objetivo cumplido y no hay ambigüedad visual.

| X | Y | (X ÷ Y) × 100 | P | Barra | Estado |
| --- | --- | --- | --- | --- | --- |
| 0 | 300 | 0 | 0 % | vacía | en progreso |
| 1 | 300 | 0,33 | 0 % | vacía | en progreso (CL-6) |
| 150 | 300 | 50 | 50 % | mitad | en progreso |
| 299 | 300 | 99,66 | 99 % | casi llena | en progreso |
| 300 | 300 | 100 | 100 % | llena | cumplido (CL-3) |
| 3.240 | 3.000 | 108 | 100 % | llena | cumplido (CL-4) |
| 1 | 3 | 33,33 | 33 % | un tercio | en progreso (CL-18) |
| 0 | 1 | 0 | 0 % | vacía | en progreso (CL-5) |

El texto mantiene siempre los minutos reales: con 3.240 de 3.000 se lee "3.240 de 3.000 min"
y "100 %".

### 7.3 Texto y formato

- Miles con punto y decimales con coma, sin redondear: `1.200`, `3.240,5`.
- Texto del progreso: `"1.200 de 3.000 min"` (RF-6).
- Porcentaje: entero seguido de espacio duro y `%` (`"50 %"`), para que el signo no quede
  solo en otra línea a 320 px. El espacio duro se ve igual que un espacio normal.
- El mensaje de cumplimiento es exactamente `"¡Objetivo cumplido!"`.
- Los mensajes de error son exactamente los de la spec:
  `"Introduce un número entero de minutos entre 1 y 10.080"` y
  `"No se ha podido guardar el objetivo"`.

### 7.4 Estados del bloque

| Estado | Cuándo | Contenido visible |
| --- | --- | --- |
| Sin objetivo | `status === "no-goal"` o valor guardado inválido | Título, "Aún no has fijado un objetivo semanal" y botón "Fijar objetivo". Sin barra, sin porcentaje, sin mensaje de cumplido. |
| En progreso | `status === "goal"` y `progress < goal` | Texto "X de Y min", porcentaje, barra proporcional, botones "Editar" y "Quitar". Sin mensaje de cumplido. |
| Cumplido | `status === "goal"` y `progress >= goal` | Texto con minutos reales, "100 %", barra llena, "¡Objetivo cumplido!" y los mismos botones. |

El editor es un cuarto estado **de interfaz**, no de negocio: sustituye temporalmente al
contenido del bloque mientras se introduce un valor.

## 8. Estructura HTML y estilos

### 8.1 Ubicación y esqueleto

La sección se coloca **después de `section.streak-section` y antes de
`section.heatmap-section`**, de modo que el orden del documento queda: tarjetas de resumen,
objetivo semanal, mapa de calor, formulario y lista (RF-13). El esqueleto es estático en
`index.html` y la interfaz solo muestra, oculta y rellena; así los textos de la spec se
pueden revisar sin ejecutar nada.

Contenido de la sección:

1. `section.goal-section` con `aria-labelledby` hacia el título y `tabindex="-1"` para poder
   recibir el foco cuando la acción de origen desaparece.
2. Título `h2`: "Objetivo semanal".
3. Estado sin objetivo: párrafo "Aún no has fijado un objetivo semanal" y botón "Fijar
   objetivo".
4. Estado con objetivo: línea de resumen con el texto del progreso y el porcentaje; barra
   de progreso con su relleno; mensaje de cumplimiento (siempre presente en el DOM, vacío
   cuando no procede); botones "Editar" y "Quitar".
5. Editor: formulario con etiqueta "Minutos por semana", texto de ayuda "Entre 1 y 10.080
   minutos", campo de texto, mensaje de error y botones "Guardar" y "Cancelar".
6. Aviso de guardado fallido: párrafo oculto por defecto, fuera del formulario.

Elementos e identificadores:

| Elemento | `id` | Notas |
| --- | --- | --- |
| Sección | `weeklyGoalSection` | `tabindex="-1"`, `aria-labelledby="weeklyGoalTitle"` |
| Título | `weeklyGoalTitle` | "Objetivo semanal" |
| Bloque sin objetivo | `goalEmpty` | Contenedor del mensaje y del botón |
| Botón fijar | `goalSetBtn` | "Fijar objetivo", `type="button"` |
| Bloque con objetivo | `goalProgress` | `hidden` en el estado sin objetivo |
| Texto del progreso | `goalProgressText` | "X de Y min" |
| Porcentaje | `goalPercent` | "P %" |
| Barra | `goalBar` | `role="progressbar"` + ARIA (§9) |
| Relleno de la barra | `goalBarFill` | Ancho en porcentaje; decorativo |
| Mensaje de cumplido | `goalDone` | `role="status"`, texto vacío si no procede |
| Botón editar | `goalEditBtn` | "Editar", `type="button"` |
| Botón quitar | `goalRemoveBtn` | "Quitar", `type="button"` |
| Formulario | `goalForm` | `novalidate` para controlar los mensajes en español |
| Campo de minutos | `goalMinutes` | `type="text"`, `inputmode="numeric"`, `autocomplete="off"` |
| Ayuda del campo | `goalMinutesHint` | "Entre 1 y 10.080 minutos" |
| Error de validación | `goalError` | `role="alert"`, `aria-describedby` desde el campo |
| Aviso de guardado | `goalSaveError` | `role="alert"`, oculto por defecto |

Orden de scripts en `index.html`: `heatmap-logic.js`, `heatmap-ui.js`,
`weekly-goal-logic.js`, `weekly-goal-ui.js`, `app.js`. Los dos nuevos son scripts clásicos;
`app.js` queda al final porque la interfaz usa sus funciones de datos solo al pintar.

### 8.2 Estilos

- Tarjeta blanca con el mismo radio, sombra y separación que las secciones existentes, para
  que el bloque parezca parte del producto y no un añadido.
- Título de 20 px en el mismo tono que los demás títulos; texto del progreso de 20 px en
  negrita para que se lea de un vistazo; porcentaje del mismo tamaño, alineado a la derecha
  cuando quepan en la misma línea y debajo cuando no.
- Barra: pista neutra con borde sutil, altura 12 px y esquinas redondeadas; relleno con el
  mismo degradado que los botones de la aplicación (identidad visual) y ancho igual a P.
  Sin transición ni animación (fuera de alcance).
- Estado cumplido: mismo relleno, texto en negrita y mensaje visible; el estado nunca se
  comunica solo con color.
- Botones con altura mínima 44 px y separación suficiente; el primario con el degradado de
  la casa y el secundario con borde.
- Foco visible en botones, campo y sección: contorno de 2 px con separación, perceptible
  sobre fondo blanco y sobre la barra.
- Errores y avisos con texto de al menos 14 px y color de contraste suficiente, sin
  depender de un icono.

### 8.3 Responsive

- Escritorio: tarjeta de 25 px de relleno, resumen en una línea y barra a todo el ancho.
- Hasta 600 px: relleno de 18 px, resumen con salto de línea permitido, botones que se
  reparten el ancho y se apilan si no caben, y separación inferior de 24 px.
- 375 px: todo el bloque visible sin recortes; el texto del progreso cabe en una o dos
  líneas y los botones siguen en una fila si el texto lo permite.
- 320 px: el contenedor deja 260 px útiles (320 − 24 de `body` − 36 de relleno). El texto
  "10.080 de 10.080 min" se reparte en dos líneas con `overflow-wrap`; los botones van a
  ancho completo si no caben lado a lado; la barra ocupa el 100 % del ancho disponible; el
  campo mide 16 px de letra para que iOS no amplíe la pantalla.
- Nada de anchos fijos en píxeles dentro del bloque: solo `min-width: 0`, porcentajes y
  `flex-wrap`, para que no aparezca desplazamiento horizontal.

## 9. Accesibilidad

- **Barra de progreso accesible**: el contenedor expone `role="progressbar"`,
  `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` igual a P,
  `aria-labelledby` hacia el título del bloque y `aria-valuetext` con el progreso real, el
  objetivo y el porcentaje: por ejemplo "1.200 de 3.000 minutos, 40 por ciento". Así el
  nombre, el rol y el valor se pueden comprobar en el árbol de accesibilidad (RNF-12) y,
  cuando X supera a Y, el valor accesible sigue comunicando los minutos reales aunque el
  relleno se recorte al 100 % (RF-15).
- **Texto siempre presente**: el texto "X de Y min" y el porcentaje no dependen de la barra
  ni del color; la barra es un refuerzo visual (RF-15, RNF-3).
- **Anuncio del cumplimiento**: el mensaje vive siempre en el DOM con `role="status"` y
  contenido vacío; al pasar al estado cumplido se le asigna el texto, de modo que el lector
  de pantalla lo anuncia sin mover el foco (RF-15). Si en la verificación con el lector de
  referencia no se anuncia, se mantiene visible el texto y se revisa la secuencia de
  actualización antes de cerrar RNF-12.
- **Foco visible** en todos los controles: contorno de 2 px con separación. El botón, el
  campo y la sección (cuando recibe el foco de retorno) tienen estilo propio de foco.
- **Gestión del foco**:
  - Al abrir el editor (fijar o editar), el foco va al campo de minutos.
  - Al cerrar el editor por guardado o cancelación, el foco vuelve al botón que lo abrió;
    si ese botón ya no existe (por ejemplo, "Fijar objetivo" después de guardar, o "Quitar"
    después de quitar), el foco va a la sección del objetivo, que por eso lleva
    `tabindex="-1"`.
  - Ante un error de validación, el foco va al campo, que recibe `aria-invalid="true"` y
    `aria-describedby` con el texto de ayuda y el mensaje de error.
- **Teclado**: todos los controles son `button`, `input` y `form` nativos; no se añaden
  manejadores de teclado propios ni atajos. El recorrido completo (fijar, editar, cancelar,
  quitar) se hace con Tab, Intro y Espacio.
- **Etiquetas y ayuda**: `label for` asociada al campo, texto de ayuda con el rango,
  `aria-describedby` y mensajes en español, sin jerga técnica.
- **Contraste**: texto principal `#2c3e50` sobre blanco (muy por encima de 4,5:1); relleno
  de la barra `#4f46e5` sobre pista `#edf0f4` (por encima de 3:1); bordes de controles con
  contraste suficiente frente al fondo. Se mide en la verificación, no se estima.
- **Objetivo táctil**: botones de al menos 44 × 44 px y sin solaparse entre sí ni con el
  texto (RNF-10).

## 10. Integración en `app.js`

Cambios mínimos y aditivos:

1. **Clave y accesos al almacenamiento**, junto a `STORAGE_KEY` y a las funciones de
   sesiones:
   - `GOAL_STORAGE_KEY = 'diarioEstudio_weeklyGoal'`.
   - `getGoalRawValue()`: devuelve el texto guardado o `null`; captura excepciones de
     `localStorage` y devuelve `null` para no romper la pantalla.
   - `saveGoalMinutes(minutes)`: normaliza con la lógica pura, escribe `String(canónico)`,
     relee y compara; si falla, intenta restaurar el valor anterior y devuelve `false`.
   - `clearGoalValue()`: elimina la clave, relee y devuelve si el borrado se ha hecho
     efectivo.
2. **Repintados**: en `init()` y en el manejador de envío del formulario de sesiones, una
   llamada a `renderWeeklyGoal()` justo después de `renderWeekMinutes()`, protegida con
   `typeof renderWeeklyGoal === 'function'`, igual que ya se hace con `renderHeatmap`.
3. **Nada más**: no se tocan `calculateStreak`, `calculateBestStreak`,
   `calculateWeekMinutes`, `renderStreak`, `renderWeekMinutes` (ni su formato),
   `renderSessions`, `saveSessions`, la validación del formulario de sesiones ni el mapa.

`app.js` sigue siendo la única capa que toca `localStorage`; la interfaz del objetivo le
pide los datos y le pide repintar la tarjeta, pero no escribe directamente.

## 11. Comportamiento del ciclo de pintado y del editor

### 11.1 `renderWeeklyGoal()`

1. Si la sección no existe en el DOM, termina sin errores (igual que los demás
   renderizadores).
2. Enlaza los eventos una sola vez (bandera de inicialización, como en `heatmap-ui.js`).
3. Lee objetivo, sesiones y fecha local; llama a `buildWeeklyGoal`.
4. Pinta el estado que toque y oculta los otros dos: sin objetivo, con objetivo o editor.
5. Si el editor está abierto, **no lo cierra ni pisa lo escrito**: un repintado externo
   (por ejemplo, registrar una sesión desde el otro formulario) no puede hacer perder el
   valor a medio escribir. El estado de fondo se actualiza igualmente y se verá al cerrar.
6. Limpia el aviso de guardado cuando el estado pasa a "guardado correcto" o a "cancelado".

### 11.2 Editor

| Acción | Comportamiento |
| --- | --- |
| "Fijar objetivo" | Abre el editor vacío, oculta el mensaje de "sin objetivo", enfoca el campo, limpia error y aviso. |
| "Editar" | Abre el editor con el objetivo actual sin separadores de miles, enfoca el campo, limpia error y aviso. |
| "Guardar" con valor válido | Guarda el canónico; si la escritura se verifica, cierra el editor, repinta desde el almacenamiento y devuelve el foco a la acción de origen o a la sección. |
| "Guardar" con valor inválido | No guarda nada, muestra "Introduce un número entero de minutos entre 1 y 10.080", marca el campo como inválido y le devuelve el foco. El objetivo anterior sigue intacto. |
| "Guardar" con el mismo valor | Se acepta sin error y el progreso no cambia visiblemente (CL-21). |
| Guardado rechazado por el navegador | No se aplica el valor nuevo, se conserva el anterior, se mantiene el editor abierto y se muestra "No se ha podido guardar el objetivo"; el resto de la pantalla no cambia (CL-19). |
| "Cancelar" | Descarta lo escrito, cierra el editor, conserva el objetivo anterior o el estado sin objetivo, limpia error y aviso y devuelve el foco. |
| "Quitar" | Elimina la clave y vuelve al estado sin objetivo en la misma pantalla, sin confirmación y sin tocar sesiones (RF-3). |
| Escribir en el campo | Borra el mensaje de error, como exige RF-10. |

### 11.3 Momentos del cálculo y repintado de la tarjeta

RF-9 fija tres momentos de recálculo: cargar la aplicación, registrar una sesión y fijar,
cambiar o quitar el objetivo. RF-5 exige que el bloque y la tarjeta "Minutos semana"
compartan el mismo número y la misma R en cada uno de esos momentos.

- En la carga y al registrar una sesión, `app.js` pinta primero la tarjeta con su
  renderizador actual y después el bloque; ambos toman la fecha local en ese instante.
- Al fijar, cambiar o quitar el objetivo, la interfaz invita a `app.js` a repintar la
  tarjeta con su propio renderizador antes de pintar el bloque. Así, si la aplicación llevaba
  abierta desde otro día, tarjeta y bloque vuelven a coincidir en el mismo instante en lugar
  de mostrar números distintos hasta la siguiente recarga.
- La tarjeta conserva su cálculo y su formato: solo se vuelve a ejecutar su renderizador
  existente, que ya es idempotente.
- No hay temporizadores: entre momentos de cálculo, R no cambia y el bloque mantiene la
  última semana calculada como foto congelada (CL-10, CL-24).

## 12. Decisiones técnicas y alternativas descartadas

| Decisión | Por qué | Alternativa descartada |
| --- | --- | --- |
| Lógica pura en `weekly-goal-logic.js` con IIFE y exportación CommonJS guardada | Permite `node --test` sin bundler y sigue funcionando con `file://`; cumple el artículo 3 de la constitución. | Módulos ES: no funcionan con doble clic. Lógica dentro de `app.js`: imposible probarla en Node sin DOM. Duplicar la lógica en los tests: se desincroniza. |
| Duplicar la tabla de reglas de "Minutos semana" en la lógica pura | Esta fase prohíbe modificar `calculateWeekMinutes`; la alternativa obligaba a tocar una función existente. La tabla se replica literalmente y se documenta en ambos sitios. | Hacer que `calculateWeekMinutes(sessions, today)` delegue en la lógica pura: elimina la duplicación, pero modifica una función que no toca esta spec. Queda propuesta como mejora futura. |
| Un único módulo de lógica y otro de interfaz, como en la spec 001 | Sigue el patrón ya aceptado del proyecto, mantiene `app.js` como capa de datos y deja el bloque fácil de revisar. | Todo en `app.js`: menos archivos, pero `app.js` crece y mezcla pintado con datos. Un solo archivo nuevo con lógica y DOM: rompe la separación y la testabilidad. |
| Guardar el objetivo como texto de dígitos en una clave propia | `getItem` devuelve texto; el valor canónico guardado coincide con el leído (RF-4) y RF-11 ya acepta ese formato. No toca las sesiones (RNF-5). | `JSON.stringify({ minutes })`: mismo resultado con más ruido. Guardar el objetivo dentro del array de sesiones: contamina el formato y arriesga las sesiones. Guardar la semana junto al objetivo: sería historial, fuera de alcance. |
| Campo `type="text"` con `inputmode="numeric"` | El valor del campo llega intacto y se puede aplicar la tabla de RF-10 tal cual ("3.000" o "1e3" se rechazan y se explican). `type="number"` sanea o rechaza caracteres por su cuenta y su valor puede no coincidir con lo tecleado. | `type="number"`: teclado numérico nativo, pero comportamiento distinto por navegador y validación enmascarada. `type="tel"`: teclado numérico sin semántica. |
| Validar solo al enviar | Lo pide RF-10; mientras se escribe solo se limpia el mensaje anterior. | Validación en cada pulsación: ruidosa, y contradice la spec. |
| Barra con `role="progressbar"` y ARIA explícita en lugar de `<progress>` | Permite un `aria-valuetext` con X, Y y P, y controlar el relleno con CSS en todos los navegadores. | `<progress>` nativo: estilo muy limitado por navegador y valor accesible menos expresivo. `aria-valuemax` igual al objetivo: menos fiable cuando X supera Y. |
| Sin animación en la barra | Está fuera de alcance y evita problemas de movimiento reducido. | Transición de ancho: no pedida y con riesgo de parecer "carga". |
| Esqueleto estático en `index.html` y solo mostrar/ocultar/rellenar | Los textos de la spec se pueden revisar sin ejecutar nada, el HTML documenta el bloque y el JS es más corto. | Construir todo el bloque desde JavaScript: más código y textos escondidos. |
| Repintar la tarjeta "Minutos semana" al cambiar el objetivo | RF-5 obliga a que ambos números coincidan en cada momento de cálculo de RF-9, también al fijar o quitar el objetivo. | Repintar solo el bloque: divergiría de la tarjeta si la aplicación llevaba abierta desde otro día. |
| Pruebas solo de la lógica pura; interfaz verificada manualmente con Chrome DevTools | La constitución exige probar la lógica con `node --test` sin paquetes y no hay entorno DOM sin dependencias. | Añadir jsdom: prohibido por "sin dependencias". Automatizar el navegador: fuera del stack del proyecto. |

## 13. Cobertura de requisitos

| RF | Dónde se cubre |
| --- | --- |
| RF-1 | Esqueleto de estados en `index.html`, apertura del editor y guardado en `weekly-goal-ui.js`; `parseGoalValue` valida el valor; tests de validación y verificación manual del primer uso. |
| RF-2 | Botón "Editar" con el valor actual sin separadores, guardado del valor nuevo y cancelación sin cambios en `weekly-goal-ui.js`; test de "mismo valor" y verificación manual. |
| RF-3 | Botón "Quitar" sin confirmación, borrado verificado y vuelta al estado sin objetivo; verificación manual de que no se toca ninguna sesión. |
| RF-4 | Clave propia, valor canónico, `saveGoalMinutes` con verificación por relectura y aviso de fallo; verificación manual incluyendo recarga y almacenamiento lleno simulado. |
| RF-5 | `calculateWeekProgress` con la tabla de reglas de la tarjeta (§7.1) y repintado conjunto en cada momento de cálculo (§11.3); tests de progreso y comparación manual de ambos números. |
| RF-6 | `calculatePercent`, `formatMinutes` y `formatProgressText` con tests; pintado del texto, porcentaje y barra en la interfaz; estilos de barra vacía, parcial y llena. |
| RF-7 | Estado "sin objetivo" con título, mensaje y botón; ocultación de barra, porcentaje y mensaje de cumplido; test de estructura y verificación visual. |
| RF-8 | `isComplete` en la lógica (igual y superior) y mensaje con `role="status"`; tests de CL-3, CL-4 y verificación del anuncio. |
| RF-9 | `today` como parámetro, un único momento de lectura por render, sin temporizadores; tests de semana nueva y verificación de la foto congelada. |
| RF-10 | `parseGoalValue` con la tabla completa de entradas y mensaje de error asociado al campo; tests y verificación manual de los límites 1 y 10.080. |
| RF-11 | Normalización y rechazo de valores guardados inválidos sin borrarlos ni tocar las sesiones; tests de CL-2, CL-23 y CL-25 y verificación con valores escritos a mano en `localStorage`. |
| RF-12 | Llamada a `renderWeeklyGoal()` tras registrar una sesión; test de progreso con una sesión nueva y verificación manual de la actualización sin recargar. |
| RF-13 | Orden del documento en `index.html` (tarjetas, objetivo, mapa, formulario, lista) y cero cambios en los demás indicadores; verificación visual y de `localStorage`. |
| RF-14 | Reglas responsive de §8.3, campo de 16 px y textos que se ajustan; medición real a 375 px y 320 px. |
| RF-15 | ARIA de la barra, `role="status"`, foco gestionado en editor y errores, etiqueta y ayuda del campo; comprobación en el árbol de accesibilidad y con teclado. |
| RNF-1 | Scripts clásicos, sin dependencias, sin conexión y con `localStorage` local. |
| RNF-2 | Una pasada sobre las sesiones por render y pintado de pocos nodos; medición con 1.000 sesiones. |
| RNF-3 | Paleta con contraste medido, foco visible y estados distinguibles por texto. |
| RNF-4 | `flex-wrap`, anchos relativos y pruebas a 375 px y 320 px sin scroll horizontal. |
| RNF-5 | El objetivo no escribe en `diarioEstudio_sessions`; verificación del almacenamiento antes y después. |
| RNF-6 | Fechas locales con componentes, sin `toISOString()`; tests con `TZ=Europe/Madrid` y semanas que cruzan año. |
| RNF-7 | Sin migraciones: la ausencia de la clave nueva deja el estado sin objetivo y todo lo demás funciona. |
| RNF-8 | Textos en español y formato de miles solo en el bloque; la tarjeta, la racha y la lista mantienen su formato. |
| RNF-9 | Tres estados con textos propios y observables (§7.4). |
| RNF-10 | Botones de 44 px y separación suficiente; medición en móvil. |
| RNF-11 | Todas las funciones puras reciben datos y `today`; cero reloj interno en la lógica. |
| RNF-12 | Nombre, rol y valor de la barra y anuncio del mensaje comprobados en el árbol de accesibilidad y con un lector de referencia. |

## 14. Estrategia de tests con `node --test`

### 14.1 Estructura y ejecución

- Un único archivo nuevo: `tests/weekly-goal-logic.test.js`, junto al existente
  `tests/heatmap-logic.test.js`.
- Se usan los módulos integrados `node:test` y `node:assert/strict`; no se instala nada.
- Se ejecuta con `node --test` desde la raíz del proyecto. Node descubre el archivo por su
  sufijo `.test.js`.
- `weekly-goal-logic.js` se importa con `require`; la exportación CommonJS está guardada
  para que el mismo archivo funcione como script de navegador.
- No hay `package.json` ni configuración adicional: el proyecto sigue sin build.
- Cada prueba pasa `today` y el objetivo de forma explícita; ninguna depende de la fecha
  real del sistema, del DOM ni del almacenamiento.
- La suite actual de 21 tests debe seguir en verde: la lógica nueva no modifica
  `heatmap-logic.js`.

### 14.2 Casos por requisito

| Grupo | Casos |
| --- | --- |
| Módulo | Carga correcta y constantes `MIN_GOAL_MINUTES = 1` y `MAX_GOAL_MINUTES = 10080`. |
| RF-10 / RF-11 (validación) | Tabla completa de RF-10: aceptar "300", " 300 ", "0300", "1", "10080"; rechazar "3.000", "+300", "-300", "1e3", "3E2", "300,0", "300.0", "0", "10081", "", " ", "abc". Valores no texto (`null`, `undefined`, `NaN`, `Infinity`, `true`, objetos) y números no enteros o fuera de rango. Aceptación del objetivo guardado como número y como texto (CL-25). |
| RF-5 / RF-9 (progreso) | Semana de lunes a domingo; hoy lunes solo cuenta el lunes; sesiones antes del lunes no suman; sesiones futuras dentro de la semana no suman; varias sesiones del mismo día suman; orden irrelevante; minutos vacíos, no numéricos, cero y negativos no suman; decimales conservados; fecha no interpretable ignorada; progreso nunca negativo; semana que cruza de año; `today` inválido devuelve 0. |
| RF-6 / RF-8 (porcentaje y estado) | 0 de 300; 1 de 300 → 0 %; 150 de 300 → 50 %; 299 de 300 → 99 %; 300 de 300 → 100 % y cumplido; 3.240 de 3.000 → 100 %, cumplido y minutos reales; 1 de 3 → 33 %; objetivo 1 con muchas horas; sin objetivo → sin porcentaje ni cumplimiento. |
| RF-6 (formato) | `formatMinutes`: 0, 1, 999, 1.000 → "1.000", 10.080 → "10.080", 3.240,5 → "3.240,5", valores no finitos o negativos → "0". `formatProgressText`: "1.200 de 3.000 min". |
| RF-7 / RF-11 | Sin valor guardado y con valor inválido ("0", "abc", "1.5", "3.000", "", "10081") → `status === "no-goal"`, `goal === null`, `percent === 0`, `isComplete === false`. |
| RNF-6 | DST en ambos sentidos y semana que cruza de año, ejecutando también `TZ=Europe/Madrid node --test`. |
| Robustez | `sessions` vacío, `null`, no array, con entradas `null`, sin `date`, con `date` numérico, con `minutes` texto/`NaN`/negativos; la función no debe lanzar. |
| Pureza | La lógica no usa `localStorage`, `document`, `Date.now` ni `toISOString`; las pruebas no definen esos globales y todas pasan. |
| Determinismo | La misma entrada y la misma `today` producen siempre el mismo resultado, sin importar la hora de ejecución. |

### 14.3 Verificación manual con Chrome DevTools

Se ejecuta cuando los tests de lógica están en verde, según la constitución y `AGENTS.md`:

- Abrir `index.html` por `file://` y comprobar que la consola no muestra errores.
- **Sin objetivo** (clave nueva borrada): título, mensaje y botón "Fijar objetivo"; sin
  barra, sin porcentaje y sin mensaje de cumplido.
- **Fijar**: abrir el editor, comprobar el foco en el campo, guardar un valor y ver el
  progreso calculado con las sesiones ya existentes.
- **Editar**: comprobar que el campo muestra el valor actual sin separadores; guardar el
  mismo valor (sin cambios visibles) y otro distinto (recálculo inmediato).
- **Cancelar**: comprobar que no cambia nada ni se guarda.
- **Quitar**: vuelta al estado sin objetivo, sin confirmación y con las sesiones intactas.
- **Validación**: probar "0", "10081", "3.000", "abc", "+300", vacío y "1e3"; comprobar el
  mensaje, el foco en el campo y que el objetivo anterior sobrevive.
- **Cumplido**: fijar un objetivo menor que los minutos de la semana; comprobar barra
  llena, 100 %, mensaje y botones disponibles.
- **Registrar sesión**: comprobar que el bloque se actualiza sin recargar y que su número
  coincide con la tarjeta "Minutos semana".
- **Coincidencia con la tarjeta**: con un conjunto de datos que incluya sesiones futuras,
  fechas imposibles, minutos corruptos, sesiones de semanas anteriores y una semana a
  caballo entre dos años, comparar el número del bloque con el de la tarjeta.
- **Foto congelada**: sustituir temporalmente `getTodayLocalDateString` en la consola para
  simular otra R, repintar, y comprobar que bloque y tarjeta comparten el mismo número y que
  no existe ningún temporizador que cambie el bloque solo (inspección de
  `setTimeout`/`setInterval` en el código nuevo).
- **Escritorio, 375 px y 320 px**: sin scroll horizontal (`scrollWidth === clientWidth`),
  botones completos dentro del viewport, textos sin cortarse y campo de 16 px.
- **Teclado**: recorrido completo con Tab, Intro y Espacio; foco visible; retorno del foco
  al botón de origen o a la sección.
- **Árbol de accesibilidad**: la barra aparece con rol de barra de progreso, nombre y valor
  con X, Y y P; el mensaje de cumplimiento se anuncia sin robar el foco.
- **Contraste**: medir texto del bloque, relleno de la barra y bordes de controles.
- **Datos intactos**: comparar `diarioEstudio_sessions` antes y después de todo el
  recorrido; comprobar que la lista de sesiones, la racha, la mejor racha y el mapa no
  cambian.
- **Rendimiento**: cargar 1.000 sesiones y medir el repintado completo (menos de 100 ms).

### 14.4 Puerta de calidad

- No se empieza la interfaz hasta que toda la lógica esté en verde.
- Cualquier caso límite nuevo que aparezca durante la implementación se añade primero como
  test en rojo y luego se resuelve.
- No se aceptan tests con la fecha real, zonas horarias implícitas ni dependencias externas.
- La suite completa (21 tests actuales + los nuevos) debe estar en verde antes de dar por
  cerrada cada tarea.

## 15. Decisiones sobre puntos que la spec no fija

Estas concreciones permiten implementar sin contradecir la spec; si alguna no encaja con la
intención del producto, debe volver a la spec antes de escribir código (artículo 2).

- **Repintado mientras el editor está abierto**: si se registra una sesión con el editor del
  objetivo abierto, el editor no se cierra ni se pisa lo escrito; el estado de fondo se
  actualiza y se ve al cerrar.
- **Guardado fallido**: el editor permanece abierto con el aviso visible para poder
  reintentar; el objetivo anterior sigue siendo el vigente.
- **Borrado que el navegador no aplica**: si tras quitar el objetivo la clave sigue
  existiendo, el bloque mantiene el objetivo y muestra el aviso de guardado, porque mostrar
  un objetivo como borrado cuando sigue guardado sería mentir sobre los datos. Es un caso
  extremo fuera de la spec; conviene confirmarlo antes de implementar.
- **Formato del porcentaje**: entero, espacio duro y `%` ("50 %"), tal como escriben los
  ejemplos de la spec; el espacio duro evita que el signo quede suelto al final de línea.
- **Reapertura del editor**: "Editar" no selecciona el texto del campo, solo coloca el foco,
  para no borrar el valor actual por accidente.
- **Doble clic en "Guardar"**: el formulario se envía una sola vez; guardar el mismo valor
  dos veces es inocuo y no muestra error (CL-21).
- **Aviso de guardado del objetivo y aviso de validación**: son mensajes distintos y
  excluyentes; al abrir el editor o cancelar se limpian ambos.

## 16. Orden de trabajo

1. Confirmar con el usuario los archivos nuevos (§2.1) antes de crearlos.
2. Escribir los tests de la lógica pura y ponerlos en verde (validación, progreso,
   porcentaje, formato, estado y casos límite).
3. Crear la sección en `index.html` con los tres estados y cargar los scripts en orden.
4. Aplicar los estilos, el foco, la barra y los ajustes responsive.
5. Implementar `weekly-goal-ui.js`: pintado de estados y editor con validación y foco.
6. Añadir a `app.js` la clave, los accesos al almacenamiento y las dos llamadas de
   repintado, incluido el repintado de la tarjeta al cambiar el objetivo.
7. Verificar en Chrome DevTools a escritorio, 375 px y 320 px, incluida la accesibilidad.
8. Actualizar `MEMORY.md` con estado, decisiones y aprendizajes.

## 17. Riesgos y puntos de atención

- **Divergencia con la tarjeta**: es el riesgo principal y el fallo que la spec describe como
  grave. La lógica replica la tabla de reglas de la tarjeta y la verificación manual compara
  los dos números con datos hostiles. Si en el futuro cambia `calculateWeekMinutes`, hay que
  cambiar también `calculateWeekProgress` en el mismo commit.
- **Duplicación de la regla de la semana**: aceptada por la restricción de no tocar la
  tarjeta. Eliminarla del todo exige que `calculateWeekMinutes` delegue en la lógica pura;
  es una mejora de pocas líneas que conviene proponer al usuario al terminar.
- **Ventana de medianoche**: la tarjeta y el bloque toman la fecha local en dos llamadas
  consecutivas. Si la medianoche cae exactamente entre ambas, podrían mostrar números
  distintos hasta el siguiente repintado; solo se evita unificando la fuente de "hoy", lo
  que exige tocar la tarjeta.
- **320 px**: es la zona más frágil. Si al medir hay scroll horizontal o los botones se
  salen, hay que resolverlo en el CSS del bloque, no reescribiendo la spec.
- **Anuncio del cumplimiento**: algunos lectores no anuncian regiones que pasan de oculto a
  visible. Si ocurre, se mantiene el texto siempre visible y se revisa RNF-12 antes de
  cerrar.
- **`localStorage` bloqueado o lleno**: el guardado devuelve `false` y el bloque avisa sin
  romper el resto de la pantalla; conviene probarlo simulando un error en la consola.
- **Campo numérico**: al ser `type="text"`, un usuario puede teclear separadores; el mensaje
  de error debe dejar claro que no se admiten y el rango válido.
- **Pérdida de foco al quitar**: "Quitar" desaparece tras la acción; sin el foco de retorno
  a la sección, el teclado se quedaría al principio del documento.
- **Texto largo**: "10.080 de 10.080 min" junto al porcentaje es el peor caso; debe envolver
  sin desbordar ni empujar la barra.


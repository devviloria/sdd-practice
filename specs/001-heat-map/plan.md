# Plan técnico — 001 Mapa de calor de estudio

Documento de implementación para `specs/001-heat-map/spec.md`. No contiene código:
describe archivos, responsabilidades, lógica pura, algoritmo, pintado, decisiones y
pruebas.

## 1. Principios que guían el plan

- **Lógica pura y separada** de DOM y almacenamiento; todas las funciones de cálculo
  reciben `today` como parámetro (constitución, artículo 3).
- **Sin dependencias, sin build y sin módulos ES**: scripts clásicos que funcionan con
  doble clic sobre `index.html` (artículo 1).
- **Tests primero y como puerta**: la lógica se prueba con `node --test`; no se avanza a
  la interfaz con tests en rojo (artículo 4).
- **Datos intactos**: no se cambia el formato guardado, no se escribe desde el mapa y no
  se pierde ninguna sesión (artículo 5).
- **Fechas locales**: nada de `toISOString()` ni de interpretar `"AAAA-MM-DD"` como UTC
  (artículos 5 y 6 de la spec).
- **Código en inglés; interfaz y documentación en español** (artículo 6).

## 2. Archivos que se crean o modifican

| Archivo | Estado | Responsabilidad | RF que cubre |
| --- | --- | --- | --- |
| `heatmap-logic.js` | Crear | Única fuente de verdad del cálculo: fechas, rango de 84 días, suma por día, niveles, exclusión de futuros, estado vacío y marca de hoy. Sin DOM, sin `localStorage`, sin estado global mutable. Exportación compatible con navegador y con `require` de Node mediante un guardado de exportación CommonJS. | RF-1, RF-2, RF-3, RF-6 (cálculo), RF-7, RF-8, RF-9 (orden), RF-12 (señal de hoy), RNF-2, RNF-6, RNF-7 |
| `heatmap-ui.js` | Crear | Capa de presentación: construye la cuadrícula, la leyenda, el rango, el mensaje vacío y el tooltip; gestiona cursor, foco, toque, teclado y posicionamiento. No calcula niveles ni fechas de negocio: consume el resultado de `heatmap-logic.js`. | RF-4, RF-5, RF-6 (repintado), RF-9 (etiquetas), RF-10, RF-11, RF-12 (realce), RNF-3, RNF-4, RNF-9, RNF-10 |
| `index.html` | Modificar | Añadir la sección del mapa entre las tarjetas de resumen y el formulario, y cargar los dos scripts nuevos antes de `app.js` en el orden correcto. | RF-5, RF-9, RF-11, RF-12 |
| `styles.css` | Modificar | Estilos de la sección, cuadrícula de 12 semanas, cinco estados visuales (nivel 0 a 4), día futuro, día de hoy, foco, leyenda, tooltip y ajustes responsive de 375 px y 320 px. | RF-4, RF-5, RF-10, RF-11, RF-12, RNF-3, RNF-4, RNF-9, RNF-10 |
| `app.js` | Modificar mínimamente | Invocar el repintado del mapa en el arranque y después de guardar una sesión, junto a los repintados existentes. No se toca la lectura, la escritura ni el formato de datos. | RF-6 |
| `tests/heatmap-logic.test.js` | Crear | Pruebas automáticas de toda la lógica pura con `node:test` y `node:assert/strict`. | Puerta de la constitución; RF-1, RF-2, RF-3, RF-7, RF-8, RF-9, RF-12 y casos límite |
| `MEMORY.md` | Modificar al terminar | Registrar estado, decisiones y aprendizajes de la implementación. | Proceso del proyecto |

No se crean `package.json`, carpetas de build ni archivos de configuración de test. No se
modifican la spec ni el formato de `diarioEstudio_sessions`.

## 3. Flujo de datos y separación de capas

1. `app.js` obtiene las sesiones con `getSessions()` y la fecha local con
   `getTodayLocalDateString()`.
2. `app.js` (o el arranque de `heatmap-ui.js`) llama a `renderHeatmap()`, que pasa ambos
   valores a la lógica pura.
3. `heatmap-logic.js` devuelve una estructura de datos ya resuelta: rango, columnas de
   días, minutos, nivel, marcas de futuro y de hoy, y estado vacío.
4. `heatmap-ui.js` solo transforma esa estructura en elementos de interfaz y gestiona
   interacción y textos. La única dependencia externa que lee es la que recibe `app.js`.
5. Tras registrar una sesión, `app.js` guarda como siempre y vuelve a llamar a
   `renderHeatmap()`; el mapa se recalcula desde cero.

Consecuencia: `heatmap-logic.js` puede probarse en Node sin navegador, sin DOM y sin
almacenamiento, y la interfaz no duplica reglas de negocio.

## 4. Funciones puras de lógica

Todas viven en `heatmap-logic.js`, no leen estado global y reciben `today` cuando el
cálculo lo necesita.

| Función | Entrada → salida | Responsabilidad | RF |
| --- | --- | --- | --- |
| `isValidDateString` | valor → booleano | Validar `"AAAA-MM-DD"` con comprobación de ida y vuelta, para rechazar fechas imposibles como el 30 de febrero. | RF-1, CL-7 |
| `parseLocalDate` | `"AAAA-MM-DD"` → fecha local | Construir la fecha al mediodía local (12:00) a partir de los componentes del texto, para que ningún salto de horario de verano mueva el día; nunca interpreta el texto como UTC. | RNF-6, CL-9 |
| `formatLocalDate` | fecha → `"AAAA-MM-DD"` | Formatear con componentes locales, sin `toISOString()`. | RNF-6 |
| `addDays` | `"AAAA-MM-DD"`, entero → `"AAAA-MM-DD"` | Sumar o restar días de calendario conservando la fecha local. | RF-1, RF-8, CL-8, CL-9 |
| `startOfWeek` | `"AAAA-MM-DD"` → `"AAAA-MM-DD"` | Devolver el lunes de la semana de una fecha (domingo retrocede seis días). | RF-1, RF-9 |
| `toMinutes` | valor → número ≥ 0 | Normalizar minutos: no numéricos, vacíos, negativos o no finitos se convierten en 0; los decimales válidos se conservan. | RF-2, CL-6 |
| `getIntensityLevel` | número ≥ 0 → 0…4 | Aplicar los umbrales 1–29, 30–59, 60–119 y 120+. | RF-3, CL-4, CL-11 |
| `sumMinutesByDate` | sesiones, inicio, fin, `today` → mapa fecha → minutos | Sumar por día, ignorar fechas inválidas, fuera del rango y futuras. | RF-2, RF-6, RF-8, CL-5, CL-6, CL-7, CL-15 |
| `buildHeatmap` | sesiones, `today`, semanas → estructura completa | Orquestar rango, columnas, niveles, marcas de hoy/futuro, actividad y estado vacío. | RF-1, RF-2, RF-3, RF-7, RF-8, RF-9, RF-12 |

La estructura devuelta por `buildHeatmap` contiene, como mínimo:

- `start` y `end`: primer lunes y último domingo del periodo visible.
- `columns`: 12 columnas, cada una con 7 días ordenados de lunes a domingo.
- Cada día: `date`, `minutes`, `level` (0–4), `isFuture`, `isToday` y su índice de día de
  la semana.
- `hasActivity`: si hay al menos un día con nivel mayor que 0.
- `emptyState`: `null`, `"no-sessions"` o `"no-recent"`.
- `today`: el valor recibido, sin recalcularlo internamente.

## 5. Algoritmo del mapa en pseudocódigo

```text
CONSTANTES:
  WEEKS = 12
  DAYS_PER_WEEK = 7
  TOTAL_DAYS = WEEKS * DAYS_PER_WEEK   // 84

FUNCIÓN buildHeatmap(sessions, today):
  SI today no es una fecha válida:
    DEVOLVER estructura vacía defensiva con emptyState "no-sessions"

  start = addDays(startOfWeek(today), -(WEEKS - 1) * DAYS_PER_WEEK)
  end   = addDays(start, TOTAL_DAYS - 1)

  totals = mapa vacío
  hasAnyValidSession = falso

  PARA CADA session EN sessions:
    SI session no es objeto O su date no es una fecha válida:
      CONTINUAR
    hasAnyValidSession = verdadero
    SI date < start O date > end O date > today:
      CONTINUAR
    totals[date] = totals[date] + toMinutes(session.minutes)

  columns = lista vacía
  PARA week DESDE 0 HASTA WEEKS - 1:
    column = lista vacía
    PARA weekday DESDE 0 HASTA DAYS_PER_WEEK - 1:
      date = addDays(start, week * 7 + weekday)
      minutes = totals[date] O 0
      isFuture = date > today
      level = SI isFuture ENTONCES 0 SINO getIntensityLevel(minutes)
      day = { date, minutes, level, isFuture, isToday: date == today, weekday }
      AÑADIR day A column
    AÑADIR column A columns

  hasActivity = existe algún day con level > 0
  emptyState = nulo
  SI NO hasActivity:
    emptyState = SI hasAnyValidSession ENTONCES "no-recent" SINO "no-sessions"

  DEVOLVER { start, end, columns, hasActivity, emptyState, today }

FUNCIÓN getIntensityLevel(minutes):
  SI minutes <= 0: DEVOLVER 0
  SI minutes < 30: DEVOLVER 1
  SI minutes < 60: DEVOLVER 2
  SI minutes < 120: DEVOLVER 3
  DEVOLVER 4

FUNCIÓN startOfWeek(date):
  offset = (díaDeLaSemana(date) + 6) MOD 7   // lunes = 0, domingo = 6
  DEVOLVER addDays(date, -offset)
```

Notas del algoritmo:

- La comparación de fechas se hace sobre cadenas `"AAAA-MM-DD"` ya validadas; así se evita
  cualquier conversión implícita a UTC.
- Los minutos de sesiones futuras no llegan a sumarse: el filtro `date > today` está antes
  del acumulador.
- El estado vacío distingue si existe alguna sesión válida guardada, aunque esté fuera del
  periodo o sea futura: en ese caso el mensaje es el de "sin sesiones en las últimas 12
  semanas", nunca el de "aún no hay sesiones".
- El periodo es siempre `[start, today]` para actividad; la cuadrícula se dibuja hasta
  `end` para que las 12 semanas existan completas.

## 6. Cómo se pinta en la interfaz

### 6.1 Ubicación y estructura

La sección se coloca **después de las tarjetas de resumen y antes del formulario**, para
que el mapa sea lo primero que contextualiza la actividad sin competir con el registro.

Contenido de la sección:

1. Título: "Actividad de las últimas 12 semanas".
2. Rango textual del periodo, por ejemplo "2 sep – 29 nov 2026"; si el periodo cruza de
   año, "23 dic 2025 – 15 mar 2026".
3. Cuadrícula de 12 columnas (semanas) por 7 filas (lunes a domingo).
4. Columna de etiquetas verticales con "lun", "mié" y "vie" en sus filas.
5. Mensaje de estado vacío, visible solo cuando corresponde, sin ocultar la cuadrícula.
6. Leyenda permanente: cuatro muestras de color de nivel 1 a 4, con "Menos" a la izquierda
   y "Más" a la derecha.
7. Un único tooltip compartido, oculto por defecto, reutilizado por todas las celdas.

### 6.2 Cuadrícula y orden

- La cuadrícula es un contenedor con 12 columnas y 7 filas.
- El orden del DOM es **cronológico**: primero la semana más antigua, dentro de ella de
  lunes a domingo, y así hasta la semana actual. La disposición visual usa columnas, de
  modo que el orden de tabulación coincide con el orden cronológico sin cálculos extra.
- Cada día no futuro es un botón nativo, para obtener foco, activación por teclado y toque
  sin añadir manejadores de teclado propios. Los días futuros se renderizan como botones
  deshabilitados: conservan su nombre accesible pero no reciben foco ni responden al
  toque.

### 6.3 Estados visuales

- Nivel 0: tono neutro de superficie, claramente distinto del nivel 1.
- Niveles 1 a 4: cuatro tonos del mismo color, cada vez más oscuros y con contraste
  suficiente frente al fondo de la sección.
- Día futuro: atenuado y siempre en nivel 0, aunque existan sesiones con esa fecha.
- Día de hoy: realce propio (anillo o contorno con separación) independiente del nivel;
  debe seguir viéndose si hoy tiene nivel 4 y si hoy no tiene sesiones. Se acompaña de
  `aria-current="date"`.
- Foco: contorno visible de al menos 2 px con separación, perceptible sobre los cinco
  fondos posibles.
- La leyenda no incluye el nivel 0 para respetar los "cuatro niveles" de la spec; el nivel
  0 se explica mediante el texto "Sin estudio" del tooltip.

### 6.4 Tooltip e interacción

- Un solo tooltip para toda la cuadrícula. Contenido: fecha larga en español y minutos;
  si no hay estudio, "Sin estudio"; no muestra la lista de sesiones.
- Ratón: aparece al entrar en una celda y desaparece al salir.
- Teclado: aparece al recibir foco y desaparece al perderlo; el foco se mantiene visible.
- Toque: un toque muestra el detalle y lo fija; un segundo toque en la misma celda, un
  toque fuera de la cuadrícula o `Escape` lo oculta. Tocar otra celda mueve el detalle.
- La detección de ratón frente a toque se basa en la capacidad del dispositivo
  (`hover: hover` y puntero fino), no en el tamaño de la pantalla, para no romper equipos
  híbridos.
- Posicionamiento: el tooltip se coloca preferentemente encima de la celda, se cambia
  debajo si no cabe y se limita horizontalmente a los bordes de la ventana. Se oculta al
  hacer scroll o al redimensionar para evitar que quede desalineado.
- Si hay foco y luego toque, gana la última interacción (CL-17).

### 6.5 Etiquetas y accesibilidad

- Nombre accesible de cada día: fecha completa, minutos y, si procede, "hoy" o "día
  futuro". Ejemplos: "lunes, 2 de noviembre de 2026: 45 minutos"; "martes, 3 de noviembre
  de 2026, día futuro: 0 minutos". Así se cumplen a la vez RF-5 y RF-10.
- La cuadrícula se agrupa con un nombre accesible que la relaciona con el título de la
  sección.
- La leyenda y el rango son texto real, no imágenes.
- El estado vacío se anuncia como texto visible; no se usa solo el color para comunicar
  actividad.

### 6.6 Responsive

- A 375 px: la sección usa un padding horizontal reducido; la columna de etiquetas y las
  separaciones se ajustan para que las 12 semanas quepan sin scroll horizontal y cada
  celda mantenga al menos 24 × 24 px.
- A 320 px: la sección pasa a ocupar el ancho completo de la ventana (sin el padding del
  contenedor), reduce la columna de etiquetas y las separaciones, y mantiene el objetivo
  táctil de 24 px. Es la combinación más ajustada del diseño y se valida midiendo el ancho
  real de cada celda en el navegador.
- Entre 375 px y escritorio, la cuadrícula crece de forma fluida sin superar el ancho de
  la tarjeta.
- El tooltip no provoca scroll horizontal ni se recorta en los bordes.

## 7. Integración con la aplicación existente

- `index.html` carga, en este orden: `heatmap-logic.js`, `heatmap-ui.js`, `app.js`. Los
  dos primeros son scripts clásicos; el orden garantiza que `renderHeatmap` exista cuando
  `app.js` inicializa.
- `heatmap-ui.js` expone una función global `renderHeatmap()` que:
  1. lee las sesiones y la fecha local mediante las funciones ya existentes de `app.js`;
  2. llama a `buildHeatmap`;
  3. actualiza rango, celdas, mensaje y leyenda;
  4. conserva el tooltip cerrado tras un repintado.
- `app.js` añade una llamada a `renderHeatmap()` en la inicialización y otra tras guardar
  una sesión, junto a `renderStreak()` y `renderSessions()`. No se altera ninguna otra
  función.
- El mapa es de solo lectura: no llama a `saveSessions`, no modifica `localStorage` y no
  toca los indicadores existentes.
- Si la sección no existe en el DOM, `renderHeatmap` termina sin errores, igual que hacen
  los renderizadores actuales.

## 8. Decisiones técnicas y alternativas descartadas

| Decisión | Por qué | Alternativa descartada |
| --- | --- | --- |
| Módulo de lógica separado en un script clásico con exportación CommonJS guardada | Permite `node --test` sin bundler y sigue funcionando con `file://`; cumple la separación lógica/interfaz. | Módulos ES: no funcionan con doble clic. Lógica dentro de `app.js`: imposible probarla en Node sin DOM. Duplicar lógica en los tests: se desincroniza. |
| Datos derivados en cada render, sin guardar niveles | Los niveles siempre reflejan las sesiones reales y no se añade nada al formato guardado. | Persistir el nivel por día: duplica la verdad, se queda obsoleto y arriesga los datos. |
| Rango fijo de 12 semanas definido como constante | Es la decisión de la spec y evita estado configurable. | Selector de rango: fuera de alcance. |
| Fechas como cadenas `"AAAA-MM-DD"` y fechas locales al mediodía para operar | Evita interpretaciones UTC y saltos de horario de verano; las comparaciones son estables. | Aritmética en UTC: choca con la constitución. Medianoche local: algunos cambios de hora ocurren a medianoche. |
| Validación de fecha por ida y vuelta | Detecta fechas imposibles que un simple patrón aceptaría. | Solo expresión regular: dejaría pasar el 30 de febrero. |
| Reconstruir las 84 celdas en cada repintado | 84 elementos son baratos; el código es simple y no hay estado incremental que sincronizar. | Actualización incremental del DOM: más compleja, sin beneficio medible. |
| Botones nativos para cada día | Foco, teclado, toque y activación gratis; menos código propio. | Celdas no interactivas con manejadores manuales: más accesibilidad que mantener. |
| Tabulación nativa por todas las celdas no futuras | Cumple RF-10 sin añadir navegación con flechas. | Roving tabindex con flechas: mejor para 84 celdas, pero añade comportamiento no pedido. |
| Un tooltip compartido y posicionado | Da el mismo comportamiento en ratón, teclado y toque, y permite controlar los bordes. | `title` nativo: no se controla, no funciona igual en táctil y no cumple el detalle al enfocar. Un panel fijo: cambia más la interfaz y aleja el detalle de la celda. |
| Rango textual con `Intl` y sin etiquetas de mes sobre columnas | A 375 px las etiquetas de mes saturarían; la spec solo exige el rango y las iniciales de días. | Etiquetas de mes por columna: riesgo de solapamiento y de scroll. |
| Colores del mismo tono con cuatro pasos de luminosidad | Sigue RF-4 y permite ordenar la intensidad visualmente. | Colores de distinta familia: más distinguibles, pero incumplen "mismo color". |
| Sección a ancho completo solo en pantallas muy estrechas | Es la única forma de mantener 24 px de objetivo táctil sin scroll a 320 px con etiquetas. | Celdas de 20 px: incumple RNF-10. Scroll horizontal: incumple RNF-4 y CL-14. Ocultar etiquetas: incumple RF-9. |
| Pruebas solo de la lógica pura en Node; interfaz verificada manualmente con Chrome DevTools | La constitución exige probar la lógica con `node --test` sin paquetes; no hay entorno DOM sin dependencias. | Añadir jsdom o similar: prohibido por "sin dependencias". Probar el DOM con un navegador automatizado: fuera del alcance y del stack. |

## 9. Cobertura de requisitos

| RF | Dónde se cubre |
| --- | --- |
| RF-1 | `buildHeatmap`, `startOfWeek`, `addDays`; tests de 84 días, inicio en lunes y última semana. |
| RF-2 | `sumMinutesByDate`; tests de suma por día y de día sin sesiones. |
| RF-3 | `getIntensityLevel`; tests de umbrales exactos y clases visuales de nivel. |
| RF-4 | Paleta de cinco estados en `styles.css` y asignación de clase en `heatmap-ui.js`; verificación visual y de contraste. |
| RF-5 | Tooltip compartido, leyenda y textos en `heatmap-ui.js`; verificación manual de cursor, foco y toque. |
| RF-6 | `app.js` vuelve a llamar a `renderHeatmap` tras guardar; test puro de recálculo con una sesión nueva. |
| RF-7 | `emptyState` en `buildHeatmap`, mensajes en `heatmap-ui.js`; tests de los tres estados. |
| RF-8 | Filtro de futuros en `sumMinutesByDate` y `isFuture` en cada día; tests y verificación visual. |
| RF-9 | Orden de columnas y filas en `buildHeatmap`, rango con `Intl` y etiquetas de días en la interfaz; tests de orden y verificación visual. |
| RF-10 | Botones nativos, nombres accesibles, orden del DOM y estilos de foco; verificación con teclado. |
| RF-11 | CSS responsive; verificación a 375 px sin scroll horizontal. |
| RF-12 | `isToday` en la estructura y realce con `aria-current`; test y verificación visual. |
| RNF-1 | Sin dependencias, sin build, scripts clásicos. |
| RNF-2 | Una pasada sobre las sesiones y 84 celdas; medición manual con 1.000 sesiones. |
| RNF-3 | Contraste, foco visible, nombres accesibles y texto alternativo al color. |
| RNF-4 | Media queries y medición de scroll a 375 y 320 px. |
| RNF-5 | El mapa no escribe; verificación de que el almacenamiento no cambia. |
| RNF-6 | Utilidades de fecha locales y pruebas de DST. |
| RNF-7 | Sin cambios en el formato guardado ni migraciones. |
| RNF-8 | Textos en español y fechas con `Intl` en `es-ES`. |
| RNF-9 | Posicionamiento y ocultación del tooltip; verificación en bordes y móvil. |
| RNF-10 | Tamaño mínimo de celda y ajuste a ancho completo en 320 px; medición real. |

## 10. Estrategia de tests con `node --test`

### 10.1 Estructura y ejecución

- Un único archivo: `tests/heatmap-logic.test.js`.
- Se usan los módulos integrados `node:test` y `node:assert/strict`; no se instala nada.
- Se ejecuta con `node --test` desde la raíz del proyecto. Node descubre el archivo por su
  sufijo `.test.js`.
- `heatmap-logic.js` se importa con `require`; la exportación CommonJS está guardada para
  que el mismo archivo funcione como script de navegador.
- No hay `package.json` ni configuración adicional; el proyecto sigue sin build.
- Cada prueba pasa `today` de forma explícita; ninguna depende de la fecha real del
  sistema, del DOM ni del almacenamiento.

### 10.2 Casos por requisito

| Grupo | Casos |
| --- | --- |
| RF-1 / RF-9 | 84 días únicos y consecutivos; 12 columnas × 7 filas; la primera celda es lunes; la última es domingo; última columna = semana de `today`; inicio correcto con `today` en lunes, miércoles y domingo; periodo que cruza año. |
| RF-2 | Varias sesiones el mismo día suman; día sin sesiones da 0; el orden de las sesiones no altera el total; sesiones con minutos decimales. |
| RF-3 | 0 → 0; 1 y 29 → 1; 30 y 59 → 2; 60 y 119 → 3; 120 y 1.000 → 4; valores negativos y no numéricos → 0. |
| RF-7 | Sin sesiones → `no-sessions`; solo sesiones antiguas → `no-recent`; solo futuras → `no-recent`; mezcla de antiguas y futuras → `no-recent`; con actividad → `null`. |
| RF-8 | Sesiones futuras no suman; día futuro con `level` 0; día futuro con sesión sigue en 0; hoy sí cuenta. |
| RF-12 | Exactamente un día marcado como hoy; se mantiene aunque hoy no tenga sesiones. |
| Fechas | 29 de febrero en año bisiesto; paso de DST en ambos sentidos; fechas imposibles (`2026-02-30`); fechas vacías, ausentes o con formato distinto. |
| Robustez | `sessions` vacío, `null`, con entradas `null`, con `date` ausente, con `minutes` como texto, `NaN` o negativos; no debe lanzar. |
| RF-6 (lógica) | Al añadir una sesión al conjunto, el nivel del día sube y el estado vacío desaparece; al quitarla, vuelve. |
| Pureza | La lógica no usa `localStorage`, `document` ni `Date.now`; se comprueba indirectamente porque las pruebas no definen esos globales y todas pasan. |

### 10.3 Verificación manual con Chrome DevTools

Se ejecuta después de que los tests de lógica estén en verde, según la constitución y
`AGENTS.md`:

- Abrir `index.html`, comprobar que la consola no muestra errores.
- Escritorio: rango correcto, 12 × 7 celdas, leyenda, tooltip con cursor, foco con
  Tab/Shift+Tab, `Escape`, tooltip en celdas del borde derecho e inferior.
- Móvil emulado a 375 px: detalle por toque, segundo toque y toque fuera, sin scroll
  horizontal, celdas de al menos 24 px.
- 320 px: sin scroll horizontal, sin solapamientos y con el objetivo táctil conservado.
- Día de hoy visible con su realce; días futuros atenuados y no interactivos.
- Estado vacío: borrar la clave de localStorage y comprobar el mensaje de "aún no hay
  sesiones"; después, dejar solo una sesión antigua y comprobar el otro mensaje.
- Registrar una sesión de hoy y comprobar que el mapa se actualiza sin recargar.
- Comprobar que las sesiones y la lista existente no cambian antes y después de
  interactuar con el mapa.

### 10.4 Puerta de calidad

- No se empieza la interfaz hasta que todos los tests de lógica estén en verde.
- Cualquier caso límite nuevo que aparezca durante la implementación se añade primero
  como test en rojo y luego se resuelve.
- No se aceptan tests con fechas reales, zonas horarias implícitas ni dependencias
  externas.

## 11. Decisiones sobre puntos que la spec no fija

Estas concreciones permiten implementar sin contradecir la spec; si alguna no encaja con
la intención del producto, debe volver a la spec antes de escribir código (artículo 2 de
la constitución).

- **"Hoy"**: es el valor que entrega `app.js` en el momento del render. No hay
  actualización automática a medianoche; el periodo y el realce de hoy cambian al
  recargar o al registrar una sesión, tal como admite CL-13.
- **Detalle en táctil**: tooltip flotante, no panel; se fija con un toque y se cierra con
  segundo toque, toque fuera o `Escape`.
- **Día futuro accesible**: su nombre incluye fecha completa, "día futuro" y "0 minutos",
  conciliando RF-5 y RF-10.
- **Estado vacío con solo futuras o mezcla**: se usa "Sin sesiones en las últimas 12
  semanas" siempre que exista alguna sesión válida guardada pero ninguna aporte actividad
  visible.
- **Leyenda**: cuatro muestras (niveles 1 a 4) y los rótulos "Menos" y "Más"; el nivel 0
  se explica en el tooltip.
- **Borde del periodo**: la sesión del primer lunes visible cuenta; la del domingo
  anterior no.
- **Formato del rango**: "día mes – día mes año" en español; si cambia el año, se muestran
  ambos años.
- **"Sesión válida"**: fecha válida y minutos convertibles a número; los minutos no
  válidos se tratan como 0 y no bloquean el resto.

## 12. Orden de trabajo

1. Escribir los tests de la lógica pura con los casos de la sección 10.2.
2. Implementar `heatmap-logic.js` hasta poner todos los tests en verde.
3. Crear la sección en `index.html` y los estilos base en `styles.css`.
4. Implementar `heatmap-ui.js` (cuadrícula, rango, leyenda, tooltip y eventos).
5. Integrar `renderHeatmap()` en `app.js` y comprobar el repintado tras registrar.
6. Verificar en Chrome DevTools a escritorio, 375 px y 320 px.
7. Actualizar `MEMORY.md` con estado, decisiones y aprendizajes.

## 13. Riesgos y puntos de atención

- **Espacio a 320 px**: es la zona más frágil; si al medir no se alcanzan 24 px sin scroll,
  hay que parar y resolverlo en la spec, no improvisar en el CSS.
- **Contraste de los cuatro niveles**: el tono único puede hacer difícil distinguir pasos
  contiguos; se valida con la herramienta de contraste y se apoya en el texto.
- **84 paradas de tabulación**: es el coste de la solución nativa; si resulta incómodo en
  la verificación, se replanteará con navegación por flechas antes de dar por cerrado
  RF-10.
- **Tooltip en móvil**: debe comprobarse que no tapa la celda consultada ni se sale de la
  ventana en los extremos de la cuadrícula.
- **Repintado tras registrar**: si `renderHeatmap` se llama antes de que existan las
  funciones de `app.js`, el mapa no aparece; el orden de scripts es parte del contrato.

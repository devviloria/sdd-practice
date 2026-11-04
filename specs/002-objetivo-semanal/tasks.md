# Tareas — 002 Objetivo semanal de estudio

Desglose ejecutable de `spec.md` y `plan.md`. Cada tarea está pensada para 20–30 minutos y
la lista va en orden de dependencia: no se empieza una fase sin cerrar la anterior.

## Reglas de la lista

- **Tests primero**: toda tarea de lógica empieza escribiendo los tests (en rojo) y termina
  con `node --test` en verde. No se marca una tarea con tests en rojo (constitución,
  artículo 4). La suite actual de 21 tests debe seguir en verde siempre.
- **Puerta**: `node --test` en verde antes de pasar a la interfaz.
- Las tareas de interfaz se verifican en Chrome DevTools con `index.html` abierto por
  `file://`, como el resto del proyecto.
- No se crea ningún archivo que no esté aprobado en T-01.
- No se modifica `diarioEstudio_sessions`, ni su formato, ni el cálculo o la presentación de
  la racha, la mejor racha, los minutos de la semana y el mapa de calor.
- Fechas siempre locales: nada de `toISOString()` ni de `new Date("AAAA-MM-DD")`.
- Código y nombres en inglés; textos de interfaz en español.

## Fase 0 — Preparación

- [x] **T-01 — Aviso y aprobación de los archivos nuevos** · ~5 min
  - **RF:** — (proceso; `AGENTS.md` pide preguntar antes de crear archivos)
  - **Qué:** presentar al usuario los tres archivos nuevos (`weekly-goal-logic.js`,
    `weekly-goal-ui.js`, `tests/weekly-goal-logic.test.js`), la clave nueva
    `diarioEstudio_weeklyGoal`, el orden de scripts (`heatmap-logic.js`, `heatmap-ui.js`,
    `weekly-goal-logic.js`, `weekly-goal-ui.js`, `app.js`), el repintado de la tarjeta
    "Minutos semana" al cambiar el objetivo y la confirmación de que no se toca el formato
    de las sesiones.
  - **Hecho cuando:** el usuario ha dado el visto bueno por escrito y esta tarea queda
    marcada **antes** de crear cualquier archivo.
  - **Aprobación:** dada por escrito por el usuario (2026-11-03). Autoriza crear
    `weekly-goal-logic.js`, `weekly-goal-ui.js` y `tests/weekly-goal-logic.test.js`, la clave
    `diarioEstudio_weeklyGoal` y el orden de scripts del plan, sin tocar el formato de
    `diarioEstudio_sessions`.

- [x] **T-02 — Esqueleto de la lógica y validación del objetivo** · ~30 min
  - **RF:** RF-10, RF-11 · **CL:** CL-2, CL-14, CL-23, CL-25 · **RNF:** RNF-1
  - **Qué:** crear `weekly-goal-logic.js` con las constantes `MIN_GOAL_MINUTES` y
    `MAX_GOAL_MINUTES`, el guardado de exportación CommonJS y `parseGoalValue`; crear
    `tests/weekly-goal-logic.test.js` con un test de humo. Escribir primero los tests de la
    tabla completa de RF-10 (aceptar "300", " 300 ", "0300", "1", "10080"; rechazar
    "3.000", "+300", "-300", "1e3", "3E2", "300,0", "300.0", "0", "10081", "", " ", "abc",
    valores no texto y números no enteros) y de RF-11/CL-25 (objetivo guardado como número
    y como texto de dígitos).
  - **Hecho cuando:** `node --test` descubre los dos archivos de test y termina en verde, y
    la tabla de RF-10 se cumple entera, incluidos los límites 1 y 10.080.

## Fase 1 — Lógica pura

- [x] **T-03 — Progreso de la semana actual** · ~30 min
  - **RF:** RF-5, RF-9 · **CL:** CL-7, CL-8, CL-9, CL-11, CL-13, CL-15, CL-17 ·
    **RNF:** RNF-6, RNF-11
  - **Qué:** escribir primero los tests de `getWeekStart` y `calculateWeekProgress`
    replicando la tabla de reglas de la tarjeta: hoy lunes solo cuenta el lunes, varias
    sesiones del mismo día suman, no cuentan las anteriores al lunes ni las posteriores a
    `today`, se ignoran fechas no interpretables y minutos vacíos, no numéricos, cero o
    negativos, los decimales se conservan y el total nunca es negativo. Incluir semana que
    cruza de año, cambio de hora en ambos sentidos y `today` inválido. Después implementar
    con fechas locales construidas por componentes.
  - **Hecho cuando:** `node --test` y `TZ=Europe/Madrid node --test` están en verde, la
    función recibe `today` como parámetro y no usa el reloj.

- [x] **T-04 — Porcentaje, formato y estado** · ~30 min
  - **RF:** RF-6, RF-8 · **CL:** CL-3, CL-4, CL-5, CL-6, CL-18, CL-20 · **RNF:** RNF-8
  - **Qué:** escribir primero los tests de `calculatePercent` (0 de 300 → 0; 1 de 300 → 0;
    299 de 300 → 99; 300 de 300 → 100; 3.240 de 3.000 → 100; 1 de 3 → 33; objetivo 1 con
    muchas horas), de `formatMinutes` (1.000 → "1.000"; 3.240,5 → "3.240,5"; 0; no
    finitos), de `formatProgressText` ("1.200 de 3.000 min") y de `buildWeeklyGoal` en sus
    dos estados. Después implementarlas.
  - **Hecho cuando:** la tabla de ejemplos del plan está en verde y `buildWeeklyGoal`
    devuelve `status`, `today`, `weekStart`, `goal`, `progress`, `percent` e `isComplete`
    correctos en todos los casos.

- [x] **T-05 — Casos límite y pureza de la lógica** · ~25 min
  - **RF:** RF-9, RF-11 · **CL:** CL-2, CL-12, CL-17, CL-21, CL-23, CL-25 ·
    **RNF:** RNF-6, RNF-11
  - **Qué:** añadir tests de `sessions` nulo, no array, con entradas nulas, sin `date`, con
    `date` numérico y con `minutes` como texto o `NaN`; de `rawGoal` como número, texto y
    valor ilegible; de guardar el mismo objetivo; de objetivo 1 y 10.080. Comprobar que la
    lógica no usa almacenamiento, DOM, reloj ni `toISOString`.
  - **Hecho cuando:** `node --test` y `TZ=Europe/Madrid node --test` en verde y
    `grep -nE "localStorage|document|Date\.now|toISOString" weekly-goal-logic.js` no
    devuelve nada.

## Fase 2 — Estructura y estilos

- [x] **T-06 — Sección del objetivo en `index.html`** · ~25 min
  - **RF:** RF-1, RF-2, RF-3, RF-7, RF-13, RF-15 · **CL:** CL-1 · **RNF:** RNF-1, RNF-9
  - **Qué:** añadir la sección entre las tarjetas de resumen y el mapa de calor con: título,
    estado sin objetivo (mensaje y botón "Fijar objetivo"), estado con objetivo (texto del
    progreso, porcentaje, barra con `role="progressbar"`, mensaje de cumplido con
    `role="status"`, botones "Editar" y "Quitar"), editor (etiqueta, ayuda "Entre 1 y 10.080
    minutos", campo de texto con `inputmode="numeric"`, error y botones "Guardar"/"Cancelar")
    y aviso de guardado. Cargar `weekly-goal-logic.js` y `weekly-goal-ui.js` antes de
    `app.js`.
  - **Hecho cuando:** el orden del DOM es tarjetas → objetivo → mapa → formulario → lista,
    los textos coinciden literalmente con la spec, los cinco scripts cargan en el orden
    previsto y la consola no muestra errores.

- [x] **T-07 — Estilos, estados y responsive** · ~30 min
  - **RF:** RF-6, RF-14 · **CL:** CL-20, CL-22 · **RNF:** RNF-3, RNF-4, RNF-8, RNF-10
  - **Qué:** estilos de tarjeta, título, texto del progreso, porcentaje, barra (pista y
    relleno), mensaje de cumplido, editor, error, aviso y foco visible; botones de al menos
    44 × 44 px; campo de 16 px; ajustes a 600 px y a 320 px con `flex-wrap` y anchos
    relativos; sin animaciones ni transiciones en la barra.
  - **Hecho cuando:** el contraste medido cumple (texto ≥ 4,5:1, barra ≥ 3:1), a 375 px y a
    320 px `document.documentElement.scrollWidth === document.documentElement.clientWidth`,
    todos los botones quedan dentro del viewport, el texto largo se reparte en líneas y el
    foco se ve en todos los controles.

## Fase 3 — Interfaz y datos

- [x] **T-08 — Pintado del progreso y persistencia** · ~30 min
  - **RF:** RF-1, RF-4, RF-5, RF-6, RF-7, RF-8, RF-12, RF-13 · **CL:** CL-1, CL-5, CL-10,
    CL-24 · **RNF:** RNF-5, RNF-7, RNF-9
  - **Qué:** añadir en `app.js` la clave `diarioEstudio_weeklyGoal` y los accesos
    `getGoalRawValue`, `saveGoalMinutes` (escritura con relectura y comparación) y
    `clearGoalValue`; crear `weekly-goal-ui.js` con `renderWeeklyGoal()` que lea objetivo,
    sesiones y fecha local, llame a `buildWeeklyGoal` y pinte los estados, el texto, el
    porcentaje, la barra con su `aria-valuetext` y el mensaje de cumplido. Llamar a
    `renderWeeklyGoal()` en `init()` y tras registrar una sesión, y repintar también la
    tarjeta "Minutos semana" al guardar o quitar el objetivo. Para probar el estado con
    objetivo antes de tener editor, escribir la clave a mano en Local Storage desde
    DevTools.
  - **Hecho cuando:** los tres estados se ven correctos, recargar conserva el objetivo, el
    número del bloque coincide exactamente con la tarjeta (incluidas sesiones futuras,
    fechas descartadas y minutos corruptos) y registrar una sesión actualiza ambos sin
    recargar.

- [x] **T-09 — Editor: fijar, editar, cancelar, quitar y foco** · ~30 min
  - **RF:** RF-1, RF-2, RF-3, RF-4, RF-10, RF-15 · **CL:** CL-14, CL-16, CL-19, CL-21,
    CL-22 · **RNF:** RNF-10, RNF-12
  - **Qué:** abrir el editor vacío o con el valor actual sin separadores; validar al enviar
    con `parseGoalValue` y mostrar "Introduce un número entero de minutos entre 1 y 10.080"
    con el campo marcado como inválido y el foco en él; limpiar el error al escribir;
    gestionar el fallo de guardado con "No se ha podido guardar el objetivo" sin aplicar el
    valor nuevo; cancelar sin cambios; quitar sin confirmación; devolver el foco al botón de
    origen o a la sección; y anunciar "¡Objetivo cumplido!" sin robar el foco.
  - **Hecho cuando:** los cuatro flujos funcionan solo con teclado y con ratón, el foco
    vuelve siempre a un sitio predecible, los errores quedan asociados al campo, quitar
    estando cumplido deja el estado sin objetivo y el aviso desaparece al guardar bien o al
    cancelar.

## Fase 4 — Verificación y cierre

- [x] **T-10 — Verificación en Chrome DevTools, datos intactos y cierre** · ~30 min
  - **RF:** RF-12, RF-13, RF-14, RF-15 · **CL:** CL-10, CL-22, CL-24 ·
    **RNF:** RNF-2, RNF-3, RNF-4, RNF-5, RNF-6, RNF-7, RNF-10, RNF-12
  - **Qué:** recorrido completo en escritorio, 375 px y 320 px: estados sin objetivo, en
    progreso y cumplido; fijar, editar, cancelar y quitar; validación y guardado fallido
    simulado; actualización al registrar sesión; ausencia de scroll horizontal; árbol de
    accesibilidad de la barra y anuncio del mensaje; contraste medido; `localStorage`
    comparado antes y después; medición con 1.000 sesiones; comprobación de que no hay
    temporizadores (`setTimeout`/`setInterval`) y de que la foto congelada se mantiene.
    Actualizar `MEMORY.md` y marcar las tareas.
  - **Hecho cuando:** todas las comprobaciones pasan, la consola queda limpia,
    `diarioEstudio_sessions` es idéntica antes y después, `node --test` y
    `TZ=Europe/Madrid node --test` están en verde, `MEMORY.md` refleja el objetivo semanal y
    las casillas de este archivo están marcadas.

## Cobertura de requisitos

| Requisito | Tareas |
| --- | --- |
| RF-1 | T-02, T-06, T-08, T-09 |
| RF-2 | T-06, T-09 |
| RF-3 | T-06, T-09 |
| RF-4 | T-08, T-09 |
| RF-5 | T-03, T-08, T-10 |
| RF-6 | T-04, T-07, T-08 |
| RF-7 | T-06, T-08 |
| RF-8 | T-04, T-08, T-09 |
| RF-9 | T-03, T-05, T-08, T-10 |
| RF-10 | T-02, T-09 |
| RF-11 | T-02, T-05, T-08 |
| RF-12 | T-08, T-10 |
| RF-13 | T-06, T-08, T-10 |
| RF-14 | T-07, T-10 |
| RF-15 | T-06, T-09, T-10 |
| RNF-1 | T-02, T-06 |
| RNF-2 | T-10 |
| RNF-3 | T-07, T-10 |
| RNF-4 | T-07, T-10 |
| RNF-5 | T-08, T-10 |
| RNF-6 | T-03, T-05, T-10 |
| RNF-7 | T-08, T-10 |
| RNF-8 | T-04, T-07 |
| RNF-9 | T-06, T-08 |
| RNF-10 | T-07, T-09, T-10 |
| RNF-11 | T-03, T-05 |
| RNF-12 | T-09, T-10 |
| CL-1 | T-06, T-08 |
| CL-2 | T-02, T-05, T-08 |
| CL-3, CL-4 | T-04 |
| CL-5 | T-04, T-08 |
| CL-6 | T-04 |
| CL-7, CL-8, CL-9 | T-03 |
| CL-10 | T-08, T-10 |
| CL-11 | T-03 |
| CL-12 | T-03, T-05 |
| CL-13 | T-03 |
| CL-14 | T-02, T-09 |
| CL-15 | T-03, T-05 |
| CL-16 | T-09 |
| CL-17 | T-03, T-05, T-09 |
| CL-18 | T-04 |
| CL-19 | T-09 |
| CL-20 | T-04, T-07 |
| CL-21 | T-05, T-09 |
| CL-22 | T-07, T-09, T-10 |
| CL-23 | T-02, T-05 |
| CL-24 | T-08, T-10 |
| CL-25 | T-02, T-05 |

## Definición de terminado

- Las diez tareas marcadas y `node --test` en verde (21 tests previos + los nuevos).
- Sin scroll horizontal a 375 px ni a 320 px; consola limpia en todos los flujos.
- `diarioEstudio_sessions` intacta y la lista de sesiones sin cambios.
- El número del bloque coincide con la tarjeta "Minutos semana" en todos los escenarios
  probados.
- Barra y mensaje de cumplimiento comprobados en el árbol de accesibilidad y con teclado.
- `MEMORY.md` actualizado con estado, decisiones y errores a evitar.

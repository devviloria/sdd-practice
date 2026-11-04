# Tareas — 001 Mapa de calor de estudio

Desglose ejecutable de `spec.md` y `plan.md`. Cada tarea está pensada para 20–30 minutos
como máximo y la lista va en orden de dependencia: no se empieza una fase sin cerrar la
anterior.

## Reglas de la lista

- Los tests se escriben antes de la implementación; una tarea de test termina en rojo a
  propósito y la siguiente la pone en verde.
- **No se marca una tarea si deja tests en rojo.** La puerta es `node --test` en verde
  (constitución, artículo 4).
- Las tareas de interfaz se verifican en Chrome DevTools con `index.html` abierto por
  `file://`, como el resto del proyecto.
- No se crea ningún archivo nuevo ni se cambia el formato de `diarioEstudio_sessions`.
- Ninguna tarea modifica los indicadores existentes (racha, mejor racha, minutos de la
  semana).

## Fase 0 — Preparación

- [x] **T-01 — Confirmar la creación de archivos nuevos** · ~5 min
  - **RF:** — (proceso; `AGENTS.md` pide preguntar antes de crear archivos)
  - **Qué:** confirmar con el usuario los tres archivos nuevos (`heatmap-logic.js`,
    `heatmap-ui.js`, `tests/heatmap-logic.test.js`), el orden de scripts y que no se toca
    el formato de datos.
  - **Hecho cuando:** el usuario ha dado el visto bueno por escrito y esta tarea queda
    marcada antes de crear cualquier archivo.

- [x] **T-02 — Esqueleto de tests y módulo de lógica** · ~15 min
  - **RF:** RF-1 (base), RNF-1
  - **Qué:** crear `heatmap-logic.js` con las constantes (`WEEKS`, `DAYS_PER_WEEK`) y el
    guardado de exportación CommonJS para navegador y Node; crear
    `tests/heatmap-logic.test.js` con `node:test`, `node:assert/strict` y un test de humo
    que compruebe que el módulo se carga.
  - **Hecho cuando:** `node --test` descubre el archivo, ejecuta 1 test y termina en verde.

## Fase 1 — Utilidades de fecha

- [x] **T-03 — Tests de `isValidDateString`** · ~20 min
  - **RF:** RNF-6, CL-7
  - **Qué:** casos válidos (`"2026-11-03"`, `"2028-02-29"`) e inválidos (`""`, `null`,
    `"2026-13-01"`, `"2026-02-30"`, `"03/11/2026"`, `"2026-1-3"`).
  - **Hecho cuando:** los tests nuevos fallan porque la función no existe y el resto de
    la suite sigue en verde.

- [x] **T-04 — Implementar `isValidDateString`** · ~20 min
  - **RF:** RF-1, CL-7
  - **Qué:** validar formato `"AAAA-MM-DD"` y comprobar ida y vuelta con los componentes
    de fecha para rechazar días imposibles.
  - **Hecho cuando:** `node --test` pasa los tests de T-03 y `2026-02-30` devuelve `false`.

- [x] **T-05 — Tests de `parseLocalDate` y `formatLocalDate`** · ~25 min
  - **RF:** RNF-6, CL-9
  - **Qué:** ida y vuelta para fechas normales, 29 de febrero bisiesto, cambio de mes y de
    año; comprobar que la fecha construida es local y no UTC.
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-06 — Implementar `parseLocalDate` y `formatLocalDate`** · ~25 min
  - **RF:** RNF-6, CL-9
  - **Qué:** construir la fecha al mediodía local con los componentes del texto y
    formatear con `getFullYear`/`getMonth`/`getDate`; sin `toISOString()`.
  - **Hecho cuando:** `node --test` pasa T-05 y `grep -n "toISOString" heatmap-logic.js` no
    devuelve nada.

- [x] **T-07 — Tests de `addDays`** · ~20 min
  - **RF:** RF-1, RF-8, CL-8, CL-9
  - **Qué:** sumar y restar días en cambios de mes, 28/29 de febrero, 31 de diciembre y
    cruces de horario de verano en una zona con DST (por ejemplo `Europe/Madrid`).
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-08 — Implementar `addDays`** · ~20 min
  - **RF:** RF-1, RF-8, CL-8, CL-9
  - **Qué:** operar sobre la fecha local parseada y devolver `"AAAA-MM-DD"` con
    `formatLocalDate`.
  - **Hecho cuando:** `node --test` y `TZ=Europe/Madrid node --test` pasan T-07 sin
    duplicar ni perder días.

- [x] **T-09 — Tests de `startOfWeek`** · ~20 min
  - **RF:** RF-1, RF-9, CL-10
  - **Qué:** los siete días de una misma semana devuelven el mismo lunes; domingo
    retrocede seis días; comprobar una semana que cruza de mes y otra de año.
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-10 — Implementar `startOfWeek`** · ~15 min
  - **RF:** RF-1, RF-9, CL-10
  - **Qué:** calcular el desplazamiento con `(getDay() + 6) % 7` sobre la fecha local y
    delegar en `addDays`.
  - **Hecho cuando:** `node --test` pasa T-09 para los siete días de la semana.

## Fase 2 — Minutos e intensidad

- [x] **T-11 — Tests de `toMinutes`** · ~20 min
  - **RF:** RF-2, CL-6
  - **Qué:** números y textos numéricos (`30`, `"30"`), decimales (`29.5`), y valores que
    deben ser 0 (`""`, `"abc"`, `"1,5"`, `null`, `undefined`, `NaN`, `-10`, `Infinity`).
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-12 — Implementar `toMinutes`** · ~15 min
  - **RF:** RF-2, CL-6
  - **Qué:** convertir a número y devolver 0 para no finitos o negativos, conservando los
    decimales válidos.
  - **Hecho cuando:** `node --test` pasa T-11 y el resultado nunca es negativo ni `NaN`.

- [x] **T-13 — Tests de `getIntensityLevel`** · ~20 min
  - **RF:** RF-3, CL-4, CL-11
  - **Qué:** límites exactos 0, 1, 29, 30, 59, 60, 119, 120, 121, 1.000; negativos y no
    numéricos.
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-14 — Implementar `getIntensityLevel`** · ~15 min
  - **RF:** RF-3, CL-4, CL-11
  - **Qué:** aplicar los cuatro umbrales en cascada y devolver 0–4.
  - **Hecho cuando:** `node --test` pasa T-13 con los seis límites del caso CL-4.

- [x] **T-15 — Tests de `sumMinutesByDate`** · ~25 min
  - **RF:** RF-2, RF-6, RF-8, CL-5, CL-7, CL-15
  - **Qué:** suma de varias sesiones del mismo día; día sin sesiones; orden irrelevante;
    sesiones futuras, fuera del rango, con fecha inválida y con ids repetidos.
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-16 — Implementar `sumMinutesByDate`** · ~25 min
  - **RF:** RF-2, RF-6, RF-8, CL-5, CL-7, CL-15
  - **Qué:** recorrer las sesiones una vez, validar la fecha, descartar futuras y fuera de
    rango antes de acumular y devolver un mapa fecha → minutos.
  - **Hecho cuando:** `node --test` pasa T-15 y una sesión futura nunca aparece en el mapa.

## Fase 3 — Estructura del mapa

- [x] **T-17 — Tests de rango y columnas de `buildHeatmap`** · ~30 min
  - **RF:** RF-1, RF-9, CL-8, CL-10
  - **Qué:** 84 días únicos y consecutivos; 12 columnas × 7 filas; primera celda lunes;
    última domingo; última columna = semana de `today`; casos con hoy lunes, miércoles y
    domingo; periodo que cruza de año.
  - **Hecho cuando:** los tests nuevos fallan por función ausente y el resto sigue verde.

- [x] **T-18 — Implementar `buildHeatmap` (rango y columnas)** · ~30 min
  - **RF:** RF-1, RF-9, RNF-6
  - **Qué:** calcular `start`/`end`, generar las 12 × 7 celdas y asignar fecha, minutos y
    nivel a cada una; devolver también `today`.
  - **Hecho cuando:** `node --test` pasa T-17 y el número de celdas generadas es 84.

- [x] **T-19 — Tests de nivel, futuro, hoy y estado vacío** · ~25 min
  - **RF:** RF-3, RF-7, RF-8, RF-12, CL-1, CL-2, CL-3
  - **Qué:** nivel por día con varias sesiones; día futuro con nivel 0 aunque tenga
    sesiones; exactamente un día marcado como hoy; `emptyState` con cero sesiones, solo
    antiguas, solo futuras y mezcla.
  - **Hecho cuando:** los tests nuevos fallan por función ausente o valor distinto y el
    resto sigue verde.

- [x] **T-20 — Implementar nivel, futuro, hoy y estado vacío** · ~25 min
  - **RF:** RF-3, RF-7, RF-8, RF-12, CL-1, CL-2, CL-3
  - **Qué:** completar `buildHeatmap` con `level`, `isFuture`, `isToday`, `hasActivity` y
    `emptyState` (`null`, `"no-sessions"`, `"no-recent"`).
  - **Hecho cuando:** `node --test` pasa T-19 y cada día futuro tiene `level === 0`.

- [x] **T-21 — Cerrar casos límite y pureza de la lógica** · ~25 min
  - **RF:** CL-6, CL-7, CL-12, CL-15, RNF-6
  - **Qué:** añadir tests de `sessions` nulo, entradas nulas, fecha ausente, minutos como
    texto/`NaN`/negativos, 29 de febrero y DST en ambos sentidos; comprobar que la lógica
    no usa `localStorage`, `document` ni `Date.now`.
  - **Hecho cuando:** `node --test` y `TZ=Europe/Madrid node --test` están en verde y
    `grep -nE "localStorage|document|Date\.now|toISOString" heatmap-logic.js` no devuelve
    nada.

## Fase 4 — Estructura y estilos base

- [x] **T-22 — Sección del mapa en `index.html`** · ~20 min
  - **RF:** RF-5, RF-9, RF-11, RF-12, RNF-1
  - **Qué:** añadir la sección entre las tarjetas y el formulario con título, hueco para el
    rango, contenedor de la cuadrícula, hueco para el mensaje vacío, leyenda y tooltip
    oculto; cargar `heatmap-logic.js`, `heatmap-ui.js` y después `app.js`.
  - **Hecho cuando:** al abrir `index.html` la sección existe en el DOM, los tres scripts
    aparecen en ese orden y la consola no muestra errores.

- [x] **T-23 — Layout de la cuadrícula** · ~30 min
  - **RF:** RF-9, RF-11, RNF-4
  - **Qué:** estilos de la sección y de la cuadrícula de 12 columnas × 7 filas con la
    columna de etiquetas `lun`/`mié`/`vie`, sin depender todavía de datos reales.
  - **Hecho cuando:** con 84 celdas de prueba en el DOM se ven 12 columnas y 7 filas, las
    etiquetas quedan alineadas y a 375 px no hay scroll horizontal.

- [x] **T-24 — Paleta de niveles, futuro, hoy y foco** · ~30 min
  - **RF:** RF-4, RF-12, RNF-3
  - **Qué:** definir los cinco fondos (nivel 0 a 4), el atenuado de días futuros, el realce
    del día de hoy y el contorno de foco visible sobre cualquier nivel.
  - **Hecho cuando:** los cinco fondos tienen valores distintos y su luminancia cambia de
    forma monótona del nivel 0 al 4, el realce de hoy se distingue con nivel 0 y con nivel
    4, y el foco se ve sobre los cinco fondos al recorrer con Tab.

## Fase 5 — Pintado e interacción

- [x] **T-25 — Render de rango y celdas** · ~30 min
  - **RF:** RF-1, RF-8, RF-9, RF-10, RF-12
  - **Qué:** en `heatmap-ui.js`, construir las celdas desde `buildHeatmap` en orden
    cronológico como botones, con nombre accesible de fecha y minutos, nivel como clase,
    `aria-current` en hoy y botones deshabilitados para días futuros.
  - **Hecho cuando:** en la consola hay 84 celdas, tantas deshabilitadas como días futuros,
    exactamente un `aria-current="date"` y el orden del DOM coincide con las fechas.

- [x] **T-26 — Estado vacío y leyenda** · ~25 min
  - **RF:** RF-5, RF-7
  - **Qué:** mostrar el mensaje que corresponda a `emptyState` sin ocultar la cuadrícula y
    pintar la leyenda permanente con los niveles 1–4 y los rótulos "Menos"/"Más".
  - **Hecho cuando:** sin sesiones aparece "Aún no hay sesiones registradas"; con solo
    sesiones antiguas o futuras, "Sin sesiones en las últimas 12 semanas"; la leyenda
    muestra cuatro muestras y ambos rótulos.

- [x] **T-27 — Tooltip con cursor y teclado** · ~30 min
  - **RF:** RF-5, RF-10, RNF-3
  - **Qué:** un tooltip compartido que muestra fecha y minutos al entrar con el cursor o al
    recibir foco, "Sin estudio" si no hay sesiones, y que se oculta al salir o al perder el
    foco.
  - **Hecho cuando:** con el cursor y con Tab el texto coincide con el día y sus minutos,
    un día sin sesiones muestra "Sin estudio" y un día futuro no muestra tooltip.

- [x] **T-28 — Toque y cierre del detalle** · ~25 min
  - **RF:** RF-5, CL-16, CL-17
  - **Qué:** fijar el detalle con un toque, cerrarlo con un segundo toque, con un toque
    fuera de la cuadrícula o con `Escape`, moverlo al tocar otro día y resolver el conflicto
    foco/toque a favor de la última interacción.
  - **Hecho cuando:** en emulación táctil se cumplen los cuatro gestos, tocar un día futuro
    no hace nada y el detalle visible siempre corresponde al último día consultado.

- [x] **T-29 — Posicionamiento del tooltip** · ~20 min
  - **RF:** RNF-9
  - **Qué:** colocar el tooltip encima de la celda, pasarlo debajo si no cabe, limitarlo a
    los bordes de la ventana y ocultarlo al hacer scroll o redimensionar.
  - **Hecho cuando:** en las celdas del borde derecho e inferior el tooltip queda completo,
    dentro de la ventana y sin tapar la celda consultada; al hacer scroll desaparece.

- [x] **T-30 — Integración en `app.js`** · ~20 min
  - **RF:** RF-6, RNF-5
  - **Qué:** llamar a `renderHeatmap()` en el arranque y tras guardar una sesión, sin tocar
    la lectura, la escritura ni el formato de datos.
  - **Hecho cuando:** al abrir la página el mapa aparece ya relleno y al registrar una
    sesión de hoy se actualiza sin recargar; ninguna otra función de `app.js` cambia.

- [x] **T-31 — Responsive a 375 y 320 px** · ~30 min
  - **RF:** RF-11, RNF-4, RNF-10
  - **Qué:** ajustar padding, separaciones y tamaño de celda para que las 12 semanas quepan
    sin scroll horizontal, con celdas de al menos 24 × 24 px.
  - **Hecho cuando:** a 375 px y a 320 px `document.documentElement.scrollWidth` no supera
    el ancho del viewport y cada celda mide al menos 24 px de ancho y alto.

## Fase 6 — Verificación y cierre

- [x] **T-32 — Verificación en escritorio** · ~25 min
  - **RF:** RF-4, RF-5, RF-10, RF-12, RNF-9
  - **Qué:** comprobar rango, 12 × 7 celdas, leyenda, tooltip con cursor, recorrido con
    Tab/Shift+Tab, `Escape`, realce de hoy y días futuros atenuados.
  - **Hecho cuando:** todos los comportamientos se confirman en Chrome DevTools y la
    consola no muestra errores durante el recorrido.

- [x] **T-33 — Verificación en móvil** · ~25 min
  - **RF:** RF-11, RNF-4, RNF-10, CL-14
  - **Qué:** emular 375 px y 320 px y probar toque, segundo toque, toque fuera, ausencia de
    scroll horizontal, celdas legibles y secciones existentes intactas.
  - **Hecho cuando:** los gestos funcionan en ambos anchos, no hay scroll horizontal ni
    solapamientos y las tarjetas, el formulario y la lista siguen visibles.

- [x] **T-34 — Datos intactos, rendimiento y consola** · ~15 min
  - **RF:** RNF-2, RNF-5, RNF-7
  - **Qué:** comparar `localStorage` antes y después de usar el mapa, comprobar que la
    lista de sesiones no cambia y medir el render con 1.000 sesiones.
  - **Hecho cuando:** la clave `diarioEstudio_sessions` es idéntica antes y después, la
    lista muestra las mismas sesiones y el render con 1.000 sesiones tarda menos de 100 ms.

- [x] **T-35 — Cierre documental** · ~10 min
  - **RF:** — (proceso; `AGENTS.md`)
  - **Qué:** actualizar `MEMORY.md` con el estado final, las decisiones tomadas y los
    errores a evitar; marcar las tareas completadas en este archivo.
  - **Hecho cuando:** `MEMORY.md` refleja el mapa implementado y todas las casillas
    aplicables de `tasks.md` están marcadas.

## Cobertura de requisitos

| Requisito | Tareas |
| --- | --- |
| RF-1 | T-02, T-04, T-07, T-08, T-09, T-10, T-17, T-18, T-25 |
| RF-2 | T-11, T-12, T-15, T-16 |
| RF-3 | T-13, T-14, T-19, T-20 |
| RF-4 | T-24, T-32 |
| RF-5 | T-22, T-26, T-27, T-28, T-32 |
| RF-6 | T-15, T-16, T-30 |
| RF-7 | T-19, T-20, T-26 |
| RF-8 | T-07, T-08, T-15, T-16, T-19, T-20, T-25 |
| RF-9 | T-09, T-10, T-17, T-18, T-22, T-23, T-25 |
| RF-10 | T-25, T-27, T-32 |
| RF-11 | T-22, T-23, T-31, T-33 |
| RF-12 | T-19, T-20, T-22, T-24, T-25, T-32 |
| RNF-1 | T-02, T-22 |
| RNF-2 | T-34 |
| RNF-3 | T-24, T-27, T-32 |
| RNF-4 | T-23, T-31, T-33 |
| RNF-5 | T-30, T-34 |
| RNF-6 | T-03, T-04, T-05, T-06, T-08, T-18, T-21 |
| RNF-7 | T-34 |
| RNF-8 | T-25, T-26, T-27 |
| RNF-9 | T-29, T-32 |
| RNF-10 | T-31, T-33 |
| CL-1, CL-2, CL-3 | T-19, T-20, T-26 |
| CL-4, CL-11 | T-13, T-14 |
| CL-5 | T-15, T-16 |
| CL-6, CL-7 | T-03, T-04, T-11, T-12, T-15, T-16, T-21 |
| CL-8, CL-9, CL-10 | T-05, T-06, T-07, T-08, T-09, T-10, T-17, T-18, T-21 |
| CL-12 | T-21 |
| CL-13 | T-30, T-32 |
| CL-14 | T-31, T-33 |
| CL-15 | T-15, T-16, T-21 |
| CL-16, CL-17 | T-28 |

## Definición de terminado

- Todas las casillas marcadas y `node --test` en verde.
- Sin scroll horizontal a 375 y 320 px; consola limpia en los flujos verificados.
- `diarioEstudio_sessions` intacto y la lista de sesiones sin cambios.
- `MEMORY.md` actualizado.

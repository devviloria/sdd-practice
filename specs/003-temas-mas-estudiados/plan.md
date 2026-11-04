# Plan técnico — 003 Temas más estudiados

Plan de implementación basado en `spec.md`. Define archivos, responsabilidades, cálculo,
presentación y verificaciones; no amplía el alcance funcional de la spec.

## Enfoque

- La lógica de ranking será pura y recibirá las sesiones y `today` como argumentos. No
  consultará el reloj, el DOM ni `localStorage`.
- El periodo será el lunes local de `today` hasta `today`, ambos incluidos. Fechas se
  validarán y construirán por componentes locales; nunca se interpretarán con
  `new Date("AAAA-MM-DD")` ni se convertirán mediante `toISOString()`.
- La interfaz solo presentará el resultado calculado. El bloque se volverá a pintar al
  cargar la aplicación y después de registrar una sesión. Si no ocurre ninguno de esos
  eventos, conservará el último ranking calculado, sin temporizadores.
- Las sesiones se leerán sin modificarlas. No se cambiará el formato ni la clave de
  almacenamiento.

## Archivos y responsabilidades

| Archivo | Cambio previsto | Responsabilidad | Requisitos |
| --- | --- | --- | --- |
| `weekly-topics-logic.js` | Crear | Funciones puras para validar fechas, filtrar sesiones clasificables, agrupar temas, sumar minutos y asignar orden, puesto y medalla. Exponer una API compatible con script clásico y `require` de Node, siguiendo los módulos de lógica existentes. | RF-1, RF-2, RF-3, RF-5; RNF de fechas y datos |
| `tests/weekly-topics-logic.test.js` | Crear | Pruebas deterministas con `node:test` y `node:assert/strict`; `today` se proporciona en cada cálculo. | RF-1, RF-2, RF-3, RF-5 y casos límite |
| `weekly-topics-ui.js` | Crear | Leer sesiones y fecha local desde las funciones globales existentes; llamar a la lógica y renderizar estado vacío o filas usando nodos/texto seguros. No calcular totales ni alterar sesiones. | RF-1, RF-3, RF-5 y requisitos de accesibilidad |
| `index.html` | Modificar | Añadir el bloque «Temas más estudiados» junto a los bloques de métricas/objetivo y antes del mapa; cargar lógica e interfaz antes de `app.js`. | RF-1, RF-3, RF-5 |
| `styles.css` | Modificar | Dar estilo al bloque, las filas, los nombres textuales de las medallas y el estado vacío; conservar coherencia visual y evitar desbordes en móvil. | RF-1, RF-3, RF-5 y requisitos responsive |
| `app.js` | Modificar mínimamente | Invocar el renderizador al cargar la aplicación y después de registrar una sesión, dentro del mismo ciclo que actualiza el resto del dashboard. Sin uno de esos eventos, conservar el último ranking; el renderizador debe usar la fecha local de cada cálculo. | RF-4 |

Los tres archivos nuevos (`weekly-topics-logic.js`, `tests/weekly-topics-logic.test.js` y
`weekly-topics-ui.js`) ya están autorizados por el usuario. No se crearán archivos
adicionales sin la aprobación previa requerida por `AGENTS.md`.

La aplicación registra sesiones y no ofrece operaciones de edición o eliminación. No se
añadirán esos flujos, que no están definidos en la spec. El renderizador se invocará al
cargar la aplicación y después de registrar una sesión, tal como establece RF-4.

## Contrato de la lógica pura

La API principal será `buildWeeklyTopics(sessions, today)`, donde `today` es una fecha
local `AAAA-MM-DD`. Devolverá un resultado sin referencias mutables a las sesiones:

- Sin temas clasificables: `{ status: "empty", items: [] }`.
- Con temas: `{ status: "ranking", items: [...] }`, con filas que contengan el nombre
  visible, minutos acumulados, puesto denso y medalla (`Oro`, `Plata` o `Bronce`).

Las funciones auxiliares podrán mantenerse privadas salvo que sean útiles para probar el
cálculo. La API y sus resultados serán iguales en navegador y Node.

| Operación | Contrato y responsabilidad | Requisitos |
| --- | --- | --- |
| `parseLocalDate(value)` | Validar una fecha de calendario y construirla con año, mes y día locales; devolver una fecha inválida/nula si el texto no es real. | RF-1; RNF de fechas |
| `getWeekStart(today)` | Obtener el lunes local correspondiente a `today`, considerando lunes como inicio y domingo como final de semana. | RF-1 |
| `buildWeeklyTopics(sessions, today)` | Filtrar y clasificar, agregar minutos, ordenar, asignar puestos/medallas y devolver filas limitadas al tercer puesto denso. | RF-1, RF-2, RF-3, RF-5 |

Una sesión será clasificable únicamente si es un objeto con fecha real entre el lunes y
`today` inclusive, `topic` de texto no vacío después de `trim()` y minutos numéricos,
positivos y finitos. Los minutos se sumarán tal como están; varias sesiones de un tema,
incluidas las del mismo día, contribuirán al mismo total.

## Algoritmo

```text
FUNCIÓN buildWeeklyTopics(sessions, today):
  validar today y obtener hoyLocal y lunesLocal
  SI today no es válido: DEVOLVER estado vacío

  grupos = mapa vacío
  PARA CADA sesión, en el orden original:
    SI la sesión no es objeto: CONTINUAR
    fecha = validar y construir sesión.date como fecha local
    SI fecha no es válida o fecha < lunesLocal o fecha > hoyLocal: CONTINUAR
    SI topic no es texto: CONTINUAR
    nombre = retirar whitespace de ambos extremos de topic
    SI nombre está vacío: CONTINUAR
    SI minutes no es número finito o minutes <= 0: CONTINUAR

    clave = convertir nombre a minúsculas
    SI grupos no contiene clave:
      crear grupo con nombre visible = nombre, total = 0
    sumar minutes al total del grupo

  SI grupos está vacío: DEVOLVER { status: "empty", items: [] }

  ordenar grupos por total descendente
  ordenar nombres con el mismo total alfabéticamente,
    ignorando mayúsculas y manteniendo el orden de acentos

  puesto = 0
  totalAnterior = ninguno
  PARA CADA grupo ordenado:
    SI grupo.total != totalAnterior:
      puesto = puesto + 1
      totalAnterior = grupo.total
    asignar puesto y medalla correspondiente (1 Oro, 2 Plata, 3 Bronce)

  devolver grupos cuyo puesto <= 3
```

La clave del tema se obtiene quitando todo el whitespace exterior y convirtiendo a
minúsculas. El nombre visible es el nombre ya recortado de la primera sesión clasificable
de ese tema en el orden original de la lista; las sesiones que no clasifican no pueden
establecer esa capitalización. En el empate se ordena por nombre visible con comparación
alfabética española que ignore diferencias de mayúsculas.

El puesto se incrementa solo cuando cambia el total, no por cada fila. Así, dos temas
empatados en el primer puesto reciben oro y el total distinto siguiente recibe plata; el
filtro final conserva todos los grupos cuyo puesto sea 1, 2 o 3, incluso si hay más de
tres filas.

## Interfaz e integración

- Colocar una sección titulada «Temas más estudiados» después de las métricas y del bloque
  de objetivo semanal, y antes de la sección del mapa de actividad.
- Representar los resultados como una lista semántica. Cada fila mostrará el nombre del
  tema, los minutos y el nombre textual de su medalla («Oro», «Plata» o «Bronce»); el
  significado no dependerá solo del color. La lista evita anunciar una numeración ordinal
  que no reflejaría los puestos densos empatados.
- Mantener la sección visible sin filas cuando el resultado esté vacío y mostrar
  exactamente «Aún no hay temas estudiados esta semana». El mensaje podrá usar un estado
  accesible para que los cambios se comuniquen a tecnología de asistencia.
- Crear las filas con elementos DOM y `textContent`, sin interpolar los nombres guardados
  como HTML.
- La función de renderizado inicializará una sola vez cualquier configuración necesaria,
  obtendrá las sesiones vigentes y `getTodayLocalDateString()`, llamará a
  `WeeklyTopicsLogic.buildWeeklyTopics` y actualizará el contenido del bloque.
- Invocar el renderizador al iniciar y después del guardado de una sesión. No usar reloj en
  intervalos ni refrescos por paso del tiempo; el último ranking se conserva hasta que
  ocurra uno de esos dos eventos, y la nueva fecha se toma solo entonces.
- Los estilos deben permitir lectura y ajuste de filas en pantallas estrechas, conservar
  foco visible si hubiera controles en el futuro y no ocultar el texto de las medallas.
  La lista actual no necesita controles ni tab stops adicionales.

## Decisiones y alternativas descartadas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Lógica separada de DOM y almacenamiento, con `today` explícito | Cumple la constitución, permite resultados reproducibles y sigue el patrón de `weekly-goal-logic.js` y `heatmap-logic.js`. | Calcular ranking dentro de `app.js`, lo que mezcla responsabilidades y dificulta probar reglas sin navegador. |
| Ventana local desde lunes hasta hoy, con fecha validada por componentes | Es el periodo aprobado; impide desplazamientos de día por UTC y excluye futuro y semanas anteriores. | Usar los últimos siete días o un rango UTC. |
| Filtrar sesiones antes de seleccionar el nombre visible | Solo la primera sesión clasificable de esta semana determina la capitalización, como establece la spec. | Elegir la primera aparición histórica o la primera sesión aunque no clasifique. |
| Agrupar con nombre recortado y minúsculas; preservar el primer nombre visible | Agrupa diferencias aprobadas sin cambiar los datos originales. | Normalizar y mostrar siempre minúsculas, o modificar las sesiones guardadas. |
| Puestos densos y medalla compartida; incluir todas las filas hasta el puesto 3 | Respeta empates y permite más de tres filas solo cuando el empate amplía el top 3. | Ranking de competición con saltos o truncar a tres filas. |
| Lista semántica con palabras de medalla visibles | Los empates pueden repetir el puesto y el nombre de medalla ofrece información sin depender del color. | Usar una tabla ordinal genérica o comunicar la medalla solo mediante color/emoji. |
| Actualización por carga y registro, sin temporizador | Cumple RF-4 y mantiene la misma fecha de referencia hasta la siguiente carga o sesión registrada. | Temporizador periódico que cambie el ranking sin que ocurra uno de los eventos aprobados. |
| Lectura sin cambios del almacenamiento de sesiones | Conserva compatibilidad y evita migraciones o pérdidas de datos. | Guardar nombres normalizados o un ranking persistido. |

## Estrategia de pruebas

La lógica se verificará con `node --test`, siguiendo las pruebas existentes, sin añadir
paquetes ni configurar un build. Todas las pruebas de fecha pasarán `today` de forma
explícita. Cubrirán como mínimo:

- Lunes, domingo, cruce de mes/año y validación de fechas imposibles; los límites local
  lunes y hoy se incluyen, las fechas anteriores y futuras se excluyen.
- Sesiones nulas, fechas mal formadas, tema ausente/no textual/vacío, whitespace exterior
  con espacios y tabulaciones, y minutos cero, negativos, no numéricos, infinitos y
  decimales positivos.
- Agrupación por mayúsculas y whitespace exterior; suma de sesiones del mismo día y de
  días distintos; orden original determinando el nombre visible solo entre sesiones
  clasificables.
- Orden descendente de totales y orden alfabético que ignora mayúsculas dentro de empate.
- Medallas y puestos densos: empate en primero, empate en segundo o tercero, siguiente
  total sin salto, límites de tres puestos y expansión del número de filas por empate.
- Estado vacío, uno y dos temas; entradas repetidas; determinismo para iguales entradas y
  ausencia de mutación del array y sus sesiones.
- Regresión: ejecutar la suite existente y nueva con `node --test`; comprobar además
  `TZ=Europe/Madrid node --test` para fechas locales y cambios de horario.

La verificación manual de presentación se hará con Chrome DevTools abriendo `index.html`
por `file://`: confirmar orden antes del mapa, estado vacío y ranking con datos, texto de
medalla perceptible por lector de pantalla, lectura/zoom a 320 y 375 px y consola limpia.
Al cargar y registrar una sesión, comprobar que el ranking y las métricas se actualizan;
si cambia la fecha local sin que ocurra ninguno de esos eventos, comprobar que se conserva
el último ranking. El contenido de `diarioEstudio_sessions` no cambia salvo por la propia
sesión registrada. La prueba manual no reemplaza las pruebas puras.

## Flujo de pruebas por tarea

- Cada tarea de lógica incorpora sus casos nuevos en `tests/weekly-topics-logic.test.js`,
  ejecuta `node --test` para observar el fallo esperado, implementa esa misma parte de la
  lógica dentro de la tarea y vuelve a ejecutar `node --test`; la tarea solo se cierra en
  verde. No hay una tarea dedicada únicamente a dejar pruebas pendientes de implementación.
- En las tareas de interfaz, antes del cambio se ejecuta la comprobación manual pertinente
  y se registra el resultado que aún no cumple; el cambio y su comprobación satisfactoria
  se completan en la misma tarea. Al terminar cada tarea de interfaz también se ejecuta
  `node --test` y la suite debe quedar en verde.
- Las pruebas de lógica no dependen de la interfaz. `TZ=Europe/Madrid node --test` se
  ejecuta como verificación adicional junto a la revisión final de integración.

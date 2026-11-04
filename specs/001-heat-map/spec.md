# Spec 001 — Mapa de calor de estudio

## Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha, los minutos de la
semana y la lista de sesiones. Esos indicadores responden a "¿cuántos días seguidos
llevo?" y "¿cuánto he estudiado esta semana?", pero no permiten ver de un vistazo la
**regularidad** ni la **intensidad** del estudio a medio plazo.

Esta funcionalidad añade un mapa de calor tipo GitHub: una cuadrícula donde cada día de
las últimas 12 semanas ocupa una celda y su color indica cuántos minutos se estudiaron.
El objetivo es motivar la constancia haciendo visible el hábito, detectar semanas flojas
y celebrar los periodos intensos sin tener que leer la lista de sesiones.

Decisiones ya tomadas para esta versión:

- Periodo fijo de **12 semanas**, de lunes a domingo, terminando en la semana actual.
- **Cuatro niveles** de intensidad con umbrales fijos en minutos, más el nivel vacío.
- Detalle por día mediante **tooltip al pasar el cursor o al enfocar con teclado**; en
  pantallas táctiles, **al tocar el día**. Sin abrir otra vista.
- **Leyenda** Menos–Más.
- Cuadrícula fija: los días futuros se ven atenuados y nunca se colorean.
- El **día de hoy** se marca con un realce propio, distinto de los niveles.
- Se muestran las iniciales **lun / mié / vie** y el rango textual del periodo.
- El estado vacío distingue entre "no hay sesiones" y "ninguna en las últimas 12 semanas".
- Versión de **solo lectura**: no se editan ni se borran sesiones desde el mapa.

## Usuarios

- **Persona que registra sesiones con regularidad**: quiere confirmar de un vistazo que
  mantiene el hábito y en qué días rinde más.
- **Persona que vuelve tras un parón**: quiere ver cuándo estudió por última vez y cómo
  fue su actividad reciente.
- **Persona que empieza**: sin sesiones todavía, debe entender que el mapa está vacío
  porque aún no hay datos, no porque algo falle.
- **Persona que usa el móvil o el teclado**: necesita acceder a la información de cada
  día y ver el mapa completo sin desplazamientos incómodos.

## Historias de usuario

- **HU-1**: Como persona que estudia, quiero ver qué días he estudiado en las últimas 12
  semanas para valorar mi constancia de un vistazo.
- **HU-2**: Como persona que estudia, quiero que los días con más minutos destaquen sobre
  los de menos para identificar mis periodos más intensos.
- **HU-3**: Como persona que estudia, quiero consultar la fecha y los minutos de un día
  concreto sin salir de la pantalla ni abrir otra vista.
- **HU-4**: Como persona que acaba de registrar una sesión, quiero que el mapa se
  actualice al momento para confirmar que la sesión se ha tenido en cuenta.
- **HU-5**: Como persona que empieza, quiero entender por qué el mapa está vacío y qué
  debo hacer para que se llene.
- **HU-6**: Como persona que navega con teclado o desde el móvil, quiero llegar al detalle
  de cada día y ver las 12 semanas completas sin scroll horizontal.

## Requisitos funcionales

### RF-1 — Periodo visible de 12 semanas

El mapa representa siempre las 12 semanas (lunes a domingo) que terminan en la semana que
contiene hoy, es decir, 84 días.

Criterios de aceptación:

- El sistema deberá mostrar siempre 12 columnas semanales y 7 filas de días.
- La última columna deberá corresponder a la semana que contiene hoy.
- La primera columna deberá empezar en el lunes de la semana situada 11 semanas antes de
  la semana actual.
- La cuadrícula deberá cubrir 84 fechas consecutivas, sin huecos ni duplicados.

### RF-2 — Un día, una celda; varias sesiones se suman

Cada fecha ocupa una única celda. Los minutos de todas las sesiones de ese día se suman
para decidir su intensidad.

Criterios de aceptación:

- Cuando existan varias sesiones con la misma fecha, el sistema deberá sumar sus minutos
  antes de asignar el nivel de intensidad.
- Si una fecha no tiene sesiones, el sistema deberá asignarle el nivel 0 (sin estudio).
- El sistema deberá ignorar la hora o el orden de registro: solo cuenta la fecha.

### RF-3 — Escala de intensidad de cuatro niveles

La intensidad depende de los minutos totales del día, con umbrales fijos:

| Nivel | Minutos del día | Significado |
| --- | --- | --- |
| 0 | 0 | Sin estudio |
| 1 | 1–29 | Estudio breve |
| 2 | 30–59 | Estudio medio |
| 3 | 60–119 | Estudio alto |
| 4 | 120 o más | Estudio muy alto |

Criterios de aceptación:

- Cuando el total del día sea 0 minutos, el sistema deberá asignar el nivel 0.
- Cuando el total del día esté entre 1 y 29 minutos, el sistema deberá asignar el nivel 1.
- Cuando el total del día esté entre 30 y 59 minutos, el sistema deberá asignar el nivel 2.
- Cuando el total del día esté entre 60 y 119 minutos, el sistema deberá asignar el nivel 3.
- Cuando el total del día sea 120 minutos o más, el sistema deberá asignar el nivel 4.
- Los límites deberán resolverse sin ambigüedad: 29 → nivel 1, 30 → nivel 2, 59 → nivel 2,
  60 → nivel 3, 119 → nivel 3, 120 → nivel 4.

### RF-4 — Representación visual ordenada y distinguible

Los cuatro niveles se representan con tonos del mismo color, de menos a más intenso. El
nivel 0 se distingue claramente de los días con estudio.

Criterios de aceptación:

- Mientras se muestran los niveles, el sistema deberá usar una intensidad creciente y
  perceptible de nivel 1 a nivel 4.
- El sistema deberá representar el nivel 0 con un tono neutro que no se confunda con el
  nivel 1.
- El sistema no deberá depender únicamente del color para transmitir la información: cada
  día deberá ofrecer su detalle textual.

### RF-5 — Detalle por día y leyenda

Al pasar el cursor sobre un día, al enfocarlo con el teclado o, en pantallas táctiles, al
tocarlo, se muestra su fecha y sus minutos. Una leyenda explica la escala.

Criterios de aceptación:

- Cuando el cursor se sitúe sobre un día no futuro, el sistema deberá mostrar su fecha y
  los minutos estudiados ese día.
- Cuando un día no futuro reciba el foco del teclado, el sistema deberá mostrar el mismo
  detalle que con el cursor y hacer visible el foco.
- Cuando se toque un día no futuro en una pantalla táctil, el sistema deberá mostrar su
  detalle; un segundo toque sobre el mismo día, o un toque fuera de la cuadrícula, deberá
  ocultarlo.
- Si el día no tiene sesiones, el sistema deberá mostrar "Sin estudio".
- Si el día es futuro, su nombre accesible deberá indicar "Día futuro"; no deberá mostrar
  tooltip ni responder al toque.
- El sistema deberá mostrar una leyenda permanente con los cuatro niveles, rotulada
  "Menos" y "Más" en los extremos.
- El detalle no deberá mostrar la lista de sesiones ni abrir otra vista.

### RF-6 — Actualización al registrar una sesión

Criterios de aceptación:

- Cuando se registre una sesión válida, el sistema deberá actualizar el mapa en la misma
  pantalla, sin recargar ni volver a abrir la aplicación.
- Cuando la sesión registrada caiga dentro del periodo visible, el sistema deberá reflejar
  sus minutos en el día correspondiente, incluida la posibilidad de subir de nivel.
- Cuando la sesión registrada caiga fuera del periodo visible (más antigua de 12 semanas),
  el mapa deberá permanecer igual y no mostrar errores.

### RF-7 — Estado vacío

Criterios de aceptación:

- Si no existe ninguna sesión guardada, el sistema deberá mostrar la cuadrícula completa
  en nivel 0 y el mensaje "Aún no hay sesiones registradas".
- Si existen sesiones pero todas son anteriores al periodo visible, el sistema deberá
  mostrar la cuadrícula vacía y el mensaje "Sin sesiones en las últimas 12 semanas".
- Si existen sesiones con fecha futura, el sistema no deberá contarlas como actividad y
  no deberá usarlas para ocultar el estado vacío.

### RF-8 — Días futuros

Criterios de aceptación:

- Si la fecha de un día es posterior a hoy, el sistema deberá mostrarlo atenuado y con
  nivel 0.
- Si existen sesiones con fecha futura, el sistema deberá ignorarlas por completo: no
  colorean el día, no suman minutos y no alteran la leyenda ni el estado vacío.
- Los días futuros no deberán ser enfocables ni responder al toque; su nombre accesible
  podrá indicar "Día futuro", pero no mostrarán detalle interactivo.

### RF-9 — Orientación temporal

Criterios de aceptación:

- El sistema deberá ordenar las semanas de la más antigua (izquierda) a la más reciente
  (derecha).
- El sistema deberá ordenar los días de lunes (arriba) a domingo (abajo).
- El sistema deberá mostrar al menos las iniciales "lun", "mié" y "vie" como referencia
  vertical de los días.
- El sistema deberá mostrar el rango del periodo visible en texto, con los meses y el año
  correspondientes; si el periodo cruza de año, deberá mostrar ambos años.

### RF-10 — Accesibilidad y navegación por teclado

Criterios de aceptación:

- Mientras se navega con teclado, el sistema deberá permitir recorrer los días no futuros
  en orden cronológico y mostrar el detalle de cada uno.
- Cada día deberá tener un nombre accesible que incluya su fecha y sus minutos, para que
  la información no dependa del color.
- El foco del teclado deberá ser siempre visible.

### RF-11 — Vista móvil

Criterios de aceptación:

- Cuando el ancho disponible sea de 375 px, el sistema deberá mostrar las 12 semanas
  completas sin desplazamiento horizontal.
- Mientras el ancho sea reducido, el sistema deberá mantener las celdas legibles y
  distinguibles entre sí.
- El mapa deberá integrarse en la pantalla principal sin tapar ni romper las secciones
  existentes (rachas, formulario y lista de sesiones).

### RF-12 — Día de hoy

Criterios de aceptación:

- El sistema deberá marcar visualmente el día de hoy con un realce propio que no se
  confunda con ninguno de los niveles de intensidad.
- El realce del día de hoy deberá mantenerse aunque hoy no tenga sesiones.
- El realce deberá ser perceptible tanto en escritorio como en móvil.

## Requisitos no funcionales

- **RNF-1 — Simplicidad y uso local**: la funcionalidad debe funcionar sin conexión, sin
  instalación adicional y sin servicios externos.
- **RNF-2 — Rendimiento**: el mapa debe mostrarse y actualizarse sin demora perceptible;
  con hasta 1.000 sesiones guardadas, el cálculo y el dibujo no deben bloquear la interfaz
  ni superar 100 ms en un equipo de uso habitual.
- **RNF-3 — Accesibilidad**: contraste suficiente para distinguir todos los niveles,
  foco visible, información disponible sin depender solo del color y nombres accesibles
  en cada día.
- **RNF-4 — Responsive**: sin scroll horizontal a 375 px; a 320 px debe seguir siendo
  usable aunque las celdas se reduzcan.
- **RNF-5 — Datos sagrados**: la funcionalidad no debe modificar, borrar ni reordenar las
  sesiones existentes. Solo lee datos.
- **RNF-6 — Fechas locales**: todos los cálculos de días y semanas usan la fecha local
  del usuario; un cambio de día no debe desplazar las celdas por zonas horarias.
- **RNF-7 — Compatibilidad**: debe funcionar con los datos ya guardados, sin migraciones
  ni pérdida de sesiones antiguas.
- **RNF-8 — Idioma**: textos de interfaz y mensajes en español; fechas mostradas en
  formato local español.
- **RNF-9 — Legibilidad del detalle**: el tooltip no debe quedar cortado por los bordes de
  la pantalla ni tapar la celda que se está consultando.
- **RNF-10 — Objetivo táctil**: cada día debe ofrecer un área de toque de al menos
  24 × 24 px, sin solaparse con las celdas vecinas.

## Casos límite

- **CL-1 — Sin sesiones**: cuadrícula completa en nivel 0, leyenda visible y mensaje de
  estado vacío.
- **CL-2 — Solo sesiones antiguas**: si todas las sesiones son anteriores a las 12
  semanas, el mapa se ve vacío y el mensaje lo aclara; no se pierde ni se oculta la lista
  de sesiones existente.
- **CL-3 — Sesiones futuras**: se ignoran para colores, minutos y estado vacío; el día
  futuro permanece atenuado.
- **CL-4 — Umbrales exactos**: 29, 30, 59, 60, 119 y 120 minutos producen los niveles 1,
  2, 2, 3, 3 y 4 respectivamente.
- **CL-5 — Varias sesiones el mismo día**: se suman; por ejemplo, 20 + 25 minutos dan
  nivel 2.
- **CL-6 — Minutos inválidos**: sesiones con minutos vacíos, no numéricos, cero o
  negativos se tratan como 0 minutos y no rompen el mapa.
- **CL-7 — Fechas inválidas**: sesiones con fecha no reconocible se ignoran sin errores y
  sin afectar al resto.
- **CL-8 — Cambio de año**: el periodo puede cruzar diciembre y enero; las semanas y el
  rango mostrado deben seguir siendo correctos e incluir ambos años.
- **CL-9 — Cambio de hora estacional**: el paso de horario de verano a invierno no debe
  duplicar, perder ni desplazar ningún día.
- **CL-10 — Hoy lunes o domingo**: la última columna es la semana actual en ambos casos;
  si hoy es lunes, los seis días restantes se ven futuros y atenuados.
- **CL-11 — Día con muchos minutos**: cualquier total de 120 minutos o más se muestra en
  el nivel máximo, sin desbordar la escala.
- **CL-12 — Datos corruptos o ilegibles**: si las sesiones guardadas no se pueden
  interpretar, el sistema muestra el estado vacío sin errores visibles y sin alterar los
  datos almacenados.
- **CL-13 — Aplicación abierta al cambiar el día**: el periodo se calcula al mostrar la
  pantalla y al registrar una sesión; no se desplaza solo a medianoche hasta que se
  recargue o se registre una sesión.
- **CL-14 — Pantallas muy estrechas**: a 320 px no debe haber scroll horizontal ni celdas
  solapadas; si no cabe con el tamaño habitual, las celdas se reducen.
- **CL-15 — Sesiones duplicadas o con el mismo identificador**: cuentan por su fecha y sus
  minutos, sin descartar ninguna.
- **CL-16 — Toque en móvil**: tocar un día muestra su detalle; un segundo toque en el
  mismo día o un toque fuera de la cuadrícula lo oculta; tocar un día futuro no hace nada.
- **CL-17 — Toque y foco a la vez**: si un día tiene foco de teclado y luego se toca otro,
  el detalle visible debe corresponder al último día consultado.

## Fuera de alcance

- Selector de periodo (3, 6, 12 meses o año natural).
- Filtros por tema o por rango de fechas.
- Exportar, compartir o imprimir el mapa.
- Editar o borrar sesiones desde el mapa.
- Ver o gestionar la lista de sesiones de un día: el toque solo muestra el detalle del día.
- Animaciones, transiciones o efectos de carga.
- Comparación con periodos anteriores, medias, objetivos o metas.
- Notificaciones, recordatorios o recomendaciones.
- Sincronización entre dispositivos, cuentas o usuarios.
- Cambios en el formato de los datos guardados o en los indicadores existentes (racha,
  mejor racha, minutos de la semana).
- Datos de ejemplo o modo demostración.
- Personalización de colores o de la escala de intensidad.

## Criterios de finalización

- Todos los requisitos funcionales cumplen sus criterios de aceptación.
- La lógica del mapa (periodo de 84 días, suma por día, umbrales, exclusión de futuros y
  cambios de año) está cubierta por pruebas automatizadas en verde, según la constitución
  del proyecto.
- Verificación manual completada en escritorio y a 375 px: detalle con cursor, teclado y
  toque, leyenda, estado vacío, día de hoy marcado, actualización tras registrar y
  ausencia de scroll horizontal.
- La consola del navegador no muestra errores durante los flujos comprobados.
- Las sesiones existentes siguen intactas y visibles en la lista.
- La documentación del proyecto queda actualizada (spec, plan, tareas y memoria).

## Dudas abiertas

Ninguna. Todas las decisiones de esta versión están resueltas.

# Spec 002 — Objetivo semanal de estudio

Estado: borrador

## Contexto y objetivo

El Diario de Estudio ya permite registrar sesiones y muestra la racha actual, la mejor
racha, los minutos de la semana y el mapa de calor de las últimas 12 semanas. Esos
indicadores describen lo que ya ha pasado, pero no existe una referencia de lo que la
persona quiere conseguir: sin una meta, los minutos de la semana son un número suelto y
no hay forma de saber si se ha estudiado lo suficiente.

Esta funcionalidad añade un **objetivo semanal**: la persona fija cuántos minutos quiere
estudiar cada semana, la aplicación muestra cuánto lleva respecto a esa meta y avisa
cuando la alcanza. El propósito es convertir la intención ("esta semana quiero estudiar
más") en una referencia concreta y visible que motive a cumplirla.

Decisiones ya tomadas para esta versión:

- Un **único objetivo** de minutos por semana, **compartido por todas las semanas**.
- El objetivo **se conserva** en el navegador y se puede **fijar, cambiar y quitar**.
- Se muestra en un **bloque propio**, situado **justo debajo de las tarjetas de resumen**
  y **antes del mapa de calor**, que pasa a ir después.
- El progreso se expresa con **texto ("X de Y min"), porcentaje y barra de progreso**.
- La referencia temporal es la **semana actual, de lunes a domingo en fecha local**, la que
  contiene la **fecha de referencia del último cálculo (R)**: la fecha local de hoy en el
  momento del último recálculo. El progreso se calcula **del lunes de esa semana a R**,
  igual que la tarjeta "Minutos semana".
- **Sin historial de semanas**: al recalcular en una semana nueva el progreso vuelve a cero
  y no se guarda ni se puede consultar el resultado de semanas anteriores.
- **Sin objetivo fijado** el bloque permanece visible con un botón para fijarlo.
- Al **alcanzar o superar** el objetivo la barra se llena y aparece "¡Objetivo cumplido!".
- Valores válidos: **minutos enteros de 1 a 10.080** (7 días × 24 horas). Un valor
  guardado inválido o ilegible se trata como "sin objetivo".
- El progreso se recalcula **al cargar la aplicación y al actuar** (registrar una sesión o
  fijar, cambiar o quitar el objetivo); no hay temporizador ni cambio automático por el
  paso de la medianoche o de la semana. Mientras no ocurra uno de esos cálculos, el bloque
  mantiene en pantalla la última semana calculada, igual que la tarjeta "Minutos semana".

## Usuarios

- **Persona que empieza la semana con una intención**: quiere fijar una meta concreta y
  verla siempre a la vista para no olvidarla.
- **Persona que estudia con regularidad**: quiere saber cuánto le falta para cumplir sin
  tener que comparar números mentalmente.
- **Persona que ha cumplido la meta**: quiere confirmación inmediata y la posibilidad de
  subir el objetivo o retirarlo.
- **Persona que vuelve tras un parón**: quiere fijar un objetivo realista sin que las
  semanas pasadas le penalicen.
- **Persona que usa el móvil, el teclado o un lector de pantalla**: necesita fijar,
  editar y quitar el objetivo y consultar el progreso sin depender del color ni del ratón.

## Historias de usuario

- **HU-1**: Como persona que estudia, quiero fijar cuántos minutos quiero estudiar por
  semana para tener una meta concreta que guíe mi esfuerzo.
- **HU-2**: Como persona que estudia, quiero ver cuánto llevo de esa meta, en minutos y en
  porcentaje, para saber si voy bien sin hacer cuentas.
- **HU-3**: Como persona que estudia, quiero que la barra refleje mi avance de un vistazo
  para percibir el progreso sin leer números.
- **HU-4**: Como persona que ha cumplido la meta, quiero ver un mensaje claro de que lo he
  conseguido para sentir reconocimiento por el esfuerzo.
- **HU-5**: Como persona que cambia de intención, quiero editar o quitar el objetivo sin
  perder ninguna sesión para adaptarlo a mi situación.
- **HU-6**: Como persona que no ha fijado objetivo, quiero entender qué es este bloque y
  cómo fijarlo para empezar a usarlo.
- **HU-7**: Como persona que usa el móvil o el teclado, quiero fijar y consultar el
  objetivo sin zoom, sin scroll horizontal y con foco visible.

## Definiciones

- **Objetivo semanal**: número entero de minutos que la persona quiere estudiar en una
  semana. Es único, se reutiliza en todas las semanas y no está ligado a una semana
  concreta.
- **Valor canónico del objetivo**: la forma normalizada con la que el sistema guarda y
  muestra el objetivo: número entero entre 1 y 10.080, ambos incluidos, sin signo, sin
  decimales, sin exponente y sin separadores. Al leer el valor guardado se aceptan tanto
  ese número entero como un texto formado solo por dígitos (con espacios en los extremos
  permitidos) que represente un entero del rango; ambos se normalizan al mismo entero
  canónico, que es el que se usa para calcular y para mostrar.
- **Fecha de referencia del último cálculo (R)**: fecha local del dispositivo en el
  instante del último momento de cálculo definido en RF-9 (cargar la aplicación, registrar
  una sesión o fijar, cambiar o quitar el objetivo). Es la única "fecha de hoy" que usa el
  bloque: si la aplicación sigue abierta y cambia el día o la semana sin que ocurra otro
  cálculo, R no cambia.
- **Semana actual (semana mostrada)**: la semana de lunes a domingo, en fecha local, que
  contiene R. Es la única semana que el bloque usa para calcular y mostrar el progreso. Si
  la aplicación sigue abierta de domingo a lunes sin un nuevo cálculo, la semana actual
  sigue siendo la de R hasta que se cargue de nuevo o se actúe, igual que la tarjeta
  "Minutos semana"; eso no es historial: no se guarda ni se recupera tras recargar.
- **Progreso de la semana (X)**: minutos acumulados de las sesiones con fecha entre el
  lunes de la semana actual y R, ambos incluidos. Debe ser exactamente el mismo número
  que muestra la tarjeta "Minutos semana" en ese momento.
- **Sesión válida**: sesión aceptada por las validaciones vigentes del formulario de
  registro (fecha presente, tema no vacío y minutos enteros mayores que 0) y que cuenta
  para la tarjeta "Minutos semana" (fecha entre el lunes de la semana actual y R).
- **Fecha no reconocible**: fecha que el cálculo de la tarjeta "Minutos semana" descarta
  por no poder interpretarla. El bloque del objetivo no aplica ninguna validación de fecha
  distinta de la de la tarjeta.
- **Objetivo cumplido**: X es igual o mayor que el objetivo.
- **Sin objetivo**: no hay ningún valor guardado, o el valor guardado no es un objetivo
  válido según RF-11.
- **Porcentaje mostrado (P)**: entero entre 0 y 100, resultado de redondear hacia abajo
  (X ÷ objetivo) × 100 y limitar el resultado a 100. Nunca supera 100 aunque X supere el
  objetivo.

## Requisitos funcionales

### RF-1 — Fijar el objetivo

Criterios de aceptación:

- SI no existe un objetivo válido, ENTONCES el sistema deberá mostrar en el bloque el
  título, el mensaje "Aún no has fijado un objetivo semanal" y el botón "Fijar objetivo".
- CUANDO la persona active "Fijar objetivo", el sistema deberá mostrar un campo etiquetado
  "Minutos por semana" con el texto de ayuda "Entre 1 y 10.080 minutos" y los botones
  "Guardar" y "Cancelar".
- CUANDO la persona guarde un valor válido, el sistema deberá adoptarlo como objetivo y
  mostrar de inmediato el progreso de la semana actual calculado con las sesiones ya
  registradas.
- CUANDO la persona cancele mientras introduce un objetivo, el sistema deberá descartar lo
  escrito y volver al estado anterior, sin guardar cambios.
- El campo deberá mostrar el valor sin separadores de miles y sin decimales.

### RF-2 — Cambiar el objetivo

Criterios de aceptación:

- MIENTRAS exista un objetivo válido, el sistema deberá ofrecer el botón "Editar".
- CUANDO la persona active "Editar", el sistema deberá mostrar el campo con el valor
  actual del objetivo, sin separadores de miles.
- CUANDO la persona guarde un valor válido distinto del actual, el sistema deberá
  reemplazar el objetivo y recalcular el texto, el porcentaje, la barra y el estado de
  cumplimiento en la misma pantalla.
- CUANDO la persona guarde el mismo valor que ya tenía, el sistema deberá aceptarlo sin
  error y sin cambios visibles en el progreso.
- CUANDO la persona cancele la edición, el sistema deberá conservar el objetivo anterior
  sin cambios.
- El sistema no deberá modificar ninguna sesión al cambiar el objetivo.

### RF-3 — Quitar el objetivo

Criterios de aceptación:

- MIENTRAS exista un objetivo válido, el sistema deberá ofrecer el botón "Quitar".
- CUANDO la persona quite el objetivo, el sistema deberá eliminarlo y volver al estado
  "sin objetivo" en la misma pantalla.
- La acción de quitar deberá aplicarse de forma inmediata, sin pedir confirmación
  adicional, porque el objetivo se puede volver a fijar en cualquier momento.
- Al quitar el objetivo, el sistema no deberá borrar, modificar ni ocultar ninguna sesión
  ni alterar los demás indicadores.

### RF-4 — Persistencia del objetivo

Criterios de aceptación:

- CUANDO la persona guarde un objetivo válido, el sistema deberá conservarlo en el
  navegador de modo que siga disponible al cerrar y volver a abrir la aplicación en el
  mismo dispositivo.
- El objetivo guardado no deberá depender de ninguna cuenta, conexión a internet ni
  servicio externo.
- El sistema deberá guardar el objetivo de forma independiente de las sesiones: la
  lectura, el guardado o la eliminación del objetivo no deberán escribir sobre las
  sesiones existentes.
- El sistema deberá guardar el objetivo en su valor canónico definido en esta spec.
- SI el navegador rechaza el guardado o no conserva el valor, ENTONCES el sistema no
  deberá aplicar el objetivo nuevo, deberá mantener el objetivo anterior si existía y
  deberá mostrar en el bloque el aviso "No se ha podido guardar el objetivo".
- Mientras el aviso esté visible, el resto de la pantalla deberá seguir funcionando y
  mostrando los mismos valores que antes del intento.
- El aviso deberá desaparecer cuando se guarde correctamente un objetivo o cuando la
  persona cancele la edición.

### RF-5 — Progreso de la semana actual

Criterios de aceptación:

- El progreso X deberá coincidir **exactamente** con el número que muestra la tarjeta
  "Minutos semana" en ese mismo momento: misma semana, mismo cálculo y mismo resultado.
- La tarjeta y el bloque no deberán poder mostrar números distintos; si divergen, es un
  fallo de la funcionalidad. Ambos deberán actualizarse en el mismo instante y con la
  misma fecha de referencia R en cada momento de cálculo definido en RF-9.
- CUANDO existan varias sesiones con la misma fecha dentro de la semana actual, el sistema
  deberá sumar sus minutos al progreso.
- El sistema deberá ignorar las sesiones con fecha posterior a R, incluidas las de esta
  misma semana.
- El sistema deberá ignorar las sesiones anteriores al lunes de la semana actual.
- El sistema deberá ignorar las sesiones con minutos vacíos, no numéricos, cero o
  negativos, sin que el progreso se interrumpa ni se muestre un error.
- El sistema deberá ignorar las fechas no reconocibles, entendidas exactamente como las
  que descarta el cálculo de la tarjeta "Minutos semana"; no deberá aplicar ninguna regla
  de fecha adicional ni distinta.
- El progreso nunca deberá ser negativo.
- SI X tuviera decimales, ENTONCES el sistema deberá conservar el mismo valor que la
  tarjeta, sin redondearlo ni truncarlo; solo podrá cambiar la forma de escribir el
  número, nunca su valor.

### RF-6 — Presentación del progreso

Criterios de aceptación:

- El sistema deberá mostrar el progreso como texto con el formato "X de Y min", donde X es
  el progreso y Y el objetivo.
- En el texto del bloque, los miles se separarán con punto (por ejemplo, "1.200 de
  3.000 min").
- SI X tiene decimales, ENTONCES se mostrarán con coma decimal y sin redondear, con el
  separador de miles solo en la parte entera; el valor deberá seguir coincidiendo con el
  de la tarjeta.
- El sistema deberá mostrar el porcentaje P definido en esta spec, como número entero
  seguido del signo "%".
- El sistema deberá mostrar una barra de progreso cuya parte rellena corresponda a P, de
  modo que se vea vacía al 0 % y completa al 100 %.
- SI X supera el objetivo, ENTONCES la barra deberá verse completa y el texto deberá
  mostrar los minutos reales acumulados (por ejemplo, "3.240 de 3.000 min") y el
  porcentaje deberá seguir siendo 100 %.
- SI X es mayor que 0 pero P es 0, ENTONCES la barra deberá verse vacía, el porcentaje
  deberá mostrar "0 %" y el texto deberá mostrar los minutos reales acumulados.
- El sistema deberá presentar el texto, el porcentaje y la barra de forma que se
  entiendan juntos como un único indicador de avance.

### RF-7 — Estado sin objetivo

Criterios de aceptación:

- SI no existe un objetivo válido, ENTONCES el sistema deberá mantener visible el bloque,
  con el título "Objetivo semanal", el mensaje "Aún no has fijado un objetivo semanal" y
  el botón "Fijar objetivo".
- Mientras no haya objetivo, el sistema no deberá mostrar texto de progreso, porcentaje,
  barra ni mensaje de objetivo cumplido.
- Al fijar, cambiar o quitar el objetivo, las secciones de alrededor deberán conservar su
  orden y su legibilidad; el bloque podrá cambiar de alto (por ejemplo, al abrir el
  editor) sin solaparse con otras secciones ni provocar scroll horizontal.

### RF-8 — Estado cumplido

Criterios de aceptación:

- CUANDO X sea igual al objetivo, el sistema deberá mostrar la barra completa, el
  porcentaje 100 % y el mensaje "¡Objetivo cumplido!".
- CUANDO X supere el objetivo, el sistema deberá mantener la barra completa, el porcentaje
  100 %, el mensaje "¡Objetivo cumplido!" y los minutos reales en el texto.
- Mientras no se alcance el objetivo, el sistema no deberá mostrar el mensaje de objetivo
  cumplido.
- El mensaje deberá aparecer en el mismo bloque, sin abrir otra vista ni requerir una
  acción de la persona.
- Los botones "Editar" y "Quitar" deberán seguir disponibles cuando el objetivo esté
  cumplido.

### RF-9 — Renovación semanal y momento del cálculo

Criterios de aceptación:

- El mismo objetivo deberá aplicarse a todas las semanas, sin que la persona tenga que
  volver a fijarlo.
- El sistema deberá recalcular el progreso en exactamente estos momentos: al cargar la
  aplicación, al registrar una sesión y al fijar, cambiar o quitar el objetivo.
- CUANDO comience una semana nueva (lunes en fecha local) y la persona cargue la
  aplicación, el sistema deberá mostrar el progreso de esa semana, que será 0 si aún no
  hay sesiones, conservando el objetivo.
- SI la aplicación permanece abierta y cambia el día o la semana (por ejemplo, de domingo
  a lunes) sin que la persona realice ninguna de las acciones anteriores, ENTONCES el
  sistema deberá seguir mostrando el progreso calculado con R, es decir, el de la semana
  actual del último cálculo, hasta que se cargue de nuevo, se registre una sesión o se
  modifique el objetivo; deberá hacerlo igual que la tarjeta "Minutos semana".
- El sistema no deberá usar temporizadores ni detectar por sí mismo el paso de la
  medianoche o del cambio de semana.
- El sistema no deberá guardar ni recuperar el progreso ni el resultado de cumplimiento de
  semanas anteriores: no hay historial, no se puede consultar ninguna semana pasada y, tras
  recargar o tras un nuevo cálculo, la semana mostrada es siempre la de la nueva R. Esto no
  contradice el criterio anterior: la última semana calculada permanece en pantalla solo
  como foto congelada hasta el siguiente cálculo, sin guardarse en ningún sitio.
- Al fijar o cambiar el objetivo en mitad de la semana, el sistema deberá contar las
  sesiones desde el lunes de esa misma semana hasta R.

### RF-10 — Valores válidos y validación de entrada

Criterios de aceptación:

- El sistema deberá aceptar únicamente minutos enteros entre 1 y 10.080, ambos incluidos.
- El campo solo deberá admitir contenido numérico entero, con mínimo 1 y máximo 10.080.
- La validación deberá realizarse al enviar el formulario del objetivo, no mientras se
  escribe.
- Las cadenas se interpretarán según esta tabla:

  | Entrada | Resultado |
  | --- | --- |
  | "300" | Aceptada como 300 |
  | " 300 " | Aceptada como 300; se ignoran los espacios de los extremos |
  | "0300" | Aceptada como 300; los ceros a la izquierda se normalizan |
  | "1" | Aceptada como 1 |
  | "10080" | Aceptada como 10.080 |
  | "3.000" | Rechazada: el separador de miles no se admite en el campo |
  | "+300" y "-300" | Rechazadas: no se admiten signos |
  | "1e3" y "3E2" | Rechazadas: no se admite notación exponencial |
  | "300,0" y "300.0" | Rechazadas: no se admiten decimales |
  | "0" | Rechazada: por debajo del mínimo |
  | "10081" | Rechazada: por encima del máximo |
  | "" y " " | Rechazadas: el campo está vacío |
  | "abc" | Rechazada: no es un número |

- SI el valor introducido no es válido, ENTONCES el sistema deberá rechazarlo, no
  guardarlo y mostrar el mensaje "Introduce un número entero de minutos entre 1 y 10.080".
- Mientras el valor introducido no sea válido, el sistema deberá conservar el objetivo
  anterior si existía, y el estado "sin objetivo" si no existía.
- El mensaje de error deberá permanecer visible desde el envío inválido hasta que la
  persona modifique el campo o guarde un valor válido.
- El sistema deberá aceptar sin errores los valores límite 1 y 10.080.

### RF-11 — Datos inválidos o ilegibles

Criterios de aceptación:

- El sistema deberá considerar objetivo guardado válido tanto al número entero entre 1 y
  10.080 como al texto formado solo por dígitos (con espacios en los extremos permitidos)
  que represente un entero entre 1 y 10.080; en ambos casos deberá normalizarlo al mismo
  entero canónico definido en esta spec y usarlo como objetivo.
- El sistema deberá rechazar como objetivo guardado los decimales, los signos, los
  exponentes, los separadores de miles o decimales, el contenido vacío, el texto no
  numérico y los valores fuera del rango.
- SI el objetivo guardado no es válido o no se puede leer, ENTONCES el sistema deberá
  tratarlo como si no hubiera objetivo.
- En ese caso el sistema deberá mostrar el estado "sin objetivo" descrito en RF-7, sin
  mensajes de error técnicos y sin romper el resto de la pantalla.
- El sistema no deberá borrar ni modificar el valor inválido guardado mientras no se
  guarde un objetivo válido; solo entonces lo reemplazará.
- El sistema no deberá modificar ni eliminar las sesiones a causa de un objetivo inválido,
  y deberá seguir mostrando la racha, la mejor racha, la tarjeta "Minutos semana", el mapa
  y la lista de sesiones con normalidad.

### RF-12 — Actualización al registrar una sesión

Criterios de aceptación:

- CUANDO se registre una sesión válida con fecha dentro de la semana actual y no posterior
  a R, el sistema deberá actualizar el progreso, el porcentaje y la barra en la misma
  pantalla, sin recargar.
- CUANDO se registre una sesión con fecha anterior a la semana actual o posterior a R, el
  progreso deberá permanecer igual y no deberá mostrarse ningún error.
- CUANDO una sesión haga que el progreso alcance o supere el objetivo, el sistema deberá
  mostrar el estado cumplido en la misma actualización.
- El nuevo progreso deberá seguir coincidiendo con el de la tarjeta "Minutos semana".

### RF-13 — Orden de la pantalla y convivencia con los indicadores existentes

Criterios de aceptación:

- El sistema deberá mostrar las secciones en este orden exacto: tarjetas de resumen
  (racha actual, mejor racha y minutos semana), bloque del objetivo semanal, mapa de
  calor, formulario de registro y lista de sesiones.
- El sistema no deberá modificar la tarjeta "Minutos semana": seguirá mostrando el mismo
  valor y con el mismo formato que antes de esta funcionalidad.
- El sistema no deberá alterar el cálculo ni la presentación de la racha actual, la mejor
  racha, el mapa de calor ni la lista de sesiones.
- El bloque del objetivo no deberá tapar, solapar ni romper ninguna sección existente.

### RF-14 — Vista móvil

Criterios de aceptación:

- A 375 px y a 320 px de ancho, el sistema no deberá producir desplazamiento horizontal.
- A 375 px, el bloque deberá verse completo, con texto, porcentaje, barra y botones
  legibles.
- A 320 px, el bloque deberá seguir siendo usable: los textos podrán ocupar varias líneas,
  los botones deberán quedar completamente dentro del viewport y el contenido no deberá
  cortarse ni solaparse.
- SI el texto del progreso es largo (por ejemplo, "10.080 de 10.080 min" con porcentaje),
  ENTONCES deberá ajustarse en varias líneas sin desbordar el bloque.
- La barra de progreso deberá adaptarse al ancho disponible y mantener visible la
  proporción rellena.
- El campo de minutos deberá usar un tamaño de letra de al menos 16 px, de modo que iOS no
  amplíe la pantalla automáticamente al enfocarlo.
- El bloque deberá apilarse correctamente bajo las tarjetas de resumen en pantallas
  estrechas.

### RF-15 — Accesibilidad

Criterios de aceptación:

- La barra de progreso deberá exponer a las tecnologías de asistencia un nombre en español
  que incluya el progreso real X, el objetivo Y y el porcentaje P.
- Cuando X supere Y, el relleno visual podrá recortarse al 100 %, pero el valor accesible y
  el texto deberán comunicar X real, Y y el porcentaje.
- La información del avance no deberá depender únicamente del color ni de la barra: el
  texto "X de Y min" y el porcentaje deberán estar siempre presentes.
- El mensaje "¡Objetivo cumplido!" deberá anunciarse a las tecnologías de asistencia
  cuando aparezca, sin robar el foco.
- El sistema deberá permitir fijar, cambiar y quitar el objetivo usando solo el teclado,
  con el foco siempre visible.
- CUANDO se abra el editor del objetivo, el foco deberá situarse en el campo de minutos.
- CUANDO se cierre el editor (al guardar o al cancelar), el foco deberá volver a la acción
  que lo abrió o, si esa acción ya no existe, al bloque del objetivo.
- CUANDO se muestre un error de validación, el foco deberá situarse en el campo de minutos
  y el mensaje deberá quedar asociado a ese campo.
- El campo de minutos deberá tener etiqueta asociada y texto de ayuda con el rango
  admitido.

## Requisitos no funcionales

- **RNF-1 — Simplicidad y uso local**: la funcionalidad debe funcionar sin conexión, sin
  instalación adicional, sin cuentas y sin servicios externos.
- **RNF-2 — Rendimiento**: el progreso debe calcularse y mostrarse sin demora perceptible;
  con hasta 1.000 sesiones guardadas, el cálculo y el repintado no deben bloquear la
  interfaz ni superar 100 ms en un equipo de uso habitual.
- **RNF-3 — Accesibilidad**: el texto del bloque debe alcanzar un contraste mínimo de
  4,5:1 sobre su fondo; la barra (relleno frente a pista) y los bordes de los controles
  deben alcanzar al menos 3:1. El foco debe ser visible en todos los controles. El estado
  (sin objetivo, en progreso, cumplido) debe distinguirse por su texto, no solo por color.
- **RNF-4 — Responsive**: sin scroll horizontal a 375 px ni a 320 px; los botones deben
  quedar completamente dentro del viewport y los textos deben ajustarse sin cortarse.
- **RNF-5 — Datos sagrados**: la funcionalidad no debe modificar, borrar, duplicar ni
  reordenar las sesiones existentes. El objetivo es un dato nuevo e independiente.
- **RNF-6 — Fechas locales**: todos los cálculos deben usar la fecha local del usuario.
  El cambio de hora estacional no debe duplicar, perder ni desplazar ningún día de la
  semana ni alterar el progreso. Si cambia la fecha local del dispositivo (por ejemplo, al
  viajar o al cambiarla manualmente), el progreso debe recalcularse con la nueva fecha
  local en el siguiente momento de cálculo definido en RF-9, que pasa a ser la nueva R. Las
  fechas pueden construirse de otra forma que en la tarjeta siempre que el resultado
  numérico sea idéntico.
- **RNF-7 — Compatibilidad**: debe funcionar con los datos ya guardados, sin migraciones y
  sin pérdida de sesiones antiguas; la ausencia de objetivo no debe impedir el uso normal.
- **RNF-8 — Idioma y formato**: textos de interfaz y mensajes en español. El separador de
  miles español se aplica solo al texto del bloque del objetivo; no se cambia el formato
  de la tarjeta "Minutos semana", de la racha, de la mejor racha ni de la lista de
  sesiones.
- **RNF-9 — Claridad de estados**: cada estado debe tener un contenido textual propio y
  observable: "sin objetivo" (mensaje y botón de fijar), "en progreso" (texto "X de Y
  min" y porcentaje sin mensaje de cumplimiento) y "cumplido" (texto, porcentaje y
  "¡Objetivo cumplido!"). Ningún estado puede confundirse con otro.
- **RNF-10 — Objetivo táctil**: los botones del bloque deben ofrecer un área de toque de al
  menos 44 × 44 px, sin solaparse entre sí ni con el texto.
- **RNF-11 — Cálculo determinista**: el progreso debe calcularse a partir de las sesiones,
  del objetivo y de la fecha de referencia R recibida como dato de entrada, de forma que se
  pueda reproducir el mismo resultado para una fecha concreta sin depender del reloj
  interno.
- **RNF-12 — Verificación del anuncio accesible**: el nombre, el rol y el valor de la barra
  y el anuncio del mensaje de cumplimiento deben poder comprobarse en el árbol de
  accesibilidad del navegador y con al menos un lector de pantalla de referencia.

## Casos límite

- **CL-1 — Primer uso, sin objetivo**: el bloque se ve con su título, el mensaje "Aún no
  has fijado un objetivo semanal" y el botón "Fijar objetivo"; no hay barra, porcentaje ni
  mensaje de cumplimiento.
- **CL-2 — Objetivo inválido guardado**: valores como 0, números negativos, decimales,
  texto, vacío, mayor de 10.080, con separadores o ilegibles se tratan como "sin
  objetivo", sin errores visibles y sin tocar las sesiones.
- **CL-3 — Progreso exactamente igual al objetivo**: barra completa, 100 % y "¡Objetivo
  cumplido!".
- **CL-4 — Progreso superior al objetivo**: barra completa, 100 %, mensaje de cumplimiento
  y minutos reales en el texto (por ejemplo, "3.240 de 3.000 min").
- **CL-5 — Progreso cero con objetivo fijado**: "0 de Y min", 0 % y barra vacía; no se
  muestra el mensaje de cumplimiento.
- **CL-6 — Progreso mayor que cero pero porcentaje 0**: por ejemplo, 1 de 300 minutos
  muestra "1 de 300 min", "0 %" y barra vacía; no se considera cumplido.
- **CL-7 — Varias sesiones el mismo día**: sus minutos se suman al progreso.
- **CL-8 — Sesiones futuras**: se ignoran aunque caigan dentro de la semana actual, es
  decir, con fecha posterior a R; no suman ni desbloquean el estado cumplido.
- **CL-9 — Sesiones de semanas anteriores**: no cuentan para el progreso actual.
- **CL-10 — Cambio de semana con la aplicación abierta**: si la aplicación se queda abierta
  de domingo a lunes sin registrar sesiones ni tocar el objetivo, sigue mostrando el
  progreso de la semana actual de R (la última calculada) hasta que se cargue de nuevo, se
  registre una sesión o se modifique el objetivo, igual que la tarjeta "Minutos semana"; no
  es historial ni un dato guardado. Al cargar de nuevo el lunes, R pasa a ser el lunes, el
  progreso vuelve a 0 (o a los minutos del nuevo lunes) y el objetivo se conserva.
- **CL-11 — Hoy es lunes**: la semana en curso solo incluye el lunes; el resto de días se
  verán futuros y no sumarán.
- **CL-12 — Cambio de hora estacional**: el paso de horario de verano a invierno no debe
  duplicar, perder ni desplazar días de la semana ni alterar el progreso.
- **CL-13 — Semana que cruza de año**: si la semana actual incluye diciembre y enero, el
  cálculo debe seguir siendo correcto.
- **CL-14 — Valores límite del objetivo**: 1 y 10.080 se aceptan; 0, 10.081, "1,5",
  "3.000", "+300" y los valores no numéricos se rechazan con el mensaje de rango.
- **CL-15 — Sesiones con datos corruptos**: las sesiones con minutos inválidos cuentan como
  0; las fechas que el cálculo de "Minutos semana" descarta se ignoran también en el
  bloque, exactamente con el mismo criterio, de modo que ambos números coincidan siempre.
- **CL-16 — Quitar el objetivo estando cumplido**: el bloque vuelve al estado "sin
  objetivo" y desaparecen barra, porcentaje y mensaje de cumplimiento.
- **CL-17 — Cambiar el objetivo a mitad de semana**: el progreso se recalcula contra el
  nuevo valor con las sesiones del lunes a R; si el nuevo objetivo ya está superado, se
  muestra el estado cumplido de inmediato.
- **CL-18 — Porcentaje con decimales**: por ejemplo, 1 de 3 minutos se muestra como 33 %,
  sin decimales, y un progreso igual o mayor que el objetivo nunca supera el 100 %.
- **CL-19 — Guardado fallido**: si el navegador rechaza el guardado, se muestra "No se ha
  podido guardar el objetivo", no se aplica el valor nuevo, se conserva el anterior (o el
  estado "sin objetivo") y el resto de la pantalla mantiene sus valores.
- **CL-20 — Objetivo de un minuto con muchas horas estudiadas**: la barra se llena, el
  porcentaje se queda en 100 % y el texto muestra los minutos reales sin desbordarse.
- **CL-21 — Guardar el mismo objetivo**: se acepta sin error y sin cambios visibles en el
  progreso.
- **CL-22 — Texto largo a 320 px**: el progreso se reparte en varias líneas, los botones
  quedan dentro del viewport y no aparece scroll horizontal.
- **CL-23 — Objetivo con decimales en los datos guardados**: se trata como inválido y se
  muestra el estado "sin objetivo" hasta que se guarde un objetivo válido.
- **CL-24 — Cambio de día con la aplicación abierta**: si cambia el día local dentro de la
  misma semana sin cargar, registrar ni tocar el objetivo, el bloque sigue mostrando el
  progreso calculado con R; las sesiones que pasarían a no ser futuras solo se suman en el
  siguiente momento de cálculo, igual que la tarjeta "Minutos semana".
- **CL-25 — Objetivo guardado como texto de dígitos**: un valor guardado como "0300" o
  " 300 " se acepta como el entero canónico 300 y se usa y se muestra igual que si se
  hubiera guardado el número 300.

## Fuera de alcance

- Historial de objetivos, de semanas o de cumplimiento: no se guardan ni se recuperan
  resultados de semanas pasadas.
- Gráficas, estadísticas o comparaciones entre semanas.
- Objetivos por día, por tema, por sesión o varios objetivos simultáneos.
- Rachas de cumplimiento, insignias, recompensas o niveles.
- Avisos, recordatorios, notificaciones o recomendaciones automáticas.
- Sugerencia automática del objetivo a partir de las sesiones anteriores.
- Actualización automática por temporizador al cambiar el día o la semana.
- Sincronización entre dispositivos, cuentas o usuarios.
- Sincronización en vivo entre pestañas abiertas del mismo navegador.
- Exportar, compartir o imprimir el objetivo o el progreso.
- Cambios en el formato de los datos de las sesiones.
- Cambios en los indicadores existentes (racha, mejor racha, minutos de la semana) o en el
  mapa de calor.
- Visualización del objetivo dentro del mapa de calor o de la tarjeta "Minutos semana".
- Animaciones o transiciones de la barra.
- Datos de ejemplo o modo demostración.

## Criterios de finalización

- Todos los requisitos funcionales cumplen sus criterios de aceptación.
- La lógica del objetivo (validación del rango y del valor canónico, cálculo del progreso
  de la semana actual, porcentaje con tope 100, estado de cumplimiento, momento del
  recálculo y tratamiento de datos inválidos) está cubierta por pruebas automatizadas en
  verde, según la constitución del proyecto.
- Verificación manual completada en escritorio, a 375 px y a 320 px: fijar, editar y
  quitar el objetivo; estados sin objetivo, en progreso y cumplido; actualización al
  registrar una sesión; ausencia de scroll horizontal; consola del navegador sin errores.
- La barra y el mensaje de cumplimiento se han comprobado en el árbol de accesibilidad y
  con un lector de pantalla; los contrastes se han medido y cumplen los mínimos de RNF-3.
- Las sesiones existentes siguen intactas y visibles en la lista.
- El número del bloque coincide con la tarjeta "Minutos semana" en todos los escenarios
  probados, incluidos sesiones futuras, fechas descartadas y semanas que cruzan de año.
- El orden de la pantalla es tarjetas, objetivo, mapa de calor, formulario y lista.
- El objetivo se conserva tras recargar la aplicación en el mismo dispositivo.
- La documentación del proyecto queda actualizada (spec, plan, tareas y memoria).

## Dudas abiertas

Ninguna. Todas las decisiones de esta versión están resueltas, incluidas las dos que podían
leerse de dos formas: la semana mostrada entre cálculos (que no es historial) y la
normalización de un objetivo guardado como número entero o como texto de solo dígitos (ambos
al mismo entero canónico).

# Spec 003 — Temas más estudiados

Estado: aprobada

## Contexto y objetivo

El Diario de Estudio permite registrar el tema y los minutos de cada sesión, pero no
ayuda a reconocer cuáles son los temas a los que se dedica más tiempo durante la semana.
Esta funcionalidad muestra los temas con mayor suma de minutos de estudio en la semana
actual, para que la persona pueda identificar de un vistazo en qué está concentrando su
esfuerzo.

El ranking se basa en los minutos acumulados desde el lunes de la semana local actual
hasta hoy, ambos incluidos. Los temas equivalentes aunque difieran en mayúsculas o en
caracteres de whitespace al inicio o al final se agrupan. Las medallas se asignan por
puestos densos: los temas empatados comparten puesto y medalla, y el siguiente total
distinto recibe el puesto siguiente. Por ello, podrán aparecer más de tres temas únicamente
cuando haya empates en los tres primeros puestos. Los temas empatados se ordenan
alfabéticamente por nombre visible, sin distinguir mayúsculas.

El bloque se sitúa al comienzo del dashboard, junto al objetivo y los minutos semanales, y
antes del mapa de actividad. La lista representa la fecha local del último cálculo: se
actualiza al cargar la aplicación y al registrar una sesión. Si no se carga la aplicación
ni se registran sesiones, mantiene el último ranking calculado aunque cambie la fecha local;
no se actualiza solo por el paso del tiempo mientras la aplicación permanece abierta.

## Usuarios

- Persona que quiere reconocer sus temas de estudio más frecuentes esta semana.
- Persona que estudia un mismo tema escribiendo su nombre con diferencias de mayúsculas o
  espacios y espera que se contabilice como un solo tema.
- Persona que consulta el dashboard desde móvil, teclado o tecnología de asistencia.

## Historias de usuario

- **HU-1**: Como persona que estudia, quiero ver los tres temas con más minutos esta semana
  para reconocer dónde estoy concentrando mi tiempo.
- **HU-2**: Como persona que estudia, quiero que los nombres equivalentes se agrupen y que
  los empates compartan medalla para que el ranking represente correctamente mis sesiones.
- **HU-3**: Como persona que consulta el dashboard, quiero identificar cada puesto mediante
  una medalla y su nombre para entender el ranking de un vistazo y con tecnología de
  asistencia.

## Definiciones

- **Semana actual**: semana de lunes a domingo según la fecha local del dispositivo. Para
  este ranking solo se incluyen sesiones desde el lunes de esa semana hasta hoy, ambos
  incluidos; no se incluyen fechas futuras.
- **Tema normalizado**: nombre de tema tras retirar todos los caracteres de whitespace al
  principio y al final, y convertir el resultado a minúsculas para agrupar. Whitespace
  incluye espacios ordinarios y tabulaciones. Por ejemplo, `JavaScript`, `javascript` y
  ` JavaScript ` son un mismo tema.
- **Minutos acumulados de un tema**: suma de los minutos de todas las sesiones válidas de
  ese tema dentro de la semana actual.
- **Puesto denso**: posición calculada sobre los totales distintos ordenados de mayor a
  menor. Los temas con el mismo total comparten puesto; el siguiente total distinto ocupa
  el puesto inmediatamente posterior. Por ejemplo, dos temas empatados en el primer puesto
  van seguidos por el segundo puesto.
- **Sesión clasificable**: sesión cuya fecha local está entre el lunes de esta semana y hoy,
  ambos incluidos; cuyo nombre de tema no queda vacío después de retirar todos los
  caracteres de whitespace al principio y al final; y cuyos minutos son positivos y finitos.
- **Nombre visible**: nombre del tema tras retirar todos los caracteres de whitespace al
  principio y al final, conservando mayúsculas y minúsculas tal como aparece en la primera
  sesión clasificable de esta semana para ese tema, según el orden de la lista de sesiones.
- **Desempate alfabético**: orden de nombres visibles alfabéticamente sin distinguir
  mayúsculas. Se aplica a los temas que comparten un mismo puesto.

## Requisitos funcionales

### RF-1 — Mostrar el ranking semanal

- EL SISTEMA deberá mostrar un bloque titulado «Temas más estudiados» al comienzo del
  dashboard, junto al objetivo y los minutos semanales y antes del mapa de actividad.
- CUANDO se calcule el ranking, EL SISTEMA deberá incluir únicamente sesiones
  clasificables de esta semana.
- EL SISTEMA deberá sumar los minutos de todas las sesiones incluidas que correspondan a
  cada tema normalizado y ordenar los totales de mayor a menor.
- SI varios temas tienen el mismo total, ENTONCES EL SISTEMA deberá ordenarlos
  alfabéticamente por nombre visible sin distinguir mayúsculas.
- EL SISTEMA deberá mostrar solo los temas que ocupen los tres primeros puestos densos;
  cuando varios temas empaten en uno de esos puestos, deberá mostrarlos todos.
- EL SISTEMA deberá mostrar el nombre visible y los minutos acumulados de cada tema
  incluido.

### RF-2 — Agrupar temas equivalentes

- EL SISTEMA deberá agrupar en un solo tema las sesiones cuyos nombres coincidan después
  de retirar todos los caracteres de whitespace al principio y al final y convertir el
  texto a minúsculas.
- EL SISTEMA deberá usar como nombre visible el nombre tras retirar todos los caracteres
  de whitespace al principio y al final, conservando su capitalización, de la primera
  sesión clasificable de esta semana de ese tema según el orden de la lista de sesiones.
- SI el nombre del tema queda vacío después de retirar todos los caracteres de whitespace
  de los extremos,
  ENTONCES EL SISTEMA no deberá incluir esa sesión en el ranking.

### RF-3 — Asignar medallas y resolver empates

- EL SISTEMA deberá mostrar una medalla de oro para todos los temas en el primer puesto,
  una medalla de plata para todos los temas en el segundo puesto y una medalla de bronce
  para todos los temas en el tercer puesto.
- SI varios temas tienen el mismo total de minutos, ENTONCES EL SISTEMA deberá asignarles
  el mismo puesto y la misma medalla.
- SI hay un empate, ENTONCES EL SISTEMA deberá asignar al siguiente total distinto el
  puesto denso inmediatamente posterior, sin saltarse puestos.
- EL SISTEMA no deberá mostrar temas que queden por debajo del tercer puesto denso.
- La medalla deberá poder identificarse sin depender únicamente de su color: su nombre
  («Oro», «Plata» o «Bronce») deberá estar disponible como texto visible o accesible.

### RF-4 — Actualizar el ranking

- CUANDO se cargue la aplicación, EL SISTEMA deberá calcular y mostrar el ranking usando
  las sesiones existentes y la fecha local de ese cálculo.
- CUANDO se registre una sesión, EL SISTEMA deberá actualizar el ranking en la misma
  pantalla con las sesiones vigentes y la fecha local de ese cálculo.
- MIENTRAS no se cargue la aplicación ni se registren sesiones, EL SISTEMA deberá mantener
  el último ranking calculado aunque cambie la fecha local; no deberá actualizarlo por el
  mero paso del tiempo.

### RF-5 — Estado sin temas clasificables

- SI no hay sesiones clasificables de esta semana,
  ENTONCES EL SISTEMA deberá mantener visible el bloque y mostrar «Aún no hay temas
  estudiados esta semana» sin mostrar filas de ranking ni medallas.
- SI solo hay uno o dos temas clasificables, ENTONCES EL SISTEMA deberá mostrar únicamente
  esos temas con la medalla correspondiente a su puesto; no deberá añadir puestos vacíos.

## Requisitos no funcionales

- La interfaz y los mensajes de esta funcionalidad deberán estar en español.
- El cálculo deberá usar fechas locales y no deberá desplazar el día al interpretar fechas
  de sesión.
- La funcionalidad no deberá cambiar, borrar ni requerir una migración de las sesiones
  existentes.
- El bloque deberá poder consultarse en pantallas móviles y mediante teclado o tecnología
  de asistencia, sin que la medalla dependa únicamente de una diferencia de color.

## Casos límite

- Varias sesiones del mismo tema en un día se suman, al igual que las sesiones de ese tema
  en otros días de la semana.
- Sesiones con fechas anteriores al lunes o posteriores a hoy no afectan los totales.
- Varias sesiones del mismo día no crean puestos o entradas adicionales por sí solas.
- Un empate en cualquiera de los tres primeros puestos muestra todos los temas empatados;
  un empate puede hacer que se muestren más de tres temas.
- Los temas con el mismo total se muestran por nombre visible en orden alfabético sin
  distinguir mayúsculas.
- Con dos temas empatados en el primer puesto, ambos reciben oro y el siguiente total
  distinto recibe plata.
- La capitalización del nombre visible procede de la primera sesión clasificable de esta
  semana en el orden de la lista; una sesión fuera de esta semana, con fecha inválida, con
  nombre vacío tras retirar whitespace exterior o con minutos no positivos o no finitos
  no puede determinarla.
- Los caracteres de whitespace que se retiran del nombre incluyen tabulaciones, no solo
  espacios ordinarios.
- Un tema con cero minutos, minutos negativos o minutos no finitos no aporta minutos ni
  aparece como tema clasificable.
- Una fecha inválida o un registro sin un nombre de tema utilizable no deberá producir una
  entrada en el ranking.
- Si no hay sesiones clasificables, se muestra el estado vacío; si hay menos de tres temas
  distintos, solo se muestran los puestos disponibles.
- Si cambia la fecha local mientras la aplicación permanece abierta y no se registra una
  sesión, se mantiene el último ranking calculado; al registrar una sesión después del
  cambio, el ranking se recalcula con la nueva fecha local.
- Al iniciar una semana nueva, el ranking se calcula desde el nuevo lunes al cargar la
  aplicación o al registrar una sesión; las sesiones de la semana anterior dejan de contar.

## Fuera de alcance

- Consultar rankings de semanas anteriores o conservar un historial de rankings.
- Elegir manualmente el periodo, filtrar temas o configurar el número de puestos.
- Mostrar tendencias, porcentajes, gráficos u objetivos por tema.
- Añadir, renombrar o editar temas como una entidad independiente de las sesiones.
- Cambiar la forma en que se guardan las sesiones.

## Criterios de finalización

- El ranking calcula correctamente los minutos por tema para la semana local de lunes a
  hoy, excluyendo fechas futuras y sesiones de semanas anteriores.
- La normalización agrupa temas ignorando mayúsculas y todos los caracteres de whitespace
  exteriores, y el nombre mostrado conserva la capitalización de la primera sesión
  clasificable de esta semana según el orden de la lista.
- Las medallas corresponden a los tres primeros puestos densos, los empates comparten
  medalla, se ordenan alfabéticamente por nombre visible sin distinguir mayúsculas y solo
  se muestran puestos dentro del top 3.
- El estado vacío, los rankings de uno o dos temas y los empates que muestran más de tres
  temas cumplen los requisitos definidos.
- El ranking se actualiza al cargar y al registrar una sesión; si no ocurre ninguno de esos
  eventos, mantiene el último cálculo aunque cambie la fecha local, sin alterar los datos
  existentes.
- La presentación identifica medallas con texto, permanece antes del mapa de actividad y
  se puede consultar en móvil y con tecnología de asistencia.
- Los casos límite de esta spec quedan cubiertos por verificaciones reproducibles y no hay
  regresiones en las verificaciones existentes del proyecto.

## Dudas abiertas

- Ninguna.
# Tareas — 003 Temas más estudiados

Las tareas están ordenadas por dependencia y cada una termina con `node --test` en verde.
En las tareas de lógica, primero se añaden las pruebas de esa tarea y se observa el fallo;
la implementación que las hace pasar se completa antes de cerrar la misma tarea. En las
tareas de interfaz, se ejecuta primero la comprobación manual pertinente, se realiza el
cambio y se confirma el resultado en esa misma tarea. No se dejan pruebas recién añadidas
fallando para una tarea posterior. No se añaden dependencias.

- [x] **T1. Implementar periodo local y filtro de sesiones clasificables.** RF-1, RF-2, RF-5
  - Hecho cuando: se añaden primero pruebas para lunes y hoy inclusivos, fechas anteriores, futuras e imposibles, tipos inválidos y minutos positivos/negativos/no finitos; `node --test` muestra el fallo esperado antes de implementar. En la misma tarea, `weekly-topics-logic.js` valida y compara fechas locales por componentes, recibe `today` como argumento y filtra correctamente; después `node --test` termina en verde sin consultar el reloj ni modificar sesiones.
- [x] **T2. Implementar agrupación, sumas y nombre visible.** RF-1, RF-2
  - Hecho cuando: se añaden primero pruebas que fallan para equivalencia por mayúsculas y whitespace exterior, suma entre sesiones y días, y nombre visible de la primera sesión clasificable en el orden original. Se implementa esa agregación en la misma tarea y `node --test` termina en verde.
- [x] **T3. Implementar orden, puestos densos y medallas.** RF-1, RF-3
  - Hecho cuando: se añaden primero pruebas que fallan para orden descendente, desempate alfabético sin distinguir mayúsculas, empates en los puestos primero/segundo/tercero, medalla compartida, puesto siguiente sin saltos y expansión del top 3. La lógica se implementa en la misma tarea y `node --test` termina en verde.
- [x] **T4. Completar estados vacíos, límites y pureza de la lógica.** RF-1, RF-2, RF-3, RF-5
  - Hecho cuando: se añaden primero pruebas que fallan para cero, uno y dos temas, entradas nulas/mal formadas, tema vacío, minutos inválidos, fechas límite y futuras, ausencia de mutación y límite del tercer puesto denso. Se completa la lógica correspondiente en la misma tarea; `node --test` y `TZ=Europe/Madrid node --test` terminan en verde.
- [x] **T5. Añadir la estructura del bloque al dashboard.** RF-1, RF-5
  - Hecho cuando: antes del cambio se comprueba en Chrome que el bloque aún no existe; en la misma tarea se añade en `index.html` el título y el estado vacío en español, después de métricas/objetivo y antes del mapa. La comprobación manual confirma el orden y el mensaje literal; `node --test` termina en verde.
- [x] **T6. Implementar el renderizado accesible del ranking.** RF-1, RF-3, RF-5
  - Hecho cuando: antes del cambio se comprueba que el contenido dinámico aún no está disponible; en la misma tarea se crea `weekly-topics-ui.js`, se conectan los scripts antes de `app.js` y se implementan estado vacío y filas con tema, minutos y medalla textual usando `textContent`. La comprobación manual confirma ambos estados y que el nombre de tema no se interpreta como HTML; `node --test` termina en verde.
- [x] **T7. Aplicar estilos responsive al bloque.** RF-1, RF-3, RF-5
  - Hecho cuando: antes del cambio se comprueba en Chrome el aspecto sin los estilos del ranking; se aplican los estilos en la misma tarea y se verifica a 320 y 375 px que no hay desbordes, el texto de las medallas se identifica sin depender del color y el bloque conserva legibilidad. `node --test` termina en verde.
- [x] **T8. Integrar actualización y verificar el flujo completo.** RF-1, RF-2, RF-3, RF-4, RF-5
  - Hecho cuando: antes del cambio se comprueba que el ranking no se renderiza en la carga ni después de registrar una sesión; se integra el renderizado en ambos momentos usando sesiones vigentes y fecha local. Después se comprueban en Chrome por `file://` el estado vacío, datos, empates, posición, móvil, consola limpia y que el ranking conserva su último cálculo si cambia la fecha local sin carga ni registro, y no altera sesiones guardadas. No se añade actualización por temporizador; `node --test` y `TZ=Europe/Madrid node --test` terminan en verde.

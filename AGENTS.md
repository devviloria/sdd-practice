# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.

## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.

## Datos
- localStorage, clave `diarioEstudio_sessions`: array de `{ id, date: "AAAA-MM-DD", topic,
minutes, timestamp }`.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario
perderá sus sesiones.

## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión
pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
- **Minutos de la semana**: semana de lunes a domingo en fecha local. Suma los minutos de las sesiones con fecha entre el lunes de esta semana y hoy (ambos incluidos); varias sesiones del mismo día suman. Las fechas futuras no cuentan.
- **Mejor racha** = racha más larga histórica de días consecutivos con al menos 1 sesión. Se calcula sobre fechas únicas (ignorando futuras), ordenadas cronológicamente, buscando la secuencia más larga con diferencia de 1 día. Es independiente de la racha actual.

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una fase o cada tarea de implementación, actualiza
MEMORY.md con el estado, las decisiones importantes y su porqué, los resultados y los
errores a evitar. En SDD, el coordinator actualiza la memoria al cerrar spec,
clarificación, plan y validación; el implementer la actualiza después de cada tarea de
implementación. El coordinator usa la respuesta normal de tarea y los tests para controlar
el flujo, sin pedir un traspaso adicional de memoria.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales). 

## Comandos
- Tests: `node --test`

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al cerrar cada fase y después de cada tarea de
	implementación, según las responsabilidades anteriores.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación
- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome
DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la
vista móvil. 
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave
`diarioEstudio_sessions`. 
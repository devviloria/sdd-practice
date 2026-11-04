# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 + minutos de la semana + mapa de calor (spec 001) + objetivo semanal (spec 002
  implementada y verificada; falta el veredicto del reviewer).
- Sesiones, racha, mejor racha, minutos de la semana, objetivo semanal (fijar, editar,
  quitar, progreso, %, barra y "¡Objetivo cumplido!"), mapa de 12 semanas y lista.
- localStorage: `diarioEstudio_sessions` (formato sin cambios) y
  `diarioEstudio_weeklyGoal` (texto de dígitos).
- T-01 a T-10 marcadas en `specs/002-objetivo-semanal/tasks.md`. `node --test` 75/75 en
  verde (también con `TZ=Europe/Madrid`). Verificado en Chrome por `file://` a escritorio,
  375 y 320 px; consola limpia y sesiones idénticas antes/después.
- MCP `chrome-devtools` en `opencode.json` (V2: `mcp.servers`, `type: "local"`).
## Decisiones (y por qué)
- Sin backend ni dependencias: doble clic sobre `index.html`.
- Fecha editable en el formulario: permite registrar días pasados.
- Mantenidas clave y campos de sesiones (id, timestamp) por compatibilidad.
- Minutos de la semana: lunes-domingo local; suma del lunes a hoy.
- Mejor racha: máximo histórico de días consecutivos; ignora fechas futuras.
- Mapa de calor: lógica pura en `HeatmapLogic`; fechas al mediodía local.
- Objetivo en clave propia como texto de dígitos ("300"): `getItem` devuelve texto y el
  valor guardado coincide con el leído; independiente de las sesiones.
- Lógica pura en `WeeklyGoalLogic` con `today` como parámetro, sin reloj, DOM ni
  localStorage: se prueba con `node --test` y es determinista.
- Se recalcula solo al cargar, al registrar sesión y al fijar/cambiar/quitar; sin
  temporizadores: entre cálculos el bloque mantiene la foto de R, como la tarjeta.
- Tres estados (sin objetivo / en progreso / cumplido) y el editor en el mismo bloque; al
  guardar o quitar se repinta también la tarjeta "Minutos semana" para que no diverjan.
- Formato de miles con punto solo en el texto del bloque; la tarjeta sigue sin formato.
## Aprendizajes y errores a evitar
- Divergencia con `calculateWeekMinutes`: si cambia su tabla, actualizar
  `calculateWeekProgress` en el mismo commit.
- `hidden` lo pisaba el `display` de los estados; hace falta
  `.goal-section [hidden] { display: none; }` al final del CSS.
- `minutes: Infinity` pasa el filtro `> 0`: la tarjeta lo suma y el bloque lo ignora. La
  lógica exige `Number.isFinite`; conviene alinear la tarjeta.
- Evitar lecturas dobles de `getSessions()` en un mismo repintado: leer una vez y derivar.
- Ventana de medianoche: tarjeta y bloque toman la fecha en dos llamadas seguidas; si la
  medianoche cae entre ambas, pueden diferir hasta el siguiente cálculo.
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`; fechas locales por componentes.
- Lunes: `(getDay() + 6) % 7`.
- Foco programático: los controles del objetivo usan `:focus`, no `:focus-visible`.
- Frontmatter de agentes: el `---` de cierre debe empezar en la columna 0.
## Próximos pasos
- Revisión final de la spec 002: el reviewer da el veredicto.
- Bug conocido: `calculateStreak` añade fechas futuras al Set y puede devolver 0 aunque hoy
  haya sesión. Pendiente.
- Mejora propuesta: que `calculateWeekMinutes` delegue en `calculateWeekProgress` para
  eliminar la regla duplicada.

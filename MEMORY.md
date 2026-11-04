# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 + minutos de la semana + mapa de calor (spec 001 completada).
- Registrar sesiones (fecha, tema, minutos), racha actual, mejor racha, minutos de la
  semana, mapa de 12 semanas y lista de sesiones.
- Datos en localStorage (clave: `diarioEstudio_sessions`), formato sin cambios.
- MCP `chrome-devtools` configurado en `opencode.json` (V2: `mcp.servers`, `type: "local"`).
- Spec 001: T-01 a T-35 marcadas en `specs/001-heat-map/tasks.md`. `node --test` en verde
  (21 tests; también con `TZ=Europe/Madrid`). Verificado en Chrome a escritorio, 375 y
  320 px, con cursor, teclado y toque; consola limpia.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha: máximo histórico de días consecutivos con >=1 sesión. Dos tarjetas lado a
  lado (apiladas en móvil). Mismas reglas de fechas locales, ignora fechas futuras.
- Mantenida clave y campos existentes (id, timestamp) por compatibilidad.
- Minutos de la semana: semana lunes-domingo en fecha local; suma del lunes a hoy.
- Mapa de calor: lógica pura en `HeatmapLogic` (IIFE + export CommonJS) para no chocar con
  funciones globales de `app.js`; fechas construidas al mediodía local.
- Mapa: 12 semanas (84 días), niveles 0–4 (0, 1–29, 30–59, 60–119, 120+); futuros atenuados
  y deshabilitados; hoy con anillo propio; tooltip único; leyenda Menos–Más.
- `renderHeatmap()` se llama en `init()` y tras guardar; solo lee datos.
- Tooltip: el de cursor/toque se oculta al hacer scroll; el de foco se reposiciona para no
  perder el detalle al tabular (el scroll del foco lo ocultaba).
- En ≤360 px la sección ocupa todo el ancho para mantener celdas ≥24×24 px.
## Aprendizajes y errores a evitar
- No usar toISOString() para calcular consecutivos; usar fechas locales y diferencia en días.
- Para el lunes de la semana: getDay() devuelve 0 el domingo; usar `(getDay() + 6) % 7`.
- Frontmatter de agentes: el `---` de cierre debe empezar en la columna 0; con un espacio
  delante, OpenCode ignora el agente sin avisar. `opencode debug agents` lista los cargados.
- El tooltip no debe tapar la celda: se coloca encima o debajo con `getBoundingClientRect`.
- Al probar toque con DevTools, un clic real dispara `pointerdown`; un `click` sintético
  no oculta el tooltip al tocar fuera.
## Próximos pasos
- Bug conocido: `calculateStreak` mete fechas futuras en el Set y puede devolver 0 aunque
  hoy haya sesión. Pendiente de arreglar.

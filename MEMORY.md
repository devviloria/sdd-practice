# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Mantenerla breve (máximo ~50 líneas).
## Estado actual
- v1: sesiones, rachas, minutos semanales, mapa de 12 semanas y objetivo semanal (spec 002 implementada; pendiente veredicto reviewer).
- Storage: `diarioEstudio_sessions` conserva su formato; `diarioEstudio_weeklyGoal` guarda texto de dígitos.
- Spec 003: RF-4 se acotó a carga/registro; spec, plan y tareas aprobados. T1-T8 completas;
  reviewer aprobó la validación final con ambas suites en 92/92.
- T1-T4: lógica pura `WeeklyTopicsLogic` filtra fechas locales, agrupa y ordena temas, asigna puestos densos/medallas y cubre casos límite. `node --test` y `TZ=Europe/Madrid node --test`: 92/92.
- T5: `index.html` tiene el bloque semántico vacío entre objetivo y mapa; verificado en Chrome por `file://`.
- T6: `weekly-topics-ui.js` expone `WeeklyTopicsUI.renderWeeklyTopics()`, renderiza estado vacío y filas DOM accesibles con `textContent`; scripts de temas cargan antes de `app.js`. `node --test`: 92/92.
- T6 verificado en Chrome por `file://`: vacío exacto; ranking con Oro/Plata/Bronce; `<img src=x onerror=alert(1)>` se muestra como texto, sin `img` ni alerta; consola limpia. `localStorage` completo restaurado idéntico tras la prueba.
- T7: `styles.css` estiliza la tarjeta, filas en grid adaptable y etiquetas de medalla con texto visible; en 320/375 px no hay desbordes ni solapamientos, en escritorio conserva la tarjeta. Estado vacío verificado con lista oculta; se ajustó especificidad de `[hidden]`. Chrome sin errores y `node --test`: 92/92; almacenamiento original restaurado exactamente.
- T8: `app.js` invoca `WeeklyTopicsUI.renderWeeklyTopics()` al iniciar y tras guardar sesión; la UI toma `getTodayLocalDateString()` y lee las sesiones una vez por render. Chrome `file://`: carga real, vacío, agrupación/empates/puestos densos y guardado actualizan ranking y métricas; 320/375/escritorio sin overflow, orden correcto y consola limpia. Fixtures y sesión de prueba restaurados con igualdad exacta de todas las claves; quedan las 4 sesiones originales. `node --test` y `TZ=Europe/Madrid node --test`: 92/92; cambios horarios primavera/otoño comprobados.
- MCP `chrome-devtools` configurado en `opencode.json` (`mcp.servers`, `type: "local"`).

## Decisiones (y por qué)
- Sin backend, dependencias ni build: la app funciona abriendo `index.html`.
- Mantener clave y esquema de sesiones por compatibilidad; fecha editable admite registrar días pasados.
- Fechas locales por componentes: no usar `toISOString()` ni `new Date("AAAA-MM-DD")`; lunes inicia la semana.
- Mejor racha es histórica y excluye fechas futuras; mapa usa `HeatmapLogic` puro.
- Lógica semanal separada de DOM/storage y determinista con `today` explícito.
- Objetivo independiente en clave propia; solo se recalcula al cargar o tras acciones de objetivo/sesión, sin temporizadores.
- Temas: filtrar antes de agrupar para que el nombre visible venga de la primera sesión clasificable; renderizar mediante nodos y `textContent`.

## Aprendizajes y errores a evitar
- Si cambia la regla de `calculateWeekMinutes`, alinear `calculateWeekProgress`.
- `.goal-section [hidden] { display: none; }` evita que los estilos de estado oculten `hidden`.
- `minutes: Infinity` requiere `Number.isFinite`; la tarjeta existente aún puede sumar ese valor.
- Evitar lecturas repetidas de `getSessions()`; la medianoche entre lecturas puede producir fechas distintas.
- Para semanas/rachas, mover fechas con `setDate`, no con milisegundos; no usar `timestamp` para cambiar el día guardado.
- El ranking usa fecha local por componentes y no aritmética de 24 h; `calculateBestStreak` conserva una división heredada por milisegundos que puede ser sensible al cambio horario, fuera del alcance de T8.
- `calculateStreak` puede fallar si hay fechas futuras en el Set; bug pendiente.

## Próximos pasos
- Spec 003 cerrada. Pendiente el veredicto final del reviewer para spec 002.
- Revisión final pendiente de spec 002; mejora propuesta: delegar `calculateWeekMinutes` en `calculateWeekProgress`.

// Interfaz del mapa de calor.
// Pinta la estructura que devuelve HeatmapLogic y gestiona cursor, teclado y toque.

(function () {
    'use strict';

    const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const RANGE_DAY_FORMAT = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short'
    });
    const RANGE_DAY_YEAR_FORMAT = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    let eventsReady = false;
    let pinnedDay = null;
    let tooltipSource = null;

    function getGrid() {
        return document.getElementById('heatmapGrid');
    }

    function getTooltip() {
        return document.getElementById('heatmapTooltip');
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function formatRange(start, end) {
        const startDate = HeatmapLogic.parseLocalDate(start);
        const endDate = HeatmapLogic.parseLocalDate(end);
        const sameYear = startDate.getFullYear() === endDate.getFullYear();
        const startFormat = sameYear ? RANGE_DAY_FORMAT : RANGE_DAY_YEAR_FORMAT;
        return capitalize(`${startFormat.format(startDate)} – ${RANGE_DAY_YEAR_FORMAT.format(endDate)}`);
    }

    function formatDayLabel(day) {
        let label = DATE_FORMAT.format(HeatmapLogic.parseLocalDate(day.date));

        if (day.isToday) {
            label += ', hoy';
        }
        if (day.isFuture) {
            return `${label}, día futuro: 0 minutos`;
        }
        if (day.minutes === 0) {
            return `${label}: sin estudio`;
        }

        const minutesText = day.minutes === 1 ? '1 minuto' : `${day.minutes} minutos`;
        return `${label}: ${minutesText}`;
    }

    function formatTooltip(day) {
        const dateText = DATE_FORMAT.format(HeatmapLogic.parseLocalDate(day.date));
        if (day.minutes === 0) {
            return `${dateText} · Sin estudio`;
        }
        return `${dateText} · ${day.minutes} min`;
    }

    function createDayButton(day) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `heatmap-day level-${day.level}`;
        button.dataset.date = day.date;
        button.dataset.minutes = String(day.minutes);
        button.setAttribute('aria-label', formatDayLabel(day));
        button.disabled = day.isFuture;

        if (day.isFuture) {
            button.classList.add('is-future');
        }
        if (day.isToday) {
            button.classList.add('is-today');
            button.setAttribute('aria-current', 'date');
        }

        return button;
    }

    function positionTooltip(dayElement, tooltip) {
        const cell = dayElement.getBoundingClientRect();
        const tip = tooltip.getBoundingClientRect();
        const margin = 8;

        let left = cell.left + cell.width / 2 - tip.width / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - tip.width - margin));

        let top = cell.top - tip.height - margin;
        if (top < margin) {
            top = cell.bottom + margin;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    function showTooltip(dayElement, source) {
        const tooltip = getTooltip();
        if (!tooltip || !dayElement || dayElement.disabled) {
            return;
        }

        const day = {
            date: dayElement.dataset.date,
            minutes: Number(dayElement.dataset.minutes) || 0
        };

        tooltipSource = source || 'hover';
        tooltip.textContent = formatTooltip(day);
        tooltip.hidden = false;
        positionTooltip(dayElement, tooltip);
    }

    function hideTooltip() {
        tooltipSource = null;
        const tooltip = getTooltip();
        if (tooltip) {
            tooltip.hidden = true;
        }
    }

    function clearPinned() {
        pinnedDay = null;
        hideTooltip();
    }

    function handleViewportChange() {
        if (pinnedDay) {
            clearPinned();
            return;
        }

        if (tooltipSource === 'focus') {
            const active = document.activeElement;
            const day = active && active.closest ? active.closest('.heatmap-day') : null;
            if (day && !day.disabled) {
                showTooltip(day, 'focus');
                return;
            }
        }

        hideTooltip();
    }

    function isTouchLike() {
        return window.matchMedia('(hover: none), (pointer: coarse)').matches;
    }

    function initEvents() {
        const grid = getGrid();
        if (!grid || eventsReady) {
            return;
        }
        eventsReady = true;

        grid.addEventListener('pointerover', function (event) {
            if (event.pointerType === 'touch') {
                return;
            }
            const day = event.target.closest('.heatmap-day');
            if (day && !day.disabled) {
                showTooltip(day, 'hover');
            }
        });

        grid.addEventListener('pointerout', function (event) {
            if (event.pointerType === 'touch') {
                return;
            }
            const day = event.target.closest('.heatmap-day');
            if (!day || day.disabled) {
                return;
            }
            if (event.relatedTarget && day.contains(event.relatedTarget)) {
                return;
            }
            if (tooltipSource === 'hover') {
                hideTooltip();
            }
        });

        grid.addEventListener('focusin', function (event) {
            const day = event.target.closest('.heatmap-day');
            if (day && !day.disabled) {
                showTooltip(day, 'focus');
            }
        });

        grid.addEventListener('focusout', function () {
            if (!pinnedDay) {
                hideTooltip();
            }
        });

        grid.addEventListener('click', function (event) {
            const day = event.target.closest('.heatmap-day');
            if (!day || day.disabled || !isTouchLike()) {
                return;
            }
            if (pinnedDay === day) {
                clearPinned();
            } else {
                pinnedDay = day;
                showTooltip(day, 'touch');
            }
        });

        document.addEventListener('pointerdown', function (event) {
            if (pinnedDay && event.target.closest('.heatmap-day') !== pinnedDay) {
                clearPinned();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                clearPinned();
            }
        });

        window.addEventListener('scroll', handleViewportChange, { passive: true });
        window.addEventListener('resize', handleViewportChange);
    }

    function renderHeatmap() {
        const grid = getGrid();
        if (!grid) {
            return;
        }

        initEvents();

        const data = HeatmapLogic.buildHeatmap(getSessions(), getTodayLocalDateString());
        clearPinned();

        const range = document.getElementById('heatmapRange');
        if (range) {
            range.textContent = data.start && data.end ? formatRange(data.start, data.end) : '';
        }

        grid.innerHTML = '';
        data.columns.forEach(function (column) {
            column.forEach(function (day) {
                grid.appendChild(createDayButton(day));
            });
        });

        const empty = document.getElementById('heatmapEmpty');
        if (empty) {
            if (data.emptyState === 'no-sessions') {
                empty.textContent = 'Aún no hay sesiones registradas';
            } else if (data.emptyState === 'no-recent') {
                empty.textContent = 'Sin sesiones en las últimas 12 semanas';
            } else {
                empty.textContent = '';
            }
            empty.hidden = !data.emptyState;
        }
    }

    window.renderHeatmap = renderHeatmap;
})();

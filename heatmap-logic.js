// Lógica pura del mapa de calor del Diario de Estudio.
// Sin acceso al DOM ni al almacenamiento: recibe los datos y "hoy" como parámetros.
// Funciona como script clásico en el navegador y como módulo en Node.
//
// Se expone como HeatmapLogic para no chocar con las funciones globales de app.js
// (por ejemplo, su propio parseLocalDate).

(function (global) {
    'use strict';

    const WEEKS = 12;
    const DAYS_PER_WEEK = 7;
    const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;

    function isValidDateString(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const [year, month, day] = value.split('-').map(Number);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return false;
        }

        const date = new Date(year, month - 1, day, 12);
        return date.getFullYear() === year
            && date.getMonth() === month - 1
            && date.getDate() === day;
    }

    function parseLocalDate(dateString) {
        // Mediodía local: ningún cambio de hora desplaza el día.
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day, 12);
    }

    function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function addDays(dateString, amount) {
        const date = parseLocalDate(dateString);
        date.setDate(date.getDate() + amount);
        return formatLocalDate(date);
    }

    function startOfWeek(dateString) {
        const date = parseLocalDate(dateString);
        const offset = (date.getDay() + 6) % 7;
        return addDays(dateString, -offset);
    }

    function toMinutes(value) {
        if (typeof value !== 'number' && typeof value !== 'string') {
            return 0;
        }

        const minutes = Number(value);
        if (!Number.isFinite(minutes) || minutes < 0) {
            return 0;
        }

        return minutes;
    }

    function getIntensityLevel(minutes) {
        if (!Number.isFinite(minutes) || minutes <= 0) {
            return 0;
        }
        if (minutes < 30) {
            return 1;
        }
        if (minutes < 60) {
            return 2;
        }
        if (minutes < 120) {
            return 3;
        }
        return 4;
    }

    function sumMinutesByDate(sessions, start, end, today) {
        const totals = {};
        if (!Array.isArray(sessions)) {
            return totals;
        }

        sessions.forEach(session => {
            if (!session || typeof session !== 'object') {
                return;
            }
            if (!isValidDateString(session.date)) {
                return;
            }

            const date = session.date;
            if (date < start || date > end || date > today) {
                return;
            }

            totals[date] = (totals[date] || 0) + toMinutes(session.minutes);
        });

        return totals;
    }

    function buildHeatmap(sessions, today, weeks) {
        const safeWeeks = Number.isInteger(weeks) && weeks > 0 ? weeks : WEEKS;

        if (!isValidDateString(today)) {
            return {
                start: null,
                end: null,
                columns: [],
                hasActivity: false,
                emptyState: 'no-sessions',
                today: null
            };
        }

        const start = addDays(startOfWeek(today), -(safeWeeks - 1) * DAYS_PER_WEEK);
        const end = addDays(start, safeWeeks * DAYS_PER_WEEK - 1);
        const totals = sumMinutesByDate(sessions, start, end, today);

        let hasAnyValidSession = false;
        if (Array.isArray(sessions)) {
            sessions.forEach(session => {
                if (session && typeof session === 'object' && isValidDateString(session.date)) {
                    hasAnyValidSession = true;
                }
            });
        }

        const columns = [];
        let hasActivity = false;

        for (let week = 0; week < safeWeeks; week++) {
            const column = [];
            for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday++) {
                const date = addDays(start, week * DAYS_PER_WEEK + weekday);
                const minutes = totals[date] || 0;
                const isFuture = date > today;
                const level = isFuture ? 0 : getIntensityLevel(minutes);

                if (level > 0) {
                    hasActivity = true;
                }

                column.push({
                    date,
                    minutes,
                    level,
                    isFuture,
                    isToday: date === today,
                    weekday
                });
            }
            columns.push(column);
        }

        let emptyState = null;
        if (!hasActivity) {
            emptyState = hasAnyValidSession ? 'no-recent' : 'no-sessions';
        }

        return { start, end, columns, hasActivity, emptyState, today };
    }

    const api = {
        WEEKS,
        DAYS_PER_WEEK,
        TOTAL_DAYS,
        isValidDateString,
        parseLocalDate,
        formatLocalDate,
        addDays,
        startOfWeek,
        toMinutes,
        getIntensityLevel,
        sumMinutesByDate,
        buildHeatmap
    };

    global.HeatmapLogic = api;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);

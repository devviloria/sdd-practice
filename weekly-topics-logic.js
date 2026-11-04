// Lógica pura del ranking semanal de temas.
// Sin acceso al DOM, al almacenamiento ni al reloj: recibe las sesiones y "hoy".
// Funciona como script clásico en el navegador y como módulo en Node.

(function (global) {
    'use strict';

    // Convierte "AAAA-MM-DD" en una fecha local al mediodía y rechaza días imposibles.
    function parseLocalDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return null;
        }

        const [year, month, day] = value.split('-').map(Number);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
        }

        const date = new Date(year, month - 1, day, 12);
        if (year < 100) {
            date.setFullYear(year);
        }

        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }

        return date;
    }

    function formatLocalDate(date) {
        const year = String(date.getFullYear()).padStart(4, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Devuelve el lunes de la semana local, o null si "today" no es una fecha real.
    function getWeekStart(today) {
        const date = parseLocalDate(today);
        if (!date) {
            return null;
        }

        const daysSinceMonday = (date.getDay() + 6) % 7;
        date.setDate(date.getDate() - daysSinceMonday);
        return formatLocalDate(date);
    }

    // Conserva solo sesiones clasificables de lunes a hoy, ambos incluidos.
    function filterClassifiableSessions(sessions, today) {
        if (!Array.isArray(sessions)) {
            return [];
        }

        const todayDate = parseLocalDate(today);
        if (!todayDate) {
            return [];
        }

        const weekStartDate = parseLocalDate(getWeekStart(today));
        if (!weekStartDate) {
            return [];
        }

        return sessions.filter(session => {
            if (!session || typeof session !== 'object' || Array.isArray(session)) {
                return false;
            }

            const sessionDate = parseLocalDate(session.date);
            if (!sessionDate || sessionDate < weekStartDate || sessionDate > todayDate) {
                return false;
            }

            if (typeof session.topic !== 'string' || session.topic.trim() === '') {
                return false;
            }

            return typeof session.minutes === 'number'
                && Number.isFinite(session.minutes)
                && session.minutes > 0;
        });
    }

    // Agrupa sesiones clasificables y conserva el primer nombre visible de cada tema.
    function aggregateWeeklyTopics(sessions, today) {
        const totalsByTopic = new Map();
        const classifiableSessions = filterClassifiableSessions(sessions, today);

        classifiableSessions.forEach(session => {
            const visibleTopic = session.topic.trim();
            const normalizedTopic = visibleTopic.toLowerCase();
            const existingTopic = totalsByTopic.get(normalizedTopic);

            if (existingTopic) {
                existingTopic.minutes += session.minutes;
            } else {
                totalsByTopic.set(normalizedTopic, {
                    topic: visibleTopic,
                    minutes: session.minutes
                });
            }
        });

        return Array.from(totalsByTopic.values());
    }

    // Ordena los temas y asigna puestos densos con medallas compartidas.
    function buildWeeklyTopics(sessions, today) {
        const topics = aggregateWeeklyTopics(sessions, today);
        topics.sort((first, second) => {
            const minutesDifference = second.minutes - first.minutes;
            if (minutesDifference !== 0) {
                return minutesDifference;
            }

            return first.topic.localeCompare(second.topic, 'es', { sensitivity: 'accent' });
        });

        let rank = 0;
        let previousMinutes = null;
        const medalsByRank = { 1: 'Oro', 2: 'Plata', 3: 'Bronce' };
        const rankedTopics = topics.map(topic => {
            if (topic.minutes !== previousMinutes) {
                rank += 1;
                previousMinutes = topic.minutes;
            }

            return {
                ...topic,
                rank,
                medal: medalsByRank[rank]
            };
        });

        const items = rankedTopics.filter(topic => topic.rank <= 3);
        return items.length > 0
            ? { status: 'ranking', items }
            : { status: 'empty', items: [] };
    }

    const api = {
        parseLocalDate,
        getWeekStart,
        filterClassifiableSessions,
        aggregateWeeklyTopics,
        buildWeeklyTopics
    };

    global.WeeklyTopicsLogic = api;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
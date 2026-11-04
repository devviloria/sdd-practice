// Lógica pura del objetivo semanal del Diario de Estudio.
// Sin DOM, sin almacenamiento y sin reloj: todo se recibe como parámetro.
// Funciona como script clásico en el navegador y como módulo en Node.
//
// Se expone como WeeklyGoalLogic para no chocar con las funciones globales de app.js.

(function (global) {
    'use strict';

    // Minutos por semana: de 1 minuto a 7 días × 24 horas.
    const MIN_GOAL_MINUTES = 1;
    const MAX_GOAL_MINUTES = 10080;

    // Devuelve el objetivo canónico como entero o null si no es válido.
    // Acepta un número entero del rango y un texto de solo dígitos (con espacios
    // en los extremos) que represente un entero del rango.
    function parseGoalValue(raw) {
        if (typeof raw === 'number') {
            return Number.isInteger(raw) && raw >= MIN_GOAL_MINUTES && raw <= MAX_GOAL_MINUTES
                ? raw
                : null;
        }

        if (typeof raw !== 'string') {
            return null;
        }

        const text = raw.trim();
        if (!/^\d+$/.test(text)) {
            return null;
        }

        const minutes = Number(text);
        if (!Number.isInteger(minutes) || minutes < MIN_GOAL_MINUTES || minutes > MAX_GOAL_MINUTES) {
            return null;
        }

        return minutes;
    }

    // Convierte "AAAA-MM-DD" en una fecha local construida por componentes.
    // Nunca interpreta el texto como UTC ni pasa por la fecha en UTC.
    // Devuelve null si el texto no es una fecha real (2026-02-30, mes 13...).
    function parseLocalDate(dateString) {
        if (typeof dateString !== 'string') {
            return null;
        }

        const parts = dateString.split('-');
        if (parts.length !== 3) {
            return null;
        }

        // Año de 4 dígitos y mes/día de 1 o 2 dígitos, igual que la tarjeta.
        if (!/^\d{4}$/.test(parts[0]) || !/^\d{1,2}$/.test(parts[1]) || !/^\d{1,2}$/.test(parts[2])) {
            return null;
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);

        const date = new Date(year, month - 1, day);

        // Rechaza fechas que el constructor desplaza (2026-02-30 se convierte en marzo).
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }

        return date;
    }

    function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Devuelve el lunes ("AAAA-MM-DD") de la semana de la fecha, o null si no es válida.
    // Domingo retrocede seis días: getDay() 0 = domingo, 1 = lunes...
    function getWeekStart(dateString) {
        const date = parseLocalDate(dateString);
        if (!date) {
            return null;
        }

        const daysSinceMonday = (date.getDay() + 6) % 7;
        date.setDate(date.getDate() - daysSinceMonday);
        return formatLocalDate(date);
    }

    // Suma los minutos de las sesiones con fecha entre el lunes de la semana de
    // "today" y "today", ambos incluidos. Replica la tabla de reglas de la
    // tarjeta "Minutos semana" de app.js.
    function calculateWeekProgress(sessions, today) {
        if (!Array.isArray(sessions)) {
            return 0;
        }

        const todayDate = parseLocalDate(today);
        if (!todayDate) {
            return 0;
        }

        const weekStartDate = parseLocalDate(getWeekStart(today));
        if (!weekStartDate) {
            return 0;
        }

        let totalMinutes = 0;

        sessions.forEach(session => {
            if (!session || typeof session !== 'object' || typeof session.date !== 'string') {
                return;
            }

            const sessionDate = parseLocalDate(session.date);

            // Ignorar fechas inválidas, anteriores al lunes o posteriores a hoy.
            if (!sessionDate || sessionDate < weekStartDate || sessionDate > todayDate) {
                return;
            }

            const minutes = Number(session.minutes) || 0;
            // Infinity pasaría el filtro "> 0" y arruinaría la suma: cuenta como 0 (CL-15).
            if (Number.isFinite(minutes) && minutes > 0) {
                totalMinutes += minutes;
            }
        });

        return Math.max(totalMinutes, 0);
    }

    // Porcentaje mostrado: floor((progreso / objetivo) × 100) con tope 100.
    // Devuelve 0 si el objetivo no es válido o el progreso no es un número
    // finito mayor o igual que 0.
    function calculatePercent(progress, goal) {
        const canonicalGoal = parseGoalValue(goal);
        if (canonicalGoal === null) {
            return 0;
        }

        if (typeof progress !== 'number' || !Number.isFinite(progress) || progress <= 0) {
            return 0;
        }

        return Math.min(Math.floor((progress / canonicalGoal) * 100), 100);
    }

    // Escribe los minutos con separador de miles español (punto) y coma decimal.
    // Solo se agrupa la parte entera; los decimales se muestran sin redondear.
    function formatMinutes(value) {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
            return '0';
        }

        const text = String(value);
        const [integerPart, decimalPart] = text.split('.');
        const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return decimalPart === undefined ? groupedInteger : `${groupedInteger},${decimalPart}`;
    }

    // Texto del progreso del bloque: "X de Y min".
    function formatProgressText(progress, goal) {
        return `${formatMinutes(progress)} de ${formatMinutes(goal)} min`;
    }

    // Reúne todo lo que necesita la interfaz para pintar el bloque.
    // El progreso se calcula siempre, haya objetivo o no.
    function buildWeeklyGoal(sessions, rawGoal, today) {
        const progress = calculateWeekProgress(sessions, today);
        const goal = parseGoalValue(rawGoal);
        const weekStart = getWeekStart(today);

        if (goal === null) {
            return {
                status: 'no-goal',
                today,
                weekStart,
                goal: null,
                progress,
                percent: 0,
                isComplete: false
            };
        }

        return {
            status: 'goal',
            today,
            weekStart,
            goal,
            progress,
            percent: calculatePercent(progress, goal),
            isComplete: progress >= goal
        };
    }

    const api = {
        MIN_GOAL_MINUTES,
        MAX_GOAL_MINUTES,
        parseGoalValue,
        getWeekStart,
        calculateWeekProgress,
        calculatePercent,
        formatMinutes,
        formatProgressText,
        buildWeeklyGoal
    };

    global.WeeklyGoalLogic = api;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);

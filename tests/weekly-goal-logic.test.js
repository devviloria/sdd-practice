// Pruebas de la lógica pura del objetivo semanal.
// Se ejecutan con: node --test
// Ninguna prueba depende del reloj ni del almacenamiento: todo se pasa como parámetro.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const logic = require('../weekly-goal-logic.js');

test('el módulo carga y expone las constantes del objetivo', () => {
    assert.equal(logic.MIN_GOAL_MINUTES, 1);
    assert.equal(logic.MAX_GOAL_MINUTES, 10080);
    assert.equal(typeof logic.parseGoalValue, 'function');
});

test('parseGoalValue acepta la tabla de entradas válidas de RF-10', () => {
    assert.equal(logic.parseGoalValue('300'), 300);
    assert.equal(logic.parseGoalValue(' 300 '), 300);
    assert.equal(logic.parseGoalValue('0300'), 300);
    assert.equal(logic.parseGoalValue('1'), 1);
    assert.equal(logic.parseGoalValue('10080'), 10080);
});

test('parseGoalValue rechaza la tabla de entradas inválidas de RF-10', () => {
    const invalid = [
        '3.000', '+300', '-300', '1e3', '3E2', '300,0', '300.0',
        '0', '10081', '', ' ', 'abc'
    ];

    invalid.forEach(value => {
        assert.equal(logic.parseGoalValue(value), null, `debería rechazar "${value}"`);
    });
});

test('parseGoalValue acepta números enteros dentro del rango (RF-11)', () => {
    assert.equal(logic.parseGoalValue(300), 300);
    assert.equal(logic.parseGoalValue(1), 1);
    assert.equal(logic.parseGoalValue(10080), 10080);
});

test('parseGoalValue rechaza números fuera del rango o no enteros', () => {
    const invalid = [0, -1, 10081, 300.5, 1.5, -0.5, 1080.25];

    invalid.forEach(value => {
        assert.equal(logic.parseGoalValue(value), null, `debería rechazar ${value}`);
    });
});

test('parseGoalValue rechaza valores que no son ni texto ni número', () => {
    [null, undefined, NaN, Infinity, -Infinity, true, false, {}, [], () => 300, BigInt(300)]
        .forEach(value => {
            assert.equal(logic.parseGoalValue(value), null, `debería rechazar ${String(value)}`);
        });
});

test('parseGoalValue normaliza el objetivo guardado como texto de dígitos (CL-25)', () => {
    assert.equal(logic.parseGoalValue('0300'), 300);
    assert.equal(logic.parseGoalValue(' 300 '), 300);
    assert.equal(logic.parseGoalValue(' 0300 '), 300);
    assert.equal(logic.parseGoalValue('0001'), 1);
    assert.equal(logic.parseGoalValue('010080'), 10080);
    assert.equal(logic.parseGoalValue('300'), logic.parseGoalValue(300));
});

test('parseGoalValue trata como inválido un objetivo guardado ilegible (CL-2 y CL-23)', () => {
    ['0', '10081', '1.5', '1,5', '3.000', '-300', '+300', '1e3', '', ' ', 'abc',
        '  ', '\t', 'trescientos']
        .forEach(value => {
            assert.equal(logic.parseGoalValue(value), null, `debería rechazar "${value}"`);
        });
});

test('parseGoalValue solo ignora los espacios de los extremos', () => {
    [' 300', '300 ', '\t300\n'].forEach(value => {
        assert.equal(logic.parseGoalValue(value), 300, `debería aceptar "${value}"`);
    });

    ['3 00', '30 0', '3-00', '٣٠٠', '３００'].forEach(value => {
        assert.equal(logic.parseGoalValue(value), null, `debería rechazar "${value}"`);
    });
});

test('parseGoalValue devuelve siempre el mismo resultado para la misma entrada', () => {
    ['300', '0300', '10080', '0', 'abc', 250, 10081].forEach(value => {
        assert.equal(logic.parseGoalValue(value), logic.parseGoalValue(value));
    });
});

// --- getWeekStart (RF-5, RF-9, CL-11, CL-13) ---

test('getWeekStart devuelve el lunes de la semana de la fecha', () => {
    assert.equal(logic.getWeekStart('2026-11-02'), '2026-11-02');
    assert.equal(logic.getWeekStart('2026-11-03'), '2026-11-02');
    assert.equal(logic.getWeekStart('2026-11-04'), '2026-11-02');
    assert.equal(logic.getWeekStart('2026-11-08'), '2026-11-02');
    assert.equal(logic.getWeekStart('2026-12-01'), '2026-11-30');
    assert.equal(logic.getWeekStart('2026-01-01'), '2025-12-29');
});

test('getWeekStart hace retroceder el domingo seis días', () => {
    assert.equal(logic.getWeekStart('2026-03-29'), '2026-03-23');
    assert.equal(logic.getWeekStart('2026-10-25'), '2026-10-19');
    assert.equal(logic.getWeekStart('2027-01-03'), '2026-12-28');
});

test('getWeekStart cruza de año sin romper la semana (CL-13)', () => {
    assert.equal(logic.getWeekStart('2026-12-31'), '2026-12-28');
    assert.equal(logic.getWeekStart('2027-01-01'), '2026-12-28');
    assert.equal(logic.getWeekStart('2027-01-02'), '2026-12-28');
});

test('getWeekStart rechaza fechas no interpretables sin lanzar', () => {
    ['', 'abc', '2026-02-30', '2026-13-01', '2026-00-10', '2026-11-00', '2026-11-32',
        '03/11/2026', 'sin fecha', null, undefined, 20261103, {}, []]
        .forEach(value => {
            assert.equal(logic.getWeekStart(value), null, `debería rechazar ${String(value)}`);
        });
});

test('getWeekStart interpreta la fecha como lo hace la tarjeta "Minutos semana"', () => {
    // app.js parseLocalDate usa los componentes, así que admite meses y días sin cero.
    assert.equal(logic.getWeekStart('2026-1-3'), logic.getWeekStart('2026-01-03'));
    assert.equal(logic.getWeekStart('2026-1-3'), '2025-12-29');
});

// --- calculateWeekProgress (RF-5, RF-9, CL-7, CL-8, CL-9, CL-11, CL-15) ---

test('calculateWeekProgress suma del lunes a hoy, ambos incluidos', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 30 },
        { date: '2026-11-03', minutes: 45 },
        { date: '2026-10-31', minutes: 300 },
        { date: '2026-11-01', minutes: 300 },
        { date: '2026-11-04', minutes: 200 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-03'), 75);
});

test('calculateWeekProgress con hoy lunes solo cuenta el lunes (CL-11)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 20 },
        { date: '2026-11-02', minutes: 10 },
        { date: '2026-11-03', minutes: 50 },
        { date: '2026-11-08', minutes: 100 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-02'), 30);
});

test('calculateWeekProgress suma varias sesiones del mismo día (CL-7)', () => {
    const sessions = [
        { id: 1, date: '2026-11-03', minutes: 10 },
        { id: 2, date: '2026-11-03', minutes: 15 },
        { id: 3, date: '2026-11-03', minutes: 20 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-03'), 45);
});

test('calculateWeekProgress ignora sesiones futuras de la misma semana (CL-8)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 30 },
        { date: '2026-11-06', minutes: 500 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-04'), 30);
});

test('calculateWeekProgress ignora las sesiones de semanas anteriores (CL-9)', () => {
    const sessions = [
        { date: '2026-10-26', minutes: 500 },
        { date: '2026-11-01', minutes: 500 },
        { date: '2026-11-02', minutes: 30 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-03'), 30);
});

test('calculateWeekProgress no depende del orden de las sesiones', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 10 },
        { date: '2026-11-03', minutes: 20 },
        { date: '2026-11-04', minutes: 30 },
        { date: '2026-11-06', minutes: 40 }
    ];

    assert.equal(
        logic.calculateWeekProgress(sessions, '2026-11-04'),
        logic.calculateWeekProgress([...sessions].reverse(), '2026-11-04')
    );
    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-04'), 60);
});

test('calculateWeekProgress ignora minutos vacíos, no numéricos, cero o negativos (CL-15)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: '' },
        { date: '2026-11-02', minutes: 'abc' },
        { date: '2026-11-02', minutes: 0 },
        { date: '2026-11-02', minutes: -30 },
        { date: '2026-11-02', minutes: NaN },
        { date: '2026-11-02' },
        { date: '2026-11-02', minutes: '25' }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-02'), 25);
});

test('calculateWeekProgress conserva los decimales (RF-5)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 12.5 },
        { date: '2026-11-03', minutes: 7.25 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-03'), 19.75);
});

test('calculateWeekProgress ignora fechas no interpretables (CL-15)', () => {
    const sessions = [
        { date: '2026-02-30', minutes: 100 },
        { date: '2026-13-01', minutes: 100 },
        { date: 'abc', minutes: 100 },
        { date: '', minutes: 100 },
        { date: 'sin fecha', minutes: 100 },
        { date: 20261102, minutes: 100 },
        { date: '2026-11-02', minutes: 10 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-03'), 10);
});

test('calculateWeekProgress nunca devuelve un total negativo', () => {
    const sessions = [
        { date: '2026-11-02', minutes: -10 },
        { date: '2026-11-03', minutes: -20 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-03'), 0);
});

test('calculateWeekProgress devuelve 0 si hoy no es interpretable', () => {
    const sessions = [{ date: '2026-11-02', minutes: 30 }];

    ['', 'abc', '2026-02-30', '2026-13-01', '2026-11-03 ', null, undefined, 20261103, {}]
        .forEach(value => {
            assert.equal(
                logic.calculateWeekProgress(sessions, value),
                0,
                `debería valer 0 con hoy = ${String(value)}`
            );
        });
});

test('calculateWeekProgress tolera sesiones nulas, no array o sin date', () => {
    [null, undefined, 'abc', {}, 42].forEach(value => {
        assert.equal(logic.calculateWeekProgress(value, '2026-11-03'), 0, `debería valer 0: ${String(value)}`);
    });

    assert.equal(logic.calculateWeekProgress([], '2026-11-03'), 0);
    assert.equal(
        logic.calculateWeekProgress([null, undefined, 42, {}, { date: null }, { minutes: 30 }], '2026-11-03'),
        0
    );
});

test('calculateWeekProgress cruza de año sin perder ni desplazar días (CL-13)', () => {
    const sessions = [
        { date: '2026-12-27', minutes: 100 },
        { date: '2026-12-28', minutes: 10 },
        { date: '2026-12-31', minutes: 20 },
        { date: '2027-01-01', minutes: 40 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-12-31'), 30);
    assert.equal(logic.calculateWeekProgress(sessions, '2026-12-28'), 10);
});

test('calculateWeekProgress respeta el cambio de hora en ambos sentidos (CL-12)', () => {
    // Primavera: 2026-03-29 en Europe/Madrid (semana del 23 al 29 de marzo).
    const springSessions = [
        { date: '2026-03-23', minutes: 10 },
        { date: '2026-03-28', minutes: 20 },
        { date: '2026-03-29', minutes: 30 }
    ];
    assert.equal(logic.getWeekStart('2026-03-29'), '2026-03-23');
    assert.equal(logic.calculateWeekProgress(springSessions, '2026-03-29'), 60);

    // Otoño: 2026-10-25 en Europe/Madrid (semana del 19 al 25 de octubre).
    const autumnSessions = [
        { date: '2026-10-19', minutes: 10 },
        { date: '2026-10-24', minutes: 20 },
        { date: '2026-10-25', minutes: 30 }
    ];
    assert.equal(logic.getWeekStart('2026-10-25'), '2026-10-19');
    assert.equal(logic.calculateWeekProgress(autumnSessions, '2026-10-25'), 60);
});

test('calculateWeekProgress es determinista para la misma entrada', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 10 },
        { date: '2026-11-03', minutes: 20 }
    ];

    assert.equal(
        logic.calculateWeekProgress(sessions, '2026-11-03'),
        logic.calculateWeekProgress(sessions, '2026-11-03')
    );
});

// --- calculatePercent (RF-6, RF-8, CL-3, CL-4, CL-6, CL-18, CL-20) ---

test('calculatePercent aplica la tabla de ejemplos del plan', () => {
    assert.equal(logic.calculatePercent(0, 300), 0);
    assert.equal(logic.calculatePercent(1, 300), 0);
    assert.equal(logic.calculatePercent(150, 300), 50);
    assert.equal(logic.calculatePercent(299, 300), 99);
    assert.equal(logic.calculatePercent(300, 300), 100);
    assert.equal(logic.calculatePercent(3240, 3000), 100);
    assert.equal(logic.calculatePercent(1, 3), 33);
    assert.equal(logic.calculatePercent(999, 1), 100);
});

test('calculatePercent devuelve 0 sin objetivo válido o con progreso no válido', () => {
    [null, undefined, 0, -1, 10081, 300.5, NaN, 'abc', true].forEach(goal => {
        assert.equal(
            logic.calculatePercent(150, goal),
            0,
            `debería valer 0 con objetivo ${String(goal)}`
        );
    });

    [NaN, Infinity, -Infinity, -1, '150', null, undefined].forEach(progress => {
        assert.equal(
            logic.calculatePercent(progress, 300),
            0,
            `debería valer 0 con progreso ${String(progress)}`
        );
    });
});

// --- formatMinutes y formatProgressText (RF-6, RNF-8, CL-4) ---

test('formatMinutes agrupa los miles con punto y los decimales con coma', () => {
    assert.equal(logic.formatMinutes(0), '0');
    assert.equal(logic.formatMinutes(1), '1');
    assert.equal(logic.formatMinutes(999), '999');
    assert.equal(logic.formatMinutes(1000), '1.000');
    assert.equal(logic.formatMinutes(10080), '10.080');
    assert.equal(logic.formatMinutes(3240.5), '3.240,5');
    assert.equal(logic.formatMinutes(1200.75), '1.200,75');
    assert.equal(logic.formatMinutes(1234567), '1.234.567');
});

test('formatMinutes devuelve "0" para valores no finitos o negativos', () => {
    [NaN, Infinity, -Infinity, -1, -0.5, null, undefined].forEach(value => {
        assert.equal(
            logic.formatMinutes(value),
            '0',
            `debería devolver "0" con ${String(value)}`
        );
    });
});

test('formatProgressText compone "X de Y min" con el formato español', () => {
    assert.equal(logic.formatProgressText(1200, 3000), '1.200 de 3.000 min');
    assert.equal(logic.formatProgressText(0, 300), '0 de 300 min');
    assert.equal(logic.formatProgressText(3240, 3000), '3.240 de 3.000 min');
    assert.equal(logic.formatProgressText(3240.5, 3000), '3.240,5 de 3.000 min');
});

// --- buildWeeklyGoal (RF-5, RF-7, RF-8, RF-9, RF-11) ---

test('buildWeeklyGoal devuelve el estado con objetivo', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 600 },
        { date: '2026-11-03', minutes: 600 }
    ];

    assert.deepEqual(logic.buildWeeklyGoal(sessions, '3000', '2026-11-03'), {
        status: 'goal',
        today: '2026-11-03',
        weekStart: '2026-11-02',
        goal: 3000,
        progress: 1200,
        percent: 40,
        isComplete: false
    });
});

test('buildWeeklyGoal marca isComplete al alcanzar o superar el objetivo (CL-3, CL-4)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 1500 },
        { date: '2026-11-03', minutes: 1740 }
    ];

    const exact = logic.buildWeeklyGoal(sessions, 3240, '2026-11-03');
    assert.equal(exact.progress, 3240);
    assert.equal(exact.percent, 100);
    assert.equal(exact.isComplete, true);

    const over = logic.buildWeeklyGoal(sessions, 3000, '2026-11-03');
    assert.equal(over.progress, 3240);
    assert.equal(over.percent, 100);
    assert.equal(over.isComplete, true);
});

test('buildWeeklyGoal con progreso 0 o porcentaje 0 no está cumplido (CL-5, CL-6)', () => {
    const zero = logic.buildWeeklyGoal([], 300, '2026-11-03');
    assert.equal(zero.status, 'goal');
    assert.equal(zero.progress, 0);
    assert.equal(zero.percent, 0);
    assert.equal(zero.isComplete, false);

    const one = logic.buildWeeklyGoal(
        [{ date: '2026-11-03', minutes: 1 }],
        300,
        '2026-11-03'
    );
    assert.equal(one.progress, 1);
    assert.equal(one.percent, 0);
    assert.equal(one.isComplete, false);
});

test('buildWeeklyGoal devuelve el estado sin objetivo y calcula el progreso igualmente', () => {
    const sessions = [{ date: '2026-11-02', minutes: 120 }];

    ['', '0', 'abc', '3.000', null, undefined].forEach(rawGoal => {
        const result = logic.buildWeeklyGoal(sessions, rawGoal, '2026-11-03');

        assert.equal(result.status, 'no-goal', `estado con objetivo ${String(rawGoal)}`);
        assert.equal(result.today, '2026-11-03');
        assert.equal(result.weekStart, '2026-11-02');
        assert.equal(result.goal, null);
        assert.equal(result.progress, 120);
        assert.equal(result.percent, 0);
        assert.equal(result.isComplete, false);
    });
});

test('buildWeeklyGoal devuelve today tal cual y weekStart null si la fecha no es válida', () => {
    const result = logic.buildWeeklyGoal([], '300', 'no-fecha');

    assert.equal(result.today, 'no-fecha');
    assert.equal(result.weekStart, null);
    assert.equal(result.goal, 300);
    assert.equal(result.progress, 0);
    assert.equal(result.percent, 0);
    assert.equal(result.isComplete, false);
});

// --- Casos límite y pureza (T-05: RF-9, RF-11, RNF-6, RNF-11) ---

test('calculateWeekProgress ignora los minutos no finitos (CL-15)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: Infinity },
        { date: '2026-11-02', minutes: -Infinity },
        { date: '2026-11-02', minutes: '60' },
        { date: '2026-11-02', minutes: 15 },
        { date: '2026-11-03', minutes: 5.5 }
    ];

    const progress = logic.calculateWeekProgress(sessions, '2026-11-03');
    assert.equal(Number.isFinite(progress), true);
    assert.equal(progress, 80.5);
});

test('calculateWeekProgress tolera entradas con formas inesperadas', () => {
    const sessions = [
        'abc',
        42,
        true,
        [],
        new Date(2026, 10, 2),
        { date: '2026-11-02', minutes: ' 30 ' },
        { date: '2026-11-02', minutes: '   ' },
        { date: '2026-11-02', minutes: 0 }
    ];

    assert.equal(logic.calculateWeekProgress(sessions, '2026-11-02'), 30);
});

test('buildWeeklyGoal tolera sesiones nulas o no array sin perder el objetivo (RF-11)', () => {
    [null, undefined, 'abc', {}, 42, new Set()].forEach(sessions => {
        const result = logic.buildWeeklyGoal(sessions, '300', '2026-11-03');

        assert.equal(result.status, 'goal', `sesiones ${String(sessions)}`);
        assert.equal(result.today, '2026-11-03');
        assert.equal(result.weekStart, '2026-11-02');
        assert.equal(result.goal, 300);
        assert.equal(result.progress, 0);
        assert.equal(result.percent, 0);
        assert.equal(result.isComplete, false);
    });
});

test('buildWeeklyGoal ignora entradas nulas, sin date o con date numérico (CL-15)', () => {
    const sessions = [
        null,
        undefined,
        'sesión',
        42,
        { minutes: 500 },
        { date: null, minutes: 500 },
        { date: 20261102, minutes: 500 },
        { date: '2026-11-02', minutes: 500 }
    ];

    const result = logic.buildWeeklyGoal(sessions, '1000', '2026-11-03');
    assert.equal(result.progress, 500);
    assert.equal(result.percent, 50);
});

test('buildWeeklyGoal trata como sin semana un hoy imposible', () => {
    const sessions = [{ date: '2026-11-02', minutes: 30 }];

    ['2026-13-01', '2026-02-30', '2026-00-10', '2026-11-32'].forEach(today => {
        const result = logic.buildWeeklyGoal(sessions, '300', today);

        assert.equal(result.status, 'goal', `hoy ${today}`);
        assert.equal(result.today, today);
        assert.equal(result.weekStart, null);
        assert.equal(result.progress, 0);
        assert.equal(result.percent, 0);
        assert.equal(result.isComplete, false);
    });
});

test('buildWeeklyGoal tolera un hoy nulo, indefinido o vacío', () => {
    [null, undefined, ''].forEach(today => {
        const result = logic.buildWeeklyGoal([{ date: '2026-11-02', minutes: 30 }], '300', today);

        assert.equal(result.status, 'goal', `hoy ${String(today)}`);
        assert.equal(result.today, today);
        assert.equal(result.weekStart, null);
        assert.equal(result.progress, 0);
        assert.equal(result.percent, 0);
    });
});

test('buildWeeklyGoal acepta el objetivo como número y como texto de dígitos (RF-11)', () => {
    const sessions = [{ date: '2026-11-02', minutes: 600 }];

    [300, '300', ' 300 ', '0300'].forEach(rawGoal => {
        const result = logic.buildWeeklyGoal(sessions, rawGoal, '2026-11-03');

        assert.equal(result.status, 'goal', `objetivo ${String(rawGoal)}`);
        assert.equal(result.goal, 300);
        assert.equal(result.progress, 600);
        assert.equal(result.percent, 100);
        assert.equal(result.isComplete, true);
    });
});

test('buildWeeklyGoal trata como sin objetivo los valores ilegibles (CL-2, CL-23)', () => {
    const sessions = [{ date: '2026-11-02', minutes: 600 }];

    [null, undefined, {}, { minutes: 300 }, [300], [], true, false, NaN, Infinity, -Infinity,
        () => 300, new String('300')]
        .forEach(rawGoal => {
            const result = logic.buildWeeklyGoal(sessions, rawGoal, '2026-11-03');

            assert.equal(result.status, 'no-goal', `objetivo ${String(rawGoal)}`);
            assert.equal(result.goal, null);
            assert.equal(result.progress, 600);
            assert.equal(result.percent, 0);
            assert.equal(result.isComplete, false);
        });
});

test('buildWeeklyGoal acepta los límites 1 y 10.080 minutos (CL-14)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 5000 },
        { date: '2026-11-03', minutes: 5080 }
    ];

    const minGoal = logic.buildWeeklyGoal(sessions, 1, '2026-11-03');
    assert.equal(minGoal.goal, logic.MIN_GOAL_MINUTES);
    assert.equal(minGoal.progress, 10080);
    assert.equal(minGoal.percent, 100);
    assert.equal(minGoal.isComplete, true);

    const maxGoal = logic.buildWeeklyGoal(sessions, '10080', '2026-11-03');
    assert.equal(maxGoal.goal, logic.MAX_GOAL_MINUTES);
    assert.equal(maxGoal.progress, 10080);
    assert.equal(maxGoal.percent, 100);
    assert.equal(maxGoal.isComplete, true);

    const almost = logic.buildWeeklyGoal([{ date: '2026-11-02', minutes: 10079 }], '10080', '2026-11-03');
    assert.equal(almost.progress, 10079);
    assert.equal(almost.percent, 99);
    assert.equal(almost.isComplete, false);
});

test('buildWeeklyGoal con el mismo objetivo repetido da el mismo resultado (CL-21)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 600 },
        { date: '2026-11-03', minutes: 400 }
    ];

    const first = logic.buildWeeklyGoal(sessions, 2000, '2026-11-03');
    const second = logic.buildWeeklyGoal(sessions, 2000, '2026-11-03');

    assert.deepEqual(first, second);
    assert.equal(first.progress, 1000);
    assert.equal(first.percent, 50);
    assert.equal(first.isComplete, false);
});

test('buildWeeklyGoal es determinista y no depende del reloj (RNF-11)', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 600 },
        { date: '2026-11-03', minutes: 400 }
    ];

    const first = logic.buildWeeklyGoal(sessions, '3000', '2026-11-03');
    const second = logic.buildWeeklyGoal(sessions, '3000', '2026-11-03');
    const third = logic.buildWeeklyGoal(sessions, '3000', '2026-11-03');

    assert.deepEqual(second, first);
    assert.deepEqual(third, first);
    assert.equal(first.progress, 1000);
    assert.equal(first.percent, 33);
});

test('buildWeeklyGoal calcula bien la semana que cruza de año (CL-13)', () => {
    const sessions = [
        { date: '2026-12-27', minutes: 100 },
        { date: '2026-12-28', minutes: 10 },
        { date: '2026-12-31', minutes: 20 },
        { date: '2027-01-01', minutes: 40 },
        { date: '2027-01-03', minutes: 80 }
    ];

    const result = logic.buildWeeklyGoal(sessions, 100, '2027-01-02');
    assert.equal(result.weekStart, '2026-12-28');
    assert.equal(result.progress, 70);
    assert.equal(result.percent, 70);
    assert.equal(result.isComplete, false);
});

test('buildWeeklyGoal no se altera con el cambio de hora estacional (CL-12)', () => {
    const spring = logic.buildWeeklyGoal(
        [
            { date: '2026-03-23', minutes: 10 },
            { date: '2026-03-28', minutes: 20 },
            { date: '2026-03-29', minutes: 30 }
        ],
        60,
        '2026-03-29'
    );
    assert.equal(spring.weekStart, '2026-03-23');
    assert.equal(spring.progress, 60);
    assert.equal(spring.percent, 100);
    assert.equal(spring.isComplete, true);

    const autumn = logic.buildWeeklyGoal(
        [
            { date: '2026-10-19', minutes: 10 },
            { date: '2026-10-24', minutes: 20 },
            { date: '2026-10-25', minutes: 30 }
        ],
        '120',
        '2026-10-25'
    );
    assert.equal(autumn.weekStart, '2026-10-19');
    assert.equal(autumn.progress, 60);
    assert.equal(autumn.percent, 50);
    assert.equal(autumn.isComplete, false);
});

test('weekly-goal-logic.js no usa almacenamiento, DOM, reloj ni temporizadores (RNF-6, RNF-11)', () => {
    const sourcePath = path.join(__dirname, '..', 'weekly-goal-logic.js');
    const source = fs.readFileSync(sourcePath, 'utf8');

    ['localStorage', 'document', 'Date.now', 'toISOString', 'setTimeout', 'setInterval', 'Math.random']
        .forEach(token => {
            assert.equal(source.includes(token), false, `no debería usar ${token}`);
        });
});

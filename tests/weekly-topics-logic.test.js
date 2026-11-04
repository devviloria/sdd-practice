// Pruebas de la lógica pura de temas semanales.
// Se ejecutan con: node --test

const test = require('node:test');
const assert = require('node:assert/strict');

const logic = require('../weekly-topics-logic.js');

test('parseLocalDate valida fechas reales y construye el día por componentes locales', () => {
    const date = logic.parseLocalDate('2026-03-29');

    assert.ok(date instanceof Date);
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 2);
    assert.equal(date.getDate(), 29);
    assert.equal(date.getHours(), 12);

    ['2026-02-30', '2026-13-01', '2026-00-10', '2026-03-9', '2026-03-09 ', null, 20260309]
        .forEach(value => assert.equal(logic.parseLocalDate(value), null, `debería rechazar ${value}`));
});

test('getWeekStart devuelve el lunes local y cruza meses y años', () => {
    assert.equal(logic.getWeekStart('2026-11-02'), '2026-11-02');
    assert.equal(logic.getWeekStart('2026-11-04'), '2026-11-02');
    assert.equal(logic.getWeekStart('2026-11-08'), '2026-11-02');
    assert.equal(logic.getWeekStart('2027-01-01'), '2026-12-28');
    assert.equal(logic.getWeekStart('2026-02-30'), null);
});

test('filterClassifiableSessions incluye lunes y hoy y excluye días fuera del periodo', () => {
    const monday = { date: '2026-11-02', topic: 'Lunes', minutes: 10 };
    const today = { date: '2026-11-04', topic: 'Hoy', minutes: 20 };
    const previousDay = { date: '2026-11-01', topic: 'Anterior', minutes: 30 };
    const futureDay = { date: '2026-11-05', topic: 'Futuro', minutes: 40 };
    const impossibleDay = { date: '2026-11-31', topic: 'Imposible', minutes: 50 };

    assert.deepEqual(
        logic.filterClassifiableSessions([monday, today, previousDay, futureDay, impossibleDay], '2026-11-04'),
        [monday, today]
    );
});

test('filterClassifiableSessions admite únicamente temas de texto con contenido tras trim', () => {
    const validTopic = { date: '2026-11-04', topic: ' \t JavaScript \n', minutes: 5 };
    const sessions = [
        validTopic,
        { date: '2026-11-04', topic: ' \t\n ', minutes: 5 },
        { date: '2026-11-04', topic: '', minutes: 5 },
        { date: '2026-11-04', topic: 12, minutes: 5 },
        { date: '2026-11-04', minutes: 5 }
    ];

    assert.deepEqual(logic.filterClassifiableSessions(sessions, '2026-11-04'), [validTopic]);
});

test('filterClassifiableSessions admite minutos positivos finitos de tipo number únicamente', () => {
    const validDecimal = { date: '2026-11-04', topic: 'Decimal', minutes: 0.5 };
    const sessions = [
        validDecimal,
        { date: '2026-11-04', topic: 'Cero', minutes: 0 },
        { date: '2026-11-04', topic: 'Negativo', minutes: -1 },
        { date: '2026-11-04', topic: 'NaN', minutes: NaN },
        { date: '2026-11-04', topic: 'Infinito', minutes: Infinity },
        { date: '2026-11-04', topic: 'Negativo infinito', minutes: -Infinity },
        { date: '2026-11-04', topic: 'Texto', minutes: '5' },
        { date: '2026-11-04', topic: 'Nulo', minutes: null }
    ];

    assert.deepEqual(logic.filterClassifiableSessions(sessions, '2026-11-04'), [validDecimal]);
});

test('filterClassifiableSessions tolera sesiones inválidas y hoy inválido sin modificar datos', () => {
    const valid = { date: '2026-11-04', topic: 'Estudio', minutes: 25 };
    const original = [null, undefined, 7, 'sesión', [], {}, { date: null }, valid];
    const before = original.slice();

    assert.deepEqual(logic.filterClassifiableSessions(original, '2026-11-04'), [valid]);
    assert.deepEqual(original, before);
    assert.deepEqual(logic.filterClassifiableSessions([valid], '2026-02-30'), []);
    assert.deepEqual(logic.filterClassifiableSessions([valid], null), []);
    assert.deepEqual(logic.filterClassifiableSessions(null, '2026-11-04'), []);
});

test('aggregateWeeklyTopics agrupa ignorando mayúsculas y whitespace exterior', () => {
    const sessions = [
        { date: '2026-11-02', topic: ' JavaScript ', minutes: 20 },
        { date: '2026-11-03', topic: '\tJAVASCRIPT\n', minutes: 15 },
        { date: '2026-11-04', topic: ' javascript', minutes: 5 }
    ];

    assert.deepEqual(logic.aggregateWeeklyTopics(sessions, '2026-11-04'), [
        { topic: 'JavaScript', minutes: 40 }
    ]);
});

test('aggregateWeeklyTopics suma sesiones del mismo tema en distintos días', () => {
    const sessions = [
        { date: '2026-11-02', topic: 'Lectura', minutes: 12 },
        { date: '2026-11-02', topic: 'Lectura', minutes: 8 },
        { date: '2026-11-04', topic: 'LECTURA', minutes: 30 }
    ];

    assert.deepEqual(logic.aggregateWeeklyTopics(sessions, '2026-11-04'), [
        { topic: 'Lectura', minutes: 50 }
    ]);
});

test('aggregateWeeklyTopics toma el nombre visible de la primera sesión clasificable original', () => {
    const sessions = [
        { date: '2026-11-04', topic: '  ', minutes: 100 },
        { date: '2026-11-02', topic: '  cSs  ', minutes: 0 },
        { date: '2026-11-03', topic: '\tCSS\n', minutes: 10 },
        { date: '2026-11-04', topic: 'Css', minutes: 5 }
    ];

    assert.deepEqual(logic.aggregateWeeklyTopics(sessions, '2026-11-04'), [
        { topic: 'CSS', minutes: 15 }
    ]);
});

test('buildWeeklyTopics ordena por minutos y alfabéticamente sin distinguir mayúsculas en empates', () => {
    const sessions = [
        { date: '2026-11-02', topic: 'zeta', minutes: 30 },
        { date: '2026-11-02', topic: 'beta', minutes: 20 },
        { date: '2026-11-02', topic: 'Alfa', minutes: 30 },
        { date: '2026-11-02', topic: 'BETA', minutes: 5 }
    ];

    assert.deepEqual(logic.buildWeeklyTopics(sessions, '2026-11-04'), {
        status: 'ranking',
        items: [
            { topic: 'Alfa', minutes: 30, rank: 1, medal: 'Oro' },
            { topic: 'zeta', minutes: 30, rank: 1, medal: 'Oro' },
            { topic: 'beta', minutes: 25, rank: 2, medal: 'Plata' }
        ]
    });
});

test('buildWeeklyTopics comparte medalla y puesto denso en el primero y segundo puesto', () => {
    const sessions = [
        { date: '2026-11-02', topic: 'Uno', minutes: 30 },
        { date: '2026-11-02', topic: 'Dos', minutes: 30 },
        { date: '2026-11-02', topic: 'Tres', minutes: 20 },
        { date: '2026-11-02', topic: 'Cuatro', minutes: 20 },
        { date: '2026-11-02', topic: 'Cinco', minutes: 10 }
    ];

    assert.deepEqual(logic.buildWeeklyTopics(sessions, '2026-11-04').items, [
        { topic: 'Dos', minutes: 30, rank: 1, medal: 'Oro' },
        { topic: 'Uno', minutes: 30, rank: 1, medal: 'Oro' },
        { topic: 'Cuatro', minutes: 20, rank: 2, medal: 'Plata' },
        { topic: 'Tres', minutes: 20, rank: 2, medal: 'Plata' },
        { topic: 'Cinco', minutes: 10, rank: 3, medal: 'Bronce' }
    ]);
});

test('buildWeeklyTopics comparte bronce en el tercer puesto denso y excluye el cuarto', () => {
    const sessions = [
        { date: '2026-11-02', topic: 'Primero', minutes: 40 },
        { date: '2026-11-02', topic: 'Segundo', minutes: 30 },
        { date: '2026-11-02', topic: 'Tercero B', minutes: 20 },
        { date: '2026-11-02', topic: 'Tercero A', minutes: 20 },
        { date: '2026-11-02', topic: 'Cuarto', minutes: 10 }
    ];

    assert.deepEqual(logic.buildWeeklyTopics(sessions, '2026-11-04').items, [
        { topic: 'Primero', minutes: 40, rank: 1, medal: 'Oro' },
        { topic: 'Segundo', minutes: 30, rank: 2, medal: 'Plata' },
        { topic: 'Tercero A', minutes: 20, rank: 3, medal: 'Bronce' },
        { topic: 'Tercero B', minutes: 20, rank: 3, medal: 'Bronce' }
    ]);
});

test('buildWeeklyTopics expande el top 3 para incluir todas las filas de sus puestos densos', () => {
    const sessions = [
        { date: '2026-11-02', topic: 'Oro B', minutes: 30 },
        { date: '2026-11-02', topic: 'Oro A', minutes: 30 },
        { date: '2026-11-02', topic: 'Plata B', minutes: 20 },
        { date: '2026-11-02', topic: 'Plata A', minutes: 20 },
        { date: '2026-11-02', topic: 'Bronce B', minutes: 10 },
        { date: '2026-11-02', topic: 'Bronce A', minutes: 10 },
        { date: '2026-11-02', topic: 'Fuera del top', minutes: 5 }
    ];

    const result = logic.buildWeeklyTopics(sessions, '2026-11-04');

    assert.equal(result.items.length, 6);
    assert.deepEqual(result.items.map(item => item.rank), [1, 1, 2, 2, 3, 3]);
    assert.deepEqual(result.items.map(item => item.medal), [
        'Oro', 'Oro', 'Plata', 'Plata', 'Bronce', 'Bronce'
    ]);
    assert.equal(result.items.some(item => item.topic === 'Fuera del top'), false);
});

test('buildWeeklyTopics devuelve un estado vacío exacto sin temas clasificables', () => {
    const emptyResult = { status: 'empty', items: [] };

    assert.deepEqual(logic.buildWeeklyTopics([], '2026-11-04'), emptyResult);
    assert.deepEqual(logic.buildWeeklyTopics(null, '2026-11-04'), emptyResult);
    assert.deepEqual(logic.buildWeeklyTopics([null, {}, { topic: 'Sin fecha' }], '2026-11-04'), emptyResult);
    assert.deepEqual(logic.buildWeeklyTopics([{ date: '2026-11-04', topic: 'Tema', minutes: 5 }], '2026-02-30'), emptyResult);
    assert.deepEqual(logic.buildWeeklyTopics([{ date: '2026-11-04', topic: 'Tema', minutes: 5 }], '2026-02-30'), emptyResult);
});

test('buildWeeklyTopics muestra solo los puestos disponibles para uno o dos temas', () => {
    const oneTopic = [{ date: '2026-11-02', topic: 'Único', minutes: 12 }];
    const twoTopics = [
        ...oneTopic,
        { date: '2026-11-03', topic: 'Otro', minutes: 8 }
    ];

    assert.deepEqual(logic.buildWeeklyTopics(oneTopic, '2026-11-04'), {
        status: 'ranking',
        items: [{ topic: 'Único', minutes: 12, rank: 1, medal: 'Oro' }]
    });
    assert.deepEqual(logic.buildWeeklyTopics(twoTopics, '2026-11-04'), {
        status: 'ranking',
        items: [
            { topic: 'Único', minutes: 12, rank: 1, medal: 'Oro' },
            { topic: 'Otro', minutes: 8, rank: 2, medal: 'Plata' }
        ]
    });
});

test('buildWeeklyTopics ignora registros mal formados, temas vacíos, minutos inválidos y fechas fuera del periodo', () => {
    const sessions = [
        null,
        undefined,
        4,
        'registro',
        [],
        {},
        { date: '2026-11-02', topic: ' \t\n ', minutes: 100 },
        { date: '2026-11-02', topic: 'Cero', minutes: 0 },
        { date: '2026-11-02', topic: 'Negativo', minutes: -1 },
        { date: '2026-11-02', topic: 'No finito', minutes: Infinity },
        { date: '2026-11-01', topic: 'Anterior', minutes: 100 },
        { date: '2026-11-05', topic: 'Futuro', minutes: 100 },
        { date: '2026-11-31', topic: 'Fecha imposible', minutes: 100 },
        { date: '2026-11-02', topic: 'Lunes', minutes: 10 },
        { date: '2026-11-04', topic: 'Hoy', minutes: 5 }
    ];

    assert.deepEqual(logic.buildWeeklyTopics(sessions, '2026-11-04'), {
        status: 'ranking',
        items: [
            { topic: 'Lunes', minutes: 10, rank: 1, medal: 'Oro' },
            { topic: 'Hoy', minutes: 5, rank: 2, medal: 'Plata' }
        ]
    });
});

test('buildWeeklyTopics no modifica el array ni las sesiones y es determinista', () => {
    const sessions = Object.freeze([
        Object.freeze({ date: '2026-11-02', topic: 'Beta', minutes: 10 }),
        Object.freeze({ date: '2026-11-03', topic: 'Alfa', minutes: 10 }),
        Object.freeze({ date: '2026-11-04', topic: 'Beta', minutes: 5 })
    ]);
    const snapshot = sessions.map(session => ({ ...session }));

    const firstResult = logic.buildWeeklyTopics(sessions, '2026-11-04');

    assert.deepEqual(sessions, snapshot);
    assert.deepEqual(logic.buildWeeklyTopics(sessions, '2026-11-04'), firstResult);
    assert.deepEqual(sessions, snapshot);
});
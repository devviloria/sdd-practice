// Pruebas de la lógica pura del mapa de calor.
// Se ejecutan con: node --test
// Ninguna prueba depende de la fecha real: siempre se pasa "hoy".

const test = require('node:test');
const assert = require('node:assert/strict');

const logic = require('../heatmap-logic.js');

function allDays(data) {
    return data.columns.flat();
}

function dayDiff(from, to) {
    return Math.round((logic.parseLocalDate(to) - logic.parseLocalDate(from)) / 86400000);
}

test('el módulo carga y expone las constantes del mapa', () => {
    assert.equal(logic.WEEKS, 12);
    assert.equal(logic.DAYS_PER_WEEK, 7);
    assert.equal(logic.TOTAL_DAYS, 84);
});

test('isValidDateString acepta fechas reales y rechaza imposibles o mal formadas', () => {
    assert.equal(logic.isValidDateString('2026-11-03'), true);
    assert.equal(logic.isValidDateString('2028-02-29'), true);

    ['', null, undefined, 20261103, '2026-13-01', '2026-02-30', '2026-00-10',
        '2026-11-00', '03/11/2026', '2026-1-3', '2026-11-03 ', ' 2026-11-03']
        .forEach(value => {
            assert.equal(logic.isValidDateString(value), false, `debería rechazar ${value}`);
        });
});

test('parseLocalDate y formatLocalDate hacen ida y vuelta sin usar UTC', () => {
    ['2026-11-03', '2026-01-01', '2026-12-31', '2028-02-29'].forEach(value => {
        const date = logic.parseLocalDate(value);
        assert.equal(date.getHours(), 12);
        assert.equal(logic.formatLocalDate(date), value);
    });
});

test('addDays cruza meses, años y el 29 de febrero', () => {
    assert.equal(logic.addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(logic.addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(logic.addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(logic.addDays('2028-03-01', -1), '2028-02-29');
    assert.equal(logic.addDays('2026-10-25', 1), '2026-10-26');
    assert.equal(logic.addDays('2026-10-25', -1), '2026-10-24');
    assert.equal(logic.addDays('2026-11-03', 0), '2026-11-03');
});

test('startOfWeek devuelve el lunes de la semana', () => {
    assert.equal(logic.startOfWeek('2026-11-02'), '2026-11-02');
    assert.equal(logic.startOfWeek('2026-11-03'), '2026-11-02');
    assert.equal(logic.startOfWeek('2026-11-08'), '2026-11-02');
    assert.equal(logic.startOfWeek('2026-12-01'), '2026-11-30');
    assert.equal(logic.startOfWeek('2026-01-01'), '2025-12-29');
});

test('toMinutes normaliza valores inválidos y conserva los decimales', () => {
    assert.equal(logic.toMinutes(30), 30);
    assert.equal(logic.toMinutes('30'), 30);
    assert.equal(logic.toMinutes(' 30 '), 30);
    assert.equal(logic.toMinutes(29.5), 29.5);
    assert.equal(logic.toMinutes(0), 0);

    ['', 'abc', '1,5', null, undefined, NaN, -10, Infinity, true, {}]
        .forEach(value => {
            assert.equal(logic.toMinutes(value), 0, `debería valer 0: ${String(value)}`);
        });
});

test('getIntensityLevel aplica los umbrales exactos', () => {
    assert.deepEqual(
        [0, 1, 29, 30, 59, 60, 119, 120, 121, 1000].map(logic.getIntensityLevel),
        [0, 1, 1, 2, 2, 3, 3, 4, 4, 4]
    );
    assert.equal(logic.getIntensityLevel(-5), 0);
    assert.equal(logic.getIntensityLevel(NaN), 0);
});

test('sumMinutesByDate suma por día, ignora futuras y fuera de rango', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 20 },
        { date: '2026-11-02', minutes: 25 },
        { date: '2026-11-03', minutes: 60 },
        { date: '2026-11-05', minutes: 300 },
        { date: '2026-08-01', minutes: 30 },
        { date: '2027-01-01', minutes: 30 },
        { date: '2026-02-30', minutes: 30 },
        { date: 'sin fecha', minutes: 30 },
        { date: '2026-11-04', minutes: 'abc' }
    ];

    const totals = logic.sumMinutesByDate(sessions, '2026-08-17', '2026-11-08', '2026-11-04');

    assert.deepEqual(totals, {
        '2026-11-02': 45,
        '2026-11-03': 60,
        '2026-11-04': 0
    });
});

test('sumMinutesByDate no depende del orden ni descarta duplicados', () => {
    const sessions = [
        { id: 1, date: '2026-11-03', minutes: 10 },
        { id: 1, date: '2026-11-03', minutes: 15 }
    ];

    const direct = logic.sumMinutesByDate(sessions, '2026-11-01', '2026-11-30', '2026-11-30');
    const reversed = logic.sumMinutesByDate([...sessions].reverse(), '2026-11-01', '2026-11-30', '2026-11-30');

    assert.equal(direct['2026-11-03'], 25);
    assert.deepEqual(direct, reversed);
});

test('sumMinutesByDate tolera sesiones nulas o no array', () => {
    assert.deepEqual(logic.sumMinutesByDate(null, '2026-01-01', '2026-12-31', '2026-12-31'), {});
    assert.deepEqual(logic.sumMinutesByDate([], '2026-01-01', '2026-12-31', '2026-12-31'), {});
    assert.deepEqual(
        logic.sumMinutesByDate([null, undefined, 42, {}], '2026-01-01', '2026-12-31', '2026-12-31'),
        {}
    );
});

test('buildHeatmap genera 12 semanas de lunes a domingo terminando en la semana de hoy', () => {
    const data = logic.buildHeatmap([], '2026-11-04');

    assert.equal(data.start, '2026-08-17');
    assert.equal(data.end, '2026-11-08');
    assert.equal(data.columns.length, 12);
    data.columns.forEach(column => assert.equal(column.length, 7));

    const days = allDays(data);
    assert.equal(days.length, 84);
    assert.equal(new Set(days.map(day => day.date)).size, 84);
    assert.equal(days[0].date, data.start);
    assert.equal(days[83].date, data.end);

    for (let i = 1; i < days.length; i++) {
        assert.equal(dayDiff(days[i - 1].date, days[i].date), 1);
    }
});

test('buildHeatmap marca cada día con su índice de lunes a domingo', () => {
    const data = logic.buildHeatmap([], '2026-11-04');
    allDays(data).forEach(day => {
        assert.equal(logic.parseLocalDate(day.date).getDay(), (day.weekday + 1) % 7);
    });
});

test('buildHeatmap empieza en lunes también si hoy es lunes o domingo', () => {
    const monday = logic.buildHeatmap([], '2026-11-02');
    assert.equal(monday.start, '2026-08-17');
    assert.equal(monday.end, '2026-11-08');
    assert.equal(monday.columns[11][0].isToday, true);
    assert.equal(monday.columns[11].filter(day => day.isFuture).length, 6);

    const sunday = logic.buildHeatmap([], '2026-11-08');
    assert.equal(sunday.start, '2026-08-17');
    assert.equal(sunday.end, '2026-11-08');
    assert.equal(sunday.columns[11][6].isToday, true);
    assert.equal(sunday.columns[11].filter(day => day.isFuture).length, 0);
});

test('buildHeatmap cruza de año sin romper las semanas', () => {
    const data = logic.buildHeatmap([], '2026-01-15');
    assert.equal(data.start, '2025-10-27');
    assert.equal(data.end, '2026-01-18');
    assert.equal(allDays(data).length, 84);
    assert.equal(new Set(allDays(data).map(day => day.date)).size, 84);
});

test('buildHeatmap incluye el 29 de febrero de un año bisiesto', () => {
    const data = logic.buildHeatmap([], '2028-03-01');
    assert.equal(allDays(data).length, 84);
    assert.ok(allDays(data).some(day => day.date === '2028-02-29'));
    assert.equal(new Set(allDays(data).map(day => day.date)).size, 84);
});

test('buildHeatmap asigna el nivel según los minutos del día', () => {
    const sessions = [
        { date: '2026-11-02', minutes: 29 },
        { date: '2026-11-03', minutes: 20 },
        { date: '2026-11-03', minutes: 25 },
        { date: '2026-11-04', minutes: 120 }
    ];

    const days = allDays(logic.buildHeatmap(sessions, '2026-11-04'));
    const byDate = Object.fromEntries(days.map(day => [day.date, day]));

    assert.equal(byDate['2026-11-02'].level, 1);
    assert.equal(byDate['2026-11-03'].minutes, 45);
    assert.equal(byDate['2026-11-03'].level, 2);
    assert.equal(byDate['2026-11-04'].level, 4);
    assert.equal(byDate['2026-10-31'].level, 0);
    assert.equal(byDate['2026-10-31'].minutes, 0);
});

test('buildHeatmap ignora las sesiones futuras', () => {
    const sessions = [{ date: '2026-11-05', minutes: 300 }];
    const data = logic.buildHeatmap(sessions, '2026-11-04');
    const future = allDays(data).find(day => day.date === '2026-11-05');

    assert.equal(future.isFuture, true);
    assert.equal(future.minutes, 0);
    assert.equal(future.level, 0);
    assert.equal(data.hasActivity, false);
    assert.equal(data.emptyState, 'no-recent');
});

test('buildHeatmap marca exactamente un día como hoy', () => {
    const data = logic.buildHeatmap([], '2026-11-04');
    assert.equal(allDays(data).filter(day => day.isToday).length, 1);
    assert.equal(allDays(data).find(day => day.isToday).date, '2026-11-04');
});

test('buildHeatmap distingue el estado vacío de sesiones y de periodo', () => {
    assert.equal(logic.buildHeatmap([], '2026-11-04').emptyState, 'no-sessions');
    assert.equal(
        logic.buildHeatmap([{ date: '2026-01-01', minutes: 30 }], '2026-11-04').emptyState,
        'no-recent'
    );
    assert.equal(
        logic.buildHeatmap([{ date: '2026-01-01', minutes: 30 }, { date: '2026-11-05', minutes: 30 }], '2026-11-04').emptyState,
        'no-recent'
    );
    assert.equal(
        logic.buildHeatmap([{ date: '2026-11-04', minutes: 30 }], '2026-11-04').emptyState,
        null
    );
});

test('buildHeatmap tolera hoy inválido y sesiones corruptas', () => {
    const invalid = logic.buildHeatmap([], '2026-02-30');
    assert.deepEqual(invalid.columns, []);
    assert.equal(invalid.emptyState, 'no-sessions');

    const corrupt = logic.buildHeatmap(
        [null, undefined, 7, {}, { date: 'sin fecha' }, { date: '2026-11-04', minutes: 'abc' }],
        '2026-11-04'
    );
    assert.equal(allDays(corrupt).length, 84);
    assert.equal(corrupt.hasActivity, false);
    assert.equal(corrupt.emptyState, 'no-recent');
});

test('buildHeatmap no depende de la zona horaria para el número de días', () => {
    const data = logic.buildHeatmap([], '2026-11-01');
    const days = allDays(data);
    assert.equal(days.length, 84);
    assert.equal(new Set(days.map(day => day.date)).size, 84);
    assert.equal(dayDiff(days[0].date, days[83].date), 83);
});

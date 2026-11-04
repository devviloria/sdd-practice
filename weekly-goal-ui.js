// Interfaz del objetivo semanal.
// Pinta los tres estados del bloque (sin objetivo, en progreso y cumplido) con la
// estructura que devuelve WeeklyGoalLogic y gestiona el editor: fijar, editar,
// cancelar, quitar, validación al enviar, avisos y foco.
// No calcula nada: lee datos y escribe en el DOM.

(function () {
    'use strict';

    // Texto exacto del mensaje de objetivo cumplido (RF-8).
    const DONE_TEXT = '¡Objetivo cumplido!';
    // Mensajes exactos de la spec (RF-4 y RF-10).
    const VALIDATION_ERROR_TEXT = 'Introduce un número entero de minutos entre 1 y 10.080';
    const SAVE_ERROR_TEXT = 'No se ha podido guardar el objetivo';
    // Espacio duro para que el signo % no quede solo al final de una línea a 320 px.
    const PERCENT_SEPARATOR = '\u00A0';

    // Máquina de estados mínima de la interfaz: el editor abierto manda sobre la
    // visibilidad de los estados de fondo. Un repintado externo (por ejemplo, al
    // registrar una sesión) actualiza el fondo pero no cierra el editor ni pisa lo
    // escrito; el estado nuevo se ve al cerrar.
    let eventsReady = false;
    let isEditorOpen = false;
    let editorOrigin = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    // Un botón "existe" para devolverle el foco si sigue en pantalla.
    function isVisible(element) {
        return Boolean(element && element.isConnected && !element.hidden &&
            element.offsetParent !== null);
    }

    function focusElement(element) {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    }

    function focusSection() {
        focusElement(getElement('weeklyGoalSection'));
    }

    // Devuelve el foco a la acción que abrió el editor o, si ya no está visible
    // (p. ej. "Fijar objetivo" tras guardar), al bloque del objetivo (RF-15).
    function returnFocusToOrigin() {
        if (isVisible(editorOrigin)) {
            focusElement(editorOrigin);
            return;
        }
        focusSection();
    }

    // --- Errores y avisos: mensajes distintos y excluyentes (RF-4, RF-10) ---

    function clearValidationError() {
        const input = getElement('goalMinutes');
        const error = getElement('goalError');

        if (input) {
            input.removeAttribute('aria-invalid');
        }
        if (error) {
            error.textContent = '';
            error.hidden = true;
        }
    }

    function clearSaveError() {
        const saveError = getElement('goalSaveError');
        if (saveError) {
            saveError.textContent = '';
            saveError.hidden = true;
        }
    }

    function showValidationError() {
        const input = getElement('goalMinutes');
        const error = getElement('goalError');

        clearSaveError();

        if (input) {
            input.setAttribute('aria-invalid', 'true');
        }
        if (error) {
            error.textContent = VALIDATION_ERROR_TEXT;
            error.hidden = false;
        }
        // El foco vuelve al campo para corregir el valor (RF-15).
        focusElement(input);
    }

    function showSaveError() {
        const saveError = getElement('goalSaveError');

        clearValidationError();

        if (saveError) {
            saveError.textContent = SAVE_ERROR_TEXT;
            saveError.hidden = false;
        }
    }

    // --- Editor ---

    // Abre el editor con un valor inicial (vacío al fijar, el actual al editar).
    function openEditor(originButton, initialValue) {
        const form = getElement('goalForm');
        const input = getElement('goalMinutes');

        if (!form || !input) {
            return;
        }

        // Al abrir se limpian los dos mensajes: son excluyentes y no arrastran estado.
        clearValidationError();
        clearSaveError();

        editorOrigin = originButton || null;
        isEditorOpen = true;
        // "Editar" no selecciona el texto: solo coloca el foco (plan §15).
        input.value = initialValue;
        form.hidden = false;

        // Pinta el estado de fondo sin tocar lo que hay en el campo.
        renderWeeklyGoal();
        focusElement(input);
    }

    function closeEditor() {
        const form = getElement('goalForm');

        isEditorOpen = false;
        if (form) {
            form.hidden = true;
        }
    }

    // Fijar: editor vacío.
    function handleSet() {
        openEditor(getElement('goalSetBtn'), '');
    }

    // Editar: editor con el objetivo actual sin separadores de miles (RF-2).
    function handleEdit() {
        if (typeof WeeklyGoalLogic === 'undefined' ||
            typeof getGoalRawValue !== 'function') {
            return;
        }

        const goal = WeeklyGoalLogic.parseGoalValue(getGoalRawValue());
        if (goal === null) {
            // No hay objetivo válido: se vuelve a pintar el estado real.
            renderWeeklyGoal();
            return;
        }

        openEditor(getElement('goalEditBtn'), String(goal));
    }

    // La tarjeta "Minutos semana" se repinta con su renderizador y la misma fecha de
    // referencia que el bloque, para que ambos números coincidan (RF-5, §11.3).
    function refreshGoalAndWeekMinutes() {
        if (typeof renderWeekMinutes === 'function') {
            renderWeekMinutes();
        }
        renderWeeklyGoal();
    }

    function handleSubmit(event) {
        event.preventDefault();

        // Doble envío: tras un guardado correcto el editor ya está cerrado y se ignora.
        if (!isEditorOpen) {
            return;
        }

        const input = getElement('goalMinutes');
        const goal = (typeof WeeklyGoalLogic !== 'undefined' && input)
            ? WeeklyGoalLogic.parseGoalValue(input.value)
            : null;

        // Validación al enviar, nunca mientras se escribe (RF-10).
        if (goal === null) {
            showValidationError();
            return;
        }

        clearValidationError();

        // Fallo de guardado simulado por el navegador: no se aplica el valor nuevo,
        // se mantiene el editor abierto y el objetivo anterior sigue vigente (CL-19).
        if (typeof saveGoalMinutes !== 'function' || saveGoalMinutes(goal) !== true) {
            showSaveError();
            return;
        }

        clearSaveError();
        closeEditor();
        refreshGoalAndWeekMinutes();
        returnFocusToOrigin();
    }

    function handleCancel() {
        if (!isEditorOpen) {
            return;
        }

        const input = getElement('goalMinutes');
        if (input) {
            input.value = '';
        }

        clearValidationError();
        clearSaveError();
        closeEditor();
        renderWeeklyGoal();
        returnFocusToOrigin();
    }

    function handleRemove() {
        // Quitar es inmediato y sin confirmación (RF-3). Si el borrado no se verifica,
        // no se miente: se mantiene el objetivo y se muestra el aviso de guardado.
        if (typeof clearGoalValue !== 'function' || clearGoalValue() !== true) {
            showSaveError();
            return;
        }

        clearSaveError();
        refreshGoalAndWeekMinutes();
        // "Quitar" ya no existe: el foco va a la sección para no perderse (§9).
        focusSection();
    }

    function initEvents() {
        const section = getElement('weeklyGoalSection');

        if (!section || eventsReady) {
            return;
        }
        eventsReady = true;

        const setButton = getElement('goalSetBtn');
        if (setButton) {
            setButton.addEventListener('click', handleSet);
        }

        const editButton = getElement('goalEditBtn');
        if (editButton) {
            editButton.addEventListener('click', handleEdit);
        }

        const removeButton = getElement('goalRemoveBtn');
        if (removeButton) {
            removeButton.addEventListener('click', handleRemove);
        }

        const form = getElement('goalForm');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        const cancelButton = getElement('goalCancelBtn');
        if (cancelButton) {
            cancelButton.addEventListener('click', handleCancel);
        }

        // Al escribir se borra el error de validación, como exige RF-10.
        const input = getElement('goalMinutes');
        if (input) {
            input.addEventListener('input', clearValidationError);
        }
    }

    // Texto accesible de la barra: incluye el progreso real, el objetivo y el porcentaje (RF-15).
    function formatBarValueText(data) {
        const progressText = WeeklyGoalLogic.formatMinutes(data.progress);
        const goalText = WeeklyGoalLogic.formatMinutes(data.goal);
        return `${progressText} de ${goalText} minutos, ${data.percent} por ciento`;
    }

    // Pinta el bloque completo con la fecha de referencia del último cálculo.
    function renderWeeklyGoal() {
        const section = getElement('weeklyGoalSection');
        if (!section) {
            return;
        }

        initEvents();

        // Sin la lógica o sin los accesos a los datos no hay nada que pintar.
        if (typeof WeeklyGoalLogic === 'undefined' ||
            typeof getSessions !== 'function' ||
            typeof getGoalRawValue !== 'function' ||
            typeof getTodayLocalDateString !== 'function') {
            return;
        }

        const data = WeeklyGoalLogic.buildWeeklyGoal(
            getSessions(),
            getGoalRawValue(),
            getTodayLocalDateString()
        );

        const empty = getElement('goalEmpty');
        const progress = getElement('goalProgress');
        const form = getElement('goalForm');
        const done = getElement('goalDone');
        const hasGoal = data.status === 'goal';

        // Estado de fondo: se actualiza siempre, también con el editor abierto, para
        // que al cerrar se vea el resultado del último cálculo.
        if (hasGoal) {
            const progressText = getElement('goalProgressText');
            const percent = getElement('goalPercent');
            const bar = getElement('goalBar');
            const barFill = getElement('goalBarFill');

            if (progressText) {
                progressText.textContent = WeeklyGoalLogic.formatProgressText(data.progress, data.goal);
            }

            if (percent) {
                percent.textContent = `${data.percent}${PERCENT_SEPARATOR}%`;
            }

            if (barFill) {
                barFill.style.width = `${data.percent}%`;
            }

            if (bar) {
                bar.setAttribute('aria-valuenow', String(data.percent));
                bar.setAttribute('aria-valuetext', formatBarValueText(data));
            }

            if (done) {
                // role="status": se anuncia al pasar de vacío al texto, sin robar el foco.
                // Solo se escribe si cambia para no repetir el anuncio en cada repintado.
                const doneText = data.isComplete ? DONE_TEXT : '';
                if (done.textContent !== doneText) {
                    done.textContent = doneText;
                }
            }
        } else if (done && done.textContent !== '') {
            done.textContent = '';
        }

        // Visibilidad: los dos estados se sustituyen entre sí y el editor, cuando está
        // abierto, es el único contenido visible. Nunca se cierra el editor aquí.
        if (empty) {
            empty.hidden = isEditorOpen || hasGoal;
        }
        if (progress) {
            progress.hidden = isEditorOpen || !hasGoal;
        }
        if (form) {
            form.hidden = !isEditorOpen;
        }
    }

    window.renderWeeklyGoal = renderWeeklyGoal;
})();

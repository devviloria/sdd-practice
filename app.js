// Diario de Estudio - Aplicación para registrar sesiones de estudio

const STORAGE_KEY = 'diarioEstudio_sessions';

function getTodayLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getSessions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function parseLocalDate(dateString) {
    // Crear fecha desde string YYYY-MM-DD usando fecha local
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDateForDisplay(dateString) {
    const date = parseLocalDate(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

function toLocalDateString(date) {
    // Formatear un Date local como YYYY-MM-DD (sin pasar por UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekStartDateString() {
    // La semana empieza el lunes. getDay(): 0 = domingo, 1 = lunes...
    const today = parseLocalDate(getTodayLocalDateString());
    const daysSinceMonday = (today.getDay() + 6) % 7;

    const monday = new Date(today);
    monday.setDate(monday.getDate() - daysSinceMonday);
    return toLocalDateString(monday);
}

function calculateWeekMinutes(sessions) {
    const weekStart = parseLocalDate(getWeekStartDateString());
    const today = parseLocalDate(getTodayLocalDateString());

    let totalMinutes = 0;

    sessions.forEach(session => {
        if (!session || typeof session.date !== 'string') {
            return;
        }

        const sessionDate = parseLocalDate(session.date);

        // Ignorar fechas inválidas, futuras o anteriores a esta semana
        if (isNaN(sessionDate) || sessionDate < weekStart || sessionDate > today) {
            return;
        }

        const minutes = Number(session.minutes) || 0;
        if (minutes > 0) {
            totalMinutes += minutes;
        }
    });

    return totalMinutes;
}

function calculateStreak(sessions) {
    if (sessions.length === 0) {
        return 0;
    }
    
    // Obtener fechas únicas con al menos una sesión (usar fecha local)
    const datesWithSessions = new Set();
    sessions.forEach(session => {
        datesWithSessions.add(session.date);
    });
    
    // Obtener todas las fechas únicas ordenadas descendente
    const sortedDates = Array.from(datesWithSessions).sort((a, b) => {
        const dateA = parseLocalDate(a);
        const dateB = parseLocalDate(b);
        return dateB - dateA;
    });
    
    if (sortedDates.length === 0) {
        return 0;
    }
    
    const today = getTodayLocalDateString();
    const todayDate = parseLocalDate(today);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
    
    // Verificar si hay sesión hoy o ayer
    // Si hoy no hay sesión pero ayer sí, la racha sigue viva
    // Si hoy hay sesión, empezamos desde hoy
    // Si hoy no hay sesión y ayer no hay, racha = 0
    
    if (sortedDates[0] === today) {
        // Hay sesión hoy, contar desde hoy hacia atrás
        let streak = 1;
        let currentDate = new Date(todayDate);
        currentDate.setDate(currentDate.getDate() - 1);
        
        for (let i = 1; i < sortedDates.length; i++) {
            const checkDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (sortedDates.includes(checkDateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    } else if (sortedDates[0] === yesterday) {
        // Hoy no hay sesión pero ayer sí, la racha sigue viva
        let streak = 1;
        let currentDate = new Date(yesterdayDate);
        currentDate.setDate(currentDate.getDate() - 1);
        
        for (let i = 1; i < sortedDates.length; i++) {
            const checkDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (sortedDates.includes(checkDateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    } else {
        // Ni hoy ni ayer hay sesión
        return 0;
    }
}

function calculateBestStreak(sessions) {
    if (sessions.length === 0) {
        return 0;
    }
    
    const today = getTodayLocalDateString();
    const todayDate = parseLocalDate(today);
    
    // Obtener fechas únicas con al menos una sesión (usar fecha local)
    const datesWithSessions = new Set();
    sessions.forEach(session => {
        // Ignorar fechas futuras
        const sessionDate = parseLocalDate(session.date);
        if (sessionDate > todayDate) {
            return;
        }
        datesWithSessions.add(session.date);
    });
    
    if (datesWithSessions.size === 0) {
        return 0;
    }
    
    // Ordenar cronológicamente ascendente
    const sortedDates = Array.from(datesWithSessions).sort((a, b) => {
        const dateA = parseLocalDate(a);
        const dateB = parseLocalDate(b);
        return dateA - dateB;
    });
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = parseLocalDate(sortedDates[i - 1]);
        const currDate = parseLocalDate(sortedDates[i]);
        
        // Calcular diferencia en días
        const diffTime = currDate - prevDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
            currentStreak++;
        } else {
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
            currentStreak = 1;
        }
    }
    
    if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
    }
    
    return maxStreak;
}

function renderStreak() {
    const sessions = getSessions();
    const streak = calculateStreak(sessions);
    const bestStreak = calculateBestStreak(sessions);
    
    const streakElement = document.getElementById('streakCount');
    if (streakElement) {
        streakElement.textContent = streak;
    }
    
    const bestStreakElement = document.getElementById('bestStreakCount');
    if (bestStreakElement) {
        bestStreakElement.textContent = bestStreak;
    }
}

function renderWeekMinutes() {
    const sessions = getSessions();
    const totalMinutes = calculateWeekMinutes(sessions);

    const weekMinutesElement = document.getElementById('weekMinutes');
    if (weekMinutesElement) {
        weekMinutesElement.textContent = totalMinutes;
    }
}

function renderSessions() {
    const sessions = getSessions();
    const sessionsListElement = document.getElementById('sessionsList');
    
    if (!sessionsListElement) {
        return;
    }
    
    if (sessions.length === 0) {
        sessionsListElement.innerHTML = '<div class="no-sessions">Aún no hay sesiones registradas</div>';
        return;
    }
    
    // Ordenar de la más reciente a la más antigua
    const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = parseLocalDate(a.date);
        const dateB = parseLocalDate(b.date);
        if (dateB - dateA !== 0) {
            return dateB - dateA;
        }
        // Si es la misma fecha, mantener orden por timestamp si existe
        return (b.timestamp || 0) - (a.timestamp || 0);
    });
    
    sessionsListElement.innerHTML = '';
    
    sortedSessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        
        const topicDiv = document.createElement('div');
        topicDiv.className = 'session-topic';
        topicDiv.textContent = session.topic;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'session-details';
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'session-date';
        dateSpan.textContent = formatDateForDisplay(session.date);
        
        const minutesSpan = document.createElement('span');
        minutesSpan.className = 'session-minutes';
        minutesSpan.textContent = `${session.minutes} min`;
        
        detailsDiv.appendChild(dateSpan);
        detailsDiv.appendChild(minutesSpan);
        
        sessionItem.appendChild(topicDiv);
        sessionItem.appendChild(detailsDiv);
        
        sessionsListElement.appendChild(sessionItem);
    });
}

function initForm() {
    const form = document.getElementById('sessionForm');
    const dateInput = document.getElementById('sessionDate');
    
    if (dateInput) {
        // Establecer fecha por defecto a hoy
        dateInput.value = getTodayLocalDateString();
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const dateInputEl = document.getElementById('sessionDate');
            const topicInput = document.getElementById('sessionTopic');
            const minutesInput = document.getElementById('sessionMinutes');
            
            const date = dateInputEl.value;
            const topic = topicInput.value.trim();
            const minutes = parseInt(minutesInput.value);
            
            // Validaciones
            if (!date) {
                alert('Por favor, selecciona una fecha');
                return;
            }
            
            if (!topic) {
                alert('Por favor, introduce un tema');
                topicInput.focus();
                return;
            }
            
            if (isNaN(minutes) || minutes <= 0) {
                alert('Los minutos deben ser un número mayor que 0');
                minutesInput.focus();
                return;
            }
            
            const sessions = getSessions();
            const newSession = {
                id: Date.now(),
                date: date,
                topic: topic,
                minutes: minutes,
                timestamp: Date.now()
            };
            
            sessions.push(newSession);
            saveSessions(sessions);
            
            // Limpiar formulario, mantener fecha por defecto
            topicInput.value = '';
            minutesInput.value = '';
            if (dateInputEl) {
                dateInputEl.value = getTodayLocalDateString();
            }
            topicInput.focus();
            
            // Actualizar vista
            renderStreak();
            renderWeekMinutes();
            renderSessions();
            if (typeof renderHeatmap === 'function') {
                renderHeatmap();
            }
        });
    }
}

function init() {
    initForm();
    renderStreak();
    renderWeekMinutes();
    renderSessions();
    if (typeof renderHeatmap === 'function') {
        renderHeatmap();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

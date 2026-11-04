// Renderiza el ranking semanal calculado por WeeklyTopicsLogic.
(function (global) {
    'use strict';

    function renderWeeklyTopics() {
        const emptyMessage = document.getElementById('weeklyTopicsEmpty');
        const topicsList = document.getElementById('weeklyTopicsList');
        if (!emptyMessage || !topicsList) {
            return;
        }

        const result = global.WeeklyTopicsLogic.buildWeeklyTopics(
            global.getSessions(),
            global.getTodayLocalDateString()
        );

        topicsList.replaceChildren();
        if (result.status === 'empty') {
            topicsList.hidden = true;
            emptyMessage.hidden = false;
            return;
        }

        const fragment = document.createDocumentFragment();
        result.items.forEach(item => {
            const row = document.createElement('li');
            const topicName = document.createElement('span');
            const minutes = document.createElement('span');
            const medal = document.createElement('span');

            topicName.className = 'weekly-topic-name';
            topicName.textContent = item.topic;
            minutes.className = 'weekly-topic-minutes';
            minutes.textContent = String(item.minutes) + ' min';
            medal.className = 'weekly-topic-medal';
            medal.textContent = item.medal;

            row.append(topicName, minutes, medal);
            fragment.append(row);
        });

        topicsList.replaceChildren(fragment);
        emptyMessage.hidden = true;
        topicsList.hidden = false;
    }

    global.WeeklyTopicsUI = { renderWeeklyTopics };
})(globalThis);
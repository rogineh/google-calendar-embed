// Configuration
const CONFIG = {
    apiKey: 'AIzaSyCzn7qHU1jhLErImblzuB4Ufub8FJBljCM', // User will replace this
    calendarId: '5c0d965e5bb8cfbf96647f5a08b4cea6c48be19d40dd005496ae8865ba8a04cc@group.calendar.google.com',    // User will replace this
    startDate: '2026-02-18',
    endDate: '2026-04-04',
    pollInterval: 5 * 60 * 1000 // 5 minutes
};

const calendarGrid = document.getElementById('calendar-grid');
const lastUpdatedText = document.getElementById('update-timer');

// Mock Data for Initial UI check
const MOCK_EVENTS = [
    { start: '2026-02-18', summary: 'Kickoff Meeting' },
    { start: '2026-02-25', summary: 'Design Review' },
    { start: '2026-03-05', summary: 'Development Phase' },
    { start: '2026-03-20', summary: 'QA Testing' },
    { start: '2026-04-01', summary: 'Final Release' }
];

function generateCalendar() {
    const start = new Date(CONFIG.startDate);
    const end = new Date(CONFIG.endDate);

    // Adjust start to the preceding Sunday to fill the first row of a 7-day grid
    const startDate = new Date(start);
    startDate.setDate(start.getDate() - start.getDay());

    calendarGrid.innerHTML = '';

    // Create a 7x7 grid (49 days)
    for (let i = 0; i < 49; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateStr = currentDate.toISOString().split('T')[0];

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        if (dateStr === new Date().toISOString().split('T')[0]) {
            cell.classList.add('today');
        }

        cell.innerHTML = `
                    <div class="day-header">
                        <span class="day-name">${currentDate.toLocaleString('default', { weekday: 'short' })}</span>
                        <span class="day-number">${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div class="events-list" id="events-${dateStr}"></div>
                `;

        calendarGrid.appendChild(cell);
    }
}

async function fetchEvents() {
    // If API Key is default, use mock data
    if (CONFIG.apiKey === 'YOUR_API_KEY') {
        console.warn('Using mock data. Please set your Google Calendar API Key.');
        renderEvents(MOCK_EVENTS);
        return;
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${CONFIG.calendarId}/events?key=${CONFIG.apiKey}&timeMin=${new Date(CONFIG.startDate).toISOString()}&timeMax=${new Date(CONFIG.endDate).toISOString()}&singleEvents=true&orderBy=startTime`
        );
        const data = await response.json();

        const events = data.items.map(item => {
            const startDateTime = item.start.dateTime || item.start.date;
            let startTime = '';

            if (item.start.dateTime) {
                const date = new Date(item.start.dateTime);
                startTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            }

            return {
                start: startDateTime.split('T')[0],
                time: startTime,
                summary: item.summary,
                description: item.description || 'No description provided.'
            };
        });

        renderEvents(events);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

function renderEvents(events) {
    // Clear previous events from lists
    const lists = document.querySelectorAll('.events-list');
    lists.forEach(l => l.innerHTML = '');

    events.forEach(event => {
        const listContainer = document.getElementById(`events-${event.start}`);
        if (listContainer) {
            const eventEl = document.createElement('div');
            eventEl.className = 'event-item';
            eventEl.style.cursor = 'pointer';
            eventEl.innerHTML = `
                ${event.time ? `<span class="event-time">${event.time}</span>` : ''}
                <span class="event-summary">${event.summary}</span>
            `;
            eventEl.onclick = () => showModal(event.summary, event.time, event.description);
            listContainer.appendChild(eventEl);
        }
    });

    const now = new Date();
    lastUpdatedText.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

const modal = document.getElementById('event-modal');
const modalTitle = document.getElementById('modal-title');
const modalTime = document.getElementById('modal-time');
const modalDesc = document.getElementById('modal-desc');

function showModal(title, time, desc) {
    modalTitle.textContent = title;
    modalTime.textContent = time ? `Time: ${time}` : 'All Day';
    modalDesc.textContent = desc;
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

// Close modal on outside click
window.onclick = (event) => {
    if (event.target == modal) {
        closeModal();
    }
};

// Initialization
generateCalendar();
fetchEvents();

// Polling
setInterval(fetchEvents, CONFIG.pollInterval);

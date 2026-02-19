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

let eventsByDate = {}; // Store events grouped by date

// Mock Data for Initial UI check
const MOCK_EVENTS = [
    { start: '2026-02-18', summary: 'Kickoff Meeting', description: 'Initial kickoff for the Lenten relay prayer.' },
    { start: '2026-02-19', summary: 'Morning Prayer', time: '06:00', description: 'Daily morning prayer session.' },
    { start: '2026-02-19', summary: 'Team Sync', time: '09:00', description: 'Weekly status update.' },
    { start: '2026-02-19', summary: 'Evening Service', time: '19:00', description: 'Grace service.' },
    { start: '2026-02-19', summary: 'Late Night Prayer', time: '22:00', description: 'Individual prayer.' },
    { start: '2026-02-25', summary: 'Design Review', description: 'Reviewing calendar interface.' },
    { start: '2026-03-05', summary: 'Development Phase', description: 'Coding the new features.' },
    { start: '2026-03-20', summary: 'QA Testing', description: 'Testing responsiveness.' },
    { start: '2026-04-01', summary: 'Final Release', description: 'Go live!' }
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

        // Add click handler to the entire cell
        cell.onclick = (e) => {
            // Only trigger if we didn't click an individual event directly
            if (!e.target.closest('.event-item')) {
                showDayModal(dateStr);
            }
        };

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
    // Clear previous events from map
    eventsByDate = {};

    // Clear previous events from UI
    const lists = document.querySelectorAll('.events-list');
    lists.forEach(l => l.innerHTML = '');

    // Group events and render them
    events.forEach(event => {
        if (!eventsByDate[event.start]) {
            eventsByDate[event.start] = [];
        }
        eventsByDate[event.start].push(event);
    });

    Object.keys(eventsByDate).forEach(date => {
        const listContainer = document.getElementById(`events-${date}`);
        if (listContainer) {
            const dayEvents = eventsByDate[date];

            // Determine limit based on screen width (matching CSS breakpoints)
            const isMobile = window.innerWidth <= 640;
            const isTablet = window.innerWidth <= 1024 && window.innerWidth > 640;
            const limit = isMobile ? 2 : (isTablet ? 3 : 4);

            dayEvents.slice(0, limit).forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = 'event-item';
                eventEl.style.cursor = 'pointer';
                eventEl.innerHTML = `
                    ${event.time ? `<span class="event-time">${event.time}</span>` : ''}
                    <span class="event-summary">${event.summary}</span>
                `;
                eventEl.onclick = (e) => {
                    e.stopPropagation();
                    showModal(event.summary, event.time, event.description);
                };
                listContainer.appendChild(eventEl);
            });

            if (dayEvents.length > limit) {
                const moreEl = document.createElement('div');
                moreEl.className = 'more-indicator';
                moreEl.textContent = `+${dayEvents.length - limit} more`;
                // Add indicator that it's clickable
                moreEl.style.cursor = 'pointer';
                listContainer.appendChild(moreEl);
            }
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
    modalDesc.innerHTML = `<div class="modal-description-content">${desc}</div>`;
    modal.classList.add('active');
}

function showDayModal(dateStr) {
    const dayEvents = eventsByDate[dateStr] || [];
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    modalTitle.textContent = `Events for ${formattedDate}`;
    modalTime.textContent = dayEvents.length > 0 ? `${dayEvents.length} event(s)` : 'No events scheduled';

    if (dayEvents.length > 0) {
        let eventsHtml = '<div class="day-events-modal-list">';
        dayEvents.forEach(event => {
            eventsHtml += `
                <div class="day-event-modal-item" onclick="showModal('${event.summary.replace(/'/g, "\\'")}', '${event.time}', '${event.description.replace(/'/g, "\\'").replace(/\n/g, "<br>")}')">
                    <div class="day-event-modal-header">
                        ${event.time ? `<span class="event-time">${event.time}</span>` : '<span class="event-time">All Day</span>'}
                        <span class="event-summary">${event.summary}</span>
                    </div>
                </div>
            `;
        });
        eventsHtml += '</div>';
        modalDesc.innerHTML = eventsHtml;
    } else {
        modalDesc.innerHTML = '<p>No events found for this day.</p>';
    }

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

// Handle window resize to re-render events with correct limits
let resizeTimer;
window.onresize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Re-rendering events based on new screen size
        const allEvents = Object.values(eventsByDate).flat();
        renderEvents(allEvents);
    }, 250);
};

// Initialization
generateCalendar();
fetchEvents();

// Polling
setInterval(fetchEvents, CONFIG.pollInterval);

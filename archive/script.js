// script.js - Organized and Updated - Part 1/3

// --- Application State ---
const state = {
    settings: {
        fontSize: 'base',       // 'sm', 'base', 'lg', 'xl'
        theme: 'green',         // 'green', 'blue', 'purple', 'red'
        contrast: 'default',    // 'default', 'dark-mode', 'high-contrast'
        timeFormat: '12hr',     // '12hr', '24hr'
        dateFormat: 'DDMMYYYY', // 'DDMMYYYY', 'MMDDYYYY'
        firstVisit: true,
    },
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    pickerMonth: new Date().getMonth(),
    pickerYear: new Date().getFullYear(),
    selectedDay: null,
    isDayView: false,
    currentSection: 'today',
    sidebarExpanded: false,
    selectedHour: 12, // For time picker state
    selectedMinute: 0, // For time picker state
    selectedAmPm: 'PM', // For time picker state ('AM'/'PM' or '')
    alertedTasks: [], // Holds tasks currently shown in the due alert modal
    taskToDelete: null, // Task ID pending confirmation for soft delete
    taskToRestore: null, // Task ID pending confirmation for restore
    taskToDeletePermanently: null, // Task ID pending confirmation for permanent delete
    taskToComplete: null, // Task ID pending confirmation for recurring completion
    completeSeries: false, // Flag for completing recurring series
    taskToSnooze: null, // Task ID pending snooze action (if needed for modal)
    userName: '',
    customRepeatDays: [], // Array of numbers [0-6] for custom weekly repeats
    taskCache: {}, // Simple cache for calendar month tasks {'YYYY-MM': [tasks]}
    upcomingFilter: 'next7', // 'next7', 'next30', 'next365', 'all'
    upcomingExpanded: false, // Whether upcoming list shows more than 3 items
    todaySortOrder: 'time', // 'time' or 'priority'
    completedFilter: 'all', // 'last7', 'last30', 'last365', 'all'
    clockIntervalId: null, // Interval ID for the sidebar clock timer
    mainDateIntervalId: null, // Interval ID for the main date display timer
    walkthroughStep: 0,
    walkthroughSteps: [ // Define steps for the tutorial
        // TODO: Update targetElement selectors and content for accuracy
        { title: "Welcome & Setup", content: "Welcome to ManageMe! Let's quickly configure some display settings.", section: 'settings', targetElement: '#settingsModal .modal-content', isSetupStep: true },
        { title: "Display Options", content: "Choose your preferred font size, color theme, display mode (Light/Dark/High Contrast), and time/date formats.", section: 'settings', targetElement: '#settingsAppearanceOptions', isSetupStep: true },
        { title: "Tutorial Start", content: "Great! Settings saved. This short tutorial guides you through the main features. Click Next.", section: 'today', targetElement: null },
        { title: "Today's Tasks", content: "This is your main screen. It shows tasks due today, sorted by time or priority. Your next upcoming task is also summarized.", section: 'today', targetElement: '#todaySection' },
        { title: "Upcoming Tasks Filters", content: "Use these buttons to filter the upcoming tasks list (Next 7/30/365 days or All). Click the expand button to see more.", section: 'today', targetElement: '#upcomingTaskFilters' },
        { title: "Add Task", content: "Add new tasks here. Fill in the details, including description, date, time, priority, and repetition.", section: 'addTask', targetElement: '#addTaskSection .form-container' }, // Changed section to 'addTask'
        { title: "Repeat Options", content: "Set tasks to repeat daily, weekly, etc. You can also set custom days or an end date for repetitions.", section: 'addTask', targetElement: '#repeatContainer' },
        { title: "Calendar View", content: "View tasks on a monthly calendar. Days with tasks have colored dots representing priorities. Use arrows to change months or years. Click a day to view its specific tasks.", section: 'calendar', targetElement: '#calendarSection .calendar-grid' },
        { title: "Day View", content: "When viewing a specific day, use the arrows to navigate between days. Click the calendar icon or 'Return to Today' to go back to the current month.", section: 'calendar', targetElement: '#dayViewNav' },
        { title: "Task Actions", content: "Use <i class='fas fa-check text-green-500'></i> to complete a task, <i class='fas fa-clock text-yellow-500'></i> to snooze, or <i class='fas fa-trash-alt text-red-500'></i> to delete it.", section: 'today', targetElement: '#taskList' },
        { title: "Task Due Alert", content: "When a task is due, an alert will pop up. You can mark individual tasks complete, snooze them, or complete all.", section: null, targetElement: '#taskDueAlert .modal-content' },
        { title: "Completed Tasks", content: "Review tasks you've marked as complete. You can filter by time period or delete old ones using the trash icon.", section: 'completed', targetElement: '#completedSection' },
        { title: "Deleted Tasks", content: "Restore <i class='fas fa-trash-restore text-green-500'></i> tasks or permanently delete <i class='fas fa-times text-red-500'></i> them here. Use 'Restore All' or 'Delete All' for bulk actions.", section: 'deleted', targetElement: '#deletedSection' },
        { title: "Navigation", content: "Use the sidebar on the right (tap the <i class='fas fa-bars'></i> icon on mobile) to switch sections. On larger screens, tap the logo to expand/collapse it.", section: null, targetElement: '#sidebar' },
        { title: "Settings", content: "Revisit settings anytime to customize appearance or view help.", section: 'settings', targetElement: '#settingsModal .modal-content' },
        { title: "All Set!", content: "You're ready! Access help anytime from the sidebar.", section: null, targetElement: null }
    ]
};

// --- DOM Element References ---
const elements = {}; // Object to hold references to DOM elements

// Utility function to safely get elements by ID
function getElement(id) {
    const el = document.getElementById(id);
    // Optional: Warn if an element specified in elementIds is not found in HTML
    // if (!el) { console.warn(`Element with ID "${id}" not found.`); }
    return el;
}

// --- Initialization Functions ---

/**
 * Main initialization function called when the DOM is ready.
 */
function initApp() {
    console.log("Initializing App...");

    // Populate the 'elements' object with references to DOM nodes
    const elementIds = [
        // Main Layout & Sidebar
        'welcomeScreen', 'userNameInput', 'saveUserNameBtn', 'sidebar', 'sidebarTitleHeader',
        'mobileMenuButton', 'sidebarClock', 'sidebarDate', 'mainContentArea',
        // Navigation Buttons
        'todayNav', 'addTaskNav', 'calendarNav', 'completedNav', 'deletedNav', 'settingsNav', 'helpNav',
        // Sections
        'todaySection', 'addTaskSection', 'calendarSection', 'completedSection', 'deletedSection',
        // Today Section Elements
        'greetingText', 'mainDateDisplay', // Added mainDateDisplay
        'upcomingTaskContainer', 'upcomingTaskContent', 'upcomingTaskFilters', 'upcomingExpandBtn',
        'todaySortControl', 'taskCount', 'taskList',
        // Add Task Section Elements
        'taskInput', 'dueDate', 'dueTime', 'openDatePickerBtn', 'openTimePickerBtn',
        'taskPriority', 'repeatFrequency', 'customRepeatOptions', 'repeatContainer',
        'repeatUntilContainer', 'repeatUntilDate', 'repeatUntilSelect', 'addTaskBtn',
        // Calendar Section Elements
        'calendar', 'calendarMonthYear', 'calendarYearNav', 'prevYearBtn', 'nextYearBtn',
        'calendarYearDisplay', 'calendarTitle', 'calendarBackBtn', 'calendarNavContainer', 'prevMonthBtn',
        'nextMonthBtn', 'returnToTodayBtn',
        // Day View Elements
        'dayView', 'dayViewTitle', 'dayViewTaskList', 'addTaskForDayBtn', 'dayViewNav',
        'prevDayBtn', 'nextDayBtn', 'dayViewDateDisplay', 'freeUpScheduleBtn',
        // Completed/Deleted Lists & Controls
        'completedList', 'completedFilters', 'deleteAllCompletedBtn',
        'deletedList', 'restoreAllBtn', 'deleteAllPermanentlyBtn',
        // Modals Base
        'modalsContainer',
        // Date Picker Modal
        'datePickerModal', 'pickerCalendar', 'pickerMonthYear', 'prevPickerMonthBtn', 'nextPickerMonthBtn', 'cancelDatePickerBtn',
        // Time Picker Modal
        'timePickerModal', 'timeDisplay', 'amPmDisplay', 'increaseHourBtn', 'decreaseHourBtn',
        'increaseMinuteBtn', 'decreaseMinuteBtn', 'toggleAmPmBtn', 'saveTimeBtn', 'cancelTimePickerBtn',
        // Task Due Alert Modal
        'taskDueAlert', 'dueTitle', 'dueAlertTaskList', 'completeAllDueBtn', 'closeAlertBtn',
        // Confirmation Modals (Standard)
        'deleteConfirmModal', 'deleteTaskText', 'confirmDeleteBtn', 'cancelDeleteBtn',
        'restoreConfirmModal', 'restoreTaskText', 'confirmRestoreBtn', 'cancelRestoreBtn',
        'permanentDeleteModal', 'permanentDeleteTaskText', 'confirmPermanentDeleteBtn', 'cancelPermanentDeleteBtn',
        // Confirmation Modals (Recurring)
        'completeRecurringConfirmModal', 'completeRecurringText', 'confirmCompleteSingleBtn', 'confirmCompleteSeriesBtn', 'cancelCompleteRecurringBtn',
        // Confirmation Modals (Bulk)
        'deleteAllCompletedConfirmModal', 'confirmDeleteAllCompletedBtn', 'cancelDeleteAllCompletedBtn',
        'deleteAllPermanentlyConfirmModal', 'confirmDeleteAllPermanentlyBtn', 'cancelDeleteAllPermanentlyBtn',
        'restoreAllConfirmModal', 'confirmRestoreAllBtn', 'cancelRestoreAllBtn',
        // Settings Modal
        'settingsModal', 'settingsAppearanceOptions', 'settingFontSize', 'settingContrast', 'colorThemeSelector',
        'settingTimeFormat', 'settingDateFormat', 'saveSettingsBtn', 'settingsDoneButton', 'settingsBackBtn', // Added settingsBackBtn
        // Walkthrough Elements
        'walkthroughOverlay', 'walkthroughTooltip', 'walkthroughTitle', 'walkthroughContent',
        'walkthroughPrevBtn', 'walkthroughNextBtn', 'closeWalkthroughBtn',
        // Custom Alert Modal
        'customAlertModal', 'customAlertTitle', 'customAlertMessage', 'customAlertCloseBtn',
        // STT Elements
        'sttBtnDescription', 'sttStatusDescription',
        'sttBtnDateTime', 'sttStatusDateTime',
        'sttBtnFrequency', 'sttStatusFrequency',
        // Free Up Schedule Modal
        'freeUpScheduleModal', 'freeUpTaskList', 'freeUpDate',
    ];
    elementIds.forEach(id => {
        if (id) { // Ensure ID is valid before attempting to get element
            elements[id] = getElement(id);
        }
    });

    // Start clock intervals
    if (state.clockIntervalId) clearInterval(state.clockIntervalId);
    if (state.mainDateIntervalId) clearInterval(state.mainDateIntervalId); // Clear main date too
    updateClock(); // Initial call for sidebar clock
    updateMainDateDisplay(); // Initial call for main date display
    state.clockIntervalId = setInterval(updateClock, 1000); // Update clock every second
    // Update main date less frequently (e.g., every minute or longer)
    state.mainDateIntervalId = setInterval(updateMainDateDisplay, 60000);


    try {
        loadSettings(); // Load user preferences first
        state.userName = localStorage.getItem('userName') || ''; // Load username

        // Setup essential listeners needed for welcome/setup flow
        elements.saveUserNameBtn?.addEventListener('click', saveUserNameAndSetup);
        elements.settingsDoneButton?.addEventListener('click', finishFirstTimeSetup);

        if (!state.userName || state.settings.firstVisit) {
            // If no username or first visit, show welcome/setup flow
            showWelcomeOrSetup();
        } else {
            // Regular startup sequence
            applySettings(); // Apply loaded settings to the UI
            elements.welcomeScreen?.classList.add('hidden'); // Hide welcome screen
            if (elements.welcomeScreen) {
                elements.welcomeScreen.style.display = 'none';
            }
            updateGreeting(); // Display personalized greeting
            setupEventListeners(); // Attach all event listeners
            initDateInputs(); // Set default date/time in add task form
            showSection('today'); // Show the initial 'Today' section
            setInterval(checkDueTasks, 60000); // Start checking for due tasks periodically
            checkDueTasks(); // Initial check for due tasks immediately
            console.log("App Initialized Successfully (Regular Start)");

            // Initialize STT *after* main setup and element population
            if (typeof initSTT === 'function') {
                console.log(">>> initApp: Initializing STT...");
                initSTT();
            } else {
                console.warn("initSTT function not found (stt.js might not be loaded correctly?)");
            }
        }
    } catch (error) {
        // Catch any critical errors during initialization
        console.error("Error during app initialization:", error);
        // Display a user-friendly error message
        document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: red;"><h1>Application Error</h1><p>Sorry, the application could not start correctly. Please try refreshing the page.</p><p>Error details: ${escapeHtml(error.message)}</p></div>`;
    }
}

// --- Utility Functions ---

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param {string} unsafe - The potentially unsafe string.
 * @returns {string} - The escaped string.
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}

/**
 * Formats a Date object into a string based on user settings (DD/MM/YYYY or MM/DD/YYYY).
 * @param {Date} date - The date object to format.
 * @param {string} [format=state.settings.dateFormat] - The desired format ('DDMMYYYY' or 'MMDDYYYY').
 * @returns {string} - The formatted date string.
 */
function formatDate(date, format = state.settings.dateFormat) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("formatDate called with invalid date:", date);
        return ''; // Return empty string for invalid dates
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();

    if (format === 'MMDDYYYY') {
        return `${month}/${day}/${year}`;
    } else { // Default to DDMMYYYY
        return `${day}/${month}/${year}`;
    }
}

/**
 * Formats time components into a string based on user settings (12hr or 24hr).
 * @param {number} hour - The hour (0-23 for 24hr, 1-12 for 12hr).
 * @param {number} minute - The minute (0-59).
 * @param {string} ampm - 'AM' or 'PM' (used only for 12hr format).
 * @param {string} [format=state.settings.timeFormat] - The desired format ('12hr' or '24hr').
 * @returns {string} - The formatted time string.
 */
function formatTime(hour, minute, ampm, format = state.settings.timeFormat) {
    const minStr = minute.toString().padStart(2, '0');

    if (format === '24hr') {
        // Convert 12hr input to 24hr if necessary for internal consistency before formatting
        let hour24 = hour;
        // Handle potential 12hr values passed in
        if (ampm === 'PM' && hour >= 1 && hour < 12) hour24 += 12;
        if (ampm === 'AM' && hour === 12) hour24 = 0; // Midnight case

        const hourStr = hour24.toString().padStart(2, '0');
        return `${hourStr}:${minStr}`;
    } else { // 12hr format
        // Convert 24hr input to 12hr if necessary
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12; // 0 and 12 should display as 12
        const inferredAmpm = hour < 12 || hour === 24 ? 'AM' : 'PM'; // Infer AM/PM if not provided based on 0-23 input
        const hourStr = displayHour.toString();
        // Use provided ampm if available, otherwise inferred
        return `${hourStr}:${minStr} ${ampm || inferredAmpm}`;
    }
}


/**
 * Parses date and time strings from the UI input fields into a Date object.
 * Uses the user's dateFormat setting to interpret the date string.
 * Includes detailed logging for debugging.
 * @param {string} dateStr - The date string (e.g., "03/05/2025" or "05/03/2025").
 * @param {string} timeStr - The time string (e.g., "4:05 AM" or "15:30").
 * @returns {Date|null} - The parsed Date object or null if parsing fails.
 */
function parseUIDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
        console.warn("parseUIDateTime called with empty strings.");
        return null;
    }
    // DEBUG: Log inputs clearly
    console.log(`DEBUG: Attempting to parse UI Date/Time: Date='${dateStr}', Time='${timeStr}', Settings='${state.settings.dateFormat}/${state.settings.timeFormat}'`);

    try {
        let year, month, day, hour, minute;

        // --- Parse Time String ---
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*?(AM|PM)?/i);
        if (!timeMatch) throw new Error(`Invalid time format: "${timeStr}"`);
        hour = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2]);
        // Normalize AM/PM, handle potential null if 24hr format used in 12hr mode input
        const period = timeMatch[3]?.toUpperCase() || '';
         console.log(`DEBUG: Parsed Time Parts: H=${hour}, M=${minute}, P='${period}'`); // DEBUG

        // Basic validation of parsed time parts
        if (isNaN(hour) || isNaN(minute) || minute < 0 || minute > 59) {
             throw new Error(`Invalid minute value: ${minute}`);
        }
        // Hour validation depends on format
        if (state.settings.timeFormat === '12hr') {
            if (hour < 1 || hour > 12) throw new Error(`Invalid 12hr hour value: ${hour}`);
            // Allow missing period if time is unambiguous (e.g. user typed 14:30 in 12hr mode - less likely)
            // if (!period) throw new Error(`Missing AM/PM for 12hr time: "${timeStr}"`);
        } else { // 24hr
            if (hour < 0 || hour > 23) throw new Error(`Invalid 24hr hour value: ${hour}`);
            if (period) console.warn(`AM/PM ('${period}') ignored for 24hr format input: "${timeStr}"`);
        }

        // --- Parse Date String ---
        const dateParts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/); // Allow / or -
        if (!dateParts) throw new Error(`Invalid date format: "${dateStr}"`);
        if (state.settings.dateFormat === 'DDMMYYYY') {
            day = parseInt(dateParts[1]);
            month = parseInt(dateParts[2]) - 1; // JS months 0-11
            year = parseInt(dateParts[3]);
            console.log(`DEBUG: Parsed Date (DDMMYYYY): D=${day}, M=${month}, Y=${year}`); // DEBUG
        } else { // MMDDYYYY
            month = parseInt(dateParts[1]) - 1; // JS months 0-11
            day = parseInt(dateParts[2]);
            year = parseInt(dateParts[3]);
            console.log(`DEBUG: Parsed Date (MMDDYYYY): D=${day}, M=${month}, Y=${year}`); // DEBUG
        }

        // Basic validation of parsed date parts
         if (isNaN(year) || isNaN(month) || isNaN(day) || year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
             throw new Error(`Invalid year/month/day values: Y=${year}, M=${month}, D=${day}`);
         }

        // --- Convert hour to 24hr format (0-23) for Date object ---
        let hour24 = hour;
        // If 12hr format was input, convert to 24hr
        if (state.settings.timeFormat === '12hr' || period) { // Check period in case user typed 24hr time in 12hr mode
            if (period === 'PM' && hour !== 12) hour24 += 12;
            if (period === 'AM' && hour === 12) hour24 = 0; // Handle 12 AM (midnight)
        }
         console.log(`DEBUG: Converted Hour (0-23): ${hour24}`); // DEBUG

        // --- Create Date object ---
        const dt = new Date(year, month, day, hour24, minute);

        // --- Final Validation ---
        // Check if the created date is valid and matches the components
        if (isNaN(dt.getTime()) || dt.getFullYear() !== year || dt.getMonth() !== month || dt.getDate() !== day || dt.getHours() !== hour24 || dt.getMinutes() !== minute) {
             console.error(`DEBUG: Date object validation failed! Input: Y=${year},M=${month},D=${day},H=${hour24},Min=${minute}. Result: ${dt.toISOString()}`);
             throw new Error("Resulting Date object is invalid or components mismatch after creation.");
        }

        console.log(`DEBUG: Successfully parsed Date object: ${dt.toISOString()}`);
        return dt;

    } catch (error) {
        console.error("Error parsing UI date/time:", error);
        // Show user-friendly alert with expected format hint
        const expectedDateFormat = state.settings.dateFormat.replace('YYYY','YY').replace('MM','M').replace('DD','D');
        const expectedTimeFormat = state.settings.timeFormat === '12hr' ? 'H:MM AM/PM' : 'HH:MM';
        showCustomAlert('Error', `Invalid date or time format entered: "${dateStr} ${timeStr}". Please use format ${expectedDateFormat} and ${expectedTimeFormat}.`, 'error');
        return null;
    }
}

/**
 * Generates a key for caching tasks based on year and month.
 * @param {number} year
 * @param {number} month - The month (0-11).
 * @returns {string} - The cache key string "YYYY-MM".
 */
function getCacheKey(year, month) {
    // Ensure month is 2 digits (e.g., '01', '11')
    return `${year}-${(month + 1).toString().padStart(2, '0')}`;
}

// --- API Communication Helper ---
/**
 * Sends requests to the backend API (or mock handlers).
 * Handles JSON conversion and basic error logging.
 * @param {string} endpoint - The API endpoint path (e.g., '/api/tasks').
 * @param {string} [method='GET'] - The HTTP method.
 * @param {object|null} [body=null] - The request body for POST/PUT requests.
 * @returns {Promise<any>} - A promise that resolves with the JSON response or rejects on error.
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    console.log(`API Request: ${method} ${endpoint}`, body ? JSON.stringify(body) : ''); // Log request

    // --- MOCK IMPLEMENTATION (Simulates backend using localStorage) ---
    return new Promise(async (resolve, reject) => {
        await new Promise(res => setTimeout(res, 50)); // Simulate network delay

        // Load current mock data from localStorage
        let mockTasks, mockDeleted, mockCompleted;
        try { mockTasks = JSON.parse(localStorage.getItem('mockTasks') || '[]'); } catch (e) { mockTasks = []; console.error("Error parsing mockTasks", e); }
        try { mockDeleted = JSON.parse(localStorage.getItem('mockDeletedTasks') || '[]'); } catch (e) { mockDeleted = []; console.error("Error parsing mockDeletedTasks", e); }
        try { mockCompleted = JSON.parse(localStorage.getItem('mockCompletedTasks') || '[]'); } catch (e) { mockCompleted = []; console.error("Error parsing mockCompletedTasks", e); }
        let nextMockId = parseInt(localStorage.getItem('nextMockId') || '1');

        try {
            // --- GET /api/tasks?date=YYYY-MM-DD&sort=... ---
            if (endpoint.startsWith('/api/tasks') && !endpoint.includes('month') && !endpoint.includes('all') && !endpoint.includes('snooze') && !endpoint.includes('complete') && method === 'GET') {
                const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
                const dateParam = urlParams.get('date');
                const sortParam = urlParams.get('sort') || state.todaySortOrder;

                if (!dateParam) return reject(new Error("Missing date parameter for GET /api/tasks"));

                let targetDate;
                try {
                    const dateParts = dateParam.match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (!dateParts) throw new Error("Invalid date format");
                    targetDate = new Date(parseInt(dateParts[1]), parseInt(dateParts[2]) - 1, parseInt(dateParts[3]));
                    targetDate.setHours(0, 0, 0, 0); // Normalize to start of day
                } catch (e) {
                    return reject(new Error(`Invalid date parameter format: ${dateParam}`));
                }

                const tasksForDate = mockTasks.filter(t => {
                    if (!t.dueDate) return false;
                    try {
                        const taskDate = new Date(t.dueDate);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate.getTime() === targetDate.getTime();
                    } catch { return false; } // Ignore tasks with invalid dates
                });

                tasksForDate.sort((a, b) => {
                    const timeA = new Date(a.dueDate).getTime();
                    const timeB = new Date(b.dueDate).getTime();
                    if (sortParam === 'priority') {
                        const prioMap = { 'priority-high': 3, 'priority-medium': 2, 'priority-low': 1 };
                        const prioA = prioMap[a.priority] || 0;
                        const prioB = prioMap[b.priority] || 0;
                        if (prioA !== prioB) return prioB - prioA; // Higher priority first
                    }
                    return timeA - timeB; // Then earlier time first
                });
                resolve(tasksForDate);
            }
            // --- GET /api/tasks/all ---
            else if (endpoint === '/api/tasks/all' && method === 'GET') {
                const activeTasks = mockTasks.filter(t => t.dueDate); // Keep only tasks with due dates
                activeTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                resolve(activeTasks);
            }
            // --- GET /api/tasks/month?year=...&month=... ---
            else if (endpoint.startsWith('/api/tasks/month') && method === 'GET') {
                const params = new URLSearchParams(endpoint.split('?')[1] || '');
                const year = parseInt(params.get('year'));
                const month = parseInt(params.get('month')) - 1; // JS month is 0-indexed
                if (isNaN(year) || isNaN(month)) return reject(new Error("Invalid year/month parameters"));

                const tasksForMonth = mockTasks.filter(t => {
                    if (!t.dueDate) return false;
                    try {
                        const taskDate = new Date(t.dueDate);
                        return taskDate.getFullYear() === year && taskDate.getMonth() === month;
                    } catch { return false; }
                });
                tasksForMonth.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                resolve(tasksForMonth);
            }
            // --- POST /api/tasks ---
            else if (endpoint === '/api/tasks' && method === 'POST') {
                 console.log("MOCK /api/tasks POST received body:", body); // DEBUG: Log received body
                // Use the robust parser for the input date/time strings
                const dt = parseUIDateTime(body.dueDate, body.dueTime);
                if (!dt) {
                    // parseUIDateTime already showed an alert, reject the promise
                    return reject(new Error("Invalid date/time format provided by user."));
                }
                const newTask = {
                    // Include description, priority, repeat info etc. from body
                    description: body.description,
                    priority: body.priority,
                    repeatFrequency: body.repeatFrequency,
                    customRepeatDays: body.customRepeatDays,
                    repeatUntil: body.repeatUntil, // Keep this if parsed correctly earlier
                    // Add generated/default fields
                    id: nextMockId++,
                    dueDate: dt.toISOString(), // *** Store the PARSED date as ISO string ***
                    completed: false,
                    deletedAt: null,
                    completedAt: null,
                    createdAt: new Date().toISOString(),
                };
                 console.log("MOCK Saving New Task:", newTask); // DEBUG: Log the final task object
                mockTasks.push(newTask);
                localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                localStorage.setItem('nextMockId', nextMockId.toString());
                resolve(newTask); // Return the created task object
            }
            // --- POST /api/tasks/{id}/complete ---
            else if (endpoint.includes('/complete') && method === 'POST') {
                const id = parseInt(endpoint.split('/')[3]);
                const taskIndex = mockTasks.findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    const completedTask = { ...mockTasks[taskIndex] }; // Copy task
                    completedTask.completed = true;
                    completedTask.completedAt = new Date().toISOString();
                    mockCompleted.push(completedTask); // Add to completed list
                    mockTasks.splice(taskIndex, 1); // Remove from active list
                    localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                    localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                    console.log("MOCK Completed Task:", id);
                    resolve({ message: "Task marked complete" });
                } else {
                    const alreadyCompletedIndex = mockCompleted.findIndex(t => t.id === id);
                    if (alreadyCompletedIndex > -1) {
                        console.log("MOCK Task already completed:", id);
                        resolve({ message: "Task already complete" });
                    } else {
                        reject(new Error("Mock Task not found for complete"));
                    }
                }
            }
             // --- DELETE /api/tasks/{id} (Soft Delete) ---
             else if (method === 'DELETE' && endpoint.startsWith('/api/tasks/')) {
                 const id = parseInt(endpoint.split('/')[3]);
                 let found = false;
                 // Check active tasks first
                 const taskIndex = mockTasks.findIndex(t => t.id === id);
                 if (taskIndex > -1) {
                     const deletedTask = mockTasks.splice(taskIndex, 1)[0]; // Remove from active
                     deletedTask.deletedAt = new Date().toISOString();
                     mockDeleted.push(deletedTask); // Add to deleted
                     localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                     found = true;
                     console.log("MOCK Soft Deleted Active Task:", id);
                 } else {
                     // Check completed tasks if not found in active
                     const completedIndex = mockCompleted.findIndex(t => t.id === id);
                     if (completedIndex > -1) {
                         const deletedTask = mockCompleted.splice(completedIndex, 1)[0]; // Remove from completed
                         deletedTask.deletedAt = new Date().toISOString();
                         mockDeleted.push(deletedTask); // Add to deleted
                         localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                         found = true;
                         console.log("MOCK Soft Deleted Completed Task:", id);
                     }
                 }

                 if (found) {
                     localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted)); // Save updated deleted list
                     resolve({ message: "Task moved to deleted" });
                 } else {
                     reject(new Error("Mock Task not found for soft delete"));
                 }
             }
             // --- POST /api/tasks/{id}/snooze ---
             else if (endpoint.includes('/snooze') && method === 'POST') {
                 const id = parseInt(endpoint.split('/')[3]);
                 const taskIndex = mockTasks.findIndex(t => t.id === id);
                 if (taskIndex > -1) {
                     const task = mockTasks[taskIndex];
                     if (task.completed || task.deletedAt) {
                          return reject(new Error("Cannot snooze completed or deleted task"));
                     }

                     const duration = body.duration; // '10m', '1h', '1d'
                     if (!duration) {
                          return reject(new Error("Missing snooze duration"));
                     }

                     const now = new Date();
                     let newDueDate = new Date(now); // *** Calculate snooze FROM NOW ***

                     if (duration === '10m') newDueDate.setMinutes(now.getMinutes() + 10);
                     else if (duration === '1h') newDueDate.setHours(now.getHours() + 1);
                     else if (duration === '1d') newDueDate.setDate(now.getDate() + 1);
                     else {
                          return reject(new Error("Invalid snooze duration"));
                     }

                     // Update task in the mock array
                     mockTasks[taskIndex].dueDate = newDueDate.toISOString();
                     // Add temporary properties to show in UI (will be lost on refresh unless persisted better)
                     mockTasks[taskIndex].snoozedDuration = duration;
                     mockTasks[taskIndex].snoozedUntil = newDueDate.toISOString();

                     localStorage.setItem('mockTasks', JSON.stringify(mockTasks)); // Save changes
                     console.log(`MOCK Snoozed task ${id} until ${newDueDate.toISOString()} (Duration: ${duration})`);
                     resolve({ message: `Task snoozed`, snoozedUntil: newDueDate.toISOString() });

                 } else {
                     reject(new Error("Mock Task not found for snooze"));
                 }
             }
             // --- GET /api/completed_tasks ---
            else if (endpoint.startsWith('/api/completed_tasks') && method === 'GET') {
                const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
                const filterParam = urlParams.get('filter') || state.completedFilter || 'all';
                let filteredCompleted = mockCompleted;
                const now = new Date();
                if (filterParam !== 'all') {
                    let startDate = new Date();
                    if (filterParam === 'last7') startDate.setDate(now.getDate() - 7);
                    else if (filterParam === 'last30') startDate.setDate(now.getDate() - 30);
                    else if (filterParam === 'last365') startDate.setFullYear(now.getFullYear() - 1);
                    filteredCompleted = mockCompleted.filter(t => t.completedAt && new Date(t.completedAt) >= startDate);
                }

                filteredCompleted.sort((a, b) => {
                    const timeA = new Date(a.dueDate).getTime(); // Sort by original due date
                    const timeB = new Date(b.dueDate).getTime();
                    const prioMap = {'priority-high': 3, 'priority-medium': 2, 'priority-low': 1};
                    const prioA = prioMap[a.priority] || 0;
                    const prioB = prioMap[b.priority] || 0;
                    if (timeA !== timeB) return timeA - timeB;
                    return prioB - prioA; // Then priority
                });
                resolve(filteredCompleted);
            }
             // --- DELETE /api/completed_tasks/all ---
            else if (endpoint === '/api/completed_tasks/all' && method === 'DELETE') {
                const completedToMove = mockCompleted; // Get all currently completed
                mockCompleted = []; // Clear the completed list
                completedToMove.forEach(t => t.deletedAt = new Date().toISOString()); // Mark as deleted
                mockDeleted.push(...completedToMove); // Add them to the deleted list
                localStorage.setItem('mockCompletedTasks', '[]'); // Save empty completed list
                localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted)); // Save updated deleted list
                console.log("MOCK Soft Deleted All Completed Tasks");
                resolve({ message: `${completedToMove.length} completed tasks moved to deleted` });
            }
             // --- GET /api/deleted_tasks ---
            else if (endpoint === '/api/deleted_tasks' && method === 'GET') {
                mockDeleted.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)); // Sort by deletion time desc
                resolve(mockDeleted);
            }
             // --- POST /api/deleted_tasks/{id}/restore ---
            else if (endpoint.includes('/restore') && !endpoint.includes('all') && method === 'POST') {
                 const id = parseInt(endpoint.split('/')[3]);
                 const deletedIndex = mockDeleted.findIndex(t => t.id === id);

                 if (deletedIndex > -1) {
                     const restoredTask = mockDeleted.splice(deletedIndex, 1)[0]; // Remove from deleted
                     const wasCompleted = restoredTask.completed; // *** Check original status BEFORE clearing ***
                     restoredTask.deletedAt = null; // Clear deleted flag

                     if (wasCompleted) {
                         // Restore to completed list
                         restoredTask.completed = true; // Keep completed true
                         // completedAt should still hold original completion time
                         mockCompleted.push(restoredTask);
                         localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                         console.log("MOCK Restored Task to Completed:", id);
                     } else {
                         // Restore to active tasks list
                         restoredTask.completed = false; // Ensure active state
                         restoredTask.completedAt = null;
                         mockTasks.push(restoredTask);
                         localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                         console.log("MOCK Restored Task to Active:", id);
                     }
                     localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted)); // Save updated deleted list
                     resolve({ message: "Task restored" });
                 } else {
                     reject(new Error("Mock Task not found for restore"));
                 }
             }
             // --- POST /api/deleted_tasks/all/restore ---
            else if (endpoint === '/api/deleted_tasks/all/restore' && method === 'POST') {
                 const restoredToActive = [];
                 const restoredToCompleted = [];

                 mockDeleted.forEach(task => {
                     const wasCompleted = task.completed; // *** Check original status ***
                     task.deletedAt = null; // Clear deleted flag
                     if (wasCompleted) {
                          // Keep completed status, add to completed list
                          restoredToCompleted.push(task);
                     } else {
                          // Ensure active state, add to active list
                          task.completed = false;
                          task.completedAt = null;
                          restoredToActive.push(task);
                     }
                 });

                 // Add restored tasks back to appropriate lists
                 mockTasks.push(...restoredToActive);
                 mockCompleted.push(...restoredToCompleted);
                 mockDeleted = []; // Clear deleted list

                 // Save updated lists to localStorage
                 localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                 localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                 localStorage.setItem('mockDeletedTasks', '[]');
                 console.log(`MOCK Restored ${restoredToActive.length + restoredToCompleted.length} Deleted Tasks`);
                 resolve({ message: `${restoredToActive.length + restoredToCompleted.length} tasks restored` });
            }
             // --- DELETE /api/deleted_tasks/{id} (Permanent) ---
            else if (method === 'DELETE' && endpoint.startsWith('/api/deleted_tasks/') && !endpoint.includes('all')) {
                const id = parseInt(endpoint.split('/')[3]);
                const originalLength = mockDeleted.length;
                mockDeleted = mockDeleted.filter(t => t.id !== id); // Filter out the task
                if (mockDeleted.length < originalLength) {
                    localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted));
                    console.log("MOCK Permanently Deleted Task:", id);
                    resolve({ message: "Task permanently deleted" });
                } else {
                    reject(new Error("Mock Task not found for permanent delete"));
                }
            }
             // --- DELETE /api/deleted_tasks/all (Permanent) ---
            else if (endpoint === '/api/deleted_tasks/all' && method === 'DELETE') {
                const count = mockDeleted.length;
                mockDeleted = []; // Clear the array
                localStorage.setItem('mockDeletedTasks', '[]'); // Save empty array
                console.log("MOCK Permanently Deleted All Tasks");
                resolve({ message: `${count} tasks permanently deleted` });
            }
             // --- GET /api/due_tasks ---
            else if (endpoint === '/api/due_tasks' && method === 'GET') {
                const now = new Date();
                const dueTasks = mockTasks.filter(t =>
                     !t.completed && // Not completed
                     !t.deletedAt && // *** Explicitly check not deleted ***
                     t.dueDate &&    // Has a due date
                     new Date(t.dueDate) <= now // Due date is now or in the past
                );

                if (dueTasks.length === 0) {
                    resolve([]);
                } else {
                    const prioMap = {'priority-high': 3, 'priority-medium': 2, 'priority-low': 1};
                    dueTasks.sort((a, b) => {
                        const prioA = prioMap[a.priority] || 0;
                        const prioB = prioMap[b.priority] || 0;
                        if (prioA !== prioB) return prioB - prioA; // Higher priority first
                        return new Date(a.dueDate) - new Date(b.dueDate); // Then earlier due date
                    });
                    // Resolve with the actual task objects (containing Date objects)
                    // The calling function (checkDueTasks) will handle serialization if needed
                    resolve(dueTasks);
                }
            }
            // --- POST /api/parse-datetime (Called by STT) ---
            else if (endpoint === '/api/parse-datetime' && method === 'POST') {
                 // This is a placeholder as the actual parsing happens in Python backend
                 // In a real scenario, this mock would try to mimic Python's dateutil
                 // For now, just return a dummy success or failure based on input
                 const text = body?.text || '';
                 console.log("MOCK /api/parse-datetime received:", text);
                 if (text.toLowerCase().includes('fail')) {
                      // Use reject for errors
                      reject({ error: `Mock could not parse: "${text}"` });
                 } else {
                      // Return a dummy structure similar to what Python backend sends
                      const dummyDate = new Date();
                      if (text.toLowerCase().includes('tomorrow')) dummyDate.setDate(dummyDate.getDate() + 1);
                      // Add basic time parsing if needed for mock
                      if (text.match(/(\d{1,2})\s*(am|pm)/i)) {
                           const timeMatch = text.match(/(\d{1,2})\s*(am|pm)/i);
                           let hour = parseInt(timeMatch[1]);
                           const period = timeMatch[2].toUpperCase();
                           if (period === 'PM' && hour !== 12) hour += 12;
                           if (period === 'AM' && hour === 12) hour = 0;
                           dummyDate.setHours(hour);
                           dummyDate.setMinutes(0); // Simple mock
                      } else if (text.match(/(\d{1,2}):(\d{2})/)) {
                           const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
                           dummyDate.setHours(parseInt(timeMatch[1]));
                           dummyDate.setMinutes(parseInt(timeMatch[2]));
                      }

                      resolve({
                           original: text,
                           iso: dummyDate.toISOString(),
                           date_str_dmy: dummyDate.toLocaleDateString('en-GB'),
                           date_str_mdy: dummyDate.toLocaleDateString('en-US'),
                           time_str_12: dummyDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/^0+/, ''), // Remove leading zero for H:MM
                           time_str_24: dummyDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
                      });
                 }
            }

            // --- Unhandled ---
            else {
                console.warn(`No MOCK handler for ${method} ${endpoint}`);
                resolve([]); // Or reject? Depends on expected behavior
            }
        } catch (err) {
            console.error(`Mock API Error processing ${method} ${endpoint}:`, err);
            reject(err); // Reject the promise on error
        }
    });
}

// --- Settings Management ---

/**
 * Loads settings from localStorage or uses defaults.
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('manageMeSettings');
    const defaultSettings = {
        fontSize: 'base', theme: 'green', contrast: 'default',
        timeFormat: '12hr', dateFormat: 'DDMMYYYY', firstVisit: true
    };

    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            // Merge saved settings with defaults to ensure all keys exist
            state.settings = { ...defaultSettings, ...parsedSettings };
            // Ensure firstVisit is explicitly boolean
            state.settings.firstVisit = typeof state.settings.firstVisit === 'boolean' ? state.settings.firstVisit : true;
        } catch (e) {
            console.error("Failed to parse settings, using defaults.", e);
            localStorage.removeItem('manageMeSettings'); // Clear corrupted settings
            state.settings = { ...defaultSettings };
        }
    } else {
        state.settings = { ...defaultSettings };
    }
    console.log("Loaded settings:", state.settings);
}

/**
 * Saves the current state.settings object to localStorage.
 */
function saveSettings() {
    try {
        localStorage.setItem('manageMeSettings', JSON.stringify(state.settings));
        console.log("Settings saved:", state.settings);
    } catch (e) {
        console.error("Failed to save settings.", e);
        showCustomAlert('Error', 'Could not save settings.');
    }
}

/**
 * Applies current settings to the UI (fonts, themes, formats).
 */
function applySettings() {
    console.log("Applying settings:", state.settings);
    const body = document.body;
    const root = document.documentElement;

    // 1. Apply Font Size
    body.className = body.className.replace(/font-size-(sm|base|lg|xl)\b/g, '').trim(); // Remove old size class
    body.classList.add(`font-size-${state.settings.fontSize || 'base'}`); // Add new size class

    // 2. Apply Display Mode (Contrast/Dark)
    body.classList.remove('high-contrast', 'dark-mode'); // Remove previous modes
    if (state.settings.contrast === 'high-contrast') {
        body.classList.add('high-contrast');
    } else if (state.settings.contrast === 'dark-mode') {
        body.classList.add('dark-mode');
    }

    // 3. Apply Color Theme (Primary Color) & Update Theme Buttons
    const isDefaultContrast = state.settings.contrast === 'default';
    // --- FIX: Disable/Enable theme buttons based on contrast ---
    elements.colorThemeSelector?.querySelectorAll('button').forEach(button => {
         button.disabled = !isDefaultContrast; // Disable if not default contrast
         button.style.opacity = isDefaultContrast ? '1' : '0.5'; // Dim if disabled
         button.style.cursor = isDefaultContrast ? 'pointer' : 'not-allowed';
         // Remove selection highlight if contrast mode is active
         if (!isDefaultContrast) {
              button.classList.remove('selected'); // Assuming 'selected' is the class for highlight
         }
    });
    // --- END FIX ---

    if (isDefaultContrast) {
        // Only apply theme colors if in default contrast mode
        let primaryColor, darkerColor, rgbString;
        switch (state.settings.theme) {
            case 'blue': primaryColor = '#3b82f6'; darkerColor = '#2563eb'; rgbString = '59, 130, 246'; break;
            case 'purple': primaryColor = '#8b5cf6'; darkerColor = '#7c3aed'; rgbString = '139, 92, 246'; break;
            case 'red': primaryColor = '#ef4444'; darkerColor = '#dc2626'; rgbString = '239, 68, 68'; break;
            case 'green': default: primaryColor = '#68a67d'; darkerColor = '#5a916d'; rgbString = '104, 166, 125'; break;
        }
        root.style.setProperty('--primary-color', primaryColor);
        root.style.setProperty('--primary-color-darker', darkerColor);
        root.style.setProperty('--rgb-primary-color', rgbString);
        root.style.setProperty('--input-focus-ring-color', primaryColor);
        updateThemeSelectionUI(); // Update button visuals only if default contrast
    } else {
         // In contrast/dark mode, theme colors might be overridden by CSS,
         // or we could reset to a default theme variable set here if needed.
         // For now, we let the body class CSS handle overrides.
    }


    // 4. Update settings UI elements to reflect current state
    if(elements.settingFontSize) elements.settingFontSize.value = state.settings.fontSize;
    if(elements.settingContrast) elements.settingContrast.value = state.settings.contrast;
    if(elements.settingTimeFormat) elements.settingTimeFormat.value = state.settings.timeFormat;
    if(elements.settingDateFormat) elements.settingDateFormat.value = state.settings.dateFormat;
    // updateThemeSelectionUI() is called conditionally above

    // 5. Refresh relevant UI parts that depend on format settings
    updateClock(); // Update sidebar clock format
    updateMainDateDisplay(); // Update main date display format
    initDateInputs(); // Update default date/time format in add task form
    refreshCurrentView(); // Re-render lists to apply date/time formats
}

/**
 * Updates the visual selection state of the theme color buttons.
 */
function updateThemeSelectionUI() {
    // Only update selection if contrast is default
    if (state.settings.contrast === 'default') {
        const currentTheme = state.settings.theme;
        document.querySelectorAll('#colorThemeSelector button').forEach(button => {
            button.classList.toggle('selected', button.dataset.theme === currentTheme);
            // Ensure background color is set for visual feedback (might be redundant if set in HTML)
            button.style.backgroundColor = button.dataset.themeColor || '';
        });
    }
}

// --- User Management & Welcome ---

/**
 * Shows the welcome screen or the settings modal based on first visit/username state.
 */
function showWelcomeOrSetup() {
    if (!state.userName) {
        // No username yet, show the welcome screen
        elements.welcomeScreen?.classList.remove('hidden');
        if (elements.welcomeScreen) {
            elements.welcomeScreen.style.display = 'flex';
        }
        console.log("Showing Welcome Screen (No Username)");
        elements.userNameInput?.focus(); // Focus the input field
    } else {
        // Username exists, but it's the first visit (settings not confirmed)
        console.log("First visit, showing settings setup...");
        applySettings(); // Apply defaults/loaded settings
        setupEventListeners(); // Ensure listeners are set up
        showSettingsModal(true); // Show settings modal in setup mode
    }
}

/**
 * Called when the user finishes the initial settings setup.
 */
function finishFirstTimeSetup() {
    console.log("Finishing first-time setup...");
    state.settings.firstVisit = false; // Mark setup as complete
    saveSettings(); // Save the setting
    closeModal('settingsModal'); // Close the settings modal
    setTimeout(showWalkthrough, 500); // Start the tutorial after a short delay
}

/**
 * Saves the username from the welcome screen and proceeds to setup or main app.
 */
function saveUserNameAndSetup() {
    const name = elements.userNameInput?.value.trim();
    if (name) {
        state.userName = name;
        localStorage.setItem('userName', name); // Save username
        console.log(`User name saved: ${name}`);
        elements.welcomeScreen?.classList.add('hidden'); // Hide welcome screen
        if (elements.welcomeScreen) {
            elements.welcomeScreen.style.display = 'none';
        }
        updateGreeting(); // Update greeting text

        if (state.settings.firstVisit) {
            // If first visit, proceed to settings setup
            showWelcomeOrSetup();
        } else {
            // Otherwise, go directly to the main app view
            applySettings();
            setupEventListeners();
            initDateInputs();
            showSection('today');
            setInterval(checkDueTasks, 60000);
            checkDueTasks();
        }
    } else {
        // Prompt user if name is empty
        showCustomAlert('Input Required', 'Please enter your first name to get started.');
    }
}

/**
 * Shows the settings modal.
 * @param {boolean} [isSetupMode=false] - If true, shows the 'Done Setup' button instead of 'Save & Close'.
 */
function showSettingsModal(isSetupMode = false) {
    console.log(`Showing settings modal (Setup Mode: ${isSetupMode})`);

    // Ensure controls reflect current settings before opening
    if(elements.settingFontSize) elements.settingFontSize.value = state.settings.fontSize;
    if(elements.settingContrast) elements.settingContrast.value = state.settings.contrast;
    if(elements.settingTimeFormat) elements.settingTimeFormat.value = state.settings.timeFormat;
    if(elements.settingDateFormat) elements.settingDateFormat.value = state.settings.dateFormat;
    applySettings(); // Re-apply to ensure theme buttons disable state is correct

    // Show/hide the appropriate main action button
    elements.saveSettingsBtn?.classList.toggle('hidden', isSetupMode);
    elements.settingsDoneButton?.classList.toggle('hidden', !isSetupMode);

    openModal('settingsModal');

    // Scroll modal content to top after opening
    const modalContent = elements.settingsModal?.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}


// --- UI Functions ---

/**
 * Updates the sidebar clock display.
 */
function updateClock() {
    const now = new Date();
    if (elements.sidebarClock) {
        try {
            const timeString = now.toLocaleTimeString([], {
                hour12: state.settings.timeFormat === '12hr',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit'
            });
            elements.sidebarClock.textContent = timeString;
        } catch (e) {
            console.error("Error formatting sidebar clock time:", e);
            elements.sidebarClock.textContent = "Error";
        }
    }
    if (elements.sidebarDate) {
         try {
             // Using a simple format for the sidebar date
             elements.sidebarDate.textContent = formatDate(now, state.settings.dateFormat);
         } catch (e) {
              console.error("Error formatting sidebar date:", e);
              elements.sidebarDate.textContent = "Error";
         }
    }
}


/**
 * Updates the main date and time display on the home screen.
 */
function updateMainDateDisplay() {
    if (!elements.mainDateDisplay) return;
    
    const now = new Date();
    try {
        // Format date based on user preferences
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateStr = now.toLocaleDateString(undefined, dateOptions);
        
        // Format time based on user preferences
        const timeOptions = {
            hour12: state.settings.timeFormat === '12hr',
            hour: 'numeric',
            minute: '2-digit'
        };
        const timeStr = now.toLocaleTimeString(undefined, timeOptions);
        
        elements.mainDateDisplay.textContent = `Today is ${dateStr} - ${timeStr}`;
    } catch (e) {
        console.error("Error formatting date/time:", e);
        elements.mainDateDisplay.textContent = "Error loading date/time";
    }
}

/**
 * Updates the greeting message based on the time of day and username.
 */
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    if(elements.greetingText) elements.greetingText.textContent = `${greeting}, ${escapeHtml(state.userName)}!`;
}

/**
 * Toggles the mobile sidebar's visibility.
 */
function toggleSidebar() {
    elements.sidebar?.classList.toggle('active');
}

/**
 * Toggles the expanded/collapsed state of the desktop sidebar.
 */
function toggleSidebarExpanded() {
    if (window.innerWidth > 1024) { // Only allow expand/collapse on larger screens
        const isExpanding = !elements.sidebar?.classList.contains('expanded');
        elements.sidebar?.classList.toggle('expanded', isExpanding);
        state.sidebarExpanded = isExpanding;
        console.log(`Sidebar expanded: ${isExpanding}`);
    }
}

// --- Event Listeners Setup ---

/**
 * Attaches all necessary event listeners to DOM elements.
 */
function setupEventListeners() {
    console.log("Setting up event listeners...");

    // --- Welcome Screen ---
    elements.saveUserNameBtn?.addEventListener('click', saveUserNameAndSetup);

    // --- Sidebar & Mobile Menu ---
    elements.mobileMenuButton?.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    elements.sidebarTitleHeader?.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebarExpanded(); });

    // Global click listener for closing sidebar/menus
    document.addEventListener('click', (e) => {
        // Close mobile sidebar if clicking outside
        if (elements.sidebar?.classList.contains('active')) {
             if (!elements.sidebar.contains(e.target) && !elements.mobileMenuButton?.contains(e.target)) {
                 elements.sidebar.classList.remove('active');
             }
        }
        // Close expanded desktop sidebar if clicking outside
        else if (window.innerWidth > 1024 && elements.sidebar?.classList.contains('expanded')) {
              if (!elements.sidebar.contains(e.target)) {
                  elements.sidebar.classList.remove('expanded');
                  state.sidebarExpanded = false;
              }
         }
         // Close open snooze options if clicking outside
         const visibleSnooze = document.querySelector('.snooze-options:not(.hidden)');
         if (visibleSnooze && !visibleSnooze.contains(e.target) && !e.target.closest('.snooze-btn')) {
              visibleSnooze.classList.add('hidden');
         }
    });

    // --- Sidebar Navigation (Event Delegation) ---
    const sidebarNav = document.querySelector('.sidebar-nav');
    const sidebarFooterNav = document.querySelector('.sidebar-footer-nav');

    function handleNavClick(event) {
        const button = event.target.closest('button.nav-item');
        if (!button) return;

        const sectionId = button.id.replace('Nav', '');
        if (sectionId === 'settings') {
            showSettingsModal(false);
        } else if (sectionId === 'help') {
            showWalkthrough();
        } else if (sectionId === 'calendar') {
            if (state.isDayView) { returnToTodayCalendar(); } // If in day view, go back to month
            else { showSection('calendar'); }
        }
        else if (elements[`${sectionId}Section`]) { // Check if a corresponding section exists
            showSection(sectionId);
        } else {
            console.warn(`No section or action found for nav button: ${button.id}`);
        }
    }
    sidebarNav?.addEventListener('click', handleNavClick);
    sidebarFooterNav?.addEventListener('click', handleNavClick);

    // --- Add Task Form ---
    elements.addTaskBtn?.addEventListener('click', addTask);
    elements.taskInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    elements.repeatFrequency?.addEventListener('change', handleRepeatFrequencyChange);
    elements.customRepeatOptions?.querySelectorAll('.repeat-day').forEach(day => {
        day?.addEventListener('click', () => toggleRepeatDay(day));
    });
    elements.openDatePickerBtn?.addEventListener('click', openDatePicker);
    elements.openTimePickerBtn?.addEventListener('click', openTimePicker);
    elements.repeatUntilSelect?.addEventListener('change', handleRepeatUntilChange);

    // --- Calendar Navigation & Actions ---
    elements.prevMonthBtn?.addEventListener('click', prevMonth);
    elements.nextMonthBtn?.addEventListener('click', nextMonth);
    elements.prevYearBtn?.addEventListener('click', prevYear);
    elements.nextYearBtn?.addEventListener('click', nextYear);
    elements.returnToTodayBtn?.addEventListener('click', returnToTodayCalendar);
    elements.calendarBackBtn?.addEventListener('click', showCalendarView); // Back from Day View
    elements.prevDayBtn?.addEventListener('click', prevDay); // Day View Nav
    elements.nextDayBtn?.addEventListener('click', nextDay); // Day View Nav
    elements.addTaskForDayBtn?.addEventListener('click', addTaskForSelectedDay); // Day View Button
    elements.freeUpScheduleBtn?.addEventListener('click', showFreeUpScheduleModal); // Day View Button

    // --- Settings Modal Controls ---
    elements.settingFontSize?.addEventListener('change', (e) => { state.settings.fontSize = e.target.value; applySettings(); saveSettings(); });
    elements.settingContrast?.addEventListener('change', (e) => { state.settings.contrast = e.target.value; applySettings(); saveSettings(); });
    elements.colorThemeSelector?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        // Only change theme if not disabled (i.e., default contrast is active)
        if (button?.dataset.theme && !button.disabled) {
            state.settings.theme = button.dataset.theme;
            applySettings(); // applySettings handles updating styles and UI
            saveSettings();
        }
    });
    elements.settingTimeFormat?.addEventListener('change', (e) => { state.settings.timeFormat = e.target.value; applySettings(); saveSettings(); });
    elements.settingDateFormat?.addEventListener('change', (e) => { state.settings.dateFormat = e.target.value; applySettings(); saveSettings(); });
    elements.saveSettingsBtn?.addEventListener('click', () => closeModal('settingsModal'));
    elements.settingsDoneButton?.addEventListener('click', finishFirstTimeSetup);
    elements.settingsBackBtn?.addEventListener('click', () => closeModal('settingsModal')); // Added listener for back button

    // --- Date Picker Modal ---
    elements.prevPickerMonthBtn?.addEventListener('click', prevPickerMonth);
    elements.nextPickerMonthBtn?.addEventListener('click', nextPickerMonth);
    elements.cancelDatePickerBtn?.addEventListener('click', () => closeModal('datePickerModal'));
    // Note: Picker day selection listener is added dynamically in renderPickerCalendar

    // --- Time Picker Modal ---
    elements.increaseHourBtn?.addEventListener('click', () => changeHour(1));
    elements.decreaseHourBtn?.addEventListener('click', () => changeHour(-1));
    elements.increaseMinuteBtn?.addEventListener('click', () => changeMinute(1));
    elements.decreaseMinuteBtn?.addEventListener('click', () => changeMinute(-1));
    elements.toggleAmPmBtn?.addEventListener('click', toggleAmPm);
    elements.saveTimeBtn?.addEventListener('click', saveSelectedTime);
    elements.cancelTimePickerBtn?.addEventListener('click', () => closeModal('timePickerModal'));

    // --- Alert Modals ---
    elements.closeAlertBtn?.addEventListener('click', () => closeModal('taskDueAlert'));
    elements.customAlertCloseBtn?.addEventListener('click', () => closeModal('customAlertModal'));
    elements.dueAlertTaskList?.addEventListener('click', handleTaskAction); // Use delegation for actions inside alert

    // --- Confirmation Modals (Standard Delete/Restore) ---
    elements.confirmDeleteBtn?.addEventListener('click', confirmDeleteTask);
    elements.cancelDeleteBtn?.addEventListener('click', () => closeModal('deleteConfirmModal'));
    elements.confirmRestoreBtn?.addEventListener('click', confirmRestoreTask);
    elements.cancelRestoreBtn?.addEventListener('click', () => closeModal('restoreConfirmModal'));
    elements.confirmPermanentDeleteBtn?.addEventListener('click', confirmPermanentDelete);
    elements.cancelPermanentDeleteBtn?.addEventListener('click', () => closeModal('permanentDeleteModal'));

    // --- Confirmation Modals (Recurring Complete) ---
    elements.confirmCompleteSingleBtn?.addEventListener('click', () => confirmCompleteTask(false));
    elements.confirmCompleteSeriesBtn?.addEventListener('click', () => confirmCompleteTask(true));
    elements.cancelCompleteRecurringBtn?.addEventListener('click', () => closeModal('completeRecurringConfirmModal'));

    // --- Confirmation Modals (Bulk Actions) ---
    elements.confirmDeleteAllCompletedBtn?.addEventListener('click', confirmDeleteAllCompleted);
    elements.cancelDeleteAllCompletedBtn?.addEventListener('click', () => {
        // Logic to clear countdown interval and reset button state
        const confirmBtn = elements.confirmDeleteAllCompletedBtn;
        if (confirmBtn?.dataset.countdownInterval) {
            clearInterval(parseInt(confirmBtn.dataset.countdownInterval));
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete All';
            delete confirmBtn.dataset.countdownInterval;
        }
        closeModal('deleteAllCompletedConfirmModal');
    });
    elements.confirmDeleteAllPermanentlyBtn?.addEventListener('click', confirmDeleteAllPermanently);
    elements.cancelDeleteAllPermanentlyBtn?.addEventListener('click', () => closeModal('deleteAllPermanentlyConfirmModal'));
    elements.confirmRestoreAllBtn?.addEventListener('click', confirmRestoreAll);
    elements.cancelRestoreAllBtn?.addEventListener('click', () => closeModal('restoreAllConfirmModal'));

    // --- Walkthrough Navigation & Close ---
    elements.walkthroughNextBtn?.addEventListener('click', nextWalkthroughStep);
    elements.walkthroughPrevBtn?.addEventListener('click', prevWalkthroughStep);
    elements.closeWalkthroughBtn?.addEventListener('click', closeWalkthrough);

    // --- Task List Actions (Event Delegation for all lists) ---
    elements.taskList?.addEventListener('click', handleTaskAction);
    elements.completedList?.addEventListener('click', handleTaskAction);
    elements.deletedList?.addEventListener('click', handleTaskAction);
    elements.dayViewTaskList?.addEventListener('click', handleTaskAction);
    elements.upcomingTaskContent?.addEventListener('click', handleTaskAction);
    // Note: Free Up Schedule modal list listener added dynamically in showFreeUpScheduleModal

    // --- Upcoming Task Filters/Expand ---
    elements.upcomingTaskFilters?.addEventListener('click', handleUpcomingFilterClick);
    elements.upcomingExpandBtn?.addEventListener('click', toggleUpcomingExpand);

    // --- Today Sort Control ---
    elements.todaySortControl?.addEventListener('click', toggleTodaySort);

    // --- Completed Task Filters/Delete All ---
    elements.completedFilters?.addEventListener('click', handleCompletedFilterClick);
    elements.deleteAllCompletedBtn?.addEventListener('click', showDeleteAllCompletedConfirm);

    // --- Deleted Task Bulk Actions ---
    elements.restoreAllBtn?.addEventListener('click', showRestoreAllConfirm);
    elements.deleteAllPermanentlyBtn?.addEventListener('click', showDeleteAllPermanentlyConfirm);

    // --- STT Button Listeners ---
    elements.sttBtnDescription?.addEventListener('click', () => {
        if (typeof startListening === 'function') startListening('description');
        else console.error("startListening function not found! (stt.js missing or failed?)");
    });
    elements.sttBtnDateTime?.addEventListener('click', () => {
         if (typeof startListening === 'function') startListening('datetime');
         else console.error("startListening function not found! (stt.js missing or failed?)");
    });
    elements.sttBtnFrequency?.addEventListener('click', () => {
         if (typeof startListening === 'function') startListening('frequency');
         else console.error("startListening function not found! (stt.js missing or failed?)");
    });
    console.log("STT Listeners attached.");

    console.log("Event listeners setup complete.");
}


// --- Task Management Core Logic ---

/**
 * Handles adding a new task based on form inputs.
 */
async function addTask() {
    console.log("Attempting to add task...");
    const taskDescription = elements.taskInput?.value.trim();
    const taskDateStr = elements.dueDate?.value;
    const taskTimeStr = elements.dueTime?.value;
    const taskPriorityValue = elements.taskPriority?.value;
    const repeat = elements.repeatFrequency?.value;
    const customDays = (repeat === 'custom') ? state.customRepeatDays : [];
    const repeatUntil = elements.repeatUntilDate?.value;

    // --- Validation ---
    if (!taskDescription) {
        showCustomAlert('Input Required', 'Please enter a task description.');
        elements.taskInput?.focus();
        return;
    }
    if (taskDescription.length > 150) {
        showCustomAlert('Input Error', 'Task description cannot exceed 150 characters.');
        elements.taskInput?.focus();
        return;
    }
    if (!taskDateStr || !taskTimeStr) {
        showCustomAlert('Input Required', 'Please select a valid due date and time.');
        return;
    }

    // Use the robust parser which includes logging
    const parsedDateTime = parseUIDateTime(taskDateStr, taskTimeStr);
    if (!parsedDateTime) {
        // parseUIDateTime shows its own alert on failure
        return;
    }

    // --- Prepare Data for API ---
    // Send the original date/time strings as entered by user/picker
    const taskData = {
        description: taskDescription,
        dueDate: taskDateStr, // String from date picker
        dueTime: taskTimeStr, // String from time picker
        priority: taskPriorityValue,
        repeatFrequency: repeat,
        customRepeatDays: customDays,
        repeatUntil: (repeat !== 'none' && repeatUntil) ? repeatUntil : null
    };

    console.log("Submitting Task Data to API:", taskData); // Log data being sent

    // --- Call API (Mock) ---
    try {
        const newTask = await apiRequest('/api/tasks', 'POST', taskData);
        // API returns the created task object (including the parsed ISO dueDate)
        if (newTask) {
             console.log("Task added successfully via API:", newTask);
             resetAddTaskForm();
             await showSection('today'); // Switch view AND refresh data
             delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)]; // Clear calendar cache
             showCustomAlert('Success', `Task "${escapeHtml(newTask.description)}" added!`, 'success');
        } else {
             // Should ideally not happen if API returns object or throws error
             console.warn("API POST /api/tasks did not return new task object.");
             resetAddTaskForm();
             await showSection('today');
             delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
             showCustomAlert('Success', `Task added!`, 'success'); // Generic success
        }
    } catch (error) {
        console.error("Failed to add task via API:", error);
        showCustomAlert('Error Adding Task', `Could not add task: ${error.message}`);
    }
}

/**
 * Resets the Add Task form fields to their default states.
 */
function resetAddTaskForm() {
    if (elements.taskInput) elements.taskInput.value = '';
    initDateInputs(); // Reset date/time pickers to default (today/next hour)
    if (elements.taskPriority) elements.taskPriority.value = 'priority-medium';
    if (elements.repeatFrequency) elements.repeatFrequency.value = 'none';
    if (elements.repeatUntilDate) elements.repeatUntilDate.value = '';
    if (elements.repeatUntilSelect) elements.repeatUntilSelect.value = 'never';
    handleRepeatFrequencyChange(); // Update visibility of custom/until sections
    state.customRepeatDays = []; // Clear selected custom days
    document.querySelectorAll('.repeat-day.selected').forEach(day => day.classList.remove('selected')); // Clear UI selection
}

/**
 * Handles changes in the repeat frequency dropdown.
 * Shows/hides the custom day selector and repeat until options.
 */
function handleRepeatFrequencyChange() {
    const repeatValue = elements.repeatFrequency?.value;
    const showCustom = repeatValue === 'custom';
    const showUntil = repeatValue !== 'none' && repeatValue !== undefined;

    elements.customRepeatOptions?.classList.toggle('hidden', !showCustom);
    elements.repeatUntilContainer?.classList.toggle('hidden', !showUntil);

    // Clear custom days if frequency changes away from custom
    if (!showCustom) {
        state.customRepeatDays = [];
        document.querySelectorAll('.repeat-day.selected').forEach(day => day.classList.remove('selected'));
    }
    // Reset repeat until if frequency changes to none
    if (!showUntil) {
        if(elements.repeatUntilDate) elements.repeatUntilDate.value = '';
        if(elements.repeatUntilSelect) elements.repeatUntilSelect.value = 'never';
    } else {
        // Optionally update the date based on the default dropdown value
        handleRepeatUntilChange();
    }
}

/**
 * Handles changes in the "Repeat Until" dropdown, populating the date field.
 */
function handleRepeatUntilChange() {
     const selectValue = elements.repeatUntilSelect?.value;
     const untilDateInput = elements.repeatUntilDate;
     if (!selectValue || !untilDateInput) return;

     const today = new Date();
     let untilDate = new Date(today); // Start from today

     switch(selectValue) {
         case '1month': untilDate.setMonth(today.getMonth() + 1); break;
         case '6months': untilDate.setMonth(today.getMonth() + 6); break;
         case '1year': untilDate.setFullYear(today.getFullYear() + 1); break;
         case '10years':
             // Be careful with yearly repeats - 10 years might be too far
             untilDate.setFullYear(today.getFullYear() + (elements.repeatFrequency?.value === 'yearly' ? 10 : 1));
             break;
         case 'custom':
             // Allow user to pick date using the date picker
             untilDateInput.value = ''; // Clear any preset date
             untilDateInput.readOnly = false; // Allow manual input/picker
             // Maybe trigger date picker automatically?
             // openDatePicker(); // Consider UX implications
             return; // Don't set value automatically
         case 'never': default:
             // No end date
             untilDateInput.value = ''; // Clear date field
             untilDateInput.readOnly = true; // Prevent manual input
             return;
     }
     // Set the calculated date and make input read-only
     untilDateInput.value = formatDate(untilDate, state.settings.dateFormat);
     untilDateInput.readOnly = true;
}

/**
 * Toggles the selection state of a custom repeat day button.
 * @param {HTMLElement} element - The day button element that was clicked.
 */
function toggleRepeatDay(element) {
    if (!element) return;
    const day = parseInt(element.getAttribute('data-day')); // Day index 0-6
    if (isNaN(day)) return;

    element.classList.toggle('selected'); // Toggle visual state

    const index = state.customRepeatDays.indexOf(day);
    if (element.classList.contains('selected')) {
        // Add day if selected and not already in array
        if (index === -1) {
            state.customRepeatDays.push(day);
        }
    } else {
        // Remove day if deselected and present in array
        if (index > -1) {
            state.customRepeatDays.splice(index, 1);
        }
    }
    state.customRepeatDays.sort((a,b) => a - b); // Keep array sorted
    console.log("Custom repeat days:", state.customRepeatDays);
}

// --- Task Actions (Confirmation Modals & API Calls) ---
// (Includes markTaskComplete, completeSingleTask, show/confirm Delete, show/confirm Restore, show/confirm PermanentDelete)
// (Includes show/confirm CompleteRecurring, showSnoozeOptions, snoozeTask)
// (Includes Alert Modal Helpers: completeTaskFromAlert, snoozeTaskFromAlert)
// (Includes Bulk Actions: show/confirm DeleteAllCompleted, show/confirm RestoreAll, show/confirm DeleteAllPermanently)

// --- Task Completion ---

/**
 * Initiates the task completion process. Shows confirmation for recurring tasks.
 * @param {string|number} taskId - The ID of the task to complete.
 */
async function markTaskComplete(taskId) {
    if (!taskId) { console.error("Invalid task ID for completion"); return; }
    console.log(`Attempting to mark task complete: ${taskId}`);

    // TODO: Add logic here to check if the task IS actually recurring based on task data
    // This requires fetching the task details first or having them available.
    // For now, assume non-recurring.
    const isRecurring = false; // Placeholder

    if (isRecurring) {
        showCompleteRecurringConfirm(taskId);
    } else {
        await completeSingleTask(taskId);
    }
}

/**
 * Shows the confirmation modal for completing a recurring task.
 * @param {string|number} taskId - The ID of the recurring task.
 */
function showCompleteRecurringConfirm(taskId) {
    // Find task description (might need to fetch task data if not readily available)
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${taskId}`;

    state.taskToComplete = taskId; // Store ID for confirmation action
    if(elements.completeRecurringText) {
        elements.completeRecurringText.textContent = `"${escapeHtml(taskDesc)}" is a recurring task. Complete only this instance or the entire series?`;
    }
    openModal('completeRecurringConfirmModal');
}

/**
 * Handles the user's choice from the recurring task completion modal.
 * @param {boolean} [completeSeries=false] - True to complete the whole series, false for single instance.
 */
async function confirmCompleteTask(completeSeries = false) {
    const taskId = state.taskToComplete;
    if (!taskId) return;

    state.completeSeries = completeSeries; // Store choice if backend needs it
    closeModal('completeRecurringConfirmModal');
    await completeSingleTask(taskId); // Proceed with completion
}

/**
 * Marks a single task instance as complete via API call.
 * @param {string|number} taskId - The ID of the task instance to complete.
 */
async function completeSingleTask(taskId) {
    if (!taskId) return;
    const completeSeries = state.completeSeries; // Get flag (might be needed for API)
    console.log(`Completing Task ID: ${taskId}, Complete Series: ${completeSeries}`);

    // Prepare endpoint (potentially add series flag if backend supports it)
    let endpoint = `/api/tasks/${taskId}/complete`;
    // if (completeSeries) endpoint += '?series=true'; // Example if backend handles series completion

    try {
        await apiRequest(endpoint, 'POST'); // Call API/Mock
        // Clear cache and refresh UI after successful completion
        delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
        await refreshCurrentView();
        // Optional: Show success feedback
        // showCustomAlert('Task Completed', '', 'success');
    } catch (error) {
        console.error(`Failed to complete task ${taskId}:`, error);
        showCustomAlert('Error', `Error completing task: ${error.message}`);
    } finally {
        // Reset state variables related to completion confirmation
        state.taskToComplete = null;
        state.completeSeries = false;
    }
}

// --- Task Deletion (Soft) ---

/**
 * Shows the confirmation modal for soft-deleting a task.
 * @param {string|number} taskId - The ID of the task to delete.
 */
function showDeleteConfirm(taskId) {
    if (!taskId) { console.error("Invalid task ID for deletion"); return; }
    // Find task description from the UI element
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${taskId}`;

    state.taskToDelete = taskId; // Store ID for confirmation
    if(elements.deleteTaskText) {
        elements.deleteTaskText.textContent = `Delete "${escapeHtml(taskDesc)}"? This will move it to the Deleted Tasks list.`;
    }
    openModal('deleteConfirmModal');
}

/**
 * Confirms the soft deletion and calls the API.
 */
async function confirmDeleteTask() {
    const taskId = state.taskToDelete;
    if (!taskId) return;
    console.log(`Confirming delete for: ${taskId}`);

    try {
        await apiRequest(`/api/tasks/${taskId}`, 'DELETE'); // Call API/Mock
        state.taskToDelete = null; // Clear pending state
        closeModal('deleteConfirmModal');
        // Clear cache and refresh UI
        delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
        await refreshCurrentView();
        // Optional: Success feedback
        // showCustomAlert('Task Deleted', 'Moved to Deleted Tasks list.', 'info');
    } catch (error) {
        closeModal('deleteConfirmModal'); // Close modal even on error
        console.error(`Failed to delete task ${taskId}:`, error);
        showCustomAlert('Error', `Error deleting task: ${error.message}`);
    }
}

// --- Task Restoration ---

/**
 * Shows the confirmation modal for restoring a deleted task.
 * @param {string|number} taskId - The ID of the task to restore.
 */
function showRestoreConfirm(taskId) {
     if (!taskId) { console.error("Invalid task ID for restore"); return; }
     const numericTaskId = parseInt(taskId, 10);
     if (isNaN(numericTaskId)) { console.error("Task ID is not a number:", taskId); return; }

     // Find task description from the Deleted list UI element
     const taskElement = document.querySelector(`#deletedList .task-item[data-task-id="${numericTaskId}"]`);
     const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${numericTaskId}`;

     state.taskToRestore = numericTaskId; // Store ID for confirmation
     if(elements.restoreTaskText) {
        elements.restoreTaskText.textContent = `Restore "${escapeHtml(taskDesc)}"? It will reappear in the main task lists.`;
     }
     openModal('restoreConfirmModal');
}

/**
 * Confirms the restoration and calls the API.
 */
async function confirmRestoreTask() {
    const taskId = state.taskToRestore;
    if (!taskId) return;
    console.log(`Confirming restore for: ${taskId}`);

    try {
        await apiRequest(`/api/deleted_tasks/${taskId}/restore`, 'POST'); // Call API/Mock
        state.taskToRestore = null; // Clear pending state
        closeModal('restoreConfirmModal');
        // Clear cache and refresh UI (important as task moves lists)
        delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
        await refreshCurrentView();
        // Optional: Success feedback
        // showCustomAlert('Task Restored', '', 'success');
    } catch (error) {
        closeModal('restoreConfirmModal');
        console.error(`Failed to restore task ${taskId}:`, error);
        showCustomAlert('Error', `Error restoring task: ${error.message}`);
    }
}

// --- Task Deletion (Permanent) ---

/**
 * Shows the confirmation modal for permanently deleting a task.
 * @param {string|number} taskId - The ID of the task to delete permanently.
 */
function showPermanentDeleteConfirm(taskId) {
    if (!taskId) { console.error("Invalid task ID for permanent deletion"); return; }
    const numericTaskId = parseInt(taskId, 10);
    if (isNaN(numericTaskId)) { console.error("Task ID is not a number:", taskId); return; }

    // Find task description from the Deleted list UI element
    const taskElement = document.querySelector(`#deletedList .task-item[data-task-id="${numericTaskId}"]`);
    const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${numericTaskId}`;

    state.taskToDeletePermanently = numericTaskId; // Store ID for confirmation
    if(elements.permanentDeleteTaskText) {
        elements.permanentDeleteTaskText.textContent = `Permanently delete "${escapeHtml(taskDesc)}"? This action cannot be undone.`;
    }
    openModal('permanentDeleteModal');
}

/**
 * Confirms the permanent deletion and calls the API.
 */
async function confirmPermanentDelete() {
    const taskId = state.taskToDeletePermanently;
    if (!taskId) return;
    console.log(`Confirming permanent delete for: ${taskId}`);

    try {
        await apiRequest(`/api/deleted_tasks/${taskId}`, 'DELETE'); // Call API/Mock
        state.taskToDeletePermanently = null; // Clear pending state
        closeModal('permanentDeleteModal');
        // Only need to refresh the deleted list view
        await renderDeletedTasks();
        // Optional: Success feedback
        // showCustomAlert('Task Permanently Deleted', '', 'success');
    } catch (error) {
        closeModal('permanentDeleteModal');
        console.error(`Failed to permanently delete task ${taskId}:`, error);
        showCustomAlert('Error', `Error permanently deleting task: ${error.message}`);
    }
}

// --- Task Snoozing ---

/**
 * Shows the snooze duration options for a task.
 * @param {Event} event - The click event object.
 */
function showSnoozeOptions(event) {
    event.stopPropagation(); // Prevent global click listener from closing it immediately
    const button = event.target.closest('.snooze-btn');
    const taskItem = button?.closest('.task-item');
    if (!button || !taskItem) return;

    const optionsDiv = taskItem.querySelector('.snooze-options');
    if (!optionsDiv) return;

    // Close any other open snooze menus first
    document.querySelectorAll('.snooze-options').forEach(el => {
        if (el !== optionsDiv) el.classList.add('hidden');
    });
    // Toggle the visibility of the clicked options menu
    optionsDiv.classList.toggle('hidden');
}

/**
 * Handles the snooze action when a duration button is clicked.
 * @param {Event} event - The click event object.
 */
async function snoozeTask(event) {
    event.stopPropagation(); // Prevent triggering actions on parent elements
    const button = event.target.closest('button[data-snooze]');
    const taskItem = button?.closest('.task-item');
    const optionsDiv = button?.closest('.snooze-options');
    if (!button || !taskItem || !optionsDiv) return;

    const taskId = taskItem.dataset.taskId;
    const snoozeDuration = button.dataset.snooze; // '10m', '1h', '1d'
    optionsDiv.classList.add('hidden'); // Hide options menu

    console.log(`Snoozing task ${taskId} for ${snoozeDuration}`);
    try {
        // Call API/Mock - Mock API now calculates based on current time
        await apiRequest(`/api/tasks/${taskId}/snooze`, 'POST', { duration: snoozeDuration });
        console.log(`Task ${taskId} snoozed successfully via API call.`);
        // Refresh the view to show updated due time and snooze status
        await refreshCurrentView();
        showCustomAlert('Task Snoozed', `Task snoozed for ${snoozeDuration}.`, 'info');
    } catch (error) {
        console.error(`Failed to snooze task ${taskId}:`, error);
        showCustomAlert('Error', `Could not snooze task: ${error.message}`);
    }
}

// --- Bulk Actions ---
// (Includes show/confirm DeleteAllCompleted, show/confirm RestoreAll, show/confirm DeleteAllPermanently)

/**
 * Shows the confirmation modal for deleting all completed tasks
 * and starts a brief countdown on the confirm button.
 */
function showDeleteAllCompletedConfirm() {
    const confirmBtn = elements.confirmDeleteAllCompletedBtn;
    if (!confirmBtn) {
        console.error("Delete All Completed confirmation button not found.");
        return;
    }

    let countdown = 3; // 3 second countdown
    confirmBtn.disabled = true;
    confirmBtn.textContent = `Delete All (${countdown}s)`;

    // Clear any existing interval before starting a new one
    if (confirmBtn.dataset.countdownInterval) {
        clearInterval(parseInt(confirmBtn.dataset.countdownInterval));
    }

    const intervalId = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            confirmBtn.textContent = `Delete All (${countdown}s)`;
        } else {
            clearInterval(intervalId);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete All';
            delete confirmBtn.dataset.countdownInterval; // Clean up dataset
        }
    }, 1000);

    confirmBtn.dataset.countdownInterval = intervalId.toString(); // Store interval ID reference
    openModal('deleteAllCompletedConfirmModal');
}

/**
 * Handles the actual deletion of all completed tasks after confirmation.
 */
async function confirmDeleteAllCompleted() {
    console.log("Confirming delete all completed tasks...");
    const confirmBtn = elements.confirmDeleteAllCompletedBtn;

    // Clear countdown interval if it exists
    if (confirmBtn?.dataset.countdownInterval) {
       clearInterval(parseInt(confirmBtn.dataset.countdownInterval));
       delete confirmBtn.dataset.countdownInterval;
    }

    try {
        // Call API/Mock to soft-delete all completed tasks
        const result = await apiRequest('/api/completed_tasks/all', 'DELETE');
        closeModal('deleteAllCompletedConfirmModal');

        // Refresh relevant views
        if (state.currentSection === 'completed') await renderCompletedTasks();
        if (state.currentSection === 'deleted') await renderDeletedTasks(); // Tasks moved here

        showCustomAlert('Success', result?.message || 'All completed tasks moved to deleted list.', 'success');

    } catch (error) {
        closeModal('deleteAllCompletedConfirmModal');
        console.error("Failed to delete all completed tasks:", error);
        showCustomAlert('Error', `Could not delete all completed tasks: ${error.message}`);
    } finally {
         // Ensure button is re-enabled and text reset
         if(confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete All';
         }
    }
}

/**
 * Shows the confirmation modal for restoring all deleted tasks.
 */
function showRestoreAllConfirm() {
    openModal('restoreAllConfirmModal');
}

/**
 * Handles the actual restoration of all tasks after confirmation.
 */
async function confirmRestoreAll() {
    console.log("Confirming restore all deleted tasks...");
    try {
        // Call API/Mock to restore all deleted tasks
        const result = await apiRequest('/api/deleted_tasks/all/restore', 'POST');
        closeModal('restoreAllConfirmModal');

        // Clear cache and refresh UI (tasks moved between lists)
        delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
        await refreshCurrentView();

        const message = result?.message || 'All deleted tasks restored.';
        showCustomAlert('Success', message, 'success');

    } catch (error) {
        closeModal('restoreAllConfirmModal');
        console.error("Failed to restore all tasks:", error);
        showCustomAlert('Error', `Could not restore all tasks: ${error.message}`);
    }
}

/**
 * Shows the confirmation modal for permanently deleting all tasks.
 */
function showDeleteAllPermanentlyConfirm() {
    openModal('deleteAllPermanentlyConfirmModal');
}

/**
 * Handles the actual permanent deletion of all tasks after confirmation.
 */
async function confirmDeleteAllPermanently() {
    console.log("Confirming permanent delete all tasks...");
    try {
        // Call API/Mock to permanently delete all tasks in the deleted list
        const result = await apiRequest('/api/deleted_tasks/all', 'DELETE');
        closeModal('deleteAllPermanentlyConfirmModal');

        // Refresh the deleted list view if it's the current section
        if (state.currentSection === 'deleted') {
            await renderDeletedTasks();
        }
        const message = result?.message || 'All deleted tasks permanently removed.';
        showCustomAlert('Success', message, 'success');

    } catch (error) {
        closeModal('deleteAllPermanentlyConfirmModal');
        console.error("Failed to permanently delete all tasks:", error);
        showCustomAlert('Error', `Could not permanently delete tasks: ${error.message}`);
    }
}

// --- END OF PART 1 ---

// --- END OF PART 1 ---
// script.js - Organized and Updated - Part 2/3
// (Continuation from Part 1)

// --- Task Rendering Functions ---

/**
 * Creates an HTML list item element for a given task.
 * Includes logic for displaying snooze status and appropriate actions based on viewType.
 * @param {object} task - The task object.
 * @param {string} viewType - Context ('today', 'upcoming', 'completed', 'deleted', 'dayView', 'alert').
 * @returns {HTMLLIElement} - The created list item element.
 */
function createTaskListItem(task, viewType) {
    const li = document.createElement('li');
    const priorityClass = task.priority || 'priority-low'; // Default to low if missing
    li.className = `task-item ${priorityClass}`;
    li.setAttribute('data-task-id', task.id);

    // --- Safely Parse Dates ---
    let dueDate, completedDate, deletedDate, snoozedUntilDate;
    try { dueDate = task.dueDate ? new Date(task.dueDate) : null; } catch (e) { console.warn(`Invalid dueDate for task ${task.id}: ${task.dueDate}`); dueDate = null; }
    try { completedDate = task.completedAt ? new Date(task.completedAt) : null; } catch (e) { console.warn(`Invalid completedAt for task ${task.id}: ${task.completedAt}`); completedDate = null; }
    try { deletedDate = task.deletedAt ? new Date(task.deletedAt) : null; } catch (e) { console.warn(`Invalid deletedAt for task ${task.id}: ${task.deletedAt}`); deletedDate = null; }
    try { snoozedUntilDate = task.snoozedUntil ? new Date(task.snoozedUntil) : null; } catch (e) { console.warn(`Invalid snoozedUntil for task ${task.id}: ${task.snoozedUntil}`); snoozedUntilDate = null; }


    // --- Formatting Options ---
    const timeOptions = { hour12: state.settings.timeFormat === '12hr', hour: 'numeric', minute: '2-digit' };
    // Use numeric for month/day to match formatDate output style if needed, or use 'short'/'long'
    const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US'; // Example locales

    // --- Date String (Today, Tomorrow, Formatted) ---
    let dateString = 'No date';
    if (dueDate && !isNaN(dueDate)) {
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const taskDay = new Date(dueDate); taskDay.setHours(0,0,0,0);
        if (taskDay.getTime() === today.getTime()) dateString = 'Today';
        else if (taskDay.getTime() === tomorrow.getTime()) dateString = 'Tomorrow';
        else dateString = formatDate(dueDate, state.settings.dateFormat);
    }

    // --- Time String ---
    const timeString = (dueDate && !isNaN(dueDate)) ? dueDate.toLocaleTimeString([], timeOptions) : 'No time';

    // --- Snooze Status String ---
    let snoozeStatus = '';
    // Check if snoozedUntil exists AND is in the future
    if (snoozedUntilDate && snoozedUntilDate > new Date()) {
         const durationText = task.snoozedDuration ? ` for ${task.snoozedDuration}` : ''; // Use stored duration if available
         const snoozedTime = snoozedUntilDate.toLocaleTimeString([], timeOptions); // Format snooze end time
         // Added font-medium for slightly more emphasis
         snoozeStatus = `<span class="text-orange-600 dark:text-orange-400 ml-2 font-medium">(Snoozed${durationText} until ${snoozedTime})</span>`;
    }

    // --- Build Details HTML based on viewType ---
    let detailsHtml = '';
    if (viewType === 'today' || viewType === 'dayView' || viewType === 'upcoming' || viewType === 'alert') {
         // Append snoozeStatus to the details for active views
         detailsHtml = `<p class="task-details"><i class="far fa-calendar-alt"></i> ${dateString} <i class="far fa-clock ml-2"></i> ${timeString} ${snoozeStatus}</p>`;
    } else if (viewType === 'completed') {
        const completedLocaleString = (completedDate && !isNaN(completedDate)) ? completedDate.toLocaleString(locale, {...dateOptions, ...timeOptions}) : 'N/A';
        detailsHtml = `<p class="task-details"><i class="far fa-check-circle text-green-500"></i> Completed: ${completedLocaleString}</p>`;
        if (dueDate) { // Optionally show original due date for context
             detailsHtml += `<p class="task-details text-xs opacity-70"><i class="far fa-calendar-times"></i> Was Due: ${dateString} ${timeString}</p>`;
        }
    } else if (viewType === 'deleted') {
         const deletedLocaleString = (deletedDate && !isNaN(deletedDate)) ? deletedDate.toLocaleString(locale, {...dateOptions, ...timeOptions}) : 'N/A';
        detailsHtml = `<p class="task-details"><i class="fas fa-trash-alt"></i> Deleted: ${deletedLocaleString}</p>`;
         if (dueDate) { // Optionally show original due date for context
              detailsHtml += `<p class="task-details text-xs opacity-70"><i class="far fa-calendar-times"></i> Was Due: ${dateString} ${timeString}</p>`;
         }
    } else if (dueDate) { // Fallback
         detailsHtml = `<p class="task-details"><i class="far fa-calendar-alt"></i> Due: ${dateString} ${timeString} ${snoozeStatus}</p>`;
    }

    // --- Build Buttons HTML based on viewType ---
    let buttonsHtml = '';
     if (viewType === 'today' || viewType === 'dayView' || viewType === 'upcoming' || viewType === 'alert') {
         // Standard actions for active tasks
         buttonsHtml = `
             <button class="action-btn btn-icon btn-success" aria-label="Mark as complete"><i class="fas fa-check"></i></button>
             <button class="action-btn btn-icon btn-warning snooze-btn" aria-label="Snooze task"><i class="fas fa-clock"></i></button>
             ${viewType !== 'alert' ? '<button class="action-btn btn-icon btn-danger" aria-label="Delete task"><i class="fas fa-trash-alt"></i></button>' : ''}
             <div class="snooze-options hidden absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                 <button data-snooze="10m" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">10 Minutes</button>
                 <button data-snooze="1h" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">1 Hour</button>
                 <button data-snooze="1d" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">1 Day</button>
             </div>`;
     } else if (viewType === 'completed') {
         // Only allow deletion for completed tasks
         buttonsHtml = `<button class="action-btn btn-icon btn-danger" aria-label="Delete task"><i class="fas fa-trash-alt"></i></button>`;
     } else if (viewType === 'deleted') {
         // Allow restore and permanent delete for deleted tasks
         buttonsHtml = `
             <button class="action-btn btn-icon btn-info" aria-label="Restore task"><i class="fas fa-trash-restore"></i></button>
             <button class="action-btn btn-icon btn-danger" aria-label="Permanently delete task"><i class="fas fa-times"></i></button>`;
     }

    // --- Assemble Final List Item HTML ---
    li.innerHTML = `
        <div class="task-item-content">
            <p class="task-description ${viewType === 'completed' ? 'line-through opacity-70' : ''}" title="${escapeHtml(task.description)}">
                ${escapeHtml(task.description)}
            </p>
            ${detailsHtml}
        </div>
        <div class="task-actions relative"> ${buttonsHtml} </div>
    `;

    // --- Attach Event Listeners for Snooze Options ---
    // Attach listeners AFTER setting innerHTML
     li.querySelectorAll('.snooze-options button').forEach(button => {
         button.addEventListener('click', snoozeTask); // Use main snooze handler
     });
     const snoozeBtn = li.querySelector('.snooze-btn');
     snoozeBtn?.addEventListener('click', showSnoozeOptions); // Use main options toggle handler

    return li;
}

/**
 * Renders tasks for the 'Today' view.
 * @param {Date|null} [date=null] - The date to render tasks for (defaults to current date).
 */
async function renderTasks(date = null) {
    const listEl = elements.taskList;
    if (!listEl) { console.error("Task list element not found"); return; }
    listEl.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading tasks...</li>`;

    try {
        const targetDate = date instanceof Date ? date : state.currentDate;
        const year = targetDate.getFullYear();
        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const day = targetDate.getDate().toString().padStart(2, '0');
        const endpoint = `/api/tasks?date=${year}-${month}-${day}&sort=${state.todaySortOrder}`;

        console.log(`Rendering tasks from: ${endpoint}`);
        const tasks = await apiRequest(endpoint); // Fetch tasks for the specific date

        listEl.innerHTML = ''; // Clear loading message

        if (Array.isArray(tasks) && tasks.length === 0) {
            listEl.innerHTML = `<li class="no-tasks-message"><i class="fas fa-check-circle"></i><p>No tasks scheduled for this day.</p></li>`;
            if(elements.taskCount) elements.taskCount.textContent = "0 tasks";
        } else if (Array.isArray(tasks)) {
            if(elements.taskCount) elements.taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
            tasks.forEach(task => listEl.appendChild(createTaskListItem(task, 'today'))); // Use 'today' viewType
        } else {
             console.error("Invalid data received for tasks:", tasks);
             throw new Error("Invalid data received for tasks");
        }
    } catch (error) {
        console.error("Error rendering tasks:", error);
        listEl.innerHTML = `<li class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Couldn't load tasks</p></li>`;
         if(elements.taskCount) elements.taskCount.textContent = "Error";
    } finally {
         if (listEl.querySelector('.loading-text')) {
             listEl.innerHTML = `<li class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Couldn't load tasks</p></li>`;
         }
    }
}

/**
 * Renders upcoming tasks based on the current filter and expanded state.
 */
async function renderUpcomingTasks() {
    const container = elements.upcomingTaskContainer;
    const content = elements.upcomingTaskContent;
    if (!container || !content) { console.error("Upcoming task elements not found"); return; }
    content.innerHTML = `<p class="loading-text"><i class="fas fa-spinner fa-spin mr-1"></i>Loading...</p>`;
    container.style.display = 'block'; // Ensure container is visible

    try {
        const allTasks = await apiRequest('/api/tasks/all');
        const now = new Date(); now.setHours(0,0,0,0); // Start of today

        // Filter tasks based on date range and ensure they are in the future
        let filteredTasks = allTasks
            .map(task => ({ ...task, dueDateObj: new Date(task.dueDate) })) // Parse date for comparison
            .filter(task => task.dueDateObj >= now); // Only include tasks from today onwards

        // Apply date range filter based on state.upcomingFilter
        let filterEndDate;
        const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
        const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);
        const nextYear = new Date(now); nextYear.setFullYear(now.getFullYear() + 1);

        switch(state.upcomingFilter) {
            case 'next7': filterEndDate = nextWeek; break;
            case 'next30': filterEndDate = nextMonth; break;
            case 'next365': filterEndDate = nextYear; break;
            case 'all': default: filterEndDate = null; break;
        }
        if (filterEndDate) {
            filteredTasks = filteredTasks.filter(t => t.dueDateObj < filterEndDate);
        }

        // Sort remaining tasks by date
        filteredTasks.sort((a, b) => a.dueDateObj - b.dueDateObj);

        content.innerHTML = ''; // Clear loading message

        if (filteredTasks.length === 0) {
            content.innerHTML = `<p class="no-tasks-message text-sm">No upcoming tasks found for the selected period.</p>`;
        } else {
            // Determine how many tasks to display based on expanded state
            const displayLimit = state.upcomingExpanded ? filteredTasks.length : 3;
            filteredTasks.slice(0, displayLimit).forEach(task => {
                 content.appendChild(createTaskListItem(task, 'upcoming')); // Use 'upcoming' viewType
            });

            // Show/hide the "Show More/Less" button
            const showExpandButton = filteredTasks.length > 3;
            elements.upcomingExpandBtn?.classList.toggle('hidden', !showExpandButton);
            if (elements.upcomingExpandBtn && showExpandButton) {
                elements.upcomingExpandBtn.innerHTML = state.upcomingExpanded
                    ? '<i class="fas fa-chevron-up mr-1"></i> Show Less'
                    : '<i class="fas fa-chevron-down mr-1"></i> Show More';
            }
        }
    } catch (error) {
        console.error("Failed to render upcoming tasks:", error);
        content.innerHTML = `<p class="error-message text-sm">Error loading upcoming tasks.</p>`;
    } finally {
         if (content.querySelector('.loading-text')) {
             content.innerHTML = `<p class="error-message text-sm">Error loading upcoming task.</p>`;
         }
    }
}

/**
 * Renders completed tasks based on the current filter.
 */
async function renderCompletedTasks() {
    const listEl = elements.completedList;
    if (!listEl) { console.error("Completed task list element not found"); return; }
    listEl.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading completed tasks...</li>`;

    try {
        const endpoint = `/api/completed_tasks?filter=${state.completedFilter || 'all'}`;
        const tasks = await apiRequest(endpoint);

        listEl.innerHTML = ''; // Clear loading message

        if (Array.isArray(tasks) && tasks.length === 0) {
            listEl.innerHTML = `<li class="no-tasks-message">No completed tasks found for this period.</li>`;
        } else if (Array.isArray(tasks)) {
            tasks.forEach(task => listEl.appendChild(createTaskListItem(task, 'completed'))); // Use 'completed' viewType
        } else {
            throw new Error("Invalid data received for completed tasks");
        }
        // Show/hide the 'Delete All Completed' button
         elements.deleteAllCompletedBtn?.classList.toggle('hidden', !(Array.isArray(tasks) && tasks.length > 0));
    } catch (error) {
        console.error("Failed to render completed tasks:", error);
        listEl.innerHTML = `<li class="error-message">Error loading completed tasks.</li>`;
        elements.deleteAllCompletedBtn?.classList.add('hidden');
    } finally {
         if (listEl.querySelector('.loading-text')) {
             listEl.innerHTML = `<li class="error-message">Error loading completed tasks.</li>`;
         }
    }
}

/**
 * Renders deleted tasks.
 */
async function renderDeletedTasks() {
    const listEl = elements.deletedList;
    if (!listEl) { console.error("Deleted task list element not found"); return; }
    listEl.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading deleted tasks...</li>`;
    try {
        const tasks = await apiRequest('/api/deleted_tasks'); // Fetch deleted tasks
        listEl.innerHTML = ''; // Clear loading message

        if (Array.isArray(tasks) && tasks.length === 0) {
            listEl.innerHTML = `<li class="no-tasks-message">No deleted tasks found.</li>`;
        } else if (Array.isArray(tasks)) {
            tasks.forEach(task => listEl.appendChild(createTaskListItem(task, 'deleted'))); // Use 'deleted' viewType
        } else {
            throw new Error("Invalid data received for deleted tasks");
        }
        // Show/hide bulk action buttons based on whether list has items
        const showBulk = Array.isArray(tasks) && tasks.length > 0;
        elements.restoreAllBtn?.classList.toggle('hidden', !showBulk);
        elements.deleteAllPermanentlyBtn?.classList.toggle('hidden', !showBulk);

    } catch (error) {
        console.error("Failed to render deleted tasks:", error);
        listEl.innerHTML = `<li class="error-message">Error loading deleted tasks.</li>`;
        elements.restoreAllBtn?.classList.add('hidden');
        elements.deleteAllPermanentlyBtn?.classList.add('hidden');
    } finally {
         if (listEl.querySelector('.loading-text')) {
             listEl.innerHTML = `<li class="error-message">Error loading deleted tasks.</li>`;
         }
    }
}


// --- Calendar Functions ---

/**
 * Fetches tasks for a specific month/year, using cache if available.
 * @param {number} year
 * @param {number} month - The month (0-11).
 * @returns {Promise<Array>} - A promise resolving to an array of task objects for the month.
 */
async function fetchTasksForMonth(year, month) {
    const cacheKey = getCacheKey(year, month);
    if (state.taskCache[cacheKey]) {
         console.log("Using cached tasks for", cacheKey);
         return state.taskCache[cacheKey]; // Return cached data
    }
    try {
        const endpoint = `/api/tasks/month?year=${year}&month=${month + 1}`; // Month is 1-based for API
        const tasks = await apiRequest(endpoint);
        // Parse dueDate strings into Date objects for easier handling in renderCalendar
        const parsedTasks = tasks.map(task => ({
            ...task,
            dueDateObj: task.dueDate ? new Date(task.dueDate) : null
        }));
        state.taskCache[cacheKey] = parsedTasks; // Store parsed tasks in cache
        return parsedTasks;
    } catch (e) {
        console.error("Error fetching tasks for calendar month", e);
        state.taskCache[cacheKey] = []; // Cache empty array on error to prevent repeated failed requests
        return [];
    }
}

/**
 * Checks if the currently viewed calendar month/year is the actual current month/year
 * and toggles the visibility of the "Return to Today" button accordingly.
 */
function checkShowReturnToToday() {
    const today = new Date();
    const isCurrentMonthAndYear = state.currentYear === today.getFullYear() && state.currentMonth === today.getMonth();
    // Show the button only if we are NOT viewing the current month/year AND not in day view
    elements.returnToTodayBtn?.classList.toggle('hidden', isCurrentMonthAndYear || state.isDayView);
}


/**
 * Renders the main monthly calendar view.
 */
async function renderCalendar() {
    const calendarEl = elements.calendar;
    if (!calendarEl) { console.error("Calendar element not found"); return; }
    calendarEl.innerHTML = `<div class="col-span-7 loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`; // Loading indicator

    try {
        const monthTasks = await fetchTasksForMonth(state.currentYear, state.currentMonth); // Fetch tasks
        calendarEl.innerHTML = ''; // Clear loading indicator

        const firstDayOfMonth = new Date(state.currentYear, state.currentMonth, 1);
        const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate(); // Get days in current month
        const startingDay = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
        const today = new Date(); today.setHours(0, 0, 0, 0); // Today's date for highlighting

        // Update header display (Month Name and Year - Year is now part of title)
        if(elements.calendarMonthYear) elements.calendarMonthYear.textContent = firstDayOfMonth.toLocaleDateString(undefined, { month: 'long' });
        if(elements.calendarYearDisplay) elements.calendarYearDisplay.textContent = state.currentYear; // Update year in title

        // Create empty cells for days before the 1st of the month
        for (let i = 0; i < startingDay; i++) {
            calendarEl.appendChild(document.createElement('div'));
        }

        // Create cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            const currentDate = new Date(state.currentYear, state.currentMonth, day); currentDate.setHours(0, 0, 0, 0);
            // Find tasks specifically for this day
            const dayTasks = monthTasks.filter(task => task.dueDateObj && task.dueDateObj.getDate() === day);

            dayDiv.className = 'calendar-day'; // Base class
            dayDiv.dataset.day = day; // Store day number

            // Add day number span
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.textContent = day;
            dayNumberSpan.className = 'day-number';
            dayDiv.appendChild(dayNumberSpan);

            // Add task indicators if tasks exist for this day
            if (dayTasks.length > 0) {
                dayDiv.classList.add('has-tasks'); // Class for potential background styling
                const indicatorContainer = document.createElement('div');
                indicatorContainer.className = 'task-indicators';
                const maxIndicators = 3; // Max dots to show before showing '+'
                // Get unique priorities for the day's tasks
                const priorities = dayTasks.map(t => t.priority || 'priority-low');
                const uniquePriorities = [...new Set(priorities)];

                // Create dots for unique priorities (up to max)
                uniquePriorities.slice(0, maxIndicators).forEach(prio => {
                    const indicator = document.createElement('span');
                    indicator.className = `task-indicator ${prio}`; // Use priority class for color
                    indicatorContainer.appendChild(indicator);
                });

                // Show a '+' indicator if there are more tasks than dots shown
                if (dayTasks.length > maxIndicators) {
                    const moreIndicator = document.createElement('span');
                    moreIndicator.textContent = `+${dayTasks.length - maxIndicators}`;
                    moreIndicator.className = 'task-indicator more'; // Specific style for the '+'
                    indicatorContainer.appendChild(moreIndicator);
                }
                dayDiv.appendChild(indicatorContainer);
            }

            // Highlight today's date
            if (currentDate.getTime() === today.getTime()) {
                dayDiv.classList.add('today');
            }

            // Add click listener to show day view
            dayDiv.addEventListener('click', () => showDayView(day));
            calendarEl.appendChild(dayDiv);
        }
        checkShowReturnToToday(); // Update button visibility after rendering
    } catch (error) {
        console.error("Failed to render calendar:", error);
        calendarEl.innerHTML = `<div class="col-span-7 error-message">Error loading calendar.</div>`;
    } finally {
        // Ensure loading text is removed even if an error occurred during fetch/render
        if (calendarEl.querySelector('.loading-text')) {
            calendarEl.innerHTML = `<div class="col-span-7 error-message">Error loading calendar.</div>`;
        }
    }
}

/**
 * Switches the view to show tasks for a specific selected day.
 * Updates titles and visibility of navigation elements.
 * @param {number} day - The day of the month (1-31).
 */
async function showDayView(day) {
    console.log(`Showing day view for day: ${day}`);
    state.selectedDay = day;
    state.isDayView = true;
    const date = new Date(state.currentYear, state.currentMonth, day);
    const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US'; // Or use browser default

    // --- FIX: Update Day View Title to show the day name (e.g., "Wednesday") ---
    if (elements.dayViewTitle) {
         elements.dayViewTitle.textContent = date.toLocaleDateString(locale, { weekday: 'long' });
    }
    // Update the secondary date display (e.g., "03/05/2025")
     if (elements.dayViewDateDisplay) {
          elements.dayViewDateDisplay.textContent = formatDate(date, state.settings.dateFormat);
     }
     // --- END FIX ---

    // --- FIX: Hide Month/Year navigation ---
    const calendarGridHeader = elements.calendar?.parentElement?.querySelector('.calendar-grid-header');
    if (calendarGridHeader) calendarGridHeader.classList.add('hidden');
    elements.calendar?.classList.add('hidden');
    elements.calendarNavContainer?.classList.add('hidden'); // Hide Month nav
    elements.calendarYearNav?.classList.add('hidden'); // Hide Year nav
    elements.returnToTodayBtn?.classList.add('hidden'); // Hide return button in day view
    // Hide the main calendar title area (H2 containing year and "Calendar")
    elements.calendarTitle?.parentElement?.classList.add('hidden');
    // --- END FIX ---

    // Show Day View elements
    elements.dayView?.classList.remove('hidden');
    elements.dayViewNav?.classList.remove('hidden'); // Show Prev/Next Day buttons
    elements.calendarBackBtn?.classList.remove('hidden'); // Show Back button

    await renderDayViewTasks(); // Fetch and display tasks for the selected day
}

/**
 * Renders the list of tasks for the currently selected day (in Day View).
 */
async function renderDayViewTasks() {
    if (!state.isDayView || state.selectedDay === null) return; // Only run if in day view
    console.log(`Rendering tasks for selected day: ${state.selectedDay}`);
    const listEl = elements.dayViewTaskList;
    if (!listEl) { console.error("Day view task list element not found"); return; }
    listEl.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</li>`;

    try {
        const date = new Date(state.currentYear, state.currentMonth, state.selectedDay);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        // Fetch tasks for this specific day, using current sort order
        const endpoint = `/api/tasks?date=${year}-${month}-${day}&sort=${state.todaySortOrder}`;
        console.log(`Fetching day view tasks from: ${endpoint}`);
        const tasks = await apiRequest(endpoint);

        listEl.innerHTML = ''; // Clear loading message
        if (Array.isArray(tasks) && tasks.length === 0) {
            listEl.innerHTML = `<li class="no-tasks-message">No tasks scheduled for this day.</li>`;
        } else if (Array.isArray(tasks)) {
            tasks.forEach(task => listEl.appendChild(createTaskListItem(task, 'dayView'))); // Use 'dayView' type
        } else {
            throw new Error("Invalid data received for day view tasks");
        }
    } catch (error) {
        console.error("Failed to render day view tasks:", error);
        listEl.innerHTML = `<li class="error-message">Error loading tasks for this day.</li>`;
    } finally {
        if (listEl.querySelector('.loading-text')) {
            listEl.innerHTML = `<li class="error-message">Error loading tasks for this day.</li>`;
        }
    }
}

/**
 * Switches back to the main monthly calendar view from the Day View.
 */
function showCalendarView() {
    state.isDayView = false;
    state.selectedDay = null;

    // Show Month calendar elements and Month/Year navigation
    const calendarGridHeader = elements.calendar?.parentElement?.querySelector('.calendar-grid-header');
     if (calendarGridHeader) calendarGridHeader.classList.remove('hidden');
    elements.calendar?.classList.remove('hidden');
    elements.calendarNavContainer?.classList.remove('hidden'); // Show Month nav
    elements.calendarYearNav?.classList.remove('hidden'); // Show Year nav

    // Hide Day View elements
    elements.dayView?.classList.add('hidden');
    elements.dayViewNav?.classList.add('hidden'); // Hide Day nav
    elements.calendarBackBtn?.classList.add('hidden'); // Hide Back button

    // --- FIX: Restore main calendar title visibility ---
    elements.calendarTitle?.parentElement?.classList.remove('hidden');
    // --- END FIX ---

    checkShowReturnToToday(); // Check if return button should be shown for the month view
}

/**
 * Navigates the calendar to the previous month.
 */
async function prevMonth() {
    state.currentMonth--;
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    if (state.isDayView) showCalendarView(); // Switch back to month view if needed
    await renderCalendar();
    checkShowReturnToToday(); // Update return button visibility
}

/**
 * Navigates the calendar to the next month.
 */
async function nextMonth() {
    state.currentMonth++;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    if (state.isDayView) showCalendarView();
    await renderCalendar();
    checkShowReturnToToday();
}

/**
 * Navigates the calendar to the previous year.
 */
async function prevYear() {
     state.currentYear--;
     if (state.isDayView) showCalendarView();
     await renderCalendar();
     checkShowReturnToToday();
}

/**
 * Navigates the calendar to the next year.
 */
async function nextYear() {
     state.currentYear++;
     if (state.isDayView) showCalendarView();
     await renderCalendar();
     checkShowReturnToToday();
}

/**
 * Navigates the Day View to the previous day.
 */
async function prevDay() {
     if (!state.isDayView || state.selectedDay === null) return;
     const currentDate = new Date(state.currentYear, state.currentMonth, state.selectedDay);
     currentDate.setDate(currentDate.getDate() - 1); // Go to previous day
     // Update state to reflect the new date
     state.currentYear = currentDate.getFullYear();
     state.currentMonth = currentDate.getMonth();
     state.selectedDay = currentDate.getDate();
     // Update the displayed date and refresh tasks
     const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US';
     if(elements.dayViewDateDisplay) elements.dayViewDateDisplay.textContent = formatDate(currentDate, state.settings.dateFormat);
     if (elements.dayViewTitle) elements.dayViewTitle.textContent = currentDate.toLocaleDateString(locale, { weekday: 'long' });
     await renderDayViewTasks();
}

/**
 * Navigates the Day View to the next day.
 */
async function nextDay() {
     if (!state.isDayView || state.selectedDay === null) return;
     const currentDate = new Date(state.currentYear, state.currentMonth, state.selectedDay);
     currentDate.setDate(currentDate.getDate() + 1); // Go to next day
     // Update state
     state.currentYear = currentDate.getFullYear();
     state.currentMonth = currentDate.getMonth();
     state.selectedDay = currentDate.getDate();
     // Update display and refresh tasks
     const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US';
     if(elements.dayViewDateDisplay) elements.dayViewDateDisplay.textContent = formatDate(currentDate, state.settings.dateFormat);
     if (elements.dayViewTitle) elements.dayViewTitle.textContent = currentDate.toLocaleDateString(locale, { weekday: 'long' });
     await renderDayViewTasks();
}

/**
 * Navigates the calendar view back to the current month and year.
 */
async function returnToTodayCalendar() {
     const today = new Date();
     state.currentYear = today.getFullYear();
     state.currentMonth = today.getMonth();
     if (state.isDayView) showCalendarView(); // Ensure we are in month view
     await renderCalendar();
     // checkShowReturnToToday() is called within renderCalendar, so button will hide
}

/**
 * Pre-fills the Add Task form with the date currently selected in Day View
 * and switches to the Add Task section.
 */
function addTaskForSelectedDay() {
    if (!state.isDayView || state.selectedDay === null) return; // Must be in day view
    const date = new Date(state.currentYear, state.currentMonth, state.selectedDay);

    // Set the date input value
    if(elements.dueDate) elements.dueDate.value = formatDate(date, state.settings.dateFormat);

    // Set a default time (e.g., 9 AM) - keep existing time logic if preferred
    const defaultTime = new Date(); defaultTime.setHours(9, 0, 0, 0);
    // Adjust state based on user's time format setting
    if (state.settings.timeFormat === '12hr') {
         state.selectedHour = 9;
         state.selectedAmPm = 'AM';
    } else { // 24hr
         state.selectedHour = 9;
         state.selectedAmPm = '';
    }
    state.selectedMinute = 0;

    // Update the time input field value
    if(elements.dueTime) elements.dueTime.value = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);

    // --- FIX: Switch to the correct section ID ---
    showSection('addTask');
}

/**
 * Shows the "Free Up Schedule" modal, populating it with tasks for the selected day.
 */
async function showFreeUpScheduleModal() {
     if (!state.isDayView || state.selectedDay === null) {
         showCustomAlert("Info", "Please select a day from the calendar first.", "info");
         return;
     }
     const modalList = elements.freeUpTaskList;
     const modalDateSpan = elements.freeUpDate; // Use populated elements object
     // --- FIX: Check if elements exist before proceeding ---
     if (!modalList || !modalDateSpan) {
          console.error("Free Up Schedule modal elements (#freeUpTaskList or #freeUpDate) not found");
          showCustomAlert("Error", "Could not open Free Up Schedule view. Required elements missing.", "error");
          return;
     }
     // --- END FIX ---

     const date = new Date(state.currentYear, state.currentMonth, state.selectedDay);
     modalDateSpan.textContent = formatDate(date, state.settings.dateFormat); // Show date in modal title
     modalList.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading tasks...</li>`;
     openModal('freeUpScheduleModal'); // Open the modal

     try {
         const year = date.getFullYear();
         const month = (date.getMonth() + 1).toString().padStart(2, '0');
         const day = date.getDate().toString().padStart(2, '0');
         // Fetch tasks for the selected day
         const endpoint = `/api/tasks?date=${year}-${month}-${day}&sort=${state.todaySortOrder}`;
         const tasks = await apiRequest(endpoint);

         modalList.innerHTML = ''; // Clear loading
         if (tasks.length === 0) {
              modalList.innerHTML = `<li class="no-tasks-message">No tasks scheduled for this day.</li>`;
         } else {
              tasks.forEach(task => {
                   // Create list items using the standard function, allowing complete/delete actions
                   const item = createTaskListItem(task, 'dayView'); // Use 'dayView' style/actions
                   modalList.appendChild(item);
              });
              // Add event listener specifically for this list's actions
              modalList.removeEventListener('click', handleFreeUpTaskAction); // Remove old listener if any
              modalList.addEventListener('click', handleFreeUpTaskAction);
         }
     } catch (error) {
          console.error("Failed to load tasks for Free Up modal:", error);
          modalList.innerHTML = `<li class="error-message">Error loading tasks.</li>`;
     }
}

/**
 * Handles task actions (complete, delete) specifically within the Free Up Schedule modal.
 * Uses event delegation on the modal's task list.
 * @param {Event} event - The click event object.
 */
async function handleFreeUpTaskAction(event) {
     const button = event.target.closest('button');
     if (!button) return;
     const taskItem = button.closest('.task-item');
     const taskId = taskItem?.dataset.taskId;
     const label = button.getAttribute('aria-label');

     if (!taskId) return; // Need task ID for actions here

     if (label?.includes('Mark as complete')) {
          console.log(`Completing task ${taskId} from Free Up modal.`);
          try {
              await completeSingleTask(taskId); // Call API/Mock to complete
              // Animate fade out and remove from modal list
              taskItem.style.transition = 'opacity 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease, border 0.3s ease';
              taskItem.style.opacity = '0';
              taskItem.style.height = '0';
              taskItem.style.marginTop = '0';
              taskItem.style.marginBottom = '0';
              taskItem.style.paddingTop = '0';
              taskItem.style.paddingBottom = '0';
              taskItem.style.borderWidth = '0'; // Fade border too
              setTimeout(() => {
                   taskItem.remove();
                   // Check if list is now empty
                   if (!elements.freeUpTaskList?.querySelector('.task-item')) {
                        elements.freeUpTaskList.innerHTML = `<li class="no-tasks-message">No tasks remaining for this day.</li>`;
                   }
              }, 350); // Match transition duration
              // Refresh main view in background silently
               refreshCurrentView().catch(e => console.error("Background refresh failed after Free Up complete"));
          } catch (error) {
              showCustomAlert("Error", `Failed to complete task: ${error.message}`);
          }

     } else if (label?.includes('Delete task')) {
          console.log(`Deleting task ${taskId} from Free Up modal.`);
          // Ask for confirmation before deleting from this modal? Optional.
          // For now, directly soft-delete.
          try {
               await apiRequest(`/api/tasks/${taskId}`, 'DELETE'); // Call API/Mock to soft delete
               // Animate fade out and remove
               taskItem.style.transition = 'opacity 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease, border 0.3s ease';
               taskItem.style.opacity = '0';
               taskItem.style.height = '0';
               taskItem.style.marginTop = '0';
               taskItem.style.marginBottom = '0';
               taskItem.style.paddingTop = '0';
               taskItem.style.paddingBottom = '0';
               taskItem.style.borderWidth = '0';
               setTimeout(() => {
                    taskItem.remove();
                    // Check if list is now empty
                    if (!elements.freeUpTaskList?.querySelector('.task-item')) {
                         elements.freeUpTaskList.innerHTML = `<li class="no-tasks-message">No tasks remaining for this day.</li>`;
                    }
               }, 350);
               // Refresh main view in background silently
               refreshCurrentView().catch(e => console.error("Background refresh failed after Free Up delete"));
          } catch (error) {
              showCustomAlert("Error", `Failed to delete task: ${error.message}`);
          }
     }
     // Add snooze handling here if the snooze button is kept in the modal's task items
     else if (button.classList.contains('snooze-btn') || label?.includes('Snooze task')) {
          // Option 1: Show snooze options within the modal (might overlap)
          showSnoozeOptions(event);
          // Option 2: Directly trigger snooze with a default duration or open a simpler prompt
     } else if (button.dataset.snooze) {
          // Handle snooze duration click if options were shown
          const snoozeDuration = button.dataset.snooze;
           // Similar logic to snoozeTaskFromAlert, removing item from modal list
           const optionsDiv = taskItem.querySelector('.snooze-options'); // Corrected variable name
           if (optionsDiv) optionsDiv.classList.add('hidden');
           console.log(`Snoozing task ${taskId} for ${snoozeDuration} from Free Up modal`);
           try {
               await apiRequest(`/api/tasks/${taskId}/snooze`, 'POST', { duration: snoozeDuration });
               // Animate out
               taskItem.style.transition = 'opacity 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease, border 0.3s ease';
               taskItem.style.opacity = '0';
               // ... set height/margin/padding/border to 0 ...
               taskItem.style.height = '0';
               taskItem.style.marginTop = '0';
               taskItem.style.marginBottom = '0';
               taskItem.style.paddingTop = '0';
               taskItem.style.paddingBottom = '0';
               taskItem.style.borderWidth = '0';
               setTimeout(() => {
                   taskItem.remove();
                   if (!elements.freeUpTaskList?.querySelector('.task-item')) {
                       elements.freeUpTaskList.innerHTML = `<li class="no-tasks-message">No tasks remaining for this day.</li>`;
                   }
               }, 350);
               refreshCurrentView().catch(e => console.error("Background refresh failed"));
               showCustomAlert('Task Snoozed', `Task snoozed for ${snoozeDuration}.`, 'info');
           } catch (error) {
               console.error(`Failed to snooze task ${taskId} from Free Up:`, error);
               showCustomAlert('Error', `Could not snooze task: ${error.message}`);
           }
     }
}


// --- Date/Time Picker Functions ---

/**
 * Initializes the date and time input fields with default values.
 */
function initDateInputs() {
     const today = new Date();
     // Set default date (today)
     if(elements.dueDate) elements.dueDate.value = formatDate(today, state.settings.dateFormat);

     // Set default time (e.g., next upcoming hour, or 9 AM)
     const defaultTime = new Date();
     defaultTime.setHours(defaultTime.getHours() + 1); // Next hour
     defaultTime.setMinutes(0); // Start of the hour
     defaultTime.setSeconds(0, 0);
     // Or set to a fixed time like 9 AM:
     // defaultTime.setHours(9, 0, 0, 0);

     // Update internal state for the time picker based on default time
     const defaultHour24 = defaultTime.getHours();
     state.selectedMinute = 0;
     if (state.settings.timeFormat === '12hr') {
         state.selectedAmPm = defaultHour24 >= 12 ? 'PM' : 'AM';
         state.selectedHour = defaultHour24 % 12 || 12; // Convert 0/12 to 12 for 12hr display
     } else {
         state.selectedHour = defaultHour24; // Use 0-23 for 24hr state
         state.selectedAmPm = '';
     }
     // Update the time input field value
     if(elements.dueTime) elements.dueTime.value = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);

     // Update the time picker display itself (if it exists)
     updateTimeDisplay();
 }

/**
 * Renders the calendar grid for the date picker modal. Highlights today's date.
 */
function renderPickerCalendar() {
    const calendarEl = elements.pickerCalendar;
    if (!calendarEl) return;
    calendarEl.innerHTML = ''; // Clear previous grid

    const firstDay = new Date(state.pickerYear, state.pickerMonth, 1);
    const daysInMonth = new Date(state.pickerYear, state.pickerMonth + 1, 0).getDate();
    const startDayIndex = firstDay.getDay(); // 0=Sun, 1=Mon...
    const today = new Date(); today.setHours(0, 0, 0, 0); // Today for highlighting

    // Add empty divs for days before the 1st of the month
    for (let i = 0; i < startDayIndex; i++) {
        calendarEl.appendChild(document.createElement('div'));
    }

    // Create divs for each day
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        const date = new Date(state.pickerYear, state.pickerMonth, day);
        date.setHours(0, 0, 0, 0); // Normalize date

        dayDiv.className = 'calendar-day picker-day'; // Base classes
        dayDiv.textContent = day;

        // --- FIX: Highlight today's date in the picker ---
        if (date.getTime() === today.getTime()) {
            dayDiv.classList.add('today'); // Apply 'today' style
        }
        // --- END FIX ---

        // Add click listener to select the date
        dayDiv.addEventListener('click', () => selectPickerDate(day));
        calendarEl.appendChild(dayDiv);
    }
    // Update the month/year display in the picker header
    if (elements.pickerMonthYear) {
        elements.pickerMonthYear.textContent = firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
}

/**
 * Handles selecting a date from the date picker modal.
 * Updates the main due date input field and closes the modal.
 * @param {number} day - The selected day number.
 */
function selectPickerDate(day) {
     const date = new Date(state.pickerYear, state.pickerMonth, day);
     if(elements.dueDate) {
         elements.dueDate.value = formatDate(date, state.settings.dateFormat); // Format based on settings
     }
     closeModal('datePickerModal');
 }

/**
 * Navigates the date picker modal to the previous month.
 */
function prevPickerMonth() {
    state.pickerMonth--;
    if (state.pickerMonth < 0) { state.pickerMonth = 11; state.pickerYear--; }
    renderPickerCalendar(); // Re-render the picker grid
}

/**
 * Navigates the date picker modal to the next month.
 */
function nextPickerMonth() {
    state.pickerMonth++;
    if (state.pickerMonth > 11) { state.pickerMonth = 0; state.pickerYear++; }
    renderPickerCalendar(); // Re-render the picker grid
}

/**
 * Opens the date picker modal, initializing it to the currently selected due date or today.
 */
function openDatePicker() {
     try {
         const currentVal = elements.dueDate?.value;
         if (currentVal) {
             // Use parseUIDateTime to handle different formats based on settings
             const date = parseUIDateTime(currentVal, "12:00 AM"); // Use dummy time
             if (date) {
                 state.pickerMonth = date.getMonth();
                 state.pickerYear = date.getFullYear();
             } else { throw new Error("Invalid date format in input"); }
         } else {
             // No current value, default to today's month/year
             const today = new Date();
             state.pickerMonth = today.getMonth();
             state.pickerYear = today.getFullYear();
         }
     } catch(e){
         // Fallback if parsing fails
         console.warn("Could not parse date input, defaulting picker to current month/year:", e.message);
         const today = new Date();
         state.pickerMonth = today.getMonth();
         state.pickerYear = today.getFullYear();
     }
     renderPickerCalendar(); // Render the grid for the determined month/year
     openModal('datePickerModal'); // Show the modal
 }

/**
 * Opens the time picker modal, initializing it based on the current due time input or defaults.
 */
function openTimePicker() {
    try {
        const currentVal = elements.dueTime?.value;
        if (currentVal) {
            // Use parseUIDateTime to handle 12/24hr format from input
            const parsed = parseUIDateTime("01/01/2000", currentVal); // Dummy date
            if (parsed) {
                const hour24 = parsed.getHours(); // parseUIDateTime gives 0-23
                state.selectedMinute = parsed.getMinutes();
                // Set internal picker state based on user settings
                if (state.settings.timeFormat === '12hr') {
                    state.selectedAmPm = hour24 >= 12 ? 'PM' : 'AM';
                    state.selectedHour = hour24 % 12 || 12; // 0/12 -> 12, 13->1 etc
                } else { // 24hr mode
                    state.selectedHour = hour24; // Directly use 0-23
                    state.selectedAmPm = ''; // No AM/PM for 24hr state
                }
            } else { throw new Error("Invalid time format in input"); }
        } else {
            // No current value, use defaults (e.g., 9 AM)
             state.selectedMinute = 0;
             if (state.settings.timeFormat === '12hr') {
                  state.selectedHour = 9;
                  state.selectedAmPm = 'AM';
             } else {
                  state.selectedHour = 9; // 9 for 24hr
                  state.selectedAmPm = '';
             }
        }
    } catch(e) {
        // Fallback if parsing fails - use initDateInputs to set defaults based on settings
         console.warn("Could not parse time input, resetting picker to default:", e.message);
         initDateInputs(); // Resets picker state (selectedHour/Minute/AmPm)
    }
    updateTimeDisplay(); // Update picker display based on current state
    openModal('timePickerModal'); // Show the modal
}

/**
 * Updates the time display within the time picker modal.
 */
function updateTimeDisplay() {
    // Update the main HH:MM display
    if(elements.timeDisplay) {
        elements.timeDisplay.textContent = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);
    }
    // Update the AM/PM button text (if it exists)
    if(elements.amPmDisplay) {
         elements.amPmDisplay.textContent = state.selectedAmPm;
    }
    // Show/hide the AM/PM toggle button based on format setting
    elements.toggleAmPmBtn?.parentElement.classList.toggle('hidden', state.settings.timeFormat === '24hr');
}

/**
 * Increments or decrements the hour in the time picker state. Handles 12/24hr wrapping.
 * @param {number} amount - Typically 1 or -1.
 */
function changeHour(amount) {
    let currentHour = state.selectedHour;
    let currentAmPm = state.selectedAmPm;

    // Convert current picker state to 24hr format for calculation
    let hour24;
    if (state.settings.timeFormat === '12hr') {
        hour24 = (currentAmPm === 'PM' && currentHour !== 12) ? currentHour + 12 : (currentAmPm === 'AM' && currentHour === 12) ? 0 : currentHour;
    } else {
         hour24 = currentHour; // Already 0-23
    }

    // Apply change and wrap around 24 hours
    hour24 = (hour24 + amount + 24) % 24;

    // Convert back to the picker's state format (12hr or 24hr)
     if (state.settings.timeFormat === '12hr') {
         state.selectedAmPm = hour24 >= 12 ? 'PM' : 'AM';
         state.selectedHour = hour24 % 12 || 12; // Convert 0 or 12 back to 12 for display
     } else {
         state.selectedHour = hour24; // Store as 0-23
         state.selectedAmPm = '';
     }
    updateTimeDisplay(); // Update the picker's visual display
}

/**
 * Increments or decrements the minute in the time picker state. Wraps around 60.
 * @param {number} amount - Typically 1 or -1 (could be 5 or 10 for faster changes).
 */
function changeMinute(amount) {
    state.selectedMinute = (state.selectedMinute + amount + 60) % 60; // Wrap around 60
    updateTimeDisplay();
}

/**
 * Toggles the AM/PM state and updates the button text in the time picker (12hr format only).
 */
function toggleAmPm() {
    if (state.settings.timeFormat === '12hr') {
        state.selectedAmPm = (state.selectedAmPm === 'AM') ? 'PM' : 'AM';
        // --- FIX: Update the button text itself ---
        if (elements.amPmDisplay) {
             elements.amPmDisplay.textContent = state.selectedAmPm;
        }
        // --- END FIX ---
        updateTimeDisplay(); // Update the main HH:MM display
    }
}

/**
 * Saves the time selected in the picker to the main due time input field.
 */
function saveSelectedTime() {
    if(elements.dueTime) {
        // Format the picker's state based on user settings and update the input
        elements.dueTime.value = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);
    }
    closeModal('timePickerModal');
}

// --- END OF PART 2 ---


// --- END OF PART 2 ---

// script.js - Organized and Updated - Part 3/3
// (Continuation from Part 2)

// --- UI & Navigation ---

/**
 * Shows the specified content section and hides others.
 * Updates the active state of the corresponding navigation item.
 * @param {string} sectionId - The ID of the section to show (e.g., 'today', 'addTask').
 */
async function showSection(sectionId) {
    console.log(`Attempting to show section: ${sectionId}`);
    const currentActiveNav = document.querySelector('.nav-item.active');
    const currentVisibleSection = document.querySelector('.section-content:not(.hidden)');
    console.log(`Current active nav: ${currentActiveNav?.id}, Current visible section: ${currentVisibleSection?.id}`);

    // Hide all main content sections first
    document.querySelectorAll('.main-content > .section-content').forEach(section => {
        section.classList.add('hidden');
    });
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Find the target section and nav item using the elements object
    const sectionElement = elements[`${sectionId}Section`];
    // Try finding nav item by convention (e.g., todayNav, addTaskNav)
    const navElement = elements[`${sectionId}Nav`];

    if (sectionElement) {
        sectionElement.classList.remove('hidden'); // Make the target section visible
        state.currentSection = sectionId; // Update the application state
        console.log(`Section ${sectionElement.id} should now be visible.`);

        // Highlight the corresponding nav item
        if (navElement) {
            navElement.classList.add('active');
            console.log(`Nav item ${navElement.id} set to active.`);
        } else {
            // Handle special cases like settings/help which might not have direct section counterparts
             if (sectionId === 'settings') elements.settingsNav?.classList.add('active');
             else if (sectionId === 'help') elements.helpNav?.classList.add('active');
             else console.warn(`Nav element not found for section: ${sectionId}`);
        }

        // Refresh data for the newly shown section
        console.log(`Refreshing view for ${sectionId}...`);
        await refreshCurrentView();

        // Set focus to the input field when switching to the Add Task section
        if (sectionId === 'add-task') {
            elements.taskInput?.focus();
        }

    } else if (sectionId !== 'settings' && sectionId !== 'help') {
        // If the target section element doesn't exist (and it's not settings/help)
        console.error(`!!! Section element not found for ID: ${sectionId}Section. Falling back to 'today'.`);
        await showSection('today'); // Fallback to the default section
        return;
    } else {
         // Handle settings/help - they might be modals, ensure nav item is active
         console.log(`Showing special section/modal: ${sectionId}`);
         if (sectionId === 'settings') elements.settingsNav?.classList.add('active');
         if (sectionId === 'help') elements.helpNav?.classList.add('active');
         // The actual display is handled by showSettingsModal() or showWalkthrough()
    }

    // Close mobile sidebar automatically when a section is selected
    if (window.innerWidth < 1024 && elements.sidebar?.classList.contains('active')) {
        elements.sidebar.classList.remove('active');
    }
    // Collapse expanded desktop sidebar when a section is selected (optional)
    // if (window.innerWidth >= 1024 && elements.sidebar?.classList.contains('expanded')) {
    //     elements.sidebar.classList.remove('expanded');
    //     state.sidebarExpanded = false;
    // }
}

/**
 * Refreshes the content of the currently visible section by re-rendering its data.
 */
async function refreshCurrentView() {
    console.log("Refreshing view:", state.currentSection);
    try {
        switch(state.currentSection) {
            case 'today':
                await renderTasks(); // Render today's list
                await renderUpcomingTasks(); // Render upcoming tasks widget
                updateGreeting(); // Refresh greeting
                updateMainDateDisplay(); // Refresh main date display
                break;
            case 'completed':
                await renderCompletedTasks(); // Render completed list
                break;
            case 'deleted':
                await renderDeletedTasks(); // Render deleted list
                break;
            case 'calendar':
                // Clear cache for the currently viewed month before re-rendering
                delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
                if (state.isDayView) {
                    await renderDayViewTasks(); // Render tasks for the specific day
                } else {
                    await renderCalendar(); // Render the monthly calendar grid
                }
                break;
            // 'add-task', 'settings', 'help' typically don't need data refresh on view switch
        }
        console.log("View refreshed successfully.");
    } catch (error) {
        console.error("Error refreshing current view:", error);
        showCustomAlert('Error', 'Could not refresh the view.');
    }

     // Optionally refresh parts of other views silently in the background if needed
     // Example: Keep upcoming tasks somewhat fresh even when not on 'today' view
     if (state.currentSection !== 'today') {
         renderUpcomingTasks().catch(e => console.warn("Silent upcoming refresh failed:", e));
     }
     // Example: Keep calendar cache relatively fresh (maybe less critical)
     // if (state.currentSection !== 'calendar') {
     //     delete state.taskCache[getCacheKey(state.currentYear, state.currentMonth)];
     // }
 }

// --- Filter Handlers ---

/**
 * Handles clicks on the upcoming task filter buttons.
 * Updates the state and re-renders the upcoming tasks list.
 * @param {Event} event - The click event object.
 */
function handleUpcomingFilterClick(event) {
    const button = event.target.closest('button[data-filter]');
    if (!button || !elements.upcomingTaskFilters) return; // Click wasn't on a filter button or container missing

    const newFilter = button.dataset.filter;
    if (newFilter === state.upcomingFilter) return; // No change if clicking the active filter

    console.log(`Upcoming filter changed to: ${newFilter}`);
    state.upcomingFilter = newFilter; // Update state

    // Update button visual styles
    elements.upcomingTaskFilters.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active-filter-style'); // Remove active style from all
    });
    button.classList.add('active-filter-style'); // Add active style to the clicked button

    // Reset expanded state when filter changes for better UX
    state.upcomingExpanded = false;

    // Re-render the upcoming tasks list with the new filter
    renderUpcomingTasks();
}

/**
 * Toggles the expanded/collapsed view of the upcoming tasks list.
 */
function toggleUpcomingExpand() {
    state.upcomingExpanded = !state.upcomingExpanded; // Toggle state flag
    console.log(`Upcoming tasks expanded: ${state.upcomingExpanded}`);
    // Just re-render; the render function uses the state flag to decide how many items to show
    renderUpcomingTasks();
}

/**
 * Toggles the sorting order for the 'Today' task list between time and priority.
 */
function toggleTodaySort() {
    // Switch the sort order state
    state.todaySortOrder = state.todaySortOrder === 'time' ? 'priority' : 'time';
    console.log(`Today sort order changed to: ${state.todaySortOrder}`);

    // Update the sort button text/icon for visual feedback
    const button = elements.todaySortControl;
    if (button) {
        // Example: Text indicates the *current* sort mode
        if (state.todaySortOrder === 'priority') {
            button.innerHTML = '<i class="fas fa-star mr-1"></i> Sorted by Priority';
            button.setAttribute('aria-label', 'Sort tasks by priority. Click to sort by time.');
        } else { // 'time'
            button.innerHTML = '<i class="fas fa-clock mr-1"></i> Sorted by Time';
            button.setAttribute('aria-label', 'Sort tasks by time. Click to sort by priority.');
        }
    }

    // Re-render the tasks for the current view if it's 'Today' or 'Day View'
    // as these are the views affected by this sort order
    if (state.currentSection === 'today' || (state.currentSection === 'calendar' && state.isDayView)) {
        refreshCurrentView();
    }
}

/**
 * Handles clicks on the completed task filter buttons.
 * Updates state and re-renders the completed tasks list.
 * @param {Event} event - The click event object.
 */
function handleCompletedFilterClick(event) {
    const button = event.target.closest('button[data-filter]');
     if (!button || !elements.completedFilters) return; // Not a filter button click

    const newFilter = button.dataset.filter;
    if (newFilter === state.completedFilter) return; // No change

    console.log(`Completed filter changed to: ${newFilter}`);
    state.completedFilter = newFilter; // Update state

    // Update button visual styles
    elements.completedFilters.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active-filter-style');
    });
    button.classList.add('active-filter-style');

    // Re-render the completed tasks list with the new filter
    renderCompletedTasks();
}


// --- Reminders & Alerts ---

/**
 * Checks the backend for tasks that are currently due and shows the alert modal if needed.
 */
async function checkDueTasks() {
    // Don't show alert if another modal (except the alert itself) is already open
    const isActiveModal = document.querySelector('.modal.active:not(#taskDueAlert)');
    if (isActiveModal) {
        console.log("Skipping due task check, another modal is active.");
        return;
    }

    try {
        // Fetch tasks that are due now or past due from the backend/mock
        const dueTasksArray = await apiRequest('/api/due_tasks');

        // Filter out tasks that are already being shown in the alert
        const newDueTasks = dueTasksArray.filter(dueTask =>
            !state.alertedTasks.some(alertedTask => alertedTask.id === dueTask.id)
        );

        if (newDueTasks.length > 0) {
            console.log(`Found ${newDueTasks.length} new due tasks.`);
            // Add new due tasks to the alerted list
            state.alertedTasks.push(...newDueTasks);
            // Show or update the alert modal
            showTaskDueAlert(state.alertedTasks); // Pass the full list to display
        } else if (state.alertedTasks.length === 0 && elements.taskDueAlert?.classList.contains('active')) {
            // If no tasks are due anymore and the alert is open, close it
            console.log("No more due tasks, closing alert modal.");
            closeModal('taskDueAlert');
        }
        // If there are tasks in state.alertedTasks but no *new* ones, the modal remains open showing the existing ones.
    } catch (error) {
        console.error("Failed to check for due tasks:", error);
        // Avoid showing an error alert for a background check failure
    }
}

/**
 * Displays the task due alert modal with the list of due tasks.
 * @param {Array} tasks - Array of task objects that are due.
 */
function showTaskDueAlert(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        // If somehow called with no tasks, ensure modal is closed
        if (elements.taskDueAlert?.classList.contains('active')) {
             closeModal('taskDueAlert');
        }
        return;
    }
    console.log(`Showing/Updating due alert for ${tasks.length} task(s).`);
    state.alertedTasks = tasks; // Ensure state is up-to-date

    // Determine highest priority for border color
    const prioMap = {'priority-high': 3, 'priority-medium': 2, 'priority-low': 1};
    let highestPrioValue = 0;
    tasks.forEach(task => { highestPrioValue = Math.max(highestPrioValue, prioMap[task.priority || 'priority-low'] || 0); });
    let alertClass = 'border-green-500'; // Default border
    if (highestPrioValue === 3) alertClass = 'border-red-500';
    else if (highestPrioValue === 2) alertClass = 'border-yellow-500';

    // Update modal title
    if(elements.dueTitle) { elements.dueTitle.textContent = tasks.length > 1 ? "Multiple Tasks Due!" : "Task Due!"; }

    // Populate task list within the modal
    const listEl = elements.dueAlertTaskList;
    if (listEl) {
        listEl.innerHTML = ''; // Clear previous items
        tasks.forEach(task => {
            // Create list item using standard function, 'alert' type hides delete button
            const item = createTaskListItem(task, 'alert');
            // Make buttons slightly smaller within the alert if needed
            // const actions = item.querySelector('.task-actions');
            // if (actions) {
            //     actions.querySelectorAll('.action-btn').forEach(btn => { btn.classList.add('text-sm', 'p-1'); btn.classList.remove('btn-icon'); });
            // }
            listEl.appendChild(item);
        });
    }

    // Apply priority border color
    const modalContent = elements.taskDueAlert?.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('border-red-500', 'border-yellow-500', 'border-green-500'); // Remove old border colors
        modalContent.classList.add('border-4', alertClass); // Add new border color
    }

    // Show/hide "Complete All" button
    elements.completeAllDueBtn?.classList.toggle('hidden', tasks.length <= 1);

    // Open the modal if not already active
    if (!elements.taskDueAlert?.classList.contains('active')) {
        openModal('taskDueAlert');
    }
}

/**
 * Handles the "Complete All" button click in the task due alert.
 */
async function completeAllDueTasks() {
     console.log("Completing all alerted tasks...");
     const tasksToComplete = [...state.alertedTasks]; // Copy the array
     closeModal('taskDueAlert'); // Close modal immediately
     state.alertedTasks = []; // Clear the alerted state

     // Process completions asynchronously
     for (const task of tasksToComplete) {
         await completeSingleTask(task.id); // Use existing function
     }
     await refreshCurrentView(); // Refresh the main UI
}

// --- Modals ---

/**
 * Opens a modal dialog by adding the 'active' class.
 * @param {string} modalId - The ID of the modal element to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active'); // Assumes CSS uses .active to display
        console.log(`Modal opened: ${modalId}`);
        // Scroll modal content to top when opened (useful for settings/long modals)
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
             modalContent.scrollTop = 0;
        }
    } else {
        console.error(`Modal element not found for ID: ${modalId}`);
    }
}

/**
 * Closes a modal dialog by removing the 'active' class.
 * Also resets any related state variables.
 * @param {string} modalId - The ID of the modal element to close.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        console.log(`Modal closed: ${modalId}`);

        // Reset specific states when modals close
        if (modalId === 'deleteConfirmModal') state.taskToDelete = null;
        if (modalId === 'restoreConfirmModal') state.taskToRestore = null;
        if (modalId === 'permanentDeleteModal') state.taskToDeletePermanently = null;
        if (modalId === 'completeRecurringConfirmModal') { state.taskToComplete = null; state.completeSeries = false; }
        if (modalId === 'taskDueAlert') {
             // Clear border and alerted tasks state when alert is manually closed
             modal?.querySelector('.modal-content')?.classList.remove('border-4', 'border-red-500', 'border-yellow-500', 'border-green-500');
             state.alertedTasks = [];
        }
        // Reset countdown button if closing confirmation modal manually
        if (modalId === 'deleteAllCompletedConfirmModal') {
             const confirmBtn = elements.confirmDeleteAllCompletedBtn;
             if (confirmBtn?.dataset.countdownInterval) {
                 clearInterval(parseInt(confirmBtn.dataset.countdownInterval));
                 confirmBtn.disabled = false;
                 confirmBtn.textContent = 'Delete All';
                 delete confirmBtn.dataset.countdownInterval;
             }
        }
        // Add resets for other confirmation modals if needed
    } else {
         console.warn(`Modal element not found for ID: ${modalId} during close operation.`);
    }
}

/**
 * Shows a custom alert modal with a title and message.
 * @param {string} title - The title for the alert.
 * @param {string} message - The message content.
 * @param {'info'|'success'|'error'} [type='error'] - The type of alert for styling.
 */
function showCustomAlert(title, message, type = 'error') {
     if (!elements.customAlertModal || !elements.customAlertTitle || !elements.customAlertMessage) {
          console.error("Custom alert modal elements not found. Alert:", title, message);
          alert(`${title}\n${message}`); // Fallback to browser alert
          return;
     }
     elements.customAlertTitle.textContent = title;
     elements.customAlertMessage.textContent = message;
     const modalContent = elements.customAlertModal.querySelector('.modal-content');
     // Apply border color based on type
     modalContent?.classList.remove('border-red-500', 'border-green-500', 'border-blue-500'); // Clear previous
     modalContent?.classList.add('border-2'); // Ensure base border style
     if (type === 'success') modalContent?.classList.add('border-green-500');
     else if (type === 'info') modalContent?.classList.add('border-blue-500');
     else modalContent?.classList.add('border-red-500'); // Default to error red

     openModal('customAlertModal');
}


// --- Walkthrough ---
// (Includes updateWalkthrough, positionTooltip, next/prev/show/close Walkthrough)

/**
 * Updates the walkthrough tooltip content and highlights the target element for the current step.
 */
function updateWalkthrough() {
    if (state.walkthroughStep < 0 || state.walkthroughStep >= state.walkthroughSteps.length) {
        return closeWalkthrough(); // End if step is out of bounds
    }
    const step = state.walkthroughSteps[state.walkthroughStep];
    console.log(`Walkthrough step ${state.walkthroughStep}: ${step.title}`);
    const tooltip = elements.walkthroughTooltip;
    const overlay = elements.walkthroughOverlay;
    if (!tooltip || !overlay) { console.error("Walkthrough elements missing"); return; }

    // Update tooltip content
    if(elements.walkthroughTitle) elements.walkthroughTitle.innerHTML = step.title; // Use innerHTML for potential icons
    if(elements.walkthroughContent) elements.walkthroughContent.innerHTML = step.content;

    // Show/hide Previous button
    if(elements.walkthroughPrevBtn) elements.walkthroughPrevBtn.style.visibility = state.walkthroughStep === 0 ? 'hidden' : 'visible';

    // Update Next/Finish button text
    const nextBtn = elements.walkthroughNextBtn;
    if(nextBtn) {
        const isLastStep = state.walkthroughStep === state.walkthroughSteps.length - 1;
        const isSetupStep = step.isSetupStep; // Check if it's part of initial setup
        if (isSetupStep) nextBtn.innerHTML = `Next <i class="fas fa-arrow-right ml-2"></i>`; // Always 'Next' during setup
        else nextBtn.innerHTML = `${isLastStep ? 'Finish' : 'Next'} <i class="fas ${isLastStep ? 'fa-check' : 'fa-arrow-right'} ml-2"></i>`;
    }

    // Show overlay and tooltip
    overlay.classList.add('active');
    tooltip.classList.remove('hidden');

    // Clear previous highlight
    document.querySelectorAll('.walkthrough-highlight').forEach(el => {
        el.classList.remove('walkthrough-highlight');
        el.style.zIndex = ''; // Reset z-index
    });

    // Find and highlight the target element for this step
    const targetElement = step.targetElement ? document.querySelector(step.targetElement) : null;
    tooltip.style.position = 'fixed'; // Ensure fixed position for calculations

    if (targetElement) {
        // Scroll target into view smoothly
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        // Wait slightly for scroll to finish before highlighting and positioning
        setTimeout(() => {
            targetElement.classList.add('walkthrough-highlight'); // Apply highlight style
            targetElement.style.zIndex = '1061'; // Ensure target is above overlay temporarily
            positionTooltip(tooltip, targetElement); // Position tooltip relative to target
        }, 350); // Adjust delay if needed
    } else {
        // No target element, center the tooltip on the screen
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }

    // Ensure the correct section/modal is visible for the step
    if (step.section === 'settings' && !elements.settingsModal?.classList.contains('active')) {
        showSettingsModal(step.isSetupStep || false); // Show settings modal if needed
    } else if (step.section && state.currentSection !== step.section) {
        // If step requires a different section, switch to it
        if (state.currentSection === 'settings' && step.section !== 'settings') closeModal('settingsModal');
        showSection(step.section);
    } else if (step.section !== 'settings' && elements.settingsModal?.classList.contains('active')) {
         // Close settings modal if the step moves away from it
         closeModal('settingsModal');
    }
}

/**
 * Positions the walkthrough tooltip relative to a target element.
 * Tries to place it below, then above, then beside the target.
 * @param {HTMLElement} tooltip - The tooltip element.
 * @param {HTMLElement} target - The target element to position relative to.
 */
function positionTooltip(tooltip, target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 15; // Space between tooltip and target
    let top, left;

    // Try below target first
    top = targetRect.bottom + margin;
    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    // If it goes off bottom, try above
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = targetRect.top - tooltipRect.height - margin;
    }

    // If it still goes off top/bottom, try beside (right first)
    if (top < margin) {
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2); // Center vertically
        left = targetRect.right + margin;
        // If it goes off right, try left
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = targetRect.left - tooltipRect.width - margin;
        }
    }

    // Ensure tooltip stays within viewport boundaries horizontally
    if (left < margin) left = margin;
    if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
    }
    // Ensure tooltip stays within viewport boundaries vertically
     if (top < margin) top = margin;
     if (top + tooltipRect.height > window.innerHeight - margin) {
          top = window.innerHeight - tooltipRect.height - margin;
     }


    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.transform = ''; // Remove centering transform if applied previously
}

/**
 * Moves to the next step in the walkthrough.
 */
function nextWalkthroughStep() {
    const currentStep = state.walkthroughSteps[state.walkthroughStep];
    // Special handling for finishing setup steps
    if (currentStep.isSetupStep && state.walkthroughStep === 1) { // Assuming step 1 is last setup step
        finishFirstTimeSetup(); // This closes settings and starts main walkthrough
        return; // Don't increment step here
    }

    if (state.walkthroughStep < state.walkthroughSteps.length - 1) {
        state.walkthroughStep++;
        updateWalkthrough();
    } else {
        closeWalkthrough(); // Finish walkthrough on last step
    }
}

/**
 * Moves to the previous step in the walkthrough.
 */
function prevWalkthroughStep() {
    if (state.walkthroughStep > 0) {
        state.walkthroughStep--;
        updateWalkthrough();
    }
}

/**
 * Starts the walkthrough from the appropriate step.
 */
function showWalkthrough() {
    // Start from beginning if first visit, otherwise skip intro steps
    state.walkthroughStep = state.settings.firstVisit ? 0 : 2;
    updateWalkthrough();
}

/**
 * Closes the walkthrough overlay and tooltip, and cleans up highlights.
 */
function closeWalkthrough() {
    console.log("Closing walkthrough");
    // Explicitly find and remove highlight class from ANY element
    const highlightedElement = document.querySelector('.walkthrough-highlight');
    if (highlightedElement) {
        highlightedElement.classList.remove('walkthrough-highlight');
        highlightedElement.style.zIndex = ''; // Reset z-index if set
        console.log("Removed highlight from:", highlightedElement);
    }
    // Ensure overlay and tooltip are hidden
    elements.walkthroughOverlay?.classList.remove('active');
    elements.walkthroughTooltip?.classList.add('hidden');

    // Close settings modal only if it was opened by the walkthrough step being closed
    const currentStep = state.walkthroughSteps[state.walkthroughStep];
    if (elements.settingsModal?.classList.contains('active') && currentStep?.targetElement?.includes('#settingsModal')) {
        closeModal('settingsModal');
    }
    // Reset step counter (optional)
    // state.walkthroughStep = 0;
}


// --- Event Delegation Handler ---

/**
 * Main event handler for actions on task items within various lists.
 * Uses event delegation to handle clicks efficiently.
 * @param {Event} event - The click event object.
 */
function handleTaskAction(event) {
    const button = event.target.closest('button'); // Find the nearest button ancestor
    if (!button) return; // Exit if click wasn't on or inside a button

    const taskItem = button.closest('.task-item'); // Find the parent task item
    const taskId = taskItem?.dataset.taskId; // Get task ID from data attribute
    const label = button.getAttribute('aria-label') || ''; // Get aria-label for action type
    const snoozeDuration = button.dataset.snooze; // Check for snooze duration data
    const isInAlertModal = button.closest('#taskDueAlert'); // Check if click is inside the alert
    const isInFreeUpModal = button.closest('#freeUpScheduleModal'); // Check if click is inside free up modal

    // --- Handle actions inside Task Due Alert ---
    if (isInAlertModal && taskId) {
        if (label.includes('Mark as complete')) {
            console.log(`Completing task ${taskId} from alert.`);
            completeTaskFromAlert(taskId, taskItem); // Use specific alert handler
            return; // Stop further processing
        } else if (button.classList.contains('snooze-btn') || label.includes('Snooze task')) {
            showSnoozeOptions(event); // Show snooze options within the alert
            return;
        } else if (snoozeDuration) {
             snoozeTaskFromAlert(taskId, snoozeDuration, taskItem); // Use specific alert snooze handler
             return;
        }
    }
    // --- Handle actions inside Free Up Schedule Modal ---
    // (Already handled by the separate handleFreeUpTaskAction listener attached dynamically)
    // else if (isInFreeUpModal && taskId) { ... } // No need for duplicate logic here

    // --- Handle Bulk Actions (buttons outside task items) ---
    else if (button.id === 'completeAllDueBtn') {
        completeAllDueTasks();
    }
    // --- Handle Standard Task Actions (in main lists, day view, etc.) ---
    else if (taskId) {
        if (label.includes('Mark as complete')) {
            markTaskComplete(taskId);
        } else if (label.includes('Delete task')) {
            showDeleteConfirm(taskId);
        } else if (label.includes('Restore task')) {
            showRestoreConfirm(taskId);
        } else if (label.includes('Permanently delete task')) {
            showPermanentDeleteConfirm(taskId);
        } else if (button.classList.contains('snooze-btn') || label.includes('Snooze task')) {
            showSnoozeOptions(event); // Show snooze options for regular task items
        } else if (snoozeDuration) {
            snoozeTask(event); // Handle snooze duration click for regular task items
        }
    }
}


// --- Initialize App ---
// Use DOMContentLoaded to ensure the DOM is fully loaded and parsed
// before running the main initialization script.
document.addEventListener('DOMContentLoaded', initApp);

// --- Global Functions Exposure (Optional) ---
// If using inline onclick="" attributes in HTML (legacy), expose functions globally.
// It's generally better to rely on event listeners attached in setupEventListeners.
// window.addTask = addTask;
// window.markTaskComplete = markTaskComplete;
// ... etc.


// Configuration, settings, and app state management extracted from script.js

// --- Application State ---
export const state = {
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
    selectedHour: 12,
    selectedMinute: 0,
    selectedAmPm: 'PM',
    alertedTasks: [],
    taskToDelete: null,
    taskToRestore: null,
    taskToDeletePermanently: null,
    taskToComplete: null,
    completeSeries: false,
    taskToSnooze: null,
    userName: '',
    customRepeatDays: [],
    taskCache: {},
    upcomingFilter: 'next7',
    upcomingExpanded: false,
    todaySortOrder: 'time',
    completedFilter: 'all',
    clockIntervalId: null,
    mainDateIntervalId: null,
    walkthroughStep: 0,
    walkthroughSteps: [
        { title: "Welcome & Setup", content: "Welcome to ManageMe! Let's quickly configure some display settings.", section: 'settings', targetElement: '#settingsModal .modal-content', isSetupStep: true },
        { title: "Display Options", content: "Choose your preferred font size, color theme, display mode (Light/Dark/High Contrast), and time/date formats.", section: 'settings', targetElement: '#settingsAppearanceOptions', isSetupStep: true },
        { title: "Tutorial Start", content: "Great! Settings saved. This short tutorial guides you through the main features. Click Next.", section: 'today', targetElement: null },
        { title: "Today's Tasks", content: "This is your main screen. It shows tasks due today, sorted by time or priority. Your next upcoming task is also summarized.", section: 'today', targetElement: '#todaySection' },
        { title: "Upcoming Tasks Filters", content: "Use these buttons to filter the upcoming tasks list (Next 7/30/365 days or All). Click the expand button to see more.", section: 'today', targetElement: '#upcomingTaskFilters' },
        { title: "Add Task", content: "Add new tasks here. Fill in the details, including description, date, time, priority, and repetition.", section: 'addTask', targetElement: '#addTaskSection .form-container' },
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
export const elements = {}; // Will be populated in app init

export function getElement(id) {
    const el = document.getElementById(id);
    return el;
}

// --- Settings Management ---
export function loadSettings() {
    const savedSettings = localStorage.getItem('manageMeSettings');
    const defaultSettings = {
        fontSize: 'base', theme: 'green', contrast: 'default',
        timeFormat: '12hr', dateFormat: 'DDMMYYYY', firstVisit: true
    };

    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            state.settings = { ...defaultSettings, ...parsedSettings };
            state.settings.firstVisit = typeof state.settings.firstVisit === 'boolean' ? state.settings.firstVisit : true;
        } catch (e) {
            console.error("Failed to parse settings, using defaults.", e);
            localStorage.removeItem('manageMeSettings');
            state.settings = { ...defaultSettings };
        }
    } else {
        state.settings = { ...defaultSettings };
    }
    console.log("Loaded settings:", state.settings);
}

export function saveSettings() {
    try {
        localStorage.setItem('manageMeSettings', JSON.stringify(state.settings));
        console.log("Settings saved:", state.settings);
    } catch (e) {
        console.error("Failed to save settings.", e);
        // showCustomAlert('Error', 'Could not save settings.');
    }
}

export function applySettings() {
    console.log("Applying settings:", state.settings);
    const body = document.body;
    const root = document.documentElement;

    // 1. Apply Font Size
    body.className = body.className.replace(/font-size-(sm|base|lg|xl)\b/g, '').trim();
    body.classList.add(`font-size-${state.settings.fontSize || 'base'}`);

    // 2. Apply Display Mode (Contrast/Dark)
    body.classList.remove('high-contrast', 'dark-mode');
    if (state.settings.contrast === 'high-contrast') {
        body.classList.add('high-contrast');
    } else if (state.settings.contrast === 'dark-mode') {
        body.classList.add('dark-mode');
    }

    // 3. Apply Color Theme (Primary Color) & Update Theme Buttons
    const isDefaultContrast = state.settings.contrast === 'default';
    document.querySelectorAll('#colorThemeSelector button').forEach(button => {
        button.disabled = !isDefaultContrast;
        button.style.opacity = isDefaultContrast ? '1' : '0.5';
        button.style.cursor = isDefaultContrast ? 'pointer' : 'not-allowed';
        if (!isDefaultContrast) button.classList.remove('selected');
    });

    if (isDefaultContrast) {
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
        updateThemeSelectionUI();
    }

    if(elements.settingFontSize) elements.settingFontSize.value = state.settings.fontSize;
    if(elements.settingContrast) elements.settingContrast.value = state.settings.contrast;
    if(elements.settingTimeFormat) elements.settingTimeFormat.value = state.settings.timeFormat;
    if(elements.settingDateFormat) elements.settingDateFormat.value = state.settings.dateFormat;
}

export function updateThemeSelectionUI() {
    if (state.settings.contrast === 'default') {
        const currentTheme = state.settings.theme;
        document.querySelectorAll('#colorThemeSelector button').forEach(button => {
            button.classList.toggle('selected', button.dataset.theme === currentTheme);
            button.style.backgroundColor = button.dataset.themeColor || '';
        });
    }
}
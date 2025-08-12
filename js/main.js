// Main application entry point and initialization logic

import { state, elements, getElement } from './config.js';
import { loadSettings, saveSettings, applySettings, updateThemeSelectionUI } from './config.js';
import { updateClock, updateMainDateDisplay, updateGreeting, toggleSidebar, toggleSidebarExpanded, showSection, openModal, closeModal, showCustomAlert } from './ui.js';
import { setupEventListeners } from './listeners.js';
import { initSTT, startListening, processTranscriptForField, parseFrequencyNaturalLanguage } from './stt.js';
import { initDateInputs, renderPickerCalendar, selectPickerDate, prevPickerMonth, nextPickerMonth, openDatePicker, openTimePicker, updateTimeDisplay, changeHour, changeMinute, toggleAmPm, saveSelectedTime } from './pickers.js';
import { checkDueTasks, showTaskDueAlert, completeAllDueTasks } from './reminders.js';
import { showWelcomeOrSetup, finishFirstTimeSetup, saveUserNameAndSetup, showSettingsModal } from './user.js';
import { escapeHtml, formatDate, formatTime, parseUIDateTime, getCacheKey } from './utils.js';
import { fetchTasksForMonth, checkShowReturnToToday, renderCalendar, showDayView, renderDayViewTasks, prevMonth, nextMonth, prevYear, nextYear, returnToTodayCalendar, prevDay, nextDay, showCalendarView, addTaskForSelectedDay, showFreeUpScheduleModal, handleFreeUpTaskAction } from './calendar.js';
import { handleUpcomingFilterClick, toggleUpcomingExpand, toggleTodaySort, handleCompletedFilterClick } from './filters.js';
import { createTaskListItem } from './taskRenderer.js';
import { markTaskComplete, completeSingleTask, confirmDeleteTask, confirmRestoreTask, confirmPermanentDelete, snoozeTask, confirmDeleteAllCompleted, confirmRestoreAll, confirmDeleteAllPermanently, showSnoozeOptions, showDeleteConfirm, showRestoreConfirm, showPermanentDeleteConfirm } from './taskActions.js';
import { addTask, resetAddTaskForm, handleRepeatFrequencyChange, handleRepeatUntilChange, toggleRepeatDay } from './taskManager.js';
import { apiRequest } from './api.js';
import { showWalkthrough, updateWalkthrough, nextWalkthroughStep, prevWalkthroughStep, closeWalkthrough } from './walkthrough.js';

// Define the handlers object that bundles all functions
const handlers = {
    // UI & App Flow
    showSection, openModal, closeModal, showCustomAlert, updateClock, updateMainDateDisplay,
    updateGreeting, toggleSidebar, toggleSidebarExpanded,
    // User & Settings
    loadSettings, saveSettings, applySettings, updateThemeSelectionUI, showWelcomeOrSetup,
    finishFirstTimeSetup, saveUserNameAndSetup, showSettingsModal,
    // Tasks & Actions
    addTask, resetAddTaskForm, markTaskComplete, completeSingleTask, confirmDeleteTask, confirmRestoreTask,
    confirmPermanentDelete, snoozeTask, confirmDeleteAllCompleted, confirmRestoreAll, confirmDeleteAllPermanently,
    showSnoozeOptions, showDeleteConfirm, showRestoreConfirm, showPermanentDeleteConfirm, handleTaskAction,
    // Calendar & Views
    fetchTasksForMonth, checkShowReturnToToday, renderCalendar, showDayView, renderDayViewTasks, showCalendarView,
    prevMonth, nextMonth, prevYear, nextYear, prevDay, nextDay, returnToTodayCalendar,
    addTaskForSelectedDay, showFreeUpScheduleModal, handleFreeUpTaskAction,
    // Forms & Pickers
    handleRepeatFrequencyChange, handleRepeatUntilChange, toggleRepeatDay, initDateInputs,
    renderPickerCalendar, selectPickerDate, prevPickerMonth, nextPickerMonth, openDatePicker,
    openTimePicker, updateTimeDisplay, changeHour, changeMinute, toggleAmPm, saveSelectedTime,
    // Filters
    handleUpcomingFilterClick, toggleUpcomingExpand, toggleTodaySort, handleCompletedFilterClick,
    // Reminders & Alerts
    checkDueTasks, showTaskDueAlert, completeAllDueTasks,
    // Walkthrough
    showWalkthrough, updateWalkthrough, nextWalkthroughStep, prevWalkthroughStep, closeWalkthrough,
    // STT
    initSTT, startListening, processTranscriptForField, parseFrequencyNaturalLanguage,
    // API
    apiRequest,
    // Utils
    escapeHtml, formatDate, formatTime, parseUIDateTime, getCacheKey, createTaskListItem
};

// This function acts as a global entry point for event listeners and other modules that need to trigger a full refresh.
async function refreshCurrentView() {
    console.log("Refreshing view:", state.currentSection);
    try {
        switch(state.currentSection) {
            case 'today':
                // Your rendering functions for the 'today' section
                break;
            case 'completed':
                // Your rendering functions for the 'completed' section
                break;
            case 'deleted':
                // Your rendering functions for the 'deleted' section
                break;
            case 'calendar':
                delete state.taskCache[handlers.getCacheKey(state.currentYear, state.currentMonth)];
                if (state.isDayView) {
                    await handlers.renderDayViewTasks(handlers);
                } else {
                    await handlers.renderCalendar(handlers);
                }
                break;
        }
    } catch (error) {
        console.error("Error refreshing current view:", error);
        handlers.showCustomAlert('Error', 'Could not refresh the view.');
    }
}

// Global handleTaskAction function to manage event delegation.
async function handleTaskAction(event) {
    const button = event.target.closest('button');
    const taskItem = button?.closest('.task-item');
    const taskId = taskItem?.dataset.taskId;
    const actionLabel = button?.getAttribute('aria-label');
    if (!taskId) return;

    if (actionLabel?.includes('Mark as complete')) {
        await handlers.markTaskComplete(taskId, handlers);
    } else if (actionLabel?.includes('Snooze task')) {
        handlers.showSnoozeOptions(event, handlers);
    } else if (actionLabel?.includes('Delete task')) {
        handlers.showDeleteConfirm(taskId, handlers);
    } else if (actionLabel?.includes('Restore task')) {
        handlers.showRestoreConfirm(taskId, handlers);
    } else if (actionLabel?.includes('Permanently delete task')) {
        handlers.showPermanentDeleteConfirm(taskId, handlers);
    }
}

// Initializing the application once the DOM is fully loaded.
function initApp() {
    console.log("Initializing App...");
    const elementIds = [
        'welcomeScreen', 'userNameInput', 'saveUserNameBtn', 'sidebar', 'sidebarTitleHeader', 'mobileMenuButton', 'sidebarClock', 'sidebarDate', 'mainContentArea', 'todayNav', 'addTaskNav', 'calendarNav', 'completedNav', 'deletedNav', 'settingsNav', 'helpNav', 'todaySection', 'addTaskSection', 'calendarSection', 'completedSection', 'deletedSection', 'greetingText', 'mainDateDisplay', 'upcomingTaskContainer', 'upcomingTaskContent', 'upcomingTaskFilters', 'upcomingExpandBtn', 'todaySortControl', 'taskCount', 'taskList', 'taskInput', 'dueDate', 'dueTime', 'openDatePickerBtn', 'openTimePickerBtn', 'taskPriority', 'repeatFrequency', 'customRepeatOptions', 'repeatContainer', 'repeatUntilContainer', 'repeatUntilDate', 'repeatUntilSelect', 'addTaskBtn', 'calendar', 'calendarMonthYear', 'calendarYearNav', 'prevYearBtn', 'nextYearBtn', 'calendarYearDisplay', 'calendarTitle', 'calendarBackBtn', 'calendarNavContainer', 'prevMonthBtn', 'nextMonthBtn', 'returnToTodayBtn', 'dayView', 'dayViewTitle', 'dayViewTaskList', 'addTaskForDayBtn', 'dayViewNav', 'prevDayBtn', 'nextDayBtn', 'dayViewDateDisplay', 'freeUpScheduleBtn', 'completedList', 'completedFilters', 'deleteAllCompletedBtn', 'deletedList', 'restoreAllBtn', 'deleteAllPermanentlyBtn', 'modalsContainer', 'datePickerModal', 'pickerCalendar', 'pickerMonthYear', 'prevPickerMonthBtn', 'nextPickerMonthBtn', 'cancelDatePickerBtn', 'timePickerModal', 'timeDisplay', 'amPmDisplay', 'increaseHourBtn', 'decreaseHourBtn', 'increaseMinuteBtn', 'decreaseMinuteBtn', 'toggleAmPmBtn', 'saveTimeBtn', 'cancelTimePickerBtn', 'taskDueAlert', 'dueTitle', 'dueAlertTaskList', 'completeAllDueBtn', 'closeAlertBtn', 'deleteConfirmModal', 'deleteTaskText', 'confirmDeleteBtn', 'cancelDeleteBtn', 'restoreConfirmModal', 'restoreTaskText', 'confirmRestoreBtn', 'cancelRestoreBtn', 'permanentDeleteModal', 'permanentDeleteTaskText', 'confirmPermanentDeleteBtn', 'cancelPermanentDeleteBtn', 'completeRecurringConfirmModal', 'completeRecurringText', 'confirmCompleteSingleBtn', 'confirmCompleteSeriesBtn', 'cancelCompleteRecurringBtn', 'deleteAllCompletedConfirmModal', 'confirmDeleteAllCompletedBtn', 'cancelDeleteAllCompletedBtn', 'deleteAllPermanentlyConfirmModal', 'confirmDeleteAllPermanentlyBtn', 'cancelDeleteAllPermanentlyBtn', 'restoreAllConfirmModal', 'confirmRestoreAllBtn', 'cancelRestoreAllBtn', 'settingsModal', 'settingsAppearanceOptions', 'settingFontSize', 'settingContrast', 'colorThemeSelector', 'settingTimeFormat', 'settingDateFormat', 'saveSettingsBtn', 'settingsDoneButton', 'settingsBackBtn', 'walkthroughOverlay', 'walkthroughTooltip', 'walkthroughTitle', 'walkthroughContent', 'walkthroughPrevBtn', 'walkthroughNextBtn', 'closeWalkthroughBtn', 'customAlertModal', 'customAlertTitle', 'customAlertMessage', 'customAlertCloseBtn', 'sttBtnDescription', 'sttStatusDescription', 'sttBtnDateTime', 'sttStatusDateTime', 'sttBtnFrequency', 'sttStatusFrequency', 'freeUpScheduleModal', 'freeUpTaskList', 'freeUpDate'
    ];
    elementIds.forEach(id => {
        if (id) {
            elements[id] = getElement(id);
        }
    });

    if (state.clockIntervalId) clearInterval(state.clockIntervalId);
    if (state.mainDateIntervalId) clearInterval(state.mainDateIntervalId);
    handlers.updateClock(handlers);
    handlers.updateMainDateDisplay(handlers);
    state.clockIntervalId = setInterval(() => handlers.updateClock(handlers), 1000);
    state.mainDateIntervalId = setInterval(() => handlers.updateMainDateDisplay(handlers), 60000);

    try {
        handlers.loadSettings();
        state.userName = localStorage.getItem('userName') || '';
        elements.saveUserNameBtn?.addEventListener('click', () => handlers.saveUserNameAndSetup(handlers));
        elements.settingsDoneButton?.addEventListener('click', () => handlers.finishFirstTimeSetup(handlers));

        if (!state.userName || state.settings.firstVisit) {
            handlers.showWelcomeOrSetup(handlers);
        } else {
            handlers.applySettings();
            elements.welcomeScreen?.classList.add('hidden');
            if (elements.welcomeScreen) {
                elements.welcomeScreen.style.display = 'none';
            }
            handlers.updateGreeting(handlers);
            handlers.setupEventListeners(elements, state, handlers);
            handlers.initDateInputs(elements, state, handlers.formatDate, handlers.formatTime, handlers.updateTimeDisplay);
            handlers.showSection('today', handlers);
            setInterval(() => handlers.checkDueTasks(handlers), 60000);
            handlers.checkDueTasks(handlers);
            console.log("App Initialized Successfully (Regular Start)");
            if (typeof handlers.initSTT === 'function') {
                console.log(">>> initApp: Initializing STT...");
                handlers.initSTT();
            } else {
                console.warn("initSTT function not found (stt.js might not be loaded correctly?)");
            }
        }
    } catch (error) {
        console.error("Error during app initialization:", error);
        document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: red;"><h1>Application Error</h1><p>Sorry, the application could not start correctly. Please try refreshing the page.</p><p>Error details: ${handlers.escapeHtml(error.message)}</p></div>`;
    }
}
document.addEventListener('DOMContentLoaded', initApp);
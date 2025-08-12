// Event listeners setup extracted from script.js

/**
 * Attaches all necessary event listeners to DOM elements.
 */
export function setupEventListeners(elements, state, handlers) {
    // Welcome Screen
    elements.saveUserNameBtn?.addEventListener('click', handlers.saveUserNameAndSetup);

    // Sidebar & Mobile Menu
    elements.mobileMenuButton?.addEventListener('click', (e) => { e.stopPropagation(); handlers.toggleSidebar(); });
    elements.sidebarTitleHeader?.addEventListener('click', (e) => { e.stopPropagation(); handlers.toggleSidebarExpanded(); });

    // Global click listener for closing sidebar/menus
    document.addEventListener('click', (e) => {
        if (elements.sidebar?.classList.contains('active')) {
            if (!elements.sidebar.contains(e.target) && !elements.mobileMenuButton?.contains(e.target)) {
                elements.sidebar.classList.remove('active');
            }
        } else if (window.innerWidth > 1024 && elements.sidebar?.classList.contains('expanded')) {
            if (!elements.sidebar.contains(e.target)) {
                elements.sidebar.classList.remove('expanded');
                state.sidebarExpanded = false;
            }
        }
        const visibleSnooze = document.querySelector('.snooze-options:not(.hidden)');
        if (visibleSnooze && !visibleSnooze.contains(e.target) && !e.target.closest('.snooze-btn')) {
            visibleSnooze.classList.add('hidden');
        }
    });

    // Sidebar Navigation (Event Delegation)
    const sidebarNav = document.querySelector('.sidebar-nav');
    const sidebarFooterNav = document.querySelector('.sidebar-footer-nav');
    function handleNavClick(event) {
        const button = event.target.closest('button.nav-item');
        if (!button) return;
        const sectionId = button.id.replace('Nav', '');
        if (sectionId === 'settings') {
            handlers.showSettingsModal(false);
        } else if (sectionId === 'help') {
            handlers.showWalkthrough();
        } else if (sectionId === 'calendar') {
            if (state.isDayView) { handlers.returnToTodayCalendar(); }
            else { handlers.showSection('calendar'); }
        }
        else if (elements[`${sectionId}Section`]) {
            handlers.showSection(sectionId);
        }
    }
    sidebarNav?.addEventListener('click', handleNavClick);
    sidebarFooterNav?.addEventListener('click', handleNavClick);

    // Add Task Form
    elements.addTaskBtn?.addEventListener('click', handlers.addTask);
    elements.taskInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handlers.addTask(); });
    elements.repeatFrequency?.addEventListener('change', handlers.handleRepeatFrequencyChange);
    elements.customRepeatOptions?.querySelectorAll('.repeat-day').forEach(day => {
        day?.addEventListener('click', () => handlers.toggleRepeatDay(day));
    });
    elements.openDatePickerBtn?.addEventListener('click', handlers.openDatePicker);
    elements.openTimePickerBtn?.addEventListener('click', handlers.openTimePicker);
    elements.repeatUntilSelect?.addEventListener('change', handlers.handleRepeatUntilChange);

    // Calendar Navigation & Actions
    elements.prevMonthBtn?.addEventListener('click', handlers.prevMonth);
    elements.nextMonthBtn?.addEventListener('click', handlers.nextMonth);
    elements.prevYearBtn?.addEventListener('click', handlers.prevYear);
    elements.nextYearBtn?.addEventListener('click', handlers.nextYear);
    elements.returnToTodayBtn?.addEventListener('click', handlers.returnToTodayCalendar);
    elements.calendarBackBtn?.addEventListener('click', handlers.showCalendarView);
    elements.prevDayBtn?.addEventListener('click', handlers.prevDay);
    elements.nextDayBtn?.addEventListener('click', handlers.nextDay);
    elements.addTaskForDayBtn?.addEventListener('click', handlers.addTaskForSelectedDay);
    elements.freeUpScheduleBtn?.addEventListener('click', handlers.showFreeUpScheduleModal);

    // Settings Modal Controls
    elements.settingFontSize?.addEventListener('change', (e) => { state.settings.fontSize = e.target.value; handlers.applySettings(); handlers.saveSettings(); });
    elements.settingContrast?.addEventListener('change', (e) => { state.settings.contrast = e.target.value; handlers.applySettings(); handlers.saveSettings(); });
    elements.colorThemeSelector?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button?.dataset.theme && !button.disabled) {
            state.settings.theme = button.dataset.theme;
            handlers.applySettings();
            handlers.saveSettings();
        }
    });
    elements.settingTimeFormat?.addEventListener('change', (e) => { state.settings.timeFormat = e.target.value; handlers.applySettings(); handlers.saveSettings(); });
    elements.settingDateFormat?.addEventListener('change', (e) => { state.settings.dateFormat = e.target.value; handlers.applySettings(); handlers.saveSettings(); });
    elements.saveSettingsBtn?.addEventListener('click', () => handlers.closeModal('settingsModal'));
    elements.settingsDoneButton?.addEventListener('click', handlers.finishFirstTimeSetup);
    elements.settingsBackBtn?.addEventListener('click', () => handlers.closeModal('settingsModal'));

    // Date Picker Modal
    elements.prevPickerMonthBtn?.addEventListener('click', handlers.prevPickerMonth);
    elements.nextPickerMonthBtn?.addEventListener('click', handlers.nextPickerMonth);
    elements.cancelDatePickerBtn?.addEventListener('click', () => handlers.closeModal('datePickerModal'));

    // Time Picker Modal
    elements.increaseHourBtn?.addEventListener('click', () => handlers.changeHour(1));
    elements.decreaseHourBtn?.addEventListener('click', () => handlers.changeHour(-1));
    elements.increaseMinuteBtn?.addEventListener('click', () => handlers.changeMinute(1));
    elements.decreaseMinuteBtn?.addEventListener('click', () => handlers.changeMinute(-1));
    elements.toggleAmPmBtn?.addEventListener('click', handlers.toggleAmPm);
    elements.saveTimeBtn?.addEventListener('click', handlers.saveSelectedTime);
    elements.cancelTimePickerBtn?.addEventListener('click', () => handlers.closeModal('timePickerModal'));

    // Alert Modals
    elements.closeAlertBtn?.addEventListener('click', () => handlers.closeModal('taskDueAlert'));
    elements.customAlertCloseBtn?.addEventListener('click', () => handlers.closeModal('customAlertModal'));
    elements.dueAlertTaskList?.addEventListener('click', handlers.handleTaskAction);

    // Confirmation Modals
    elements.confirmDeleteBtn?.addEventListener('click', handlers.confirmDeleteTask);
    elements.cancelDeleteBtn?.addEventListener('click', () => handlers.closeModal('deleteConfirmModal'));
    elements.confirmRestoreBtn?.addEventListener('click', handlers.confirmRestoreTask);
    elements.cancelRestoreBtn?.addEventListener('click', () => handlers.closeModal('restoreConfirmModal'));
    elements.confirmPermanentDeleteBtn?.addEventListener('click', handlers.confirmPermanentDelete);
    elements.cancelPermanentDeleteBtn?.addEventListener('click', () => handlers.closeModal('permanentDeleteModal'));

    // Recurring Complete
    elements.confirmCompleteSingleBtn?.addEventListener('click', () => handlers.confirmCompleteTask(false));
    elements.confirmCompleteSeriesBtn?.addEventListener('click', () => handlers.confirmCompleteTask(true));
    elements.cancelCompleteRecurringBtn?.addEventListener('click', () => handlers.closeModal('completeRecurringConfirmModal'));

    // Bulk Actions
    elements.confirmDeleteAllCompletedBtn?.addEventListener('click', handlers.confirmDeleteAllCompleted);
    elements.cancelDeleteAllCompletedBtn?.addEventListener('click', () => handlers.closeModal('deleteAllCompletedConfirmModal'));
    elements.confirmDeleteAllPermanentlyBtn?.addEventListener('click', handlers.confirmDeleteAllPermanently);
    elements.cancelDeleteAllPermanentlyBtn?.addEventListener('click', () => handlers.closeModal('deleteAllPermanentlyConfirmModal'));
    elements.confirmRestoreAllBtn?.addEventListener('click', handlers.confirmRestoreAll);
    elements.cancelRestoreAllBtn?.addEventListener('click', () => handlers.closeModal('restoreAllConfirmModal'));

    // Walkthrough Navigation & Close
    elements.walkthroughNextBtn?.addEventListener('click', handlers.nextWalkthroughStep);
    elements.walkthroughPrevBtn?.addEventListener('click', handlers.prevWalkthroughStep);
    elements.closeWalkthroughBtn?.addEventListener('click', handlers.closeWalkthrough);

    // Task List Actions
    elements.taskList?.addEventListener('click', handlers.handleTaskAction);
    elements.completedList?.addEventListener('click', handlers.handleTaskAction);
    elements.deletedList?.addEventListener('click', handlers.handleTaskAction);
    elements.dayViewTaskList?.addEventListener('click', handlers.handleTaskAction);
    elements.upcomingTaskContent?.addEventListener('click', handlers.handleTaskAction);

    // Upcoming Task Filters/Expand
    elements.upcomingTaskFilters?.addEventListener('click', handlers.handleUpcomingFilterClick);
    elements.upcomingExpandBtn?.addEventListener('click', handlers.toggleUpcomingExpand);

    // Today Sort Control
    elements.todaySortControl?.addEventListener('click', handlers.toggleTodaySort);

    // Completed Task Filters/Delete All
    elements.completedFilters?.addEventListener('click', handlers.handleCompletedFilterClick);
    elements.deleteAllCompletedBtn?.addEventListener('click', handlers.showDeleteAllCompletedConfirm);

    // Deleted Task Bulk Actions
    elements.restoreAllBtn?.addEventListener('click', handlers.showRestoreAllConfirm);
    elements.deleteAllPermanentlyBtn?.addEventListener('click', handlers.showDeleteAllPermanentlyConfirm);

    // STT Button Listeners
    elements.sttBtnDescription?.addEventListener('click', () => {
        if (typeof handlers.startListening === 'function') handlers.startListening('description');
    });
    elements.sttBtnDateTime?.addEventListener('click', () => {
        if (typeof handlers.startListening === 'function') handlers.startListening('datetime');
    });
    elements.sttBtnFrequency?.addEventListener('click', () => {
        if (typeof handlers.startListening === 'function') handlers.startListening('frequency');
    });
}
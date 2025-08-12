// Calendar and day view logic extracted from script.js

import { state, elements } from './config.js';

export async function fetchTasksForMonth(year, month, handlers) { // Pass handlers here
    const cacheKey = handlers.getCacheKey(year, month);
    if (state.taskCache[cacheKey]) {
        return state.taskCache[cacheKey];
    }
    try {
        const endpoint = `/api/tasks/month?year=${year}&month=${month + 1}`;
        const tasks = await handlers.apiRequest(endpoint);
        const parsedTasks = tasks.map(task => ({
            ...task,
            dueDateObj: task.dueDate ? new Date(task.dueDate) : null
        }));
        state.taskCache[cacheKey] = parsedTasks;
        return parsedTasks;
    } catch (e) {
        state.taskCache[cacheKey] = [];
        return [];
    }
}

export function checkShowReturnToToday() {
    const today = new Date();
    const isCurrentMonthAndYear = state.currentYear === today.getFullYear() && state.currentMonth === today.getMonth();
    elements.returnToTodayBtn?.classList.toggle('hidden', isCurrentMonthAndYear || state.isDayView);
}

export async function renderCalendar(handlers) { // Pass handlers here
    const calendarEl = elements.calendar;
    if (!calendarEl) return;
    calendarEl.innerHTML = `<div class="col-span-7 loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

    try {
        const monthTasks = await handlers.fetchTasksForMonth(state.currentYear, state.currentMonth);
        calendarEl.innerHTML = '';
        const firstDayOfMonth = new Date(state.currentYear, state.currentMonth, 1);
        const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
        const startingDay = firstDayOfMonth.getDay();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if(elements.calendarMonthYear) elements.calendarMonthYear.textContent = firstDayOfMonth.toLocaleDateString(undefined, { month: 'long' });
        if(elements.calendarYearDisplay) elements.calendarYearDisplay.textContent = state.currentYear;

        for (let i = 0; i < startingDay; i++) {
            calendarEl.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            const currentDate = new Date(state.currentYear, state.currentMonth, day); currentDate.setHours(0, 0, 0, 0);
            const dayTasks = monthTasks.filter(task => task.dueDateObj && task.dueDateObj.getDate() === day);

            dayDiv.className = 'calendar-day';
            dayDiv.dataset.day = day;
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.textContent = day;
            dayNumberSpan.className = 'day-number';
            dayDiv.appendChild(dayNumberSpan);

            if (dayTasks.length > 0) {
                dayDiv.classList.add('has-tasks');
                const indicatorContainer = document.createElement('div');
                indicatorContainer.className = 'task-indicators';
                const maxIndicators = 3;
                const priorities = dayTasks.map(t => t.priority || 'priority-low');
                const uniquePriorities = [...new Set(priorities)];
                uniquePriorities.slice(0, maxIndicators).forEach(prio => {
                    const indicator = document.createElement('span');
                    indicator.className = `task-indicator ${prio}`;
                    indicatorContainer.appendChild(indicator);
                });
                if (dayTasks.length > maxIndicators) {
                    const moreIndicator = document.createElement('span');
                    moreIndicator.textContent = `+${dayTasks.length - maxIndicators}`;
                    moreIndicator.className = 'task-indicator more';
                    indicatorContainer.appendChild(moreIndicator);
                }
                dayDiv.appendChild(indicatorContainer);
            }
            if (currentDate.getTime() === today.getTime()) {
                dayDiv.classList.add('today');
            }
            dayDiv.addEventListener('click', () => handlers.showDayView(day, handlers)); // Pass handlers here
            calendarEl.appendChild(dayDiv);
        }
        handlers.checkShowReturnToToday();
    } catch (error) {
        calendarEl.innerHTML = `<div class="col-span-7 error-message">Error loading calendar.</div>`;
    }
}

export async function showDayView(day, handlers) { // Pass handlers here
    state.selectedDay = day;
    state.isDayView = true;
    const date = new Date(state.currentYear, state.currentMonth, day);
    const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US';
    if (elements.dayViewTitle) {
        elements.dayViewTitle.textContent = date.toLocaleDateString(locale, { weekday: 'long' });
    }
    if (elements.dayViewDateDisplay) {
        elements.dayViewDateDisplay.textContent = handlers.formatDate(date, state.settings.dateFormat);
    }
    const calendarGridHeader = elements.calendar?.parentElement?.querySelector('.calendar-grid-header');
    if (calendarGridHeader) calendarGridHeader.classList.add('hidden');
    elements.calendar?.classList.add('hidden');
    elements.calendarNavContainer?.classList.add('hidden');
    elements.calendarYearNav?.classList.add('hidden');
    elements.returnToTodayBtn?.classList.add('hidden');
    elements.calendarTitle?.parentElement?.classList.add('hidden');
    elements.dayView?.classList.remove('hidden');
    elements.dayViewNav?.classList.remove('hidden');
    elements.calendarBackBtn?.classList.remove('hidden');
    await handlers.renderDayViewTasks(handlers);
}

export async function renderDayViewTasks(handlers) { // Pass handlers here
    if (!state.isDayView || state.selectedDay === null) return;
    const listEl = elements.dayViewTaskList;
    if (!listEl) return;
    listEl.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</li>`;
    try {
        const date = new Date(state.currentYear, state.currentMonth, state.selectedDay);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const endpoint = `/api/tasks?date=${year}-${month}-${day}&sort=${state.todaySortOrder}`;
        const tasks = await handlers.apiRequest(endpoint);
        listEl.innerHTML = '';
        if (Array.isArray(tasks) && tasks.length === 0) {
            listEl.innerHTML = `<li class="no-tasks-message">No tasks scheduled for this day.</li>`;
        } else if (Array.isArray(tasks)) {
            tasks.forEach(task => listEl.appendChild(handlers.createTaskListItem(task, 'dayView', state))); // Pass state here
        } else {
            throw new Error("Invalid data received for day view tasks");
        }
    } catch (error) {
        listEl.innerHTML = `<li class="error-message">Error loading tasks for this day.</li>`;
    }
}

export function prevMonth(handlers) {
    state.currentMonth--;
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    if (state.isDayView) handlers.showCalendarView();
    handlers.renderCalendar();
    handlers.checkShowReturnToToday();
}

export function nextMonth(handlers) {
    state.currentMonth++;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    if (state.isDayView) handlers.showCalendarView();
    handlers.renderCalendar();
    handlers.checkShowReturnToToday();
}

export function prevYear(handlers) {
    state.currentYear--;
    if (state.isDayView) handlers.showCalendarView();
    handlers.renderCalendar();
    handlers.checkShowReturnToToday();
}

export function nextYear(handlers) {
    state.currentYear++;
    if (state.isDayView) handlers.showCalendarView();
    handlers.renderCalendar();
    handlers.checkShowReturnToToday();
}

export function returnToTodayCalendar(handlers) {
    const today = new Date();
    state.currentYear = today.getFullYear();
    state.currentMonth = today.getMonth();
    if (state.isDayView) handlers.showCalendarView();
    handlers.renderCalendar();
}

export function prevDay(handlers) {
    if (!state.isDayView || state.selectedDay === null) return;
    const currentDate = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    currentDate.setDate(currentDate.getDate() - 1);
    state.currentYear = currentDate.getFullYear();
    state.currentMonth = currentDate.getMonth();
    state.selectedDay = currentDate.getDate();
    const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US';
    if(elements.dayViewDateDisplay) elements.dayViewDateDisplay.textContent = handlers.formatDate(currentDate, state.settings.dateFormat);
    if (elements.dayViewTitle) elements.dayViewTitle.textContent = currentDate.toLocaleDateString(locale, { weekday: 'long' });
    handlers.renderDayViewTasks();
}

export function nextDay(handlers) {
    if (!state.isDayView || state.selectedDay === null) return;
    const currentDate = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    currentDate.setDate(currentDate.getDate() + 1);
    state.currentYear = currentDate.getFullYear();
    state.currentMonth = currentDate.getMonth();
    state.selectedDay = currentDate.getDate();
    const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US';
    if(elements.dayViewDateDisplay) elements.dayViewDateDisplay.textContent = handlers.formatDate(currentDate, state.settings.dateFormat);
    if (elements.dayViewTitle) elements.dayViewTitle.textContent = currentDate.toLocaleDateString(locale, { weekday: 'long' });
    handlers.renderDayViewTasks();
}

export function showCalendarView(handlers) {
    state.isDayView = false;
    state.selectedDay = null;
    const calendarGridHeader = elements.calendar?.parentElement?.querySelector('.calendar-grid-header');
     if (calendarGridHeader) calendarGridHeader.classList.remove('hidden');
    elements.calendar?.classList.remove('hidden');
    elements.calendarNavContainer?.classList.remove('hidden');
    elements.calendarYearNav?.classList.remove('hidden');
    elements.dayView?.classList.add('hidden');
    elements.dayViewNav?.classList.add('hidden');
    elements.calendarBackBtn?.classList.add('hidden');
    elements.calendarTitle?.parentElement?.classList.remove('hidden');
    handlers.checkShowReturnToToday();
}

export function addTaskForSelectedDay(handlers) {
    if (!state.isDayView || state.selectedDay === null) return;
    const date = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    if(elements.dueDate) elements.dueDate.value = handlers.formatDate(date, state.settings.dateFormat);
    const defaultTime = new Date(); defaultTime.setHours(9, 0, 0, 0);
    if (state.settings.timeFormat === '12hr') {
         state.selectedHour = 9;
         state.selectedAmPm = 'AM';
    } else {
         state.selectedHour = 9;
         state.selectedAmPm = '';
    }
    state.selectedMinute = 0;
    if(elements.dueTime) elements.dueTime.value = handlers.formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);
    handlers.showSection('addTask');
}

export async function showFreeUpScheduleModal(handlers) {
     if (!state.isDayView || state.selectedDay === null) {
         handlers.showCustomAlert("Info", "Please select a day from the calendar first.", "info");
         return;
     }
     const modalList = elements.freeUpTaskList;
     const modalDateSpan = elements.freeUpDate;
     if (!modalList || !modalDateSpan) {
          console.error("Free Up Schedule modal elements (#freeUpTaskList or #freeUpDate) not found");
          handlers.showCustomAlert("Error", "Could not open Free Up Schedule view. Required elements missing.", "error");
          return;
     }
     const date = new Date(state.currentYear, state.currentMonth, state.selectedDay);
     modalDateSpan.textContent = handlers.formatDate(date, state.settings.dateFormat);
     modalList.innerHTML = `<li class="loading-text"><i class="fas fa-spinner fa-spin mr-2"></i>Loading tasks...</li>`;
     handlers.openModal('freeUpScheduleModal');
     try {
         const year = date.getFullYear();
         const month = (date.getMonth() + 1).toString().padStart(2, '0');
         const day = date.getDate().toString().padStart(2, '0');
         const endpoint = `/api/tasks?date=${year}-${month}-${day}&sort=${state.todaySortOrder}`;
         const tasks = await handlers.apiRequest(endpoint);
         modalList.innerHTML = '';
         if (tasks.length === 0) {
              modalList.innerHTML = `<li class="no-tasks-message">No tasks scheduled for this day.</li>`;
         } else {
              tasks.forEach(task => {
                   const item = handlers.createTaskListItem(task, 'dayView', state);
                   modalList.appendChild(item);
              });
              modalList.removeEventListener('click', handlers.handleFreeUpTaskAction);
              modalList.addEventListener('click', handlers.handleFreeUpTaskAction);
         }
     } catch (error) {
          console.error("Failed to load tasks for Free Up modal:", error);
          modalList.innerHTML = `<li class="error-message">Error loading tasks.</li>`;
     }
}

export async function handleFreeUpTaskAction(event, handlers) {
     const button = event.target.closest('button');
     if (!button) return;
     const taskItem = button.closest('.task-item');
     const taskId = taskItem?.dataset.taskId;
     const label = button.getAttribute('aria-label');
     if (!taskId) return;
     if (label?.includes('Mark as complete')) {
          console.log(`Completing task ${taskId} from Free Up modal.`);
          try {
              await handlers.completeSingleTask(taskId, handlers);
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
                   if (!elements.freeUpTaskList?.querySelector('.task-item')) {
                        elements.freeUpTaskList.innerHTML = `<li class="no-tasks-message">No tasks remaining for this day.</li>`;
                   }
              }, 350);
               handlers.refreshCurrentView().catch(e => console.error("Background refresh failed after Free Up complete"));
          } catch (error) {
              handlers.showCustomAlert("Error", `Failed to complete task: ${error.message}`);
          }
     } else if (label?.includes('Delete task')) {
          console.log(`Deleting task ${taskId} from Free Up modal.`);
          try {
               await handlers.apiRequest(`/api/tasks/${taskId}`, 'DELETE');
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
                    if (!elements.freeUpTaskList?.querySelector('.task-item')) {
                         elements.freeUpTaskList.innerHTML = `<li class="no-tasks-message">No tasks remaining for this day.</li>`;
                    }
               }, 350);
               handlers.refreshCurrentView().catch(e => console.error("Background refresh failed after Free Up delete"));
          } catch (error) {
              handlers.showCustomAlert("Error", `Failed to delete task: ${error.message}`);
          }
     }
     else if (button.classList.contains('snooze-btn') || label?.includes('Snooze task')) {
          handlers.showSnoozeOptions(event);
     } else if (button.dataset.snooze) {
          const snoozeDuration = button.dataset.snooze;
           const optionsDiv = taskItem.querySelector('.snooze-options');
           if (optionsDiv) optionsDiv.classList.add('hidden');
           console.log(`Snoozing task ${taskId} for ${snoozeDuration} from Free Up modal`);
           try {
               await handlers.apiRequest(`/api/tasks/${taskId}/snooze`, 'POST', { duration: snoozeDuration });
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
                   if (!elements.freeUpTaskList?.querySelector('.task-item')) {
                       elements.freeUpTaskList.innerHTML = `<li class="no-tasks-message">No tasks remaining for this day.</li>`;
                   }
               }, 350);
               handlers.refreshCurrentView().catch(e => console.error("Background refresh failed"));
               handlers.showCustomAlert('Task Snoozed', `Task snoozed for ${snoozeDuration}.`, 'info');
           } catch (error) {
               console.error(`Failed to snooze task ${taskId} from Free Up:`, error);
               handlers.showCustomAlert('Error', `Could not snooze task: ${error.message}`);
           }
     }
}
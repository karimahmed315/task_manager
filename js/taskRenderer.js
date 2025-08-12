// Task rendering functions

import { state, elements } from './config.js';
import { formatDate, formatTime, escapeHtml } from './utils.js';
import { showSnoozeOptions, snoozeTask } from './taskActions.js';

export function createTaskListItem(task, viewType, state, handlers) { // Pass handlers here
    const li = document.createElement('li');
    const priorityClass = task.priority || 'priority-low';
    li.className = `task-item ${priorityClass}`;
    li.setAttribute('data-task-id', task.id);

    let dueDate, completedDate, deletedDate, snoozedUntilDate;
    try { dueDate = task.dueDate ? new Date(task.dueDate) : null; } catch (e) { dueDate = null; }
    try { completedDate = task.completedAt ? new Date(task.completedAt) : null; } catch (e) { completedDate = null; }
    try { deletedDate = task.deletedAt ? new Date(task.deletedAt) : null; } catch (e) { deletedDate = null; }
    try { snoozedUntilDate = task.snoozedUntil ? new Date(task.snoozedUntil) : null; } catch (e) { snoozedUntilDate = null; }

    const timeOptions = { hour12: state.settings.timeFormat === '12hr', hour: 'numeric', minute: '2-digit' };
    const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    const locale = state.settings.dateFormat === 'DDMMYYYY' ? 'en-GB' : 'en-US';

    let dateString = 'No date';
    if (dueDate && !isNaN(dueDate)) {
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const taskDay = new Date(dueDate); taskDay.setHours(0,0,0,0);
        if (taskDay.getTime() === today.getTime()) dateString = 'Today';
        else if (taskDay.getTime() === tomorrow.getTime()) dateString = 'Tomorrow';
        else dateString = handlers.formatDate(dueDate, state.settings.dateFormat);
    }
    const timeString = (dueDate && !isNaN(dueDate)) ? dueDate.toLocaleTimeString([], timeOptions) : 'No time';
    let snoozeStatus = '';
    if (snoozedUntilDate && snoozedUntilDate > new Date()) {
        const durationText = task.snoozedDuration ? ` for ${task.snoozedDuration}` : '';
        const snoozedTime = snoozedUntilDate.toLocaleTimeString([], timeOptions);
        snoozeStatus = `<span class="text-orange-600 dark:text-orange-400 ml-2 font-medium">(Snoozed${durationText} until ${snoozedTime})</span>`;
    }

    let detailsHtml = '';
    if (viewType === 'today' || viewType === 'dayView' || viewType === 'upcoming' || viewType === 'alert') {
        detailsHtml = `<p class="task-details"><i class="far fa-calendar-alt"></i> ${dateString} <i class="far fa-clock ml-2"></i> ${timeString} ${snoozeStatus}</p>`;
    } else if (viewType === 'completed') {
        const completedLocaleString = (completedDate && !isNaN(completedDate)) ? completedDate.toLocaleString(locale, {...dateOptions, ...timeOptions}) : 'N/A';
        detailsHtml = `<p class="task-details"><i class="far fa-check-circle text-green-500"></i> Completed: ${completedLocaleString}</p>`;
        if (dueDate) {
            detailsHtml += `<p class="task-details text-xs opacity-70"><i class="far fa-calendar-times"></i> Was Due: ${dateString} ${timeString}</p>`;
        }
    } else if (viewType === 'deleted') {
        const deletedLocaleString = (deletedDate && !isNaN(deletedDate)) ? deletedDate.toLocaleString(locale, {...dateOptions, ...timeOptions}) : 'N/A';
        detailsHtml = `<p class="task-details"><i class="fas fa-trash-alt"></i> Deleted: ${deletedLocaleString}</p>`;
        if (dueDate) {
            detailsHtml += `<p class="task-details text-xs opacity-70"><i class="far fa-calendar-times"></i> Was Due: ${dateString} ${timeString}</p>`;
        }
    } else if (dueDate) {
        detailsHtml = `<p class="task-details"><i class="far fa-calendar-alt"></i> Due: ${dateString} ${timeString} ${snoozeStatus}</p>`;
    }

    let buttonsHtml = '';
    if (viewType === 'today' || viewType === 'dayView' || viewType === 'upcoming' || viewType === 'alert') {
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
        buttonsHtml = `<button class="action-btn btn-icon btn-danger" aria-label="Delete task"><i class="fas fa-trash-alt"></i></button>`;
    } else if (viewType === 'deleted') {
        buttonsHtml = `
            <button class="action-btn btn-icon btn-info" aria-label="Restore task"><i class="fas fa-trash-restore"></i></button>
            <button class="action-btn btn-icon btn-danger" aria-label="Permanently delete task"><i class="fas fa-times"></i></button>`;
    }

    li.innerHTML = `
        <div class="task-item-content">
            <p class="task-description ${viewType === 'completed' ? 'line-through opacity-70' : ''}" title="${handlers.escapeHtml(task.description)}">
                ${handlers.escapeHtml(task.description)}
            </p>
            ${detailsHtml}
        </div>
        <div class="task-actions relative"> ${buttonsHtml} </div>
    `;

    li.querySelectorAll('.snooze-options button').forEach(button => {
        button.addEventListener('click', (e) => handlers.snoozeTask(e));
    });
    const snoozeBtn = li.querySelector('.snooze-btn');
    snoozeBtn?.addEventListener('click', (e) => handlers.showSnoozeOptions(e));
    
    return li;
}
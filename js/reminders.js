// Reminders and due task alert logic extracted from script.js

import { state, elements } from './config.js';

export async function checkDueTasks(handlers) { // Pass handlers here
    const isActiveModal = document.querySelector('.modal.active:not(#taskDueAlert)');
    if (isActiveModal) {
        return;
    }
    try {
        const dueTasksArray = await handlers.apiRequest('/api/due_tasks');
        const newDueTasks = dueTasksArray.filter(dueTask =>
            !state.alertedTasks.some(alertedTask => alertedTask.id === dueTask.id)
        );
        if (newDueTasks.length > 0) {
            state.alertedTasks.push(...newDueTasks);
            handlers.showTaskDueAlert(state.alertedTasks, handlers);
        } else if (state.alertedTasks.length === 0 && elements.taskDueAlert?.classList.contains('active')) {
            handlers.closeModal('taskDueAlert');
        }
    } catch (error) {
        // Silent fail for background check
    }
}

export function showTaskDueAlert(tasks, handlers) { // Pass handlers here
    if (!Array.isArray(tasks) || tasks.length === 0) {
        if (elements.taskDueAlert?.classList.contains('active')) {
            handlers.closeModal('taskDueAlert');
        }
        return;
    }
    state.alertedTasks = tasks;
    const prioMap = {'priority-high': 3, 'priority-medium': 2, 'priority-low': 1};
    let highestPrioValue = 0;
    tasks.forEach(task => { highestPrioValue = Math.max(highestPrioValue, prioMap[task.priority || 'priority-low'] || 0); });
    let alertClass = 'border-green-500';
    if (highestPrioValue === 3) alertClass = 'border-red-500';
    else if (highestPrioValue === 2) alertClass = 'border-yellow-500';

    if(elements.dueTitle) { elements.dueTitle.textContent = tasks.length > 1 ? "Multiple Tasks Due!" : "Task Due!"; }
    const listEl = elements.dueAlertTaskList;
    if (listEl) {
        listEl.innerHTML = '';
        tasks.forEach(task => {
            const item = handlers.createTaskListItem(task, 'alert', state);
            listEl.appendChild(item);
        });
    }
    const modalContent = elements.taskDueAlert?.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('border-red-500', 'border-yellow-500', 'border-green-500');
        modalContent.classList.add('border-4', alertClass);
    }
    elements.completeAllDueBtn?.classList.toggle('hidden', tasks.length <= 1);
    if (!elements.taskDueAlert?.classList.contains('active')) {
        handlers.openModal('taskDueAlert');
    }
}

export async function completeAllDueTasks(handlers) { // Pass handlers here
    const tasksToComplete = [...state.alertedTasks];
    handlers.closeModal('taskDueAlert');
    state.alertedTasks = [];
    for (const task of tasksToComplete) {
        await handlers.completeSingleTask(task.id);
    }
    await handlers.refreshCurrentView();
}
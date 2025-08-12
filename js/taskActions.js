// Task action handlers: complete, delete, restore, snooze, and bulk actions

import { state, elements } from './config.js';
import { apiRequest } from './api.js';
import { getCacheKey } from './utils.js';

export async function markTaskComplete(taskId, handlers) { // Pass handlers here
    if (!taskId) return;
    const isRecurring = false;
    if (isRecurring) {
        // handlers.showCompleteRecurringConfirm(taskId);
    } else {
        await handlers.completeSingleTask(taskId);
    }
}

export async function completeSingleTask(taskId, handlers) { // Pass handlers here
    if (!taskId) return;
    const completeSeries = state.completeSeries;
    let endpoint = `/api/tasks/${taskId}/complete`;
    try {
        await handlers.apiRequest(endpoint, 'POST');
        delete state.taskCache[handlers.getCacheKey(state.currentYear, state.currentMonth)];
        await handlers.refreshCurrentView();
    } catch (error) {
        throw error;
    } finally {
        state.taskToComplete = null;
        state.completeSeries = false;
    }
}

export function showDeleteConfirm(taskId, handlers) { // Pass handlers here
    if (!taskId) { console.error("Invalid task ID for deletion"); return; }
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${taskId}`;
    state.taskToDelete = taskId;
    if(elements.deleteTaskText) {
        elements.deleteTaskText.textContent = `Delete "${handlers.escapeHtml(taskDesc)}"? This will move it to the Deleted Tasks list.`;
    }
    handlers.openModal('deleteConfirmModal');
}

export async function confirmDeleteTask(handlers) { // Pass handlers here
    const taskId = state.taskToDelete;
    if (!taskId) return;
    try {
        await handlers.apiRequest(`/api/tasks/${taskId}`, 'DELETE');
        state.taskToDelete = null;
        handlers.closeModal('deleteConfirmModal');
        delete state.taskCache[handlers.getCacheKey(state.currentYear, state.currentMonth)];
        await handlers.refreshCurrentView();
    } catch (error) {
        handlers.closeModal('deleteConfirmModal');
        throw error;
    }
}

export function showRestoreConfirm(taskId, handlers) { // Pass handlers here
    if (!taskId) { console.error("Invalid task ID for restore"); return; }
    const numericTaskId = parseInt(taskId, 10);
    if (isNaN(numericTaskId)) { console.error("Task ID is not a number:", taskId); return; }
    const taskElement = document.querySelector(`#deletedList .task-item[data-task-id="${numericTaskId}"]`);
    const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${numericTaskId}`;
    state.taskToRestore = numericTaskId;
    if(elements.restoreTaskText) {
        elements.restoreTaskText.textContent = `Restore "${handlers.escapeHtml(taskDesc)}"? It will reappear in the main task lists.`;
    }
    handlers.openModal('restoreConfirmModal');
}

export async function confirmRestoreTask(handlers) { // Pass handlers here
    const taskId = state.taskToRestore;
    if (!taskId) return;
    try {
        await handlers.apiRequest(`/api/deleted_tasks/${taskId}/restore`, 'POST');
        state.taskToRestore = null;
        handlers.closeModal('restoreConfirmModal');
        delete state.taskCache[handlers.getCacheKey(state.currentYear, state.currentMonth)];
        await handlers.refreshCurrentView();
    } catch (error) {
        handlers.closeModal('restoreConfirmModal');
        throw error;
    }
}

export function showPermanentDeleteConfirm(taskId, handlers) { // Pass handlers here
    if (!taskId) { console.error("Invalid task ID for permanent deletion"); return; }
    const numericTaskId = parseInt(taskId, 10);
    if (isNaN(numericTaskId)) { console.error("Task ID is not a number:", taskId); return; }
    const taskElement = document.querySelector(`#deletedList .task-item[data-task-id="${numericTaskId}"]`);
    const taskDesc = taskElement?.querySelector('.task-description')?.textContent || `Task ID ${numericTaskId}`;
    state.taskToDeletePermanently = numericTaskId;
    if(elements.permanentDeleteTaskText) {
        elements.permanentDeleteTaskText.textContent = `Permanently delete "${handlers.escapeHtml(taskDesc)}"? This action cannot be undone.`;
    }
    handlers.openModal('permanentDeleteModal');
}

export async function confirmPermanentDelete(handlers) { // Pass handlers here
    const taskId = state.taskToDeletePermanently;
    if (!taskId) return;
    try {
        await handlers.apiRequest(`/api/deleted_tasks/${taskId}`, 'DELETE');
        state.taskToDeletePermanently = null;
        handlers.closeModal('permanentDeleteModal');
        await handlers.renderDeletedTasks();
    } catch (error) {
        handlers.closeModal('permanentDeleteModal');
        throw error;
    }
}

export function showSnoozeOptions(event, handlers) {
    event.stopPropagation();
    const button = event.target.closest('.snooze-btn');
    const taskItem = button?.closest('.task-item');
    if (!button || !taskItem) return;
    const optionsDiv = taskItem.querySelector('.snooze-options');
    if (!optionsDiv) return;
    document.querySelectorAll('.snooze-options').forEach(el => {
        if (el !== optionsDiv) el.classList.add('hidden');
    });
    optionsDiv.classList.toggle('hidden');
}

export async function snoozeTask(event, handlers) { // Pass handlers here
    event.stopPropagation();
    const button = event.target.closest('button[data-snooze]');
    const taskItem = button?.closest('.task-item');
    const optionsDiv = button?.closest('.snooze-options');
    if (!button || !taskItem || !optionsDiv) return;
    const taskId = taskItem.dataset.taskId;
    const snoozeDuration = button.dataset.snooze;
    optionsDiv.classList.add('hidden');
    try {
        await handlers.apiRequest(`/api/tasks/${taskId}/snooze`, 'POST', { duration: snoozeDuration });
        await handlers.refreshCurrentView();
        handlers.showCustomAlert('Task Snoozed', `Task snoozed for ${snoozeDuration}.`, 'info');
    } catch (error) {
        handlers.showCustomAlert('Error', `Could not snooze task: ${error.message}`);
    }
}

export async function confirmDeleteAllCompleted(handlers) { // Pass handlers here
    const confirmBtn = elements.confirmDeleteAllCompletedBtn;
    if (confirmBtn?.dataset.countdownInterval) {
       clearInterval(parseInt(confirmBtn.dataset.countdownInterval));
       delete confirmBtn.dataset.countdownInterval;
    }
    try {
        const result = await handlers.apiRequest('/api/completed_tasks/all', 'DELETE');
        handlers.closeModal('deleteAllCompletedConfirmModal');
        if (state.currentSection === 'completed') await handlers.renderCompletedTasks();
        if (state.currentSection === 'deleted') await handlers.renderDeletedTasks();
        handlers.showCustomAlert('Success', result?.message || 'All completed tasks moved to deleted list.', 'success');
    } catch (error) {
        handlers.closeModal('deleteAllCompletedConfirmModal');
        handlers.showCustomAlert('Error', `Could not delete all completed tasks: ${error.message}`);
    } finally {
         if(confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete All';
         }
    }
}

export async function confirmRestoreAll(handlers) { // Pass handlers here
    try {
        const result = await handlers.apiRequest('/api/deleted_tasks/all/restore', 'POST');
        handlers.closeModal('restoreAllConfirmModal');
        delete state.taskCache[handlers.getCacheKey(state.currentYear, state.currentMonth)];
        await handlers.refreshCurrentView();
        const message = result?.message || 'All deleted tasks restored.';
        handlers.showCustomAlert('Success', message, 'success');
    } catch (error) {
        handlers.closeModal('restoreAllConfirmModal');
        handlers.showCustomAlert('Error', `Could not restore all tasks: ${error.message}`);
    }
}

export async function confirmDeleteAllPermanently(handlers) { // Pass handlers here
    try {
        const result = await handlers.apiRequest('/api/deleted_tasks/all', 'DELETE');
        handlers.closeModal('deleteAllPermanentlyConfirmModal');
        if (state.currentSection === 'deleted') {
            await handlers.renderDeletedTasks();
        }
        const message = result?.message || 'All deleted tasks permanently removed.';
        handlers.showCustomAlert('Success', message, 'success');
    } catch (error) {
        handlers.closeModal('deleteAllPermanentlyConfirmModal');
        handlers.showCustomAlert('Error', `Could not permanently delete tasks: ${error.message}`);
    }
}
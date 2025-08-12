// Task management core logic: add, reset form, handle repeat, etc.

import { state, elements } from './config.js';
import { apiRequest } from './api.js';
import { getCacheKey, parseUIDateTime } from './utils.js';

export async function addTask(handlers) { // Pass handlers here
    const taskDescription = elements.taskInput?.value.trim();
    const taskDateStr = elements.dueDate?.value;
    const taskTimeStr = elements.dueTime?.value;
    const taskPriorityValue = elements.taskPriority?.value;
    const repeat = elements.repeatFrequency?.value;
    const customDays = (repeat === 'custom') ? state.customRepeatDays : [];
    const repeatUntil = elements.repeatUntilDate?.value;

    if (!taskDescription) {
        handlers.showCustomAlert('Input Required', 'Please enter a task description.');
        elements.taskInput?.focus();
        return;
    }
    if (taskDescription.length > 150) {
        handlers.showCustomAlert('Input Error', 'Task description cannot exceed 150 characters.');
        elements.taskInput?.focus();
        return;
    }
    if (!taskDateStr || !taskTimeStr) {
        handlers.showCustomAlert('Input Required', 'Please select a valid due date and time.');
        return;
    }

    const parsedDateTime = handlers.parseUIDateTime(taskDateStr, taskTimeStr); // Use handlers
    if (!parsedDateTime) {
        return;
    }

    const taskData = {
        description: taskDescription,
        dueDate: taskDateStr,
        dueTime: taskTimeStr,
        priority: taskPriorityValue,
        repeatFrequency: repeat,
        customRepeatDays: customDays,
        repeatUntil: (repeat !== 'none' && repeatUntil) ? repeatUntil : null
    };

    try {
        const newTask = await handlers.apiRequest('/api/tasks', 'POST', taskData);
        handlers.resetAddTaskForm();
        await handlers.showSection('today');
        delete state.taskCache[handlers.getCacheKey(state.currentYear, state.currentMonth)];
        handlers.showCustomAlert('Success', `Task "${taskDescription}" added!`, 'success');
    } catch (error) {
        handlers.showCustomAlert('Error Adding Task', `Could not add task: ${error.message}`);
    }
}

export function resetAddTaskForm(handlers) { // Pass handlers here
    if (elements.taskInput) elements.taskInput.value = '';
    handlers.initDateInputs();
    if (elements.taskPriority) elements.taskPriority.value = 'priority-medium';
    if (elements.repeatFrequency) elements.repeatFrequency.value = 'none';
    if (elements.repeatUntilDate) elements.repeatUntilDate.value = '';
    if (elements.repeatUntilSelect) elements.repeatUntilSelect.value = 'never';
    handlers.handleRepeatFrequencyChange();
    state.customRepeatDays = [];
    document.querySelectorAll('.repeat-day.selected').forEach(day => day.classList.remove('selected'));
}

export function handleRepeatFrequencyChange(handlers) { // Pass handlers here
    const repeatValue = elements.repeatFrequency?.value;
    const showCustom = repeatValue === 'custom';
    const showUntil = repeatValue !== 'none' && repeatValue !== undefined;
    elements.customRepeatOptions?.classList.toggle('hidden', !showCustom);
    elements.repeatUntilContainer?.classList.toggle('hidden', !showUntil);
    if (!showCustom) {
        state.customRepeatDays = [];
        document.querySelectorAll('.repeat-day.selected').forEach(day => day.classList.remove('selected'));
    }
    if (!showUntil) {
        if(elements.repeatUntilDate) elements.repeatUntilDate.value = '';
        if(elements.repeatUntilSelect) elements.repeatUntilSelect.value = 'never';
    } else {
        handlers.handleRepeatUntilChange();
    }
}

export function handleRepeatUntilChange(handlers) { // Pass handlers here
     const selectValue = elements.repeatUntilSelect?.value;
     const untilDateInput = elements.repeatUntilDate;
     if (!selectValue || !untilDateInput) return;
     const today = new Date();
     let untilDate = new Date(today);
     switch(selectValue) {
         case '1month': untilDate.setMonth(today.getMonth() + 1); break;
         case '6months': untilDate.setMonth(today.getMonth() + 6); break;
         case '1year': untilDate.setFullYear(today.getFullYear() + 1); break;
         case '10years':
             untilDate.setFullYear(today.getFullYear() + (elements.repeatFrequency?.value === 'yearly' ? 10 : 1));
             break;
         case 'custom':
             untilDateInput.value = '';
             untilDateInput.readOnly = false;
             return;
         case 'never': default:
             untilDateInput.value = '';
             untilDateInput.readOnly = true;
             return;
     }
     untilDateInput.value = handlers.formatDate(untilDate, state.settings.dateFormat);
     untilDateInput.readOnly = true;
}

export function toggleRepeatDay(element, handlers) { // Pass handlers here
    if (!element) return;
    const day = parseInt(element.getAttribute('data-day'));
    if (isNaN(day)) return;
    element.classList.toggle('selected');
    const index = state.customRepeatDays.indexOf(day);
    if (element.classList.contains('selected')) {
        if (index === -1) {
            state.customRepeatDays.push(day);
        }
    } else {
        if (index > -1) {
            state.customRepeatDays.splice(index, 1);
        }
    }
    state.customRepeatDays.sort((a,b) => a - b);
    console.log("Custom repeat days:", state.customRepeatDays);
}
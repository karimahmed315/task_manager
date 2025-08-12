// js/api.js

import { state } from './config.js';
import { parseUIDateTime } from './utils.js';

export async function apiRequest(endpoint, method = 'GET', body = null) {
    console.log(`API Request: ${method} ${endpoint}`, body ? JSON.stringify(body) : '');

    return new Promise(async (resolve, reject) => {
        await new Promise(res => setTimeout(res, 50));
        let mockTasks, mockDeleted, mockCompleted;
        try { mockTasks = JSON.parse(localStorage.getItem('mockTasks') || '[]'); } catch (e) { mockTasks = []; console.error("Error parsing mockTasks", e); }
        try { mockDeleted = JSON.parse(localStorage.getItem('mockDeletedTasks') || '[]'); } catch (e) { mockDeleted = []; console.error("Error parsing mockDeletedTasks", e); }
        try { mockCompleted = JSON.parse(localStorage.getItem('mockCompletedTasks') || '[]'); } catch (e) { mockCompleted = []; console.error("Error parsing mockCompletedTasks", e); }
        let nextMockId = parseInt(localStorage.getItem('nextMockId') || '1');
        try {
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
                    targetDate.setHours(0, 0, 0, 0);
                } catch (e) {
                    return reject(new Error(`Invalid date parameter format: ${dateParam}`));
                }
                const tasksForDate = mockTasks.filter(t => {
                    if (!t.dueDate) return false;
                    try {
                        const taskDate = new Date(t.dueDate);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate.getTime() === targetDate.getTime();
                    } catch { return false; }
                });
                tasksForDate.sort((a, b) => {
                    const timeA = new Date(a.dueDate).getTime();
                    const timeB = new Date(b.dueDate).getTime();
                    if (sortParam === 'priority') {
                        const prioMap = { 'priority-high': 3, 'priority-medium': 2, 'priority-low': 1 };
                        const prioA = prioMap[a.priority] || 0;
                        const prioB = prioMap[b.priority] || 0;
                        if (prioA !== prioB) return prioB - prioA;
                    }
                    return timeA - timeB;
                });
                resolve(tasksForDate);
            }
            else if (endpoint === '/api/tasks/all' && method === 'GET') {
                const activeTasks = mockTasks.filter(t => t.dueDate);
                activeTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                resolve(activeTasks);
            }
            else if (endpoint.startsWith('/api/tasks/month') && method === 'GET') {
                const params = new URLSearchParams(endpoint.split('?')[1] || '');
                const year = parseInt(params.get('year'));
                const month = parseInt(params.get('month')) - 1;
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
            else if (endpoint === '/api/tasks' && method === 'POST') {
                const dt = parseUIDateTime(body.dueDate, body.dueTime);
                if (!dt) {
                    return reject(new Error("Invalid date/time format provided by user."));
                }
                const newTask = {
                    description: body.description,
                    priority: body.priority,
                    repeatFrequency: body.repeatFrequency,
                    customRepeatDays: body.customRepeatDays,
                    repeatUntil: body.repeatUntil,
                    id: nextMockId++,
                    dueDate: dt.toISOString(),
                    completed: false,
                    deletedAt: null,
                    completedAt: null,
                    createdAt: new Date().toISOString(),
                };
                mockTasks.push(newTask);
                localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                localStorage.setItem('nextMockId', nextMockId.toString());
                resolve(newTask);
            }
            else if (endpoint.includes('/complete') && method === 'POST') {
                const id = parseInt(endpoint.split('/')[3]);
                const taskIndex = mockTasks.findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    const completedTask = { ...mockTasks[taskIndex] };
                    completedTask.completed = true;
                    completedTask.completedAt = new Date().toISOString();
                    mockCompleted.push(completedTask);
                    mockTasks.splice(taskIndex, 1);
                    localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                    localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                    resolve({ message: "Task marked complete" });
                } else {
                    const alreadyCompletedIndex = mockCompleted.findIndex(t => t.id === id);
                    if (alreadyCompletedIndex > -1) {
                        resolve({ message: "Task already complete" });
                    } else {
                        reject(new Error("Mock Task not found for complete"));
                    }
                }
            }
            else if (method === 'DELETE' && endpoint.startsWith('/api/tasks/')) {
                const id = parseInt(endpoint.split('/')[3]);
                let found = false;
                const taskIndex = mockTasks.findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    const deletedTask = mockTasks.splice(taskIndex, 1)[0];
                    deletedTask.deletedAt = new Date().toISOString();
                    mockDeleted.push(deletedTask);
                    localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                    found = true;
                } else {
                    const completedIndex = mockCompleted.findIndex(t => t.id === id);
                    if (completedIndex > -1) {
                        const deletedTask = mockCompleted.splice(completedIndex, 1)[0];
                        deletedTask.deletedAt = new Date().toISOString();
                        mockDeleted.push(deletedTask);
                        localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                        found = true;
                    }
                }
                if (found) {
                    localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted));
                    resolve({ message: "Task moved to deleted" });
                } else {
                    reject(new Error("Mock Task not found for soft delete"));
                }
            }
            else if (endpoint.includes('/snooze') && method === 'POST') {
                const id = parseInt(endpoint.split('/')[3]);
                const taskIndex = mockTasks.findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    const task = mockTasks[taskIndex];
                    if (task.completed || task.deletedAt) {
                        return reject(new Error("Cannot snooze completed or deleted task"));
                    }
                    const duration = body.duration;
                    if (!duration) {
                        return reject(new Error("Missing snooze duration"));
                    }
                    const now = new Date();
                    let newDueDate = new Date(now);
                    if (duration === '10m') newDueDate.setMinutes(now.getMinutes() + 10);
                    else if (duration === '1h') newDueDate.setHours(now.getHours() + 1);
                    else if (duration === '1d') newDueDate.setDate(now.getDate() + 1);
                    else {
                        return reject(new Error("Invalid snooze duration"));
                    }
                    mockTasks[taskIndex].dueDate = newDueDate.toISOString();
                    mockTasks[taskIndex].snoozedDuration = duration;
                    mockTasks[taskIndex].snoozedUntil = newDueDate.toISOString();
                    localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                    resolve({ message: `Task snoozed`, snoozedUntil: newDueDate.toISOString() });
                } else {
                    reject(new Error("Mock Task not found for snooze"));
                }
            }
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
                    const timeA = new Date(a.dueDate).getTime();
                    const timeB = new Date(b.dueDate).getTime();
                    const prioMap = { 'priority-high': 3, 'priority-medium': 2, 'priority-low': 1 };
                    const prioA = prioMap[a.priority] || 0;
                    const prioB = prioMap[b.priority] || 0;
                    if (timeA !== timeB) return timeA - timeB;
                    return prioB - prioA;
                });
                resolve(filteredCompleted);
            }
            else if (endpoint === '/api/completed_tasks/all' && method === 'DELETE') {
                const completedToMove = mockCompleted;
                mockCompleted = [];
                completedToMove.forEach(t => t.deletedAt = new Date().toISOString());
                mockDeleted.push(...completedToMove);
                localStorage.setItem('mockCompletedTasks', '[]');
                localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted));
                resolve({ message: `${completedToMove.length} completed tasks moved to deleted` });
            }
            else if (endpoint === '/api/deleted_tasks' && method === 'GET') {
                mockDeleted.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
                resolve(mockDeleted);
            }
            else if (endpoint.includes('/restore') && !endpoint.includes('all') && method === 'POST') {
                const id = parseInt(endpoint.split('/')[3]);
                const deletedIndex = mockDeleted.findIndex(t => t.id === id);
                if (deletedIndex > -1) {
                    const restoredTask = mockDeleted.splice(deletedIndex, 1)[0];
                    const wasCompleted = restoredTask.completed;
                    restoredTask.deletedAt = null;
                    if (wasCompleted) {
                        restoredTask.completed = true;
                        mockCompleted.push(restoredTask);
                        localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                    } else {
                        restoredTask.completed = false;
                        restoredTask.completedAt = null;
                        mockTasks.push(restoredTask);
                        localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                    }
                    localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted));
                    resolve({ message: "Task restored" });
                } else {
                    reject(new Error("Mock Task not found for restore"));
                }
            }
            else if (endpoint === '/api/deleted_tasks/all/restore' && method === 'POST') {
                const restoredToActive = [];
                const restoredToCompleted = [];
                mockDeleted.forEach(task => {
                    const wasCompleted = task.completed;
                    task.deletedAt = null;
                    if (wasCompleted) {
                        restoredToCompleted.push(task);
                    } else {
                        task.completed = false;
                        task.completedAt = null;
                        restoredToActive.push(task);
                    }
                });
                mockTasks.push(...restoredToActive);
                mockCompleted.push(...restoredToCompleted);
                mockDeleted = [];
                localStorage.setItem('mockTasks', JSON.stringify(mockTasks));
                localStorage.setItem('mockCompletedTasks', JSON.stringify(mockCompleted));
                localStorage.setItem('mockDeletedTasks', '[]');
                resolve({ message: `${restoredToActive.length + restoredToCompleted.length} tasks restored` });
            }
            else if (method === 'DELETE' && endpoint.startsWith('/api/deleted_tasks/') && !endpoint.includes('all')) {
                const id = parseInt(endpoint.split('/')[3]);
                const originalLength = mockDeleted.length;
                mockDeleted = mockDeleted.filter(t => t.id !== id);
                if (mockDeleted.length < originalLength) {
                    localStorage.setItem('mockDeletedTasks', JSON.stringify(mockDeleted));
                    resolve({ message: "Task permanently deleted" });
                } else {
                    reject(new Error("Mock Task not found for permanent delete"));
                }
            }
            else if (endpoint === '/api/deleted_tasks/all' && method === 'DELETE') {
                const count = mockDeleted.length;
                mockDeleted = [];
                localStorage.setItem('mockDeletedTasks', '[]');
                resolve({ message: `${count} tasks permanently deleted` });
            }
            else if (endpoint === '/api/due_tasks' && method === 'GET') {
                const now = new Date();
                const dueTasks = mockTasks.filter(t =>
                    !t.completed &&
                    !t.deletedAt &&
                    t.dueDate &&
                    new Date(t.dueDate) <= now
                );
                if (dueTasks.length === 0) {
                    resolve([]);
                } else {
                    const prioMap = { 'priority-high': 3, 'priority-medium': 2, 'priority-low': 1 };
                    dueTasks.sort((a, b) => {
                        const prioA = prioMap[a.priority] || 0;
                        const prioB = prioMap[b.priority] || 0;
                        if (prioA !== prioB) return prioB - prioA;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    });
                    resolve(dueTasks);
                }
            }
            else if (endpoint === '/api/parse-datetime' && method === 'POST') {
                const text = body?.text || '';
                console.log("MOCK /api/parse-datetime received:", text);
                if (text.toLowerCase().includes('fail')) {
                    reject({ error: `Mock could not parse: "${text}"` });
                } else {
                    const dummyDate = new Date();
                    if (text.toLowerCase().includes('tomorrow')) dummyDate.setDate(dummyDate.getDate() + 1);
                    if (text.match(/(\d{1,2})\s*(am|pm)/i)) {
                        const timeMatch = text.match(/(\d{1,2})\s*(am|pm)/i);
                        let hour = parseInt(timeMatch[1]);
                        const period = timeMatch[2].toUpperCase();
                        if (period === 'PM' && hour !== 12) hour += 12;
                        if (period === 'AM' && hour === 12) hour = 0;
                        dummyDate.setHours(hour);
                        dummyDate.setMinutes(0);
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
                        time_str_12: dummyDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/^0+/, ''),
                        time_str_24: dummyDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
                    });
                }
            }
            else {
                console.warn(`No MOCK handler for ${method} ${endpoint}`);
                resolve([]);
            }
        } catch (err) {
            console.error(`Mock API Error processing ${method} ${endpoint}:`, err);
            reject(err);
        }
    });
}
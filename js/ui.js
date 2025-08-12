// UI utility functions from script.js

import { state, elements } from './config.js';
import { formatDate } from './utils.js';

export function updateClock(handlers) { // Pass handlers here
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
            elements.sidebarDate.textContent = handlers.formatDate(now, state.settings.dateFormat);
        } catch (e) {
            console.error("Error formatting sidebar date:", e);
            elements.sidebarDate.textContent = "Error";
        }
    }
}

export function updateMainDateDisplay(handlers) { // Pass handlers here
    if (!elements.mainDateDisplay) return;
    const now = new Date();
    try {
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateStr = now.toLocaleDateString(undefined, dateOptions);
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

export function updateGreeting(handlers) { // Pass handlers here
    const hour = new Date().getHours();
    let greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    if (elements.greetingText) elements.greetingText.textContent = `${greeting}, ${handlers.escapeHtml(state.userName)}!`;
}

export function toggleSidebar() {
    elements.sidebar?.classList.toggle('active');
}

export function toggleSidebarExpanded() {
    if (window.innerWidth > 1024) {
        const isExpanding = !elements.sidebar?.classList.contains('expanded');
        elements.sidebar?.classList.toggle('expanded', isExpanding);
        state.sidebarExpanded = isExpanding;
        console.log(`Sidebar expanded: ${isExpanding}`);
    }
}

export function showSection(sectionId, handlers) {
    console.log(`Attempting to show section: ${sectionId}`);
    const currentActiveNav = document.querySelector('.nav-item.active');
    const currentVisibleSection = document.querySelector('.section-content:not(.hidden)');
    console.log(`Current active nav: ${currentActiveNav?.id}, Current visible section: ${currentVisibleSection?.id}`);

    document.querySelectorAll('.main-content > .section-content').forEach(section => {
        section.classList.add('hidden');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const sectionElement = elements[`${sectionId}Section`];
    const navElement = elements[`${sectionId}Nav`];

    if (sectionElement) {
        sectionElement.classList.remove('hidden');
        state.currentSection = sectionId;
        console.log(`Section ${sectionElement.id} should now be visible.`);

        if (navElement) {
            navElement.classList.add('active');
            console.log(`Nav item ${navElement.id} set to active.`);
        } else {
             if (sectionId === 'settings') elements.settingsNav?.classList.add('active');
             else if (sectionId === 'help') elements.helpNav?.classList.add('active');
             else console.warn(`Nav element not found for section: ${sectionId}`);
        }

        console.log(`Refreshing view for ${sectionId}...`);
        handlers.refreshCurrentView();

        if (sectionId === 'add-task') {
            elements.taskInput?.focus();
        }

    } else if (sectionId !== 'settings' && sectionId !== 'help') {
        console.error(`!!! Section element not found for ID: ${sectionId}Section. Falling back to 'today'.`);
        handlers.showSection('today');
        return;
    } else {
         console.log(`Showing special section/modal: ${sectionId}`);
         if (sectionId === 'settings') elements.settingsNav?.classList.add('active');
         if (sectionId === 'help') elements.helpNav?.classList.add('active');
    }

    if (window.innerWidth < 1024 && elements.sidebar?.classList.contains('active')) {
        elements.sidebar.classList.remove('active');
    }
}

export function openModal(modalId, handlers) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        console.log(`Modal opened: ${modalId}`);
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
             modalContent.scrollTop = 0;
        }
    } else {
        console.error(`Modal element not found for ID: ${modalId}`);
    }
}

export function closeModal(modalId, handlers) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        console.log(`Modal closed: ${modalId}`);
        if (modalId === 'deleteConfirmModal') state.taskToDelete = null;
        if (modalId === 'restoreConfirmModal') state.taskToRestore = null;
        if (modalId === 'permanentDeleteModal') state.taskToDeletePermanently = null;
        if (modalId === 'completeRecurringConfirmModal') { state.taskToComplete = null; state.completeSeries = false; }
        if (modalId === 'taskDueAlert') {
             modal?.querySelector('.modal-content')?.classList.remove('border-4', 'border-red-500', 'border-yellow-500', 'border-green-500');
             state.alertedTasks = [];
        }
        if (modalId === 'deleteAllCompletedConfirmModal') {
             const confirmBtn = elements.confirmDeleteAllCompletedBtn;
             if (confirmBtn?.dataset.countdownInterval) {
                 clearInterval(parseInt(confirmBtn.dataset.countdownInterval));
                 confirmBtn.disabled = false;
                 confirmBtn.textContent = 'Delete All';
                 delete confirmBtn.dataset.countdownInterval;
             }
        }
    } else {
         console.warn(`Modal element not found for ID: ${modalId} during close operation.`);
    }
}

export function showCustomAlert(title, message, type = 'error', handlers) {
     if (!elements.customAlertModal || !elements.customAlertTitle || !elements.customAlertMessage) {
          console.error("Custom alert modal elements not found. Alert:", title, message);
          alert(`${title}\n${message}`);
          return;
     }
     elements.customAlertTitle.textContent = title;
     elements.customAlertMessage.textContent = message;
     const modalContent = elements.customAlertModal.querySelector('.modal-content');
     modalContent?.classList.remove('border-red-500', 'border-green-500', 'border-blue-500');
     modalContent?.classList.add('border-2');
     if (type === 'success') modalContent?.classList.add('border-green-500');
     else if (type === 'info') modalContent?.classList.add('border-blue-500');
     else modalContent?.classList.add('border-red-500');
     handlers.openModal('customAlertModal');
}
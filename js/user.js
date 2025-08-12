// User management and welcome/setup logic from script.js

import { state, elements } from './config.js';
import { applySettings, saveSettings } from './config.js';

export function showWelcomeOrSetup(handlers) { // Pass handlers here
    if (!state.userName) {
        elements.welcomeScreen?.classList.remove('hidden');
        if (elements.welcomeScreen) {
            elements.welcomeScreen.style.display = 'flex';
        }
        elements.userNameInput?.focus();
    } else {
        handlers.applySettings();
        handlers.setupEventListeners(elements, state, handlers);
        handlers.showSettingsModal(true);
    }
}

export function finishFirstTimeSetup(handlers) { // Pass handlers here
    state.settings.firstVisit = false;
    handlers.saveSettings();
    handlers.closeModal('settingsModal');
    setTimeout(handlers.showWalkthrough, 500);
}

export function saveUserNameAndSetup(handlers) { // Pass handlers here
    const name = elements.userNameInput?.value.trim();
    if (name) {
        state.userName = name;
        localStorage.setItem('userName', name);
        elements.welcomeScreen?.classList.add('hidden');
        if (elements.welcomeScreen) {
            elements.welcomeScreen.style.display = 'none';
        }
        handlers.updateGreeting();
        if (state.settings.firstVisit) {
            handlers.showWelcomeOrSetup(handlers);
        } else {
            handlers.applySettings();
            handlers.setupEventListeners(elements, state, handlers);
            handlers.initDateInputs();
            handlers.showSection('today');
            setInterval(handlers.checkDueTasks, 60000);
            handlers.checkDueTasks();
        }
    } else {
        handlers.showCustomAlert('Input Required', 'Please enter your first name to get started.');
    }
}

export function showSettingsModal(isSetupMode = false, handlers) { // Pass handlers here
    if (elements.settingFontSize) elements.settingFontSize.value = state.settings.fontSize;
    if (elements.settingContrast) elements.settingContrast.value = state.settings.contrast;
    if (elements.settingTimeFormat) elements.settingTimeFormat.value = state.settings.timeFormat;
    if (elements.settingDateFormat) elements.settingDateFormat.value = state.settings.dateFormat;
    handlers.applySettings();
    elements.saveSettingsBtn?.classList.toggle('hidden', isSetupMode);
    elements.settingsDoneButton?.classList.toggle('hidden', !isSetupMode);
    handlers.openModal('settingsModal');
    const modalContent = elements.settingsModal?.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}
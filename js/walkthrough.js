// Walkthrough logic extracted from script.js

import { state, elements } from './config.js';
import { showSettingsModal } from './user.js';
import { showSection } from './ui.js';
import { closeModal } from './ui.js';

/**
 * Updates the walkthrough tooltip content and highlights the target element for the current step.
 */
export function updateWalkthrough() {
    if (state.walkthroughStep < 0 || state.walkthroughStep >= state.walkthroughSteps.length) {
        return closeWalkthrough();
    }
    const step = state.walkthroughSteps[state.walkthroughStep];
    const tooltip = elements.walkthroughTooltip;
    const overlay = elements.walkthroughOverlay;
    if (!tooltip || !overlay) return;

    // Update tooltip content
    if (elements.walkthroughTitle) elements.walkthroughTitle.innerHTML = step.title;
    if (elements.walkthroughContent) elements.walkthroughContent.innerHTML = step.content;

    // Show/hide Previous button
    if (elements.walkthroughPrevBtn) elements.walkthroughPrevBtn.style.visibility = state.walkthroughStep === 0 ? 'hidden' : 'visible';

    // Update Next/Finish button text
    const nextBtn = elements.walkthroughNextBtn;
    if (nextBtn) {
        const isLastStep = state.walkthroughStep === state.walkthroughSteps.length - 1;
        const isSetupStep = step.isSetupStep;
        if (isSetupStep) nextBtn.innerHTML = `Next <i class="fas fa-arrow-right ml-2"></i>`;
        else nextBtn.innerHTML = `${isLastStep ? 'Finish' : 'Next'} <i class="fas ${isLastStep ? 'fa-check' : 'fa-arrow-right'} ml-2"></i>`;
    }

    // Show overlay and tooltip
    overlay.classList.add('active');
    tooltip.classList.remove('hidden');

    // Clear previous highlight
    document.querySelectorAll('.walkthrough-highlight').forEach(el => {
        el.classList.remove('walkthrough-highlight');
        el.style.zIndex = '';
    });

    // Find and highlight the target element for this step
    const targetElement = step.targetElement ? document.querySelector(step.targetElement) : null;
    tooltip.style.position = 'fixed';

    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        setTimeout(() => {
            targetElement.classList.add('walkthrough-highlight');
            targetElement.style.zIndex = '1061';
            positionTooltip(tooltip, targetElement);
        }, 350);
    } else {
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }

    // Ensure the correct section/modal is visible for the step
    if (step.section === 'settings' && !elements.settingsModal?.classList.contains('active')) {
        showSettingsModal(step.isSetupStep || false);
    } else if (step.section && state.currentSection !== step.section) {
        if (state.currentSection === 'settings' && step.section !== 'settings') closeModal('settingsModal');
        showSection(step.section);
    } else if (step.section !== 'settings' && elements.settingsModal?.classList.contains('active')) {
        closeModal('settingsModal');
    }
}

/**
 * Positions the walkthrough tooltip relative to a target element.
 * Tries to place it below, then above, then beside the target.
 * @param {HTMLElement} tooltip
 * @param {HTMLElement} target
 */
export function positionTooltip(tooltip, target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 15;
    let top, left;

    // Try below target first
    top = targetRect.bottom + margin;
    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    // If it goes off bottom, try above
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = targetRect.top - tooltipRect.height - margin;
    }

    // If it still goes off top/bottom, try beside (right first)
    if (top < margin) {
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = targetRect.left - tooltipRect.width - margin;
        }
    }

    // Ensure tooltip stays within viewport boundaries
    if (left < margin) left = margin;
    if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = window.innerHeight - tooltipRect.height - margin;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.transform = '';
}

/**
 * Moves to the next step in the walkthrough.
 */
export function nextWalkthroughStep() {
    const currentStep = state.walkthroughSteps[state.walkthroughStep];
    if (currentStep.isSetupStep && state.walkthroughStep === 1) {
        // This is the last setup step, finish setup
        if (typeof finishFirstTimeSetup === 'function') {
            finishFirstTimeSetup();
        }
        return;
    }
    if (state.walkthroughStep < state.walkthroughSteps.length - 1) {
        state.walkthroughStep++;
        updateWalkthrough();
    } else {
        closeWalkthrough();
    }
}

/**
 * Moves to the previous step in the walkthrough.
 */
export function prevWalkthroughStep() {
    if (state.walkthroughStep > 0) {
        state.walkthroughStep--;
        updateWalkthrough();
    }
}

/**
 * Starts the walkthrough from the appropriate step.
 */
export function showWalkthrough() {
    state.walkthroughStep = state.settings.firstVisit ? 0 : 2;
    updateWalkthrough();
}

/**
 * Closes the walkthrough overlay and tooltip, and cleans up highlights.
 */
export function closeWalkthrough() {
    const highlightedElement = document.querySelector('.walkthrough-highlight');
    if (highlightedElement) {
        highlightedElement.classList.remove('walkthrough-highlight');
        highlightedElement.style.zIndex = '';
    }
    elements.walkthroughOverlay?.classList.remove('active');
    elements.walkthroughTooltip?.classList.add('hidden');

    const currentStep = state.walkthroughSteps[state.walkthroughStep];
    if (elements.settingsModal?.classList.contains('active') && currentStep?.targetElement?.includes('#settingsModal')) {
        closeModal('settingsModal');
    }
    // Optionally reset step counter
    // state.walkthroughStep = 0;
}
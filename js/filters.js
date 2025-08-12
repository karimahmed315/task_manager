// Filter handlers extracted from script.js

/**
 * Handles clicks on the upcoming task filter buttons.
 * Updates the state and re-renders the upcoming tasks list.
 */
export function handleUpcomingFilterClick(event, state, elements, renderUpcomingTasks) {
    const button = event.target.closest('button[data-filter]');
    if (!button || !elements.upcomingTaskFilters) return;
    const newFilter = button.dataset.filter;
    if (newFilter === state.upcomingFilter) return;
    state.upcomingFilter = newFilter;
    elements.upcomingTaskFilters.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active-filter-style');
    });
    button.classList.add('active-filter-style');
    state.upcomingExpanded = false;
    renderUpcomingTasks();
}

/**
 * Toggles the expanded/collapsed view of the upcoming tasks list.
 */
export function toggleUpcomingExpand(state, renderUpcomingTasks) {
    state.upcomingExpanded = !state.upcomingExpanded;
    renderUpcomingTasks();
}

/**
 * Toggles the sorting order for the 'Today' task list between time and priority.
 */
export function toggleTodaySort(state, elements, refreshCurrentView) {
    state.todaySortOrder = state.todaySortOrder === 'time' ? 'priority' : 'time';
    const button = elements.todaySortControl;
    if (button) {
        if (state.todaySortOrder === 'priority') {
            button.innerHTML = '<i class="fas fa-star mr-1"></i> Sorted by Priority';
            button.setAttribute('aria-label', 'Sort tasks by priority. Click to sort by time.');
        } else {
            button.innerHTML = '<i class="fas fa-clock mr-1"></i> Sorted by Time';
            button.setAttribute('aria-label', 'Sort tasks by time. Click to sort by priority.');
        }
    }
    if (state.currentSection === 'today' || (state.currentSection === 'calendar' && state.isDayView)) {
        refreshCurrentView();
    }
}

/**
 * Handles clicks on the completed task filter buttons.
 * Updates state and re-renders the completed tasks list.
 */
export function handleCompletedFilterClick(event, state, elements, renderCompletedTasks) {
    const button = event.target.closest('button[data-filter]');
    if (!button || !elements.completedFilters) return;
    const newFilter = button.dataset.filter;
    if (newFilter === state.completedFilter) return;
    state.completedFilter = newFilter;
    elements.completedFilters.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active-filter-style');
    });
    button.classList.add('active-filter-style');
    renderCompletedTasks();
}
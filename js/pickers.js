// Date and Time Picker logic extracted from script.js

/**
 * Initializes the date and time input fields with default values.
 */
export function initDateInputs(elements, state, formatDate, formatTime, updateTimeDisplay) {
    const today = new Date();
    if (elements.dueDate) elements.dueDate.value = formatDate(today, state.settings.dateFormat);

    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1);
    defaultTime.setMinutes(0);
    defaultTime.setSeconds(0, 0);

    const defaultHour24 = defaultTime.getHours();
    state.selectedMinute = 0;
    if (state.settings.timeFormat === '12hr') {
        state.selectedAmPm = defaultHour24 >= 12 ? 'PM' : 'AM';
        state.selectedHour = defaultHour24 % 12 || 12;
    } else {
        state.selectedHour = defaultHour24;
        state.selectedAmPm = '';
    }
    if (elements.dueTime) elements.dueTime.value = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);

    updateTimeDisplay && updateTimeDisplay();
}

/**
 * Renders the calendar grid for the date picker modal.
 */
export function renderPickerCalendar(elements, state, formatDate) {
    const calendarEl = elements.pickerCalendar;
    if (!calendarEl) return;
    calendarEl.innerHTML = '';

    const firstDay = new Date(state.pickerYear, state.pickerMonth, 1);
    const daysInMonth = new Date(state.pickerYear, state.pickerMonth + 1, 0).getDate();
    const startDayIndex = firstDay.getDay();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDayIndex; i++) {
        calendarEl.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        const date = new Date(state.pickerYear, state.pickerMonth, day);
        date.setHours(0, 0, 0, 0);

        dayDiv.className = 'calendar-day picker-day';
        dayDiv.textContent = day;

        if (date.getTime() === today.getTime()) {
            dayDiv.classList.add('today');
        }

        dayDiv.addEventListener('click', () => selectPickerDate(day, elements, state, formatDate));
        calendarEl.appendChild(dayDiv);
    }
    if (elements.pickerMonthYear) {
        elements.pickerMonthYear.textContent = firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
}

export function selectPickerDate(day, elements, state, formatDate) {
    const date = new Date(state.pickerYear, state.pickerMonth, day);
    if (elements.dueDate) {
        elements.dueDate.value = formatDate(date, state.settings.dateFormat);
    }
    closeModal('datePickerModal');
}

export function prevPickerMonth(state, renderPickerCalendar) {
    state.pickerMonth--;
    if (state.pickerMonth < 0) { state.pickerMonth = 11; state.pickerYear--; }
    renderPickerCalendar();
}

export function nextPickerMonth(state, renderPickerCalendar) {
    state.pickerMonth++;
    if (state.pickerMonth > 11) { state.pickerMonth = 0; state.pickerYear++; }
    renderPickerCalendar();
}

export function openDatePicker(elements, state, parseUIDateTime, formatDate, renderPickerCalendar) {
    try {
        const currentVal = elements.dueDate?.value;
        if (currentVal) {
            const date = parseUIDateTime(currentVal, "12:00 AM");
            if (date) {
                state.pickerMonth = date.getMonth();
                state.pickerYear = date.getFullYear();
            } else { throw new Error("Invalid date format in input"); }
        } else {
            const today = new Date();
            state.pickerMonth = today.getMonth();
            state.pickerYear = today.getFullYear();
        }
    } catch (e) {
        const today = new Date();
        state.pickerMonth = today.getMonth();
        state.pickerYear = today.getFullYear();
    }
    renderPickerCalendar();
    openModal('datePickerModal');
}

export function openTimePicker(elements, state, parseUIDateTime, formatTime, updateTimeDisplay, initDateInputs) {
    try {
        const currentVal = elements.dueTime?.value;
        if (currentVal) {
            const parsed = parseUIDateTime("01/01/2000", currentVal);
            if (parsed) {
                const hour24 = parsed.getHours();
                state.selectedMinute = parsed.getMinutes();
                if (state.settings.timeFormat === '12hr') {
                    state.selectedAmPm = hour24 >= 12 ? 'PM' : 'AM';
                    state.selectedHour = hour24 % 12 || 12;
                } else {
                    state.selectedHour = hour24;
                    state.selectedAmPm = '';
                }
            } else { throw new Error("Invalid time format in input"); }
        } else {
            state.selectedMinute = 0;
            if (state.settings.timeFormat === '12hr') {
                state.selectedHour = 9;
                state.selectedAmPm = 'AM';
            } else {
                state.selectedHour = 9;
                state.selectedAmPm = '';
            }
        }
    } catch (e) {
        initDateInputs();
    }
    updateTimeDisplay();
    openModal('timePickerModal');
}

export function updateTimeDisplay(elements, state, formatTime) {
    if (elements.timeDisplay) {
        elements.timeDisplay.textContent = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);
    }
    if (elements.amPmDisplay) {
        elements.amPmDisplay.textContent = state.selectedAmPm;
    }
    elements.toggleAmPmBtn?.parentElement.classList.toggle('hidden', state.settings.timeFormat === '24hr');
}

export function changeHour(amount, state, updateTimeDisplay, elements) {
    let currentHour = state.selectedHour;
    let currentAmPm = state.selectedAmPm;
    let hour24;
    if (state.settings.timeFormat === '12hr') {
        hour24 = (currentAmPm === 'PM' && currentHour !== 12) ? currentHour + 12 : (currentAmPm === 'AM' && currentHour === 12) ? 0 : currentHour;
    } else {
        hour24 = currentHour;
    }
    hour24 = (hour24 + amount + 24) % 24;
    if (state.settings.timeFormat === '12hr') {
        state.selectedAmPm = hour24 >= 12 ? 'PM' : 'AM';
        state.selectedHour = hour24 % 12 || 12;
    } else {
        state.selectedHour = hour24;
        state.selectedAmPm = '';
    }
    updateTimeDisplay(elements, state, formatTime);
}

export function changeMinute(amount, state, updateTimeDisplay, elements) {
    state.selectedMinute = (state.selectedMinute + amount + 60) % 60;
    updateTimeDisplay(elements, state, formatTime);
}

export function toggleAmPm(state, updateTimeDisplay, elements) {
    if (state.settings.timeFormat === '12hr') {
        state.selectedAmPm = (state.selectedAmPm === 'AM') ? 'PM' : 'AM';
        if (elements.amPmDisplay) {
            elements.amPmDisplay.textContent = state.selectedAmPm;
        }
        updateTimeDisplay(elements, state, formatTime);
    }
}

export function saveSelectedTime(elements, state, formatTime) {
    if (elements.dueTime) {
        elements.dueTime.value = formatTime(state.selectedHour, state.selectedMinute, state.selectedAmPm, state.settings.timeFormat);
    }
    closeModal('timePickerModal');
}
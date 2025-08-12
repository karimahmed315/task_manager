// js/utils.js

import { state } from './config.js';

export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}

export function formatDate(date, format = state.settings.dateFormat) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("formatDate called with invalid date:", date);
        return '';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    if (format === 'MMDDYYYY') {
        return `${month}/${day}/${year}`;
    } else {
        return `${day}/${month}/${year}`;
    }
}

export function formatTime(hour, minute, ampm, format = state.settings.timeFormat) {
    const minStr = minute.toString().padStart(2, '0');
    if (format === '24hr') {
        let hour24 = hour;
        if (ampm === 'PM' && hour >= 1 && hour < 12) hour24 += 12;
        if (ampm === 'AM' && hour === 12) hour24 = 0;
        const hourStr = hour24.toString().padStart(2, '0');
        return `${hourStr}:${minStr}`;
    } else {
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;
        const inferredAmpm = hour < 12 || hour === 24 ? 'AM' : 'PM';
        const hourStr = displayHour.toString();
        return `${hourStr}:${minStr} ${ampm || inferredAmpm}`;
    }
}

export function parseUIDateTime(dateStr, timeStr, state, showCustomAlert) { // Corrected: `state` and `showCustomAlert` are now parameters
    if (!dateStr || !timeStr) {
        console.warn("parseUIDateTime called with empty strings.");
        return null;
    }
    try {
        let year, month, day, hour, minute;
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*?(AM|PM)?/i);
        if (!timeMatch) throw new Error(`Invalid time format: "${timeStr}"`);
        hour = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2]);
        const period = timeMatch[3]?.toUpperCase() || '';
        if (isNaN(hour) || isNaN(minute) || minute < 0 || minute > 59) throw new Error(`Invalid minute value: ${minute}`);
        if (state.settings.timeFormat === '12hr') {
            if (hour < 1 || hour > 12) throw new Error(`Invalid 12hr hour value: ${hour}`);
        } else {
            if (hour < 0 || hour > 23) throw new Error(`Invalid 24hr hour value: ${hour}`);
        }
        const dateParts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (!dateParts) throw new Error(`Invalid date format: "${dateStr}"`);
        if (state.settings.dateFormat === 'DDMMYYYY') {
            day = parseInt(dateParts[1]);
            month = parseInt(dateParts[2]) - 1;
            year = parseInt(dateParts[3]);
        } else {
            month = parseInt(dateParts[1]) - 1;
            day = parseInt(dateParts[2]);
            year = parseInt(dateParts[3]);
        }
        if (isNaN(year) || isNaN(month) || isNaN(day) || year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
            throw new Error(`Invalid year/month/day values: Y=${year}, M=${month}, D=${day}`);
        }
        let hour24 = hour;
        if (state.settings.timeFormat === '12hr' || period) {
            if (period === 'PM' && hour !== 12) hour24 += 12;
            if (period === 'AM' && hour === 12) hour24 = 0;
        }
        const dt = new Date(year, month, day, hour24, minute);
        if (isNaN(dt.getTime()) || dt.getFullYear() !== year || dt.getMonth() !== month || dt.getDate() !== day || dt.getHours() !== hour24 || dt.getMinutes() !== minute) {
            throw new Error("Resulting Date object is invalid or components mismatch after creation.");
        }
        return dt;
    } catch (error) {
        console.error("Error parsing UI date/time:", error);
        const expectedDateFormat = state.settings.dateFormat.replace('YYYY', 'YY').replace('MM', 'M').replace('DD', 'D');
        const expectedTimeFormat = state.settings.timeFormat === '12hr' ? 'H:MM AM/PM' : 'HH:MM';
        showCustomAlert('Error', `Invalid date or time format entered: "${dateStr} ${timeStr}". Please use format ${expectedDateFormat} and ${expectedTimeFormat}.`, 'error');
        return null;
    }
}

export function getCacheKey(year, month) {
    return `${year}-${(month + 1).toString().padStart(2, '0')}`;
}
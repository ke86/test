// VRkalender - Utility Functions
// Helper functions used across the application

import {
    monthNamesShort,
    currentYear,
    fpDays,
    fpvDays,
    afdDays,
    parentalLeaveDays,
    vacationDays,
    manualFpDays,
    manualFpvDays,
    daysOff,
    shiftData
} from './state.js';

// Get week number (ISO 8601)
export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Escape HTML for safe rendering
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check if a date is a day off
export function isDayOff(year, month, day) {
    return daysOff.has(`${year}-${month}-${day}`);
}

// Check day types for schedule
export function isFpDay(year, month, day) {
    return fpDays.has(`${year}-${month}-${day}`);
}

export function isFpvDay(year, month, day) {
    return fpvDays.has(`${year}-${month}-${day}`);
}

export function isAfdDay(year, month, day) {
    return afdDays.has(`${year}-${month}-${day}`);
}

export function isParentalLeaveDay(year, month, day) {
    return parentalLeaveDays.has(`${year}-${month}-${day}`);
}

export function isVacationDay(year, month, day) {
    return vacationDays.has(`${year}-${month}-${day}`);
}

// Check if day is manually added (shows X button)
export function isManualFpDay(year, month, day) {
    return manualFpDays.has(`${year}-${month}-${day}`);
}

export function isManualFpvDay(year, month, day) {
    return manualFpvDays.has(`${year}-${month}-${day}`);
}

// Get shift data for a specific date
export function getShiftForDate(year, month, day) {
    const key = `${year}-${month}-${day}`;
    return shiftData.get(key);
}

// Format time string (HH:MM)
export function formatTime(time) {
    if (!time) return '';
    return time;
}

// Parse date key to object
export function parseDateKey(key) {
    const parts = key.split('-');
    return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2])
    };
}

// Create date key from components
export function createDateKey(year, month, day) {
    return `${year}-${month}-${day}`;
}

// Check if two dates are the same day
export function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Get days in a month
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
export function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// Format month and year for display
export function formatMonthYear(year, month, monthNames) {
    return `${monthNames[month]} ${year}`;
}

// Deep clone a Set
export function cloneSet(set) {
    return new Set(set);
}

// Deep clone a Map
export function cloneMap(map) {
    return new Map(map);
}

// Serialize Set to Array for storage
export function setToArray(set) {
    return Array.from(set);
}

// Deserialize Array to Set
export function arrayToSet(arr) {
    return new Set(arr || []);
}

// Serialize Map to Object for storage
export function mapToObject(map) {
    const obj = {};
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}

// Deserialize Object to Map
export function objectToMap(obj) {
    const map = new Map();
    if (obj) {
        Object.entries(obj).forEach(([key, value]) => {
            map.set(key, value);
        });
    }
    return map;
}

// Generate unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Count items in Set for a specific year
export function countForYear(set, year) {
    let count = 0;
    set.forEach(key => {
        const keyYear = parseInt(key.split('-')[0]);
        if (keyYear === year) count++;
    });
    return count;
}

// Check if date is weekend (Saturday or Sunday)
export function isWeekend(year, month, day) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
}

// Check if date is today
export function isToday(year, month, day) {
    const today = new Date();
    return year === today.getFullYear() &&
           month === today.getMonth() &&
           day === today.getDate();
}

// Get Swedish day name abbreviation (Mon = Mån, etc.)
export function getDayAbbrev(dayOfWeek) {
    const abbrevs = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    return abbrevs[dayOfWeek];
}

// Sort time strings (HH:MM format)
export function sortByTime(a, b) {
    if (!a.start) return 1;
    if (!b.start) return -1;
    return a.start.localeCompare(b.start);
}

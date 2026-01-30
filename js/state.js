// VRkalender - State & Configuration
// Application state variables and setters

// Re-export schedules from dedicated module
export { savedSchedules } from './schedules.js';

// Swedish month names
export const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                           'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
export const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun',
                                 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
export const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];

// Current date state
export let currentDate = new Date();
export let currentYear = currentDate.getFullYear();
export let currentMonth = currentDate.getMonth();

// Days off storage
export let daysOff = new Set();
export let baseDaysOff = [];
export let repeatInterval = 0;
export let startWeekOffset = 0;

// Test schedule storage (FP, FPV, AFD)
export let fpDays = new Set();    // Fridag på helg (grön)
export let fpvDays = new Set();   // Fridag på vardag (grön streckad)
export let afdDays = new Set();   // Arbetsförlagd dag (gul)

// Manually added FP/FPV (to track which ones show the X button)
export let manualFpDays = new Set();
export let manualFpvDays = new Set();

// User-added leave types
export let parentalLeaveDays = new Set();  // Föräldraledighet (lila streckad)
export let vacationDays = new Set();       // Semester (blå streckad)

// Shift data from uploaded PDFs (key: "year-month-day", value: {service, start, end})
export let shiftData = new Map();

// PDF-uploaded data (kept separate so it persists when loading saved schemas)
export let pdfUploadedData = {
    fpDays: new Set(),
    fpvDays: new Set(),
    afdDays: new Set(),
    parentalLeaveDays: new Set(),
    vacationDays: new Set(),
    shiftData: new Map()
};

// Profile system - stores multiple persons' schedules
export let profiles = [];  // Array of profile objects
export let activeProfileIndex = -1;  // -1 = no active profile

// Saved schemas storage (in-memory)
export let savedSchemas = [];

// Drag state for FP/FPV moving
export let draggedDay = null;
export let draggedType = null;

// Settings
export let showSwedishHolidays = true;
export let showNorwegianHolidays = false;

// State setters (needed because ES6 modules export bindings, not values)
export function setCurrentYear(year) { currentYear = year; }
export function setCurrentMonth(month) { currentMonth = month; }
export function setFpDays(days) { fpDays = days; }
export function setFpvDays(days) { fpvDays = days; }
export function setAfdDays(days) { afdDays = days; }
export function setParentalLeaveDays(days) { parentalLeaveDays = days; }
export function setVacationDays(days) { vacationDays = days; }
export function setShiftData(data) { shiftData = data; }
export function setManualFpDays(days) { manualFpDays = days; }
export function setManualFpvDays(days) { manualFpvDays = days; }
export function setProfiles(p) { profiles = p; }
export function setActiveProfileIndex(idx) { activeProfileIndex = idx; }
export function setDraggedDay(day) { draggedDay = day; }
export function setDraggedType(type) { draggedType = type; }
export function setShowSwedishHolidays(show) { showSwedishHolidays = show; }
export function setShowNorwegianHolidays(show) { showNorwegianHolidays = show; }

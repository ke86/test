// VRkalender - Main Application Entry Point
// ES6 Module - coordinates all other modules
// Version 0.97

// ===== IMPORTS =====
import {
    monthNames, monthNamesShort, dayNames,
    currentYear, currentMonth,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays,
    manualFpDays, manualFpvDays, daysOff, shiftData,
    profiles, activeProfileIndex, savedSchemas, savedSchedules,
    pdfUploadedData, baseDaysOff,
    showSwedishHolidays, showNorwegianHolidays,
    setCurrentMonth, setCurrentYear,
    setFpDays, setFpvDays, setAfdDays, setParentalLeaveDays, setVacationDays,
    setManualFpDays, setManualFpvDays, setShiftData,
    setProfiles, setActiveProfileIndex,
    setShowSwedishHolidays, setShowNorwegianHolidays
} from './state.js';

import {
    getWeekNumber, escapeHtml,
    isFpDay, isFpvDay, isAfdDay, isParentalLeaveDay, isVacationDay,
    isManualFpDay, isManualFpvDay, getShiftForDate,
    countForYear, isWeekend, isToday
} from './utils.js';

import {
    getEaster, getSwedishHolidays, getNorwegianHolidays,
    getHolidaysForYear, getObRates, getObCategory,
    getStorhelgPeriod, isPartialStorhelgDay, isWithinStorhelgPeriod,
    isSwedishHoliday, isNorwegianHoliday
} from './holidays.js';

import {
    renderCalendar, goToPrevMonth, goToNextMonth, goToToday,
    setCalendarCallbacks, addLongPressHandler,
    handleDayClickForMove, cancelMove, getSelectedMoveDay, getLongPressTriggered
} from './calendar.js';

import {
    renderListView, renderMonthListView, initHolidayInfoModal,
    setListViewCallbacks
} from './listview.js';

import {
    renderProfileList, renderWorkingTodayList, updateProfileNameDisplay,
    switchToProfile, saveCurrentDataToProfile, loadProfileData,
    createProfileFromPdf, clearCalendarDataSilent, getActiveProfileName,
    setProfileCallbacks, showCreateProfileModal
} from './profiles.js';

import {
    closeLeaveModal, showLeaveTypeModal, showDayTypeInfo, showDayInfoWithLeave,
    showUnifiedDayPopup, showWeekLeaveModal, initModals, getLeaveModalJustClosed,
    setModalCallbacks
} from './modals.js';

import { generateYearlyPdf, generateYearlyPdfWithName } from './pdf-export.js';
import { initPdfUpload, setPdfImportCallbacks } from './pdf-import.js';
import { saveToStorage, loadFromStorage, isStorageAvailable, exportToFile, getStorageInfo } from './storage.js';

// ===== STORAGE FUNCTIONS =====

// Collect current state for saving
function getCurrentState() {
    return {
        profiles,
        activeProfileIndex,
        fpDays,
        fpvDays,
        afdDays,
        manualFpDays,
        manualFpvDays,
        parentalLeaveDays,
        vacationDays,
        shiftData,
        showSwedishHolidays,
        showNorwegianHolidays,
        currentYear,
        currentMonth
    };
}

// Save current state to localStorage
function saveState() {
    if (isStorageAvailable()) {
        saveToStorage(getCurrentState());
    }
}

// Load state from localStorage and apply to app
function loadState() {
    if (!isStorageAvailable()) {
        console.warn('⚠️ localStorage ej tillgänglig');
        return false;
    }

    const saved = loadFromStorage();
    if (!saved) return false;

    // Apply loaded data to state
    if (saved.profiles) setProfiles(saved.profiles);
    if (saved.activeProfileIndex !== undefined) setActiveProfileIndex(saved.activeProfileIndex);

    if (saved.fpDays) setFpDays(saved.fpDays);
    if (saved.fpvDays) setFpvDays(saved.fpvDays);
    if (saved.afdDays) setAfdDays(saved.afdDays);
    if (saved.manualFpDays) setManualFpDays(saved.manualFpDays);
    if (saved.manualFpvDays) setManualFpvDays(saved.manualFpvDays);
    if (saved.parentalLeaveDays) setParentalLeaveDays(saved.parentalLeaveDays);
    if (saved.vacationDays) setVacationDays(saved.vacationDays);
    if (saved.shiftData) setShiftData(saved.shiftData);

    if (saved.showSwedishHolidays !== undefined) setShowSwedishHolidays(saved.showSwedishHolidays);
    if (saved.showNorwegianHolidays !== undefined) setShowNorwegianHolidays(saved.showNorwegianHolidays);

    // Update year/month if saved (optional - you might want to always start at today)
    // if (saved.currentYear) setCurrentYear(saved.currentYear);
    // if (saved.currentMonth !== undefined) setCurrentMonth(saved.currentMonth);

    console.log('✅ State laddad från localStorage');
    return true;
}

// Auto-save with debounce to avoid too many saves
let saveTimeout = null;
function scheduleAutoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveState();
    }, 1000); // Save 1 second after last change
}

// ===== HELPER FUNCTIONS =====

// Refresh all views and trigger auto-save
function refreshAllViews() {
    renderCalendar();
    updateLegend();
    const monthListToggle = document.getElementById('monthListToggle');
    if (monthListToggle && monthListToggle.classList.contains('active')) {
        renderMonthListView();
    }
    // Auto-save after any data change
    scheduleAutoSave();
}

// Update legend - always show FP, FPV, FL, SEM counts
function updateLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;

    let fpCount = 0;
    let fpvCount = 0;
    let flCount = 0;
    let semCount = 0;

    fpDays.forEach(key => {
        const year = parseInt(key.split('-')[0]);
        if (year === currentYear) fpCount++;
    });

    fpvDays.forEach(key => {
        const year = parseInt(key.split('-')[0]);
        if (year === currentYear) fpvCount++;
    });

    parentalLeaveDays.forEach(key => {
        const year = parseInt(key.split('-')[0]);
        if (year === currentYear) flCount++;
    });

    vacationDays.forEach(key => {
        const year = parseInt(key.split('-')[0]);
        if (year === currentYear) semCount++;
    });

    legend.innerHTML = `
        <div class="legend-item">
            <div class="legend-dot fp"></div>
            <span>FP ${fpCount}</span>
        </div>
        <div class="legend-item">
            <div class="legend-dot fpv"></div>
            <span>FPV ${fpvCount}</span>
        </div>
        <div class="legend-item">
            <div class="legend-dot parental"></div>
            <span>FL ${flCount}</span>
        </div>
        <div class="legend-item">
            <div class="legend-dot vacation"></div>
            <span>SEM ${semCount}</span>
        </div>
    `;
}

// Get service icon HTML based on turn number
function getServiceIconHtml(service, size = 'small') {
    if (!service) return '';

    const sizeClass = size === 'large' ? 'service-icon-large' : 'service-icon-small';
    const s = service.toUpperCase();

    // Night shifts (starts before 05:00)
    if (/^[0-9]*[13579][0-9]{3}$/.test(s) || s.includes('NATT')) {
        return `<span class="${sizeClass}" title="Nattpass">🌙</span>`;
    }

    // Reserve
    if (s.includes('RESERV') || s.includes('RES')) {
        return `<span class="${sizeClass}" title="Reserv">📞</span>`;
    }

    // Early morning (before 06:00)
    if (/^[0-9]*[02468][0-9]{3}$/.test(s)) {
        const firstDigit = parseInt(s.charAt(s.length - 4));
        if (firstDigit < 6) {
            return `<span class="${sizeClass}" title="Tidig morgon">🌅</span>`;
        }
    }

    return '';
}

// Get priority icon for calendar cell
function getPriorityIcon(year, month, day, isOtherMonth, shift) {
    if (isOtherMonth) return null;

    const key = `${year}-${month}-${day}`;

    // Check for storhelg
    const storhelgCheck = isWithinStorhelgPeriod(year, month, day);
    if (storhelgCheck) {
        return { text: '⭐', class: 'icon-storhelg', title: 'Storhelg OB' };
    }

    // Check for partial storhelg
    const partialCheck = isPartialStorhelgDay(year, month, day);
    if (partialCheck) {
        const isKval = partialCheck.category === 'kvalificerad';
        return {
            text: isKval ? '🌙' : '⭐',
            class: isKval ? 'icon-kvalificerad' : 'icon-storhelg',
            title: `${isKval ? 'Kvalificerad' : 'Storhelg'} OB ${partialCheck.time}`
        };
    }

    // Show manual X button for manually added FP/FPV
    if (isManualFpDay(year, month, day) || isManualFpvDay(year, month, day)) {
        return { text: '✕', class: 'icon-remove', title: 'Klicka för att ta bort' };
    }

    // Show service icon if shift exists
    if (shift && shift.service) {
        const icon = getServiceIconHtml(shift.service, 'small');
        if (icon) {
            // Extract emoji from icon HTML
            const match = icon.match(/>(.+?)</);
            if (match) {
                return { text: match[1], class: 'icon-service', title: shift.service };
            }
        }
    }

    return null;
}

// ===== SET UP CALLBACKS =====

// Calendar callbacks
setCalendarCallbacks({
    showUnifiedDayPopup: showUnifiedDayPopup,
    handleDayClickForMove: handleDayClickForMove,
    showWeekLeaveModal: showWeekLeaveModal,
    getPriorityIcon: getPriorityIcon
});

// List view callbacks
setListViewCallbacks({
    showLeaveTypeModal: showLeaveTypeModal,
    showDayInfoWithLeave: showDayInfoWithLeave,
    showDayTypeInfo: showDayTypeInfo,
    handleDayClickForMove: handleDayClickForMove,
    getServiceIconHtml: getServiceIconHtml,
    getSelectedMoveDay: getSelectedMoveDay,
    getLeaveModalJustClosed: getLeaveModalJustClosed
});

// Profile callbacks
setProfileCallbacks({
    refreshAllViews: refreshAllViews,
    generateYearlyPdfWithName: generateYearlyPdfWithName,
    onDataChanged: scheduleAutoSave
});

// Modal callbacks
setModalCallbacks({
    refreshAllViews: refreshAllViews,
    renderCalendar: renderCalendar,
    renderListView: renderListView,
    onDataChanged: scheduleAutoSave
});

// PDF import callbacks
setPdfImportCallbacks({
    refreshAllViews: refreshAllViews
});

// ===== DARK MODE =====
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

// ===== NAVIGATION =====
document.getElementById('prevMonth').addEventListener('click', () => {
    goToPrevMonth();
    refreshAllViews();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    goToNextMonth();
    refreshAllViews();
});

document.getElementById('todayBtn').addEventListener('click', () => {
    goToToday();
    refreshAllViews();
});

// ===== VIEW TOGGLE =====
const calendarListToggle = document.getElementById('calendarListToggle');
const listToggle = document.getElementById('listToggle');
const workingTodayToggleBtn = document.getElementById('workingTodayToggleBtn');
const calendarView = document.getElementById('calendarView');
const monthListView = document.getElementById('monthListView');
const listView = document.getElementById('listView');

// Track current view state for calendar/list toggle
let isCalendarView = true;

function showView(view) {
    calendarView.style.display = view === 'calendar' ? 'block' : 'none';
    monthListView.style.display = view === 'monthList' ? 'block' : 'none';
    listView.style.display = view === 'list' ? 'block' : 'none';

    // Update toggle button states
    calendarListToggle.classList.toggle('active', view === 'calendar' || view === 'monthList');
    listToggle.classList.toggle('active', view === 'list');
    workingTodayToggleBtn.classList.remove('active');

    // Update calendar/list toggle icon
    const calendarIcon = calendarListToggle.querySelector('.calendar-icon');
    const listIcon = calendarListToggle.querySelector('.list-icon');
    if (view === 'calendar') {
        isCalendarView = true;
        calendarIcon.style.display = 'block';
        listIcon.style.display = 'none';
    } else if (view === 'monthList') {
        isCalendarView = false;
        calendarIcon.style.display = 'none';
        listIcon.style.display = 'block';
    }

    if (view === 'monthList') renderMonthListView();
    if (view === 'list') renderListView();
}

// Calendar/List toggle - switches between calendar and list view
calendarListToggle.addEventListener('click', () => {
    if (isCalendarView) {
        showView('monthList');
    } else {
        showView('calendar');
    }
});

// Helgdagar toggle
listToggle.addEventListener('click', () => showView('list'));

// Vem jobbar idag - show modal
workingTodayToggleBtn.addEventListener('click', () => {
    showWorkingTodayModal();
});

// Show "Vem jobbar idag" modal
function showWorkingTodayModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'workingTodayModal';

    // Get working today data
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
    const monthNames = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

    const workingToday = [];
    profiles.forEach(profile => {
        if (!profile.data || !profile.data.shiftData) return;
        const shift = profile.data.shiftData.get(todayKey);
        if (shift && shift.start && shift.end) {
            const hasFP = profile.data.fpDays && profile.data.fpDays.has(todayKey);
            const hasFPV = profile.data.fpvDays && profile.data.fpvDays.has(todayKey);
            const hasParental = profile.data.parentalLeaveDays && profile.data.parentalLeaveDays.has(todayKey);
            const hasVacation = profile.data.vacationDays && profile.data.vacationDays.has(todayKey);

            if (!hasFP && !hasFPV && !hasParental && !hasVacation) {
                workingToday.push({
                    name: profile.name,
                    start: shift.start,
                    end: shift.end
                });
            }
        }
    });

    workingToday.sort((a, b) => a.start.localeCompare(b.start));

    let listHtml = '';
    if (workingToday.length === 0) {
        listHtml = '<p style="text-align: center; color: var(--text-muted); padding: 20px 0;">Inga personer jobbar idag<br>(baserat på inlästa profiler)</p>';
    } else {
        workingToday.forEach(person => {
            listHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="font-weight: 500; color: var(--text-primary);">${person.name}</span>
                    <span style="color: var(--text-secondary); font-size: 14px;">${person.start} - ${person.end}</span>
                </div>
            `;
        });
    }

    modal.innerHTML = `
        <div class="holiday-info-modal" style="padding: 24px; max-width: 360px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="font-size: 18px; color: var(--text-primary); margin: 0;">👷 Vem jobbar idag?</h2>
                <button class="modal-close" id="workingTodayClose" style="background: none; border: none; cursor: pointer; padding: 4px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                ${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}
            </p>
            <div class="working-today-list">
                ${listHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('workingTodayClose').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ===== HAMBURGER MENU =====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidePanelOverlay = document.getElementById('sidePanelOverlay');
const sidePanelClose = document.getElementById('sidePanelClose');
const menuSettingsBtn = document.getElementById('menuSettingsBtn');

hamburgerBtn.addEventListener('click', () => {
    sidePanelOverlay.classList.add('active');
    renderWorkingTodayList();
});

sidePanelClose.addEventListener('click', () => {
    sidePanelOverlay.classList.remove('active');
});

sidePanelOverlay.addEventListener('click', (e) => {
    if (e.target === sidePanelOverlay) {
        sidePanelOverlay.classList.remove('active');
    }
});

menuSettingsBtn.addEventListener('click', () => {
    sidePanelOverlay.classList.remove('active');
    updateActiveProfileIndicator();
    document.getElementById('settingsModalOverlay').classList.add('active');
});

// Update active profile indicator in settings
function updateActiveProfileIndicator() {
    const indicator = document.getElementById('activeProfileIndicator');
    if (!indicator) return;

    const profileName = getActiveProfileName();
    if (profileName) {
        indicator.className = 'active-profile-indicator';
        indicator.innerHTML = `
            <span class="profile-icon">👤</span>
            <span class="profile-label">Aktiv profil:</span>
            <span class="profile-name">${profileName}</span>
        `;
    } else {
        indicator.className = 'active-profile-indicator no-profile';
        indicator.innerHTML = `
            <span class="profile-icon">⚠️</span>
            <span class="profile-name">Ingen profil vald</span>
        `;
    }
}

// Settings button in header (opens settings modal)
const settingsBtn = document.getElementById('settingsBtn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        updateActiveProfileIndicator();
        document.getElementById('settingsModalOverlay').classList.add('active');
    });
}

// Collapsible sections in hamburger menu
function setupCollapsible(toggleId, contentId) {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);
    if (!toggle || !content) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        content.classList.toggle('show');
    });
}

setupCollapsible('workingTodayToggle', 'workingTodayContent');
setupCollapsible('profilesToggle', 'profilesContent');
setupCollapsible('savedSchemasToggle', 'savedSchemasContent');

// ===== SAVED SCHEMAS =====
const saveSchemaBtn = document.getElementById('saveSchemaBtn');
const saveSchemaModal = document.getElementById('saveSchemaModal');
const schemaNameInput = document.getElementById('schemaNameInput');
const saveSchemaCancel = document.getElementById('saveSchemaCancel');
const saveSchemaSave = document.getElementById('saveSchemaSave');
const savedSchemaList = document.getElementById('savedSchemaList');

function renderSavedSchemas() {
    if (savedSchemas.length === 0) {
        savedSchemaList.innerHTML = '<p class="no-schemas-msg">Inga sparade scheman</p>';
        return;
    }

    let html = '';
    savedSchemas.forEach((schema, index) => {
        const date = new Date(schema.timestamp);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        html += `
            <div class="saved-schema-item" data-index="${index}">
                <div class="schema-name">
                    ${escapeHtml(schema.name)}
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${dateStr}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="schema-download" data-index="${index}" title="Ladda ner PDF">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button class="schema-delete" data-index="${index}" title="Ta bort">×</button>
                </div>
            </div>
        `;
    });
    savedSchemaList.innerHTML = html;

    // Add event handlers
    savedSchemaList.querySelectorAll('.saved-schema-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.schema-download') || e.target.closest('.schema-delete')) return;
            const index = parseInt(item.dataset.index);
            loadSchema(index);
        });
    });

    savedSchemaList.querySelectorAll('.schema-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            downloadSchemaPdf(index);
        });
    });

    savedSchemaList.querySelectorAll('.schema-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteSchema(index);
        });
    });
}

function loadSchema(index) {
    if (index < 0 || index >= savedSchemas.length) return;
    const schema = savedSchemas[index];

    setFpDays(new Set(schema.fpDays || []));
    setFpvDays(new Set(schema.fpvDays || []));
    setAfdDays(new Set(schema.afdDays || []));
    setParentalLeaveDays(new Set(schema.parentalLeaveDays || []));
    setVacationDays(new Set(schema.vacationDays || []));
    setManualFpDays(new Set(schema.manualFpDays || []));
    setManualFpvDays(new Set(schema.manualFpvDays || []));
    setShiftData(new Map(schema.shiftData || []));

    sidePanelOverlay.classList.remove('active');
    refreshAllViews();
}

function deleteSchema(index) {
    if (index < 0 || index >= savedSchemas.length) return;
    savedSchemas.splice(index, 1);
    renderSavedSchemas();
}

function downloadSchemaPdf(index) {
    if (index < 0 || index >= savedSchemas.length) return;
    const schema = savedSchemas[index];

    // Temporarily load schema data
    const originalFpDays = new Set(fpDays);
    const originalFpvDays = new Set(fpvDays);
    const originalAfdDays = new Set(afdDays);
    const originalDaysOff = new Set(daysOff);
    const originalParentalLeaveDays = new Set(parentalLeaveDays);
    const originalVacationDays = new Set(vacationDays);
    const originalManualFpDays = new Set(manualFpDays);
    const originalManualFpvDays = new Set(manualFpvDays);
    const originalShiftData = new Map(shiftData);

    setFpDays(new Set(schema.fpDays || []));
    setFpvDays(new Set(schema.fpvDays || []));
    setAfdDays(new Set(schema.afdDays || []));
    setParentalLeaveDays(new Set(schema.parentalLeaveDays || []));
    setVacationDays(new Set(schema.vacationDays || []));
    setManualFpDays(new Set(schema.manualFpDays || []));
    setManualFpvDays(new Set(schema.manualFpvDays || []));
    setShiftData(new Map(schema.shiftData || []));

    generateYearlyPdfWithName(schema.name);

    // Restore original data
    setFpDays(originalFpDays);
    setFpvDays(originalFpvDays);
    setAfdDays(originalAfdDays);
    setParentalLeaveDays(originalParentalLeaveDays);
    setVacationDays(originalVacationDays);
    setManualFpDays(originalManualFpDays);
    setManualFpvDays(originalManualFpvDays);
    setShiftData(originalShiftData);
}

saveSchemaBtn.addEventListener('click', () => {
    schemaNameInput.value = '';
    saveSchemaModal.classList.add('active');
    setTimeout(() => schemaNameInput.focus(), 100);
});

saveSchemaCancel.addEventListener('click', () => {
    saveSchemaModal.classList.remove('active');
});

saveSchemaSave.addEventListener('click', () => {
    const name = schemaNameInput.value.trim();
    if (!name) return;

    savedSchemas.push({
        name: name,
        timestamp: Date.now(),
        fpDays: Array.from(fpDays),
        fpvDays: Array.from(fpvDays),
        afdDays: Array.from(afdDays),
        parentalLeaveDays: Array.from(parentalLeaveDays),
        vacationDays: Array.from(vacationDays),
        manualFpDays: Array.from(manualFpDays),
        manualFpvDays: Array.from(manualFpvDays),
        shiftData: Array.from(shiftData.entries())
    });

    renderSavedSchemas();
    saveSchemaModal.classList.remove('active');
});

saveSchemaModal.addEventListener('click', (e) => {
    if (e.target === saveSchemaModal) {
        saveSchemaModal.classList.remove('active');
    }
});

// ===== SCHEDULE SELECTOR =====
const scheduleSelect = document.getElementById('scheduleSelect');
const positionSelect = document.getElementById('positionSelect');
const positionSelectorContainer = document.getElementById('positionSelectorContainer');
const scheduleDescription = document.getElementById('scheduleDescription');
const applySelectedScheduleBtn = document.getElementById('applySelectedScheduleBtn');
const noSchedulesHint = document.getElementById('noSchedulesHint');

function updateScheduleSelect() {
    const scheduleNames = Object.keys(savedSchedules).sort();

    scheduleSelect.innerHTML = '<option value="">-- Inget schema valt --</option>';

    scheduleNames.forEach(name => {
        const schedule = savedSchedules[name];
        const option = document.createElement('option');
        option.value = name;
        const positionCount = schedule.size || Object.keys(schedule.positions || {}).length;
        option.textContent = schedule.description
            ? `${name} - ${schedule.description} (${positionCount} platser)`
            : `${name} (${positionCount} platser)`;
        scheduleSelect.appendChild(option);
    });

    if (scheduleNames.length > 0) {
        noSchedulesHint.style.display = 'none';
        applySelectedScheduleBtn.disabled = true;
    } else {
        noSchedulesHint.style.display = 'block';
        applySelectedScheduleBtn.disabled = true;
        positionSelectorContainer.style.display = 'none';
        scheduleDescription.style.display = 'none';
    }
}

scheduleSelect.addEventListener('change', () => {
    const selectedSchedule = scheduleSelect.value;

    if (!selectedSchedule || !savedSchedules[selectedSchedule]) {
        positionSelectorContainer.style.display = 'none';
        scheduleDescription.style.display = 'none';
        applySelectedScheduleBtn.disabled = true;
        return;
    }

    const schedule = savedSchedules[selectedSchedule];
    const size = schedule.size || 12;

    positionSelect.innerHTML = '';
    for (let i = 1; i <= size; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Position ${i}`;
        positionSelect.appendChild(option);
    }

    positionSelectorContainer.style.display = 'block';

    if (schedule.description) {
        scheduleDescription.textContent = `${schedule.description} - ${schedule.cycle || size} veckors cykel`;
        scheduleDescription.style.display = 'block';
    } else {
        scheduleDescription.style.display = 'none';
    }

    applySelectedScheduleBtn.disabled = false;
});

applySelectedScheduleBtn.addEventListener('click', () => {
    // Check if there's an active profile first
    if (activeProfileIndex < 0 || profiles.length === 0) {
        document.getElementById('settingsModalOverlay').classList.remove('active');
        showNoProfileWarning();
        return;
    }

    const selectedScheduleName = scheduleSelect.value;
    const selectedPosition = parseInt(positionSelect.value) || 1;

    if (!selectedScheduleName || !savedSchedules[selectedScheduleName]) return;

    const schedule = savedSchedules[selectedScheduleName];
    const cycle = schedule.cycle || schedule.size || 12;
    const positions = schedule.positions;

    fpDays.clear();
    fpvDays.clear();
    afdDays.clear();
    daysOff.clear();
    shiftData.clear();
    baseDaysOff.length = 0;

    const yearNow = new Date().getFullYear();

    // Find week 9 Monday
    const jan1 = new Date(yearNow, 0, 1);
    const jan1Day = jan1.getDay();
    let week1Monday;
    if (jan1Day <= 4) {
        week1Monday = new Date(yearNow, 0, 1 - (jan1Day === 0 ? 6 : jan1Day - 1));
    } else {
        week1Monday = new Date(yearNow, 0, 1 + (8 - jan1Day));
    }
    const week9Monday = new Date(week1Monday);
    week9Monday.setDate(week1Monday.getDate() + (8 * 7));

    const dayNameToIndex = {
        mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0
    };

    const endDate = new Date(yearNow + 2, 0, 31);
    const endTime = endDate.getTime();

    let weekInCycle = selectedPosition;
    let isFirstWeek = true;

    for (let weekOffset = 0; weekOffset < 110; weekOffset++) {
        const weekStartDate = new Date(week9Monday);
        weekStartDate.setDate(week9Monday.getDate() + (weekOffset * 7));

        if (weekStartDate.getTime() > endTime) break;

        const positionPattern = positions[weekInCycle] || {};

        Object.entries(positionPattern).forEach(([dayName, dayType]) => {
            if (!dayType) return;

            const dayIndex = dayNameToIndex[dayName];
            if (dayIndex === undefined) return;

            if (isFirstWeek && dayIndex !== 0) return;

            const targetDate = new Date(weekStartDate);
            const currentDow = targetDate.getDay();
            let daysToAdd = dayIndex - currentDow;
            if (daysToAdd < 0) daysToAdd += 7;
            targetDate.setDate(targetDate.getDate() + daysToAdd);

            const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`;
            const month = targetDate.getMonth();

            if (dayType === 'FP') {
                fpDays.add(key);
            } else if (dayType === 'FPV') {
                if (month < 5 || month > 7) {
                    fpvDays.add(key);
                }
            }
        });

        isFirstWeek = false;
        weekInCycle = weekInCycle >= cycle ? 1 : weekInCycle + 1;
    }

    // Re-apply PDF-uploaded data
    pdfUploadedData.fpDays.forEach(key => fpDays.add(key));
    pdfUploadedData.fpvDays.forEach(key => fpvDays.add(key));
    pdfUploadedData.afdDays.forEach(key => afdDays.add(key));
    pdfUploadedData.parentalLeaveDays.forEach(key => parentalLeaveDays.add(key));
    pdfUploadedData.vacationDays.forEach(key => vacationDays.add(key));
    pdfUploadedData.shiftData.forEach((val, key) => shiftData.set(key, val));

    // Save schedule to active profile
    if (activeProfileIndex >= 0 && activeProfileIndex < profiles.length) {
        profiles[activeProfileIndex].schedule = {
            name: selectedScheduleName,
            position: selectedPosition
        };
        saveCurrentDataToProfile(activeProfileIndex);
    }

    refreshAllViews();
    renderListView();
    updateProfileNameDisplay();
    document.getElementById('settingsModalOverlay').classList.remove('active');
});

// Load schedule button in header
const loadScheduleBtn = document.getElementById('loadScheduleBtn');
if (loadScheduleBtn) {
    loadScheduleBtn.addEventListener('click', () => {
        // Check if there's an active profile first
        if (activeProfileIndex < 0 || profiles.length === 0) {
            showNoProfileWarning();
            return;
        }

        updateActiveProfileIndicator();
        document.getElementById('settingsModalOverlay').classList.add('active');

        const scheduleContent = document.getElementById('scheduleSettingsContent');
        const scheduleArrow = document.getElementById('scheduleSettingsArrow');
        if (scheduleContent && scheduleArrow) {
            scheduleContent.style.display = 'block';
            scheduleArrow.classList.add('expanded');
        }
    });
}

// Show warning when no profile exists
function showNoProfileWarning() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'noProfileWarningModal';
    modal.innerHTML = `
        <div class="holiday-info-modal" style="padding: 24px; max-width: 340px;">
            <div style="text-align: center; margin-bottom: 16px;">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--ios-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2 style="font-size: 18px; margin-bottom: 12px; color: var(--text-primary); text-align: center;">Skapa profil först</h2>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; text-align: center;">
                Du behöver skapa en profil innan du kan välja fridagsnyckel. Vill du skapa en profil nu?
            </p>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" id="noProfileCancel" style="flex: 1;">Avbryt</button>
                <button class="btn-primary" id="noProfileCreate" style="flex: 1;">Skapa profil</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('noProfileCreate').addEventListener('click', () => {
        modal.remove();
        showCreateProfileModal();
    });

    document.getElementById('noProfileCancel').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Add profile button in hamburger menu - show choice modal
const menuAddProfileBtn = document.getElementById('menuAddProfileBtn');
if (menuAddProfileBtn) {
    menuAddProfileBtn.addEventListener('click', () => {
        document.getElementById('sidePanelOverlay').classList.remove('active');
        showCreateProfileModal();
    });
}

// ===== INITIALIZATION =====
function init() {
    // Load saved data from localStorage first
    const hasStoredData = loadState();
    if (hasStoredData) {
        console.log('📂 Laddade sparad data');
    }

    // Initialize modals
    initModals();
    initHolidayInfoModal();
    initPdfUpload();

    // Initialize schedule select
    updateScheduleSelect();

    // Render initial views
    renderCalendar();
    renderListView();
    renderMonthListView();
    renderProfileList();
    renderSavedSchemas();
    updateLegend();
    updateProfileNameDisplay();

    // Show storage info in console
    if (isStorageAvailable()) {
        const info = getStorageInfo();
        if (info) {
            console.log(`💾 Lagrad data: ${info.sizeKB} KB, ${info.profileCount} profiler`);
        }
    }

    console.log('VRkalender v1.03 initialized');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

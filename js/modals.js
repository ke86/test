// VRkalender - Modals
// Leave type selection, day info, settings, and other modal dialogs

import {
    monthNames, dayNames,
    currentYear, currentMonth,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays,
    manualFpDays, manualFpvDays, shiftData,
    savedSchemas, savedSchedules, pdfUploadedData, baseDaysOff, daysOff,
    profiles, activeProfileIndex,
    showSwedishHolidays, showNorwegianHolidays,
    setShowSwedishHolidays, setShowNorwegianHolidays
} from './state.js';

import { getWeekNumber, escapeHtml } from './utils.js';
import { getHolidaysForYear, getObCategory, isWithinStorhelgPeriod, isPartialStorhelgDay } from './holidays.js';
import { saveCurrentDataToProfile, updateProfileNameDisplay, renderProfileList, clearCalendarDataSilent } from './profiles.js';

// Callbacks
let refreshAllViewsCallback = null;
let renderCalendarCallback = null;
let renderListViewCallback = null;
let onDataChangedCallback = null;

export function setModalCallbacks(callbacks) {
    refreshAllViewsCallback = callbacks.refreshAllViews;
    renderCalendarCallback = callbacks.renderCalendar;
    renderListViewCallback = callbacks.renderListView;
    onDataChangedCallback = callbacks.onDataChanged;
}

// Trigger data changed callback (for auto-save)
function notifyDataChanged() {
    if (onDataChangedCallback) onDataChangedCallback();
}

let leaveModalJustClosed = false;

export function getLeaveModalJustClosed() {
    return leaveModalJustClosed;
}

// Close leave modal
export function closeLeaveModal() {
    const overlay = document.getElementById('leaveTypeOverlay');
    overlay.classList.remove('active');
    leaveModalJustClosed = true;
    setTimeout(() => { leaveModalJustClosed = false; }, 300);
}

// Toggle leave functions
export function toggleParentalLeave(year, month, day) {
    const key = `${year}-${month}-${day}`;
    if (parentalLeaveDays.has(key)) {
        parentalLeaveDays.delete(key);
    } else {
        vacationDays.delete(key);
        parentalLeaveDays.add(key);
    }
    if (refreshAllViewsCallback) refreshAllViewsCallback();
}

export function toggleVacation(year, month, day) {
    const key = `${year}-${month}-${day}`;
    if (vacationDays.has(key)) {
        vacationDays.delete(key);
    } else {
        parentalLeaveDays.delete(key);
        vacationDays.add(key);
    }
    if (refreshAllViewsCallback) refreshAllViewsCallback();
}

export function toggleFp(year, month, day) {
    const key = `${year}-${month}-${day}`;
    if (fpDays.has(key)) {
        fpDays.delete(key);
        manualFpDays.delete(key);
    } else {
        fpvDays.delete(key);
        manualFpvDays.delete(key);
        afdDays.delete(key);
        parentalLeaveDays.delete(key);
        vacationDays.delete(key);
        fpDays.add(key);
        manualFpDays.add(key);
    }
    if (refreshAllViewsCallback) refreshAllViewsCallback();
}

export function toggleFpv(year, month, day) {
    const key = `${year}-${month}-${day}`;
    if (fpvDays.has(key)) {
        fpvDays.delete(key);
        manualFpvDays.delete(key);
    } else {
        fpDays.delete(key);
        manualFpDays.delete(key);
        afdDays.delete(key);
        parentalLeaveDays.delete(key);
        vacationDays.delete(key);
        fpvDays.add(key);
        manualFpvDays.add(key);
    }
    if (refreshAllViewsCallback) refreshAllViewsCallback();
}

export function toggleAfd(year, month, day) {
    const key = `${year}-${month}-${day}`;
    if (afdDays.has(key)) {
        afdDays.delete(key);
    } else {
        fpDays.delete(key);
        manualFpDays.delete(key);
        fpvDays.delete(key);
        manualFpvDays.delete(key);
        parentalLeaveDays.delete(key);
        vacationDays.delete(key);
        afdDays.add(key);
    }
    if (refreshAllViewsCallback) refreshAllViewsCallback();
}

// Show unified day popup
export function showUnifiedDayPopup(year, month, day) {
    const dateKey = `${year}-${month}-${day}`;
    const holidays = getHolidaysForYear(year);
    const holidayName = holidays[dateKey];
    const shift = shiftData.get(dateKey);

    const hasFP = fpDays.has(dateKey);
    const hasFPV = fpvDays.has(dateKey);
    const hasAFD = afdDays.has(dateKey);
    const hasParental = parentalLeaveDays.has(dateKey);
    const hasVacation = vacationDays.has(dateKey);

    const storhelgCheck = isWithinStorhelgPeriod(year, month, day);
    const partialCheck = isPartialStorhelgDay(year, month, day);

    // If has a leave type, show day type info
    if (hasFP) {
        showDayTypeInfo('FP', year, month, day);
        return;
    }
    if (hasFPV) {
        showDayTypeInfo('FPV', year, month, day);
        return;
    }
    if (hasAFD) {
        showDayTypeInfo('AFD', year, month, day);
        return;
    }
    if (hasParental) {
        showDayTypeInfo('FL', year, month, day);
        return;
    }
    if (hasVacation) {
        showDayTypeInfo('Semester', year, month, day);
        return;
    }

    // If holiday or storhelg, show day info with leave options
    if (holidayName || storhelgCheck || partialCheck) {
        showDayInfoWithLeave(year, month, day, storhelgCheck || partialCheck);
        return;
    }

    // Regular day - show leave type modal
    showLeaveTypeModal(year, month, day);
}

// Show leave type selection modal
export function showLeaveTypeModal(year, month, day) {
    const overlay = document.getElementById('leaveTypeOverlay');
    const title = document.getElementById('leaveModalTitle');
    const dateEl = document.getElementById('leaveModalDate');
    const shiftBox = document.getElementById('leaveModalShiftBox');
    const buttonsContainer = document.getElementById('leaveModalButtons');
    const subtitle = document.getElementById('leaveModalSubtitle');

    const date = new Date(year, month, day);
    const dayOfWeek = dayNames[date.getDay()];
    const monthName = monthNames[month];

    title.textContent = 'Välj ledighetstyp';
    dateEl.textContent = `${dayOfWeek} ${day} ${monthName} ${year}`;

    // Show shift if exists
    const dateKey = `${year}-${month}-${day}`;
    const shift = shiftData.get(dateKey);
    if (shift && shift.start && shift.end) {
        shiftBox.style.display = 'block';
        shiftBox.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 12px;">
                <span style="font-size: 13px; color: var(--text-secondary);">Arbetspass:</span>
                <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${shift.start} - ${shift.end}</span>
                ${shift.service ? `<span style="font-size: 12px; color: var(--text-muted); margin-left: auto;">${shift.service}</span>` : ''}
            </div>
        `;
    } else {
        shiftBox.style.display = 'none';
    }

    subtitle.style.display = 'block';

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    buttonsContainer.innerHTML = `
        <button class="leave-type-btn fp-btn" data-type="fp">
            <span class="leave-type-icon" style="background: var(--ios-green);"></span>
            <span class="leave-type-label">FP - Fridag (helg)</span>
        </button>
        <button class="leave-type-btn fpv-btn" data-type="fpv">
            <span class="leave-type-icon" style="background: var(--ios-green); border: 2px dashed white;"></span>
            <span class="leave-type-label">FPV - Fridag (vardag)</span>
        </button>
        <button class="leave-type-btn afd-btn" data-type="afd">
            <span class="leave-type-icon" style="background: var(--ios-yellow);"></span>
            <span class="leave-type-label">AFD - Arbetsförlagd dag</span>
        </button>
        <button class="leave-type-btn parental-btn" data-type="parental">
            <span class="leave-type-icon" style="background: var(--ios-purple);"></span>
            <span class="leave-type-label">FL - Föräldraledighet</span>
        </button>
        <button class="leave-type-btn vacation-btn" data-type="vacation">
            <span class="leave-type-icon" style="background: var(--ios-blue);"></span>
            <span class="leave-type-label">Semester</span>
        </button>
    `;

    // Add click handlers
    buttonsContainer.querySelectorAll('.leave-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'fp') toggleFp(year, month, day);
            else if (type === 'fpv') toggleFpv(year, month, day);
            else if (type === 'afd') toggleAfd(year, month, day);
            else if (type === 'parental') toggleParentalLeave(year, month, day);
            else if (type === 'vacation') toggleVacation(year, month, day);
            closeLeaveModal();
        });
    });

    overlay.classList.add('active');
}

// Show day type info (for days with FP, FPV, etc.)
export function showDayTypeInfo(type, year, month, day) {
    const overlay = document.getElementById('leaveTypeOverlay');
    const title = document.getElementById('leaveModalTitle');
    const dateEl = document.getElementById('leaveModalDate');
    const shiftBox = document.getElementById('leaveModalShiftBox');
    const buttonsContainer = document.getElementById('leaveModalButtons');
    const subtitle = document.getElementById('leaveModalSubtitle');

    const date = new Date(year, month, day);
    const dayOfWeek = dayNames[date.getDay()];
    const monthName = monthNames[month];

    const typeLabels = {
        'FP': 'Fridag (helg)',
        'FPV': 'Fridag (vardag)',
        'AFD': 'Arbetsförlagd dag',
        'FL': 'Föräldraledighet',
        'Semester': 'Semester'
    };

    title.textContent = typeLabels[type] || type;
    dateEl.textContent = `${dayOfWeek} ${day} ${monthName} ${year}`;

    const dateKey = `${year}-${month}-${day}`;
    const shift = shiftData.get(dateKey);
    if (shift && shift.start && shift.end) {
        shiftBox.style.display = 'block';
        shiftBox.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 12px;">
                <span style="font-size: 13px; color: var(--text-secondary);">Schemalagt pass:</span>
                <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${shift.start} - ${shift.end}</span>
            </div>
        `;
    } else {
        shiftBox.style.display = 'none';
    }

    subtitle.textContent = 'Ändra till:';
    subtitle.style.display = 'block';

    let buttonsHtml = `
        <button class="leave-type-btn remove-btn" data-type="remove" style="background: var(--ios-red);">
            <span class="leave-type-label" style="color: white;">Ta bort ${type}</span>
        </button>
    `;

    // Add other options based on current type
    if (type !== 'FP') {
        buttonsHtml += `
            <button class="leave-type-btn fp-btn" data-type="fp">
                <span class="leave-type-icon" style="background: var(--ios-green);"></span>
                <span class="leave-type-label">FP - Fridag (helg)</span>
            </button>
        `;
    }
    if (type !== 'FPV') {
        buttonsHtml += `
            <button class="leave-type-btn fpv-btn" data-type="fpv">
                <span class="leave-type-icon" style="background: var(--ios-green); border: 2px dashed white;"></span>
                <span class="leave-type-label">FPV - Fridag (vardag)</span>
            </button>
        `;
    }
    if (type !== 'AFD') {
        buttonsHtml += `
            <button class="leave-type-btn afd-btn" data-type="afd">
                <span class="leave-type-icon" style="background: var(--ios-yellow);"></span>
                <span class="leave-type-label">AFD - Arbetsförlagd dag</span>
            </button>
        `;
    }
    if (type !== 'FL') {
        buttonsHtml += `
            <button class="leave-type-btn parental-btn" data-type="parental">
                <span class="leave-type-icon" style="background: var(--ios-purple);"></span>
                <span class="leave-type-label">FL - Föräldraledighet</span>
            </button>
        `;
    }
    if (type !== 'Semester') {
        buttonsHtml += `
            <button class="leave-type-btn vacation-btn" data-type="vacation">
                <span class="leave-type-icon" style="background: var(--ios-blue);"></span>
                <span class="leave-type-label">Semester</span>
            </button>
        `;
    }

    buttonsContainer.innerHTML = buttonsHtml;

    buttonsContainer.querySelectorAll('.leave-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const newType = btn.dataset.type;
            const key = `${year}-${month}-${day}`;

            // Remove current type first
            fpDays.delete(key);
            manualFpDays.delete(key);
            fpvDays.delete(key);
            manualFpvDays.delete(key);
            afdDays.delete(key);
            parentalLeaveDays.delete(key);
            vacationDays.delete(key);

            // Add new type if not removing
            if (newType === 'fp') {
                fpDays.add(key);
                manualFpDays.add(key);
            } else if (newType === 'fpv') {
                fpvDays.add(key);
                manualFpvDays.add(key);
            } else if (newType === 'afd') {
                afdDays.add(key);
            } else if (newType === 'parental') {
                parentalLeaveDays.add(key);
            } else if (newType === 'vacation') {
                vacationDays.add(key);
            }
            // 'remove' just clears, which we already did

            closeLeaveModal();
            if (refreshAllViewsCallback) refreshAllViewsCallback();
        });
    });

    overlay.classList.add('active');
}

// Show day info with leave options (for holidays)
export function showDayInfoWithLeave(year, month, day, obInfo) {
    const overlay = document.getElementById('leaveTypeOverlay');
    const title = document.getElementById('leaveModalTitle');
    const dateEl = document.getElementById('leaveModalDate');
    const shiftBox = document.getElementById('leaveModalShiftBox');
    const buttonsContainer = document.getElementById('leaveModalButtons');
    const subtitle = document.getElementById('leaveModalSubtitle');

    const date = new Date(year, month, day);
    const dayOfWeek = dayNames[date.getDay()];
    const monthName = monthNames[month];
    const holidays = getHolidaysForYear(year);
    const holidayName = holidays[`${year}-${month}-${day}`];

    title.textContent = holidayName || 'Helgdag';
    dateEl.textContent = `${dayOfWeek} ${day} ${monthName} ${year}`;

    // Show OB info if available
    const obCategory = getObCategory(holidayName, year, month, day);
    let obHtml = '';
    if (obCategory.category === 'storhelg' || obCategory.category === 'kvalificerad') {
        obHtml = `
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${obCategory.category === 'storhelg' ? 'rgba(255, 204, 0, 0.15)' : 'rgba(100, 100, 200, 0.1)'}; border-radius: 8px; margin-bottom: 12px;">
                <span style="font-size: 16px;">${obCategory.icon}</span>
                <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${obCategory.label}</span>
            </div>
        `;
    }

    const dateKey = `${year}-${month}-${day}`;
    const shift = shiftData.get(dateKey);
    if (shift && shift.start && shift.end) {
        shiftBox.style.display = 'block';
        shiftBox.innerHTML = obHtml + `
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 12px;">
                <span style="font-size: 13px; color: var(--text-secondary);">Arbetspass:</span>
                <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${shift.start} - ${shift.end}</span>
            </div>
        `;
    } else if (obHtml) {
        shiftBox.style.display = 'block';
        shiftBox.innerHTML = obHtml;
    } else {
        shiftBox.style.display = 'none';
    }

    subtitle.textContent = 'Lägg till ledighet:';
    subtitle.style.display = 'block';

    buttonsContainer.innerHTML = `
        <button class="leave-type-btn fp-btn" data-type="fp">
            <span class="leave-type-icon" style="background: var(--ios-green);"></span>
            <span class="leave-type-label">FP - Fridag (helg)</span>
        </button>
        <button class="leave-type-btn fpv-btn" data-type="fpv">
            <span class="leave-type-icon" style="background: var(--ios-green); border: 2px dashed white;"></span>
            <span class="leave-type-label">FPV - Fridag (vardag)</span>
        </button>
        <button class="leave-type-btn afd-btn" data-type="afd">
            <span class="leave-type-icon" style="background: var(--ios-yellow);"></span>
            <span class="leave-type-label">AFD - Arbetsförlagd dag</span>
        </button>
        <button class="leave-type-btn parental-btn" data-type="parental">
            <span class="leave-type-icon" style="background: var(--ios-purple);"></span>
            <span class="leave-type-label">FL - Föräldraledighet</span>
        </button>
        <button class="leave-type-btn vacation-btn" data-type="vacation">
            <span class="leave-type-icon" style="background: var(--ios-blue);"></span>
            <span class="leave-type-label">Semester</span>
        </button>
    `;

    buttonsContainer.querySelectorAll('.leave-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'fp') toggleFp(year, month, day);
            else if (type === 'fpv') toggleFpv(year, month, day);
            else if (type === 'afd') toggleAfd(year, month, day);
            else if (type === 'parental') toggleParentalLeave(year, month, day);
            else if (type === 'vacation') toggleVacation(year, month, day);
            closeLeaveModal();
        });
    });

    overlay.classList.add('active');
}

// Show week leave modal
export function showWeekLeaveModal(year, weekNum) {
    // Find Monday of the week
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay();
    let week1Monday;
    if (jan1Day <= 4) {
        week1Monday = new Date(year, 0, 1 - (jan1Day === 0 ? 6 : jan1Day - 1));
    } else {
        week1Monday = new Date(year, 0, 1 + (8 - jan1Day));
    }
    const weekMonday = new Date(week1Monday);
    weekMonday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'weekLeaveModal';

    let daysHtml = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekMonday);
        d.setDate(weekMonday.getDate() + i);
        const dayName = dayNames[d.getDay()].substring(0, 3);
        const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

        const hasFP = fpDays.has(dateKey);
        const hasFPV = fpvDays.has(dateKey);
        const hasAFD = afdDays.has(dateKey);
        const hasParental = parentalLeaveDays.has(dateKey);
        const hasVacation = vacationDays.has(dateKey);

        let statusBadge = '';
        if (hasFP) statusBadge = '<span style="background: var(--ios-green); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">FP</span>';
        else if (hasFPV) statusBadge = '<span style="background: var(--ios-green); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px dashed white;">FPV</span>';
        else if (hasAFD) statusBadge = '<span style="background: var(--ios-yellow); color: #333; padding: 2px 6px; border-radius: 4px; font-size: 10px;">AFD</span>';
        else if (hasParental) statusBadge = '<span style="background: var(--ios-purple); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">FL</span>';
        else if (hasVacation) statusBadge = '<span style="background: var(--ios-blue); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">SEM</span>';

        daysHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                <span>${dayName} ${d.getDate()}/${d.getMonth() + 1}</span>
                ${statusBadge}
            </div>
        `;
    }

    modal.innerHTML = `
        <div class="holiday-info-modal" style="padding: 24px; max-width: 320px;">
            <h2 style="font-size: 18px; margin-bottom: 12px; color: var(--text-primary);">Vecka ${weekNum}</h2>
            <div style="margin-bottom: 16px;">${daysHtml}</div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Markera hela veckan som:</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                <button class="week-type-btn" data-type="fp" style="flex: 1; min-width: 45%; padding: 10px; border: none; border-radius: 8px; background: var(--ios-green); color: white; font-weight: 600; cursor: pointer;">FP</button>
                <button class="week-type-btn" data-type="fpv" style="flex: 1; min-width: 45%; padding: 10px; border: 2px dashed white; border-radius: 8px; background: var(--ios-green); color: white; font-weight: 600; cursor: pointer;">FPV</button>
                <button class="week-type-btn" data-type="parental" style="flex: 1; min-width: 45%; padding: 10px; border: none; border-radius: 8px; background: var(--ios-purple); color: white; font-weight: 600; cursor: pointer;">FL</button>
                <button class="week-type-btn" data-type="vacation" style="flex: 1; min-width: 45%; padding: 10px; border: none; border-radius: 8px; background: var(--ios-blue); color: white; font-weight: 600; cursor: pointer;">Semester</button>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" id="weekLeaveCancel" style="flex: 1; margin-top: 0;">Stäng</button>
                <button class="btn-primary" id="weekLeaveClear" style="flex: 1; background: var(--ios-red); margin-top: 0;">Rensa vecka</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.week-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekMonday);
                d.setDate(weekMonday.getDate() + i);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

                // Clear all
                fpDays.delete(key);
                manualFpDays.delete(key);
                fpvDays.delete(key);
                manualFpvDays.delete(key);
                afdDays.delete(key);
                parentalLeaveDays.delete(key);
                vacationDays.delete(key);

                // Add new type
                if (type === 'fp') {
                    fpDays.add(key);
                    manualFpDays.add(key);
                } else if (type === 'fpv') {
                    fpvDays.add(key);
                    manualFpvDays.add(key);
                } else if (type === 'parental') {
                    parentalLeaveDays.add(key);
                } else if (type === 'vacation') {
                    vacationDays.add(key);
                }
            }
            modal.remove();
            if (refreshAllViewsCallback) refreshAllViewsCallback();
        });
    });

    document.getElementById('weekLeaveCancel').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('weekLeaveClear').addEventListener('click', () => {
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekMonday);
            d.setDate(weekMonday.getDate() + i);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

            fpDays.delete(key);
            manualFpDays.delete(key);
            fpvDays.delete(key);
            manualFpvDays.delete(key);
            afdDays.delete(key);
            parentalLeaveDays.delete(key);
            vacationDays.delete(key);
        }
        modal.remove();
        if (refreshAllViewsCallback) refreshAllViewsCallback();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Initialize all modal event handlers
export function initModals() {
    // Leave type overlay close
    const leaveTypeOverlay = document.getElementById('leaveTypeOverlay');
    if (leaveTypeOverlay) {
        leaveTypeOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'leaveTypeOverlay') closeLeaveModal();
        });
    }

    // Settings modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');
    const settingsModalClose = document.getElementById('settingsModalClose');
    const showSwedishHolidaysCheckbox = document.getElementById('showSwedishHolidays');
    const showNorwegianHolidaysCheckbox = document.getElementById('showNorwegianHolidays');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModalOverlay.classList.add('active');
        });
    }

    if (settingsModalClose) {
        settingsModalClose.addEventListener('click', () => {
            settingsModalOverlay.classList.remove('active');
        });
    }

    if (settingsModalOverlay) {
        settingsModalOverlay.addEventListener('click', (e) => {
            if (e.target === settingsModalOverlay) {
                settingsModalOverlay.classList.remove('active');
            }
        });
    }

    if (showSwedishHolidaysCheckbox) {
        showSwedishHolidaysCheckbox.addEventListener('change', () => {
            setShowSwedishHolidays(showSwedishHolidaysCheckbox.checked);
            if (renderCalendarCallback) renderCalendarCallback();
            if (renderListViewCallback) renderListViewCallback();
        });
    }

    if (showNorwegianHolidaysCheckbox) {
        showNorwegianHolidaysCheckbox.addEventListener('change', () => {
            setShowNorwegianHolidays(showNorwegianHolidaysCheckbox.checked);
            if (renderCalendarCallback) renderCalendarCallback();
            if (renderListViewCallback) renderListViewCallback();
        });
    }

    // Settings section toggles
    setupSettingsToggle('scheduleSettingsToggle', 'scheduleSettingsContent', 'scheduleSettingsArrow');
    setupSettingsToggle('holidaySettingsToggle', 'holidaySettingsContent', 'holidaySettingsArrow');
    setupSettingsToggle('dataSettingsToggle', 'dataSettingsContent', 'dataSettingsArrow');

    // Clear calendar button
    const clearCalendarBtn = document.getElementById('clearCalendarBtn');
    if (clearCalendarBtn) {
        clearCalendarBtn.addEventListener('click', () => {
            showClearCalendarConfirm();
        });
    }
}

function setupSettingsToggle(toggleId, contentId, arrowId) {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);

    if (!toggle || !content || !arrow) return;

    toggle.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        arrow.classList.toggle('expanded', isHidden);
    });
}

function showClearCalendarConfirm() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'clearCalendarConfirmModal';
    modal.innerHTML = `
        <div class="holiday-info-modal" style="padding: 24px; max-width: 320px;">
            <h2 style="font-size: 18px; margin-bottom: 12px; color: var(--text-primary);">Rensa kalender?</h2>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
                Detta tar bort alla FP, FPV, AFD, Semester, Föräldraledighet och arbetspass från kalendern.
                <br><br>
                <strong>Sparade scheman påverkas inte.</strong>
            </p>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" id="clearCalendarCancel" style="flex: 1; margin-top: 0;">Avbryt</button>
                <button class="btn-primary" id="clearCalendarConfirm" style="flex: 1; background: var(--ios-red); margin-top: 0;">Rensa</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('clearCalendarCancel').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('clearCalendarConfirm').addEventListener('click', () => {
        clearCalendarDataSilent();
        if (refreshAllViewsCallback) refreshAllViewsCallback();
        modal.remove();
        const settingsModalOverlay = document.getElementById('settingsModalOverlay');
        if (settingsModalOverlay) settingsModalOverlay.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

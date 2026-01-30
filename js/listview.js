// VRkalender - List Views
// Holiday list and month list view rendering

import {
    monthNames, dayNames, monthNamesShort,
    currentYear, currentMonth,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays,
    shiftData,
    showSwedishHolidays, showNorwegianHolidays
} from './state.js';

import { getWeekNumber } from './utils.js';
import {
    getHolidaysForYear, isSwedishHoliday, isNorwegianHoliday,
    getObCategory, isWithinStorhelgPeriod, isPartialStorhelgDay
} from './holidays.js';

// Callbacks
let showLeaveTypeModalCallback = null;
let showDayInfoWithLeaveCallback = null;
let showDayTypeInfoCallback = null;
let handleDayClickForMoveCallback = null;
let getServiceIconHtmlCallback = null;
let selectedMoveDayGetter = null;
let leaveModalJustClosedGetter = null;

export function setListViewCallbacks(callbacks) {
    showLeaveTypeModalCallback = callbacks.showLeaveTypeModal;
    showDayInfoWithLeaveCallback = callbacks.showDayInfoWithLeave;
    showDayTypeInfoCallback = callbacks.showDayTypeInfo;
    handleDayClickForMoveCallback = callbacks.handleDayClickForMove;
    getServiceIconHtmlCallback = callbacks.getServiceIconHtml;
    selectedMoveDayGetter = callbacks.getSelectedMoveDay;
    leaveModalJustClosedGetter = callbacks.getLeaveModalJustClosed;
}

// Render month list view - shows all days in current month as a list
export function renderMonthListView() {
    const monthListView = document.getElementById('monthListView');
    if (!monthListView) {
        console.error('monthListView element not found');
        return;
    }
    monthListView.innerHTML = '';

    const year = currentYear;
    const month = currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const holidays = getHolidaysForYear(year);

    let html = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dayName = dayNames[dayOfWeek];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isSunday = dayOfWeek === 0;

        const dateKey = `${year}-${month}-${day}`;
        const shift = shiftData.get(dateKey);

        const holidayKey = `${year}-${month}-${day}`;
        const holidayName = holidays[holidayKey] || null;

        const hasFP = fpDays.has(dateKey);
        const hasFPV = fpvDays.has(dateKey);
        const hasAFD = afdDays.has(dateKey);
        const hasParental = parentalLeaveDays.has(dateKey);
        const hasVacation = vacationDays.has(dateKey);

        let status = '';
        let statusBgColor = 'var(--bg-tertiary)';
        let statusTextColor = 'var(--text-primary)';

        if (hasFP) {
            status = 'FP';
            statusBgColor = 'var(--ios-green)';
            statusTextColor = 'white';
        } else if (hasFPV) {
            status = 'FPV';
            statusBgColor = 'var(--ios-green)';
            statusTextColor = 'white';
        } else if (hasAFD) {
            status = 'AFD';
            statusBgColor = 'var(--ios-yellow)';
            statusTextColor = '#333';
        } else if (hasParental) {
            status = 'FL';
            statusBgColor = 'var(--ios-purple)';
            statusTextColor = 'white';
        } else if (hasVacation) {
            status = 'Semester';
            statusBgColor = 'var(--ios-blue)';
            statusTextColor = 'white';
        } else if (shift && shift.service) {
            status = shift.service;
        }

        const rowBg = (isSunday || holidayName) ? 'background: var(--holiday-light);' : '';
        const dateColor = (isSunday || holidayName) ? 'var(--holiday)' : 'var(--text-primary)';
        const dayNameColor = (isSunday || holidayName) ? 'var(--holiday)' : 'var(--text-muted)';

        let infoHtml = '';
        if (holidayName) {
            infoHtml = `<div style="font-weight: 600; color: var(--holiday);">${holidayName}</div>`;
        }
        if (hasFP || hasFPV || hasParental) {
            infoHtml += `<div style="font-size: 13px; color: var(--ios-green); font-weight: 500;">Ledig</div>`;
        } else if (hasVacation) {
            infoHtml += `<div style="font-size: 13px; color: var(--ios-blue); font-weight: 500;">Semester</div>`;
        } else if (shift && shift.start && shift.end) {
            infoHtml += `<div style="font-size: 13px; color: var(--text-secondary);">${shift.start} - ${shift.end}</div>`;
        }
        if (!infoHtml && isWeekend && !status) {
            infoHtml = `<div style="font-size: 13px; color: var(--text-muted);">Helg</div>`;
        }
        if (!infoHtml) {
            infoHtml = '&nbsp;';
        }

        let statusHtml = '';
        if (status) {
            statusHtml = `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${statusBgColor}; color: ${statusTextColor};">${status}</span>`;
        }

        let serviceIconHtml = '';
        if (shift && shift.service && getServiceIconHtmlCallback) {
            const iconHtml = getServiceIconHtmlCallback(shift.service, 'large');
            if (iconHtml) {
                serviceIconHtml = `<span style="margin-left: 8px;">${iconHtml}</span>`;
            }
        }

        html += `
            <div class="month-list-row" data-year="${year}" data-month="${month}" data-day="${day}" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; ${rowBg}">
                <div style="width: 50px; flex-shrink: 0; text-align: center;">
                    <div style="font-size: 22px; font-weight: 700; color: ${dateColor};">${day}</div>
                    <div style="font-size: 11px; color: ${dayNameColor}; text-transform: uppercase;">${dayName.substring(0, 3)}</div>
                </div>
                <div style="flex: 1; padding: 0 12px;">${infoHtml}</div>
                <div style="display: flex; align-items: center; justify-content: flex-end;">
                    ${statusHtml}
                    ${serviceIconHtml}
                </div>
            </div>
        `;
    }

    monthListView.innerHTML = html;

    // Add click handlers
    monthListView.querySelectorAll('.month-list-row').forEach(row => {
        row.addEventListener('click', () => {
            if (leaveModalJustClosedGetter && leaveModalJustClosedGetter()) return;

            const y = parseInt(row.dataset.year);
            const m = parseInt(row.dataset.month);
            const d = parseInt(row.dataset.day);
            const dateKey = `${y}-${m}-${d}`;

            if (selectedMoveDayGetter && selectedMoveDayGetter()) {
                if (handleDayClickForMoveCallback) {
                    handleDayClickForMoveCallback(y, m, d);
                }
                return;
            }

            const hols = getHolidaysForYear(y);
            const holidayKey = `${d}-${m}`;
            const isHoliday = !!hols[holidayKey];
            const storhelgCheck = isWithinStorhelgPeriod(y, m, d);
            const partialCheck = isPartialStorhelgDay(y, m, d);

            const hasFP = fpDays.has(dateKey);
            const hasFPV = fpvDays.has(dateKey);
            const hasAFD = afdDays.has(dateKey);
            const hasParental = parentalLeaveDays.has(dateKey);
            const hasVacation = vacationDays.has(dateKey);

            if (isHoliday || storhelgCheck) {
                if (showDayInfoWithLeaveCallback) showDayInfoWithLeaveCallback(y, m, d, storhelgCheck);
            } else if (partialCheck) {
                if (showDayInfoWithLeaveCallback) showDayInfoWithLeaveCallback(y, m, d, partialCheck);
            } else if (hasFP) {
                if (showDayTypeInfoCallback) showDayTypeInfoCallback('FP', y, m, d);
            } else if (hasFPV) {
                if (showDayTypeInfoCallback) showDayTypeInfoCallback('FPV', y, m, d);
            } else if (hasAFD) {
                if (showDayTypeInfoCallback) showDayTypeInfoCallback('AFD', y, m, d);
            } else if (hasParental) {
                if (showDayTypeInfoCallback) showDayTypeInfoCallback('FL', y, m, d);
            } else if (hasVacation) {
                if (showDayTypeInfoCallback) showDayTypeInfoCallback('Semester', y, m, d);
            } else {
                if (showLeaveTypeModalCallback) showLeaveTypeModalCallback(y, m, d);
            }
        });
    });
}

// Render list view - shows all holidays for the entire year
export function renderListView() {
    const holidays = getHolidaysForYear(currentYear);
    const listView = document.getElementById('listView');
    listView.innerHTML = '';

    const holidaysByMonth = {};

    for (const [key, name] of Object.entries(holidays)) {
        const [year, month, day] = key.split('-').map(Number);
        if (year === currentYear) {
            if (!holidaysByMonth[month]) {
                holidaysByMonth[month] = [];
            }
            const date = new Date(year, month, day);
            const storhelgCheck = isWithinStorhelgPeriod(year, month, day);
            const partialCheck = isPartialStorhelgDay(year, month, day);

            holidaysByMonth[month].push({
                date,
                name,
                day,
                month,
                weekNum: getWeekNumber(date),
                type: 'holiday',
                isStorhelg: storhelgCheck !== null,
                isPartial: partialCheck !== null,
                partialInfo: partialCheck,
                isSwedish: isSwedishHoliday(year, month, day),
                isNorwegian: isNorwegianHoliday(year, month, day)
            });
        }
    }

    // Add New Year's Day for next year
    const nextYear = currentYear + 1;
    const nextYearHolidays = getHolidaysForYear(nextYear);
    const newYearKey = `${nextYear}-0-1`;
    if (nextYearHolidays[newYearKey]) {
        if (!holidaysByMonth[12]) {
            holidaysByMonth[12] = [];
        }
        const date = new Date(nextYear, 0, 1);
        const storhelgCheck = isWithinStorhelgPeriod(nextYear, 0, 1);
        const partialCheck = isPartialStorhelgDay(nextYear, 0, 1);

        holidaysByMonth[12].push({
            date,
            name: `Nyårsdagen (${nextYear})`,
            day: 1,
            month: 0,
            weekNum: getWeekNumber(date),
            type: 'holiday',
            isStorhelg: storhelgCheck !== null,
            isPartial: partialCheck !== null,
            partialInfo: partialCheck,
            isSwedish: true,
            isNorwegian: false
        });
    }

    // Sort months and render
    const sortedMonths = Object.keys(holidaysByMonth).map(Number).sort((a, b) => a - b);

    for (const month of sortedMonths) {
        const items = holidaysByMonth[month].sort((a, b) => a.day - b.day);

        const monthHeader = document.createElement('div');
        monthHeader.className = 'list-month-header';
        const displayMonthName = month === 12 ? `Januari ${nextYear}` : monthNames[month];
        monthHeader.textContent = displayMonthName;
        listView.appendChild(monthHeader);

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'holiday-row';
            row.dataset.year = item.date.getFullYear();
            row.dataset.month = item.month;
            row.dataset.day = item.day;

            const dayOfWeek = item.date.getDay();
            const dayAbbrev = dayNames[dayOfWeek].substring(0, 3);

            // Get OB info
            const obInfo = getObCategory(item.name, item.date.getFullYear(), item.month, item.day);

            let flagHtml = '';
            if (item.isSwedish && item.isNorwegian) {
                flagHtml = '<span class="flag-indicator">🇸🇪🇳🇴</span>';
            } else if (item.isNorwegian) {
                flagHtml = '<span class="flag-indicator">🇳🇴</span>';
            }

            let obBadgeHtml = '';
            if (obInfo.category === 'storhelg') {
                obBadgeHtml = `<span class="ob-badge storhelg">${obInfo.label}</span>`;
            } else if (obInfo.category === 'kvalificerad') {
                obBadgeHtml = `<span class="ob-badge kvalificerad">${obInfo.label}</span>`;
            }

            row.innerHTML = `
                <div class="holiday-date">
                    <span class="holiday-day-num">${item.day}</span>
                    <span class="holiday-day-name">${dayAbbrev}</span>
                </div>
                <div class="holiday-info">
                    <span class="holiday-name">${flagHtml}${item.name}</span>
                    ${obBadgeHtml}
                </div>
                <div class="holiday-week">v${item.weekNum}</div>
            `;

            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                showHolidayInfo(item.date.getFullYear(), item.month, item.day, item.name);
            });

            listView.appendChild(row);
        });
    }
}

function showHolidayInfo(year, month, day, holidayName) {
    const overlay = document.getElementById('holidayInfoOverlay');
    const icon = document.getElementById('holidayInfoIcon');
    const nameEl = document.getElementById('holidayInfoName');
    const dateEl = document.getElementById('holidayInfoDate');
    const categoryEl = document.getElementById('holidayObCategory');
    const descriptionEl = document.getElementById('holidayObDescription');

    const date = new Date(year, month, day);
    const dayOfWeek = dayNames[date.getDay()];
    const monthName = monthNames[month];

    nameEl.textContent = holidayName;
    dateEl.textContent = `${day} ${monthName} ${year}, ${dayOfWeek}`;

    const obInfo = getObCategory(holidayName, year, month, day);

    icon.textContent = obInfo.icon;
    categoryEl.textContent = obInfo.label;
    categoryEl.className = `ob-category ${obInfo.category}`;
    descriptionEl.innerHTML = obInfo.description;

    overlay.classList.add('active');
}

// Initialize close button for holiday info modal
export function initHolidayInfoModal() {
    const closeBtn = document.getElementById('holidayInfoClose');
    const overlay = document.getElementById('holidayInfoOverlay');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    }
}

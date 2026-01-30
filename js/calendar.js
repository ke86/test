// VRkalender - Calendar View
// Calendar rendering and day cell logic

import {
    monthNames, dayNames,
    currentYear, currentMonth,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays,
    shiftData, manualFpDays, manualFpvDays,
    setCurrentMonth, setCurrentYear
} from './state.js';

import { getWeekNumber, isFpDay, isFpvDay, isAfdDay, isParentalLeaveDay, isVacationDay, isDayOff } from './utils.js';
import { getHolidaysForYear } from './holidays.js';

// Module state
let longPressTriggered = false;
let longPressTimer = null;
let selectedMoveDay = null;
const LONG_PRESS_DURATION = 800;

// Callbacks - will be set by main app
let showUnifiedDayPopupCallback = null;
let handleDayClickForMoveCallback = null;
let showWeekLeaveModalCallback = null;
let getPriorityIconCallback = null;

export function setCalendarCallbacks(callbacks) {
    showUnifiedDayPopupCallback = callbacks.showUnifiedDayPopup;
    handleDayClickForMoveCallback = callbacks.handleDayClickForMove;
    showWeekLeaveModalCallback = callbacks.showWeekLeaveModal;
    getPriorityIconCallback = callbacks.getPriorityIcon;
}

export function getLongPressTriggered() {
    return longPressTriggered;
}

export function getSelectedMoveDay() {
    return selectedMoveDay;
}

export function setSelectedMoveDay(value) {
    selectedMoveDay = value;
}

// Add long-press handler to a cell
export function addLongPressHandler(cell, type, year, month, day) {
    let pressStarted = false;
    let startX, startY;

    const startHandler = (e) => {
        pressStarted = true;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;

        longPressTimer = setTimeout(() => {
            if (pressStarted) {
                longPressTriggered = true;
                if (navigator.vibrate) navigator.vibrate(100);
                selectDayForMove(cell, type, year, month, day);
                setTimeout(() => { longPressTriggered = false; }, 300);
            }
        }, LONG_PRESS_DURATION);
    };

    const moveHandler = (e) => {
        if (!pressStarted) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = Math.abs(touch.clientX - startX);
        const dy = Math.abs(touch.clientY - startY);
        if (dx > 10 || dy > 10) {
            pressStarted = false;
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    };

    const endHandler = () => {
        pressStarted = false;
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    cell.addEventListener('touchstart', startHandler, { passive: true });
    cell.addEventListener('mousedown', startHandler);
    cell.addEventListener('touchmove', moveHandler, { passive: true });
    cell.addEventListener('touchend', endHandler);
    cell.addEventListener('touchcancel', endHandler);
    cell.addEventListener('mouseup', endHandler);
    cell.addEventListener('mouseleave', endHandler);
}

function selectDayForMove(cell, type, year, month, day) {
    document.querySelectorAll('.day-cell.move-selected').forEach(c => c.classList.remove('move-selected'));

    const key = `${year}-${month}-${day}`;
    const isManual = (type === 'FP' && manualFpDays.has(key)) || (type === 'FPV' && manualFpvDays.has(key));

    selectedMoveDay = { year, month, day, type, isManual };

    setTimeout(() => {
        cell.classList.add('move-selected');
    }, 500);
}

export function cancelMove() {
    selectedMoveDay = null;
    document.querySelectorAll('.day-cell.move-selected').forEach(c => c.classList.remove('move-selected'));
    const toast = document.getElementById('moveToast');
    if (toast) toast.remove();
}

export function handleDayClickForMove(targetYear, targetMonth, targetDay) {
    if (!selectedMoveDay) return false;

    const srcKey = `${selectedMoveDay.year}-${selectedMoveDay.month}-${selectedMoveDay.day}`;
    const dstKey = `${targetYear}-${targetMonth}-${targetDay}`;

    if (srcKey === dstKey) {
        cancelMove();
        return true;
    }

    const dstFp = fpDays.has(dstKey);
    const dstFpv = fpvDays.has(dstKey);
    const dstManualFp = manualFpDays.has(dstKey);
    const dstManualFpv = manualFpvDays.has(dstKey);

    if (selectedMoveDay.type === 'FP') {
        fpDays.delete(srcKey);
        manualFpDays.delete(srcKey);
    } else if (selectedMoveDay.type === 'FPV') {
        fpvDays.delete(srcKey);
        manualFpvDays.delete(srcKey);
    }

    if (dstFp) {
        fpDays.delete(dstKey);
        fpDays.add(srcKey);
        if (dstManualFp) {
            manualFpDays.delete(dstKey);
            manualFpDays.add(srcKey);
        }
    } else if (dstFpv) {
        fpvDays.delete(dstKey);
        fpvDays.add(srcKey);
        if (dstManualFpv) {
            manualFpvDays.delete(dstKey);
            manualFpvDays.add(srcKey);
        }
    }

    if (selectedMoveDay.type === 'FP') {
        fpDays.add(dstKey);
        if (selectedMoveDay.isManual) {
            manualFpDays.add(dstKey);
        }
    } else if (selectedMoveDay.type === 'FPV') {
        fpvDays.add(dstKey);
        if (selectedMoveDay.isManual) {
            manualFpvDays.add(dstKey);
        }
    }

    cancelMove();
    return true;
}

// Render the calendar grid
export function renderCalendar() {
    const holidays = getHolidaysForYear(currentYear);
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    document.getElementById('monthTitle').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const today = new Date();
    const isTodayFn = (d, m, y) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear();

    let currentDay = 1 - startDay;
    const weeksNeeded = Math.ceil((startDay + daysInMonth) / 7);

    for (let week = 0; week < weeksNeeded; week++) {
        const weekRow = document.createElement('div');
        weekRow.className = 'week-row';

        const mondayDate = new Date(currentYear, currentMonth, currentDay);
        const weekNum = getWeekNumber(mondayDate);

        const weekNumCell = document.createElement('div');
        weekNumCell.className = 'week-number clickable';
        weekNumCell.textContent = weekNum;
        weekNumCell.style.cursor = 'pointer';
        weekNumCell.addEventListener('click', () => {
            if (showWeekLeaveModalCallback) {
                showWeekLeaveModalCallback(mondayDate.getFullYear(), weekNum);
            }
        });
        weekRow.appendChild(weekNumCell);

        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';

            let displayMonth = currentMonth;
            let displayYear = currentYear;
            let displayDay = currentDay;

            if (currentDay < 1) {
                displayMonth = currentMonth - 1;
                if (displayMonth < 0) {
                    displayMonth = 11;
                    displayYear--;
                }
                displayDay = new Date(displayYear, displayMonth + 1, 0).getDate() + currentDay;
                dayCell.classList.add('other-month');
            } else if (currentDay > daysInMonth) {
                displayMonth = currentMonth + 1;
                if (displayMonth > 11) {
                    displayMonth = 0;
                    displayYear++;
                }
                displayDay = currentDay - daysInMonth;
                dayCell.classList.add('other-month');
            }

            dayCell.dataset.year = displayYear;
            dayCell.dataset.month = displayMonth;
            dayCell.dataset.day = displayDay;

            const holidayKey = `${displayYear}-${displayMonth}-${displayDay}`;
            const holiday = holidays[holidayKey] || getHolidaysForYear(displayYear)[holidayKey];
            const dayOff = isDayOff(displayYear, displayMonth, displayDay);
            const fp = isFpDay(displayYear, displayMonth, displayDay);
            const fpv = isFpvDay(displayYear, displayMonth, displayDay);
            const afd = isAfdDay(displayYear, displayMonth, displayDay);
            const parental = isParentalLeaveDay(displayYear, displayMonth, displayDay);
            const vacation = isVacationDay(displayYear, displayMonth, displayDay);
            const isOtherMonth = dayCell.classList.contains('other-month');
            const shiftKey = `${displayYear}-${displayMonth}-${displayDay}`;
            const shift = shiftData.get(shiftKey);

            if (isTodayFn(displayDay, displayMonth, displayYear)) dayCell.classList.add('today');
            if (dayOfWeek === 6) dayCell.classList.add('sunday');
            if (holiday && !isOtherMonth) dayCell.classList.add('holiday');

            if (fp) {
                dayCell.classList.add('day-fp');
                if (isOtherMonth) dayCell.classList.add('day-type-faded');
            } else if (fpv) {
                dayCell.classList.add('day-fpv');
                if (isOtherMonth) dayCell.classList.add('day-type-faded');
            } else if (afd) {
                dayCell.classList.add('day-afd');
                if (isOtherMonth) dayCell.classList.add('day-type-faded');
            } else if (parental) {
                dayCell.classList.add('day-parental');
                if (isOtherMonth) dayCell.classList.add('day-type-faded');
            } else if (vacation) {
                dayCell.classList.add('day-vacation');
                if (isOtherMonth) dayCell.classList.add('day-type-faded');
            } else if (dayOff && !isOtherMonth) {
                dayCell.classList.add('day-off');
            }

            // Day number
            const dayNum = document.createElement('span');
            dayNum.className = 'day-num';
            dayNum.textContent = displayDay;
            dayCell.appendChild(dayNum);

            // Priority icon
            const iconContainer = document.createElement('span');
            iconContainer.className = 'day-icon';
            if (getPriorityIconCallback) {
                const priorityIcon = getPriorityIconCallback(displayYear, displayMonth, displayDay, isOtherMonth, shift);
                if (priorityIcon && !isOtherMonth) {
                    const badge = document.createElement('span');
                    badge.className = `day-icon-badge ${priorityIcon.class}`;
                    badge.textContent = priorityIcon.text;
                    if (priorityIcon.title) badge.title = priorityIcon.title;
                    iconContainer.appendChild(badge);
                }
            }
            dayCell.appendChild(iconContainer);

            // Time display
            const timeDisplay = document.createElement('span');
            timeDisplay.className = 'day-time';
            if (shift && shift.start && shift.end && !isOtherMonth) {
                const startSpan = document.createElement('span');
                startSpan.className = 'time-start';
                startSpan.textContent = shift.start;
                const endSpan = document.createElement('span');
                endSpan.className = 'time-end';
                endSpan.textContent = shift.end;
                timeDisplay.appendChild(startSpan);
                timeDisplay.appendChild(endSpan);
            }
            dayCell.appendChild(timeDisplay);

            // Click handlers
            dayCell.style.cursor = 'pointer';

            if (fp || fpv) {
                const type = fp ? 'FP' : 'FPV';
                addLongPressHandler(dayCell, type, displayYear, displayMonth, displayDay);
            }

            dayCell.addEventListener('click', () => {
                if (longPressTriggered) return;
                if (selectedMoveDay) {
                    handleDayClickForMove(displayYear, displayMonth, displayDay);
                    return;
                }
                if (isOtherMonth) return;

                if (showUnifiedDayPopupCallback) {
                    showUnifiedDayPopupCallback(displayYear, displayMonth, displayDay);
                }
            });

            weekRow.appendChild(dayCell);
            currentDay++;
        }

        grid.appendChild(weekRow);
    }
}

// Navigation
export function goToPrevMonth() {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
}

export function goToNextMonth() {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
}

export function goToToday() {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
}

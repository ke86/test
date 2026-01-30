// VRkalender - PDF Export
// Generate yearly schedule PDFs

import {
    monthNames, monthNamesShort,
    currentYear,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays
} from './state.js';

import { getWeekNumber, isFpDay, isFpvDay, isAfdDay, isParentalLeaveDay, isVacationDay } from './utils.js';
import { getHolidaysForYear } from './holidays.js';

// Generate yearly schedule PDF
export function generateYearlyPdf() {
    generateYearlyPdfWithName(null);
}

export function generateYearlyPdfWithName(schemaName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const year = currentYear;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors
    const fpColor = [52, 199, 89];
    const fpvColor = [52, 199, 89];
    const afdColor = [255, 204, 0];
    const parentalColor = [175, 82, 222];
    const vacationColor = [0, 122, 255];
    const holidayColor = [255, 59, 48];
    const weekendColor = [150, 150, 150];
    const headerColor = [0, 122, 255];
    const nextYearBgColor = [230, 230, 240];

    const holidays = getHolidaysForYear(year);
    const holidaysNextYear = getHolidaysForYear(year + 1);

    // Title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const titleText = schemaName
        ? `${schemaName} - Årsschema ${year}`
        : `Årsschema ${year}`;
    doc.text(titleText, pageWidth / 2, 8, { align: 'center' });

    // Layout: 6 columns x 2 rows for 12 months
    const marginX = 3;
    const marginY = 11;
    const gapX = 1.5;
    const gapY = 2;
    const monthWidth = (pageWidth - marginX * 2 - gapX * 5) / 6;
    const monthHeight = (pageHeight - marginY - 8 - gapY) / 2;
    const cellWidth = (monthWidth - 6) / 7;
    const cellHeight = (monthHeight - 7) / 7;

    for (let idx = 0; idx < 12; idx++) {
        const col = idx % 6;
        const row = Math.floor(idx / 6);
        const startX = marginX + col * (monthWidth + gapX);
        const startY = marginY + row * (monthHeight + gapY);
        const isDecember = idx === 11;

        // Month header
        doc.setFillColor(...headerColor);
        doc.roundedRect(startX, startY, monthWidth, 5, 1, 1, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(monthNamesShort[idx], startX + monthWidth / 2, startY + 3.7, { align: 'center' });

        // Day headers
        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        const dayHeaders = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
        for (let d = 0; d < 7; d++) {
            doc.text(dayHeaders[d], startX + 6 + d * cellWidth + cellWidth / 2, startY + 6.5, { align: 'center' });
        }

        // Days
        const firstDay = new Date(year, idx, 1);
        const lastDay = new Date(year, idx + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = lastDay.getDate();

        let lastWeekRow = 0;

        for (let week = 0; week < 6; week++) {
            const weekY = startY + 7 + week * cellHeight;

            // Week number
            const firstDayOfWeek = week * 7 - startDay + 1;
            if (firstDayOfWeek <= daysInMonth && firstDayOfWeek + 6 >= 1) {
                const weekDate = new Date(year, idx, Math.max(1, Math.min(firstDayOfWeek, daysInMonth)));
                const weekNum = getWeekNumber(weekDate);
                doc.setFontSize(4);
                doc.setTextColor(150, 150, 150);
                doc.text(String(weekNum), startX + 3, weekY + cellHeight / 2 + 1, { align: 'center' });
                lastWeekRow = week;
            }

            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const cellX = startX + 6 + dayOfWeek * cellWidth;
                const dayNum = week * 7 + dayOfWeek - startDay + 1;

                if (dayNum >= 1 && dayNum <= daysInMonth) {
                    const fp = isFpDay(year, idx, dayNum);
                    const fpv = isFpvDay(year, idx, dayNum);
                    const afd = isAfdDay(year, idx, dayNum);
                    const parental = isParentalLeaveDay(year, idx, dayNum);
                    const vacation = isVacationDay(year, idx, dayNum);
                    const holidayKey = `${year}-${idx}-${dayNum}`;
                    const isHoliday = holidays[holidayKey];
                    const isWeekend = dayOfWeek >= 5;

                    // Draw cell background/border
                    if (fp) {
                        doc.setDrawColor(...fpColor);
                        doc.setLineWidth(0.4);
                        doc.rect(cellX, weekY, cellWidth - 0.3, cellHeight - 0.3);
                    } else if (fpv) {
                        doc.setDrawColor(...fpvColor);
                        doc.setLineWidth(0.3);
                        doc.setLineDashPattern([0.8, 0.5], 0);
                        doc.rect(cellX, weekY, cellWidth - 0.3, cellHeight - 0.3);
                        doc.setLineDashPattern([], 0);
                    } else if (afd) {
                        doc.setDrawColor(...afdColor);
                        doc.setLineWidth(0.3);
                        doc.setLineDashPattern([0.8, 0.5], 0);
                        doc.rect(cellX, weekY, cellWidth - 0.3, cellHeight - 0.3);
                        doc.setLineDashPattern([], 0);
                    } else if (parental) {
                        doc.setDrawColor(...parentalColor);
                        doc.setLineWidth(0.3);
                        doc.setLineDashPattern([0.8, 0.5], 0);
                        doc.rect(cellX, weekY, cellWidth - 0.3, cellHeight - 0.3);
                        doc.setLineDashPattern([], 0);
                    } else if (vacation) {
                        doc.setDrawColor(...vacationColor);
                        doc.setLineWidth(0.3);
                        doc.setLineDashPattern([0.8, 0.5], 0);
                        doc.rect(cellX, weekY, cellWidth - 0.3, cellHeight - 0.3);
                        doc.setLineDashPattern([], 0);
                    }

                    // Day number
                    doc.setFontSize(7);
                    if (isHoliday) {
                        doc.setTextColor(...holidayColor);
                    } else if (isWeekend) {
                        doc.setTextColor(...weekendColor);
                    } else if (fp || fpv) {
                        doc.setTextColor(...fpColor);
                    } else if (afd) {
                        doc.setTextColor(180, 140, 0);
                    } else if (parental) {
                        doc.setTextColor(...parentalColor);
                    } else if (vacation) {
                        doc.setTextColor(...vacationColor);
                    } else {
                        doc.setTextColor(0, 0, 0);
                    }
                    doc.text(String(dayNum), cellX + cellWidth / 2 - 0.1, weekY + cellHeight / 2 + 1.5, { align: 'center' });
                }
            }
        }

        // For December: add Jan 1-2 of next year
        if (isDecember) {
            const nextWeekY = startY + 7 + (lastWeekRow + 1) * cellHeight;

            // Separator line
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.2);
            doc.line(startX + 6, nextWeekY - 0.5, startX + monthWidth, nextWeekY - 0.5);

            // Week number for first week of next year
            const jan1 = new Date(year + 1, 0, 1);
            const weekNum = getWeekNumber(jan1);
            doc.setFontSize(4);
            doc.setTextColor(150, 150, 150);
            doc.text(String(weekNum), startX + 3, nextWeekY + cellHeight / 2 + 1, { align: 'center' });

            // Calculate which day of week Jan 1 falls on
            const jan1DayOfWeek = (jan1.getDay() + 6) % 7;

            // Draw Jan 1 and Jan 2 with background
            for (let d = 1; d <= 2; d++) {
                const dayOfWeek = (jan1DayOfWeek + d - 1) % 7;
                const cellX = startX + 6 + dayOfWeek * cellWidth;

                // Light background to indicate next year
                doc.setFillColor(...nextYearBgColor);
                doc.rect(cellX, nextWeekY, cellWidth - 0.3, cellHeight - 0.3, 'F');

                const fp = isFpDay(year + 1, 0, d);
                const fpv = isFpvDay(year + 1, 0, d);
                const afd = isAfdDay(year + 1, 0, d);
                const parental = isParentalLeaveDay(year + 1, 0, d);
                const vacation = isVacationDay(year + 1, 0, d);
                const holidayKey = `${year + 1}-0-${d}`;
                const isHoliday = holidaysNextYear[holidayKey];
                const isWeekend = dayOfWeek >= 5;

                // Draw border if has type
                if (fp) {
                    doc.setDrawColor(...fpColor);
                    doc.setLineWidth(0.4);
                    doc.rect(cellX, nextWeekY, cellWidth - 0.3, cellHeight - 0.3);
                } else if (fpv) {
                    doc.setDrawColor(...fpvColor);
                    doc.setLineWidth(0.3);
                    doc.setLineDashPattern([0.8, 0.5], 0);
                    doc.rect(cellX, nextWeekY, cellWidth - 0.3, cellHeight - 0.3);
                    doc.setLineDashPattern([], 0);
                } else if (afd) {
                    doc.setDrawColor(...afdColor);
                    doc.setLineWidth(0.3);
                    doc.setLineDashPattern([0.8, 0.5], 0);
                    doc.rect(cellX, nextWeekY, cellWidth - 0.3, cellHeight - 0.3);
                    doc.setLineDashPattern([], 0);
                } else if (parental) {
                    doc.setDrawColor(...parentalColor);
                    doc.setLineWidth(0.3);
                    doc.setLineDashPattern([0.8, 0.5], 0);
                    doc.rect(cellX, nextWeekY, cellWidth - 0.3, cellHeight - 0.3);
                    doc.setLineDashPattern([], 0);
                } else if (vacation) {
                    doc.setDrawColor(...vacationColor);
                    doc.setLineWidth(0.3);
                    doc.setLineDashPattern([0.8, 0.5], 0);
                    doc.rect(cellX, nextWeekY, cellWidth - 0.3, cellHeight - 0.3);
                    doc.setLineDashPattern([], 0);
                }

                // Day number with "Jan" indicator
                doc.setFontSize(5);
                if (isHoliday) {
                    doc.setTextColor(...holidayColor);
                } else if (isWeekend) {
                    doc.setTextColor(...weekendColor);
                } else if (fp || fpv) {
                    doc.setTextColor(...fpColor);
                } else {
                    doc.setTextColor(80, 80, 80);
                }
                doc.text(`${d}/1`, cellX + cellWidth / 2 - 0.1, nextWeekY + cellHeight / 2 + 1, { align: 'center' });
            }

            // Small label
            doc.setFontSize(4);
            doc.setTextColor(120, 120, 120);
            doc.text(`${year + 1}`, startX + monthWidth - 1, nextWeekY + 2, { align: 'right' });
        }
    }

    // Legend
    const legendY = pageHeight - 4;
    doc.setFontSize(7);
    let legendX = marginX + 5;

    // FP
    doc.setDrawColor(...fpColor);
    doc.setLineWidth(0.4);
    doc.rect(legendX, legendY - 2.5, 4, 4);
    doc.setTextColor(0, 0, 0);
    doc.text('FP', legendX + 5.5, legendY + 0.5);
    legendX += 18;

    // FPV
    doc.setDrawColor(...fpvColor);
    doc.setLineDashPattern([0.8, 0.5], 0);
    doc.rect(legendX, legendY - 2.5, 4, 4);
    doc.setLineDashPattern([], 0);
    doc.text('FPV', legendX + 5.5, legendY + 0.5);
    legendX += 20;

    // AFD
    doc.setDrawColor(...afdColor);
    doc.setLineDashPattern([0.8, 0.5], 0);
    doc.rect(legendX, legendY - 2.5, 4, 4);
    doc.setLineDashPattern([], 0);
    doc.text('AFD', legendX + 5.5, legendY + 0.5);
    legendX += 20;

    // FL
    doc.setDrawColor(...parentalColor);
    doc.setLineDashPattern([0.8, 0.5], 0);
    doc.rect(legendX, legendY - 2.5, 4, 4);
    doc.setLineDashPattern([], 0);
    doc.text('FL', legendX + 5.5, legendY + 0.5);
    legendX += 18;

    // SEM
    doc.setDrawColor(...vacationColor);
    doc.setLineDashPattern([0.8, 0.5], 0);
    doc.rect(legendX, legendY - 2.5, 4, 4);
    doc.setLineDashPattern([], 0);
    doc.text('SEM', legendX + 5.5, legendY + 0.5);
    legendX += 22;

    // Helgdag
    doc.setTextColor(...holidayColor);
    doc.text('Röd = Helgdag', legendX, legendY + 0.5);
    legendX += 30;

    // Grå = Helg
    doc.setTextColor(...weekendColor);
    doc.text('Grå = Helg', legendX, legendY + 0.5);
    legendX += 25;

    // Counts
    const countForYearFn = (set, yr) => {
        let count = 0;
        set.forEach(key => {
            const keyYear = parseInt(key.split('-')[0]);
            if (keyYear === yr) count++;
        });
        return count;
    };
    const fpCount = countForYearFn(fpDays, year);
    const fpvCount = countForYearFn(fpvDays, year);
    const afdCount = countForYearFn(afdDays, year);
    const flCount = countForYearFn(parentalLeaveDays, year);
    const semCount = countForYearFn(vacationDays, year);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    doc.text(`FP: ${fpCount} | FPV: ${fpvCount} | AFD: ${afdCount} | FL: ${flCount} | SEM: ${semCount}`, pageWidth - marginX - 5, legendY + 0.5, { align: 'right' });

    // Save
    const fileName = schemaName
        ? `${schemaName.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, '')}_${year}.pdf`
        : `Årsschema_${year}.pdf`;
    doc.save(fileName);

    // Close settings modal if open
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');
    if (settingsModalOverlay) {
        settingsModalOverlay.classList.remove('active');
    }
}

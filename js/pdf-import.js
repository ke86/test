// VRkalender - PDF Import
// Parse and import schedule data from PDF files

import {
    monthNames,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays,
    shiftData, pdfUploadedData,
    activeProfileIndex, profiles
} from './state.js';

import { createProfileFromPdf, switchToProfile, saveCurrentDataToProfile, renderProfileList } from './profiles.js';

// Callbacks
let refreshAllViewsCallback = null;

export function setPdfImportCallbacks(callbacks) {
    refreshAllViewsCallback = callbacks.refreshAllViews;
}

// Extract month and year from PDF text
export function extractPeriodFromPdf(text) {
    const periodMatch = text.match(/för perioden\s+(\d{4})-(\d{2})-(\d{2})\s*[-–]\s*(\d{4})-(\d{2})-(\d{2})/i);
    if (periodMatch) {
        return {
            year: parseInt(periodMatch[1]),
            month: parseInt(periodMatch[2]) - 1,
            periodString: `${periodMatch[1]}-${periodMatch[2]}`
        };
    }

    const stdMatch = text.match(/Standardperiod\s+(\d{4})-(\d{2})-(\d{2})\s*[-–]\s*(\d{4})-(\d{2})-(\d{2})/i);
    if (stdMatch) {
        return {
            year: parseInt(stdMatch[1]),
            month: parseInt(stdMatch[2]) - 1,
            periodString: `${stdMatch[1]}-${stdMatch[2]}`
        };
    }

    return null;
}

// Extract employee name from PDF text
export function extractNameFromPdf(text) {
    const nameMatch = text.match(/Anställningsnr\s+\d+\s*[-–]\s*([A-ZÅÄÖa-zåäö]+\s+[A-ZÅÄÖa-zåäö]+)/i);
    if (nameMatch) {
        return nameMatch[1].trim();
    }

    const headerMatch = text.match(/Arbetsschema[^]*?(\d+)\s*[-–]\s*([A-ZÅÄÖa-zåäö]+\s+[A-ZÅÄÖa-zåäö]+)/i);
    if (headerMatch) {
        return headerMatch[2].trim();
    }

    return null;
}

// Check if we have PDF data for a specific month
export function hasPdfDataForMonth(year, month) {
    const prefix = `${year}-${month}-`;
    for (const key of pdfUploadedData.fpDays) {
        if (key.startsWith(prefix)) return true;
    }
    for (const key of pdfUploadedData.fpvDays) {
        if (key.startsWith(prefix)) return true;
    }
    for (const key of pdfUploadedData.afdDays) {
        if (key.startsWith(prefix)) return true;
    }
    for (const key of pdfUploadedData.shiftData.keys()) {
        if (key.startsWith(prefix)) return true;
    }
    return false;
}

// Clear PDF data for a specific month
export function clearPdfDataForMonth(year, month) {
    const prefix = `${year}-${month}-`;

    for (const key of [...pdfUploadedData.fpDays]) {
        if (key.startsWith(prefix)) pdfUploadedData.fpDays.delete(key);
    }
    for (const key of [...pdfUploadedData.fpvDays]) {
        if (key.startsWith(prefix)) pdfUploadedData.fpvDays.delete(key);
    }
    for (const key of [...pdfUploadedData.afdDays]) {
        if (key.startsWith(prefix)) pdfUploadedData.afdDays.delete(key);
    }
    for (const key of [...pdfUploadedData.parentalLeaveDays]) {
        if (key.startsWith(prefix)) pdfUploadedData.parentalLeaveDays.delete(key);
    }
    for (const key of [...pdfUploadedData.vacationDays]) {
        if (key.startsWith(prefix)) pdfUploadedData.vacationDays.delete(key);
    }
    for (const key of [...pdfUploadedData.shiftData.keys()]) {
        if (key.startsWith(prefix)) pdfUploadedData.shiftData.delete(key);
    }

    for (const key of [...fpDays]) {
        if (key.startsWith(prefix)) fpDays.delete(key);
    }
    for (const key of [...fpvDays]) {
        if (key.startsWith(prefix)) fpvDays.delete(key);
    }
    for (const key of [...afdDays]) {
        if (key.startsWith(prefix)) afdDays.delete(key);
    }
    for (const key of [...parentalLeaveDays]) {
        if (key.startsWith(prefix)) parentalLeaveDays.delete(key);
    }
    for (const key of [...vacationDays]) {
        if (key.startsWith(prefix)) vacationDays.delete(key);
    }
    for (const key of [...shiftData.keys()]) {
        if (key.startsWith(prefix)) shiftData.delete(key);
    }
}

// Parse schedule text - handles multiple formats
export function parseScheduleFromText(text, year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = {
        fp: [],
        fpv: [],
        afd: [],
        parental: [],
        vacation: [],
        reserve: [],
        shifts: {}
    };

    const normalizedLines = text.toUpperCase();
    const normalized = normalizedLines.replace(/\s+/g, ' ');

    let foundDays = 0;

    // Format 1: Öresundståg format - "YYYY-MM-DD" followed by FRIDAG or service number + time
    const monthStr = String(month + 1).padStart(2, '0');

    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const datePattern = `${year}-${monthStr}-${dayStr}`;

        let searchStart = 0;
        let dateIndex;

        while ((dateIndex = normalized.indexOf(datePattern, searchStart)) !== -1) {
            const afterDate = normalized.substring(dateIndex + datePattern.length, dateIndex + datePattern.length + 150);

            if (/^\s*-\s*\d{4}-\d{2}-\d{2}/.test(afterDate)) {
                searchStart = dateIndex + datePattern.length;
                continue;
            }

            if (/^\s*(FV|FP2|FP-V|FPV)\b/.test(afterDate)) {
                data.fpv.push(day);
                foundDays++;
                break;
            }

            if (/^\s*(FRI|FP)\b/.test(afterDate)) {
                data.fp.push(day);
                foundDays++;
                break;
            }

            if (/^\s*FRIDAG/.test(afterDate)) {
                data.fp.push(day);
                foundDays++;
                break;
            }

            if (/^\s*(SEMESTER|SEM)\b/.test(afterDate)) {
                data.vacation.push(day);
                foundDays++;
                break;
            }

            if (/^\s*(FÖRÄLDRALEDIGHET|FÖRÄLDRA|FL)\b/.test(afterDate)) {
                data.parental.push(day);
                foundDays++;
                break;
            }

            if (/^\s*AFD\b/.test(afterDate)) {
                data.afd.push(day);
                foundDays++;
                break;
            }

            const shiftMatch = afterDate.match(/^\s*\*?\s*([A-Z0-9]+)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
            if (shiftMatch) {
                data.shifts[day] = {
                    service: shiftMatch[1],
                    start: shiftMatch[2],
                    end: shiftMatch[3]
                };
                foundDays++;
                break;
            }

            const shiftMatch2 = afterDate.match(/^\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s+([A-Z0-9]+)/);
            if (shiftMatch2) {
                data.shifts[day] = {
                    service: shiftMatch2[3],
                    start: shiftMatch2[1],
                    end: shiftMatch2[2]
                };
                foundDays++;
                break;
            }

            if (/^\s*RESERV/i.test(afterDate)) {
                data.reserve.push(day);
                foundDays++;
                break;
            }

            const beforeDate = normalized.substring(Math.max(0, dateIndex - 20), dateIndex);
            const hasWeekdayBefore = /(MÅNDAG|TISDAG|ONSDAG|TORSDAG|FREDAG|LÖRDAG|SÖNDAG)\s*$/.test(beforeDate);

            if (hasWeekdayBefore) {
                foundDays++;
                break;
            }

            searchStart = dateIndex + datePattern.length;
        }
    }

    // Format 2: Simple day + code format
    if (foundDays === 0) {
        for (let day = 1; day <= daysInMonth; day++) {
            const dayPatterns = [
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(FP)\\b`, 'i'),
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(FPV)\\b`, 'i'),
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(AFD)\\b`, 'i'),
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(FRIDAG)\\b`, 'i'),
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(L|LED|LEDIG)\\b`, 'i'),
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(SEM|SEMESTER)\\b`, 'i'),
                new RegExp(`\\b${day}\\b[\\s.:,-]*\\b(FL|FÖRÄLDR)`, 'i'),
            ];

            for (const pattern of dayPatterns) {
                const match = normalized.match(pattern);
                if (match) {
                    const code = match[1].toUpperCase();
                    if (code === 'FP') {
                        data.fp.push(day);
                        foundDays++;
                    } else if (code === 'FPV') {
                        data.fpv.push(day);
                        foundDays++;
                    } else if (code === 'AFD') {
                        data.afd.push(day);
                        foundDays++;
                    } else if (code === 'FRIDAG' || code === 'L' || code === 'LED' || code === 'LEDIG') {
                        const dayOfWeek = new Date(year, month, day).getDay();
                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                            data.fp.push(day);
                        } else {
                            data.fpv.push(day);
                        }
                        foundDays++;
                    } else if (code === 'SEM' || code === 'SEMESTER') {
                        data.vacation.push(day);
                        foundDays++;
                    } else if (code === 'FL' || code.startsWith('FÖRÄLDR')) {
                        data.parental.push(day);
                        foundDays++;
                    }
                    break;
                }
            }
        }
    }

    if (foundDays > 0) {
        let message = `<strong>Hittade ${foundDays} dagar:</strong><br>`;
        if (data.fp.length) message += `FP (helg): ${data.fp.join(', ')}<br>`;
        if (data.fpv.length) message += `FPV (vardag): ${data.fpv.join(', ')}<br>`;
        if (data.afd.length) message += `AFD: ${data.afd.join(', ')}<br>`;
        if (data.vacation.length) message += `Semester: ${data.vacation.join(', ')}<br>`;
        if (data.parental.length) message += `Föräldraledighet: ${data.parental.join(', ')}<br>`;
        if (data.reserve.length) message += `Reserv: ${data.reserve.join(', ')}<br>`;
        const shiftDays = Object.keys(data.shifts).map(d => parseInt(d)).sort((a, b) => a - b);
        if (shiftDays.length) message += `Arbetspass: ${shiftDays.join(', ')}`;

        return { success: true, message, data };
    } else {
        return {
            success: false,
            message: 'Kunde inte hitta några schemadagar i PDF:en. Kontrollera att PDF:en innehåller datum (YYYY-MM-DD) eller dagsnummer med koder som FRIDAG, FP, FPV, SEM, FL etc.'
        };
    }
}

// Apply parsed schedule data to calendar
export function applyParsedSchedule(data, year, month) {
    data.fp.forEach(day => {
        const key = `${year}-${month}-${day}`;
        fpDays.add(key);
        pdfUploadedData.fpDays.add(key);
    });

    data.fpv.forEach(day => {
        const key = `${year}-${month}-${day}`;
        fpvDays.add(key);
        pdfUploadedData.fpvDays.add(key);
    });

    data.afd.forEach(day => {
        const key = `${year}-${month}-${day}`;
        afdDays.add(key);
        pdfUploadedData.afdDays.add(key);
    });

    data.vacation.forEach(day => {
        const key = `${year}-${month}-${day}`;
        vacationDays.add(key);
        pdfUploadedData.vacationDays.add(key);
    });

    data.parental.forEach(day => {
        const key = `${year}-${month}-${day}`;
        parentalLeaveDays.add(key);
        pdfUploadedData.parentalLeaveDays.add(key);
    });

    if (data.shifts) {
        Object.keys(data.shifts).forEach(day => {
            const key = `${year}-${month}-${day}`;
            shiftData.set(key, data.shifts[day]);
            pdfUploadedData.shiftData.set(key, data.shifts[day]);
        });
    }
}

// Initialize PDF upload handler
export function initPdfUpload() {
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfMonthModal = document.getElementById('pdfMonthModal');
    const pdfParsingStatus = document.getElementById('pdfParsingStatus');
    const pdfMonthCancel = document.getElementById('pdfMonthCancel');
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');

    let pendingPdfFile = null;
    let detectedPdfMonth = null;
    let detectedPdfYear = null;
    let pendingPdfResult = null;

    // Initialize PDF.js
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        try {
            const minimalPdf = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 48]);
            pdfjsLib.getDocument({ data: minimalPdf }).promise.catch(() => {});
        } catch (e) {
            // Ignore errors during early init
        }
    }

    if (pdfFileInput) {
        pdfFileInput.addEventListener('change', async (e) => {
            if (!e.target.files || !e.target.files[0]) return;

            pendingPdfFile = e.target.files[0];

            pdfParsingStatus.style.display = 'block';
            pdfParsingStatus.className = 'pdf-parsing-status';
            pdfParsingStatus.textContent = 'Läser PDF-fil...';
            document.getElementById('pdfManualSelectWrapper').style.display = 'none';
            document.getElementById('pdfMonthConfirm').style.display = 'none';
            pdfMonthModal.classList.add('active');

            try {
                const arrayBuffer = await pendingPdfFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }

                const period = extractPeriodFromPdf(fullText);

                if (!period) {
                    pdfParsingStatus.className = 'pdf-parsing-status error';
                    pdfParsingStatus.textContent = 'Kunde inte hitta periodangivelse i PDF:en (t.ex. "för perioden 2026-01-01 - 2026-01-31")';
                    pdfFileInput.value = '';
                    return;
                }

                detectedPdfYear = period.year;
                detectedPdfMonth = period.month;

                pdfParsingStatus.textContent = 'Analyserar schema...';

                const result = parseScheduleFromText(fullText, detectedPdfYear, detectedPdfMonth);
                pendingPdfResult = result;

                if (!result.success) {
                    pdfParsingStatus.className = 'pdf-parsing-status error';
                    pdfParsingStatus.textContent = result.message;
                    pdfFileInput.value = '';
                    return;
                }

                if (hasPdfDataForMonth(detectedPdfYear, detectedPdfMonth)) {
                    const monthName = monthNames[detectedPdfMonth];
                    pdfParsingStatus.className = 'pdf-parsing-status';
                    pdfParsingStatus.innerHTML = `
                        <div style="text-align: center;">
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                                ${monthName} ${detectedPdfYear}
                            </div>
                            <div style="color: var(--ios-orange); margin-bottom: 12px;">
                                Det finns redan data för denna månad.
                            </div>
                            <div style="margin-bottom: 16px;">Vill du ersätta den?</div>
                            <div style="display: flex; gap: 10px; justify-content: center;">
                                <button class="btn-secondary" id="pdfReplaceCancel" style="margin: 0; padding: 10px 20px;">Avbryt</button>
                                <button class="btn-primary" id="pdfReplaceConfirm" style="margin: 0; padding: 10px 20px; background: var(--ios-orange);">Ersätt</button>
                            </div>
                        </div>
                    `;

                    document.getElementById('pdfReplaceCancel').addEventListener('click', () => {
                        pdfMonthModal.classList.remove('active');
                        pendingPdfFile = null;
                        pendingPdfResult = null;
                        pdfFileInput.value = '';
                    });

                    document.getElementById('pdfReplaceConfirm').addEventListener('click', () => {
                        clearPdfDataForMonth(detectedPdfYear, detectedPdfMonth);
                        applyParsedSchedule(pendingPdfResult.data, detectedPdfYear, detectedPdfMonth);

                        if (activeProfileIndex >= 0) {
                            saveCurrentDataToProfile(activeProfileIndex);
                        }

                        pdfParsingStatus.className = 'pdf-parsing-status success';
                        pdfParsingStatus.innerHTML = `<strong>${monthNames[detectedPdfMonth]} ${detectedPdfYear} ersatt!</strong><br>${pendingPdfResult.message}`;

                        setTimeout(() => {
                            pdfMonthModal.classList.remove('active');
                            if (settingsModalOverlay) settingsModalOverlay.classList.remove('active');
                            pendingPdfFile = null;
                            pendingPdfResult = null;
                            pdfFileInput.value = '';
                            renderProfileList();
                            if (refreshAllViewsCallback) refreshAllViewsCallback();
                        }, 1500);
                    });
                } else {
                    const extractedName = extractNameFromPdf(fullText);
                    const periodStr = period.periodString || `${detectedPdfYear}-${String(detectedPdfMonth + 1).padStart(2, '0')}`;

                    const existingProfileIndex = profiles.findIndex(p => p.name === extractedName);

                    if (existingProfileIndex >= 0) {
                        switchToProfile(existingProfileIndex);
                        applyParsedSchedule(result.data, detectedPdfYear, detectedPdfMonth);

                        const currentPeriods = profiles[existingProfileIndex].period ? profiles[existingProfileIndex].period.split(', ') : [];
                        if (!currentPeriods.includes(periodStr)) {
                            currentPeriods.push(periodStr);
                            currentPeriods.sort();
                            profiles[existingProfileIndex].period = currentPeriods.join(', ');
                        }

                        pdfParsingStatus.className = 'pdf-parsing-status success';
                        pdfParsingStatus.innerHTML = `<strong>${extractedName}</strong><br>${monthNames[detectedPdfMonth]} ${detectedPdfYear} tillagd`;
                    } else {
                        applyParsedSchedule(result.data, detectedPdfYear, detectedPdfMonth);

                        const pdfData = {
                            fpDays: new Set(fpDays),
                            fpvDays: new Set(fpvDays),
                            afdDays: new Set(afdDays),
                            parentalLeaveDays: new Set(parentalLeaveDays),
                            vacationDays: new Set(vacationDays),
                            shiftData: new Map(shiftData)
                        };
                        createProfileFromPdf(extractedName || 'Ny profil', periodStr, pdfData);

                        pdfParsingStatus.className = 'pdf-parsing-status success';
                        pdfParsingStatus.innerHTML = `<strong>Ny profil skapad!</strong><br>${extractedName || 'Ny profil'} - ${monthNames[detectedPdfMonth]} ${detectedPdfYear}`;
                    }

                    renderProfileList();

                    setTimeout(() => {
                        pdfMonthModal.classList.remove('active');
                        if (settingsModalOverlay) settingsModalOverlay.classList.remove('active');
                        pendingPdfFile = null;
                        pdfFileInput.value = '';
                        if (refreshAllViewsCallback) refreshAllViewsCallback();
                    }, 1500);
                }
            } catch (err) {
                pdfParsingStatus.className = 'pdf-parsing-status error';
                pdfParsingStatus.textContent = 'Kunde inte läsa PDF: ' + err.message;
                pdfFileInput.value = '';
            }
        });
    }

    if (pdfMonthCancel) {
        pdfMonthCancel.addEventListener('click', () => {
            pdfMonthModal.classList.remove('active');
            pendingPdfFile = null;
            pendingPdfResult = null;
            if (pdfFileInput) pdfFileInput.value = '';
        });
    }

    if (pdfMonthModal) {
        pdfMonthModal.addEventListener('click', (e) => {
            if (e.target === pdfMonthModal) {
                pdfMonthModal.classList.remove('active');
                pendingPdfFile = null;
                pendingPdfResult = null;
                if (pdfFileInput) pdfFileInput.value = '';
            }
        });
    }
}

// VRkalender - Profile System
// Profile management, switching, and data isolation

import {
    profiles, activeProfileIndex,
    fpDays, fpvDays, afdDays, parentalLeaveDays, vacationDays, daysOff,
    shiftData, manualFpDays, manualFpvDays,
    pdfUploadedData, savedSchedules,
    setProfiles, setActiveProfileIndex,
    setFpDays, setFpvDays, setAfdDays, setParentalLeaveDays, setVacationDays,
    setDaysOff, setShiftData, setManualFpDays, setManualFpvDays
} from './state.js';

// Callbacks
let refreshAllViewsCallback = null;
let generateYearlyPdfWithNameCallback = null;
let onDataChangedCallback = null;

export function setProfileCallbacks(callbacks) {
    refreshAllViewsCallback = callbacks.refreshAllViews;
    generateYearlyPdfWithNameCallback = callbacks.generateYearlyPdfWithName;
    onDataChangedCallback = callbacks.onDataChanged;
}

// Trigger data changed callback (for auto-save)
function notifyDataChanged() {
    if (onDataChangedCallback) onDataChangedCallback();
}

// Update profile name and schedule display in header
export function updateProfileNameDisplay() {
    const headerBar = document.getElementById('profileHeaderBar');
    const nameDisplay = document.getElementById('activeProfileDisplay');
    const scheduleDisplay = document.getElementById('activeScheduleDisplay');
    const scheduleBtn = document.getElementById('loadScheduleBtn');
    const scheduleBtnText = document.getElementById('loadScheduleBtnText');
    if (!headerBar || !nameDisplay) return;

    const name = getActiveProfileName();
    if (name) {
        nameDisplay.textContent = name;
        headerBar.style.display = 'flex';

        const profile = profiles[activeProfileIndex];
        if (profile && profile.schedule) {
            const schedule = savedSchedules[profile.schedule.name];
            const scheduleText = schedule
                ? `${profile.schedule.name} - Position ${profile.schedule.position}`
                : `${profile.schedule.name} - Position ${profile.schedule.position}`;

            if (scheduleDisplay) {
                scheduleDisplay.textContent = scheduleText;
                scheduleDisplay.style.display = 'block';
            }
            if (scheduleBtn) {
                scheduleBtn.classList.add('has-schedule');
            }
            if (scheduleBtnText) {
                scheduleBtnText.textContent = 'Byt fridagsnyckel';
            }
        } else {
            if (scheduleDisplay) {
                scheduleDisplay.style.display = 'none';
            }
            if (scheduleBtn) {
                scheduleBtn.classList.remove('has-schedule');
            }
            if (scheduleBtnText) {
                scheduleBtnText.textContent = 'Välj fridagsnyckel';
            }
        }
    } else {
        headerBar.style.display = 'none';
    }
}

// Render profile list in side panel
export function renderProfileList() {
    const profileList = document.getElementById('profileList');
    if (!profileList) return;

    updateProfileNameDisplay();

    if (profiles.length === 0) {
        profileList.innerHTML = '<div class="profile-empty">Inga profiler tillagda.<br>Ladda upp en PDF för att skapa en profil.</div>';
        return;
    }

    let html = '';
    profiles.forEach((profile, index) => {
        const isActive = index === activeProfileIndex;
        const scheduleDisplay = profile.schedule && profile.schedule.name
            ? `<div class="profile-item-schedule">${profile.schedule.name}</div>`
            : `<div class="profile-item-schedule no-schedule">Välj fridagsnyckel</div>`;
        html += `
            <div class="profile-item ${isActive ? 'active' : ''}" data-index="${index}">
                <svg class="profile-item-check ${isActive ? '' : 'hidden'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <div class="profile-item-info">
                    <div class="profile-item-name">${profile.name}</div>
                    ${scheduleDisplay}
                    ${profile.period ? `<div class="profile-item-period">${profile.period}</div>` : ''}
                </div>
                <button class="profile-item-download" data-index="${index}" title="Ladda ner PDF">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                <button class="profile-item-delete" data-index="${index}" title="Ta bort profil">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
    });
    profileList.innerHTML = html;

    // Add click handlers for profile items
    profileList.querySelectorAll('.profile-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.profile-item-delete') || e.target.closest('.profile-item-download')) return;
            const index = parseInt(item.dataset.index);
            switchToProfile(index);
        });
    });

    // Add click handlers for delete buttons
    profileList.querySelectorAll('.profile-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            showDeleteProfileConfirm(index);
        });
    });

    // Add click handlers for download buttons
    profileList.querySelectorAll('.profile-item-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            downloadProfilePdf(index);
        });
    });
}

// Render "Vem jobbar idag" list
export function renderWorkingTodayList() {
    const workingTodayList = document.getElementById('workingTodayList');
    if (!workingTodayList) return;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

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

    workingToday.sort((a, b) => {
        const timeA = a.start.replace(':', '');
        const timeB = b.start.replace(':', '');
        return timeA.localeCompare(timeB);
    });

    if (workingToday.length === 0) {
        workingTodayList.innerHTML = '<div class="working-today-empty">Inga personer jobbar idag<br>(baserat på inlästa profiler)</div>';
        return;
    }

    let html = '';
    workingToday.forEach(person => {
        html += `
            <div class="working-today-item">
                <span class="working-today-name">${person.name}</span>
                <span class="working-today-time">${person.start} - ${person.end}</span>
            </div>
        `;
    });
    workingTodayList.innerHTML = html;
}

// Download PDF for a specific profile
export function downloadProfilePdf(index) {
    if (index < 0 || index >= profiles.length) return;

    const profile = profiles[index];

    // Temporarily switch to profile data
    const originalFpDays = fpDays;
    const originalFpvDays = fpvDays;
    const originalAfdDays = afdDays;
    const originalParentalLeaveDays = parentalLeaveDays;
    const originalVacationDays = vacationDays;
    const originalShiftData = shiftData;

    // Load profile data
    setFpDays(profile.data.fpDays);
    setFpvDays(profile.data.fpvDays);
    setAfdDays(profile.data.afdDays);
    setParentalLeaveDays(profile.data.parentalLeaveDays);
    setVacationDays(profile.data.vacationDays);
    setShiftData(profile.data.shiftData);

    // Generate PDF with profile name
    if (generateYearlyPdfWithNameCallback) {
        generateYearlyPdfWithNameCallback(profile.name);
    }

    // Restore original data
    setFpDays(originalFpDays);
    setFpvDays(originalFpvDays);
    setAfdDays(originalAfdDays);
    setParentalLeaveDays(originalParentalLeaveDays);
    setVacationDays(originalVacationDays);
    setShiftData(originalShiftData);
}

// Switch to a different profile
export function switchToProfile(index) {
    if (index < 0 || index >= profiles.length) return;

    // Save current data to current profile before switching
    if (activeProfileIndex >= 0 && activeProfileIndex < profiles.length) {
        saveCurrentDataToProfile(activeProfileIndex);
    }

    // Load data from new profile
    setActiveProfileIndex(index);
    loadProfileData(index);
    renderProfileList();
    if (refreshAllViewsCallback) refreshAllViewsCallback();
    notifyDataChanged();
}

// Save current calendar data to a profile
export function saveCurrentDataToProfile(index) {
    if (index < 0 || index >= profiles.length) return;

    profiles[index].data = {
        fpDays: new Set(fpDays),
        fpvDays: new Set(fpvDays),
        afdDays: new Set(afdDays),
        parentalLeaveDays: new Set(parentalLeaveDays),
        vacationDays: new Set(vacationDays),
        shiftData: new Map(shiftData),
        manualFpDays: new Set(manualFpDays),
        manualFpvDays: new Set(manualFpvDays)
    };
}

// Load profile data into current calendar
export function loadProfileData(index) {
    if (index < 0 || index >= profiles.length) return;

    const data = profiles[index].data;
    if (!data) {
        clearCalendarDataSilent();
        return;
    }

    setFpDays(new Set(data.fpDays || []));
    setFpvDays(new Set(data.fpvDays || []));
    setAfdDays(new Set(data.afdDays || []));
    setParentalLeaveDays(new Set(data.parentalLeaveDays || []));
    setVacationDays(new Set(data.vacationDays || []));
    setShiftData(new Map(data.shiftData || []));
    setManualFpDays(new Set(data.manualFpDays || []));
    setManualFpvDays(new Set(data.manualFpvDays || []));
}

// Clear calendar data without confirmation
export function clearCalendarDataSilent() {
    fpDays.clear();
    fpvDays.clear();
    afdDays.clear();
    parentalLeaveDays.clear();
    vacationDays.clear();
    shiftData.clear();
    manualFpDays.clear();
    manualFpvDays.clear();
    pdfUploadedData.fpDays.clear();
    pdfUploadedData.fpvDays.clear();
    pdfUploadedData.afdDays.clear();
    pdfUploadedData.parentalLeaveDays.clear();
    pdfUploadedData.vacationDays.clear();
    pdfUploadedData.shiftData.clear();
}

// Create a new profile from PDF data
export function createProfileFromPdf(name, period, pdfData) {
    const profile = {
        id: Date.now(),
        name: name || 'Ny profil',
        period: period || '',
        data: {
            fpDays: new Set(pdfData.fpDays || []),
            fpvDays: new Set(pdfData.fpvDays || []),
            afdDays: new Set(pdfData.afdDays || []),
            parentalLeaveDays: new Set(pdfData.parentalLeaveDays || []),
            vacationDays: new Set(pdfData.vacationDays || []),
            shiftData: new Map(pdfData.shiftData || []),
            manualFpDays: new Set(),
            manualFpvDays: new Set()
        }
    };

    profiles.push(profile);
    setActiveProfileIndex(profiles.length - 1);

    loadProfileData(activeProfileIndex);
    renderProfileList();
    if (refreshAllViewsCallback) refreshAllViewsCallback();
    notifyDataChanged();

    return profile;
}

// Show delete confirmation
export function showDeleteProfileConfirm(index) {
    if (index < 0 || index >= profiles.length) return;
    const profile = profiles[index];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteProfileConfirmModal';
    modal.innerHTML = `
        <div class="holiday-info-modal" style="padding: 24px; max-width: 320px;">
            <h2 style="font-size: 18px; margin-bottom: 12px; color: var(--text-primary);">Ta bort profil?</h2>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
                Är du säker på att du vill ta bort <strong>${profile.name}</strong>?
                <br><br>
                All data för denna profil kommer att försvinna.
            </p>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" id="deleteProfileCancel" style="flex: 1; margin-top: 0;">Avbryt</button>
                <button class="btn-primary" id="deleteProfileConfirm" style="flex: 1; background: var(--ios-red); margin-top: 0;">Ta bort</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('deleteProfileCancel').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('deleteProfileConfirm').addEventListener('click', () => {
        deleteProfile(index);
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Delete a profile
export function deleteProfile(index) {
    if (index < 0 || index >= profiles.length) return;

    profiles.splice(index, 1);

    if (profiles.length === 0) {
        setActiveProfileIndex(-1);
        clearCalendarDataSilent();
    } else if (activeProfileIndex >= profiles.length) {
        setActiveProfileIndex(profiles.length - 1);
        loadProfileData(activeProfileIndex);
    } else if (index === activeProfileIndex) {
        setActiveProfileIndex(0);
        loadProfileData(activeProfileIndex);
    } else if (index < activeProfileIndex) {
        setActiveProfileIndex(activeProfileIndex - 1);
    }

    renderProfileList();
    if (refreshAllViewsCallback) refreshAllViewsCallback();
    notifyDataChanged();
}

// Get active profile name
export function getActiveProfileName() {
    if (activeProfileIndex >= 0 && activeProfileIndex < profiles.length) {
        return profiles[activeProfileIndex].name;
    }
    return null;
}

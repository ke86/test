// VRkalender - LocalStorage Module
// Handles persistent storage of app data

const STORAGE_KEY = 'vrkalender_data';
const STORAGE_VERSION = 1;

// Serialize Set to Array for JSON
function setToArray(set) {
    return set instanceof Set ? [...set] : [];
}

// Serialize Map to Object for JSON
function mapToObject(map) {
    if (!(map instanceof Map)) return {};
    const obj = {};
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}

// Deserialize Array to Set
function arrayToSet(arr) {
    return new Set(Array.isArray(arr) ? arr : []);
}

// Deserialize Object to Map
function objectToMap(obj) {
    const map = new Map();
    if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
            map.set(key, value);
        });
    }
    return map;
}

/**
 * Save all app data to localStorage
 */
export function saveToStorage(state) {
    try {
        const data = {
            version: STORAGE_VERSION,
            savedAt: new Date().toISOString(),

            // Profiles
            profiles: state.profiles || [],
            activeProfileIndex: state.activeProfileIndex ?? -1,

            // Schedule data (convert Sets to Arrays)
            fpDays: setToArray(state.fpDays),
            fpvDays: setToArray(state.fpvDays),
            afdDays: setToArray(state.afdDays),
            manualFpDays: setToArray(state.manualFpDays),
            manualFpvDays: setToArray(state.manualFpvDays),

            // Leave types
            parentalLeaveDays: setToArray(state.parentalLeaveDays),
            vacationDays: setToArray(state.vacationDays),

            // Shift data (convert Map to Object)
            shiftData: mapToObject(state.shiftData),

            // Settings
            showSwedishHolidays: state.showSwedishHolidays ?? true,
            showNorwegianHolidays: state.showNorwegianHolidays ?? false,

            // Current view state
            currentYear: state.currentYear,
            currentMonth: state.currentMonth
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('💾 VRkalender: Data sparad', new Date().toLocaleTimeString());
        return true;
    } catch (error) {
        console.error('❌ VRkalender: Kunde inte spara data:', error);
        return false;
    }
}

/**
 * Load app data from localStorage
 * Returns null if no data exists
 */
export function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            console.log('📭 VRkalender: Ingen sparad data hittades');
            return null;
        }

        const data = JSON.parse(stored);

        // Version check for future migrations
        if (data.version !== STORAGE_VERSION) {
            console.log('🔄 VRkalender: Migrerar data från version', data.version);
            // Future: handle migrations here
        }

        // Convert Arrays back to Sets, Objects back to Maps
        const result = {
            profiles: data.profiles || [],
            activeProfileIndex: data.activeProfileIndex ?? -1,

            fpDays: arrayToSet(data.fpDays),
            fpvDays: arrayToSet(data.fpvDays),
            afdDays: arrayToSet(data.afdDays),
            manualFpDays: arrayToSet(data.manualFpDays),
            manualFpvDays: arrayToSet(data.manualFpvDays),

            parentalLeaveDays: arrayToSet(data.parentalLeaveDays),
            vacationDays: arrayToSet(data.vacationDays),

            shiftData: objectToMap(data.shiftData),

            showSwedishHolidays: data.showSwedishHolidays ?? true,
            showNorwegianHolidays: data.showNorwegianHolidays ?? false,

            currentYear: data.currentYear,
            currentMonth: data.currentMonth,

            savedAt: data.savedAt
        };

        console.log('✅ VRkalender: Data laddad från', data.savedAt);
        return result;
    } catch (error) {
        console.error('❌ VRkalender: Kunde inte ladda data:', error);
        return null;
    }
}

/**
 * Clear all stored data
 */
export function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ VRkalender: Sparad data rensad');
        return true;
    } catch (error) {
        console.error('❌ VRkalender: Kunde inte rensa data:', error);
        return false;
    }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable() {
    try {
        const test = '__vrkalender_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get storage info (size, last saved, etc.)
 */
export function getStorageInfo() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const data = JSON.parse(stored);
        return {
            sizeBytes: new Blob([stored]).size,
            sizeKB: (new Blob([stored]).size / 1024).toFixed(2),
            savedAt: data.savedAt,
            version: data.version,
            profileCount: data.profiles?.length || 0
        };
    } catch (error) {
        return null;
    }
}

/**
 * Export data as JSON file (backup)
 */
export function exportToFile() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            console.warn('Ingen data att exportera');
            return false;
        }

        const blob = new Blob([stored], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vrkalender-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📤 VRkalender: Data exporterad till fil');
        return true;
    } catch (error) {
        console.error('❌ VRkalender: Export misslyckades:', error);
        return false;
    }
}

/**
 * Import data from JSON file (restore)
 */
export function importFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate basic structure
                if (!data.version || !data.profiles) {
                    throw new Error('Ogiltig backup-fil');
                }

                localStorage.setItem(STORAGE_KEY, e.target.result);
                console.log('📥 VRkalender: Data importerad från fil');
                resolve(loadFromStorage());
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Kunde inte läsa filen'));
        reader.readAsText(file);
    });
}

// VRkalender - Holiday Functions
// Swedish and Norwegian holiday calculations and OB rate logic

import { monthNamesShort, showSwedishHolidays, showNorwegianHolidays } from './state.js';

// Calculate Easter (Meeus/Jones/Butcher algorithm)
export function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
}

// Get Swedish holidays for a year
export function getSwedishHolidays(year) {
    const easter = getEaster(year);
    const holidays = {};

    holidays[`${year}-0-1`] = 'Nyårsdagen';
    holidays[`${year}-0-6`] = 'Trettondedag jul';
    holidays[`${year}-4-1`] = 'Första maj';
    holidays[`${year}-5-6`] = 'Nationaldagen';
    holidays[`${year}-11-24`] = 'Julafton';
    holidays[`${year}-11-25`] = 'Juldagen';
    holidays[`${year}-11-26`] = 'Annandag jul';
    holidays[`${year}-11-31`] = 'Nyårsafton';

    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays[`${year}-${goodFriday.getMonth()}-${goodFriday.getDate()}`] = 'Långfredagen';

    const easterEve = new Date(easter);
    easterEve.setDate(easter.getDate() - 1);
    holidays[`${year}-${easterEve.getMonth()}-${easterEve.getDate()}`] = 'Påskafton';

    holidays[`${year}-${easter.getMonth()}-${easter.getDate()}`] = 'Påskdagen';

    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays[`${year}-${easterMonday.getMonth()}-${easterMonday.getDate()}`] = 'Annandag påsk';

    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays[`${year}-${ascension.getMonth()}-${ascension.getDate()}`] = 'Kristi himmelsfärdsdag';

    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    holidays[`${year}-${pentecost.getMonth()}-${pentecost.getDate()}`] = 'Pingstdagen';

    for (let d = 20; d <= 26; d++) {
        const date = new Date(year, 5, d);
        if (date.getDay() === 6) {
            holidays[`${year}-5-${d - 1}`] = 'Midsommarafton';
            holidays[`${year}-5-${d}`] = 'Midsommardagen';
            break;
        }
    }

    for (let d = 31; d <= 37; d++) {
        const actualDay = d > 31 ? d - 31 : d;
        const month = d > 31 ? 10 : 9;
        const date = new Date(year, month, actualDay);
        if (date.getDay() === 6) {
            holidays[`${year}-${month}-${actualDay}`] = 'Alla helgons dag';
            break;
        }
    }

    return holidays;
}

// Get Norwegian holidays for a year
export function getNorwegianHolidays(year) {
    const easter = getEaster(year);
    const holidays = {};

    // Fixed holidays
    holidays[`${year}-0-1`] = 'Nyttårsdag';
    holidays[`${year}-4-1`] = 'Arbeidernes dag';
    holidays[`${year}-4-17`] = 'Grunnlovsdag';
    holidays[`${year}-11-25`] = 'Første juledag';
    holidays[`${year}-11-26`] = 'Andre juledag';

    // Easter-based holidays
    const maundyThursday = new Date(easter);
    maundyThursday.setDate(easter.getDate() - 3);
    holidays[`${year}-${maundyThursday.getMonth()}-${maundyThursday.getDate()}`] = 'Skjærtorsdag';

    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays[`${year}-${goodFriday.getMonth()}-${goodFriday.getDate()}`] = 'Langfredag';

    holidays[`${year}-${easter.getMonth()}-${easter.getDate()}`] = 'Første påskedag';

    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays[`${year}-${easterMonday.getMonth()}-${easterMonday.getDate()}`] = 'Andre påskedag';

    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays[`${year}-${ascension.getMonth()}-${ascension.getDate()}`] = 'Kristi himmelfartsdag';

    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    holidays[`${year}-${pentecost.getMonth()}-${pentecost.getDate()}`] = 'Første pinsedag';

    const whitMonday = new Date(easter);
    whitMonday.setDate(easter.getDate() + 50);
    holidays[`${year}-${whitMonday.getMonth()}-${whitMonday.getDate()}`] = 'Andre pinsedag';

    return holidays;
}

// Check if a date has a Swedish holiday
export function isSwedishHoliday(year, month, day) {
    if (!showSwedishHolidays) return false;
    const swedish = getSwedishHolidays(year);
    return swedish[`${year}-${month}-${day}`] !== undefined;
}

// Check if a date has a Norwegian holiday
export function isNorwegianHoliday(year, month, day) {
    if (!showNorwegianHolidays) return false;
    const norwegian = getNorwegianHolidays(year);
    return norwegian[`${year}-${month}-${day}`] !== undefined;
}

// Get combined holidays based on settings
export function getHolidaysForYear(year) {
    let holidays = {};

    if (showSwedishHolidays) {
        holidays = { ...holidays, ...getSwedishHolidays(year) };
    }

    if (showNorwegianHolidays) {
        const norwegian = getNorwegianHolidays(year);
        for (const [key, name] of Object.entries(norwegian)) {
            if (holidays[key]) {
                if (!holidays[key].includes(name)) {
                    holidays[key] = holidays[key] + ' / ' + name;
                }
            } else {
                holidays[key] = name;
            }
        }
    }

    return holidays;
}

// Get OB rates based on date
export function getObRates(year, month, day) {
    const date = new Date(year, month, day);
    const cutoffDate = new Date(2025, 4, 1); // 2025-05-01

    if (date < cutoffDate) {
        return { enkel: '23,82', kvalificerad: '53,20', storhelg: '119,53' };
    } else {
        return { enkel: '24,49', kvalificerad: '54,69', storhelg: '122,88' };
    }
}

// Calculate storhelg period for a given holiday
export function getStorhelgPeriod(holidayName, year, month, day) {
    const name = holidayName ? holidayName.toLowerCase() : '';
    const holidays = getSwedishHolidays(year);

    // Nationaldagen is special: 00:00-24:00 same day
    if (name.includes('nationaldagen')) {
        return {
            start: `6 juni kl 00:00`,
            end: `6 juni kl 24:00`,
            description: `Nationaldagen: 6 juni kl 00:00 → 24:00`
        };
    }

    // Easter period
    if (name.includes('långfredagen') || name.includes('langfredag') ||
        name.includes('påskafton') || name.includes('påskdagen') ||
        name.includes('første påskedag') || name.includes('annandag påsk') ||
        name.includes('andre påskedag')) {
        const easter = getEaster(year);
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        const startDate = new Date(goodFriday);
        startDate.setDate(goodFriday.getDate() - 1);

        const easterMonday = new Date(easter);
        easterMonday.setDate(easter.getDate() + 1);
        const endDate = new Date(easterMonday);
        endDate.setDate(easterMonday.getDate() + 1);

        return {
            start: `${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00`,
            end: `${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`,
            description: `Påskhelgen: ${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00 → ${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`
        };
    }

    // Midsommar
    if (name.includes('midsommar')) {
        let midsommarEve = null;
        for (let d = 19; d <= 25; d++) {
            const date = new Date(year, 5, d);
            if (date.getDay() === 5) {
                midsommarEve = date;
                break;
            }
        }
        if (midsommarEve) {
            const startDate = new Date(midsommarEve);
            startDate.setDate(midsommarEve.getDate() - 1);

            const midsommarDay = new Date(midsommarEve);
            midsommarDay.setDate(midsommarEve.getDate() + 1);
            const endDate = new Date(midsommarDay);
            endDate.setDate(midsommarDay.getDate() + 1);
            endDate.setDate(endDate.getDate() + 1);

            return {
                start: `${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00`,
                end: `${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`,
                description: `Midsommar: ${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00 → ${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`
            };
        }
    }

    // Jul
    if (name.includes('julafton') || name.includes('juldagen') ||
        name.includes('første juledag') || name.includes('annandag jul') ||
        name.includes('andre juledag')) {
        const startDate = new Date(year, 11, 23);

        const annandag = new Date(year, 11, 26);
        let endDate = new Date(annandag);
        endDate.setDate(annandag.getDate() + 1);

        while (endDate.getDay() === 0 || endDate.getDay() === 6) {
            endDate.setDate(endDate.getDate() + 1);
        }

        return {
            start: `${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00`,
            end: `${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`,
            description: `Julhelgen: ${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00 → ${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`
        };
    }

    // Nyår
    if (name.includes('nyårsafton') || name.includes('nyårsdagen') || name.includes('nyttårsdag')) {
        const startDate = new Date(year, 11, 30);

        const nyarsdagen = new Date(year + 1, 0, 1);
        let endDate = new Date(nyarsdagen);
        endDate.setDate(nyarsdagen.getDate() + 1);

        while (endDate.getDay() === 0 || endDate.getDay() === 6) {
            endDate.setDate(endDate.getDate() + 1);
        }

        return {
            start: `${startDate.getDate()} ${monthNamesShort[startDate.getMonth()]} kl 19:00`,
            end: `${endDate.getDate()} ${monthNamesShort[endDate.getMonth()]} kl 07:00`,
            description: `Nyårshelgen: ${startDate.getDate()} dec kl 19:00 → ${endDate.getDate()} jan kl 07:00`
        };
    }

    return null;
}

// Check if a date is a partial storhelg day
export function isPartialStorhelgDay(year, month, day) {
    const checkDate = new Date(year, month, day);
    const checkDateStr = checkDate.toDateString();

    // Check Easter
    const easter = getEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const dayBeforeEaster = new Date(goodFriday);
    dayBeforeEaster.setDate(goodFriday.getDate() - 1);

    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    const dayAfterEaster = new Date(easterMonday);
    dayAfterEaster.setDate(easterMonday.getDate() + 1);

    if (checkDateStr === dayBeforeEaster.toDateString()) {
        return { type: 'before', period: 'Påskhelgen', time: 'från kl 19:00' };
    }
    if (checkDateStr === dayAfterEaster.toDateString()) {
        return { type: 'after', period: 'Påskhelgen', time: 'till kl 07:00' };
    }

    // Check Midsommar
    let midsommarEve = null;
    for (let d = 19; d <= 25; d++) {
        const date = new Date(year, 5, d);
        if (date.getDay() === 5) {
            midsommarEve = date;
            break;
        }
    }
    if (midsommarEve) {
        const dayBeforeMidsommar = new Date(midsommarEve);
        dayBeforeMidsommar.setDate(midsommarEve.getDate() - 1);

        const midsommarDay = new Date(midsommarEve);
        midsommarDay.setDate(midsommarEve.getDate() + 1);
        const dayAfterMidsommar = new Date(midsommarDay);
        dayAfterMidsommar.setDate(midsommarDay.getDate() + 2);

        if (checkDateStr === dayBeforeMidsommar.toDateString()) {
            return { type: 'before', period: 'Midsommar', time: 'från kl 19:00' };
        }
        if (checkDateStr === dayAfterMidsommar.toDateString()) {
            return { type: 'after', period: 'Midsommar', time: 'till kl 07:00' };
        }
    }

    // Check Jul
    const dayBeforeJul = new Date(year, 11, 23);
    const annandag = new Date(year, 11, 26);
    let dayAfterJul = new Date(annandag);
    dayAfterJul.setDate(annandag.getDate() + 1);
    while (dayAfterJul.getDay() === 0 || dayAfterJul.getDay() === 6) {
        dayAfterJul.setDate(dayAfterJul.getDate() + 1);
    }

    if (checkDateStr === dayBeforeJul.toDateString()) {
        return { type: 'before', period: 'Julhelgen', time: 'från kl 19:00' };
    }
    if (checkDateStr === dayAfterJul.toDateString()) {
        return { type: 'after', period: 'Julhelgen', time: 'till kl 07:00' };
    }

    // Check Nyår
    const dayBeforeNyar = new Date(year, 11, 30);
    const nyarsdagen = new Date(year + 1, 0, 1);
    let dayAfterNyar = new Date(nyarsdagen);
    dayAfterNyar.setDate(nyarsdagen.getDate() + 1);
    while (dayAfterNyar.getDay() === 0 || dayAfterNyar.getDay() === 6) {
        dayAfterNyar.setDate(dayAfterNyar.getDate() + 1);
    }

    if (checkDateStr === dayBeforeNyar.toDateString()) {
        return { type: 'before', period: 'Nyårshelgen', time: 'från kl 19:00' };
    }
    if (checkDateStr === dayAfterNyar.toDateString()) {
        return { type: 'after', period: 'Nyårshelgen', time: 'till kl 07:00' };
    }

    // Check if we're the day after nyår from previous year
    const prevNyarsdagen = new Date(year, 0, 1);
    let dayAfterPrevNyar = new Date(prevNyarsdagen);
    dayAfterPrevNyar.setDate(prevNyarsdagen.getDate() + 1);
    while (dayAfterPrevNyar.getDay() === 0 || dayAfterPrevNyar.getDay() === 6) {
        dayAfterPrevNyar.setDate(dayAfterPrevNyar.getDate() + 1);
    }

    if (checkDateStr === dayAfterPrevNyar.toDateString()) {
        return { type: 'after', period: 'Nyårshelgen', time: 'till kl 07:00' };
    }

    // Check Trettondagen
    const dayBeforeTretton = new Date(year, 0, 5);
    let dayAfterTretton = new Date(year, 0, 7);
    while (dayAfterTretton.getDay() === 0 || dayAfterTretton.getDay() === 6) {
        dayAfterTretton.setDate(dayAfterTretton.getDate() + 1);
    }

    if (checkDateStr === dayBeforeTretton.toDateString() && dayBeforeTretton.getDay() !== 0 && dayBeforeTretton.getDay() !== 6) {
        return { type: 'before', period: 'Trettondagen', time: 'från kl 19:00', category: 'kvalificerad' };
    }
    if (checkDateStr === dayAfterTretton.toDateString()) {
        return { type: 'after', period: 'Trettondagen', time: 'till kl 07:00', category: 'kvalificerad' };
    }

    // Check Första maj
    const dayBeforeMaj = new Date(year, 3, 30);
    let dayAfterMaj = new Date(year, 4, 2);
    while (dayAfterMaj.getDay() === 0 || dayAfterMaj.getDay() === 6) {
        dayAfterMaj.setDate(dayAfterMaj.getDate() + 1);
    }

    if (checkDateStr === dayBeforeMaj.toDateString() && dayBeforeMaj.getDay() !== 0 && dayBeforeMaj.getDay() !== 6) {
        return { type: 'before', period: 'Första maj', time: 'från kl 19:00', category: 'kvalificerad' };
    }
    if (checkDateStr === dayAfterMaj.toDateString()) {
        return { type: 'after', period: 'Första maj', time: 'till kl 07:00', category: 'kvalificerad' };
    }

    // Check Kristi himmelsfärdsdag
    const kristiHimmelsfardsdag = new Date(easter);
    kristiHimmelsfardsdag.setDate(easter.getDate() + 39);
    const dayBeforeKristi = new Date(kristiHimmelsfardsdag);
    dayBeforeKristi.setDate(kristiHimmelsfardsdag.getDate() - 1);
    let dayAfterKristi = new Date(kristiHimmelsfardsdag);
    dayAfterKristi.setDate(kristiHimmelsfardsdag.getDate() + 1);
    while (dayAfterKristi.getDay() === 0 || dayAfterKristi.getDay() === 6) {
        dayAfterKristi.setDate(dayAfterKristi.getDate() + 1);
    }

    if (checkDateStr === dayBeforeKristi.toDateString()) {
        return { type: 'before', period: 'Kristi himmelsfärdsdag', time: 'från kl 19:00', category: 'kvalificerad' };
    }
    if (checkDateStr === dayAfterKristi.toDateString()) {
        return { type: 'after', period: 'Kristi himmelsfärdsdag', time: 'till kl 07:00', category: 'kvalificerad' };
    }

    return null;
}

// Check if a date falls within any storhelg period
export function isWithinStorhelgPeriod(year, month, day) {
    const checkDate = new Date(year, month, day);
    const checkTime = checkDate.getTime();

    // Check Easter period
    const easter = getEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const easterStart = new Date(goodFriday);
    easterStart.setDate(goodFriday.getDate() - 1);
    easterStart.setHours(19, 0, 0, 0);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    const easterEnd = new Date(easterMonday);
    easterEnd.setDate(easterMonday.getDate() + 1);
    easterEnd.setHours(7, 0, 0, 0);

    if (checkTime >= easterStart.getTime() && checkTime < easterEnd.getTime()) {
        return { period: 'Påskhelgen', start: easterStart, end: easterEnd };
    }

    // Check Nationaldagen
    const nationaldagen = new Date(year, 5, 6);
    if (checkDate.toDateString() === nationaldagen.toDateString()) {
        return { period: 'Nationaldagen', start: nationaldagen, end: nationaldagen };
    }

    // Check Midsommar
    let midsommarEve = null;
    for (let d = 19; d <= 25; d++) {
        const date = new Date(year, 5, d);
        if (date.getDay() === 5) {
            midsommarEve = date;
            break;
        }
    }
    if (midsommarEve) {
        const midsommarStart = new Date(midsommarEve);
        midsommarStart.setDate(midsommarEve.getDate() - 1);
        midsommarStart.setHours(19, 0, 0, 0);
        const midsommarEnd = new Date(midsommarEve);
        midsommarEnd.setDate(midsommarEve.getDate() + 3);
        midsommarEnd.setHours(7, 0, 0, 0);

        if (checkTime >= midsommarStart.getTime() && checkTime < midsommarEnd.getTime()) {
            return { period: 'Midsommar', start: midsommarStart, end: midsommarEnd };
        }
    }

    // Check Jul
    const julStart = new Date(year, 11, 23);
    julStart.setHours(19, 0, 0, 0);
    const annandagJul = new Date(year, 11, 26);
    let julEnd = new Date(annandagJul);
    julEnd.setDate(annandagJul.getDate() + 1);
    while (julEnd.getDay() === 0 || julEnd.getDay() === 6) {
        julEnd.setDate(julEnd.getDate() + 1);
    }
    julEnd.setHours(7, 0, 0, 0);

    if (checkTime >= julStart.getTime() && checkTime < julEnd.getTime()) {
        return { period: 'Julhelgen', start: julStart, end: julEnd };
    }

    // Check Nyår
    const nyarStart = new Date(year, 11, 30);
    nyarStart.setHours(19, 0, 0, 0);
    const nyarsdagen = new Date(year + 1, 0, 1);
    let nyarEnd = new Date(nyarsdagen);
    nyarEnd.setDate(nyarsdagen.getDate() + 1);
    while (nyarEnd.getDay() === 0 || nyarEnd.getDay() === 6) {
        nyarEnd.setDate(nyarEnd.getDate() + 1);
    }
    nyarEnd.setHours(7, 0, 0, 0);

    if (checkTime >= nyarStart.getTime() && checkTime < nyarEnd.getTime()) {
        return { period: 'Nyårshelgen', start: nyarStart, end: nyarEnd };
    }

    // Check if we're in the nyår period at start of year
    const prevNyarStart = new Date(year - 1, 11, 30);
    prevNyarStart.setHours(19, 0, 0, 0);
    const thisNyarsdagen = new Date(year, 0, 1);
    let prevNyarEnd = new Date(thisNyarsdagen);
    prevNyarEnd.setDate(thisNyarsdagen.getDate() + 1);
    while (prevNyarEnd.getDay() === 0 || prevNyarEnd.getDay() === 6) {
        prevNyarEnd.setDate(prevNyarEnd.getDate() + 1);
    }
    prevNyarEnd.setHours(7, 0, 0, 0);

    if (checkTime >= prevNyarStart.getTime() && checkTime < prevNyarEnd.getTime()) {
        return { period: 'Nyårshelgen', start: prevNyarStart, end: prevNyarEnd };
    }

    return null;
}

// Get OB category for a day
export function getObCategory(holidayName, year, month, day) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const rates = getObRates(year, month, day);
    const name = holidayName ? holidayName.toLowerCase() : '';

    const storhelgHolidays = [
        'långfredagen', 'langfredag',
        'påskafton',
        'påskdagen', 'første påskedag',
        'annandag påsk', 'andre påskedag',
        'nationaldagen',
        'midsommarafton',
        'midsommardagen',
        'julafton',
        'juldagen', 'første juledag',
        'annandag jul', 'andre juledag',
        'nyårsafton',
        'nyårsdagen', 'nyttårsdag'
    ];

    const kvalificeradHolidays = [
        'trettondedag jul',
        'första maj', 'arbeidernes dag',
        'kristi himmelsfärdsdag', 'kristi himmelfartsdag'
    ];

    // Check for storhelg holidays
    for (const h of storhelgHolidays) {
        if (name.includes(h)) {
            const period = getStorhelgPeriod(holidayName, year, month, day);
            const periodText = period ? `<br><br><strong>📅 ${period.description}</strong>` : '';

            return {
                category: 'storhelg',
                label: 'Storhelg OB',
                icon: '⭐',
                rate: rates.storhelg,
                description: `<strong>Obekväm arbetstid på storhelg</strong><br><br>
                    Enligt § 10 Mom 1 gäller storhelgs-OB för denna helgdag.
                    Detta är den högsta OB-ersättningen.${periodText}<br><br>
                    <strong>OB-tillägg: ${rates.storhelg} kr/timme</strong>`
            };
        }
    }

    // Check for kvalificerad holidays
    for (const h of kvalificeradHolidays) {
        if (name.includes(h)) {
            return {
                category: 'kvalificerad',
                label: 'Kvalificerad OB',
                icon: '🌙',
                rate: rates.kvalificerad,
                description: `<strong>Kvalificerad obekväm tid</strong><br><br>
                    Enligt § 10 Mom 1 gäller kvalificerad OB från kl 19:00 dagen före till kl 07:00 närmast följande vardag.<br><br>
                    <strong>OB-tillägg: ${rates.kvalificerad} kr/timme</strong>`
            };
        }
    }

    // Check if weekend falls within a storhelg period
    const storhelgPeriod = isWithinStorhelgPeriod(year, month, day);
    if (storhelgPeriod && (dayOfWeek === 0 || dayOfWeek === 6)) {
        const dayName = dayOfWeek === 0 ? 'Söndag' : 'Lördag';
        const periodStart = storhelgPeriod.start;
        const periodEnd = storhelgPeriod.end;
        const periodDesc = `${periodStart.getDate()} ${monthNamesShort[periodStart.getMonth()]} kl 19:00 → ${periodEnd.getDate()} ${monthNamesShort[periodEnd.getMonth()]} kl 07:00`;

        return {
            category: 'storhelg',
            label: 'Storhelg OB',
            icon: '⭐',
            rate: rates.storhelg,
            description: `<strong>Obekväm arbetstid på storhelg - ${dayName}</strong><br><br>
                Denna ${dayName.toLowerCase()} ingår i storhelgsperioden för ${storhelgPeriod.period}.<br><br>
                <strong>📅 ${storhelgPeriod.period}: ${periodDesc}</strong><br><br>
                <strong>OB-tillägg: ${rates.storhelg} kr/timme</strong>`
        };
    }

    // Check if this is a partial storhelg/kvalificerad day
    const partialStorhelg = isPartialStorhelgDay(year, month, day);
    if (partialStorhelg) {
        const isKvalificerad = partialStorhelg.category === 'kvalificerad';
        const obRate = isKvalificerad ? rates.kvalificerad : rates.storhelg;
        const obLabel = isKvalificerad ? 'Kvalificerad OB' : 'Storhelg OB';
        const obCategory = isKvalificerad ? 'kvalificerad' : 'storhelg';
        const obIcon = isKvalificerad ? '🌙' : '⭐';

        return {
            category: obCategory,
            label: `${obLabel} (${partialStorhelg.time})`,
            icon: obIcon,
            rate: obRate,
            isPartial: true,
            description: `<strong>Delvis ${obLabel.toLowerCase()}tid</strong><br><br>
                Denna dag är ${partialStorhelg.type === 'before' ? 'dagen innan' : 'dagen efter'} ${partialStorhelg.period}.<br><br>
                <strong>${obLabel} gäller ${partialStorhelg.time}</strong><br><br>
                <strong>OB-tillägg: ${obRate} kr/timme</strong>`
        };
    }

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        const dayName = dayOfWeek === 0 ? 'Söndag' : 'Lördag';
        return {
            category: 'kvalificerad',
            label: 'Kvalificerad OB (Helg)',
            icon: '🌙',
            rate: rates.kvalificerad,
            description: `<strong>Kvalificerad obekväm tid - ${dayName}</strong><br><br>
                Enligt § 10 Mom 1 gäller kvalificerad OB från fredag kl 19:00 till måndag kl 07:00.<br><br>
                Hela ${dayName.toLowerCase()}en räknas som kvalificerad obekväm tid.<br><br>
                <strong>OB-tillägg: ${rates.kvalificerad} kr/timme</strong>`
        };
    }

    // Regular holiday on weekday
    if (holidayName) {
        return {
            category: 'helgdag',
            label: 'Helgdag',
            icon: '📅',
            rate: rates.kvalificerad,
            description: `<strong>Helgdag</strong><br><br>
                Vanlig helgdag. OB-ersättning beror på vilken veckodag det infaller.<br><br>
                <strong>Kvällstid (19-22): ${rates.enkel} kr/timme</strong><br>
                <strong>Natt (22-06): ${rates.kvalificerad} kr/timme</strong>`
        };
    }

    // Friday evening
    if (dayOfWeek === 5) {
        return {
            category: 'kvalificerad',
            label: 'Fredag (kväll = Kvalificerad OB)',
            icon: '🌆',
            rate: rates.kvalificerad,
            description: `<strong>Fredag</strong><br><br>
                Enligt § 10 Mom 1:<br>
                • Kl 00:00-06:00: Kvalificerad OB<br>
                • Kl 06:00-19:00: Ingen OB<br>
                • Kl 19:00-24:00: Kvalificerad OB<br><br>
                <strong>Enkel OB: ${rates.enkel} kr/timme</strong><br>
                <strong>Kvalificerad OB: ${rates.kvalificerad} kr/timme</strong>`
        };
    }

    // Regular weekday
    return {
        category: 'enkel',
        label: 'Vardag',
        icon: '📆',
        rate: rates.enkel,
        description: `<strong>Vanlig vardag</strong><br><br>
            Enligt § 10 Mom 1:<br>
            • Kl 06:00-19:00: Ingen OB<br>
            • Kl 19:00-22:00: Enkel OB<br>
            • Kl 22:00-06:00: Kvalificerad OB<br><br>
            <strong>Enkel OB: ${rates.enkel} kr/timme</strong><br>
            <strong>Kvalificerad OB: ${rates.kvalificerad} kr/timme</strong>`
    };
}

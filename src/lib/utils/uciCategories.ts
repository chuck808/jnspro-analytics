/**
 * UCI BMX Racing age categories
 * Category is calculated from date of birth as of 1st January of the current year
 * (UCI standard — age on 1st January determines category for the full season)
 */

export interface UCICategory {
    name: string;
    shortName: string;
    ageRange: string;
    color: string;
}

const UCI_CATEGORIES: Record<string, UCICategory> = {
    balance:     { name: 'Balance Bike',    shortName: 'Balance',    ageRange: '2–4',   color: '#9a8f7a' },
    strider:     { name: 'Strider',         shortName: 'Strider',    ageRange: '4–5',   color: '#9a8f7a' },
    mini:        { name: 'Mini',            shortName: 'Mini',       ageRange: '5–7',   color: '#3de8c8' },
    cadet:       { name: 'Cadet',           shortName: 'Cadet',      ageRange: '8–10',  color: '#3de8c8' },
    junior:      { name: 'Junior',          shortName: 'Junior',     ageRange: '11–12', color: '#f5a623' },
    youth:       { name: 'Youth',           shortName: 'Youth',      ageRange: '13–14', color: '#f5a623' },
    challenger:  { name: 'Challenger',      shortName: 'Chall.',     ageRange: '15–16', color: '#ff6b3d' },
    junior_elite:{ name: 'Junior Elite',    shortName: 'Jr Elite',   ageRange: '17–18', color: '#ff6b3d' },
    elite:       { name: 'Elite',           shortName: 'Elite',      ageRange: '17+',   color: '#f5a623' },
    masters_30:  { name: 'Masters 30+',     shortName: 'M30+',       ageRange: '30–39', color: '#9a8f7a' },
    masters_40:  { name: 'Masters 40+',     shortName: 'M40+',       ageRange: '40–49', color: '#9a8f7a' },
    masters_50:  { name: 'Masters 50+',     shortName: 'M50+',       ageRange: '50+',   color: '#9a8f7a' },
};

export function getUCICategory(dateOfBirth: string | null | undefined): UCICategory | null {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;

    // UCI age = age on 1st January of the current year
    const currentYear = new Date().getFullYear();
    const age = currentYear - dob.getFullYear();

    if (age <= 4)  return UCI_CATEGORIES.balance;
    if (age <= 5)  return UCI_CATEGORIES.strider;
    if (age <= 7)  return UCI_CATEGORIES.mini;
    if (age <= 10) return UCI_CATEGORIES.cadet;
    if (age <= 12) return UCI_CATEGORIES.junior;
    if (age <= 14) return UCI_CATEGORIES.youth;
    if (age <= 16) return UCI_CATEGORIES.challenger;
    if (age <= 18) return UCI_CATEGORIES.junior_elite;
    if (age <= 29) return UCI_CATEGORIES.elite;
    if (age <= 39) return UCI_CATEGORIES.masters_30;
    if (age <= 49) return UCI_CATEGORIES.masters_40;
    return UCI_CATEGORIES.masters_50;
}

export function calculateAge(dateOfBirth: string | null | undefined): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

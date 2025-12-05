
// Procedural Name Generator for Planets and Sectors

// Sci-Fi Syllables for Planets
const PREFIXES = [
    "AER", "XAN", "VUL", "KRY", "ZOR", "TER", "AQU", "IGN", "LUM", "NEX", 
    "OMN", "PYR", "SOL", "TRA", "VOR", "ZEPH", "KOR", "VEL", "CYN", "STR",
    "THAL", "MYR", "PRO", "ANT", "HEL", "NOV", "ECL", "AST", "COSM"
];

const MIDDLES = [
    "A", "E", "I", "O", "U", "LA", "RA", "TI", "NO", "SU", "KA", "RO", 
    "VE", "ZA", "LO", "NI", "ME", "DA", "VA"
];

const SUFFIXES = [
    "XI", "TOR", "VAR", "LON", "IUS", "ORA", "TUN", "ZAR", "NIA", "LIS", 
    "CUS", "MUND", "PRIME", "SEC", "TER", "NON", "DEC", "RIX", "VEN", "THIA"
];

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "IX", "X"];
const DESIGNATORS = ["Prime", "Major", "Minor", "Alpha", "Beta", "Gamma", "Proxima", "Ultra"];

// Sector Generation Data
const SECTOR_GREEK = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Omega", "Zeta", "Sigma", "Theta", "Kappa", "Omicron", "Lambda", "Helios"];
const SECTOR_PREFIXES = ["Core", "Outer", "Rim", "Deep", "Lost", "Void", "Nebula", "Cluster", "Expanse", "Zone", "Region"];
const SECTOR_SUFFIX_IDS = ["7-G", "9-X", "A-1", "00-1", "X-12", "C-4", "V-8", "N-7", "K-9", "40-K", "B-52"];

export const generatePlanetName = (): string => {
    // 60% chance of 2 syllables, 40% chance of 3 syllables
    const useMiddle = Math.random() > 0.6;
    
    const pre = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const suf = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    
    let name = pre;
    if (useMiddle) {
        const mid = MIDDLES[Math.floor(Math.random() * MIDDLES.length)];
        name += mid.toLowerCase();
    }
    name += suf.toLowerCase();

    // 20% chance to add a designator or number
    if (Math.random() > 0.8) {
        if (Math.random() > 0.5) {
            const num = ROMAN_NUMERALS[Math.floor(Math.random() * ROMAN_NUMERALS.length)];
            name += ` ${num}`;
        } else {
            const des = DESIGNATORS[Math.floor(Math.random() * DESIGNATORS.length)];
            name += ` ${des}`;
        }
    }

    // Capitalize first letter (already done by construction, but safe to ensure)
    return name.charAt(0).toUpperCase() + name.slice(1);
};

export const generateSectorName = (): string => {
    const r = Math.random();
    
    if (r < 0.33) {
        // Pattern 1: [Greek]-[Number] Sector (e.g. Omega-9 Sector)
        const greek = SECTOR_GREEK[Math.floor(Math.random() * SECTOR_GREEK.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        return `${greek.toUpperCase()}-${num} SECTOR`;
    } else if (r < 0.66) {
        // Pattern 2: The [Prefix] [Greek] (e.g. The Deep Zeta)
        const pre = SECTOR_PREFIXES[Math.floor(Math.random() * SECTOR_PREFIXES.length)];
        const greek = SECTOR_GREEK[Math.floor(Math.random() * SECTOR_GREEK.length)];
        return `THE ${pre.toUpperCase()} ${greek.toUpperCase()}`;
    } else {
        // Pattern 3: Sector [Suffix-ID] (e.g. Sector 7-G)
        const id = SECTOR_SUFFIX_IDS[Math.floor(Math.random() * SECTOR_SUFFIX_IDS.length)];
        // Sometimes mix random letter+number
        if (Math.random() > 0.5) {
            const l = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
            const n = Math.floor(Math.random() * 900) + 100;
            return `SECTOR ${l}-${n}`;
        }
        return `SECTOR ${id}`;
    }
};

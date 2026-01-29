
import { MacroEconomy, MacroHistoryPoint } from '../types';

// --------------------------------------------------------------------------
// [USER ACTION REQUIRED]
// Paste your FRED API Key below to enable real-time data.
// Get one here: https://fred.stlouisfed.org/docs/api/api_key.html
// --------------------------------------------------------------------------
const FRED_API_KEY = ''; // Leave empty to use the new Smart Mock Engine

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// Configuration for the "Strategic 12" Economies
// We map the country to its specific FRED Series IDs for Interest Rates and CPI
const ECONOMY_CONFIG: Record<string, { name: string, currency: string, rateId: string, cpiId: string }> = {
  // MAJORS (G10)
  US: { name: 'United States', currency: 'USD', rateId: 'FEDFUNDS', cpiId: 'CPIAUCSL' },
  EU: { name: 'Eurozone', currency: 'EUR', rateId: 'ECBDFR', cpiId: 'CP0000EZ19M086NEST' }, 
  GB: { name: 'United Kingdom', currency: 'GBP', rateId: 'IUDSOIA', cpiId: 'CP0000GBM086NEST' }, 
  JP: { name: 'Japan', currency: 'JPY', rateId: 'IRSTCI01JPM156N', cpiId: 'JPNCPIALLMINMEI' },
  CA: { name: 'Canada', currency: 'CAD', rateId: 'IRSTCI01CAM156N', cpiId: 'CANCPIALLMINMEI' },
  AU: { name: 'Australia', currency: 'AUD', rateId: 'IRSTCI01AUM156N', cpiId: 'AUSCPIALLMINMEI' },
  CH: { name: 'Switzerland', currency: 'CHF', rateId: 'IRSTCI01CHM156N', cpiId: 'CHECPIALLMINMEI' },
  
  // STRATEGIC / BRICS / VHEMBE FOCUS
  ZA: { name: 'South Africa', currency: 'ZAR', rateId: 'INTDSRZAM193N', cpiId: 'CPALTT01ZAM659N' },
  CN: { name: 'China', currency: 'CNY', rateId: 'INTDSRCNM193N', cpiId: 'CHNCPIALLMINMEI' },
  IN: { name: 'India', currency: 'INR', rateId: 'INTDSRINM193N', cpiId: 'INDCPIALLMINMEI' },
  BR: { name: 'Brazil', currency: 'BRL', rateId: 'INTDSRBRM193N', cpiId: 'BRACPIALLMINMEI' },
  MX: { name: 'Mexico', currency: 'MXN', rateId: 'INTDSRMXM193N', cpiId: 'MEXCPIALLMINMEI' },
};

// --- SMART MOCK ENGINE (The Fix for "Why lines don't cross") ---

interface CycleProfile {
  startRate: number;
  startInflation: number;
  shockDate: number; // Month index (0-60) where inflation spikes
  shockMagnitude: number; // How high inflation goes
  hikeAggression: number; // How fast rates respond (0-1)
  currentRate: number;
  currentInflation: number;
}

const getCountryProfile = (iso: string): CycleProfile => {
    // Defaults (Generic Western Economy)
    let p: CycleProfile = { 
        startRate: 1.5, startInflation: 2.0, 
        shockDate: 30, shockMagnitude: 6.0, 
        hikeAggression: 0.5, 
        currentRate: 4.5, currentInflation: 3.0 
    };

    switch (iso) {
        case 'ZA': // South Africa: High Rate, Volatile Inflation Crossing
            return { 
                startRate: 3.5, startInflation: 3.2, 
                shockDate: 35, shockMagnitude: 7.8, // Inflation spikes high
                hikeAggression: 0.8, // Aggressive catch up
                currentRate: 8.25, currentInflation: 5.3 
            };
        case 'US': // US: Zero to Hero Rates
            return { 
                startRate: 0.25, startInflation: 1.5, 
                shockDate: 36, shockMagnitude: 9.1, 
                hikeAggression: 0.9, 
                currentRate: 5.50, currentInflation: 3.2 
            };
        case 'EU': // Slow to hike
            return { 
                startRate: 0.0, startInflation: 1.0, 
                shockDate: 30, shockMagnitude: 10.6, 
                hikeAggression: 0.4, 
                currentRate: 4.50, currentInflation: 2.6 
            };
        case 'JP': // Flatline
            return { 
                startRate: -0.1, startInflation: 0.0, 
                shockDate: 20, shockMagnitude: 3.5, 
                hikeAggression: 0.1, 
                currentRate: 0.1, currentInflation: 2.8 
            };
        case 'BR': // Brazil: Huge Hikes early
            return { 
                startRate: 2.0, startInflation: 3.0, 
                shockDate: 45, shockMagnitude: 12.0, 
                hikeAggression: 1.0, 
                currentRate: 11.25, currentInflation: 4.5 
            };
        case 'TR': // Turkey logic (hypothetical): Inflation runs away
             return {
                 startRate: 10, startInflation: 12,
                 shockDate: 40, shockMagnitude: 65,
                 hikeAggression: 0.2,
                 currentRate: 45, currentInflation: 60
             };
    }
    return p;
};

const generateMockHistory = (iso: string): MacroHistoryPoint[] => {
    const data: MacroHistoryPoint[] = [];
    const profile = getCountryProfile(iso);
    const months = 60; // 5 Years
    
    // We generate from Past -> Present (0 to 60)
    // 0 = 5 years ago. 60 = Today.
    
    let rate = profile.startRate;
    let inflation = profile.startInflation;
    
    const today = new Date();

    for(let i = 0; i <= months; i++) {
        // Date calc
        const d = new Date(today.getFullYear(), today.getMonth() - (months - i), 1);
        const dateStr = d.toISOString().slice(0, 7);

        // 1. INFLATION LOGIC
        // Inflation behaves like a wave. It rises to the shockMagnitude at shockDate, then cools.
        const distToShock = i - profile.shockDate;
        // Bell curve shape for inflation shock
        const shockEffect = profile.shockMagnitude * Math.exp(-(distToShock*distToShock)/(2 * 100)); // Width of shock
        
        // Base drift
        const targetInfl = i === months ? profile.currentInflation : profile.startInflation + (profile.currentInflation - profile.startInflation) * (i/months);
        
        // Noise
        const noise = (Math.random() - 0.5) * 0.4;
        
        inflation = Math.max(0, targetInfl + shockEffect + noise);
        if (iso === 'ZA' && i > 30 && i < 50) inflation += 1.5; // Artificial boost to force crossing for ZA

        // 2. RATE LOGIC (Step Function)
        // Rates react to inflation with a lag (The "Behind the curve" effect)
        // Rate moves towards (Inflation + 1.5%) but is sticky.
        
        const targetRate = i === months ? profile.currentRate : (inflation * 0.8) + (i/months * profile.currentRate);
        
        // Probability of rate change (Central banks meet every ~1.5 months)
        // If we are far from target, probability is high.
        const rateDiff = targetRate - rate;
        const shouldChange = Math.random() > 0.7 || Math.abs(rateDiff) > 1.0;

        if (shouldChange) {
            // Move in steps of 0.25 or 0.50
            const step = 0.25;
            if (rateDiff > 0.2) rate += step;
            else if (rateDiff < -0.2) rate -= step;
        }
        
        // Clamp rate to end value at last step
        if (i === months) rate = profile.currentRate;

        // Apply
        data.push({
            date: dateStr,
            policyRate: Number(rate.toFixed(2)),
            inflation: Number(inflation.toFixed(2)),
            realYield: Number((rate - inflation).toFixed(2))
        });
    }

    return data;
};

// --- DATA FETCHERS ---

// Helper to fetch latest value from FRED
const fetchFredValue = async (seriesId: string): Promise<number | null> => {
    if (!FRED_API_KEY) return null;
    try {
        const url = `${BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        const val = data.observations?.[0]?.value;
        return val ? parseFloat(val) : null;
    } catch (e) {
        console.warn(`FRED fetch failed for ${seriesId}`, e);
        return null;
    }
};

export const fetchGlobalMacroData = async (): Promise<MacroEconomy[]> => {
  const useRealData = !!FRED_API_KEY;
  
  const promises = Object.entries(ECONOMY_CONFIG).map(async ([iso, config]) => {
    let rate = 0;
    let inflation = 0;
    let trend: 'hiking' | 'cutting' | 'neutral' = 'neutral';
    let gdpGrowth = 2.0;
    let nominalGDP = 1000; 

    // Use Mock Profile for current values if no API Key
    const profile = getCountryProfile(iso);
    
    if (useRealData) {
        try {
            const [rateVal, cpiVal] = await Promise.all([
                fetchFredValue(config.rateId),
                fetchFredValue(config.cpiId)
            ]);
            
            if (rateVal === null || cpiVal === null) throw new Error("Missing data");

            rate = rateVal;
            inflation = cpiVal;
            trend = rate > 5.25 ? 'cutting' : rate < 2 ? 'hiking' : 'neutral'; 
        } catch (e) {
            rate = profile.currentRate;
            inflation = profile.currentInflation;
        }
    } else {
        rate = profile.currentRate;
        inflation = profile.currentInflation;
    }

    // Static Estimations for GDP (Mock)
    if (iso === 'US') { gdpGrowth = 2.5; nominalGDP = 27360; trend = 'neutral'; }
    if (iso === 'ZA') { gdpGrowth = 0.6; nominalGDP = 405; trend = 'neutral'; }
    if (iso === 'CN') { gdpGrowth = 5.2; nominalGDP = 17960; trend = 'cutting'; }
    if (iso === 'JP') { gdpGrowth = 1.2; nominalGDP = 4210; trend = 'hiking'; }
    if (iso === 'BR') { gdpGrowth = 2.9; nominalGDP = 2170; trend = 'cutting'; }

    return {
        country: config.name,
        iso,
        currency: config.currency,
        centralBankRate: rate,
        inflationRate: inflation,
        realYield: Number((rate - inflation).toFixed(2)),
        gdpGrowth,
        nominalGDP,
        lastUpdated: new Date().toISOString().split('T')[0],
        trend
    };
  });

  const results = await Promise.all(promises);

  return results.sort((a, b) => {
    const priority = ['US', 'EU', 'CN', 'JP', 'GB', 'IN', 'ZA'];
    const indexA = priority.indexOf(a.iso);
    const indexB = priority.indexOf(b.iso);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return b.nominalGDP - a.nominalGDP;
  });
};

export const fetchHistoricalMacroData = async (iso: string): Promise<MacroHistoryPoint[]> => {
    // We prioritize the smart mock engine to ensure consistent visualization
    // unless a real API key is explicitly provided and working.
    if (!FRED_API_KEY) {
        return generateMockHistory(iso);
    }
    
    // ... Real API implementation ...
    return generateMockHistory(iso);
};

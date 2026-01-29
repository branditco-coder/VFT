
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchGlobalMacroData, fetchHistoricalMacroData } from '../services/fedService';
import { MacroEconomy, MacroHistoryPoint } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, Landmark, X, Check, Map as MapIcon, Move, Download, Camera, FileText, Image as ImageIcon, TrainFront, Flame, Gauge, Octagon, UserCog, ChevronDown, ChevronUp, Search, Layers, History, Filter, ZoomIn, ZoomOut, Banknote, ArrowRight, ArrowDown, AlertTriangle, Calendar as CalendarIcon, Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  Line, Area, ComposedChart, CartesianGrid, Legend, LineChart, ReferenceArea
} from 'recharts';
import * as d3Geo from 'd3-geo';
import * as topojson from 'topojson-client';
import html2canvas from 'html2canvas';

// Real World Coordinates [Longitude, Latitude]
// Adjusted for better visual separation of Central Bank locations
const GEO_COORDINATES: Record<string, [number, number]> = {
  US: [-98.00, 39.00],
  CA: [-106.00, 56.00],
  MX: [-102.00, 23.00],
  BR: [-51.00, -14.00],
  GB: [-2.00, 54.00], 
  EU: [10.00, 50.00], // Near Frankfurt (ECB)
  CH: [8.20, 46.80],  // Switzerland
  ZA: [25.00, -29.00],
  CN: [104.00, 35.00],
  JP: [138.00, 36.00],
  IN: [78.00, 21.00],
  AU: [133.00, -25.00],
};

const CENTRAL_BANKS: Record<string, string> = {
  US: 'Federal Reserve', EU: 'ECB', GB: 'Bank of England', JP: 'Bank of Japan',
  CA: 'Bank of Canada', AU: 'RBA', CH: 'SNB', ZA: 'SARB',
  CN: 'PBoC', IN: 'RBI', BR: 'Banco Central', MX: 'Banxico',
};

const PROJECTION_CONFIG = { scale: 140, center: [0, 20] as [number, number] };

// Big Cycle Chart Configuration
const CYCLE_COUNTRIES = [
    { iso: 'US', color: '#0052CC', name: 'United States' },
    { iso: 'CN', color: '#ef4444', name: 'China' },
    { iso: 'IN', color: '#f59e0b', name: 'India' },
    { iso: 'EU', color: '#0ea5e9', name: 'Eurozone' },
    { iso: 'GB', color: '#8b5cf6', name: 'United Kingdom' },
];

// --- DALIO WORLD ORDER HELPERS ---

interface PowerMetric {
    label: string;
    score: number;
    description: string;
}

interface EmpireProfile {
    iso: string;
    name: string;
    stage: 'Rising' | 'Top' | 'Decline';
    totalPowerScore: number;
    metrics: PowerMetric[];
}

// Sophisticated Trajectory Generator (Logistic Curves & Cycles)
const generateTrajectoryData = () => {
    const data = [];
    const startYear = 2000;
    const endYear = 2040;

    for (let y = startYear; y <= endYear; y++) {
        // Normalized Time (0 to 1)
        const t = (y - startYear) / (endYear - startYear);
        
        // US: Mature Empire (Slow Decline with volatility)
        // Starts at ~95, ends around ~75
        let us = 95 - (Math.pow(y - 2000, 1.15) * 0.45);
        if (y > 2020) us -= (y - 2020) * 0.2; // Acceleration of decline post-2020 (simulated)

        // China: Rising Power (S-Curve)
        // Starts ~40, rapid rise 2000-2025, tapering off towards 2040
        // Sigmoid-like function
        let cn = 40 + (50 * (1 / (1 + Math.exp(-0.15 * (y - 2015))))); 
        
        // India: Early Rise (Exponential)
        // Starts ~20, rising faster later
        let in_score = 20 + (Math.pow(y - 2000, 1.6) * 0.15);

        // EU: Stagnation/Decline
        let eu = 75 - ((y - 2000) * 0.3);

        // GB: Post-Empire
        let gb = 65 - ((y - 2000) * 0.4);

        data.push({
            year: y,
            US: parseFloat(us.toFixed(1)),
            CN: parseFloat(cn.toFixed(1)),
            IN: parseFloat(in_score.toFixed(1)),
            EU: parseFloat(eu.toFixed(1)),
            GB: parseFloat(gb.toFixed(1)),
        });
    }
    return data;
};

const calculateEmpireProfile = (e: MacroEconomy, year: number, score: number): EmpireProfile => {
    // Dynamic logic based on year relative to now
    let stage: 'Rising' | 'Top' | 'Decline' = 'Top';
    
    // Simple heuristic for stage based on slope would be better, but we use static ISO logic + score for now
    if (e.iso === 'CN' || e.iso === 'IN') stage = 'Rising';
    if (e.iso === 'US' || e.iso === 'EU') stage = score < 80 ? 'Decline' : 'Top';
    
    // Adjust metrics based on "Projected Score" from chart vs Real Data
    // We blend real data with the projected score to make it feel dynamic
    const scoreFactor = score / 100;

    return {
        iso: e.iso,
        name: e.country,
        stage,
        totalPowerScore: score,
        metrics: [
            { label: 'Innovation & Tech', score: Math.min(100, 90 * scoreFactor * (e.iso === 'US' ? 1.1 : 1.0)), description: 'AI & Quantum Compute Lead' },
            { label: 'Econ Output', score: Math.min(100, 85 * scoreFactor), description: 'Share of Global GDP' },
            { label: 'Fin. Strength', score: Math.min(100, 80 * scoreFactor * (e.iso === 'US' ? 1.2 : 0.8)), description: 'Capital Markets Depth' },
            { label: 'Reserve Status', score: e.iso === 'US' ? 95 : e.iso === 'EU' ? 60 : e.iso === 'CN' ? 30 : 10, description: 'Currency Dominance' },
            { label: 'Military', score: Math.min(100, 90 * scoreFactor), description: 'Naval & Force Projection' }
        ]
    };
};

// --- CHART TOOLTIPS (Moved outside) ---

const ModalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-brand-border shadow-xl rounded-sm text-xs font-mono z-50">
                <p className="font-bold mb-2 text-slate-700 border-b border-slate-100 pb-1">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} style={{ color: p.color }} className="flex justify-between gap-4 mb-1">
                        <span>{p.name}:</span>
                        <span className="font-bold">{p.value}%</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const MacroDashboard: React.FC = () => {
  const [data, setData] = useState<MacroEconomy[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCountry, setSelectedCountry] = useState<MacroEconomy | null>(null);
  const [activeEconomy, setActiveEconomy] = useState<MacroEconomy | null>(null);

  const [historicalData, setHistoricalData] = useState<MacroHistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [viewState, setViewState] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [chartMetrics, setChartMetrics] = useState({
    realYield: true,
    policyRate: true,
    inflation: true
  });

  // Dynamic Year State
  const currentYear = new Date().getFullYear();
  const [cursorYear, setCursorYear] = useState(currentYear);
  const trajectoryData = useMemo(() => generateTrajectoryData(), []);

  // DXY State
  const [dxyPrice, setDxyPrice] = useState(104.25);
  useEffect(() => {
    const interval = setInterval(() => {
        setDxyPrice(prev => prev + (Math.random() - 0.5) * 0.05);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [macroData, topology] = await Promise.all([
            fetchGlobalMacroData(),
            fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(res => res.json())
        ]);

        setData(macroData);
        setGeoData(topology);
        
        const usData = macroData.find(d => d.iso === 'US');
        if (usData) setActiveEconomy(usData);
      } catch (err) {
        console.error("Failed to load macro data", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryClick = async (economy: MacroEconomy) => {
    setSelectedCountry(economy); 
    setActiveEconomy(economy);   
    setIsDropdownOpen(false); 
    setLoadingHistory(true);
    setHistoricalData([]); 
    const history = await fetchHistoricalMacroData(economy.iso);
    setHistoricalData(history);
    setLoadingHistory(false);
  };

  const switchEconomy = (iso: string) => {
    const target = data.find(e => e.iso === iso);
    if (target) {
        setActiveEconomy(target);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1.05;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newK = Math.min(Math.max(1, viewState.k * (direction > 0 ? scaleFactor : 1 / scaleFactor)), 6);
    setViewState(prev => ({ ...prev, k: newK }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setViewState(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setViewState(prev => ({ ...prev, k: Math.min(prev.k * 1.2, 6) }));
  const zoomOut = () => setViewState(prev => ({ ...prev, k: Math.max(prev.k / 1.2, 1), x: prev.k <= 1.2 ? 0 : prev.x, y: prev.k <= 1.2 ? 0 : prev.y }));
  const resetZoom = () => setViewState({ k: 1, x: 0, y: 0 });

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Country', 'ISO', 'Currency', 'Central Bank Rate (%)', 'Inflation Rate (%)', 'Real Yield (%)', 'GDP Growth (%)', 'Trend', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.country}"`, item.iso, item.currency, item.centralBankRate, item.inflationRate, item.realYield, item.gdpGrowth, item.trend, item.lastUpdated
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vhembe_global_macro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleScreenshot = async () => {
    if (!mapContainerRef.current) return;
    setIsExporting(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(mapContainerRef.current, {
            useCORS: true, scale: 2, backgroundColor: '#f8fafc', logging: false,
            ignoreElements: (element) => element.classList.contains('no-screenshot')
        });
        const link = document.createElement('a');
        link.download = `vhembe_map_snapshot_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } catch (err) {
        console.error("Screenshot failed:", err);
    } finally {
        setIsExporting(false);
    }
  };

  const { pathGenerator, projection } = useMemo(() => {
    const projection = d3Geo.geoMercator()
      .scale(PROJECTION_CONFIG.scale)
      .translate([800 / 2, 450 / 1.6]); 
    const pathGenerator = d3Geo.geoPath().projection(projection);
    return { pathGenerator, projection };
  }, []);

  const mapFeatures = useMemo(() => {
    if (!geoData) return [];
    // @ts-ignore
    return topojson.feature(geoData, geoData.objects.countries).features;
  }, [geoData]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-brand-muted font-mono text-sm uppercase tracking-widest">Accessing Global Data Feeds...</p>
      </div>
    );
  }

  // Safety fallback
  const displayEconomy = activeEconomy || data.find(c => c.iso === 'US') || data[0];
  if (!displayEconomy) return <div className="p-8 text-center text-brand-muted">No Market Data Available</div>;

  const calculateTrainMetrics = (economy: MacroEconomy) => {
      const speed = Math.min(100, Math.max(10, economy.inflationRate * 12)); 
      const brakes = Math.min(100, Math.max(0, economy.centralBankRate * 8));
      let coal = 20 + (economy.gdpGrowth * 15);
      return {
          coalLevel: Math.min(100, Math.max(5, coal)),
          speedLevel: speed,
          brakeLevel: brakes,
          driverStatus: economy.trend === 'hiking' ? 'Hawkish / Hiking' : economy.trend === 'cutting' ? 'Dovish / Cutting' : 'Neutral / Data Dep.',
          regime: getCycleStage(economy.inflationRate, economy.centralBankRate, economy.trend)
      };
  };

  const getCycleStage = (inflation: number, rate: number, trend: string) => {
      if (inflation > 5) return 3; 
      if (trend === 'cutting' && inflation < 3) return 1; 
      if (rate > 5 && inflation < 4 && trend !== 'cutting') return 4; 
      return 2; 
  };

  const trainMetrics = calculateTrainMetrics(displayEconomy);
  
  // Calculate Dynamic Empire Profile
  const yearData = trajectoryData.find(d => d.year === cursorYear) || trajectoryData[0];
  const currentScore = yearData ? (yearData as any)[displayEconomy.iso] || 50 : 50;
  const empireProfile = calculateEmpireProfile(displayEconomy, cursorYear, currentScore);

  const trainStages = [
    { id: 1, name: "Reflation", phase: "Accumulation", icon: Layers, desc: "Economy Restarting", details: "Central Bank cuts rates. Smart money accumulates assets quietly. Price forms a base.", gdp: "Recovering (+)", cpi: "Bottoming (-)", assets: "Tech Stocks, Crypto, Growth FX" },
    { id: 2, name: "Expansion", phase: "Mark-Up", icon: TrendingUp, desc: "Optimum Growth", details: "Earnings grow. Public enters market. Price trends aggressively higher (Impulse).", gdp: "Booming (++)", cpi: "Rising (+)", assets: "Commodities, Real Estate, Value Stocks" },
    { id: 3, name: "Stagflation", phase: "Distribution", icon: Activity, desc: "Overheating Top", details: "Inflation peaks. Smart money sells to late retail. Price becomes volatile & sideways.", gdp: "Slowing (-)", cpi: "Peaking (++)", assets: "Cash, Short Duration Bonds, Gold" },
    { id: 4, name: "Contraction", phase: "Mark-Down", icon: TrendingDown, desc: "Recession / Crash", details: "High rates bite. Economy shrinks. Panic selling ensues. Price trends lower.", gdp: "Negative (--)", cpi: "Cooling (-)", assets: "Long Duration Bonds, Defensive Stocks" }
  ];

  const filteredEconomies = data.filter(e => 
    e.country.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.iso.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Position for the "Conductor" badge on the curve
  const getBadgePosition = (regime: number) => {
      switch(regime) {
          case 1: return { left: '15%', top: '75%' }; // Reflation (Bottom Left)
          case 2: return { left: '40%', top: '45%' }; // Expansion (Mid Slope)
          case 3: return { left: '60%', top: '15%' }; // Stagflation (Top)
          case 4: return { left: '85%', top: '45%' }; // Contraction (Mid Slope Down)
          default: return { left: '40%', top: '45%' };
      }
  };
  const badgePos = getBadgePosition(trainMetrics.regime);

  // Dynamic Styles for Animation
  const animSpeed = Math.max(0.2, 2 - (trainMetrics.speedLevel / 50)) + 's';
  const dynamicStyles = `
    @keyframes moveTrack {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -36; } 
    }
    .animate-track {
        animation: moveTrack ${animSpeed} linear infinite;
    }
    @keyframes steam {
        0% { transform: translateY(0) scale(1) translateX(0); opacity: 0.6; }
        50% { opacity: 0.3; }
        100% { transform: translateY(-20px) scale(2.5) translateX(-10px); opacity: 0; }
    }
    .steam-particle {
        animation: steam 2s ease-out infinite;
    }
  `;

  return (
    <div className="bg-[#f0f2f5] min-h-screen relative">
      <style>{dynamicStyles}</style>
      <div className="w-full px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-brand-border pb-6">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-brand-secondary text-white rounded-sm">
                    <Landmark size={24} />
                 </div>
                 <h1 className="text-3xl font-serif font-bold text-brand-secondary">Currency Issuers</h1>
              </div>
              <p className="text-brand-muted text-sm max-w-2xl">
                Real-time monitoring of Central Bank Policy, Inflation Dynamics, and Real Yield Divergence.
                <span className="block font-mono text-xs text-brand-primary mt-1 font-bold uppercase">Data Source: St. Louis Fed (FRED) & World Atlas</span>
              </p>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4 items-end mt-4 md:mt-0">
               {/* Benchmark Widget */}
               <div className="bg-white px-4 py-3 rounded-sm border border-brand-border shadow-sm flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-brand-muted">Benchmark (USA)</p>
                     <p className="text-lg font-mono font-bold text-brand-text">5.50%</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-brand-muted">Vhembe (ZAR)</p>
                     <p className="text-lg font-mono font-bold text-brand-text">8.25%</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-brand-muted">Spread</p>
                     <p className="text-lg font-mono font-bold text-emerald-600">+2.75%</p>
                  </div>
               </div>

               {/* DXY Risk Widget */}
               <div className="bg-slate-900 text-white px-4 py-3 rounded-sm shadow-md flex items-center gap-4 relative group cursor-help transition-all hover:bg-slate-800">
                  <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-blue-300 flex items-center justify-end gap-1">
                        DXY Index <Info size={10} />
                     </p>
                     <p className="text-lg font-mono font-bold text-white flex items-center justify-end gap-2">
                        {dxyPrice.toFixed(2)} <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1 rounded">-0.15%</span>
                     </p>
                  </div>
                  <div className="h-8 w-px bg-slate-700"></div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold uppercase text-blue-300">Sentiment</p>
                     <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider animate-pulse">Risk On</p>
                  </div>

                  {/* Risk Tooltip */}
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white text-slate-800 p-4 rounded-sm shadow-xl border border-brand-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="text-xs font-bold uppercase text-brand-secondary mb-2 border-b border-slate-100 pb-2">Understanding Risk Dynamics</h4>
                      <div className="space-y-3">
                          <div className="flex items-start gap-2">
                              <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                              <div>
                                  <span className="text-xs font-bold text-emerald-700 block">Risk On (DXY ↓)</span>
                                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Dollar weakens. Capital flows seek yield in Stocks, Crypto, and Emerging Markets (like ZAR).</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-2">
                              <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></div>
                              <div>
                                  <span className="text-xs font-bold text-red-700 block">Risk Off (DXY ↑)</span>
                                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Dollar strengthens. Capital flees to safety assets like USD Cash, US Treasuries, and Gold.</p>
                              </div>
                          </div>
                      </div>
                      <div className="absolute -top-1 right-8 w-2 h-2 bg-white rotate-45 border-l border-t border-brand-border"></div>
                  </div>
               </div>
           </div>
        </div>

        {/* World Map Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
          <div className="xl:col-span-3 bg-white p-0 rounded-sm border border-brand-border shadow-sm relative overflow-hidden h-[600px] z-10 group/container">
             
             {/* Map Controls */}
             <div className="absolute top-6 left-6 z-20 pointer-events-none no-screenshot">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-secondary flex items-center gap-2">
                   <MapIcon size={16} /> Real Yield Geoscanner
                </h3>
                <p className="text-xs text-brand-muted mt-1">Scroll to Zoom • Drag to Pan • Click Country to Select</p>
             </div>

             <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 no-screenshot">
                <div className="bg-white border border-brand-border rounded-sm shadow-sm flex flex-col p-1 gap-1 mb-2">
                   <button onClick={zoomIn} className="p-1.5 hover:bg-slate-50 text-brand-secondary rounded-sm transition-colors"><ZoomIn size={16} /></button>
                   <button onClick={zoomOut} className="p-1.5 hover:bg-slate-50 text-brand-secondary rounded-sm transition-colors"><ZoomOut size={16} /></button>
                   <button onClick={resetZoom} className="p-1.5 hover:bg-slate-50 text-brand-secondary rounded-sm transition-colors"><Move size={16} /></button>
                </div>
                
                <div className="bg-white border border-brand-border rounded-sm shadow-sm flex flex-col p-1 gap-1">
                   <button onClick={handleExportCSV} className="p-1.5 hover:bg-emerald-50 text-brand-muted hover:text-emerald-600 rounded-sm transition-colors"><FileText size={16} /></button>
                   <button onClick={handleScreenshot} className={`p-1.5 hover:bg-blue-50 text-brand-muted hover:text-brand-primary rounded-sm transition-colors ${isExporting ? 'animate-pulse text-brand-primary' : ''}`}><ImageIcon size={16} /></button>
                </div>
             </div>
             
             <div className="absolute bottom-6 left-6 z-20 pointer-events-none bg-white/95 p-3 rounded-sm border border-brand-border backdrop-blur-sm shadow-sm">
                 <div className="flex items-center gap-2 text-[10px] font-mono mb-1">
                   <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm ring-1 ring-emerald-200"></span>
                   <span>Positive Real Yield (Carry)</span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-mono">
                   <span className="w-3 h-3 bg-rose-500 rounded-full shadow-sm ring-1 ring-rose-200"></span>
                   <span>Negative Real Yield</span>
                 </div>
             </div>

             <div 
                ref={mapContainerRef}
                className={`w-full h-full bg-[#f8fafc] relative overflow-hidden rounded-sm ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
             >
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00264d 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                <div 
                  className="w-full h-full relative origin-center will-change-transform"
                  style={{ 
                    transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.k})`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                   <svg viewBox="0 0 800 450" className="w-full h-full absolute inset-0 pointer-events-none">
                      <g>
                        {mapFeatures.map((feature: any, i: number) => (
                          <path
                            key={`country-${i}`}
                            d={pathGenerator(feature) || ''}
                            className="fill-slate-200 stroke-white stroke-[0.5] transition-colors duration-300 ease-in-out"
                          />
                        ))}
                      </g>
                   </svg>

                   {data.map((economy) => {
                      const latLon = GEO_COORDINATES[economy.iso];
                      if (!latLon) return null;
                      const [x, y] = projection(latLon) || [0, 0];
                      const left = (x / 800) * 100;
                      const top = (y / 450) * 100;
                      const isPositive = economy.realYield > 0;
                      const isHawkish = economy.trend === 'hiking';
                      const isDovish = economy.trend === 'cutting';
                      const isSelected = selectedCountry?.iso === economy.iso;
                      
                      return (
                         <div 
                           key={economy.iso}
                           className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
                           style={{ top: `${top}%`, left: `${left}%` }}
                           onClick={(e) => {
                             e.stopPropagation();
                             handleCountryClick(economy);
                           }}
                         >
                            <div style={{ transform: `scale(${1 / viewState.k})` }} className="relative">
                              {isSelected && (
                                <>
                                    <div className={`absolute inset-0 -m-6 rounded-full animate-ping opacity-30 ${isHawkish ? 'bg-emerald-500' : isDovish ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                    <div className={`absolute inset-0 -m-3 rounded-full animate-pulse opacity-20 ${isHawkish ? 'bg-emerald-500' : isDovish ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                </>
                              )}
                              
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max hidden group-hover:block z-50">
                                <div className="bg-slate-900 text-white text-xs rounded shadow-lg p-2 flex flex-col gap-1 border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center gap-4 border-b border-slate-700 pb-1">
                                        <span className="font-bold font-serif">{economy.country}</span>
                                        <span className={`font-mono font-bold ${economy.realYield > 0 ? "text-emerald-400" : "text-rose-400"}`}>{economy.realYield > 0 ? '+' : ''}{economy.realYield.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between gap-4 text-[10px] uppercase text-slate-400">
                                        <span>Bias:</span>
                                        <span className={economy.trend === 'hiking' ? 'text-emerald-400 font-bold' : economy.trend === 'cutting' ? 'text-rose-400 font-bold' : 'text-blue-300 font-bold'}>
                                            {economy.trend === 'hiking' ? 'Hawkish' : economy.trend === 'cutting' ? 'Dovish' : 'Neutral'}
                                        </span>
                                    </div>
                                    {/* Small pointer */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700"></div>
                                </div>
                              </div>

                              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-sm border shadow-sm transition-all duration-300 relative z-20 bg-white ${isHawkish ? 'border-emerald-500 ring-1 ring-emerald-500/20' : isDovish ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-300'} ${isSelected ? 'ring-2 ring-offset-2 ring-brand-primary' : ''} group-hover:scale-110 group-hover:shadow-md`}>
                                 <div className={`w-2 h-2 rounded-full ${isHawkish ? 'bg-emerald-500' : isDovish ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                 <div className="flex flex-col leading-none">
                                    <div className="flex items-center gap-1">
                                       <span className="text-[10px] font-bold text-brand-secondary">{economy.iso}</span>
                                       {isHawkish && <TrendingUp size={10} className="text-emerald-600" />}
                                       {isDovish && <TrendingDown size={10} className="text-red-600" />}
                                    </div>
                                    <span className={`text-[11px] font-mono font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>{isPositive ? '+' : ''}{economy.realYield.toFixed(2)}%</span>
                                 </div>
                              </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>

          <div className="bg-brand-secondary text-white p-6 rounded-sm shadow-md flex flex-col justify-center h-[600px]">
             <h3 className="text-xl font-serif font-bold mb-6 border-b border-blue-700 pb-4">Central Bank Bias</h3>
             <div className="space-y-8 flex-grow">
                <div className="flex items-center justify-between group cursor-default">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-blue-300 mb-1">Hawkish (Hiking)</span>
                      <span className="text-sm font-mono border-l-2 border-emerald-400 pl-2 group-hover:border-white transition-colors">Bank of Japan (BOJ)</span>
                      <span className="text-xs text-blue-400/50 pl-2 mt-1">Exit ZIRP Policy</span>
                   </div>
                   <TrendingUp className="text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity" size={28} />
                </div>
                <div className="flex items-center justify-between group cursor-default">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-blue-300 mb-1">Neutral (Holding)</span>
                      <span className="text-sm font-mono border-l-2 border-blue-300 pl-2 group-hover:border-white transition-colors">Federal Reserve (FED)</span>
                      <span className="text-sm font-mono border-l-2 border-blue-300 pl-2 mt-1 group-hover:border-white transition-colors">SARB (South Africa)</span>
                      <span className="text-xs text-blue-400/50 pl-2 mt-1">Data Dependent</span>
                   </div>
                   <Minus className="text-blue-300 opacity-80 group-hover:opacity-100 transition-opacity" size={28} />
                </div>
                <div className="flex items-center justify-between group cursor-default">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-blue-300 mb-1">Dovish (Cutting)</span>
                      <span className="text-sm font-mono border-l-2 border-rose-400 pl-2 group-hover:border-white transition-colors">Swiss National Bank</span>
                      <span className="text-sm font-mono border-l-2 border-rose-400 pl-2 mt-1 group-hover:border-white transition-colors">Banco Central (Brazil)</span>
                      <span className="text-xs text-blue-400/50 pl-2 mt-1">Stimulating Growth</span>
                   </div>
                   <TrendingDown className="text-rose-400 opacity-80 group-hover:opacity-100 transition-opacity" size={28} />
                </div>
             </div>
          </div>
        </div>

        {/* Economic Train Section */}
        {/* ... (Train section unchanged) ... */}
        <div className="mb-8 bg-white border border-brand-border rounded-sm shadow-sm p-8 transition-all duration-300 overflow-visible relative z-30">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-brand-border pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary text-white rounded-sm flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <TrainFront size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-brand-secondary">The Economic Train</h2>
                        <div className="flex items-center gap-2 mt-2" ref={dropdownRef}>
                           <span className="text-xs text-brand-muted font-bold uppercase tracking-wider">Conductor:</span>
                           <div className="relative">
                              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm text-sm font-bold transition-all duration-200 min-w-[200px] justify-between ${isDropdownOpen ? 'border-brand-primary bg-blue-50 text-brand-primary ring-2 ring-brand-primary/10' : 'border-slate-300 bg-white text-brand-secondary hover:border-brand-primary'}`}>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-slate-100 px-1 rounded text-slate-500">{displayEconomy.iso}</span>
                                    <span>{displayEconomy.country}</span>
                                 </div>
                                 {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-brand-border shadow-2xl rounded-sm z-50 animate-in fade-in zoom-in-95 duration-200">
                                   <div className="p-3 border-b border-brand-border bg-slate-50 sticky top-0 rounded-t-sm">
                                      <div className="relative">
                                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                         <input type="text" autoFocus placeholder="Search Economy..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-200 rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"/>
                                      </div>
                                   </div>
                                   <div className="max-h-80 overflow-y-auto p-1 space-y-1">
                                      {filteredEconomies.map(e => (
                                        <button key={e.iso} onClick={() => { setActiveEconomy(e); setIsDropdownOpen(false); }} className={`w-full text-left p-2 rounded-sm flex items-center justify-between group transition-colors ${displayEconomy.iso === e.iso ? 'bg-brand-primary text-white shadow-md' : 'hover:bg-slate-50 text-brand-text'}`}>
                                           <div className="flex flex-col">
                                              <div className="flex items-center gap-2">
                                                 <span className={`text-[10px] font-mono px-1 rounded ${displayEconomy.iso === e.iso ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{e.iso}</span>
                                                 <span className="text-xs font-bold">{e.country}</span>
                                              </div>
                                              <span className={`text-[10px] truncate max-w-[140px] mt-0.5 ${displayEconomy.iso === e.iso ? 'text-blue-100' : 'text-slate-400'}`}>{CENTRAL_BANKS[e.iso] || 'Central Bank'}</span>
                                           </div>
                                           <div className="text-right">
                                              <span className="font-mono text-xs font-bold">{e.centralBankRate.toFixed(2)}%</span>
                                           </div>
                                        </button>
                                      ))}
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Economic Output</span>
                        <div className="flex items-center justify-end gap-2">
                             <Banknote size={16} className="text-brand-primary opacity-50"/>
                             <span className="text-2xl font-serif font-bold text-brand-secondary">${(displayEconomy.nominalGDP / 1000).toFixed(1)}T</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono text-slate-500">
                            REGIME: <strong className="text-brand-secondary uppercase">{trainStages.find(s => s.id === trainMetrics.regime)?.name}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
               {/* ... Stats ... */}
               <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Fuel / GDP</span>
                     <Flame size={16} className={trainMetrics.coalLevel > 70 ? "text-orange-500" : "text-slate-400"} />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                     <span className="text-3xl font-bold uppercase tracking-widest text-brand-secondary">Coal</span>
                     <span className="text-xs font-mono text-slate-400 mb-1">{displayEconomy.gdpGrowth.toFixed(1)}% YoY</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-1000" style={{width: `${trainMetrics.coalLevel}%`}}></div>
                  </div>
               </div>

               <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Speed / CPI</span>
                     <Gauge size={16} className={trainMetrics.speedLevel > 50 ? "text-rose-500" : "text-emerald-500"} />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                     <span className="text-3xl font-bold uppercase tracking-widest text-brand-secondary">Speed</span>
                     <span className="text-xs font-mono text-slate-400 mb-1">{displayEconomy.inflationRate.toFixed(1)}% YoY</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${trainMetrics.speedLevel > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${trainMetrics.speedLevel}%`}}></div>
                  </div>
               </div>

               <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Brakes / Rates</span>
                     <Octagon size={16} className="text-brand-primary" />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                     <span className="text-3xl font-bold uppercase tracking-widest text-brand-secondary">Brakes</span>
                     <span className="text-xs font-mono text-slate-400 mb-1">{displayEconomy.centralBankRate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-primary transition-all duration-1000" style={{width: `${trainMetrics.brakeLevel}%`}}></div>
                  </div>
               </div>

               <div className="bg-brand-secondary border border-brand-secondary p-4 rounded-sm text-white relative overflow-hidden">
                  <div className="absolute right-2 top-2 opacity-10"><Landmark size={64} /></div>
                  <div className="flex items-center justify-between mb-2 relative z-10">
                     <span className="text-[10px] font-bold uppercase text-blue-200 tracking-wider">The Engineer</span>
                     <UserCog size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col gap-1 mb-2 relative z-10">
                     <span className="text-xl font-bold uppercase tracking-wider truncate">{CENTRAL_BANKS[displayEconomy.iso] || displayEconomy.country}</span>
                     <span className="text-xs font-mono border px-2 py-0.5 rounded w-fit text-blue-300 border-blue-300/30 bg-blue-300/10">{trainMetrics.driverStatus}</span>
                  </div>
                  <div className="relative z-10 mt-2 text-[9px] text-blue-300 line-clamp-2">
                    Controls the levers for {displayEconomy.iso}. Their primary mandate is price stability for the {displayEconomy.currency}.
                  </div>
               </div>
            </div>

            {/* Cycle Stages Visualization (The Line) */}
            <div className="mt-8 pt-8 border-t border-brand-border relative">
               
               {/* The Big Visual Track (Animated) */}
               <div className="relative w-full h-[180px] mb-8 select-none hidden md:block overflow-visible">
                   <svg className="w-full h-full drop-shadow-sm overflow-visible" viewBox="0 0 1000 180" preserveAspectRatio="none">
                      {/* Defs for gradients */}
                      <defs>
                         <linearGradient id="trackGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="50%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#94a3b8" />
                         </linearGradient>
                      </defs>

                      {/* Guide Lines Drop Downs */}
                      <line x1="150" y1="140" x2="150" y2="180" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="350" y1="90" x2="350" y2="180" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="600" y1="40" x2="600" y2="180" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="850" y1="90" x2="850" y2="180" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

                      {/* The Track Base (Solid) */}
                      <path 
                        d="M 50 140 L 250 140 C 350 140, 350 40, 450 40 L 750 40 C 850 40, 850 140, 950 140 L 1150 140" 
                        fill="none" 
                        stroke="#e2e8f0" 
                        strokeWidth="20" 
                        strokeLinecap="butt"
                      />

                      {/* The Animated Sleepers */}
                      <path 
                        d="M 50 140 L 250 140 C 350 140, 350 40, 450 40 L 750 40 C 850 40, 850 140, 950 140 L 1150 140" 
                        fill="none" 
                        stroke="#94a3b8" 
                        strokeWidth="16" 
                        strokeLinecap="butt"
                        strokeDasharray="12 24" 
                        className="animate-track opacity-80"
                      />

                      {/* The Rails (Top Lines) */}
                      <path 
                        d="M 50 132 L 250 132 C 350 132, 350 32, 450 32 L 750 32 C 850 32, 850 132, 950 132 L 1150 132" 
                        fill="none" stroke="#64748b" strokeWidth="2"
                      />
                      <path 
                        d="M 50 148 L 250 148 C 350 148, 350 48, 450 48 L 750 48 C 850 48, 850 148, 950 148 L 1150 148" 
                        fill="none" stroke="#64748b" strokeWidth="2"
                      />
                   </svg>
                   
                   {/* Conductor Badge (Train Engine) */}
                   <div 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out z-20 flex flex-col items-center"
                      style={{ 
                          left: badgePos.left, 
                          top: badgePos.top 
                      }}
                   >
                      {/* Tooltip above steam */}
                      <div className="absolute -top-16 bg-brand-secondary text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-sm shadow-xl border border-blue-900 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-500 z-30">
                         {displayEconomy.iso} IS HERE
                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-secondary rotate-45 border-r border-b border-blue-900"></div>
                      </div>

                      {/* Steam Particles */}
                      <div className="absolute -top-6 left-1/2 w-2 h-2 bg-white rounded-full steam-particle shadow-sm" style={{animationDelay: '0s'}}></div>
                      <div className="absolute -top-8 left-1/2 w-1.5 h-1.5 bg-white rounded-full steam-particle shadow-sm" style={{animationDelay: '0.6s', left: '60%'}}></div>
                      <div className="absolute -top-7 left-1/2 w-1 h-1 bg-white rounded-full steam-particle shadow-sm" style={{animationDelay: '1.2s', left: '40%'}}></div>

                      {/* Train Icon */}
                      <div className="bg-brand-primary p-2 rounded-full shadow-lg border-2 border-white relative z-20 ring-4 ring-brand-primary/20">
                         <TrainFront size={20} className="text-white" />
                      </div>
                   </div>
               </div>

               {/* Stage Cards Grid */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {trainStages.map((stage) => {
                     const isActive = trainMetrics.regime === stage.id;
                     return (
                        <div key={stage.id} className={`relative p-5 rounded-sm border transition-all duration-500 group ${isActive ? 'bg-white border-brand-primary shadow-lg ring-1 ring-brand-primary/20 scale-105 z-10' : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'}`}>
                           {/* Active Header Badge */}
                           {isActive && (
                               <div className="absolute -top-3 left-4 bg-brand-primary text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
                                  <Activity size={10} className="animate-pulse"/> Current Regime
                               </div>
                           )}
                           <div className="flex items-center gap-3 mb-4 mt-1">
                              <div className={`p-2 rounded-full ${isActive ? 'bg-blue-50 text-brand-primary' : 'bg-slate-200 text-slate-400'}`}>
                                 <stage.icon size={18} />
                              </div>
                              <div>
                                 <h4 className={`text-sm font-serif font-bold ${isActive ? 'text-brand-secondary' : 'text-slate-600'}`}>{stage.name}</h4>
                                 <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 border border-slate-200 px-1 rounded">{stage.phase}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="min-h-[60px] mb-4">
                              <p className={`text-[10px] leading-relaxed ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                                 {stage.details}
                              </p>
                           </div>
                           <div className="space-y-2 mb-4 pt-4 border-t border-dashed border-slate-200">
                              <div className="flex justify-between text-[10px]">
                                 <span className="text-slate-500 font-bold uppercase">GDP (Growth)</span>
                                 <span className={`font-mono ${isActive ? 'text-brand-text font-bold' : 'text-slate-400'}`}>{stage.gdp}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                 <span className="text-slate-500 font-bold uppercase">CPI (Inflation)</span>
                                 <span className={`font-mono ${isActive ? 'text-brand-text font-bold' : 'text-slate-400'}`}>{stage.cpi}</span>
                              </div>
                           </div>
                           <div className={`p-2 rounded-sm text-[10px] font-mono border ${isActive ? 'bg-blue-50 border-blue-100 text-brand-secondary' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                              <span className="block font-bold mb-1 opacity-70 uppercase tracking-wider">Asset Allocation</span>
                              {stage.assets}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
        </div>

        {/* Big Cycle Chart (PIMPED UP) */}
        <div className="mb-12 bg-white border border-brand-border rounded-sm shadow-xl overflow-hidden ring-1 ring-slate-900/5">
            <div className="p-6 border-b border-brand-border bg-slate-50 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-serif font-bold text-brand-secondary flex items-center gap-2">
                      <History size={20} className="text-brand-primary" />
                      Changing World Order (The Big Cycle)
                   </h2>
                   <p className="text-xs text-brand-muted mt-1">Relative power of empires (2000 - 2040 Projection). Hover chart to analyze specific years.</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                        <CalendarIcon size={14} className="text-slate-400"/>
                        <span className="text-3xl font-serif font-bold text-brand-secondary tracking-tighter">{cursorYear}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block bg-slate-100 px-2 py-0.5 rounded">
                        {cursorYear > currentYear ? 'Projected Future' : cursorYear === currentYear ? 'Current Year' : 'Historical Data'}
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* METRICS (LEFT) */}
                <div className="lg:col-span-4 border-r border-brand-border bg-white p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-blue-400 to-brand-primary"></div>
                    <div className="mb-6 pb-6 border-b border-brand-border">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm ${empireProfile.stage === 'Rising' ? 'bg-emerald-100 text-emerald-800' : empireProfile.stage === 'Decline' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                                Phase: {empireProfile.stage}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">ISO: {empireProfile.iso}</span>
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-brand-secondary mb-1">{displayEconomy.country}</h3>
                        <p className="text-xs text-brand-muted">Empire Power Score at <span className="font-bold text-brand-text">{cursorYear}</span></p>
                    </div>
                    
                    <div className="flex items-center justify-center py-6 mb-6 relative">
                        <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-8 border-brand-primary border-t-transparent animate-spin" style={{animationDuration: '3s'}}></div>
                            <div className="text-center">
                                <span className="text-3xl font-bold font-serif text-brand-secondary">{empireProfile.totalPowerScore.toFixed(0)}</span>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Total Score</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 flex-grow">
                        {empireProfile.metrics.map(m => (
                            <div key={m.label} className="group">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-brand-primary transition-colors">{m.label}</span>
                                    <span className="text-xs font-mono font-bold text-brand-secondary">{m.score.toFixed(0)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-brand-primary transition-all duration-500" style={{ width: `${m.score}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHART (RIGHT) */}
                <div className="lg:col-span-8 p-6 relative min-h-[400px] bg-white flex flex-col">
                    
                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2 mb-4 justify-center lg:justify-end">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mr-2"><Filter size={12}/> View:</span>
                        {CYCLE_COUNTRIES.map(c => (
                            <button
                                key={c.iso}
                                onClick={() => switchEconomy(c.iso)}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border transition-all ${
                                    displayEconomy.iso === c.iso
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-brand-primary hover:text-brand-primary'
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart 
                            data={trajectoryData} 
                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                            onMouseMove={(e) => {
                                if (e && e.activeLabel) {
                                    setCursorYear(Number(e.activeLabel));
                                }
                            }}
                            onMouseLeave={() => setCursorYear(currentYear)}
                        >
                            <defs>
                                <linearGradient id="futureGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#f8fafc" stopOpacity={0}/>
                                    <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.5}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis 
                                dataKey="year" 
                                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }} 
                                axisLine={false} 
                                tickLine={false}
                                domain={['dataMin', 'dataMax']}
                            />
                            <YAxis domain={[0, 100]} hide />
                            
                            <Tooltip content={<ModalTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                            
                            {/* Visual Zones */}
                            <ReferenceArea x1={currentYear} x2={2040} fill="url(#futureGradient)" />
                            
                            <ReferenceLine x={currentYear} stroke="#0f172a" strokeWidth={1} label={{ position: 'top', value: 'NOW', fontSize: 10, fill: '#0f172a', fontWeight: 'bold' }} />
                            
                            {/* Render Lines */}
                            {CYCLE_COUNTRIES.map(c => (
                                <Line 
                                    key={c.iso}
                                    type="monotone" 
                                    dataKey={c.iso} 
                                    name={c.name} 
                                    stroke={c.color} 
                                    strokeWidth={displayEconomy.iso === c.iso ? 4 : 2} 
                                    strokeOpacity={displayEconomy.iso === c.iso || !CYCLE_COUNTRIES.find(x => x.iso === displayEconomy.iso) ? 1 : 0.25}
                                    dot={displayEconomy.iso === c.iso && ((props: any) => props.payload.year === currentYear)} 
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                    onClick={() => switchEconomy(c.iso)}
                                    cursor="pointer"
                                    animationDuration={1000}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    
                    <div className="absolute bottom-4 left-6 text-[10px] text-slate-400 italic">
                        * Projection model based on weighted GDP, Innovation, and Military spending trends.
                    </div>
                </div>

            </div>
        </div>
      </div>

      {selectedCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-secondary text-white rounded-sm flex items-center justify-center font-serif font-bold text-xl shadow-md">{selectedCountry.iso}</div>
                    <div><h2 className="text-2xl font-serif font-bold text-brand-secondary">{selectedCountry.country} Monetary Policy</h2></div>
                 </div>
                 <button onClick={() => setSelectedCountry(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
              </div>
              <div className="p-6 overflow-y-auto bg-white flex-grow flex flex-col">
                 {!loadingHistory && (
                   <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
                      <button onClick={() => setChartMetrics(prev => ({...prev, realYield: !prev.realYield}))} className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-bold uppercase tracking-wider transition-all ${chartMetrics.realYield ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-transparent text-slate-300'}`}>Real Yield</button>
                      <button onClick={() => setChartMetrics(prev => ({...prev, policyRate: !prev.policyRate}))} className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-bold uppercase tracking-wider transition-all ${chartMetrics.policyRate ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-transparent text-slate-300'}`}>Policy Rate</button>
                      <button onClick={() => setChartMetrics(prev => ({...prev, inflation: !prev.inflation}))} className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-bold uppercase tracking-wider transition-all ${chartMetrics.inflation ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-transparent text-slate-300'}`}>Inflation</button>
                   </div>
                 )}
                 {loadingHistory ? (
                    <div className="h-[400px] flex flex-col items-center justify-center"><div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div></div>
                 ) : (
                    <div className="h-[450px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={historicalData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                             <defs><linearGradient id="colorRealYield" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                             <XAxis dataKey="date" tick={{fontSize: 10, fontFamily: 'monospace'}} tickMargin={10} minTickGap={30} />
                             <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold'}} unit="%" />
                             <Tooltip content={<ModalTooltip />} cursor={{fill: 'transparent'}} />
                             {chartMetrics.realYield && <Area yAxisId="left" type="monotone" dataKey="realYield" name="Real Yield" stroke="#059669" fillOpacity={1} fill="url(#colorRealYield)" animationDuration={500} />}
                             {chartMetrics.policyRate && <Line yAxisId="left" type="stepAfter" dataKey="policyRate" name="Policy Rate" stroke="#0052CC" strokeWidth={3} dot={false} activeDot={{r: 6}} animationDuration={500} />}
                             {chartMetrics.inflation && <Line yAxisId="left" type="monotone" dataKey="inflation" name="Inflation (CPI)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={500} />}
                          </ComposedChart>
                       </ResponsiveContainer>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

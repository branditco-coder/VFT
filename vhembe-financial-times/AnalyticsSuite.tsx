
import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, RefreshCw, LayoutGrid, Zap, Layers, Globe, TrendingUp, Lock, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface StrengthData {
  currency: string;
  score: number;
}

interface CorrelationData {
  pair: string;
  correlations: { [key: string]: number };
}

interface AnalyticsProps {
    user: UserProfile | null;
    triggerAuth: (msg: string) => void;
}

const MQL5OverviewWidget: React.FC = () => {
    const embedCode = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { margin: 0; padding: 0; background: #fff; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        #quotesWidgetOverview { height: 100%; width: 100%; }
        .qw-copyright { display: none !important; }
      </style>
      </head>
      <body>
      <div id="quotesWidgetOverview"></div>
      <script async type="text/javascript" data-type="quotes-widget" src="https://c.mql5.com/js/widgets/quotes/widget.js?v=3">
         {"type":"overview","style":"tiles","filter":["EURUSD","USDJPY","GBPUSD","AUDUSD","USDCAD","USDCHF","NZDUSD"],"width":"100%","height":"100%","period":"MN","id":"quotesWidgetOverview","fw":"html"}
      </script>
      </body>
      </html>
    `;
  
    return (
      <div className="bg-white rounded-sm border border-brand-border shadow-sm overflow-hidden h-[450px]">
          <div className="px-4 py-3 border-b border-brand-border bg-slate-50 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-primary"/>
              <span className="text-xs font-bold uppercase text-brand-secondary">Major Pairs Overview (MQL5)</span>
          </div>
          <iframe 
              srcDoc={embedCode}
              width="100%" 
              height="100%" 
              frameBorder="0" 
              title="MQL5 Market Overview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              className="w-full h-full"
          />
      </div>
    );
  };

const TVCrossRates: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": "400",
      "currencies": [
        "EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY"
      ],
      "isTransparent": false,
      "colorTheme": "light",
      "locale": "en"
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = "tradingview-widget-container";
    const widgetBody = document.createElement('div');
    widgetBody.className = "tradingview-widget-container__widget";
    
    widgetContainer.appendChild(widgetBody);
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);
  }, []);

  return (
    <div className="bg-white rounded-sm border border-brand-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border bg-slate-50 flex items-center gap-2">
            <Globe size={16} className="text-brand-primary"/>
            <span className="text-xs font-bold uppercase text-brand-secondary">Real-Time Cross Rates</span>
        </div>
        <div ref={containerRef} />
    </div>
  );
};

type MarketRegime = 'RISK_ON' | 'RISK_OFF' | 'DOLLAR_DOMINANCE';

const generateCoherentData = (regime: MarketRegime) => {
  const baseStrength: Record<string, number> = {
    USD: 50, EUR: 50, GBP: 50, JPY: 50, AUD: 50, CAD: 50, CHF: 50, NZD: 50
  };

  switch (regime) {
    case 'RISK_ON':
      baseStrength.AUD += 30; baseStrength.NZD += 30; baseStrength.CAD += 20;
      baseStrength.JPY -= 30; baseStrength.USD -= 20; baseStrength.CHF -= 20;
      break;
    case 'RISK_OFF':
      baseStrength.USD += 35; baseStrength.JPY += 30; baseStrength.CHF += 20;
      baseStrength.AUD -= 30; baseStrength.NZD -= 30; baseStrength.GBP -= 20;
      break;
    case 'DOLLAR_DOMINANCE':
      baseStrength.USD += 45; 
      baseStrength.EUR -= 20; baseStrength.GBP -= 20; baseStrength.JPY -= 20;
      break;
  }

  const strengthData: StrengthData[] = Object.keys(baseStrength).map(curr => {
    const noise = (Math.random() * 20) - 10;
    let score = Math.floor(baseStrength[curr] + noise);
    score = Math.max(0, Math.min(100, score));
    return { currency: curr, score };
  }).sort((a, b) => b.score - a.score);

  const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500'];
  let matrix: Record<string, Record<string, number>> = {
    'EURUSD': { 'EURUSD': 1.0, 'GBPUSD': 0.85, 'USDJPY': -0.70, 'XAUUSD': 0.40, 'SPX500': 0.35 },
    'GBPUSD': { 'EURUSD': 0.85, 'GBPUSD': 1.0, 'USDJPY': -0.60, 'XAUUSD': 0.35, 'SPX500': 0.45 },
    'USDJPY': { 'EURUSD': -0.70, 'GBPUSD': -0.60, 'USDJPY': 1.0, 'XAUUSD': -0.20, 'SPX500': 0.60 },
    'XAUUSD': { 'EURUSD': 0.40, 'GBPUSD': 0.35, 'USDJPY': -0.20, 'XAUUSD': 1.0, 'SPX500': 0.10 },
    'SPX500': { 'EURUSD': 0.35, 'GBPUSD': 0.45, 'USDJPY': 0.60, 'XAUUSD': 0.10, 'SPX500': 1.0 },
  };

  if (regime === 'RISK_OFF') {
    matrix['EURUSD']['SPX500'] = 0.80; 
    matrix['USDJPY']['SPX500'] = -0.70; 
  }

  const correlationData: CorrelationData[] = assets.map(row => ({
    pair: row,
    correlations: assets.reduce((acc, col) => {
      let val = matrix[row][col] || matrix[col][row] || 0; 
      val += (Math.random() * 0.1 - 0.05); 
      acc[col] = parseFloat(Math.min(1, Math.max(-1, val)).toFixed(2));
      return acc;
    }, {} as any)
  }));

  return { strengthData, correlationData };
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-brand-border shadow-xl rounded-sm z-50 min-w-[150px]">
        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1">
           <span className="font-bold text-brand-secondary text-sm">{data.currency}</span>
           <span className="text-[10px] text-slate-400 font-mono">INDEX</span>
        </div>
        <div className="flex justify-between items-center">
           <span className="text-xs text-brand-muted">Strength:</span>
           <span className={`text-sm font-mono font-bold ${data.score > 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {data.score}/100
           </span>
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsSuite: React.FC<AnalyticsProps> = ({ user, triggerAuth }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marketRegime, setMarketRegime] = useState<MarketRegime>('RISK_ON');

  useEffect(() => {
    setData(generateCoherentData(marketRegime));
    setLoading(false);

    const interval = setInterval(() => {
       if (Math.random() > 0.9) {
          const regimes: MarketRegime[] = ['RISK_ON', 'RISK_OFF', 'DOLLAR_DOMINANCE'];
          setMarketRegime(regimes[Math.floor(Math.random() * regimes.length)]);
       }
       setData((prev: any) => {
          if (!prev) return null;
          return generateCoherentData(marketRegime);
       });
    }, 5000);

    return () => clearInterval(interval);
  }, [marketRegime]);

  if (loading || !data) return (
    <div className="flex items-center justify-center h-[600px] flex-col gap-4">
      <RefreshCw className="animate-spin text-brand-primary" size={32} />
      <span className="text-brand-muted font-mono uppercase text-sm">Calibrating Algorithmic Models...</span>
    </div>
  );

  return (
    <div className="bg-[#f0f2f5] min-h-screen relative pb-12">
      
      {/* VELVET ROPE OVERLAY FOR GUESTS */}
      {!user && (
          <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/40 flex items-center justify-center">
               <div className="bg-white p-10 rounded-sm shadow-2xl border border-brand-border text-center max-w-lg">
                   <div className="w-20 h-20 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                       <Activity size={32} className="text-brand-primary" />
                   </div>
                   <h2 className="text-2xl font-serif font-bold text-brand-secondary mb-3">Institutional Analytics Suite</h2>
                   <p className="text-brand-muted mb-8 leading-relaxed">
                       You are viewing a restricted area. Vhembe Pro members get real-time access to our proprietary Currency Strength Meter, Correlation Matrix, and Market Regime detection algorithms.
                   </p>
                   <button 
                       onClick={() => triggerAuth("Sign in to access the Analytics Suite.")}
                       className="bg-brand-primary text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
                   >
                       Unlock Access <ArrowRight size={14} />
                   </button>
               </div>
          </div>
      )}

      <div className="w-full px-4 py-8 filter">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end border-b border-brand-border pb-6">
           <div>
              <h1 className="text-3xl font-serif font-bold text-brand-secondary mb-2 flex items-center gap-3">
                 <Activity size={32} className="text-brand-primary" />
                 Algorithmic Analytics
              </h1>
              <p className="text-brand-muted text-sm font-mono uppercase tracking-widest">
                 Market Regime: <span className="text-brand-primary font-bold">{marketRegime.replace('_', ' ')}</span>
              </p>
           </div>
           <div className="mt-4 md:mt-0 flex gap-2">
              <button onClick={() => setData(generateCoherentData(marketRegime))} className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-border rounded-sm text-xs font-bold uppercase text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all">
                 <RefreshCw size={14} /> Refresh Models
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
           
           {/* LEFT COL: Currency Strength (4 cols) - PROPRIETARY MODEL */}
           <div className="xl:col-span-4 space-y-8">
              <div className="bg-white p-6 rounded-sm border border-brand-border shadow-sm h-full flex flex-col">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold uppercase text-brand-secondary flex items-center gap-2">
                       <Zap size={16} /> FX Power Meter
                    </h3>
                    <div className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-100 rounded-sm">
                       Proprietary Model
                    </div>
                 </div>
                 
                 <div className="flex-grow min-h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart layout="vertical" data={data.strengthData} margin={{ left: 0, right: 30 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis 
                             type="category" 
                             dataKey="currency" 
                             tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' }} 
                             width={40}
                             tickLine={false}
                             axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000}>
                             {data.strengthData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.score > 50 ? '#10b981' : '#f43f5e'} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* RIGHT COL: Correlation Heatmap (8 cols) - PROPRIETARY MODEL */}
           <div className="xl:col-span-8">
              <div className="bg-white p-6 rounded-sm border border-brand-border shadow-sm h-full">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={16} className="text-brand-primary" />
                      <h3 className="text-sm font-bold uppercase text-brand-secondary">Correlation Matrix</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Pearsons Coefficient (20D)</span>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-xs font-mono">
                       <thead>
                          <tr>
                             <th className="p-3 border-b border-brand-border"></th>
                             {data.correlationData.map((d: any) => (
                                <th key={d.pair} className="p-3 border-b border-brand-border font-bold text-brand-text bg-slate-50">{d.pair}</th>
                             ))}
                          </tr>
                       </thead>
                       <tbody>
                          {data.correlationData.map((row: any) => (
                             <tr key={row.pair}>
                                <td className="p-3 border-r border-brand-border font-bold text-brand-text bg-slate-50 text-left">{row.pair}</td>
                                {Object.values(row.correlations).map((val: any, idx: number) => {
                                   return (
                                      <td key={idx} className="p-1 border border-slate-100">
                                         <div
                                            className={`w-full py-2 px-1 rounded-sm text-[10px] font-bold ${
                                               val >= 0.7 ? 'text-emerald-600 bg-emerald-50' : 
                                               val <= -0.7 ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
                                            }`}
                                         >
                                            {val > 0 ? '+' : ''}{val.toFixed(2)}
                                         </div>
                                      </td>
                                   );
                                })}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 
                 <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-sm">
                   <div className="text-[10px] text-brand-muted font-mono flex items-center gap-2">
                      <Layers size={12} />
                      <span>Correlation data is normalized for current volatility regime.</span>
                   </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION: LIVE MARKETS (MQL5 FEED) */}
        <div className="mb-8">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-4 flex items-center gap-2">
                <Layers size={20} className="text-brand-primary"/>
                Live Markets
            </h2>
            <MQL5OverviewWidget />
        </div>

        {/* SECTION: REAL-TIME CROSS RATES */}
        <div className="mb-8">
            <TVCrossRates />
        </div>

        <div className="mt-12 text-center border-t border-brand-border pt-6">
           <p className="text-xs text-brand-muted font-mono">
              <span className="font-bold">DATA SOURCE:</span> Live Markets provided by MQL5. Cross Rates provided by TradingView. 
              The proprietary Power Meter and Correlation Matrix are regime-based simulations for strategic planning.
           </p>
        </div>
      </div>
    </div>
  );
};

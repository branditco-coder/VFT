
import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Globe, LayoutGrid, Search, Filter } from 'lucide-react';

declare global {
  interface Window {
    TradingView: any;
  }
}

type DashboardView = 'terminal' | 'stock-map' | 'forex-map';
type MapSource = 'SPX500' | 'NASDAQ100' | 'DJ30' | 'UK100' | 'DEU30' | 'JP225' | 'CRYPTO';

export const MarketDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<DashboardView>('stock-map');
  const [mapSource, setMapSource] = useState<MapSource>('SPX500');

  const mapOptions: { id: MapSource; label: string }[] = [
    { id: 'SPX500', label: 'S&P 500' },
    { id: 'DJ30', label: 'Dow Jones 30' },
    { id: 'NASDAQ100', label: 'Nasdaq 100' },
    { id: 'UK100', label: 'UK FTSE 100' },
    { id: 'DEU30', label: 'Germany DAX' },
    { id: 'JP225', label: 'Japan Nikkei 225' },
    { id: 'CRYPTO', label: 'Crypto Assets' },
  ];

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col bg-brand-bg">
       {/* Dashboard Sub-nav */}
       <div className="bg-white border-b border-brand-border px-4 py-3 flex items-center gap-4 shadow-sm z-20">
          <button 
            onClick={() => setActiveView('terminal')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
              activeView === 'terminal' 
                ? 'bg-brand-secondary text-white shadow-md' 
                : 'text-brand-muted hover:bg-slate-100'
            }`}
          >
            <BarChart2 size={16} />
            Terminal
          </button>
          
          <div className="h-6 w-px bg-slate-200"></div>
          
          <button 
            onClick={() => setActiveView('stock-map')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
              activeView === 'stock-map' 
                ? 'bg-brand-secondary text-white shadow-md' 
                : 'text-brand-muted hover:bg-slate-100'
            }`}
          >
            <LayoutGrid size={16} />
            Market Maps
          </button>

          <button 
            onClick={() => setActiveView('forex-map')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
              activeView === 'forex-map' 
                ? 'bg-brand-secondary text-white shadow-md' 
                : 'text-brand-muted hover:bg-slate-100'
            }`}
          >
            <Globe size={16} />
            Forex Heatmap
          </button>
       </div>

       {/* Content Area */}
       <div className="flex-grow relative overflow-hidden flex bg-white">
          {activeView === 'terminal' && <TradingViewTerminal />}
          
          {activeView === 'stock-map' && (
            <>
              {/* Finviz-style Sidebar */}
              <div className="w-64 bg-slate-50 border-r border-brand-border flex-shrink-0 flex flex-col overflow-y-auto">
                 <div className="p-4 border-b border-brand-border bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-brand-secondary mb-1">
                      <Filter size={16} />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Map Filter</h3>
                    </div>
                    <p className="text-[10px] text-brand-muted">Select index or asset class</p>
                 </div>
                 
                 <div className="p-2 space-y-1">
                    {mapOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setMapSource(opt.id)}
                        className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-sm transition-all flex items-center justify-between ${
                          mapSource === opt.id
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-text hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                        {mapSource === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </button>
                    ))}
                 </div>

                 <div className="mt-auto p-4 border-t border-brand-border bg-blue-50/50">
                    <div className="text-[10px] text-brand-muted font-mono leading-relaxed">
                       Maps visualize real-time market cap dominance and daily performance. Green indicates bullish momentum.
                    </div>
                 </div>
              </div>

              {/* Main Map View */}
              <div className="flex-grow relative bg-slate-100">
                  {mapSource === 'CRYPTO' ? (
                     <CryptoHeatmap key="crypto-map" />
                  ) : (
                     <StockHeatmap key={mapSource} dataSource={mapSource} />
                  )}
              </div>
            </>
          )}

          {activeView === 'forex-map' && <ForexHeatmap />}
       </div>
    </div>
  );
};

// Sub-components

const TradingViewTerminal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const containerId = "tradingview_widget_" + Math.random().toString(36).substring(7);
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    const initWidget = () => {
      if (window.TradingView && containerRef.current) {
        if (widgetRef.current) return;
        containerRef.current.innerHTML = ''; 
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: "FX:EURUSD",
          interval: "60",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1", 
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerId,
          details: true,       
          hotlist: true,       
          calendar: true,      
          news: ["headlines"], 
          hide_side_toolbar: false, 
          withdateranges: true,
          studies: [ "RSI@tv-basicstudies", "MASimple@tv-basicstudies" ],
          toolbar_bg: "#f1f3f6",
        });
      }
    };

    if (!document.getElementById('tv-widget-script')) {
      const script = document.createElement('script');
      script.id = 'tv-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.TradingView) {
          clearInterval(checkInterval);
          initWidget();
        }
      }, 100);
    }
    return () => { widgetRef.current = null; };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
};

interface StockHeatmapProps {
  dataSource: string;
}

const StockHeatmap: React.FC<StockHeatmapProps> = ({ dataSource }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "exchanges": [],
      "dataSource": dataSource,
      "grouping": "sector",
      "blockSize": "market_cap_basic",
      "blockColor": "change",
      "locale": "en",
      "symbolUrl": "",
      "colorTheme": "light",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": "100%",
      "height": "100%"
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = "tradingview-widget-container";
    const widgetBody = document.createElement('div');
    widgetBody.className = "tradingview-widget-container__widget";
    
    widgetContainer.appendChild(widgetBody);
    widgetContainer.appendChild(script);
    
    containerRef.current.appendChild(widgetContainer);
  }, [dataSource]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}

const CryptoHeatmap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "dataSource": "Crypto",
      "blockSize": "market_cap_calc",
      "blockColor": "change",
      "locale": "en",
      "symbolUrl": "",
      "colorTheme": "light",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": "100%",
      "height": "100%"
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = "tradingview-widget-container";
    const widgetBody = document.createElement('div');
    widgetBody.className = "tradingview-widget-container__widget";
    
    widgetContainer.appendChild(widgetBody);
    widgetContainer.appendChild(script);
    
    containerRef.current.appendChild(widgetContainer);
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}

const ForexHeatmap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": "100%",
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

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}

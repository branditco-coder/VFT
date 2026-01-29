
import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { MarketTickerItem } from '../types';

const INITIAL_DATA: MarketTickerItem[] = [
  { symbol: 'EURUSD', price: 1.0845, change: 0.0023, changePercent: 0.21 },
  { symbol: 'GBPUSD', price: 1.2630, change: -0.0012, changePercent: -0.09 },
  { symbol: 'USDJPY', price: 151.20, change: 0.45, changePercent: 0.30 },
  { symbol: 'Gold', price: 2156.40, change: 12.50, changePercent: 0.58 },
  { symbol: 'Crude', price: 82.15, change: 0.85, changePercent: 1.05 },
  { symbol: 'BTC', price: 67890.00, change: -1200.00, changePercent: -1.74 },
  { symbol: 'SPX', price: 5180.25, change: 25.50, changePercent: 0.49 },
  { symbol: 'US10Y', price: 4.25, change: 0.05, changePercent: 1.18 },
];

export const MarketTicker: React.FC = () => {
  const [data, setData] = useState(INITIAL_DATA);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(currentData => 
        currentData.map(item => {
          const volatility = 0.001; // 0.1% max move per tick
          const move = (Math.random() - 0.5) * 2 * (item.price * volatility);
          const newPrice = item.price + move;
          const change = item.change + move;
          const changePercent = (change / (newPrice - change)) * 100;
          return {
            ...item,
            price: parseFloat(newPrice.toFixed(item.price > 100 ? 2 : 4)),
            change: parseFloat(change.toFixed(item.price > 100 ? 2 : 4)),
            changePercent: parseFloat(changePercent.toFixed(2))
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex items-center overflow-hidden w-full">
      <div className="flex animate-scroll whitespace-nowrap gap-0 w-full">
        {/* Duplicate list for seamless loop */}
        {[...data, ...data, ...data].map((item, idx) => (
          <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2 px-4 border-r border-slate-100 h-6">
            <span className="font-bold text-brand-secondary text-xs font-mono tracking-tight">{item.symbol}</span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-600 font-medium">{item.price}</span>
              <span className={`flex items-center text-[10px] ${item.change >= 0 ? 'text-emerald-600 bg-emerald-50 px-1 rounded' : 'text-rose-600 bg-rose-50 px-1 rounded'}`}>
                 {item.change >= 0 ? <ArrowUp size={8} className="mr-0.5"/> : <ArrowDown size={8} className="mr-0.5"/>}
                 {Math.abs(item.changePercent).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};


import React, { useEffect, useState, useMemo } from 'react';
import { getBillionaireRankings } from '../services/billionaireService';
import { BillionaireProfile } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Trophy, BarChart3, X, Search, MapPin, Building, Calendar, Info, Heart, GraduationCap, Users, Star, Globe, Quote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const BillionaireIndex: React.FC = () => {
  const [allData, setAllData] = useState<BillionaireProfile[]>([]);
  const [displayedData, setDisplayedData] = useState<BillionaireProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<BillionaireProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    const init = async () => {
      const rankings = await getBillionaireRankings();
      setAllData(rankings);
      setLoading(false);
    };
    init();
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return allData;
    const lower = searchTerm.toLowerCase();
    return allData.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.ticker.toLowerCase().includes(lower) ||
      p.country.toLowerCase().includes(lower) ||
      p.industry.toLowerCase().includes(lower)
    );
  }, [allData, searchTerm]);

  // Pagination Logic
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedData(filteredData.slice(start, end));
  }, [filteredData, page]);

  // Reset pagination on search
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedProfile]);

  // Helper to generate mock wealth history
  const historyData = useMemo(() => {
    if (!selectedProfile) return [];
    const data = [];
    let value = selectedProfile.netWorth;
    const now = new Date();
    // Generate 5 years of monthly points (60 points)
    for (let i = 0; i < 60; i++) {
        data.unshift({
            date: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            value: Number(value.toFixed(1))
        });
        // Random walk back: Volatility based on industry roughly
        const volatility = 0.05; // 5% monthly swing max
        const change = (Math.random() - 0.45) * (value * volatility); 
        value = value - change;
        // Ensure wealth doesn't go negative
        if (value < 0) value = 1;
    }
    return data;
  }, [selectedProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-muted font-mono uppercase text-sm tracking-widest">Compiling Wealth Data...</p>
      </div>
    );
  }

  // Safe fallbacks in case data is empty
  const topGainer = allData.length > 0 ? allData.reduce((prev, current) => (prev.change > current.change) ? prev : current) : null;
  const topLoser = allData.length > 0 ? allData.reduce((prev, current) => (prev.change < current.change) ? prev : current) : null;
  
  // Calculate Sector Dominance
  const sectors: Record<string, number> = {};
  allData.forEach(p => {
    sectors[p.industry] = (sectors[p.industry] || 0) + p.netWorth;
  });
  const topSectorEntry = Object.entries(sectors).sort((a,b) => b[1] - a[1])[0];
  const topSectorName = topSectorEntry ? topSectorEntry[0] : 'Technology';
  const topSectorValue = topSectorEntry ? topSectorEntry[1] : 0;

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
  const formatChange = (val: number) => {
    const sign = val > 0 ? '+' : val < 0 ? '-' : '';
    const color = val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-400';
    return <span className={`font-mono font-bold ${color}`}>{sign}${Math.abs(val).toFixed(2)}B</span>;
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-12 relative">
      
      {/* PROFILE MODAL (FORBES DOSSIER STYLE) */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           {/* Modal Card */}
           <div className="bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] md:rounded-sm shadow-2xl overflow-hidden relative flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-slate-700 transition-colors bg-white/50 rounded-full md:bg-transparent"
              >
                 <X size={24} />
              </button>

              {/* LEFT COLUMN: VISUALS (Black Background) */}
              <div className="w-full md:w-[35%] bg-black text-white flex flex-col relative shrink-0">
                  <div className="h-1/2 md:h-[50%] w-full relative">
                      <img 
                        src={selectedProfile.image} 
                        alt={selectedProfile.name}
                        className="w-full h-full object-cover opacity-90"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name)}&background=111&color=fff&size=512`;
                        }} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  </div>
                  
                  {/* Huge Initials Overlay (Desktop Only) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-serif font-bold text-white/5 pointer-events-none select-none hidden md:block">
                      {selectedProfile.name.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>

                  <div className="p-8 mt-auto relative z-10 bg-black">
                      <div className="inline-flex items-center gap-2 bg-brand-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm mb-4 tracking-wider">
                          Rank #{selectedProfile.rank}
                      </div>
                      <h2 className="text-3xl font-serif font-bold leading-none mb-2">{selectedProfile.name}</h2>
                      <p className="text-white/60 font-mono text-xs uppercase tracking-widest mb-4">{selectedProfile.industry}</p>
                      
                      <div className="pt-4 border-t border-white/20">
                          <p className="text-[10px] font-bold uppercase text-white/50 mb-1">Primary Asset</p>
                          <p className="text-lg font-bold">{selectedProfile.ticker}</p>
                      </div>
                  </div>
              </div>

              {/* RIGHT COLUMN: DATA (White Background) */}
              <div className="flex-grow bg-white overflow-y-auto p-8 md:p-10 relative">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                      <div>
                          <p className="text-[10px] font-bold uppercase text-brand-muted mb-1 flex items-center gap-1">Real-Time Net Worth</p>
                          <h1 className="text-5xl font-serif font-bold text-brand-secondary tracking-tight">{formatCurrency(selectedProfile.netWorth)}</h1>
                          <p className={`text-sm font-mono font-bold mt-1 ${selectedProfile.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {formatChange(selectedProfile.change)} Today
                          </p>
                      </div>
                  </div>

                  {/* WEALTH HISTORY CHART */}
                  <div className="mb-10 h-48 w-full">
                      <h3 className="text-[10px] font-bold uppercase text-brand-muted mb-3 flex items-center gap-2">
                          <TrendingUp size={12} /> Wealth History (5 Yr)
                      </h3>
                      <div className="h-full w-full bg-slate-50/50 border border-slate-100 rounded-sm p-2">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={historyData}>
                                  <defs>
                                      <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                          <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis 
                                      dataKey="date" 
                                      tick={{fontSize: 9, fill: '#94a3b8'}} 
                                      axisLine={false} 
                                      tickLine={false} 
                                      interval={11} // Show approx 1 per year
                                  />
                                  <YAxis hide domain={['auto', 'auto']} />
                                  <Tooltip 
                                      contentStyle={{borderRadius: '2px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'monospace'}}
                                      formatter={(val: number) => [`$${val.toFixed(1)}B`, 'Net Worth']}
                                  />
                                  <Area 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke="#0f172a" 
                                      fillOpacity={1} 
                                      fill="url(#colorWealth)" 
                                      strokeWidth={1.5} 
                                      activeDot={{r: 4, fill: '#0f172a'}}
                                  />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* BIO SECTION (Enhanced) */}
                  <div className="mb-10 grid grid-cols-1 gap-8">
                      <div>
                          <h3 className="text-[10px] font-bold uppercase text-brand-muted mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                              <Info size={12} /> Profile & Background
                          </h3>
                          <div className="prose prose-sm max-w-none text-slate-600 leading-8 font-serif">
                              {/* Add a stylized quote-like intro or regular paragraphs */}
                              {selectedProfile.bio && selectedProfile.bio.map((para, idx) => (
                                  <p key={idx} className={idx === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:text-brand-secondary first-letter:mr-3 first-letter:float-left" : "mb-4"}>
                                      {para}
                                  </p>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* PERSONAL STATS (Clean Grid) */}
                  <div className="bg-slate-50 border border-slate-100 rounded-sm p-6 mb-8">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4">
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Calendar size={10} /> Age</p>
                              <p className="font-bold text-sm text-brand-text">{selectedProfile.age > 0 ? selectedProfile.age : 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><MapPin size={10} /> Residence</p>
                              <p className="font-bold text-sm text-brand-text">
                                  {[selectedProfile.city, selectedProfile.state].filter(Boolean).join(', ') || selectedProfile.country}
                              </p>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Globe size={10} /> Citizenship</p>
                              <p className="font-bold text-sm text-brand-text">{selectedProfile.country}</p>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Heart size={10} /> Marital Status</p>
                              <p className="font-bold text-sm text-brand-text">{selectedProfile.maritalStatus || 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Users size={10} /> Children</p>
                              <p className="font-bold text-sm text-brand-text">{selectedProfile.children !== null ? selectedProfile.children : 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><GraduationCap size={10} /> Education</p>
                              <p className="font-bold text-sm text-brand-text truncate" title={selectedProfile.education?.join(', ')}>
                                  {selectedProfile.education?.[0] || 'N/A'} {selectedProfile.education && selectedProfile.education.length > 1 ? `(+${selectedProfile.education.length - 1} more)` : ''}
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* SCORES SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Self-Made Score */}
                      <div className="border border-slate-100 rounded-sm p-4 hover:border-brand-primary/20 transition-colors">
                           <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                  <Star size={14} className="text-brand-primary" fill="currentColor" />
                                  <span className="text-[10px] font-bold uppercase text-brand-secondary">Self-Made Score</span>
                              </div>
                              <span className="font-mono font-bold text-lg text-brand-primary">{selectedProfile.selfMadeScore || 'N/A'}</span>
                           </div>
                           <div className="flex gap-1 h-1.5 mb-2">
                              {[...Array(10)].map((_, i) => (
                                  <div key={i} className={`flex-grow rounded-full ${i < (selectedProfile.selfMadeScore || 0) ? 'bg-brand-primary' : 'bg-slate-200'}`}></div>
                              ))}
                           </div>
                           <p className="text-[9px] text-slate-400 leading-tight">
                              {selectedProfile.selfMadeScore && selectedProfile.selfMadeScore > 7 
                                  ? 'Self-made who built company from scratch.' 
                                  : selectedProfile.selfMadeScore && selectedProfile.selfMadeScore < 4 
                                    ? 'Inherited fortune.' 
                                    : 'Inherited small business and grew it.'}
                           </p>
                      </div>

                      {/* Philanthropy Score */}
                      <div className="border border-slate-100 rounded-sm p-4 hover:border-emerald-500/20 transition-colors">
                           <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                  <Heart size={14} className="text-emerald-500" fill="currentColor" />
                                  <span className="text-[10px] font-bold uppercase text-brand-secondary">Philanthropy Score</span>
                              </div>
                              <span className="font-mono font-bold text-lg text-emerald-600">{selectedProfile.philanthropyScore || 'N/A'}</span>
                           </div>
                           <div className="flex gap-1 h-1.5 mb-2">
                              {[...Array(5)].map((_, i) => (
                                  <div key={i} className={`flex-grow rounded-full ${i < (selectedProfile.philanthropyScore || 0) ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                              ))}
                           </div>
                           <p className="text-[9px] text-slate-400 leading-tight">
                              Measures lifetime giving as a percentage of net worth.
                           </p>
                      </div>

                  </div>

              </div>
           </div>
        </div>
      )}

      <div className="w-full px-4 py-8">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-end border-b border-brand-border pb-6">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-black text-white rounded-sm">
                    <Trophy size={24} />
                 </div>
                 <h1 className="text-3xl font-serif font-bold text-brand-text">Billionaire Index</h1>
              </div>
              <p className="text-brand-muted text-sm max-w-2xl font-mono">
                Real-time wealth tracking of the world's richest people. Tracking {allData.length} individuals globally.
              </p>
           </div>
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold uppercase text-brand-muted mb-1">Total Wealth Tracked</p>
              <p className="text-2xl font-mono font-bold text-brand-primary">
                 ${allData.reduce((sum, item) => sum + item.netWorth, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}B
              </p>
           </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           
           {/* Top Gainer */}
           {topGainer && (
             <div 
                onClick={() => setSelectedProfile(topGainer)}
                className="bg-white p-6 rounded-sm border border-brand-border shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-colors"
             >
                <div>
                   <p className="text-[10px] font-bold uppercase text-emerald-600 mb-2 flex items-center gap-1">
                      <TrendingUp size={12} /> Biggest Mover (Daily)
                   </p>
                   <h3 className="text-lg font-serif font-bold text-brand-secondary group-hover:underline">{topGainer.name}</h3>
                   <p className="text-emerald-600 font-mono font-bold text-xl mt-1">+{topGainer.change.toFixed(2)}B</p>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-100 group-hover:border-emerald-500 transition-colors bg-slate-100">
                   <img 
                    src={topGainer.image} 
                    alt={topGainer.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topGainer.name)}&background=111&color=fff&size=256`; }}
                   />
                </div>
             </div>
           )}

           {/* Top Sector */}
           <div className="bg-white p-6 rounded-sm border border-brand-border shadow-sm flex items-center justify-between group">
              <div>
                 <p className="text-[10px] font-bold uppercase text-brand-primary mb-2 flex items-center gap-1">
                    <BarChart3 size={12} /> Dominant Sector
                 </p>
                 <h3 className="text-lg font-serif font-bold text-brand-secondary">{topSectorName}</h3>
                 <p className="text-brand-text font-mono font-bold text-xl mt-1">${topSectorValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}B</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                 <Briefcase size={24} />
              </div>
           </div>

           {/* Biggest Loser */}
           {topLoser && (
             <div 
                onClick={() => setSelectedProfile(topLoser)}
                className="bg-white p-6 rounded-sm border border-brand-border shadow-sm flex items-center justify-between group cursor-pointer hover:border-rose-500 transition-colors"
             >
                <div>
                   <p className="text-[10px] font-bold uppercase text-rose-600 mb-2 flex items-center gap-1">
                      <TrendingDown size={12} /> Biggest Decline
                   </p>
                   <h3 className="text-lg font-serif font-bold text-brand-secondary group-hover:underline">{topLoser.name}</h3>
                   <p className="text-rose-600 font-mono font-bold text-xl mt-1">{topLoser.change.toFixed(2)}B</p>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-rose-100 group-hover:border-rose-500 transition-colors bg-slate-100">
                   <img 
                    src={topLoser.image} 
                    alt={topLoser.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topLoser.name)}&background=111&color=fff&size=256`; }}
                   />
                </div>
             </div>
           )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
           <div className="relative w-full sm:w-96">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, source, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-brand-border rounded-sm text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
              />
           </div>
           <div className="text-xs font-mono text-slate-500 uppercase tracking-wide">
              Showing {displayedData.length} of {filteredData.length} Records
           </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-sm border border-brand-border shadow-sm overflow-hidden flex flex-col">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-brand-border sticky top-0 z-10">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                       <th className="p-4 w-16 text-center">Rank</th>
                       <th className="p-4">Name</th>
                       <th className="p-4 text-right">Net Worth</th>
                       <th className="p-4 text-right">$ Change</th>
                       <th className="p-4">Country</th>
                       <th className="p-4">Industry</th>
                       <th className="p-4">Assets</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-sm">
                    {displayedData.map((item) => (
                       <tr 
                          key={item.rank} 
                          onClick={() => setSelectedProfile(item)}
                          className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                       >
                          <td className="p-4 text-center font-mono font-bold text-slate-400">{item.rank}</td>
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-slate-100 shadow-sm ring-1 ring-white">
                                   <img 
                                      src={item.image} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=111&color=fff&size=256`; }}
                                   />
                                </div>
                                <div>
                                   <span className="font-bold text-brand-secondary block group-hover:text-brand-primary transition-colors">{item.name}</span>
                                   <span className="text-xs text-slate-400 md:hidden">{formatCurrency(item.netWorth)}</span>
                                </div>
                             </div>
                          </td>
                          <td className="p-4 text-right font-mono font-bold bg-slate-50/30 text-brand-text">{formatCurrency(item.netWorth)}</td>
                          <td className="p-4 text-right">{formatChange(item.change)}</td>
                          <td className="p-4">
                             <div className="flex items-center gap-2 text-slate-600">
                                <span className="text-xs">{item.country}</span>
                             </div>
                          </td>
                          <td className="p-4 text-slate-600 text-xs uppercase font-bold tracking-tight">{item.industry}</td>
                          <td className="p-4 text-xs font-mono text-brand-primary">{item.ticker}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           {/* Pagination / Load More Footer */}
           {displayedData.length < filteredData.length && (
              <div className="p-4 border-t border-brand-border bg-slate-50 flex justify-center">
                 <button 
                   onClick={handleLoadMore}
                   className="bg-white border border-brand-border hover:border-brand-primary text-brand-secondary hover:text-brand-primary px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm"
                 >
                    Load More Billionaires ({filteredData.length - displayedData.length} remaining)
                 </button>
              </div>
           )}
           
           {displayedData.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                 <p className="text-sm">No results found matching "{searchTerm}"</p>
              </div>
           )}
        </div>

        <div className="mt-4 text-center">
           <p className="text-[10px] text-slate-400 font-mono">
              Data sourced from Forbes Real-Time Billionaires List. Updates daily at market close.
           </p>
        </div>

      </div>
    </div>
  );
};

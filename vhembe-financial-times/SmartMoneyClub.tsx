
import React, { useEffect, useState } from 'react';
import { generateSmartMoneyInsights } from '../services/geminiService';
import { NewsArticle, UserProfile } from '../types';
import { ArticleReader } from './ArticleReader';
import { TrendingUp, TrendingDown, Minus, Target, BarChart2, Share2, Bookmark, Layers, AlertCircle, MessageCircle, Lock, Terminal } from 'lucide-react';

interface SmartMoneyProps {
    user: UserProfile | null;
    triggerAuth: (msg: string) => void;
}

const SentimentBadge = ({ type }: { type?: 'Bullish' | 'Bearish' | 'Neutral' }) => {
  if (type === 'Bullish') {
    return (
      <span className="flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wide">
        <TrendingUp size={14} /> Bullish
      </span>
    );
  }
  if (type === 'Bearish') {
    return (
      <span className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wide">
        <TrendingDown size={14} /> Bearish
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wide">
      <Minus size={14} /> Neutral
    </span>
  );
};

export const SmartMoneyClub: React.FC<SmartMoneyProps> = ({ user, triggerAuth }) => {
  const [analysis, setAnalysis] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Pass the user to the service. 
      // The service decides whether to fetch Public (free) or All (premium) data
      // based on the user's existence.
      const data = await generateSmartMoneyInsights(user);
      setAnalysis(data);
      setLoading(false);
    };
    fetchData();
  }, [user]); // Re-fetch when user logs in/out

  const handleArticleClick = (article: NewsArticle) => {
      // Additional client-side check for UX
      // (Even if they see it, they might need auth to read details)
      if (!user) {
          triggerAuth("Sign in to access proprietary Smart Money setups.");
          return;
      }
      setSelectedArticle(article);
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-12 animate-pulse">
        <div className="h-12 bg-slate-200 w-64 mb-8 mx-auto rounded-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-slate-200 h-[500px] rounded-sm"></div>
          <div className="space-y-8">
             <div className="bg-slate-200 h-40 rounded-sm"></div>
             <div className="bg-slate-200 h-40 rounded-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  const featured = analysis[0];
  const secondary = analysis.slice(1);

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {selectedArticle && (
        <ArticleReader 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}

      <div className="w-full px-4 py-12">
        <div className="text-center mb-16 border-b border-brand-border pb-8">
          <h1 className="text-5xl font-serif font-bold text-brand-secondary mb-3 tracking-tight">Smart Money Club</h1>
          <p className="text-brand-muted font-mono text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <Target size={16} className="text-brand-primary" />
            Institutional Analysis & Trade Setups
          </p>
          {!user && (
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-brand-primary px-4 py-2 rounded-sm text-xs font-bold border border-blue-100">
                  <Lock size={12} /> Pro Feature: Sign in to unlock liquidity levels
              </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-9 space-y-12">
            
            {/* FEATURED ARTICLE */}
            {featured && (
              <div className="bg-white border border-brand-border shadow-md rounded-sm overflow-hidden group">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-8 relative min-h-[400px]">
                    <img src={featured.imageUrl} alt={featured.headline} className="absolute inset-0 w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    {/* Velvet Rope Blur for Featured Image if Guest */}
                    {!user && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                             <div className="bg-black/80 text-white px-6 py-3 rounded-sm flex items-center gap-3 border border-white/20 shadow-2xl transform scale-100 group-hover:scale-105 transition-transform">
                                 <Lock size={20} className="text-brand-primary" />
                                 <span className="font-bold uppercase tracking-widest text-xs">Inner Circle Access Only</span>
                             </div>
                        </div>
                    )}

                    <div className="absolute bottom-8 left-8 text-white max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-brand-primary text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{featured.category}</span>
                          {featured.sentiment && <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${featured.sentiment === 'Bullish' ? 'bg-green-600' : featured.sentiment === 'Bearish' ? 'bg-red-600' : 'bg-slate-500'}`}>
                            {featured.sentiment === 'Bullish' ? <TrendingUp size={12}/> : featured.sentiment === 'Bearish' ? <TrendingDown size={12}/> : <Minus size={12}/>}
                            {featured.sentiment} Outlook
                          </span>}
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-serif font-bold leading-tight mb-4 text-white shadow-black drop-shadow-md">{featured.headline}</h2>
                    </div>
                  </div>
                  <div className="lg:col-span-4 p-8 flex flex-col bg-white">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-brand-secondary flex items-center justify-center font-serif text-xl font-bold">{featured.author.charAt(0)}</div>
                        <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analyst</p><p className="text-sm font-bold text-brand-text">{featured.author}</p></div>
                    </div>
                    <div className="flex-grow relative">
                        <h3 className="text-xs font-bold uppercase text-brand-primary mb-2">Analysis Summary</h3>
                        
                        {/* Summary Content - Blurred for Guest */}
                        <div className={!user ? 'blur-sm select-none opacity-50' : ''}>
                             <p className="text-brand-muted font-serif leading-relaxed text-lg line-clamp-6">{featured.summary}</p>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <button 
                            onClick={() => handleArticleClick(featured)}
                            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-sm flex items-center gap-2 ${user ? 'bg-brand-secondary hover:bg-brand-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-brand-primary hover:text-white'}`}
                        >
                            {user ? <><BarChart2 size={16} /> View Analysis</> : <><Lock size={14} /> Unlock Analysis</>}
                        </button>
                        <div className="flex gap-4 text-slate-400"><Bookmark size={20} className="hover:text-brand-primary cursor-pointer transition-colors"/><Share2 size={20} className="hover:text-brand-primary cursor-pointer transition-colors"/></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-8 border-b border-brand-border pb-4">
                <h3 className="text-xl font-bold uppercase tracking-widest text-brand-text flex items-center gap-3"><span className="w-2 h-8 bg-brand-primary"></span>Active Setups</h3>
                <span className="text-xs font-mono text-slate-400">UPDATED: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secondary.map((item, idx) => (
                  <article key={item.id} className="group bg-white border border-brand-border hover:border-brand-primary transition-colors rounded-sm shadow-sm overflow-hidden flex flex-col h-full relative">
                    
                    {!user && (
                        <div className="absolute top-3 right-3 z-20">
                            <div className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md">
                                <Lock size={14} className="text-brand-secondary" />
                            </div>
                        </div>
                    )}

                    <div className="relative h-48 overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img src={item.imageUrl} alt={item.headline} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100 ${!user ? 'blur-[2px]' : ''}`}/>
                      <div className="absolute top-3 left-3"><SentimentBadge type={item.sentiment} /></div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-3"><span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">{item.category}</span></div>
                      <h4 className="text-lg font-serif font-bold text-brand-text leading-tight mb-3 group-hover:text-brand-primary transition-colors">{item.headline}</h4>
                      
                      <p className={`text-sm text-brand-muted font-serif leading-relaxed mb-6 flex-grow line-clamp-4 ${!user ? 'blur-[1.5px] select-none opacity-60' : ''}`}>
                          {item.summary}
                      </p>
                      
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase">Analyst</span><span className="text-xs font-bold text-brand-secondary">{item.author.split(',')[0]}</span></div>
                        <button onClick={() => handleArticleClick(item)} className="text-brand-primary text-xs font-bold uppercase tracking-wider hover:underline">
                            {user ? 'Read' : 'Unlock'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-3 space-y-8">
            <div className="bg-brand-primary text-white p-6 rounded-sm shadow-xl relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
               <div className="relative z-10 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"><Terminal size={24} className="text-white" /></div>
                  <h3 className="text-xl font-bold mb-2">Vhembe Trading Terminal</h3>
                  <p className="text-sm text-blue-100 mb-6 leading-relaxed">Get access to institutional trading signals, real-time squawk, and proprietary order flow data.</p>
                  
                  {user ? (
                      <button className="block w-full py-3 bg-white text-brand-primary text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-blue-50 transition-colors shadow-sm">
                          LAUNCH TERMINAL
                      </button>
                  ) : (
                      <button onClick={() => triggerAuth("Sign in to launch the Pro Terminal.")} className="block w-full py-3 bg-brand-secondary text-white border border-blue-400 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-blue-900 transition-colors shadow-sm">
                          SIGN IN TO ACCESS
                      </button>
                  )}
                  
                  <p className="text-[10px] text-blue-200 mt-3 font-mono">2,450+ Traders Online</p>
               </div>
            </div>

            <div className={`bg-brand-secondary text-white p-6 rounded-sm shadow-lg border border-blue-900 relative ${!user ? 'overflow-hidden' : ''}`}>
               {!user && (
                   <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                       <div className="text-center">
                           <Lock size={24} className="mx-auto text-blue-400 mb-2" />
                           <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Liquidity Data Locked</p>
                       </div>
                   </div>
               )}
               
               <div className="flex items-center gap-2 mb-6 pb-4 border-b border-blue-800"><Layers size={18} className="text-blue-300" /><h3 className="text-sm font-bold uppercase tracking-widest">Liquidity Targets</h3></div>
               <div className="space-y-6">
                 {secondary.slice(0, 3).map((item) => (
                   item.liquidityLevels && (
                     <div key={`liq-${item.id}`} className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono font-bold text-blue-200 uppercase mb-1"><span>{item.headline.split(':')[0]}</span><span className={item.sentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}>{item.sentiment}</span></div>
                        <div className="bg-blue-900/50 rounded-sm p-3 space-y-2 border border-blue-800">
                           <div className="flex justify-between text-xs"><span className="text-blue-400">Stop Hunt</span><span className="font-mono text-white font-bold">{item.liquidityLevels.stopHunt}</span></div>
                           <div className="w-full bg-blue-950 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent w-full animate-pulse opacity-50"></div></div>
                           <div className="flex justify-between text-[10px] text-blue-500 pt-1 font-mono"><span>Sup: {item.liquidityLevels.support}</span><span>Res: {item.liquidityLevels.resistance}</span></div>
                        </div>
                     </div>
                   )
                 ))}
               </div>
            </div>

            <div className="bg-white border border-brand-border p-6 rounded-sm">
               <div className="flex items-center gap-2 mb-3"><Lock size={16} className="text-brand-primary" /><h4 className="font-serif font-bold text-lg">Inner Circle Only</h4></div>
               <p className="text-sm text-brand-muted mb-4 leading-relaxed">Retail traders look for patterns. Institutions look for liquidity. Learn to spot the difference in our premium video library.</p>
               <button onClick={() => triggerAuth("Register to watch the free lesson.")} className="block w-full text-center py-3 border border-brand-primary text-brand-primary text-xs font-bold uppercase tracking-wider hover:bg-brand-primary hover:text-white transition-colors">Watch Free Lesson</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

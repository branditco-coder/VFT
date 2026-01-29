
import React, { useEffect, useState, useMemo } from 'react';
import { fetchMarketNews } from '../services/newsService';
import { NewsArticle } from '../types';
import { ArticleReader } from './ArticleReader';
import { Radio, RefreshCw, Zap, Clock, ArrowRight, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronLeft, BarChart2, Filter, Layers, Globe } from 'lucide-react';

const SentimentBadge = ({ type }: { type?: string }) => {
   const color = type === 'Bullish' ? 'text-emerald-600 bg-emerald-50' : type === 'Bearish' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50';
   const Icon = type === 'Bullish' ? TrendingUp : type === 'Bearish' ? TrendingDown : Minus;
   return (
      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-transparent ${color} flex items-center gap-1`}>
         <Icon size={10} /> {type || 'Neutral'}
      </span>
   );
};

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [activeTickerIndex, setActiveTickerIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [displayCount, setDisplayCount] = useState(20);

  const fetchNews = async () => {
    setLoading(true);
    try {
        const articles = await fetchMarketNews();
        setNews(articles);
    } catch (error) {
        console.error("Error refreshing feed:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Refresh every minute to pull from RSS and merge
    return () => clearInterval(interval);
  }, []);

  // Filter Logic
  const categories = ['All', 'Sentiment', 'Squawk', 'Markets', 'Crypto'];
  
  const filteredNews = useMemo(() => {
      let filtered = news;
      if (activeCategory !== 'All') {
          filtered = news.filter(n => n.category === activeCategory);
      }
      return filtered;
  }, [news, activeCategory]);

  const visibleNews = filteredNews.slice(0, displayCount);
  const hasMore = visibleNews.length < filteredNews.length;

  const tickerNews = news.filter(n => n.isBreaking).slice(0, 5);

  // Ticker Auto-scroll
  useEffect(() => {
    if (tickerNews.length === 0) return;
    const interval = setInterval(() => {
        setActiveTickerIndex(prev => (prev + 1) % tickerNews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tickerNews.length]);

  const nextTicker = () => setActiveTickerIndex(prev => (prev + 1) % tickerNews.length);
  const prevTicker = () => setActiveTickerIndex(prev => (prev - 1 + tickerNews.length) % tickerNews.length);

  if (loading && news.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-brand-secondary border-t-brand-primary rounded-full animate-spin"></div>
             <div className="text-xs font-mono uppercase tracking-widest text-brand-muted animate-pulse">Initializing News Engine...</div>
         </div>
      </div>
    );
  }

  // Layout Segments
  const breakingNews = filteredNews.find(n => n.isBreaking) || filteredNews[0];
  // Exclude breaking news from the main list if possible, unless it's the only one
  const mainFeed = visibleNews.filter(n => n.id !== breakingNews?.id);

  return (
    <div className="w-full">
      {selectedArticle && <ArticleReader article={selectedArticle} onClose={() => setSelectedArticle(null)} />}

      {/* 1. BREAKING TICKER */}
      {tickerNews.length > 0 && (
         <div className="w-full bg-brand-secondary text-white text-xs font-bold uppercase tracking-wider h-12 px-4 mb-6 rounded-sm flex items-center justify-between shadow-md border border-brand-secondary/50 relative overflow-hidden">
            <div className="flex items-center gap-3 shrink-0 border-r border-blue-900 pr-6 h-full relative z-10">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-brand-secondary"></span>
               </span>
               <span className="text-red-500 font-black tracking-widest">GLOBAL WIRE</span>
            </div>
            <div className="flex-grow flex items-center justify-center px-4 overflow-hidden group relative z-10">
               <div 
                  onClick={() => setSelectedArticle(tickerNews[activeTickerIndex])}
                  className="flex items-center gap-3 cursor-pointer truncate transition-all duration-300 hover:text-brand-primary"
               >
                   <span className="truncate text-sm font-bold text-white group-hover:text-blue-200 transition-colors">{tickerNews[activeTickerIndex].headline}</span>
                   <span className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/50"><Clock size={10} /> {tickerNews[activeTickerIndex].timestamp}</span>
               </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 border-l border-blue-900 pl-4 h-full relative z-10">
               <button onClick={prevTicker} className="p-1.5 hover:bg-white/10 rounded-sm transition-colors text-slate-400 hover:text-white"><ChevronLeft size={16}/></button>
               <span className="font-mono text-[10px] text-blue-400 w-10 text-center select-none">{activeTickerIndex + 1}/{tickerNews.length}</span>
               <button onClick={nextTicker} className="p-1.5 hover:bg-white/10 rounded-sm transition-colors text-slate-400 hover:text-white"><ChevronRight size={16}/></button>
            </div>
         </div>
      )}

      {/* 2. HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 pb-2 border-b-2 border-brand-secondary gap-4">
          <div className="flex flex-col">
              <h1 className="text-2xl font-serif font-bold text-brand-secondary flex items-center gap-2">
                  <Zap size={24} className="text-brand-primary fill-brand-primary" /> Market Intelligence
              </h1>
              <p className="text-xs font-mono text-brand-muted mt-1 uppercase tracking-wider">
                  Real-time feed • 7-Day History • {news.length} Articles Cached
              </p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
              {categories.map(cat => (
                  <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                          activeCategory === cat 
                          ? 'bg-brand-secondary text-white border-brand-secondary' 
                          : 'bg-white text-brand-muted border-slate-200 hover:border-brand-secondary hover:text-brand-secondary'
                      }`}
                  >
                      {cat}
                  </button>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button onClick={fetchNews} className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-white text-brand-muted hover:text-brand-primary hover:border-brand-primary flex items-center gap-1 transition-all">
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: MAIN FEED */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           
           {/* Featured Article */}
           {breakingNews && (
              <div onClick={() => setSelectedArticle(breakingNews)} className="group relative h-[400px] w-full rounded-sm overflow-hidden cursor-pointer shadow-md border border-brand-border">
                 <img src={breakingNews.imageUrl} alt={breakingNews.headline} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary via-brand-secondary/40 to-transparent opacity-90"></div>
                 <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                    <div className="flex items-center gap-3 mb-3">
                       <span className="bg-brand-primary text-white text-[10px] font-bold uppercase px-2 py-1 tracking-wider">{breakingNews.category}</span>
                       <SentimentBadge type={breakingNews.sentiment} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4 drop-shadow-sm group-hover:text-blue-100 transition-colors">{breakingNews.headline}</h2>
                    <p className="text-blue-100 text-sm font-serif line-clamp-2 max-w-2xl mb-4 leading-relaxed">{breakingNews.summary}</p>
                    <div className="flex items-center gap-4 text-xs font-mono text-blue-200/80">
                       <span className="flex items-center gap-1"><Clock size={12} /> {breakingNews.timestamp}</span>
                       <span className="uppercase text-white font-bold">{breakingNews.author}</span>
                       <span className="flex items-center gap-1 text-white group-hover:translate-x-1 transition-transform">Read Analysis <ArrowRight size={12}/></span>
                    </div>
                 </div>
              </div>
           )}

           {/* News List */}
           <div className="flex flex-col gap-4">
              {mainFeed.map(article => (
                  <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white p-5 rounded-sm border border-brand-border shadow-sm hover:shadow-md hover:border-brand-primary transition-all cursor-pointer flex flex-col md:flex-row gap-6 group">
                      <div className="w-full md:w-48 h-32 shrink-0 bg-slate-100 rounded-sm overflow-hidden relative">
                          <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-2 left-2"><SentimentBadge type={article.sentiment} /></div>
                      </div>
                      <div className="flex-grow flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold uppercase text-brand-primary tracking-wider bg-blue-50 px-2 py-0.5 rounded">{article.category}</span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1"><Clock size={10} /> {article.timestamp}</span>
                          </div>
                          <h3 className="text-xl font-serif font-bold text-brand-secondary leading-snug mb-2 group-hover:text-brand-primary transition-colors">{article.headline}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{article.summary}</p>
                          <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                              <span>By {article.author}</span>
                          </div>
                      </div>
                  </div>
              ))}
           </div>

           {/* Load More */}
           {hasMore && (
               <button 
                 onClick={() => setDisplayCount(prev => prev + 20)}
                 className="w-full py-4 bg-slate-50 border border-brand-border text-brand-muted font-bold uppercase text-xs tracking-widest hover:bg-slate-100 hover:text-brand-secondary transition-colors"
               >
                   Load Older News
               </button>
           )}
        </div>

        {/* RIGHT COLUMN: SQUAWK & SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           
           {/* Live Squawk Box */}
           <div className="bg-brand-secondary text-white rounded-sm shadow-md overflow-hidden flex flex-col h-[500px] sticky top-20">
              <div className="p-4 border-b border-blue-900 bg-brand-secondary flex justify-between items-center shadow-sm z-10">
                 <div className="flex items-center gap-2"><Radio size={18} className="text-red-500 animate-pulse" /><span className="font-bold font-serif text-lg tracking-wide">Live Squawk</span></div>
                 <div className="text-[9px] font-mono text-blue-200 uppercase border border-blue-800 px-2 py-0.5 rounded">Audio Feed</div>
              </div>
              <div className="flex-grow overflow-y-auto p-0 scroll-smooth bg-[#001e3d]">
                 {news.filter(n => n.category === 'Squawk' || n.category === 'Sentiment').slice(0, 30).map((item, idx) => (
                    <div key={item.id} onClick={() => setSelectedArticle(item)} className={`p-4 border-b border-blue-900/50 cursor-pointer transition-all hover:bg-blue-800/30 group ${idx === 0 ? 'bg-blue-800/20' : ''}`}>
                       <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-blue-300 uppercase truncate max-w-[120px]">{item.author}</span>
                          <span className="text-[9px] font-mono text-blue-400 flex items-center gap-1">{item.timestamp}</span>
                       </div>
                       <h4 className="text-xs font-medium text-blue-50 leading-relaxed group-hover:text-white transition-colors">{item.headline}</h4>
                    </div>
                 ))}
              </div>
           </div>

           {/* Market Context */}
           <div className="bg-white border border-brand-border p-6 rounded-sm shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                 <Globe size={16} className="text-brand-primary" />
                 <h3 className="text-xs font-bold uppercase text-brand-secondary">Market Context</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                 Global markets are digesting the latest central bank rhetoric. Volatility is expected to remain elevated in the upcoming sessions.
              </p>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Risk Sentiment</span>
                    <span className="font-bold text-emerald-600">Risk On</span>
                 </div>
                 <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="text-slate-500">VIX (Volatility)</span>
                    <span className="font-bold text-brand-text">14.20 (-1.5%)</span>
                 </div>
                 <div className="flex justify-between text-xs pb-2">
                    <span className="text-slate-500">Key Event</span>
                    <span className="font-bold text-brand-primary">FOMC Minutes</span>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { NewsArticle } from '../types';
import { generateFullArticle } from '../services/geminiService';
import { X, Calendar, User, ExternalLink, Share2, Printer, Tag, TrendingUp, TrendingDown, Minus, Target, BookOpen, Loader2 } from 'lucide-react';

interface ArticleReaderProps {
  article: NewsArticle;
  onClose: () => void;
}

const SentimentBadge = ({ type }: { type?: 'Bullish' | 'Bearish' | 'Neutral' }) => {
  if (!type) return null;
  const styles = {
    Bullish: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Bearish: "bg-red-100 text-red-800 border-red-200",
    Neutral: "bg-slate-100 text-slate-700 border-slate-200"
  };
  const Icons = {
    Bullish: TrendingUp,
    Bearish: TrendingDown,
    Neutral: Minus
  };
  const Icon = Icons[type];

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-sm border text-xs font-bold uppercase tracking-wider ${styles[type]}`}>
      <Icon size={14} /> {type}
    </span>
  );
};

export const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const hasSufficientContent = article.fullContent && article.fullContent.length > 500;
    
    if (hasSufficientContent) {
        setContent(article.fullContent || '');
    } else {
        const fetchContent = async () => {
            setIsGenerating(true);
            await new Promise(r => setTimeout(r, 600)); 
            const generated = await generateFullArticle(article.headline, article.summary, article.category);
            setContent(generated);
            setIsGenerating(false);
        };
        fetchContent();
    }
  }, [article.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-sm shadow-2xl flex flex-col relative z-10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-white sticky top-0 z-20">
           <div className="flex items-center gap-2">
              <span className="bg-brand-primary text-white text-[10px] font-bold uppercase px-2 py-1 rounded-sm">{article.category}</span>
              <span className="text-xs text-brand-muted font-mono hidden sm:inline-block">ID: {article.id.slice(0, 8)}</span>
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2 text-brand-muted hover:text-brand-primary hover:bg-slate-100 rounded-full transition-colors hidden sm:block"><Printer size={18} /></button>
              <button className="p-2 text-brand-muted hover:text-brand-primary hover:bg-slate-100 rounded-full transition-colors hidden sm:block"><Share2 size={18} /></button>
              <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
              <button onClick={onClose} className="p-2 text-brand-secondary hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
           </div>
        </div>

        <div className="overflow-y-auto flex-grow bg-[#fcfcfc]">
           <div className="w-full h-64 sm:h-96 relative">
              <img src={article.imageUrl} alt={article.headline} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 sm:left-10 text-white">
                 <div className="flex flex-wrap items-center gap-3 mb-3">
                    <SentimentBadge type={article.sentiment} />
                    {article.isBreaking && <span className="bg-red-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-sm animate-pulse">Breaking</span>}
                 </div>
              </div>
           </div>

           <div className="max-w-3xl mx-auto px-6 py-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-brand-secondary leading-tight mb-6">{article.headline}</h1>
              <div className="flex items-center justify-between border-y border-slate-100 py-4 mb-8">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-brand-text">
                       <div className="w-8 h-8 bg-brand-secondary text-white rounded-full flex items-center justify-center font-serif">{article.author.charAt(0)}</div>
                       {article.author}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-muted font-mono"><Calendar size={14} />{article.timestamp}</div>
                 </div>
              </div>

              {article.liquidityLevels && (
                 <div className="bg-blue-50 border border-blue-100 p-6 rounded-sm mb-8">
                    <div className="flex items-center gap-2 mb-4"><Target size={20} className="text-brand-primary" /><h3 className="font-bold text-brand-secondary uppercase tracking-wider text-sm">Institutional Levels</h3></div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                       <div className="bg-white p-3 rounded-sm border border-blue-100"><div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Support</div><div className="font-mono font-bold text-brand-text">{article.liquidityLevels.support}</div></div>
                       <div className="bg-white p-3 rounded-sm border border-blue-100 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div><div className="text-[10px] font-bold uppercase text-brand-primary mb-1">Stop Hunt</div><div className="font-mono font-bold text-brand-primary text-lg">{article.liquidityLevels.stopHunt}</div></div>
                       <div className="bg-white p-3 rounded-sm border border-blue-100"><div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Resistance</div><div className="font-mono font-bold text-brand-text">{article.liquidityLevels.resistance}</div></div>
                    </div>
                 </div>
              )}

              {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center text-brand-muted space-y-4"><Loader2 size={32} className="animate-spin text-brand-primary" /><p className="font-mono text-sm uppercase animate-pulse">Loading Article Data...</p></div>
              ) : (
                  <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-brand-secondary prose-a:text-brand-primary prose-strong:text-brand-secondary">
                     <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
              )}
              
              <div className="mt-12 pt-6 border-t border-slate-200">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-sm border border-slate-100">
                    <div className="text-xs text-slate-500"><span className="font-bold uppercase text-slate-700 block mb-1">Source Reference</span>This article is aggregated from external feeds. Full copyright belongs to the original publisher.</div>
                    {article.url && (
                        <a href={article.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-primary hover:text-brand-secondary text-xs font-bold uppercase tracking-wider transition-colors shrink-0"><BookOpen size={14} />View Original on {new URL(article.url).hostname.replace('www.', '')}<ExternalLink size={12} /></a>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

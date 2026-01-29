
import React, { useState } from 'react';
import { saveSmartMoneyPost } from '../services/geminiService';
import { NewsArticle } from '../types';
import { PenTool, Check, Image as ImageIcon, Layout, Eye, AlertCircle, Lock, Unlock } from 'lucide-react';

export const AdminEditor: React.FC = () => {
  const [formData, setFormData] = useState({
    headline: '',
    author: 'Admin',
    category: 'Technical Setup',
    sentiment: 'Neutral',
    summary: '',
    imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000',
    support: '',
    resistance: '',
    stopHunt: '',
    isPremium: true
  });
  
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState(formData.imageUrl);
  const [imageError, setImageError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newArticle: NewsArticle = {
      id: `custom-${Date.now()}`,
      headline: formData.headline,
      author: formData.author,
      category: formData.category,
      summary: formData.summary,
      timestamp: new Date().toLocaleDateString(),
      publishedAt: Date.now(),
      imageUrl: imageError ? 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000' : formData.imageUrl,
      sentiment: formData.sentiment as any,
      liquidityLevels: (formData.support || formData.resistance) ? {
        support: formData.support,
        resistance: formData.resistance,
        stopHunt: formData.stopHunt
      } : undefined
    };

    const success = saveSmartMoneyPost(newArticle, formData.isPremium);
    if (success) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      
      // Reset form
      const defaultImage = 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000';
      setFormData({ 
        headline: '', 
        author: 'Admin', 
        category: 'Technical Setup',
        sentiment: 'Neutral',
        summary: '',
        imageUrl: defaultImage,
        support: '',
        resistance: '',
        stopHunt: '',
        isPremium: true
      });
      setPreviewUrl(defaultImage);
      setImageError(false);
    } else {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handlePreviewClick = () => {
    setImageError(false);
    setPreviewUrl(formData.imageUrl);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-12">
      <div className="bg-white border border-brand-border rounded-sm shadow-lg overflow-hidden">
        
        <div className="bg-brand-secondary px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-sm">
                <PenTool size={20} className="text-white" />
             </div>
             <div>
                <h2 className="text-white font-bold text-lg">Smart Money Editor</h2>
                <p className="text-blue-200 text-xs font-mono">Publish to Firestore (Cloud)</p>
             </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Left Column: Content */}
           <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Headline</label>
                <input 
                  type="text" 
                  name="headline"
                  required
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g. EURUSD Rejects 1.0900 as Yields Spike"
                  className="w-full p-3 border border-slate-200 rounded-sm font-serif font-bold text-lg focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Analysis / Summary</label>
                <textarea 
                  name="summary"
                  required
                  rows={6}
                  value={formData.summary}
                  onChange={handleChange}
                  placeholder="Write your analysis here..."
                  className="w-full p-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Author Name</label>
                    <input 
                      type="text" 
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-200 rounded-sm text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-200 rounded-sm text-sm"
                    >
                      <option>Technical Setup</option>
                      <option>Macro Insight</option>
                      <option>Crypto Flow</option>
                      <option>Institutional Orderflow</option>
                    </select>
                 </div>
              </div>

              {/* Security Level Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                  <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-brand-secondary flex items-center gap-2">
                             {formData.isPremium ? <Lock size={14} className="text-brand-primary"/> : <Unlock size={14} className="text-emerald-500"/>}
                             {formData.isPremium ? 'Premium Content' : 'Public Content'}
                          </span>
                          <span className="text-[10px] text-brand-muted mt-1">
                              {formData.isPremium ? 'Only visible to Pro & Admin users.' : 'Visible to all visitors (Guest).'}
                          </span>
                      </div>
                      <div className="relative">
                          <input 
                            type="checkbox" 
                            name="isPremium"
                            checked={formData.isPremium}
                            onChange={(e) => setFormData({...formData, isPremium: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </div>
                  </label>
              </div>

           </div>

           {/* Right Column: Meta & Levels */}
           <div className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Cover Image URL</label>
                <div className="flex gap-2 mb-3">
                   <div className="flex-grow">
                      <input 
                        type="text" 
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className={`w-full p-2 border rounded-sm text-xs font-mono ${imageError ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200'}`}
                      />
                   </div>
                   <button 
                     type="button" 
                     onClick={handlePreviewClick}
                     className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-sm text-brand-secondary transition-colors flex items-center gap-2 font-bold text-xs uppercase"
                   >
                     <Eye size={14} /> Preview
                   </button>
                </div>
                
                {/* Enhanced Image Preview Container */}
                <div className="w-full h-48 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center overflow-hidden relative">
                   {imageError || !previewUrl ? (
                       <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                           <ImageIcon size={32} className={imageError ? "text-red-400" : "text-slate-300"} />
                           <div className="flex flex-col items-center">
                               <span className={`text-xs font-bold uppercase ${imageError ? "text-red-500" : "text-slate-500"}`}>
                                   {imageError ? "Image Failed to Load" : "No Image Preview"}
                               </span>
                               {imageError && (
                                   <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                       <AlertCircle size={10} /> Check URL validity
                                   </div>
                               )}
                           </div>
                       </div>
                   ) : (
                       <img 
                           src={previewUrl} 
                           alt="Preview" 
                           className="w-full h-full object-cover" 
                           onError={() => setImageError(true)}
                       />
                   )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                   Supports JPG, PNG, WEBP. If the link is broken, a default placeholder will be used upon publishing.
                </p>
              </div>

              <div>
                 <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Sentiment</label>
                 <div className="flex gap-4">
                    {['Bullish', 'Bearish', 'Neutral'].map(s => (
                       <label key={s} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="sentiment" 
                            value={s}
                            checked={formData.sentiment === s}
                            onChange={handleChange}
                            className="accent-brand-primary"
                          />
                          <span className={`text-sm font-bold ${s === 'Bullish' ? 'text-emerald-600' : s === 'Bearish' ? 'text-red-600' : 'text-slate-600'}`}>
                             {s}
                          </span>
                       </label>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm">
                 <div className="flex items-center gap-2 mb-4">
                    <Layout size={16} className="text-brand-muted" />
                    <span className="text-xs font-bold uppercase text-brand-secondary">Institutional Levels (Optional)</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <span className="w-20 text-[10px] font-mono uppercase text-slate-500">Support</span>
                       <input 
                         type="text" 
                         name="support"
                         value={formData.support}
                         onChange={handleChange}
                         placeholder="1.0500"
                         className="flex-grow p-1.5 border border-slate-200 text-xs font-mono"
                       />
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="w-20 text-[10px] font-mono uppercase text-slate-500">Resistance</span>
                       <input 
                         type="text" 
                         name="resistance"
                         value={formData.resistance}
                         onChange={handleChange}
                         placeholder="1.0650"
                         className="flex-grow p-1.5 border border-slate-200 text-xs font-mono"
                       />
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="w-20 text-[10px] font-mono uppercase text-blue-500 font-bold">Stop Hunt</span>
                       <input 
                         type="text" 
                         name="stopHunt"
                         value={formData.stopHunt}
                         onChange={handleChange}
                         placeholder="1.0480"
                         className="flex-grow p-1.5 border border-blue-200 bg-blue-50 text-xs font-mono"
                       />
                    </div>
                 </div>
              </div>

              <button 
                type="submit"
                className={`w-full py-4 text-white font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 shadow-md ${status === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-primary hover:bg-blue-700'}`}
              >
                 {status === 'success' ? <><Check /> Published!</> : 'Publish Article'}
              </button>

           </div>

        </form>
      </div>
    </div>
  );
};

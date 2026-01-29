
import React, { useState } from 'react';
import { X, Lock, ArrowRight, CheckCircle, Mail, Terminal, Key, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  initialMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, initialMessage }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    let result;
    if (isRegistering) {
        result = await authService.register(email, password);
    } else {
        result = await authService.login(email, password);
    }

    setLoading(false);

    if (result.success) {
      onLoginSuccess();
      onClose();
    } else {
      setError(result.message || "Authentication failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await authService.loginWithGoogle();
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
      onClose();
    } else {
      setError(result.message || "Google Sign-In failed.");
    }
  };

  const handleForgotPassword = async () => {
      if (!email) {
          setError("Please enter your email address first.");
          return;
      }
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await authService.resetPassword(email);
      setLoading(false);
      
      if (res.success) {
          setSuccessMsg(res.message);
      } else {
          setError(res.message);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-sm shadow-2xl relative overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-brand-border">
        
        {/* Header */}
        <div className="bg-brand-secondary p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-blue-400 to-brand-primary"></div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Lock size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-1">Vhembe Terminal</h2>
            <p className="text-blue-200 text-xs uppercase tracking-widest font-mono">
                {isRegistering ? 'Create Secure ID' : 'Professional Access'}
            </p>
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="p-8">
            {initialMessage && !error && !successMsg && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-sm flex items-start gap-3">
                    <Terminal size={16} className="text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-secondary font-medium leading-relaxed">{initialMessage}</p>
                </div>
            )}
            
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-600 font-medium leading-relaxed">{successMsg}</p>
                </div>
            )}

            <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-slate-700 border border-slate-300 py-3 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm mb-6 relative group"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
            </button>

            <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 font-bold uppercase">Or use email</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-brand-muted mb-2">Email Access Key</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="email" 
                            required
                            autoFocus
                            placeholder="name@fund.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-mono text-sm"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold uppercase text-brand-muted">Secure Password</label>
                        {!isRegistering && (
                            <button 
                                type="button" 
                                onClick={handleForgotPassword}
                                className="text-[10px] font-bold uppercase text-brand-primary hover:underline disabled:opacity-50"
                                disabled={loading}
                            >
                                Forgot Password?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-mono text-sm"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-brand-primary text-white py-3 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>Processing...</>
                    ) : (
                        <>{isRegistering ? 'Initialize Account' : 'Unlock Terminal'} <ArrowRight size={14} /></>
                    )}
                </button>
            </form>

            <div className="mt-4 text-center">
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-brand-primary hover:underline font-bold"
                >
                    {isRegistering ? 'Already have credentials? Sign In' : 'New to Vhembe? Request Access'}
                </button>
            </div>

            <div className="mt-8 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span>Real-time Institutional Data Feeds</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span>Smart Money "Stop Hunt" Levels</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

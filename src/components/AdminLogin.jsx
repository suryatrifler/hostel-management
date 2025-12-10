import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Lock, AlertTriangle, Activity } from 'lucide-react';

export default function AdminLogin({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // STRICT CHECK: Ensure exact admin email match
    if (email !== 'admin@college.edu.in') {
        setError('UNAUTHORIZED IDENTITY');
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      // Success is handled by the onAuthStateChange listener in TerminalHome.jsx
    } catch (err) {
      setError('AUTHENTICATION FAILED');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      
      {/* Main Panel Container */}
      <div className="relative w-full max-w-md bg-black/80 backdrop-blur-md border border-red-900/50 p-1 shadow-[0_0_50px_rgba(220,38,38,0.15)] group overflow-hidden animate-[slideIn_0.5s_ease-out]">
        
        {/* Animated Scanline Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/10 to-transparent h-[20%] w-full animate-[scan_4s_linear_infinite] pointer-events-none opacity-50" />

        {/* --- Header Section --- */}
        <div className="bg-red-950/30 p-4 border-b border-red-900/50 flex justify-between items-center relative">
            <div className="flex items-center gap-3">
                <Shield className="text-red-500 w-6 h-6" />
                <div>
                    <h2 className="text-red-500 font-bold tracking-widest text-lg leading-none">MAINFRAME ACCESS</h2>
                    <div className="text-[10px] text-red-400/60 font-mono mt-1">SECURE_LEVEL_5 // RESTRICTED</div>
                </div>
            </div>
            {/* Blinking Status Light */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-500 font-mono hidden sm:block">NET_SECURE</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
            </div>
        </div>

        {/* --- Form Section --- */}
        <div className="p-8 relative z-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
                
                {/* Email Field */}
                <div className="space-y-1">
                    <label className="text-xs font-mono text-red-400/70 ml-1">ADMIN_ID</label>
                    <div className="relative group/input">
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-red-900/60 text-red-100 px-4 py-3 font-mono outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all placeholder-red-900/30"
                            placeholder="identification_code"
                            autoComplete="off"
                        />
                        {/* Corner Accents on Input */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500 opacity-0 group-hover/input:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500 opacity-0 group-hover/input:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                    <label className="text-xs font-mono text-red-400/70 ml-1">SECURITY_KEY</label>
                    <div className="relative group/input">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-red-900/60 text-red-100 px-4 py-3 font-mono outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all placeholder-red-900/30"
                            placeholder="••••••••"
                            autoComplete="off"
                        />
                        <div className="absolute right-3 top-3 text-red-900/50">
                            <Lock size={16} />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 p-3 text-red-400 text-xs font-mono animate-flicker">
                        <AlertTriangle size={16} />
                        <span>ERROR :: {error}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-500 text-black font-bold py-3 mt-4 tracking-widest transition-all relative overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? <Activity className="animate-spin" size={18}/> : null}
                        {loading ? 'VERIFYING...' : 'INITIATE SESSION'}
                    </span>
                    {/* Hover Shine Effect */}
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shine_1s_ease-in-out]" />
                </button>

                <div className="text-center pt-2">
                    <button 
                        type="button" 
                        onClick={onBack}
                        className="text-[10px] text-red-500/50 hover:text-red-400 uppercase tracking-widest border-b border-transparent hover:border-red-400 transition-all"
                    >
                        [ Abort Sequence ]
                    </button>
                </div>

            </form>
        </div>

        {/* Decorative Tech Corners (Outer Box) */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600" />
      </div>
    </div>
  );
}
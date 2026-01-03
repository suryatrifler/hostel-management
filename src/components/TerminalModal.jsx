import React from 'react';
import { X } from 'lucide-react';

export default function TerminalModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn p-4">
      {/* Outer Border with Glow */}
      <div className="relative w-full max-w-2xl bg-black border-2 border-terminal shadow-[0_0_20px_rgba(255,176,0,0.2)] flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-terminal text-black font-bold p-2 flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
             <span className="animate-pulse">■</span>
             <span className="tracking-widest font-vt323 text-xl">{title}</span>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-black hover:text-terminal px-2 transition-colors font-mono font-bold"
          >
            [X]
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar font-vt323 text-xl text-terminal">
            {children}
        </div>

        {/* Decor Corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-terminal"></div>
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-terminal"></div>
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-terminal"></div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-terminal"></div>
      </div>
    </div>
  );
}
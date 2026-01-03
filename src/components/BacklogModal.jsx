import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, AlertTriangle, ShieldCheck, Terminal, BookOpen, Loader } from 'lucide-react';

export default function BacklogModal({ onClose, student }) {
  const [backlogs, setBacklogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) fetchBacklogs();
  }, [student]);

  const fetchBacklogs = async () => {
    try {
      // 1. Fetch Active Backlogs + Subject Details
      const { data, error } = await supabase
        .from('backlogs')
        .select(`
            semester_origin, 
            status,
            subjects ( code, name, default_credits, type )
        `)
        .eq('student_reg_no', student.registration_number)
        .eq('status', 'ACTIVE')
        .order('semester_origin');

      if (error) throw error;

      // 2. Group by Semester for UI
      // Output Format: [ { semester: "SEMESTER_1", subjects: [...] }, ... ]
      const grouped = data.reduce((acc, curr) => {
        const semKey = `SEMESTER_0${curr.semester_origin}`;
        if (!acc[semKey]) acc[semKey] = [];
        
        acc[semKey].push({
            code: curr.subjects.code,
            name: curr.subjects.name,
            credits: curr.subjects.default_credits,
            type: curr.subjects.type
        });
        return acc;
      }, {});

      const formattedData = Object.keys(grouped).map(key => ({
        semester: key,
        subjects: grouped[key]
      }));

      setBacklogs(formattedData);
    } catch (err) {
      console.error("Backlog Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasBacklogs = backlogs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      
      {/* MODAL CONTAINER */}
      <div className={`
          relative w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden transition-colors duration-500
          ${hasBacklogs ? 'bg-black border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.15)]' : 'bg-[#050505] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]'}
      `}>
        
        {/* --- HEADER --- */}
        <div className={`flex justify-between items-center p-5 border-b transition-colors duration-300 ${hasBacklogs ? 'border-red-500/20 bg-red-900/10' : 'border-white/5 bg-white/5'}`}>
            <div className="flex items-center gap-3">
                {hasBacklogs ? (
                    <div className="text-red-500 animate-pulse p-1 border border-red-500/30 rounded bg-red-500/10"><AlertTriangle size={20} /></div>
                ) : (
                    <div className="text-white/20"><Terminal size={20} /></div>
                )}
                <div>
                    <h2 className={`text-xl font-vt323 tracking-widest ${hasBacklogs ? 'text-red-500' : 'text-white/40'}`}>
                        {loading ? 'SCANNING RECORD...' : (hasBacklogs ? 'SYSTEM ALERT :: ARREARS DETECTED' : 'SYSTEM_LOG :: ACADEMIC_RECORD')}
                    </h2>
                </div>
            </div>
            
            <button onClick={onClose} className={`p-1 rounded-full transition-colors ${hasBacklogs ? 'text-red-500/50 hover:bg-red-500/20 hover:text-red-400' : 'text-white/20 hover:text-white hover:bg-white/10'}`}>
                <X size={20} />
            </button>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-50">
                    <Loader className="animate-spin mb-4" />
                    <span className="font-mono text-xs">QUERYING DATABASE...</span>
                </div>
            ) : hasBacklogs ? (
                // CASE 1: BACKLOGS EXIST
                <div className="space-y-6 animate-slideInRight">
                    <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400/80 text-xs font-mono mb-4 flex items-start gap-3">
                        <BookOpen size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold">ATTENTION:</span> {backlogs.reduce((acc, sem) => acc + sem.subjects.length, 0)} subject(s) flagged as uncleared. 
                        </div>
                    </div>

                    {backlogs.map((sem, idx) => (
                        <div key={idx} className="group">
                            <h3 className="text-red-500/60 font-mono text-[10px] uppercase tracking-widest border-b border-red-500/10 pb-1 mb-3 flex justify-between">
                                <span>{sem.semester}</span>
                            </h3>
                            <div className="space-y-2 pl-2 border-l border-red-500/10">
                                {sem.subjects.map((sub, sIdx) => (
                                    <div key={sIdx} className="flex items-center justify-between p-2 hover:bg-red-500/5 transition-colors border border-transparent hover:border-red-500/20 rounded-sm">
                                        <div className="flex flex-col">
                                            <span className="text-red-200 font-mono text-xs font-bold">{sub.name}</span>
                                            <span className="text-[10px] text-red-500/40 font-mono tracking-wider">{sub.code} • {sub.credits} CREDITS • {sub.type}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-red-500 font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded-sm border border-red-500/20">FAILED</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // CASE 2: CLEAN RECORD
                <div className="h-64 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-70 transition-opacity duration-500">
                    <ShieldCheck size={48} className="mb-4 text-white/30" strokeWidth={1} />
                    <div className="text-lg font-mono text-white/60 tracking-widest uppercase">No Active Arrears</div>
                    <div className="text-[10px] font-mono text-white/30 mt-2 max-w-xs leading-relaxed">
                        Database query complete. <br/> All previous semester credits have been successfully secured.
                    </div>
                </div>
            )}
        </div>

        {/* --- FOOTER --- */}
        <div className={`p-3 border-t text-[9px] flex justify-between uppercase tracking-wider font-mono ${hasBacklogs ? 'border-red-500/20 bg-red-900/5 text-red-500/40' : 'border-white/5 bg-black/50 text-white/20'}`}>
            <span>Scan ID: {Math.floor(Math.random()*100000)}</span>
            <span className="flex items-center gap-2">
                STATUS: {hasBacklogs ? 'ACTION REQUIRED' : 'NOMINAL'}
                <span className={`w-1.5 h-1.5 rounded-full ${hasBacklogs ? 'bg-red-500 animate-pulse' : 'bg-green-500/50'}`}></span>
            </span>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, CheckSquare, X, AlertTriangle, Calculator, Calendar, Save } from 'lucide-react';

export default function ExamRegistration({ student, onBack }) {
  const [loading, setLoading] = useState(true);
  const [nextSemester, setNextSemester] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [regularSubjects, setRegularSubjects] = useState([]);
  const [eligibleBacklogs, setEligibleBacklogs] = useState([]);
  const [selectedBacklogs, setSelectedBacklogs] = useState([]);

  const REGULAR_FEE = 1500;
  const BACKLOG_FEE_PER_PAPER = 500;

  useEffect(() => {
    if (student) initializeRegistration();
  }, [student]);

  const initializeRegistration = async () => {
    try {
        setLoading(true);
        const currentSem = parseInt(student.semester) || 0;
        const targetSem = currentSem + 1; 
        setNextSemester(targetSem);
        const isTargetOdd = targetSem % 2 !== 0;

        // 1. Fetch Regular Subjects
        const { data: regularData } = await supabase.from('subjects').select('*').eq('semester_default', targetSem); 
        setRegularSubjects((regularData || []).map(s => ({ code: s.code, name: s.name, credits: s.default_credits })));

        // 2. Fetch Backlogs
        const { data: backlogs } = await supabase
            .from('backlogs')
            .select(`id, semester_origin, subject_code, subjects ( name, default_credits )`)
            .eq('student_reg_no', student.registration_number)
            .eq('status', 'ACTIVE'); 

        const filtered = (backlogs || []).filter(b => (parseInt(b.semester_origin) % 2 !== 0) === isTargetOdd);
        setEligibleBacklogs(filtered.map(b => ({
            id: b.id, 
            origin: b.semester_origin, 
            code: b.subject_code, 
            name: b.subjects?.name || "UNKNOWN", 
            credits: b.subjects?.default_credits || 0 
        })));

    } catch (err) {
        console.error("Init Error:", err);
    } finally {
        setLoading(false);
    }
  };

  const calculateTotal = () => REGULAR_FEE + (selectedBacklogs.length * BACKLOG_FEE_PER_PAPER);

  const handleRegister = async () => {
      const regularCodes = regularSubjects.map(s => s.code);
      const backlogCodes = eligibleBacklogs.filter(b => selectedBacklogs.includes(b.id)).map(b => b.code);
      const allSubjects = [...regularCodes, ...backlogCodes];
      const totalAmount = calculateTotal();

      try {
          // INSERT INTO DB AS PENDING
          const { error } = await supabase.from('exam_registrations').insert({
              student_reg_no: student.registration_number,
              semester: nextSemester,
              selected_subjects: allSubjects,
              total_amount: totalAmount,
              payment_status: 'PENDING'
          });

          if (error) throw error;

          setSuccessMsg("REGISTRATION SAVED");
      } catch (err) {
          console.error("Save Error:", err);
          alert("Registration Failed: " + err.message);
      }
  };

  if (loading) return <div className="p-10 text-terminal animate-pulse text-center text-2xl font-vt323">&gt;&gt; SYNCING ACADEMIC DATA...</div>;

  if (successMsg) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn">
              <div className="text-center p-10 border-2 border-green-500 bg-black">
                  <h1 className="text-4xl font-vt323 text-green-500 mb-2">{successMsg}</h1>
                  <p className="text-white/60 font-mono mb-6">Your application is now pending payment.</p>
                  <button onClick={onBack} className="bg-green-600 text-black font-bold px-6 py-2 hover:bg-green-500">
                      RETURN TO DASHBOARD
                  </button>
                  <div className="text-xs text-white/40 mt-4">Go to "Challan Generation" to complete payment.</div>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn p-4 overflow-y-auto">
        <div className="w-full max-w-5xl bg-black border-2 border-terminal relative shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col md:flex-row min-h-[600px]">
            <button onClick={onBack} className="absolute top-4 right-4 text-red-500 hover:text-white z-50"><X size={24} /></button>

            {/* Left Panel (Subjects) */}
            <div className="flex-1 p-8 border-r border-terminal/30 overflow-y-auto custom-scrollbar">
                <div className="mb-8 border-b-2 border-terminal pb-4">
                    <h1 className="text-4xl font-vt323 text-white">SEMESTER {nextSemester}</h1>
                    <div className="text-green-400 font-mono text-xs mt-1">SESSION: NOV-DEC 2025</div>
                </div>

                <div className="mb-8">
                    <h3 className="text-terminal font-bold mb-4 flex items-center gap-2 bg-terminal/10 p-2 border-l-4 border-terminal"><BookOpen size={18} /> REGULAR COURSES</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {regularSubjects.map(sub => (
                            <div key={sub.code} className="flex justify-between p-3 bg-white/5 border border-white/10">
                                <div className="text-sm font-bold text-white">{sub.name}</div>
                                <div className="text-xs font-mono text-terminal/60">{sub.code}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 bg-red-900/10 p-2 border-l-4 border-red-500"><AlertTriangle size={18} /> BACKLOGS</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {eligibleBacklogs.map(b => (
                            <div key={b.id} onClick={() => setSelectedBacklogs(prev => prev.includes(b.id) ? prev.filter(x => x!==b.id) : [...prev, b.id])} 
                                 className={`flex justify-between p-3 border cursor-pointer ${selectedBacklogs.includes(b.id) ? 'border-red-500 bg-red-900/20' : 'border-white/10'}`}>
                                <div className="flex gap-3">
                                    <div className={`w-5 h-5 border flex items-center justify-center ${selectedBacklogs.includes(b.id) ? 'bg-red-500 border-red-500' : 'border-white/40'}`}>{selectedBacklogs.includes(b.id) && <CheckSquare size={14}/>}</div>
                                    <div className="text-sm font-bold text-white">{b.name}</div>
                                </div>
                                <div className="text-xs text-red-400">+ ₹{BACKLOG_FEE_PER_PAPER}</div>
                            </div>
                        ))}
                        {eligibleBacklogs.length === 0 && <div className="text-white/30 italic text-sm p-4 text-center">No eligible arrears.</div>}
                    </div>
                </div>
            </div>

            {/* Right Panel (Summary) */}
            <div className="w-full md:w-80 bg-white/5 p-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-6 text-terminal"><Calculator size={20} /><span className="font-bold text-lg">FEE SUMMARY</span></div>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm"><span className="text-white/60">Regular Fee</span><span className="text-white">₹{REGULAR_FEE}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-white/60">Backlogs ({selectedBacklogs.length})</span><span className="text-white">₹{selectedBacklogs.length * BACKLOG_FEE_PER_PAPER}</span></div>
                        <div className="h-px bg-white/20 my-2"></div>
                        <div className="flex justify-between text-xl font-bold text-yellow-400"><span>TOTAL</span><span>₹{calculateTotal()}</span></div>
                    </div>
                </div>
                <button onClick={handleRegister} className="w-full bg-terminal text-black py-4 font-bold text-lg hover:bg-white flex items-center justify-center gap-2">
                    <Save size={20} /> SAVE & REGISTER
                </button>
            </div>
        </div>
    </div>
  );
}
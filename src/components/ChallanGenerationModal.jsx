import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FileText, ArrowRight, X, Loader, CheckCircle, Copy, Clock, AlertCircle } from 'lucide-react';

export default function ChallanGenerationModal({ student, onBack }) {
  const [loading, setLoading] = useState(true);
  const [availableDues, setAvailableDues] = useState([]);
  const [activeChallans, setActiveChallans] = useState([]);
  const [generatedChallan, setGeneratedChallan] = useState(null); // For immediate feedback after generation

  useEffect(() => {
    fetchData();
  }, [student]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Dues (Exams & Tuition)
      const { data: exams } = await supabase
        .from('exam_registrations')
        .select('*')
        .eq('student_reg_no', student.registration_number)
        .eq('payment_status', 'PENDING');

      const { data: tuition } = await supabase
        .from('tuition_dues')
        .select('*')
        .eq('student_reg_no', student.registration_number)
        .eq('status', 'UNPAID');

      // 2. Fetch Existing Pending Payments to check for active challans
      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_reg_no', student.registration_number)
        .eq('status', 'PENDING');

      // 3. Process & Categorize
      const newAvailable = [];
      const newActive = [];
      const now = new Date();

      // Helper to check payment validity (24 Hours)
      const findActivePayment = (metaKey, metaValue) => {
        return pendingPayments?.find(p => {
            const isMatch = p.metadata && p.metadata[metaKey] === metaValue;
            if (!isMatch) return false;
            
            // Check Expiration (24 Hours)
            const createdTime = new Date(p.created_at);
            const hoursDiff = (now - createdTime) / (1000 * 60 * 60);
            return hoursDiff < 24; 
        });
      };

      // Process Exams
      if (exams) {
        exams.forEach(ex => {
            const activePay = findActivePayment('registration_id', ex.id);
            const item = {
                id: ex.id,
                type: 'EXAM',
                title: `Semester ${ex.semester} Exam Fee`,
                amount: ex.total_amount,
                metadata: { registration_id: ex.id, semester: ex.semester }
            };

            if (activePay) {
                newActive.push({ ...item, challan_no: activePay.challan_no, expires_at: new Date(new Date(activePay.created_at).getTime() + 24*60*60*1000) });
            } else {
                newAvailable.push(item);
            }
        });
      }

      // Process Tuition
      if (tuition) {
        tuition.forEach(td => {
            const activePay = findActivePayment('due_id', td.id);
            const item = {
                id: td.id,
                type: 'TUITION',
                title: `Tuition Fee - Year ${td.year}`,
                amount: td.amount_due,
                metadata: { due_id: td.id, year: td.year }
            };

            if (activePay) {
                newActive.push({ ...item, challan_no: activePay.challan_no, expires_at: new Date(new Date(activePay.created_at).getTime() + 24*60*60*1000) });
            } else {
                newAvailable.push(item);
            }
        });
      }

      setAvailableDues(newAvailable);
      setActiveChallans(newActive);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (item) => {
    setLoading(true);
    const newChallanNo = `CHL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
        const { error } = await supabase.from('payments').insert({
            challan_no: newChallanNo,
            student_reg_no: student.registration_number,
            payment_type: item.type,
            amount: item.amount,
            metadata: item.metadata,
            status: 'PENDING'
        });

        if (error) throw error;

        // Show Success View immediately
        setGeneratedChallan({
            number: newChallanNo,
            amount: item.amount,
            type: item.title
        });
        
        // Refresh background list
        fetchData(); 

    } catch (err) {
        console.error("Challan Gen Error:", err);
        alert("SYSTEM ERROR: Could not generate challan.");
        setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      alert("Challan Number Copied!");
  };

  // --- SUCCESS VIEW (Just Generated) ---
  if (generatedChallan) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn p-4">
            <div className="w-full max-w-md bg-black border-2 border-green-500 p-8 relative text-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                <button onClick={() => setGeneratedChallan(null)} className="absolute top-4 right-4 text-green-500 hover:text-white"><X size={24} /></button>
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-vt323 text-green-500 mb-2">GENERATION SUCCESSFUL</h1>
                <div className="bg-white/10 p-6 border border-green-500/50 mb-6 relative">
                    <div className="text-xs text-green-400 tracking-widest mb-1">ACTIVE CHALLAN ID</div>
                    <div className="text-3xl font-vt323 text-white tracking-wider">{generatedChallan.number}</div>
                    <button onClick={() => copyToClipboard(generatedChallan.number)} className="absolute right-2 top-2 p-2 text-white/50 hover:text-white"><Copy size={18} /></button>
                </div>
                <button onClick={() => setGeneratedChallan(null)} className="w-full border border-green-500 text-green-500 hover:bg-green-500 hover:text-black py-2 font-bold">
                    RETURN TO LIST
                </button>
            </div>
        </div>
      );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn p-4">
        <div className="w-full max-w-3xl bg-black border-2 border-blue-500 p-8 relative shadow-[0_0_40px_rgba(59,130,246,0.3)] flex flex-col max-h-[80vh]">
            <button onClick={onBack} className="absolute top-4 right-4 text-blue-500 hover:text-white"><X size={24} /></button>

            <h1 className="text-3xl font-vt323 text-blue-500 mb-2">CHALLAN GENERATION HUB</h1>
            <div className="text-white/60 font-mono text-sm mb-6 border-b border-blue-500/30 pb-4">
                Manage your payment tokens. IDs expire after 24 hours.
            </div>

            {loading ? (
                <div className="text-center py-20 text-blue-400 animate-pulse flex flex-col items-center gap-3">
                    <Loader className="animate-spin" /> SYNCHRONIZING LEDGER...
                </div>
            ) : (
                <div className="overflow-y-auto custom-scrollbar pr-2 space-y-8">
                    
                    {/* SECTION 1: ACTIVE CHALLANS */}
                    <div>
                        <div className="flex items-center gap-2 text-green-400 font-bold mb-3 text-sm tracking-wider">
                            <Clock size={16} /> ACTIVE CHALLANS (Ready for Payment)
                        </div>
                        {activeChallans.length === 0 ? (
                            <div className="text-white/30 text-xs italic border border-dashed border-white/10 p-3">No active challans found.</div>
                        ) : (
                            <div className="space-y-3">
                                {activeChallans.map((item) => (
                                    <div key={item.id} className="bg-green-900/10 border border-green-500/30 p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-lg font-vt323 text-white">{item.title}</div>
                                            <div className="text-xs text-green-400/70 font-mono flex items-center gap-2">
                                                ID: {item.challan_no} 
                                                <button onClick={() => copyToClipboard(item.challan_no)} className="hover:text-white"><Copy size={12}/></button>
                                            </div>
                                            <div className="text-[10px] text-white/40 mt-1">Expires: {item.expires_at.toLocaleTimeString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white mb-1">₹{item.amount}</div>
                                            <div className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-bold">ACTIVE</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: PENDING DUES */}
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 font-bold mb-3 text-sm tracking-wider">
                            <AlertCircle size={16} /> PENDING DUES (Generate Challan)
                        </div>
                        {availableDues.length === 0 ? (
                            <div className="text-white/30 text-xs italic border border-dashed border-white/10 p-3">No pending dues available for generation.</div>
                        ) : (
                            <div className="space-y-3">
                                {availableDues.map((item) => (
                                    <div key={item.id} className="bg-blue-900/10 border border-blue-500/30 p-4 flex justify-between items-center group hover:bg-blue-900/20 transition-all">
                                        <div>
                                            <div className="text-lg font-vt323 text-white">{item.title}</div>
                                            <div className="text-xs text-blue-400/70 font-mono">{item.type}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-xl font-bold text-white">₹{item.amount}</div>
                                            <button 
                                                onClick={() => handleGenerate(item)}
                                                className="bg-blue-600 text-white px-3 py-1.5 text-sm font-bold hover:bg-blue-500 flex items-center gap-2"
                                            >
                                                GENERATE <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    </div>
  );
}
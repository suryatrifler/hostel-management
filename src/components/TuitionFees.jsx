import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DollarSign, AlertCircle, X, Check, ChevronDown, Calendar, Loader, Clock } from 'lucide-react';

export default function TuitionFees({ student, onProceedToPay, onBack }) {
  const [loading, setLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState('');

  useEffect(() => {
    fetchLedgerData();
  }, [student]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      
      // Fetch from the new STRICT LEDGER table
      // We look for any status that implies money is owed
      const { data, error } = await supabase
        .from('tuition_ledger')
        .select('*')
        .eq('student_reg_no', student.registration_number)
        .in('status', ['UNPAID', 'PARTIAL', 'OVERDUE']) 
        .order('due_date', { ascending: true });

      if (error) throw error;

      setLedgerEntries(data || []);
      
      // Auto-select first item
      if (data && data.length > 0) {
        setSelectedEntryId(data[0].id);
      }

    } catch (err) {
      console.error("Ledger Access Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate outstanding balance
  const getSelectedEntry = () => {
      const entry = ledgerEntries.find(e => e.id === selectedEntryId);
      if (!entry) return null;
      return {
          ...entry,
          balance: entry.total_amount - entry.paid_amount
      };
  };

  const selectedEntry = getSelectedEntry();

  const handleAddToQueue = () => {
    if (!selectedEntry) return;
    // Proceed to Challan Hub
    onProceedToPay(); 
  };

  // --- LOADING STATE ---
  if (loading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="text-terminal animate-pulse flex flex-col items-center gap-2">
                <Loader className="animate-spin" /> 
                <span className="font-vt323 text-xl">SYNCING SECURE LEDGER...</span>
            </div>
        </div>
      );
  }

  // --- ALL CLEAR STATE ---
  if (ledgerEntries.length === 0) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn p-4">
              <div className="w-full max-w-lg bg-black border-2 border-green-500 p-10 text-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <button onClick={onBack} className="absolute top-4 right-4 text-green-500 hover:text-white"><X size={24} /></button>
                  <div className="text-6xl mb-4">🛡️</div>
                  <div className="text-4xl font-vt323 text-green-500 mb-2">LEDGER BALANCED</div>
                  <div className="text-white/60 font-mono text-sm mb-6">No outstanding dues found in the master record.</div>
                  <button onClick={onBack} className="text-green-400 underline hover:text-white">Return to Dashboard</button>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn p-4">
        <div className="w-full max-w-2xl bg-black border-2 border-red-500/50 p-10 relative shadow-[0_0_40px_rgba(220,38,38,0.2)]">
            <button onClick={onBack} className="absolute top-4 right-4 text-red-500 hover:text-white"><X size={24} /></button>
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-red-500/30 pb-4">
                <div className="p-3 bg-red-500/10 rounded-full text-red-500"><AlertCircle size={32} /></div>
                <div>
                    <h1 className="text-3xl font-vt323 text-white">TUITION LEDGER</h1>
                    <div className="text-red-400 font-mono text-sm flex items-center gap-2">
                        SECURE RECORD ACCESS <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                
                {/* Left: Selection Dropdown */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-red-400/70 mb-2 font-mono text-sm">SELECT FISCAL PERIOD</label>
                    <div className="relative">
                        <select 
                            value={selectedEntryId}
                            onChange={(e) => setSelectedEntryId(e.target.value)}
                            className="w-full bg-black border border-red-500 text-white p-3 text-lg outline-none appearance-none cursor-pointer focus:shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                        >
                            {ledgerEntries.map(entry => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.academic_year} (SEM {entry.semester})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-4 text-red-500 pointer-events-none" size={18} />
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`mt-2 inline-block px-3 py-1 text-xs font-bold rounded ${
                        selectedEntry?.status === 'OVERDUE' ? 'bg-red-600 text-white' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                        STATUS: {selectedEntry?.status}
                    </div>
                </div>

                {/* Right: Deadline Info */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-red-400/70 mb-2 font-mono text-sm">PAYMENT DEADLINE</label>
                    <div className="flex items-center gap-3 bg-white/5 p-3 border border-white/10">
                        <Calendar className="text-red-400" size={20} />
                        <span className="text-xl font-vt323 text-white">
                            {selectedEntry?.due_date}
                        </span>
                    </div>
                    {selectedEntry?.status === 'OVERDUE' && (
                        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                            <Clock size={12} /> Late fees may apply per audit rules.
                        </div>
                    )}
                </div>

                {/* Bottom: Amount Display */}
                <div className="col-span-2 bg-red-900/10 p-6 border border-red-500/30 flex justify-between items-center">
                    <div>
                        <div className="text-xs text-red-400 font-bold tracking-widest mb-1">OUTSTANDING BALANCE</div>
                        <div className="text-xs text-white/40">
                            Total: ₹{selectedEntry?.total_amount?.toLocaleString()} | Paid: ₹{selectedEntry?.paid_amount?.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-white font-mono flex items-center">
                        <DollarSign size={28} className="text-red-500 mr-1" />
                        {selectedEntry?.balance?.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={handleAddToQueue}
                className="w-full bg-red-600 text-white py-4 font-bold text-lg hover:bg-red-500 transition-all flex justify-center items-center gap-3 shadow-[0_4px_0_#991b1b] active:shadow-none active:translate-y-1"
            >
                ADD TO CHALLAN QUEUE <Check size={24} />
            </button>
            
            <div className="text-center mt-3 text-[10px] text-white/30 font-mono">
                Transaction will be logged in `fee_audit_trail` upon completion.
            </div>
        </div>
    </div>
  );
}
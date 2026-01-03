import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, QrCode, X, Loader, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';

export default function ChallanManager({ student, onBack, onComplete, paymentContext }) {
  // Pre-fill input if context exists (from auto-redirect)
  const [challanInput, setChallanInput] = useState(paymentContext?.challan_no || '');
  const [challanData, setChallanData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // UPI State
  const [showQR, setShowQR] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- 1. FETCH CHALLAN DETAILS ---
  const handleSearch = async () => {
    if (!challanInput) return;
    setLoading(true);
    setError('');
    setChallanData(null);
    setShowQR(false);

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('challan_no', challanInput)
        .eq('student_reg_no', student.registration_number)
        .single();

      if (error) throw new Error("Challan not found or access denied.");
      if (data.status === 'SUCCESS') throw new Error("This challan is already paid.");

      setChallanData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger search if context was passed
  React.useEffect(() => {
    if (paymentContext?.autoRedirect && !challanData) {
        // If passed via context (e.g. from Hostel), we might need to look it up 
        // OR if you haven't generated the record yet, you might need to insert it here.
        // Assuming the previous step (Modal) generated it, we just search:
        // (If you skipped generation, we'd handle that differently, but let's assume search flow)
    }
  }, []);

  // --- 2. GENERATE UPI QR URL ---
  const getQrUrl = () => {
      if (!challanData) return '';
      // VPA: Virtual Payment Address (Replace with your actual college VPA)
      const vpa = "college.fees@sbi"; 
      const name = "COLLEGE ADMIN";
      const note = `CHALLAN:${challanData.challan_no}`; // Remarks
      const amount = challanData.amount;
      
      // Standard UPI Link Format
      const upiString = `upi://pay?pa=${vpa}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
      
      // Generate QR Image using public API
      return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
  };

  // --- 3. HANDLE UTR SUBMISSION ---
  const verifyAndCloseChallan = async () => {
    if (!utrNumber || utrNumber.length < 6) {
        alert("Please enter a valid 12-digit UTR/Reference Number.");
        return;
    }

    setSubmitting(true);

    try {
      // A. Update Payments Table
      const { error: payError } = await supabase
        .from('payments')
        .update({
          status: 'SUCCESS',
          transaction_id: utrNumber, // Store UTR
          payment_date: new Date()
        })
        .eq('challan_no', challanData.challan_no);

      if (payError) throw payError;

      // B. Update Specific Ledgers based on Type
      if (challanData.payment_type === 'TUITION' && challanData.metadata?.due_id) {
          const { data: ledgerEntry } = await supabase
            .from('tuition_ledger')
            .select('paid_amount')
            .eq('id', challanData.metadata.due_id)
            .single();

          if (ledgerEntry) {
              await supabase.from('tuition_ledger').update({
                  paid_amount: ledgerEntry.paid_amount + challanData.amount,
                  status: 'PAID'
              }).eq('id', challanData.metadata.due_id);
          }
      }
      
      if (challanData.payment_type === 'EXAM' && challanData.metadata?.registration_id) {
          await supabase.from('exam_registrations').update({
              payment_status: 'PAID',
              is_approved: true
          }).eq('id', challanData.metadata.registration_id);
      }

      alert("PAYMENT VERIFIED & RECORDED!");
      if (onComplete) onComplete();

    } catch (err) {
      console.error("Database Update Failed:", err);
      alert("Error updating records. Please save your UTR: " + utrNumber);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 p-8 border-2 border-terminal bg-black/95 relative shadow-[0_0_50px_rgba(0,240,255,0.15)] animate-slideIn min-h-[600px] flex flex-col">
      <button onClick={onBack} className="absolute top-4 right-4 text-red-500 hover:text-white"><X /></button>
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b-2 border-terminal pb-4">
        <QrCode size={40} className="text-terminal" />
        <div>
          <h1 className="text-4xl font-vt323 text-white">DIGITAL PAYMENT TERMINAL</h1>
          <div className="text-terminal/60 font-mono text-sm">UPI 2.0 INTERFACE :: ONLINE</div>
        </div>
      </div>

      {/* 1. Search Section */}
      {!challanData && (
        <div className="flex flex-col items-center justify-center flex-1">
           <label className="text-terminal mb-4 font-mono tracking-widest">ENTER CHALLAN IDENTIFIER:</label>
           <div className="flex w-full max-w-md border-b-2 border-terminal mb-2">
             <input 
               type="text" 
               value={challanInput}
               onChange={(e) => setChallanInput(e.target.value.toUpperCase())}
               placeholder="CHL-202X-XXXXXX"
               className="flex-1 bg-transparent text-white text-3xl font-vt323 p-2 outline-none placeholder-white/20 uppercase"
             />
             <button onClick={handleSearch} disabled={loading} className="text-terminal hover:text-white px-4">
               {loading ? <Loader className="animate-spin"/> : <Search size={28}/>}
             </button>
           </div>
           {error && <div className="mt-4 text-red-500 font-mono bg-red-900/20 p-2 border border-red-500">{error}</div>}
        </div>
      )}

      {/* 2. Payment Interface */}
      {challanData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
          
          {/* Left: Receipt Details */}
          <div className="bg-white text-black p-6 font-mono text-sm relative shadow-lg transform rotate-1 h-fit">
             <div className="border-b-2 border-dashed border-black pb-4 mb-4 text-center">
                <h2 className="font-bold text-xl">OFFICIAL RECEIPT</h2>
                <p>MERCHANT: COLLEGE ADMIN</p>
             </div>
             <div className="space-y-4 text-lg">
                <div className="flex justify-between"><span>ID:</span><span className="font-bold">{challanData.challan_no}</span></div>
                <div className="flex justify-between"><span>STUDENT:</span><span>{challanData.student_reg_no}</span></div>
                <div className="border-b border-black my-2"></div>
                <div className="flex justify-between font-bold">
                    <span>{challanData.payment_type} FEE</span>
                </div>
                <div className="flex justify-between text-3xl font-bold mt-4">
                    <span>TOTAL:</span><span>₹{challanData.amount}</span>
                </div>
             </div>
             <div className="mt-8 text-center text-xs opacity-60">
                ** PENDING VERIFICATION **
             </div>
          </div>

          {/* Right: QR & Action */}
          <div className="flex flex-col items-center">
             
             {!showQR ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="bg-blue-900/20 border border-blue-500 p-4 w-full text-center">
                        <div className="flex justify-center mb-2 text-blue-400"><ShieldCheck size={32}/></div>
                        <div className="text-white font-bold">READY TO PAY</div>
                        <div className="text-white/60 text-sm">Generate secure UPI QR code for ₹{challanData.amount}</div>
                    </div>
                    <button 
                        onClick={() => setShowQR(true)}
                        className="w-full bg-terminal hover:bg-white text-black py-4 font-bold text-xl shadow-[0_0_20px_rgba(255,176,0,0.4)] transition-all flex items-center justify-center gap-3"
                    >
                        <QrCode /> GENERATE QR CODE
                    </button>
                </div>
             ) : (
                <div className="w-full flex flex-col items-center animate-fadeIn">
                    <div className="bg-white p-4 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-6">
                        <img src={getQrUrl()} alt="UPI QR" className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply" />
                    </div>
                    
                    <div className="w-full bg-white/5 border border-white/10 p-4 mb-4">
                        <ol className="text-sm text-white/70 space-y-2 list-decimal list-inside font-mono">
                            <li>Open any UPI App (GPay, PhonePe, Paytm).</li>
                            <li>Scan the QR code above.</li>
                            <li>Verify payee is <strong>COLLEGE ADMIN</strong>.</li>
                            <li>Complete payment of <strong>₹{challanData.amount}</strong>.</li>
                            <li className="text-terminal">Enter the UTR / Ref Number below.</li>
                        </ol>
                    </div>

                    <div className="w-full flex gap-2">
                        <input 
                            type="text" 
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                            placeholder="ENTER 12-DIGIT UTR / REF NO"
                            className="flex-1 bg-black border border-terminal text-white p-3 font-mono outline-none focus:bg-terminal/10"
                        />
                        <button 
                            onClick={verifyAndCloseChallan}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader className="animate-spin"/> : <ArrowRight />}
                        </button>
                    </div>
                </div>
             )}

             <button 
                onClick={() => { setChallanData(null); setShowQR(false); }} 
                className="mt-auto text-red-500 hover:text-white border-b border-transparent hover:border-red-500 py-2 text-sm"
             >
                CANCEL SESSION
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
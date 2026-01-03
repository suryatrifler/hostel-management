import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CreditCard, QrCode, CheckCircle, AlertTriangle, Loader, Printer } from 'lucide-react';

export default function ChallanManager({ student, paymentContext, onComplete, onBack }) {
  // paymentContext = { type: 'EXAM'|'HOSTEL'|'TUITION', amount: 500, metadata: {...}, autoRedirect: boolean }
  
  const [step, setStep] = useState(paymentContext?.autoRedirect ? 'payment' : 'generate');
  const [challanNo, setChallanNo] = useState(paymentContext?.challanNo || '');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // --- 1. CHALLAN GENERATION LOGIC ---
  const generateChallan = async () => {
    setLoading(true);
    const newChallan = `CHL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      const { error } = await supabase.from('payments').insert({
        challan_no: newChallan,
        student_reg_no: student.registration_number,
        payment_type: paymentContext.type,
        amount: paymentContext.amount,
        metadata: paymentContext.metadata,
        status: 'PENDING'
      });

      if (error) throw error;
      
      setChallanNo(newChallan);
      setStep('payment'); // Move to payment screen
    } catch (err) {
      console.error("Challan Gen Error:", err);
      alert("SYSTEM ERROR: COULD NOT GENERATE CHALLAN");
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger for Hostel
  useEffect(() => {
    if (paymentContext?.autoRedirect && !challanNo) {
        generateChallan();
    }
  }, []);

  // --- 2. PAYMENT LOGIC ---
  const processPayment = async () => {
    setLoading(true);
    
    // Simulate Bank Delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const txnId = `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    try {
      // A. Update Payment Record
      const { error: payError } = await supabase
        .from('payments')
        .update({ 
            status: 'SUCCESS', 
            transaction_id: txnId, 
            payment_date: new Date().toISOString() 
        })
        .eq('challan_no', challanNo);

      if (payError) throw payError;

      // B. Context Specific Actions
      if (paymentContext.type === 'HOSTEL') {
          // Finalize Room Booking
          await supabase.from('students').update({ room_id: paymentContext.metadata.room_id }).eq('registration_number', student.registration_number);
          // Clear Lock (Trigger will handle concurrency usually, but safety first)
          await supabase.from('room_locks').delete().eq('room_id', paymentContext.metadata.room_id);
      }
      else if (paymentContext.type === 'EXAM') {
          // Create Registration Record
          await supabase.from('exam_registrations').insert({
              student_reg_no: student.registration_number,
              semester: paymentContext.metadata.semester,
              challan_no: challanNo
          });
      }
      else if (paymentContext.type === 'TUITION') {
          await supabase.from('tuition_dues').update({ status: 'PAID' }).eq('id', paymentContext.metadata.due_id);
      }

      setReceipt({ txnId, date: new Date().toLocaleDateString(), amount: paymentContext.amount });
      setStep('receipt');

    } catch (err) {
      console.error(err);
      alert("TRANSACTION FAILED. TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERERS ---

  if (step === 'generate') {
    return (
      <div className="p-8 max-w-lg mx-auto border-2 border-terminal bg-black/90 mt-10 text-center animate-slideIn">
        <h2 className="text-3xl font-vt323 text-terminal mb-4">CHALLAN GENERATION</h2>
        <div className="text-left font-mono text-sm space-y-2 mb-6 border border-white/20 p-4">
            <div>TYPE: <span className="text-white">{paymentContext.type}</span></div>
            <div>AMOUNT: <span className="text-yellow-400 font-bold">₹{paymentContext.amount}</span></div>
            <div>STUDENT: {student.full_name}</div>
        </div>
        <button 
            onClick={generateChallan} 
            disabled={loading}
            className="bg-terminal text-black px-6 py-2 font-bold hover:bg-white w-full flex items-center justify-center gap-2"
        >
            {loading ? <Loader className="animate-spin"/> : <QrCode />} GENERATE CHALLAN
        </button>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="p-8 max-w-lg mx-auto border-2 border-terminal bg-black/90 mt-10 animate-slideIn">
        <h2 className="text-2xl font-vt323 text-terminal mb-6 flex items-center gap-2">
            <CreditCard /> SECURE PAYMENT GATEWAY
        </h2>
        
        <div className="bg-white/5 p-4 mb-6">
            <div className="text-xs text-gray-400">CHALLAN NUMBER</div>
            <div className="text-3xl font-mono text-white tracking-wider">{challanNo}</div>
        </div>

        <div className="space-y-4">
            <input type="text" placeholder="CARD NUMBER (XXXX-XXXX-XXXX-XXXX)" className="w-full bg-transparent border-b border-terminal text-white p-2 outline-none font-mono" />
            <div className="flex gap-4">
                <input type="text" placeholder="EXP (MM/YY)" className="w-1/2 bg-transparent border-b border-terminal text-white p-2 outline-none font-mono" />
                <input type="password" placeholder="CVV" className="w-1/2 bg-transparent border-b border-terminal text-white p-2 outline-none font-mono" />
            </div>
        </div>

        <div className="flex gap-4 mt-8">
            <button onClick={processPayment} disabled={loading} className="flex-1 bg-green-600 text-white py-3 font-bold hover:bg-green-500 flex justify-center items-center gap-2">
                {loading ? 'PROCESSING...' : `PAY ₹${paymentContext.amount}`}
            </button>
            <button onClick={onBack} disabled={loading} className="px-4 border border-red-500 text-red-500 hover:bg-red-900/20">CANCEL</button>
        </div>
      </div>
    );
  }

  if (step === 'receipt') {
    return (
      <div className="p-8 max-w-md mx-auto border-2 border-green-500 bg-black/90 mt-10 text-center animate-slideIn">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-vt323 text-green-500 mb-2">PAYMENT SUCCESSFUL</h2>
        <div className="text-white/60 text-sm mb-6">Your transaction has been recorded.</div>
        
        <div className="bg-white text-black p-6 font-mono text-left text-sm relative">
            <div className="border-b-2 border-black pb-2 mb-4 font-bold text-center">E-RECEIPT</div>
            <div className="flex justify-between mb-1"><span>TXN ID:</span> <span>{receipt.txnId}</span></div>
            <div className="flex justify-between mb-1"><span>DATE:</span> <span>{receipt.date}</span></div>
            <div className="flex justify-between mb-1"><span>CHALLAN:</span> <span>{challanNo}</span></div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-black"><span>TOTAL:</span> <span>₹{receipt.amount}</span></div>
        </div>

        <button onClick={onComplete} className="mt-6 text-green-500 hover:text-white underline">
            [ RETURN TO DASHBOARD ]
        </button>
      </div>
    );
  }
}
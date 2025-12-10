import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CreditCard, Clock, CheckCircle, XCircle, Loader, ShieldCheck } from 'lucide-react';

export default function PaymentGateway({ student, room, onCancel, onSuccess }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 Minutes (300s)
  const [status, setStatus] = useState('pending'); // pending, processing, success, failed
  const [lockId, setLockId] = useState(null);

  // 1. INITIALIZE: Create the Lock in Database
  useEffect(() => {
    const createLock = async () => {
      try {
        const { data, error } = await supabase
          .from('room_locks')
          .insert({
            room_id: room.id,
            student_id: student.id
          })
          .select()
          .single();

        if (error) throw error;
        setLockId(data.id);
      } catch (err) {
        console.error("Lock Failed:", err);
        alert("ROOM JUST TAKEN! Please select another.");
        onCancel();
      }
    };
    createLock();
  }, []);

  // 2. TIMER LOGIC
  useEffect(() => {
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 3. CLEANUP: Remove lock if user cancels or times out
  const releaseLock = async () => {
    if (lockId) {
      await supabase.from('room_locks').delete().eq('id', lockId);
    }
  };

  const handleTimeout = async () => {
    await releaseLock();
    setStatus('failed');
    setTimeout(onCancel, 3000); // Auto close after 3s
  };

  const handlePayment = async () => {
    setStatus('processing');
    
    // Simulate API delay
    setTimeout(async () => {
      try {
        // A. Insert Payment Record
        const { error: payError } = await supabase.from('payments').insert({
          student_id: student.id,
          transaction_id: `TXN_${Math.floor(Math.random() * 999999)}`,
          amount: 25000,
          payment_type: 'Hostel Fee',
          status: 'Success'
        });
        if (payError) throw payError;

        // B. Update Student Room (The actual assignment)
        const { error: studentError } = await supabase
          .from('students')
          .update({ room_id: room.id })
          .eq('id', student.id);
        if (studentError) throw studentError;

        // C. Clean up the lock (No longer needed, user is officially in)
        await releaseLock();

        setStatus('success');
        setTimeout(onSuccess, 2000); // Trigger Dashboard refresh

      } catch (err) {
        console.error(err);
        setStatus('failed');
      }
    }, 2000);
  };

  // Format MM:SS
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border-2 border-terminal bg-black relative animate-slideIn">
        
        {/* Header */}
        <div className="bg-terminal text-black font-bold p-3 flex justify-between items-center">
          <span>SECURE PAYMENT GATEWAY</span>
          <div className="flex items-center gap-2">
            <Clock size={18} />
            <span className="font-mono text-xl">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="p-8 text-center space-y-6">
            
            {status === 'pending' && (
                <>
                    <div className="border border-white/20 p-4 rounded text-left space-y-2">
                        <div className="text-xs opacity-50">BENEFICIARY</div>
                        <div className="text-xl font-bold text-terminal">COLLEGE HOSTEL FUND</div>
                        <div className="text-xs opacity-50 mt-2">AMOUNT</div>
                        <div className="text-3xl font-mono text-white">₹ 25,000.00</div>
                        <div className="text-xs opacity-50 mt-2">ALLOCATION</div>
                        <div className="text-white">BLOCK A - ROOM {room.room_number}</div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handlePayment}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 flex items-center justify-center gap-2 transition-all"
                        >
                            <ShieldCheck size={20} /> AUTHORIZE PAYMENT
                        </button>
                        <button 
                            onClick={() => { releaseLock(); onCancel(); }}
                            className="w-full border border-red-500 text-red-500 py-2 hover:bg-red-500 hover:text-black transition-colors"
                        >
                            CANCEL TRANSACTION
                        </button>
                    </div>
                </>
            )}

            {status === 'processing' && (
                <div className="py-10">
                    <Loader className="w-16 h-16 text-terminal animate-spin mx-auto mb-4" />
                    <div className="text-xl animate-pulse">PROCESSING BANK REQUEST...</div>
                    <div className="text-sm opacity-50">Do not refresh the page.</div>
                </div>
            )}

            {status === 'success' && (
                <div className="py-10">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-green-500">PAYMENT SUCCESSFUL</div>
                    <div className="text-white mt-2">Room {room.room_number} allocated.</div>
                </div>
            )}

            {status === 'failed' && (
                <div className="py-10">
                    <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-red-500">TRANSACTION FAILED</div>
                    <div className="text-white mt-2">Session Timed Out.</div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { AlertTriangle, Send, CheckCircle } from 'lucide-react';

export default function GrievanceModal({ student, onClose }) {
  const [category, setCategory] = useState('HOSTEL');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('grievances')
        .insert({
          student_reg_no: student.registration_number,
          category,
          description
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(onClose, 2000); // Auto close after success
    } catch (err) {
      console.error("Grievance Error:", err);
      alert("SYSTEM ERROR: UNABLE TO LOG GRIEVANCE");
      setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
              <div className="text-center text-green-500 animate-pulse">
                  <CheckCircle size={64} className="mx-auto mb-4"/>
                  <h2 className="text-3xl font-vt323">TICKET LOGGED SUCCESSFULLY</h2>
                  <p className="font-mono text-sm opacity-70">Redirecting...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-black border border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] p-6 relative">
        
        <div className="flex items-center gap-3 text-red-500 border-b border-red-500/30 pb-4 mb-6">
            <AlertTriangle />
            <h2 className="text-2xl font-vt323 tracking-widest">GRIEVANCE TERMINAL</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm">
            
            {/* Category Select */}
            <div>
                <label className="block text-red-400/70 mb-1">ISSUE CATEGORY</label>
                <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-red-950/10 border border-red-500/30 text-white p-2 outline-none focus:border-red-500"
                >
                    <option value="HOSTEL">HOSTEL FACILITIES</option>
                    <option value="ACADEMIC">ACADEMIC / EXAMS</option>
                    <option value="WIFI">NETWORK / WI-FI</option>
                    <option value="RAGGING">DISCIPLINARY / RAGGING</option>
                    <option value="OTHER">OTHER</option>
                </select>
            </div>

            {/* Description */}
            <div>
                <label className="block text-red-400/70 mb-1">DETAILED REPORT</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="5"
                    placeholder="Describe the issue in detail..."
                    className="w-full bg-red-950/10 border border-red-500/30 text-white p-2 outline-none focus:border-red-500 custom-scrollbar resize-none"
                    required
                />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-black font-bold py-2 flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? 'TRANSMITTING...' : <><Send size={16}/> SUBMIT REPORT</>}
                </button>
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-6 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                >
                    CANCEL
                </button>
            </div>

        </form>

        <div className="absolute top-0 right-0 p-2 text-[10px] text-red-500/30 font-mono">
            SECURE CHANNEL :: ENCRYPTED
        </div>
      </div>
    </div>
  );
}
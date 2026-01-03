import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import CRTWrapper from '../components/CRTWrapper';
import { useTypewriter } from '../hooks/useTypewriter';
import StudentDashboard from '../components/StudentDashboard';
import HostelPanel from '../components/HostelPanel';
import Scene3D from '../components/Scene3D';
import AdminLogin from '../components/AdminLogin'; 
import AdminDashboard from '../components/AdminDashboard';
// import TerminalModal from '../components/TerminalModal'; 

// --- NEW MODULES ---
import ChallanManager from '../components/ChallanManager';
import ExamRegistration from '../components/ExamRegistration';
import TuitionFees from '../components/TuitionFees';
import ChallanGenerationModal from '../components/ChallanGenerationModal'; 

// --- EXISTING MODULES ---
import GrievanceModal from '../components/GrievanceModal';
import StudentDetailsModal from '../components/StudentDetailsModal';
import ExamResults from '../components/ExamResults'; 
import BacklogModal from '../components/BacklogModal';

const WELCOME_LOGS = [
  ">> Welcome to [COLLEGE NAME] Terminal Access.",
  ">> System status: ONLINE.",
  ">> Establishing secure connection...",
  ""
];

export default function TerminalHome() {
  const [view, setView] = useState('home'); 
  const [studentData, setStudentData] = useState(null);
  
  const [activeModal, setActiveModal] = useState(null); 
  const [paymentContext, setPaymentContext] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]); 
  
  const { displayedText } = useTypewriter(WELCOME_LOGS, 30);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkUserRole(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserRole(session.user);
      } else {
        setStudentData(null);
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (user) => {
    if (user.email === 'admin@college.edu.in') {
        setView('admin_dashboard');
    } else {
        fetchProfile(user.id);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (data) {
        setStudentData(data);
        if (['home', 'login', 'admin_login'].includes(view)) {
            setView('dashboard');
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchPayments = async () => {
    if (!studentData) return;
    const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('student_reg_no', studentData.registration_number) 
        .order('created_at', { ascending: false });
    setPaymentHistory(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  const handlePaymentInitiated = (ctx) => {
      setActiveModal(null);
      setPaymentContext(ctx); 
      setView('challan_system'); 
  };

  // --- RENDERERS ---
  const renderGenericModalContent = () => {
    switch (activeModal) {
        case 'payment_history':
            if (paymentHistory.length === 0) fetchPayments();
            return (
                <div className="w-full">
                    <table className="w-full text-left border-collapse font-mono text-sm">
                        <thead className="bg-terminal/20 text-terminal sticky top-0">
                            <tr>
                                <th className="p-2 border-b border-terminal">CHALLAN</th>
                                <th className="p-2 border-b border-terminal">TYPE</th>
                                <th className="p-2 border-b border-terminal">AMT</th>
                                <th className="p-2 border-b border-terminal">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistory.map(pay => (
                                <tr key={pay.challan_no} className="border-b border-terminal/20 hover:bg-white/5">
                                    <td className="p-2">{pay.challan_no}</td>
                                    <td className="p-2">{pay.payment_type}</td>
                                    <td className="p-2">₹{pay.amount}</td>
                                    <td className={`p-2 font-bold ${pay.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                                        {pay.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paymentHistory.length === 0 && <div className="p-4 text-center opacity-50">NO RECORDS FOUND</div>}
                </div>
            );
        case 'hall_ticket':
            return (
                <div className="text-center py-12">
                    <div className="animate-spin text-4xl mb-4 text-terminal">⟳</div>
                    <div className="text-xl animate-pulse tracking-widest">FETCHING HALL TICKET...</div>
                    <p className="opacity-50 text-sm mt-2">Checking Clearance Status</p>
                </div>
            );
        default:
            return <div className="p-4 text-center">MODULE LOADING...</div>;
    }
  };

  return (
    <CRTWrapper>
      
      {['payment_history', 'hall_ticket'].includes(activeModal) && (
        <TerminalModal 
            title={`SYSTEM :: ${activeModal?.toUpperCase().replace('_', ' ')}`} 
            onClose={() => setActiveModal(null)}
        >
            {renderGenericModalContent()}
        </TerminalModal>
      )}

      {activeModal === 'details_3d' && <StudentDetailsModal student={studentData} onClose={() => setActiveModal(null)} />}
      {activeModal === 'backlogs' && <BacklogModal onClose={() => setActiveModal(null)} student={studentData} />}
      {activeModal === 'grievance' && <GrievanceModal student={studentData} onClose={() => setActiveModal(null)} />}

      {/* --- PAYMENT FLOW MODALS --- */}
      {activeModal === 'exam_reg' && (
          <ExamRegistration 
              student={studentData} 
              onBack={() => setActiveModal(null)}
          />
      )}
      {activeModal === 'tuition' && (
          <TuitionFees 
              student={studentData} 
              onBack={() => setActiveModal(null)} 
              onProceedToPay={() => setActiveModal('challan_gen')}
          />
      )}
      {activeModal === 'challan_gen' && (
          <ChallanGenerationModal 
              student={studentData}
              onBack={() => setActiveModal(null)}
              onProceedToPay={handlePaymentInitiated} 
          />
      )}

      {/* HEADER */}
      <header className="flex justify-between items-end border-b-4 double border-terminal pb-2 mb-4 shrink-0 relative z-10">
        <h1 className="text-5xl uppercase tracking-widest">COLLEGE NAME</h1>
        <nav className="space-x-4 text-xl">
           {['HOME', 'ADMISSIONS', 'CONTACT'].map((item) => (
             <a key={item} href="#" className="hover:bg-terminal hover:text-black hover:shadow-[0_0_10px_#ffb000] px-2 transition-all">[ {item} ]</a>
           ))}
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {['home', 'login', 'admin_login'].includes(view) && (
          <aside className="w-72 border-r-2 border-terminal pt-5 flex flex-col gap-4 shrink-0">
            <button key="about" className="text-left text-2xl hover:bg-terminal hover:text-black px-2 transition-all">&gt; [ About Us ]</button>
            <div className="border-t border-terminal/30 my-2"></div>
            <button onClick={() => setView('login')} className="text-left text-2xl hover:bg-terminal hover:text-black px-2 transition-all">&gt; [ Student Portal ]</button>
            <button onClick={() => setView('admin_login')} className="text-left text-2xl text-red-400 hover:bg-red-500 hover:text-black px-2 transition-all mt-4">&gt; [ ADMIN ACCESS ]</button>
          </aside>
        )}

        <main className="flex-1 p-8 text-2xl relative w-full">
          {view === 'home' && <div>{displayedText.map((line, i) => <div key={i} className="mb-2">{line}</div>)}</div>}
          {view === 'login' && <LoginPanel onBack={() => setView('home')} />}
          {view === 'admin_login' && <AdminLogin onBack={() => setView('home')} />}
          {view === 'admin_dashboard' && <AdminDashboard onLogout={handleLogout} />}

          {/* DASHBOARD */}
          {view === 'dashboard' && (
            <StudentDashboard 
                student={studentData} 
                onLogout={handleLogout} 
                onHostelClick={() => setView('hostel_status')}
                onResultsClick={() => setView('exam_results')}
                
                // ROUTING LOGIC FIX
                onOpenModal={(type) => {
                    if(type === 'exam_reg') setActiveModal('exam_reg');
                    else if(type === 'tuition') setActiveModal('tuition');
                    else if(type === 'challan_gen') setActiveModal('challan_gen');
                    else if(type === 'pay_challan') {
                        setPaymentContext(null); // Clear context for manual entry
                        setView('challan_system');
                    }
                    else setActiveModal(type);
                }}
                
                onDetailsClick={() => setActiveModal('details_3d')}
                onGrievanceClick={() => setActiveModal('grievance')} 
            />
          )}

          {/* CHALLAN MANAGER (Search Mode when context is null) */}
          {view === 'challan_system' && (
              <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto">
                  <ChallanManager 
                      student={studentData}
                      paymentContext={paymentContext}
                      onComplete={() => {
                          fetchProfile(studentData.auth_user_id); 
                          setView('dashboard'); 
                      }}
                      onBack={() => setView('dashboard')}
                  />
              </div>
          )}

          {/* SUB-PAGES */}
          {view === 'exam_results' && <div className="absolute inset-0 z-50"><ExamResults onBack={() => setView('dashboard')} student={studentData} /></div>}
          {view === 'hostel_status' && <HostelPanel student={studentData} onBack={() => setView('dashboard')} onBookNow={() => setView('booking_3d')} />}

          {view === 'booking_3d' && (
             <div className="absolute inset-0 pointer-events-auto">
                <Scene3D 
                    student={studentData} 
                    onRoomSelect={(room) => {
                        handlePaymentInitiated({
                            type: 'HOSTEL',
                            amount: 15000, 
                            metadata: { room_id: room.id, block_name: room.block_name },
                            autoRedirect: true 
                        });
                    }}
                />
                <div className="absolute top-4 left-4 z-50 animate-slideIn pointer-events-auto">
                    <button onClick={() => setView('hostel_status')} className="bg-black/80 text-terminal border border-terminal px-4 py-2 hover:bg-terminal hover:text-black font-vt323 text-xl">[ BACK ]</button>
                </div>
             </div>
          )}
        </main>
      </div>
    </CRTWrapper>
  );
}

// Login Components remain unchanged...
function LoginPanel({ onBack }) {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = `${regNo}@au.edu.in`; 
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError('ACCESS DENIED: INVALID CREDENTIALS');
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-terminal p-8 max-w-lg mt-8 relative animate-[slideIn_0.5s_ease-out] bg-black/80 mx-auto">
      <div className="border-b border-dashed border-terminal mb-6 pb-2 font-bold tracking-widest text-center">SYSTEM_98 :: SECURE LOGIN</div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <RetroInput label="REG NO" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
        <RetroInput label="PASSWORD" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-500 text-center animate-pulse">{error}</div>}
        <div className="flex justify-center gap-6 mt-8">
          <button type="submit" disabled={loading} className="border border-terminal px-6 py-2 hover:bg-terminal hover:text-black transition-all font-bold disabled:opacity-50">{loading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}</button>
          <button type="button" onClick={onBack} className="border border-terminal px-6 py-2 hover:bg-red-900/50 hover:text-red-400 transition-all opacity-80">[ CANCEL ]</button>
        </div>
      </form>
    </div>
  )
}

function RetroInput({ label, type = "text", value, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <label className="w-32 font-bold opacity-80">{label}:</label>
      <div className="flex-1 flex items-center w-full">
        <span className="text-2xl opacity-50">[</span>
        <input type={type} value={value} onChange={onChange} className="bg-transparent border-b-2 border-terminal text-terminal font-vt323 text-2xl w-full mx-2 outline-none uppercase focus:shadow-[0_4px_10px_rgba(255,176,0,0.2)]" autoComplete="off" />
        <span className="text-2xl opacity-50">]</span>
      </div>
    </div>
  )
}
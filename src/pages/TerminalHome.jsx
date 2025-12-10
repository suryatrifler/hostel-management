import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import CRTWrapper from '../components/CRTWrapper';
import { useTypewriter } from '../hooks/useTypewriter';
import StudentDashboard from '../components/StudentDashboard';
import HostelPanel from '../components/HostelPanel';
import Scene3D from '../components/Scene3D';
import AdminLogin from '../components/AdminLogin'; 
// 1. IMPORT ADMIN DASHBOARD
import AdminDashboard from '../components/AdminDashboard';

const WELCOME_LOGS = [
  ">> Welcome to [COLLEGE NAME] Terminal Access.",
  ">> System status: ONLINE.",
  ">> Establishing secure connection...",
  ""
];

export default function TerminalHome() {
  const [view, setView] = useState('home'); 
  const [studentData, setStudentData] = useState(null);
  const { displayedText } = useTypewriter(WELCOME_LOGS, 30);

  // --- SESSION HANDLING ---
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
    // Simple Admin Check: Is the email 'admin@college.edu.in'?
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
        .eq('id', userId)
        .single();

      if (data) {
        setStudentData(data);
        if (view === 'home' || view === 'login' || view === 'admin_login') {
            setView('dashboard');
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  return (
    <CRTWrapper>
      
      <header className="flex justify-between items-end border-b-4 double border-terminal pb-2 mb-4 shrink-0 relative z-10">
        <h1 className="text-5xl uppercase tracking-widest">COLLEGE NAME</h1>
        <nav className="space-x-4 text-xl">
           {['HOME', 'ADMISSIONS', 'CONTACT'].map((item) => (
             <a key={item} href="#" className="hover:bg-terminal hover:text-black hover:shadow-[0_0_10px_#ffb000] px-2 transition-all">
               [ {item} ]
             </a>
           ))}
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* SIDEBAR: Show on Home, Login, or Admin Login */}
        {(view === 'home' || view === 'login' || view === 'admin_login') && (
          <aside className="w-72 border-r-2 border-terminal pt-5 flex flex-col gap-4 shrink-0">
            {['About Us', 'Departments', 'Library', 'News & Events'].map((item) => (
              <button key={item} className="text-left text-2xl hover:bg-terminal hover:text-black px-2 transition-all">
                &gt; [ {item} ]
              </button>
            ))}
            
            <div className="border-t border-terminal/30 my-2"></div>
            
            <button onClick={() => setView('login')} className="text-left text-2xl hover:bg-terminal hover:text-black px-2 transition-all">
              &gt; [ Student Portal ]
            </button>
            
            {/* ADMIN BUTTON */}
            <button onClick={() => setView('admin_login')} className="text-left text-2xl text-red-400 hover:bg-red-500 hover:text-black px-2 transition-all mt-4">
              &gt; [ ADMIN ACCESS ]
            </button>
          </aside>
        )}

        <main className="flex-1 p-8 text-2xl relative w-full">
          
          {view === 'home' && (
            <div>
              {displayedText.map((line, i) => (
                <div key={i} className="mb-2">{line}</div>
              ))}
              <span className="inline-block w-3 h-6 bg-terminal animate-blink align-sub"/>
            </div>
          )}

          {view === 'login' && (
            <LoginPanel onBack={() => setView('home')} />
          )}

          {view === 'admin_login' && (
            <AdminLogin onBack={() => setView('home')} />
          )}

          {/* 2. REPLACED PLACEHOLDER WITH ACTUAL DASHBOARD */}
          {view === 'admin_dashboard' && (
            <AdminDashboard onLogout={handleLogout} />
          )}

          {view === 'dashboard' && (
            <StudentDashboard 
                student={studentData} 
                onLogout={handleLogout} 
                onHostelClick={() => setView('hostel_status')}
            />
          )}

          {view === 'hostel_status' && (
            <HostelPanel 
                student={studentData}
                onBack={() => setView('dashboard')}
                onBookNow={() => setView('booking_3d')} 
            />
          )}

          {view === 'booking_3d' && (
             <div className="absolute inset-0 pointer-events-auto">
                <Scene3D 
                    student={studentData} 
                    onComplete={() => {
                        fetchProfile(studentData.id);
                        setView('hostel_status');
                    }}
                />
                <div className="absolute top-4 left-4 z-50 animate-slideIn">
                    <button 
                        onClick={() => setView('hostel_status')} 
                        className="bg-black/80 text-terminal border border-terminal px-4 py-2 hover:bg-terminal hover:text-black font-vt323 text-xl"
                    >
                        [ BACK ]
                    </button>
                </div>
             </div>
          )}

        </main>
      </div>
    </CRTWrapper>
  );
}

// --- KEEP YOUR EXISTING LoginPanel & RetroInput HERE ---
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

    } catch (err) {
      console.error(err);
      setError('ACCESS DENIED: INVALID CREDENTIALS');
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-terminal p-8 max-w-lg mt-8 relative animate-[slideIn_0.5s_ease-out] bg-black/80 mx-auto">
      <div className="absolute -top-3 -left-2 bg-black text-terminal px-1">+</div>
      <div className="absolute -top-3 -right-2 bg-black text-terminal px-1">+</div>
      <div className="absolute -bottom-3 -left-2 bg-black text-terminal px-1">+</div>
      <div className="absolute -bottom-3 -right-2 bg-black text-terminal px-1">+</div>

      <div className="border-b border-dashed border-terminal mb-6 pb-2 font-bold tracking-widest text-center">
        SYSTEM_98 :: SECURE LOGIN
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <RetroInput label="REG NO" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
        <RetroInput label="PASSWORD" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <div className="text-red-500 text-center animate-pulse">{error}</div>}

        <div className="flex justify-center gap-6 mt-8">
          <button type="submit" disabled={loading} className="border border-terminal px-6 py-2 hover:bg-terminal hover:text-black transition-all font-bold disabled:opacity-50">
            {loading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}
          </button>
          <button type="button" onClick={onBack} className="border border-terminal px-6 py-2 hover:bg-red-900/50 hover:text-red-400 transition-all opacity-80">
            [ CANCEL ]
          </button>
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
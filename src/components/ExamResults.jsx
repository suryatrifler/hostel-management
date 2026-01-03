import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ChevronLeft, FileText, Lock, Activity, ShieldCheck, Printer } from "lucide-react";
import "./ExamResults.css";

export default function ExamResults({ onBack, student }) {
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH DATA FROM SUPABASE
  useEffect(() => {
    if (student) fetchResults();
  }, [student]);

  const fetchResults = async () => {
    try {
      // Step A: Fetch The Headers (Exam Results)
      const { data: results, error: rError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_reg_no', student.registration_number)
        .order('semester', { ascending: true });

      if (rError) throw rError;

      // Step B: For each result, fetch the Subject Scores + Subject Names
      // We use Promise.all to fetch details for all semesters in parallel
      const detailedResults = await Promise.all(results.map(async (res) => {
         const { data: scores, error: sError } = await supabase
            .from('exam_subject_scores')
            .select(`
                grade, 
                grade_points, 
                subjects ( name ) 
            `)
            .eq('result_id', res.id);
         
         if (sError) throw sError;

         // Transform data to match UI structure
         return {
            id: res.id,
            label: res.semester_label,
            title: `SEMESTER ${res.semester}`,
            date: res.created_at ? new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A',
            status: res.result_status,
            sgpa: res.sgpa,
            cgpa: res.cgpa,
            subjects: scores.map(s => ({
                name: s.subjects?.name || "UNKNOWN SUBJECT",
                grade: s.grade,
                points: s.grade_points
            }))
         };
      }));

      // Step C: Pad with "Locked" semesters (up to 8) for the visual effect
      const finalData = [...detailedResults];
      const currentSemCount = detailedResults.length;
      
      for(let i = currentSemCount + 1; i <= 8; i++) {
          finalData.push({
             id: `locked-${i}`,
             label: `SEM_0${i}`,
             title: `${i}TH SEMESTER`,
             date: "FUTURE",
             status: "LOCKED",
             sgpa: "--",
             cgpa: "--",
             subjects: []
          });
      }

      setResultsData(finalData);
    } catch (err) {
        console.error("Error fetching results:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleBackgroundClick = () => setActiveId(null);
  const handleCartridgeClick = (e, id) => {
    e.stopPropagation(); 
    // Prevent clicking locked items
    if(String(id).startsWith('locked')) return;
    if (activeId === id) setActiveId(null); else setActiveId(id);
  };

  const handlePrint = () => window.print();

  // --- PHYSICS ENGINE (Style Logic) ---
  const getWrapperStyle = (index, id) => {
    const Z_DIST = 140;   
    const Y_STAGGER = -30; 
    
    let zBase = -index * Z_DIST; 
    let yBase = index * Y_STAGGER; 
    let xBase = index * 10; 

    if (hoverId !== null) {
        const hoverIndex = resultsData.findIndex(s => s.id === hoverId);
        if (index === hoverIndex) { zBase += 100; } 
        else if (index < hoverIndex) { zBase += 220; yBase += 40; } 
        else if (index > hoverIndex) { zBase -= 220; yBase -= 40; }
    }

    if (activeId === id && !hoverId) { zBase += 100; }

    return {
        "--x": `${xBase}px`,
        "--y": `${yBase}px`,
        "--z": `${zBase}px`,
        zIndex: hoverId === id ? 1000 : (100 - index)
    };
  };

  if (loading) return <div className="bg-black text-cyan-500 font-vt323 h-screen w-screen flex items-center justify-center text-3xl animate-pulse">DECRYPTING ACADEMIC RECORDS...</div>;

  const activeData = resultsData.find(s => s.id === activeId);

  return (
    <div className="exam-root">
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40"></div>

      <div className="scene" onClick={handleBackgroundClick}>
        
        <button 
            className="absolute top-4 left-4 text-cyan-500 hover:text-white border border-cyan-500/30 p-2 rounded-full transition-all z-50 flex items-center gap-2 px-3 bg-black/50 hover:bg-cyan-500/10"
            onClick={(e) => { e.stopPropagation(); onBack(); }}
        >
          <ChevronLeft size={16} /> <span className="text-[10px] font-mono">TERMINAL</span>
        </button>

        {/* --- LEFT SIDE: MARKSHEET --- */}
        <div 
            className={`marksheet-container ${activeId ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}
            onClick={(e) => e.stopPropagation()} 
        >
             <div className="official-doc">
                  <div className="corner-tl"></div>
                  <div className="corner-br"></div>
                  
                  <div className="doc-header">
                      <div>
                          <div className="text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] mb-1">DECRYPTED FILE</div>
                          <div className="text-xl font-bold tracking-widest">{activeData?.title}</div>
                      </div>
                      <Activity className="text-cyan-500" size={24} />
                  </div>

                  <div className="student-info-grid">
                      <div className="info-row"><span>NAME</span> <span className="info-val">{student?.full_name}</span></div>
                      <div className="info-row"><span>REG NO</span> <span className="info-val">{student?.registration_number}</span></div>
                      <div className="info-row"><span>COURSE</span> <span className="info-val">{student?.course}</span></div>
                  </div>

                  <div className="table-wrapper custom-scrollbar">
                      <table className="results-table">
                          <thead>
                              <tr>
                                  <th style={{width: '60%'}}>Paper Name</th>
                                  <th style={{width: '20%'}}>Grade</th>
                                  <th style={{width: '20%'}}>Points</th>
                              </tr>
                          </thead>
                          <tbody>
                              {activeData?.subjects.map((sub, idx) => (
                                  <tr key={idx}>
                                      <td>{sub.name}</td>
                                      <td style={{color: ['F', 'AB', 'ABSENT'].includes(sub.grade) ? '#ff3333' : 'white', fontWeight: 'bold'}}>{sub.grade}</td>
                                      <td>{sub.points}</td>
                                  </tr>
                              ))}
                              {activeData?.subjects.length === 0 && (
                                  <tr><td colSpan="3" className="text-center py-12 text-cyan-500/40 italic"><Lock className="inline mb-2" size={16} /> <br/> DATA ENCRYPTED</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>

                  <div className="footer-summary">
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-cyan-500/60"><ShieldCheck size={14}/> VERIFIED</div>
                          <button onClick={handlePrint} className="print-btn"><Printer size={14} /> <span>Print Record</span></button>
                      </div>

                      <div className="flex gap-6">
                          <div className="text-right">
                              <div className="text-[9px] text-cyan-500/60">SEM GPA</div>
                              <div className="text-lg font-bold text-white">{activeData?.sgpa}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-[9px] text-cyan-500/60">CUM GPA</div>
                              <div className="text-lg font-bold text-white">{activeData?.cgpa}</div>
                          </div>
                      </div>
                  </div>
             </div>
        </div>

        {/* --- RIGHT SIDE: 3D STACK --- */}
        <div className="depth-tunnel">
            {resultsData.map((sem, i) => (
                <div
                  key={sem.id}
                  className={`cartridge-wrapper ${activeId === sem.id ? "active" : ""} ${hoverId !== null && hoverId !== sem.id ? "dimmed" : ""} ${sem.status === 'LOCKED' ? 'locked-item opacity-50 grayscale' : ''}`}
                  style={getWrapperStyle(i, sem.id)}
                  onMouseEnter={() => setHoverId(sem.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={(e) => handleCartridgeClick(e, sem.id)}
                >
                  <div className="cartridge-visual">
                      <div className="cartridge-header">
                        <span className="text-[9px] text-cyan-500/60 font-mono">{sem.label}</span>
                        <div className={`status-light ${sem.status === 'LOCKED' ? 'bg-red-900' : 'bg-green-400'}`}></div>
                      </div>
                      <h3 style={{fontSize: '14px', color: '#ccc'}}>{sem.date}</h3>
                      <div className="flex justify-between items-end mt-auto">
                         {sem.status === 'LOCKED' ? <Lock size={14} className="text-red-500/50" /> : <FileText size={14} className="text-white/20" />}
                      </div>
                  </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}
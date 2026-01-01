import React, { useState } from "react";
import { ChevronLeft, FileText, Lock, Activity, ShieldCheck, Printer } from "lucide-react";
import "./ExamResults.css";

const SEMESTER_DATA = [
  { 
    id: 1, label: "SEM_01", title: "1ST SEMESTER", date: "JAN 2024", 
    status: "CLEARED", sgpa: "8.1", cgpa: "8.1",
    subjects: [{ name: "ENG MATH I", grade: "A", points: 8 }]
  },
  { 
    id: 2, label: "SEM_02", title: "2ND SEMESTER", date: "MAY 2024", 
    status: "CLEARED", sgpa: "8.4", cgpa: "8.25",
    subjects: [{ name: "DATA STRUCTURES", grade: "O", points: 10 }]
  },
  { 
    id: 3, label: "SEM_03", title: "3RD SEMESTER (2-1)", date: "JAN 2025", 
    status: "CLEARED", sgpa: "8.2", cgpa: "8.23",
    subjects: [
        { name: "DISCRETE MATH", grade: "B+", points: 7 },
        { name: "COMPUTER ARCHITECTURE", grade: "A", points: 8 },
        { name: "OPERATING SYSTEMS", grade: "A+", points: 9 },
        { name: "OOP THROUGH JAVA", grade: "A", points: 8 },
    ]
  },
  { 
    id: 4, label: "SEM_04", title: "4TH SEMESTER (2-2)", date: "MAY 2025", 
    status: "CLEARED", sgpa: "8.5", cgpa: "8.3",
    subjects: [{ name: "DBMS", grade: "O", points: 10 }]
  },
  { 
    id: 5, label: "SEM_05", title: "5TH SEMESTER (3-1)", date: "DEC 2025", 
    status: "LOCKED", sgpa: "--", cgpa: "--", subjects: []
  },
  { 
    id: 6, label: "SEM_06", title: "6TH SEMESTER (3-2)", date: "MAY 2026", 
    status: "LOCKED", sgpa: "--", cgpa: "--", subjects: []
  },
  { 
    id: 7, label: "SEM_07", title: "7TH SEMESTER (4-1)", date: "DEC 2026", 
    status: "LOCKED", sgpa: "--", cgpa: "--", subjects: []
  },
  { 
    id: 8, label: "SEM_08", title: "8TH SEMESTER (4-2)", date: "MAY 2027", 
    status: "LOCKED", sgpa: "--", cgpa: "--", subjects: []
  }
];

export default function ExamResults({ onBack }) {
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const handleBackgroundClick = () => setActiveId(null);
  const handleCartridgeClick = (e, id) => {
    e.stopPropagation(); 
    if (activeId === id) setActiveId(null); else setActiveId(id);
  };

  // --- PRINT HANDLER ---
  const handlePrint = () => {
    window.print();
  };

  // --- PHYSICS ENGINE ---
  const getWrapperStyle = (index, id) => {
    const Z_DIST = 140;   
    const Y_STAGGER = -30; 
    
    let zBase = -index * Z_DIST; 
    let yBase = index * Y_STAGGER; 
    let xBase = index * 10; 

    if (hoverId !== null) {
        const hoverIndex = SEMESTER_DATA.findIndex(s => s.id === hoverId);
        
        if (index === hoverIndex) {
            zBase += 100;
        } 
        else if (index < hoverIndex) {
            zBase += 220; 
            yBase += 40; 
        } 
        else if (index > hoverIndex) {
            // Push deep but keep them visible
            zBase -= 220; 
            yBase -= 40;
        }
    }

    if (activeId === id && !hoverId) {
         zBase += 100;
    }

    return {
        "--x": `${xBase}px`,
        "--y": `${yBase}px`,
        "--z": `${zBase}px`,
        zIndex: hoverId === id ? 1000 : (100 - index)
    };
  };

  const activeData = SEMESTER_DATA.find(s => s.id === activeId);

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

        {/* --- LEFT SIDE: SCI-FI MARKSHEET --- */}
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
                      <div className="info-row"><span>NAME</span> <span className="info-val">SAMIREDDI SURYA BHAGAVAN</span></div>
                      <div className="info-row"><span>REG NO</span> <span className="info-val">323107311044</span></div>
                      <div className="info-row"><span>COURSE</span> <span className="info-val">B.TECH + M.TECH</span></div>
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
                                      <td style={{color: sub.grade === 'F' ? '#ff3333' : 'white', fontWeight: 'bold'}}>{sub.grade}</td>
                                      <td>{sub.points}</td>
                                  </tr>
                              ))}
                              {activeData?.subjects.length === 0 && (
                                  <tr>
                                      <td colSpan="3" className="text-center py-12 text-cyan-500/40 italic">
                                          <Lock className="inline mb-2" size={16} /> <br/> DATA ENCRYPTED
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>

                  {/* Footer with Print Button */}
                  <div className="footer-summary">
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-cyan-500/60"><ShieldCheck size={14}/> VERIFIED</div>
                          
                          {/* NEW PRINT BUTTON */}
                          <button onClick={handlePrint} className="print-btn">
                              <Printer size={14} /> <span>Print Record</span>
                          </button>
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
            {SEMESTER_DATA.map((sem, i) => (
                <div
                  key={sem.id}
                  className={`cartridge-wrapper ${activeId === sem.id ? "active" : ""} ${hoverId !== null && hoverId !== sem.id ? "dimmed" : ""}`}
                  style={getWrapperStyle(i, sem.id)}
                  onMouseEnter={() => setHoverId(sem.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={(e) => handleCartridgeClick(e, sem.id)}
                >
                  <div className="cartridge-visual">
                      <div className="cartridge-header">
                        <span className="text-[9px] text-cyan-500/60 font-mono">{sem.label}</span>
                        <div className="status-light"></div>
                      </div>
                      <h3 style={{fontSize: '14px', color: '#ccc'}}>{sem.date}</h3>
                      <div className="flex justify-between items-end mt-auto">
                         <FileText size={14} className="text-white/20" />
                      </div>
                  </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Data Connection
import StudentAvatar from './StudentAvatar';
import { X, Fingerprint, Phone, Shield, Award, ChevronRight, ChevronLeft, GraduationCap, MapPin, Loader } from 'lucide-react';

export default function StudentDetailsModal({ student, onClose }) {
  const [tracker, setTracker] = useState({ x: 0, y: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Real-Time Data States
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  if (!student) return null;

  // --- 1. FETCH HOSTEL DATA ---
  useEffect(() => {
    if (student.room_id) {
      fetchRoomDetails();
    }
  }, [student]);

  const fetchRoomDetails = async () => {
    setLoadingRoom(true);
    try {
      // Fetch Room Number + Linked Block Name
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          room_number,
          floor_number,
          hostel_blocks ( name, type )
        `)
        .eq('id', student.room_id)
        .single();

      if (error) throw error;
      setRoomData(data);
    } catch (err) {
      console.error("Error fetching room:", err);
    } finally {
      setLoadingRoom(false);
    }
  };

  // --- 2. CONFIGURATION ---
  const studentSpecificModel = `/models/students/${student.registration_number}.glb`;
  const defaultModel = "/models/avatar.glb";

  const slides = [
    { id: 'academics', title: 'ACADEMIC PROFILE', icon: <GraduationCap /> },
    { id: 'contact', title: 'PERSONAL & CONTACT', icon: <Phone /> },
    { id: 'hostel', title: 'HOSTEL ALLOCATION', icon: <Award /> },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const PANEL_WIDTH = 550; 
  const PANEL_HEIGHT = 500;
  const PANEL_RIGHT_MARGIN = 80; 
  const panelX = window.innerWidth - (PANEL_WIDTH + PANEL_RIGHT_MARGIN);
  const panelY = (window.innerHeight / 2) - (PANEL_HEIGHT / 2);
  const midX = tracker.x + 80; 
  const svgPath = `M ${tracker.x} ${tracker.y} L ${midX} ${tracker.y} L ${midX} ${panelY + 45} L ${panelX} ${panelY + 45}`;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden animate-fadeIn select-none">
      
      {/* 3D MODEL LAYER */}
      <div className="absolute inset-0 z-0">
          <StudentAvatar 
              primaryUrl={studentSpecificModel}
              fallbackUrl={defaultModel}
              onTrackPosition={(pos) => setTracker(pos)} 
          />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/80 pointer-events-none"></div>

      <button onClick={onClose} className="absolute top-8 right-8 z-50 text-cyan-500 hover:text-white border border-cyan-500/30 p-2 rounded-full hover:bg-cyan-500/20 transition-all pointer-events-auto">
          <X size={24} />
      </button>

      {/* TRACKING LINES */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          {tracker.x > 0 && (
              <>
                 <path d={svgPath} stroke="#00f0ff" strokeWidth="2" fill="none" className="drop-shadow-[0_0_5px_#00f0ff]"/>
                 <circle cx={tracker.x} cy={tracker.y} r="3" fill="#00f0ff" className="animate-ping" />
                 <circle cx={midX} cy={tracker.y} r="2" fill="#00f0ff" />
                 <circle cx={midX} cy={panelY + 45} r="2" fill="#00f0ff" />
              </>
          )}
      </svg>

      {/* INFO PANEL */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 pointer-events-auto z-30 flex flex-col justify-center"
        style={{ right: `${PANEL_RIGHT_MARGIN}px`, width: `${PANEL_WIDTH}px`, height: `${PANEL_HEIGHT}px` }}
      >
          <div className="w-full h-full bg-black/80 border border-cyan-500/40 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(0,240,255,0.2)] relative flex flex-col rounded-sm">
              
              <div className="absolute top-[45px] -left-2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#00f0ff]"></div>
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

              {/* HEADER */}
              <div className="flex items-center gap-5 mb-6 border-b border-cyan-500/30 pb-4 shrink-0">
                  <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[inset_0_0_15px_rgba(0,240,255,0.1)] rounded-sm">
                      <Fingerprint size={32} />
                  </div>
                  <div className="overflow-hidden">
                      <div className="text-cyan-500/60 text-xs uppercase tracking-[0.3em] mb-1">Target Identified</div>
                      <h1 className="text-4xl font-vt323 text-white leading-none tracking-wide text-shadow-glow truncate">
                          {student.full_name}
                      </h1>
                      <div className="text-cyan-300 font-mono text-sm mt-1">ID: {student.registration_number}</div>
                  </div>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 relative overflow-hidden">
                
                {/* 1. ACADEMIC DATA */}
                <div className={`absolute inset-0 transition-all duration-500 ease-out transform ${currentSlide === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                   <SlideHeader title="ACADEMIC DATA" icon={<GraduationCap />} />
                   <div className="grid grid-cols-2 gap-4 mt-4">
                      <DataPoint label="COURSE" value={student.course} />
                      <DataPoint label="BRANCH" value={student.branch} />
                      <DataPoint label="YEAR" value={student.year || "1"} />
                      <DataPoint label="SEMESTER" value={student.semester || "1"} />
                      <div className="col-span-2 mt-2">
                        <DataPoint label="ENROLLMENT STATUS" value="ACTIVE / REGULAR" color="text-green-400" />
                      </div>
                   </div>
                </div>

                {/* 2. CONTACT DATA */}
                <div className={`absolute inset-0 transition-all duration-500 ease-out transform ${currentSlide === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                   <SlideHeader title="CONTACT & GUARDIAN" icon={<Phone />} />
                   <div className="space-y-4 mt-4">
                      <div className="bg-black/20 p-3 border border-white/5">
                          <div className="text-[10px] text-cyan-500/50 uppercase tracking-wider mb-1">PERSONAL CONTACT</div>
                          <div className="flex items-center gap-2 text-cyan-100 mb-1"><Phone size={14}/> {student.phone_number || "N/A"}</div>
                          <div className="flex items-center gap-2 text-cyan-100 truncate"><MapPin size={14}/> {student.address || "Address Not on Record"}</div>
                      </div>
                      
                      <div className="bg-cyan-900/10 border-l-2 border-cyan-500 p-3">
                          <div className="flex items-center gap-2 text-cyan-400 mb-2">
                              <Shield size={14} /> <span className="text-xs font-bold">GUARDIAN LINK</span>
                          </div>
                          <div className="text-xl text-white font-vt323">{student.father_name || "N/A"}</div>
                          <div className="text-[10px] text-cyan-600 uppercase">RELATION: FATHER</div>
                      </div>
                   </div>
                </div>

                {/* 3. HOSTEL DATA (REAL-TIME) */}
                <div className={`absolute inset-0 transition-all duration-500 ease-out transform ${currentSlide === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                   <SlideHeader title="HOSTEL ALLOCATION" icon={<Award />} />
                   <div className="mt-4 h-full flex flex-col gap-4">
                      <div className={`flex-1 p-6 border-2 flex flex-col items-center justify-center text-center ${student.room_id ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                          <div className="text-sm uppercase tracking-widest mb-2 text-white/60">ALLOCATION STATUS</div>
                          
                          {loadingRoom ? (
                              <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                                  <Loader className="animate-spin" size={20} /> SYNCING DB...
                              </div>
                          ) : (
                              <>
                                  <div className={`text-4xl font-vt323 mb-2 ${student.room_id ? 'text-yellow-400' : 'text-red-400'}`}>
                                      {student.room_id ? "CONFIRMED" : "NOT ALLOCATED"}
                                  </div>
                                  {student.room_id && roomData && (
                                     <div className="bg-yellow-400 text-black px-4 py-1 font-bold font-mono rounded-sm">
                                        ROOM #{roomData.room_number}
                                     </div>
                                  )}
                              </>
                          )}
                      </div>
                      
                      {student.room_id && !loadingRoom && roomData && (
                          <div className="text-[10px] text-center text-white/30 font-mono">
                              {roomData.hostel_blocks?.name} • FLOOR {roomData.floor_number}
                          </div>
                      )}
                      
                      {!student.room_id && (
                           <div className="text-[10px] text-center text-red-500/40 font-mono">
                               ACTION REQUIRED: Visit Hostel Terminal to book a room.
                           </div>
                      )}
                   </div>
                </div>

              </div>

              {/* FOOTER NAV */}
              <div className="mt-4 pt-4 border-t border-cyan-500/20 flex items-center justify-between shrink-0">
                  <button onClick={prevSlide} className="p-2 hover:bg-cyan-500/20 text-cyan-500 transition-colors rounded-sm"><ChevronLeft size={20} /></button>
                  <div className="flex gap-2">
                      {slides.map((_, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#00f0ff]' : 'w-2 bg-cyan-500/30 hover:bg-cyan-500/50'}`}
                          />
                      ))}
                  </div>
                  <button onClick={nextSlide} className="p-2 hover:bg-cyan-500/20 text-cyan-500 transition-colors rounded-sm"><ChevronRight size={20} /></button>
              </div>

          </div>
      </div>

      <style>{`
        .text-shadow-glow { text-shadow: 0 0 15px rgba(0, 240, 255, 0.6); }
      `}</style>
    </div>
  );
}

// Sub-components
function SlideHeader({ title, icon }) {
    return (
        <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-500/20 pb-2">
            {React.cloneElement(icon, { size: 18 })}
            <span className="font-bold tracking-widest text-sm">{title}</span>
        </div>
    )
}

function DataPoint({ label, value, color = "text-white" }) {
    return (
        <div className="bg-black/20 p-3 border border-white/5 hover:border-cyan-500/30 transition-colors">
            <div className="text-[10px] text-cyan-500/50 uppercase tracking-wider mb-1">{label}</div>
            <div className={`font-vt323 text-2xl leading-none ${color}`}>{value || "---"}</div>
        </div>
    )
}
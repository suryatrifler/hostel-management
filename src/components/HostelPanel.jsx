import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BookingLoader from './BookingLoader'; 
import { Home, User, Wrench, AlertTriangle, ArrowRight, UserCircle, Phone, Mail, FileText, MapPin, UserX } from 'lucide-react';

export default function HostelPanel({ student, onBookNow, onBack }) {
  const [roomDetails, setRoomDetails] = useState(null);
  const [roommate, setRoommate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false); 

  useEffect(() => {
    if (student?.room_id) {
      fetchRoomData();
    } else {
      setLoading(false);
    }
  }, [student]);

  const fetchRoomData = async () => {
    try {
      // 1. Fetch Room Details
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`*, hostel_blocks ( name, type )`)
        .eq('id', student.room_id)
        .single();

      if (roomError) throw roomError;
      setRoomDetails(room);

      // 2. Fetch Roommate
      // LOGIC FIX: Exclude self using registration_number (Primary Key)
      const { data: roommateData } = await supabase
        .from('students')
        .select('full_name, registration_number, branch, course')
        .eq('room_id', student.room_id)
        .neq('registration_number', student.registration_number) 
        .maybeSingle(); // Returns null safely if no result

      if (roommateData) setRoommate(roommateData);

    } catch (err) {
      console.error("Error fetching room:", err);
    } finally {
      setLoading(false);
    }
  };

  // Safety Check prevents crash if data isn't ready
  if (!student) return <div className="p-10 text-red-500 font-mono text-center">ERROR: STUDENT PROFILE NOT LOADED</div>;
  if (loading) return <div className="text-terminal animate-pulse p-10 font-mono">&gt;&gt; ACCESSING HOUSING DATABASE...</div>;

  const StudentProfileCard = () => (
    <div className="border border-terminal bg-black/60 p-6 relative h-full flex flex-col group hover:bg-white/5 transition-colors">
        <div className="absolute top-0 right-0 bg-terminal text-black px-2 font-bold text-sm">PERSONAL DOSSIER</div>
        
        <div className="flex-1 flex flex-col pt-2 space-y-4">
            <div className="flex items-center gap-4 border-b border-terminal/30 pb-4">
                <div className="w-16 h-16 rounded-full border border-terminal/50 flex items-center justify-center bg-terminal/10">
                    <UserCircle className="w-10 h-10 text-terminal opacity-80" />
                </div>
                <div>
                    <div className="text-xl font-bold leading-tight uppercase text-yellow-400">{student.full_name}</div>
                    <div className="text-sm opacity-60 tracking-wider">{student.registration_number}</div>
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <DetailRow icon={<FileText size={16}/>} label="ACADEMIC" value={`${student.course} - ${student.branch}`} />
                <DetailRow icon={<div className="w-4"><User size={16}/></div>} label="FATHER'S NAME" value={student.father_name || "NOT RECORDED"} />
                <DetailRow icon={<Phone size={16}/>} label="CONTACT" value={student.phone_number || "NOT RECORDED"} />
                <DetailRow icon={<Mail size={16}/>} label="EMAIL" value={student.email || "NOT RECORDED"} />
                <DetailRow icon={<MapPin size={16}/>} label="ADDRESS" value={student.address || "NOT RECORDED"} />
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full h-full animate-[slideIn_0.5s_ease-out] flex flex-col relative">
      
      {/* LOADER OVERLAY */}
      {isInitializing && (
          <BookingLoader 
            branch={student?.branch} 
            onComplete={onBookNow} 
          />
      )}

      {/* Header Strip */}
      <div className="flex justify-between items-center border-b-2 border-terminal pb-2 mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-terminal flex items-center gap-3">
          <Home /> HOUSING MODULE
        </h2>
        <div className="flex gap-6 text-right">
             <div>
                <div className="text-xs opacity-60">SESSION</div>
                <div className="text-terminal font-bold">2025-2026</div>
             </div>
             <div>
                <div className="text-xs opacity-60">HOUSING STATUS</div>
                <div className={`${student.room_id ? 'text-green-400' : 'text-red-500'} font-bold`}>
                    {student.room_id ? 'ALLOCATED' : 'NOT ALLOCATED'}
                </div>
             </div>
        </div>
      </div>

      {/* --- SCENARIO B: NOT HOSTELER (Split View) --- */}
      {!student?.room_id ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto pb-4 custom-scrollbar">
            
            {/* Left: Student Profile */}
            <StudentProfileCard />

            {/* Right: Action Panel */}
            <div className="border-2 border-red-500/50 bg-red-900/10 p-8 relative flex flex-col items-center justify-center text-center">
                <div className="absolute top-0 right-0 bg-red-500 text-black px-2 font-bold text-sm">ACTION REQUIRED</div>
                
                <AlertTriangle className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
                <h3 className="text-3xl font-bold text-red-500 mb-2">NO ROOM DETECTED</h3>
                <p className="text-terminal/70 text-lg mb-8 max-w-md">
                    This student profile currently has no housing allocation in the database. 
                    Please initiate the booking sequence to select a block and room.
                </p>

                <button 
                    onClick={() => setIsInitializing(true)} 
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-terminal text-black font-bold text-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(255,176,0,0.3)]"
                >
                    <span>INITIALIZE BOOKING</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      ) : (
        /* --- SCENARIO A: HAS ROOM (3-Column View) --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pb-4 pr-2 custom-scrollbar">
            
            {/* COL 1: Room Details */}
            <div className="space-y-6">
                <div className="border border-terminal bg-black/60 p-6 relative group h-full hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 bg-terminal text-black px-2 font-bold text-sm">BLOCK INFO</div>
                    <div className="space-y-6 mt-2">
                        <InfoRow label="BLOCK NAME" value={roomDetails?.hostel_blocks?.name || "LOADING..."} />
                        <InfoRow label="ROOM NUMBER" value={roomDetails?.room_number} size="text-5xl text-yellow-400" />
                        <InfoRow label="FLOOR LEVEL" value={`LEVEL 0${roomDetails?.floor_number}`} />
                        <div className="pt-4 border-t border-terminal/30 mt-auto">
                            <button className="w-full border border-red-500 text-red-500 px-4 py-2 hover:bg-red-500 hover:text-black transition-colors flex items-center justify-center gap-2 text-sm">
                                <Wrench size={16} /> REPORT DAMAGE
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* COL 2: Student Profile */}
            <StudentProfileCard />

            {/* COL 3: Co-Tenant Info */}
            <div className="space-y-6">
                <div className="border border-terminal bg-black/60 p-6 relative h-full flex flex-col hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 bg-terminal text-black px-2 font-bold text-sm">CO-TENANT</div>
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                        {roommate ? (
                            <>
                                <div className="w-24 h-24 border-2 border-terminal rounded-full flex items-center justify-center mb-4 bg-terminal/10">
                                    <User className="w-12 h-12 text-terminal" />
                                </div>
                                <div className="text-2xl font-bold text-center text-yellow-400">{roommate.full_name}</div>
                                <div className="text-terminal/60 mb-6">{roommate.registration_number}</div>
                                <div className="w-full grid grid-cols-2 gap-2 text-center text-sm border-t border-terminal/30 pt-4 opacity-80">
                                    <div>
                                        <span className="opacity-50 block text-[10px]">BRANCH</span>
                                        {roommate.branch || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="opacity-50 block text-[10px]">COURSE</span>
                                        {roommate.course || 'B.Tech'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // --- EMPTY STATE ---
                            <div className="flex flex-col items-center justify-center text-center opacity-60 h-full border-2 border-dashed border-terminal/20 p-4 w-full">
                                <UserX className="w-16 h-16 mb-4 text-terminal/30" />
                                <div className="text-xl font-vt323 text-terminal/80 tracking-widest">NO CO-TENANT</div>
                                <div className="text-[10px] font-mono text-terminal/50 mt-2 bg-terminal/10 px-2 py-1 rounded">
                                    DATABASE QUERY: NULL
                                </div>
                                <div className="mt-4 text-xs text-terminal/40 max-w-[150px]">
                                    System could not fetch any active resident record linked to this room ID.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
      )}

      <button onClick={onBack} className="mt-4 text-terminal/50 hover:text-terminal self-start text-sm">
        &lt; [ BACK TO DASHBOARD ]
      </button>
    </div>
  );
}

function InfoRow({ label, value, size = "text-xl" }) {
    return (
        <div>
            <div className="text-xs opacity-50 tracking-widest mb-1">{label}</div>
            <div className={`font-bold font-vt323 ${size}`}>{value || "---"}</div>
        </div>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="opacity-60 mt-1">{icon}</div>
            <div className="flex-1">
                <div className="text-[10px] opacity-50 tracking-wider">{label}</div>
                <div className="font-bold text-lg leading-none break-words">{value}</div>
            </div>
        </div>
    )
}
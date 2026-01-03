import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { supabase } from '../supabaseClient';
import HologramHostel from './HologramHostel';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const BLOCKS = [
  { id: 'A', name: 'ORBITAL BLOCK A', type: 'circular', gender: 'Male', radius: 15, roomCount: 32, prefix: '', camPos: [25, 30, 35] },
  { id: 'B', name: 'ORBITAL BLOCK B', type: 'circular', gender: 'Male', radius: 25, roomCount: 48, prefix: 'B-', camPos: [35, 40, 45] },
  { id: 'C', name: 'GIRLS HOSTEL BLOCK', type: 'rectangular', gender: 'Female', radius: 0, roomCount: 20, prefix: 'G-', camPos: [0, 20, 45] }
];

export default function Scene3D({ student, onRoomSelect }) {
  const [roomsData, setRoomsData] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const initialIndex = BLOCKS.findIndex(b => b.gender === student?.gender) !== -1 ? BLOCKS.findIndex(b => b.gender === student?.gender) : 0;
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialIndex);
  const activeBlock = BLOCKS[currentBlockIndex];
  
  const isAccessDenied = student?.gender && activeBlock.gender !== student.gender;

  useEffect(() => {
    fetchRooms();
    const sub = supabase.channel('room_locks').on('postgres_changes', { event: '*', schema: 'public', table: 'room_locks' }, fetchRooms).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchRooms = async () => {
    try {
      const { data: rooms, error } = await supabase.from('rooms').select(`*, students ( full_name ), room_locks ( id, expires_at )`);
      if (error) throw error;
      const roomMap = {};
      const now = new Date();
      rooms.forEach(room => {
        const studentNames = room.students ? room.students.map(s => s.full_name) : [];
        const activeLocks = room.room_locks ? room.room_locks.filter(l => new Date(l.expires_at) > now).length : 0;
        const realOccupancy = room.current_occupancy || 0;
        roomMap[room.room_number] = { ...room, occupancy: realOccupancy + activeLocks, real_occupancy: realOccupancy, student_names: studentNames };
      });
      setRoomsData(roomMap);
    } catch (err) { console.error("Error loading 3D data:", err); } 
    finally { setLoading(false); }
  };

  const handleNext = () => { setSelectedRoom(null); setCurrentBlockIndex((prev) => (prev + 1) % BLOCKS.length); };
  const handlePrev = () => { setSelectedRoom(null); setCurrentBlockIndex((prev) => (prev - 1 + BLOCKS.length) % BLOCKS.length); };
  
  const handleProceed = async () => {
      // 1. Lock Room
      const { error } = await supabase.from('room_locks').insert({ 
          room_id: selectedRoom.id, 
          student_reg_no: student.registration_number
      });

      if (error) {
          alert("Room unavailable (Locked by another user). Refreshing...");
          fetchRooms();
          return;
      }
      // 2. Trigger Parent (TerminalHome) to open Challan
      onRoomSelect(selectedRoom);
  };

  const isFull = (selectedRoom?.occupancy || 0) >= 2;
  const safeNames = selectedRoom?.student_names || [];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 pointer-events-auto">
         <button onClick={handlePrev} className="bg-black/80 border border-terminal text-terminal p-2 hover:bg-terminal rounded-full"><ChevronLeft size={32} /></button>
         <div className="text-center min-w-[200px]">
             <div className="text-xs text-terminal/60 tracking-widest uppercase">TARGET SECTOR</div>
             <div className="text-2xl font-vt323 text-white font-bold">{activeBlock.name}</div>
             <div className="text-[10px] mt-1 font-mono" style={{ color: isAccessDenied ? 'red' : '#00ff00' }}>STATUS: {isAccessDenied ? 'RESTRICTED' : 'ONLINE'}</div>
         </div>
         <button onClick={handleNext} className="bg-black/80 border border-terminal text-terminal p-2 hover:bg-terminal rounded-full"><ChevronRight size={32} /></button>
      </div>

      {!isAccessDenied && selectedRoom && (
         <div className="absolute top-20 right-10 z-50 animate-slideIn pointer-events-auto">
            <div className="bg-black/90 border-2 border-terminal p-6 max-w-sm shadow-[0_0_30px_rgba(255,176,0,0.3)]">
                <h3 className="text-3xl font-vt323 text-terminal mb-2">ROOM {selectedRoom.room_number}</h3>
                <div className="space-y-2 mb-6 font-mono text-sm text-white/80">
                    <div className="flex justify-between"><span>STATUS:</span><span className={isFull ? "text-red-500" : "text-green-400"}>{isFull ? "FULL" : "AVAILABLE"}</span></div>
                    <div className="border-t border-white/20 my-2 pt-2">
                        <div className="text-xs opacity-50 mb-1">RESIDENTS:</div>
                        {safeNames.length > 0 ? (
                            <ul className="list-none text-terminal space-y-1">{safeNames.map((name, i) => <li key={i}>{name}</li>)}</ul>
                        ) : <span className="italic opacity-50">None</span>}
                    </div>
                </div>
                <button onClick={() => !isFull && handleProceed()} disabled={isFull} className={`w-full font-bold py-2 ${isFull ? 'bg-gray-700 text-gray-400' : 'bg-terminal text-black hover:bg-white'}`}>
                    {isFull ? "UNAVAILABLE" : "PROCEED TO BOOKING >>"}
                </button>
                <button onClick={() => setSelectedRoom(null)} className="w-full mt-2 border border-red-500 text-red-500 py-1 hover:bg-red-500 hover:text-black">CLOSE</button>
            </div>
         </div>
      )}

      <Canvas camera={{ position: activeBlock.camPos, fov: 45 }} className="pointer-events-auto">
        <ambientLight intensity={isAccessDenied ? 0.1 : 0.4} />
        <pointLight position={[10, 20, 10]} intensity={isAccessDenied ? 0.5 : 1.5} color={isAccessDenied ? "#ff0000" : "#00eeff"} />
        <Html position={[0, activeBlock.type === 'circular' ? activeBlock.radius + 3 : 15, 0]} center style={{ pointerEvents: 'none' }}>
            <div className={`text-5xl font-vt323 text-center ${isAccessDenied ? 'text-red-500' : 'text-terminal'}`}>{activeBlock.name}</div>
        </Html>
        {!loading && <HologramHostel key={activeBlock.id} layout={activeBlock.type} radius={activeBlock.radius} roomCount={activeBlock.roomCount} roomPrefix={activeBlock.prefix} roomsData={roomsData} onSelectRoom={(r) => setSelectedRoom(prev => prev?.room_number === r.room_number ? null : r)} selectedRoomId={selectedRoom?.room_number} isRestricted={isAccessDenied} />}
        <Stars radius={100} depth={50} count={5000} factor={4} />
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  )
}
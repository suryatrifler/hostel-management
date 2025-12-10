import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { supabase } from '../supabaseClient';
import HologramHostel from './HologramHostel';
import PaymentGateway from './PaymentGateway';

export default function Scene3D({ student, onComplete }) {
  const [roomsData, setRoomsData] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchRooms();
    
    // Realtime subscription for locking system
    const subscription = supabase
      .channel('public:room_locks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_locks' }, fetchRooms)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const fetchRooms = async () => {
    try {
      // JOIN query: Room + Students + Active Locks
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          *,
          students ( full_name ),
          room_locks ( id, expires_at )
        `);

      if (error) throw error;

      const roomMap = {};
      const now = new Date();

      rooms.forEach(room => {
        const studentNames = room.students ? room.students.map(s => s.full_name) : [];
        
        // Calculate Active Locks
        const activeLocks = room.room_locks ? room.room_locks.filter(l => new Date(l.expires_at) > now).length : 0;
        
        // Total Occupancy = DB Occupancy + Locks
        const realOccupancy = room.current_occupancy || 0;
        const displayOccupancy = realOccupancy + activeLocks;

        roomMap[room.room_number] = {
           ...room,
           occupancy: displayOccupancy,
           real_occupancy: realOccupancy,
           student_names: studentNames
        };
      });
      setRoomsData(roomMap);
    } catch (err) {
      console.error("Error loading 3D data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (roomData) => {
    setSelectedRoom(prev => (prev && prev.room_number === roomData.room_number ? null : roomData));
  };

  // Helper for UI
  const isFull = (selectedRoom?.occupancy || 0) >= 2;
  const safeNames = selectedRoom?.student_names || [];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      
      {/* --- UI LAYER 1: LEGEND (Bottom Right) --- */}
      <div className="absolute bottom-6 right-6 z-50 bg-black/80 border border-terminal p-4 text-xs font-mono text-white/80 pointer-events-none animate-slideIn">
          <div className="font-bold text-terminal mb-2 border-b border-terminal/50 pb-1">STATUS INDEX</div>
          <div className="space-y-2">
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_#00ff00]"></div>
                  <span>AVAILABLE (0/2)</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_8px_#ffb000]"></div>
                  <span>PARTIAL (1/2)</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_#ff0000]"></div>
                  <span>FULL (2/2)</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-600 border border-gray-400"></div>
                  <span>SERVICE/IDLE</span>
              </div>
          </div>
      </div>

      {/* --- UI LAYER 2: PAYMENT GATEWAY OVERLAY --- */}
      {showPayment && selectedRoom && (
        <PaymentGateway 
          student={student} 
          room={selectedRoom} 
          onCancel={() => setShowPayment(false)}
          onSuccess={() => {
             setShowPayment(false);
             onComplete(); 
          }}
        />
      )}

      {/* --- UI LAYER 3: SELECTION PANEL (Top Right) --- */}
      {selectedRoom && !showPayment && (
         <div className="absolute top-20 right-10 z-50 animate-slideIn pointer-events-auto">
            <div className="bg-black/90 border-2 border-terminal p-6 max-w-sm shadow-[0_0_30px_rgba(255,176,0,0.3)]">
                <h3 className="text-3xl font-vt323 text-terminal mb-2">ROOM {selectedRoom.room_number}</h3>
                <div className="space-y-2 mb-6 font-mono text-sm text-white/80">
                    <div className="flex justify-between">
                        <span>STATUS:</span>
                        <span className={isFull ? "text-red-500" : "text-green-400"}>
                            {isFull ? "FULL - NO VACANCY" : "AVAILABLE"}
                        </span>
                    </div>
                    
                    <div className="border-t border-white/20 my-2 pt-2">
                        <div className="text-xs opacity-50 mb-1">CURRENT RESIDENTS:</div>
                        {safeNames.length > 0 ? (
                            <ul className="list-none text-terminal space-y-1">
                                {safeNames.map((name, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full"/> {name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="italic opacity-50">None</span>
                        )}
                    </div>
                </div>
                
                {/* ACTION BUTTONS */}
                <button 
                    onClick={() => !isFull && setShowPayment(true)}
                    disabled={isFull}
                    className={`w-full font-bold py-2 transition-colors ${
                        isFull 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-terminal text-black hover:bg-white shadow-[0_0_15px_#ffb000]'
                    }`}
                >
                    {isFull ? "UNAVAILABLE" : "PROCEED TO PAYMENT >>"}
                </button>
                
                <button 
                    onClick={() => setSelectedRoom(null)}
                    className="w-full mt-2 border border-red-500 text-red-500 py-1 hover:bg-red-500 hover:text-black transition-colors"
                >
                    CLOSE
                </button>
            </div>
         </div>
      )}

      {/* --- 3D CANVAS LAYER --- */}
      <Canvas camera={{ position: [25, 30, 35], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 20, 10]} intensity={1.5} color="#00eeff" />
        <pointLight position={[-10, 10, -10]} intensity={1} color="#ff00ff" />
        
        {/* FLOATING TITLE */}
        <Html position={[0, 18, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
            <div className="text-center pointer-events-none transform -translate-y-1/2 w-96">
                <div className="text-5xl font-vt323 text-terminal drop-shadow-[0_0_15px_rgba(255,176,0,0.8)] tracking-widest whitespace-nowrap">
                    ORBITAL BLOCK A
                </div>
                <div className="text-sm bg-terminal text-black px-3 py-1 font-bold inline-block rounded-sm mt-1">
                    ID: ORB-01
                </div>
            </div>
        </Html>

        {!loading && (
            <HologramHostel 
                roomsData={roomsData} 
                onSelectRoom={handleRoomClick} 
                selectedRoomId={selectedRoom?.room_number} 
            />
        )}
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {/* CONTROLS: Ensures rotation works */}
        <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} minPolarAngle={0} />
      </Canvas>
    </div>
  )
}
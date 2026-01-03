import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Lock } from 'lucide-react';

// --- CONFIGURATION ---
const ROOM_HEIGHT = 2;
const ROOM_WIDTH = 2;
const SPECIAL_WIDTH = 6; 
const ROOM_DEPTH = 3;
const RECT_ROOM_WIDTH = 2.5; 
const HALLWAY_GAP = 6;

function Room({ position, rotation, isMess, isEntrance, isIdle, roomNumber, data, onSelect, isSelected, width = ROOM_WIDTH, isRestricted }) {
  const [hovered, setHover] = useState(false);
  const occupancy = data?.occupancy || 0; 
  const capacity = 2;
  const residents = data?.student_names || [];

  // --- STATUS LOGIC ---
  let statusColor = '#444444'; 
  let isInteractable = false;

  // 1. Restricted Mode (Black/Grey Theme)
  if (isRestricted) {
      statusColor = '#ffffffff'; // Dark Grey edges
      isInteractable = true;   // Interactive only to show "Denied" tooltip
  } 
  // 2. Normal Mode
  else {
      if (isMess) statusColor = '#ff00ff';      
      else if (isEntrance) statusColor = '#00ff00'; 
      else if (!isIdle) {
          isInteractable = true;
          if (occupancy >= capacity) statusColor = '#ff0000'; // Full
          else if (occupancy > 0) statusColor = '#ffb000';    // Partial
          else statusColor = '#00ff00';                       // Empty
      }
  }

  // Handlers
  const handleOver = (e) => {
    e.stopPropagation();
    if (isInteractable) { 
        setHover(true); 
        document.body.style.cursor = isRestricted ? 'not-allowed' : 'pointer'; 
    }
  };
  const handleOut = () => { 
      setHover(false); 
      document.body.style.cursor = 'auto'; 
  };
  const handleClick = (e) => {
    e.stopPropagation();
    // Only allow selection if NOT restricted
    if (isInteractable && !isRestricted) {
        onSelect({ ...data, room_number: roomNumber, occupancy, student_names: residents });
    }
  };

  const isActive = isSelected || hovered;
  
  // Material Color Logic
  let materialColor = isActive ? '#ffffff' : statusColor;
  if (isRestricted) {
      materialColor = hovered ? '#2a2a2a' : '#050505'; // Very dark grey on hover, black otherwise
  }

  const opacityVal = (isIdle) ? 0.8 : (isActive ? 0.6 : 0.4);

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}
      >
        <boxGeometry args={[width, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshPhysicalMaterial 
            color={materialColor}
            emissive={isRestricted ? '#000000' : statusColor}
            emissiveIntensity={isActive ? 0.8 : 0.2}
            transmission={isRestricted ? 0 : 0.6} // Solid if restricted
            opacity={isRestricted ? 0.9 : opacityVal}
            transparent
            roughness={isRestricted ? 0.9 : 0.1}
            metalness={isRestricted ? 0.8 : 0}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, ROOM_HEIGHT, ROOM_DEPTH)]} />
        <lineBasicMaterial color={statusColor} transparent opacity={isRestricted ? 0.2 : 0.5} />
      </lineSegments>

      {/* TOOLTIP */}
      {hovered && isInteractable && !isSelected && (
          <Html distanceFactor={15} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
              {isRestricted ? (
                  // --- RESTRICTED TOOLTIP ---
                  <div className="bg-black/90 border border-red-900/50 p-3 w-40 text-center shadow-[0_0_20px_rgba(0,0,0,1)]">
                      <div className="flex justify-center mb-1 text-red-600"><Lock size={20} /></div>
                      <div className="text-red-500 font-bold font-vt323 text-xl tracking-widest">ACCESS DENIED</div>
                      <div className="text-[9px] text-red-500/50 font-mono">RESTRICTED SECTOR</div>
                  </div>
              ) : (
                  // --- NORMAL TOOLTIP ---
                  <div className="bg-black/95 border border-terminal p-3 text-white text-xs font-mono w-48 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                      <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-2">
                        <span className="font-bold text-terminal text-lg">ROOM {roomNumber}</span>
                        <span className={occupancy >= capacity ? "text-red-500" : "text-green-400"}>
                            {occupancy}/{capacity}
                        </span>
                      </div>
                      <div className="text-[10px] text-terminal text-center bg-terminal/10 py-1 mt-1">CLICK TO SELECT</div>
                  </div>
              )}
          </Html>
      )}
    </group>
  );
}

// --- 1. CIRCULAR FLOOR ---
function CircularFloor({ level, roomCount, radius, roomsData, onSelectRoom, selectedRoomId, roomPrefix, isRestricted }) {
  const rooms = [];
  const angleStep = (Math.PI * 2) / roomCount;
  
  const messIndex = 0;
  const entranceIndex = Math.floor(roomCount / 2);
  let currentRoomNumber = (level + 1) * 100 + 1; 

  for (let i = 0; i < roomCount; i++) {
    const angle = i * angleStep;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const rotation = [0, -angle, 0]; 

    let isMess = false, isEntrance = false, isIdle = false;
    let roomNum = null;

    if (i === messIndex) {
        if (level === 0) isMess = true; else isIdle = true;
    }
    else if (i === entranceIndex) {
        if (level === 0) isEntrance = true; else isIdle = true;
    }
    else {
        roomNum = `${roomPrefix}${currentRoomNumber}`;
        currentRoomNumber++;
    }

    const width = (isMess || isEntrance || isIdle) ? SPECIAL_WIDTH : ROOM_WIDTH;
    const data = roomNum ? roomsData[roomNum] : null;

    rooms.push(
      <Room 
        key={`circ-${level}-${i}`}
        position={[x, level * (ROOM_HEIGHT + 0.5), z]} 
        rotation={rotation}
        isMess={isMess} isEntrance={isEntrance} isIdle={isIdle}
        roomNumber={roomNum} width={width}
        data={data} onSelect={onSelectRoom} isSelected={selectedRoomId === roomNum} 
        isRestricted={isRestricted}
      />
    );
  }
  return <group>{rooms}</group>;
}

// --- 2. RECTANGULAR FLOOR ---
function RectangularFloor({ level, roomPrefix, roomsData, onSelectRoom, selectedRoomId, isRestricted }) {
  const rooms = [];
  const roomsPerSide = 10;
  const spacing = RECT_ROOM_WIDTH + 0.5; 
  const startX = -((roomsPerSide * spacing) / 2) + spacing / 2; 

  for (let i = 0; i < 20; i++) {
    const isRightSide = i >= roomsPerSide;
    const indexInRow = isRightSide ? (i - roomsPerSide) : i;
    const x = startX + (indexInRow * spacing);
    const y = level * (ROOM_HEIGHT + 0.5);
    const z = isRightSide ? (HALLWAY_GAP / 2) : -(HALLWAY_GAP / 2);
    const rotation = [0, isRightSide ? Math.PI : 0, 0];
    const roomNum = `${roomPrefix}${(level + 1) * 100 + (i + 1)}`;

    rooms.push(
      <Room 
        key={`rect-${level}-${i}`}
        position={[x, y, z]} rotation={rotation}
        roomNumber={roomNum} width={RECT_ROOM_WIDTH}
        data={roomsData[roomNum]} onSelect={onSelectRoom} isSelected={selectedRoomId === roomNum} 
        isRestricted={isRestricted}
      />
    );
  }
  
  return (
    <group>
        {rooms}
        {/* Floor Plank (Darker if restricted) */}
        <mesh position={[0, level * (ROOM_HEIGHT + 0.5) - ROOM_HEIGHT/2 + 0.1, 0]}>
            <boxGeometry args={[roomsPerSide * spacing, 0.2, HALLWAY_GAP]} />
            <meshStandardMaterial color={isRestricted ? "#0a0a0a" : "#1a1a1a"} roughness={0.8} />
        </mesh>
        {/* Ceiling Plank */}
        {level < 2 && (
             <mesh position={[0, level * (ROOM_HEIGHT + 0.5) + ROOM_HEIGHT/2, 0]}>
                <boxGeometry args={[roomsPerSide * spacing, 0.2, HALLWAY_GAP]} />
                <meshStandardMaterial color={isRestricted ? "#111" : "#333"} roughness={0.8} />
            </mesh>
        )}
        {/* Guide Lines (Hidden if restricted) */}
        {!isRestricted && (
            <mesh position={[0, level * (ROOM_HEIGHT + 0.5) - ROOM_HEIGHT/2 + 0.25, 0]} rotation={[-Math.PI/2, 0, 0]}>
                 <planeGeometry args={[roomsPerSide * spacing - 2, 2]} />
                 <meshBasicMaterial color="#00ff00" transparent opacity={0.1} />
            </mesh>
        )}
    </group>
  )
}

// --- MAIN EXPORT ---
export default function HologramHostel({ layout = 'circular', roomsData, onSelectRoom, selectedRoomId, radius, roomCount, roomPrefix, isRestricted = false }) {
  const group = useRef();
  useFrame(() => { if(group.current) group.current.rotation.y += 0.001; });

  return (
    <group ref={group}>
      {[0, 1, 2].map(level => (
        layout === 'rectangular' 
        ? <RectangularFloor key={level} level={level} roomPrefix={roomPrefix} roomsData={roomsData} onSelectRoom={onSelectRoom} selectedRoomId={selectedRoomId} isRestricted={isRestricted} />
        : <CircularFloor key={level} level={level} roomCount={roomCount} radius={radius} roomPrefix={roomPrefix} roomsData={roomsData} onSelectRoom={onSelectRoom} selectedRoomId={selectedRoomId} isRestricted={isRestricted} />
      ))}
    </group>
  );
}
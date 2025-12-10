import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// --- CONFIGURATION ---
const ROOM_COUNT = 32;
const RADIUS = 15;
const ROOM_HEIGHT = 2;
const ROOM_WIDTH = 2;
const SPECIAL_WIDTH = 6;
const ROOM_DEPTH = 3;

// --- REUSABLE MATERIALS ---
const idleMaterial = new THREE.MeshPhysicalMaterial({
  color: '#2a2a2a', transmission: 0.2, opacity: 0.8, transparent: true, roughness: 0.8
});

function Room({ position, rotation, isMess, isEntrance, isIdle, roomNumber, data, onSelect, isSelected }) {
  const [hovered, setHover] = useState(false);
  const occupancy = data?.occupancy || 0; 
  const capacity = 2;
  const residents = data?.student_names || [];

  const width = (isMess || isEntrance || isIdle) ? SPECIAL_WIDTH : ROOM_WIDTH;

  // Status Logic
  let statusColor = '#444444'; 
  let isInteractable = false;

  if (isMess) statusColor = '#ff00ff';      
  else if (isEntrance) statusColor = '#00ff00'; 
  else if (!isIdle) {
      isInteractable = true;
      if (occupancy >= capacity) statusColor = '#ff0000'; // Full
      else if (occupancy > 0) statusColor = '#ffb000';    // Partial
      else statusColor = '#00ff00';                       // Empty
  }

  // Handlers
  const handleOver = (e) => {
    e.stopPropagation();
    if (isInteractable) {
        setHover(true);
        document.body.style.cursor = 'pointer';
    }
  };
  const handleOut = () => {
    setHover(false);
    document.body.style.cursor = 'auto';
  };
  const handleClick = (e) => {
    e.stopPropagation();
    if (isInteractable) {
        // Pass full data up
        onSelect({ 
            ...data, 
            room_number: roomNumber,
            occupancy: occupancy, 
            student_names: residents 
        });
    }
  };

  const isActive = isSelected || hovered;
  const materialColor = isActive ? '#ffffff' : statusColor; 
  const opacityVal = (isIdle) ? 0.8 : (isActive ? 0.6 : 0.4);

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        onPointerOver={handleOver} 
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <boxGeometry args={[width, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshPhysicalMaterial 
            color={materialColor}
            emissive={statusColor}
            emissiveIntensity={isActive ? 0.8 : 0.2}
            transmission={0.6}
            opacity={opacityVal}
            transparent
            roughness={0.1}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, ROOM_HEIGHT, ROOM_DEPTH)]} />
        <lineBasicMaterial color={statusColor} transparent opacity={0.5} />
      </lineSegments>

      {/* TOOLTIP: Only on hover, not selected */}
      {hovered && isInteractable && !isSelected && (
          <Html distanceFactor={15} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
              <div className="bg-black/95 border border-terminal p-3 text-white text-xs font-mono w-48 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                  <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-2">
                    <span className="font-bold text-terminal text-lg">ROOM {roomNumber}</span>
                    <span className={occupancy >= capacity ? "text-red-500" : "text-green-400"}>
                        {occupancy}/{capacity}
                    </span>
                  </div>
                  
                  {residents.length > 0 ? (
                    <div className="mb-2 space-y-1">
                        <div className="text-[10px] opacity-50 uppercase tracking-widest">OCCUPANTS:</div>
                        {residents.map((name, i) => (
                            <div key={i} className="text-white truncate flex items-center gap-2">
                                <div className="w-1 h-1 bg-terminal rounded-full"></div> 
                                {name}
                            </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-white/40 italic mb-2">No Occupants</div>
                  )}

                  <div className="text-[10px] text-terminal text-center bg-terminal/10 py-1 mt-1">
                    CLICK TO SELECT
                  </div>
              </div>
          </Html>
      )}
    </group>
  );
}

function Floor({ level, roomCount, radius, roomsData, onSelectRoom, selectedRoomId }) {
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
        roomNum = currentRoomNumber.toString();
        currentRoomNumber++;
    }

    const data = roomNum ? roomsData[roomNum] : null;

    rooms.push(
      <Room 
        key={`${level}-${i}`}
        position={[x, level * (ROOM_HEIGHT + 0.5), z]} 
        rotation={rotation}
        isMess={isMess}
        isEntrance={isEntrance}
        isIdle={isIdle}
        roomNumber={roomNum}
        data={data}
        onSelect={onSelectRoom}
        isSelected={selectedRoomId === roomNum} 
      />
    );
  }

  return (
    <group>
      {rooms}
      <mesh position={[0, level * (ROOM_HEIGHT + 0.5), 0]}>
         <cylinderGeometry args={[5, 5, ROOM_HEIGHT, 32]} />
         <meshPhysicalMaterial color="#ff00ff" transmission={0.5} opacity={0.1} transparent wireframe />
      </mesh>
    </group>
  );
}

export default function HologramHostel({ roomsData, onSelectRoom, selectedRoomId }) {
  const group = useRef();
  useFrame(() => { if(group.current) group.current.rotation.y += 0.0005; });

  return (
    <group ref={group}>
      <Floor level={0} roomCount={ROOM_COUNT} radius={RADIUS} roomsData={roomsData} onSelectRoom={onSelectRoom} selectedRoomId={selectedRoomId} />
      <Floor level={1} roomCount={ROOM_COUNT} radius={RADIUS} roomsData={roomsData} onSelectRoom={onSelectRoom} selectedRoomId={selectedRoomId} />
      <Floor level={2} roomCount={ROOM_COUNT} radius={RADIUS} roomsData={roomsData} onSelectRoom={onSelectRoom} selectedRoomId={selectedRoomId} />
    </group>
  );
}
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// CONFIG
const BASE_Y = -2.5;
const SCALE = 2.4;
const CAMERA_POS = [0, 0, 8];
const MODEL_X = -2.5; 

// --- 1. THE MODEL LOADER ---
function CustomModel({ url, onError, onTrackPosition, onSuccess }) {
  try {
    // Attempt to load the URL
    const { scene } = useGLTF(url, true); 
    const modelRef = useRef();

    // If successful, tell parent component
    useEffect(() => {
        if(onSuccess) onSuccess();
    }, [url, onSuccess]);

    // Apply Sci-Fi Material Effect
    useEffect(() => {
      scene.traverse((child) => {
        if (child.isMesh) {
            if(child.material.map) {
                child.material = new THREE.MeshStandardMaterial({
                    map: child.material.map,
                    color: "#b0faff",
                    emissive: "#004050",
                    emissiveIntensity: 0.5,
                    roughness: 0.4,
                    metalness: 0.8,
                    transparent: true,
                    opacity: 0.9,
                });
            } else {
                child.material = new THREE.MeshStandardMaterial({
                    color: "#00f0ff",
                    wireframe: true
                });
            }
        }
      });
    }, [scene]);

    // Animation
    useFrame((state) => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.002; 
        modelRef.current.position.y = BASE_Y + Math.sin(state.clock.elapsedTime) * 0.1;
      }
    });

    return (
      <>
        <primitive ref={modelRef} object={scene} position={[MODEL_X, BASE_Y, 0]} scale={SCALE} />
        <PositionTracker modelRef={modelRef} onTrackPosition={onTrackPosition} />
      </>
    );
  } catch (error) {
    // If loading fails (file doesn't exist), trigger error
    onError();
    return null;
  }
}

// --- 2. POSITION TRACKER (Helper) ---
function PositionTracker({ modelRef, onTrackPosition }) {
  const { camera, size } = useThree();
  const vector = new THREE.Vector3();

  useFrame(() => {
    if (modelRef.current && onTrackPosition) {
      modelRef.current.getWorldPosition(vector);
      vector.y += 2.5; 
      vector.x += 0.5; 
      vector.project(camera);
      const x = (vector.x * 0.5 + 0.5) * size.width;
      const y = (-(vector.y * 0.5) + 0.5) * size.height;
      onTrackPosition({ x, y });
    }
  });
  return null;
}

// --- 3. FALLBACK (Wireframe Box) ---
function FallbackAvatar() {
    const mesh = useRef();
    useFrame(() => (mesh.current.rotation.x = mesh.current.rotation.y += 0.01));
    return (
        <mesh ref={mesh} scale={1.5} position={[MODEL_X, 0, 0]}>
            <boxGeometry />
            <meshBasicMaterial color="#00f0ff" wireframe />
        </mesh>
    );
}

// --- 4. MAIN EXPORT ---
export default function StudentAvatar({ onTrackPosition, primaryUrl, fallbackUrl }) {
  
  // State to track which URL we are currently trying to show
  const [activeUrl, setActiveUrl] = useState(primaryUrl);
  const [hasError, setHasError] = useState(false);

  // If the prop changes (new student clicked), reset to try their specific model first
  useEffect(() => {
      setActiveUrl(primaryUrl);
      setHasError(false);
  }, [primaryUrl]);

  const handleError = () => {
      // If the specific model failed, switch to fallback
      if (activeUrl !== fallbackUrl) {
          console.warn(`Specific model not found (${activeUrl}). Switching to default.`);
          setActiveUrl(fallbackUrl);
      } else {
          // If even fallback fails, show the wireframe box
          setHasError(true);
      }
  };

  return (
    <div className="w-full h-full"> 
      <Canvas camera={{ position: CAMERA_POS, fov: 40 }}>
        <ambientLight intensity={1.5} />
        <spotLight position={[-5, 5, 0]} color="#00ffff" intensity={5} />
        <pointLight position={[5, 5, 5]} color="#ffffff" intensity={2} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <React.Suspense fallback={<FallbackAvatar />}>
           {hasError ? <FallbackAvatar /> : (
               <CustomModel 
                   url={activeUrl} 
                   onError={handleError} 
                   onTrackPosition={onTrackPosition} 
               />
           )}
        </React.Suspense>
        
        <ContactShadows position={[MODEL_X, -2, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#00f0ff" />
        
        <OrbitControls 
            enableZoom={false}       
            enablePan={false}        
            enableRotate={false}      
            minPolarAngle={Math.PI / 2.1} 
            maxPolarAngle={Math.PI / 1.9}
        />
      </Canvas>
    </div>
  );
}
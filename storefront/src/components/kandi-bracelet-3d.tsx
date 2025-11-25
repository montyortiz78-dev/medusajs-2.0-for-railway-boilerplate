'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

// ... (Keep COLOR_MAP and BEAD_WIDTHS and BEAD_GAP exactly as they are) ...
const COLOR_MAP: Record<string, string> = {
  "neon-pink": "#FF00CC", "neon-green": "#39FF14", "electric-blue": "#00FFFF",
  "hot-orange": "#FF5E00", "bright-yellow": "#FFFF00", "purple": "#9D00FF",
  "black": "#1A1A1A", "white": "#F0F0F0", "glow-in-dark": "#E0FFD1",
  "silver": "#C0C0C0", "gold": "#FFD700"
};

const BEAD_WIDTHS: Record<string, number> = {
  "pony": 0.6, "star": 0.65, "heart": 0.55, "flower": 0.55, "skull": 0.7
};

const BEAD_GAP = 0.02;

// ... (Keep Bead function exactly as is) ...
function Bead({ type, color, position, rotation }: { type: string, color: string, position: [number, number, number], rotation: [number, number, number] }) {
  const hex = COLOR_MAP[color] || '#cccccc';
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        {type === 'pony' && <sphereGeometry args={[0.3, 32, 32]} />}
        {type === 'star' && <octahedronGeometry args={[0.5]} />}
        {type === 'heart' && <dodecahedronGeometry args={[0.48]} />}
        {type === 'skull' && <boxGeometry args={[0.55, 0.65, 0.55]} />}
        {type === 'flower' && <icosahedronGeometry args={[0.48]} />}
        {!['pony','star','heart','skull','flower'].includes(type) && <sphereGeometry args={[0.3, 32, 32]} />}
        <meshStandardMaterial color={hex} roughness={0.15} metalness={0.1} emissive={hex} emissiveIntensity={color.includes('neon') || color.includes('glow') ? 0.4 : 0} />
      </mesh>
    </group>
  );
}

// Updated Ring Component handling the "Capture Mode"
function BraceletRing({ pattern, captureMode }: { pattern: any[], captureMode: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // 1. Calculate Geometry (Same as before)
  const { beads, radius } = useMemo(() => {
    const totalBeadWidth = pattern.reduce((sum, bead) => sum + (BEAD_WIDTHS[bead.type] || 0.6) + BEAD_GAP, 0);
    const minRadius = totalBeadWidth / (2 * Math.PI);
    const finalRadius = Math.max(minRadius, 2.2);

    const beadData = pattern.map((bead, i) => {
      const angle = (i / pattern.length) * Math.PI * 2;
      const x = Math.cos(angle) * finalRadius;
      const y = Math.sin(angle) * finalRadius;
      
      // Jitter is okay! It makes it look real.
      const jitterX = (Math.random() - 0.5) * 0.5; 
      const jitterY = (Math.random() - 0.5) * 0.5; 
      const jitterZ = (Math.random() - 0.5) * 0.5;

      return { ...bead, x, y, rotZ: angle + Math.PI / 2, jitterRot: [jitterX, jitterY, jitterZ] };
    });

    return { beads: beadData, radius: finalRadius };
  }, [pattern]);

  // 2. Animation Loop
  useFrame((state, delta) => {
    if (groupRef.current) {
      if (captureMode) {
        // STOP! Reset to perfect front view for the photo
        groupRef.current.rotation.z = 0; 
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.y = 0;
        
        // Force camera to standard position
        state.camera.position.lerp(new THREE.Vector3(0, 0, 9), 0.1);
        state.camera.lookAt(0, 0, 0);
      } else {
        // SPIN! Normal behavior
        groupRef.current.rotation.z -= delta * 0.1;
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <torusGeometry args={[radius, 0.04, 16, 100]} />
        <meshStandardMaterial color="#eeeeee" transparent opacity={0.8} />
      </mesh>
      {beads.map((b, i) => (
        <Bead key={i} type={b.type} color={b.color} position={[b.x, b.y, 0]} rotation={[Math.PI / 2 + b.jitterRot[0], 0 + b.jitterRot[1], b.rotZ + b.jitterRot[2]]} />
      ))}
    </group>
  );
}

// Pass the prop down
export default function KandiBracelet3D({ pattern, captureMode = false }: { pattern: any[], captureMode?: boolean }) {
  return (
    <div className="w-full h-[400px] cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 9], fov: 45 }} shadows gl={{ preserveDrawingBuffer: true }} id="kandi-canvas">
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -5, 5]} intensity={0.8} color="#ff00cc" distance={20} />
        <pointLight position={[10, -5, 5]} intensity={0.8} color="#00ffff" distance={20} />
        
        {/* Disable Float animation during capture for stillness */}
        <Float speed={captureMode ? 0 : 3} rotationIntensity={captureMode ? 0 : 0.2} floatIntensity={captureMode ? 0 : 0.2}>
           <BraceletRing pattern={pattern} captureMode={captureMode} />
        </Float>

        <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={15} blur={2.5} far={5} />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enabled={!captureMode} />
      </Canvas>
    </div>
  );
}
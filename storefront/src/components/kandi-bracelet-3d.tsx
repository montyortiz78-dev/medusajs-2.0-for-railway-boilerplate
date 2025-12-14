'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

const COLOR_MAP: Record<string, string> = {
  "neon-pink": "#FF00CC", "neon-green": "#39FF14", "electric-blue": "#00FFFF",
  "hot-orange": "#FF5E00", "bright-yellow": "#FFFF00", "purple": "#9D00FF",
  "black": "#111111", "white": "#F0F0F0", "glow-in-dark": "#E0FFD1",
  "silver": "#C0C0C0", "gold": "#FFD700"
};

const getColorHex = (colorName: string) => {
    if (!colorName) return '#cccccc';
    if (colorName.startsWith('#')) return colorName;
    return COLOR_MAP[colorName] || '#cccccc';
};

const BEAD_WIDTHS: Record<string, number> = {
  "pony": 0.6, "star": 0.65, "heart": 0.55, "flower": 0.55, "skull": 0.7
};

const BEAD_GAP = 0.02;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Bead({ type = 'pony', color = '#FFFFFF', position, rotation }: { type?: string, color?: string, position: [number, number, number], rotation: [number, number, number] }) {
  const hex = getColorHex(color);
  const isNeon = color && (color.includes('neon') || color.includes('glow'));

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        {type === 'pony' && <sphereGeometry args={[0.3, 32, 32]} />}
        {type === 'star' && <octahedronGeometry args={[0.5]} />}
        {type === 'heart' && <dodecahedronGeometry args={[0.48]} />}
        {type === 'skull' && <boxGeometry args={[0.55, 0.65, 0.55]} />}
        {type === 'flower' && <icosahedronGeometry args={[0.48]} />}
        {!['pony','star','heart','skull','flower'].includes(type) && <sphereGeometry args={[0.3, 32, 32]} />}

        <meshPhysicalMaterial 
          color={hex}
          roughness={0.1}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          emissive={hex}
          emissiveIntensity={isNeon ? 0.2 : 0}
        />
      </mesh>
    </group>
  );
}

function BraceletRing({ pattern, captureMode, rows = 1, stitch = 'ladder' }: { pattern: any[], captureMode: boolean, rows?: number, stitch?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const { beads, radius } = useMemo(() => {
    if (!pattern || pattern.length === 0) return { beads: [], radius: 2.2 };

    const normalizedPattern = pattern.map(p => {
        if (typeof p === 'string') return { type: 'pony', color: p };
        return p;
    });

    const totalBeadWidth = normalizedPattern.reduce((sum, bead) => sum + (BEAD_WIDTHS[bead.type] || 0.6) + BEAD_GAP, 0);
    const minRadius = totalBeadWidth / (2 * Math.PI);
    const finalRadius = Math.max(minRadius, 2.2);

    const allBeads: any[] = [];
    const ROW_HEIGHT = 0.55; 
    
    const totalHeight = (rows - 1) * ROW_HEIGHT;
    const startY = -totalHeight / 2;

    // Detect if we should stagger the beads (Peyote/Brick stitch)
    const isStaggered = ['peyote', 'brick'].includes(stitch.toLowerCase());

    for (let r = 0; r < rows; r++) {
        const rowZ = startY + (r * ROW_HEIGHT); 
        
        // If staggered, offset every other row by half a bead (0.5)
        const patternShift = (isStaggered && r % 2 !== 0) ? 0.5 : 0;

        normalizedPattern.forEach((bead, i) => {
            // Apply shift to angle calculation
            const shiftedI = i + patternShift;
            const angle = (shiftedI / normalizedPattern.length) * Math.PI * 2;
            
            const x = Math.cos(angle) * finalRadius;
            const y = Math.sin(angle) * finalRadius;
            
            const jitterX = (Math.random() - 0.5) * 0.1; 
            const jitterY = (Math.random() - 0.5) * 0.1; 
            const jitterZ = (Math.random() - 0.5) * 0.1;

            allBeads.push({ 
                ...bead, 
                x, 
                y, 
                z: rowZ, 
                rotZ: angle + Math.PI / 2, 
                jitterRot: [jitterX, jitterY, jitterZ] 
            });
        });
    }

    return { beads: allBeads, radius: finalRadius };
  }, [pattern, rows, stitch]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (captureMode) {
        groupRef.current.rotation.set(0, 0, 0);
      } else {
        groupRef.current.rotation.z -= delta * 0.1;
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Strings */}
      {range(rows).map(r => {
          const ROW_HEIGHT = 0.55;
          const totalHeight = (rows - 1) * ROW_HEIGHT;
          const zPos = -totalHeight / 2 + (r * ROW_HEIGHT);
          
          return (
            <mesh key={`string-${r}`} position={[0, 0, zPos]}>
                <torusGeometry args={[radius, 0.04, 16, 100]} />
                <meshStandardMaterial color="#eeeeee" transparent opacity={0.8} />
            </mesh>
          )
      })}

      {beads.map((b, i) => (
        <Bead 
          key={i} 
          type={b.type} 
          color={b.color} 
          position={[b.x, b.y, b.z]} 
          rotation={[
            Math.PI / 2 + b.jitterRot[0], 
            0 + b.jitterRot[1], 
            b.rotZ + b.jitterRot[2]
          ]} 
        />
      ))}
    </group>
  );
}

// ... CameraRig ... (omitted for brevity, unchanged)

function CameraRig({ captureMode }: { captureMode: boolean }) {
  const { camera } = useThree();
  useFrame(() => {
    if (captureMode) {
      camera.position.set(0, 0, 9);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

export default function KandiBracelet3D({ pattern, captureMode = false, rows = 1, stitch = 'ladder' }: { pattern: any[], captureMode?: boolean, rows?: number, stitch?: string }) {
  return (
    <div className="w-full h-[400px] cursor-grab active:cursor-grabbing">
      <Canvas 
        camera={{ position: [0, 0, 9], fov: 45 }} 
        shadows 
        gl={{ preserveDrawingBuffer: true }} 
        id="kandi-canvas"
      >
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -5, 5]} intensity={0.5} color="white" />
        
        <Float 
            speed={captureMode ? 0 : 3} 
            rotationIntensity={captureMode ? 0 : 0.2} 
            floatIntensity={captureMode ? 0 : 0.2}
            floatingRange={captureMode ? [0,0] : undefined}
        >
           <BraceletRing pattern={pattern} captureMode={captureMode} rows={rows} stitch={stitch} />
        </Float>

        <CameraRig captureMode={captureMode} />

        <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={15} blur={2.5} far={5} />
        <Environment preset="city" />
        
        <OrbitControls enableZoom={false} enabled={!captureMode} />
      </Canvas>
    </div>
  );
}
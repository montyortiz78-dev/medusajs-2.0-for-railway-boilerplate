'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, useTexture } from '@react-three/drei';
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

  // UPDATED: Now points to the generic filenames
  const textures = useTexture({
    normalMap: '/textures/plastic/bead-normal.jpg',
    roughnessMap: '/textures/plastic/bead-roughness.jpg',
  });

  // Tweak these settings if the beads look too "scratched"
  textures.normalMap.repeat.set(3, 1);
  textures.normalMap.wrapS = THREE.RepeatWrapping;
  textures.normalMap.wrapT = THREE.RepeatWrapping;

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
          
          // Texture Maps
          normalMap={textures.normalMap}
          normalScale={new THREE.Vector2(0.4, 0.4)} // Lower = smoother, Higher = rougher
          roughnessMap={textures.roughnessMap}
          
          // PBR Material Settings
          roughness={1.0}        
          metalness={0.0}
          clearcoat={1.0}        // High gloss topcoat
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
    // 1. Handle empty pattern
    if (!pattern || pattern.length === 0) return { beads: [], radius: 2.8 };

    // 2. Normalize pattern to objects
    let normalizedPattern = pattern.map(p => {
        if (typeof p === 'string') return { type: 'pony', color: p };
        return { type: p.type || 'pony', color: p.color };
    });

    // 3. FORCE MINIMUM BEAD COUNT (~20-25)
    // If pattern is short (e.g. 5 beads), repeat it until we have enough to fill a wrist.
    // A standard bracelet is ~22-26 pony beads.
    const TARGET_MIN_BEADS = 24; 
    
    if (normalizedPattern.length < TARGET_MIN_BEADS) {
        const repeatCount = Math.ceil(TARGET_MIN_BEADS / normalizedPattern.length);
        const newPattern = [];
        for (let i = 0; i < repeatCount; i++) {
            newPattern.push(...normalizedPattern);
        }
        // Trim if it got too huge (optional, but keeps it safe)
        normalizedPattern = newPattern.slice(0, Math.max(normalizedPattern.length * repeatCount, TARGET_MIN_BEADS));
    }

    // 4. Calculate Radius based on the NEW count
    // We assume a standard bead width of ~0.6 units + 0.02 gap
    const totalBeadWidth = normalizedPattern.reduce((sum, bead) => sum + (BEAD_WIDTHS[bead.type] || 0.6) + BEAD_GAP, 0);
    
    // Circumference = 2 * PI * r  =>  r = Circumference / (2 * PI)
    // We ensure the radius never drops below "wrist size" (approx 2.6 units)
    const calculatedRadius = totalBeadWidth / (2 * Math.PI);
    const finalRadius = Math.max(calculatedRadius, 2.6); 

    const allBeads: any[] = [];
    const ROW_HEIGHT = 0.55; 
    
    const totalHeight = (rows - 1) * ROW_HEIGHT;
    const startY = -totalHeight / 2;

    const isStaggered = ['peyote', 'brick'].includes(stitch.toLowerCase());

    for (let r = 0; r < rows; r++) {
        const rowZ = startY + (r * ROW_HEIGHT); 
        const patternShift = (isStaggered && r % 2 !== 0) ? 0.5 : 0;

        normalizedPattern.forEach((bead, i) => {
            const shiftedI = i + patternShift;
            const angle = (shiftedI / normalizedPattern.length) * Math.PI * 2;
            
            const x = Math.cos(angle) * finalRadius;
            const y = Math.sin(angle) * finalRadius;
            
            // Chaos/Jitter Logic
            const jitterX = (Math.random() - 0.5) * 0.1; 
            const jitterY = (Math.random() - 0.5) * 0.1; 
            const jitterZ = (Math.random() - 0.5) * 0.1;
            const twist = (Math.random() - 0.5) * 0.5; 

            allBeads.push({ 
                ...bead, 
                x, 
                y, 
                z: rowZ, 
                rotZ: angle + Math.PI / 2 + twist, 
                jitterRot: [jitterX, jitterY, jitterZ] 
            });
        });
    }

    return { beads: allBeads, radius: finalRadius };
  }, [pattern, rows, stitch]);

  useFrame((state, delta) => {
    // ... same rotation logic ...
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
                {/* Updated torus to match new radius */}
                <torusGeometry args={[radius, 0.04, 32, 100]} />
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
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -5, 5]} intensity={0.5} color="white" />
        
        {/* Studio Lighting Environment */}
        <Environment preset="city" />

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
        
        <OrbitControls enableZoom={false} enabled={!captureMode} />
      </Canvas>
    </div>
  );
}
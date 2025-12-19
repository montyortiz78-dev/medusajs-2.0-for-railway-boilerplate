'use client';

import { useRef, useMemo, Suspense, useEffect, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, useTexture, Bounds, useBounds } from '@react-three/drei';
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

// Dimensions
const BEAD_WIDTHS: Record<string, number> = {
  "pony": 0.6, "star": 0.65, "heart": 0.55, "flower": 0.55, "skull": 0.7
};
const BEAD_GAP = 0.02;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// --- 1. SOLID GEOMETRY (Corrected Winding Order) ---
function usePonyBeadGeometry() {
  const geometry = useMemo(() => {
    const points = [];
    
    // Bead Dimensions
    const holeRadius = 0.15;
    const outerRadius = 0.32;
    const height = 0.44;
    const halfH = height / 2;
    const bevel = 0.05;

    // FIX: Draw Profile Counter-Clockwise (Bottom -> Outer -> Top)
    // This ensures normals point OUTWARDS so the bead looks solid.
    
    // 1. Inner Wall Bottom (Start at hole bottom)
    points.push(new THREE.Vector2(holeRadius, -halfH));
    
    // 2. Bottom Face
    points.push(new THREE.Vector2(outerRadius - bevel, -halfH));
    
    // 3. Bottom Bevel
    points.push(new THREE.Vector2(outerRadius, -halfH + bevel));
    
    // 4. Outer Barrel
    points.push(new THREE.Vector2(outerRadius + 0.01, 0));
    
    // 5. Top Bevel
    points.push(new THREE.Vector2(outerRadius, halfH - bevel));
    
    // 6. Top Face
    points.push(new THREE.Vector2(outerRadius - bevel, halfH));
    
    // 7. Inner Wall Top
    points.push(new THREE.Vector2(holeRadius, halfH));
    
    // 8. Close Loop (Back to start)
    points.push(new THREE.Vector2(holeRadius, -halfH));

    const geom = new THREE.LatheGeometry(points, 32);
    geom.computeVertexNormals();
    return geom;
  }, []);

  return geometry;
}

function Bead({ type = 'pony', color = '#FFFFFF', position, rotation }: { type?: string, color?: string, position: [number, number, number], rotation: [number, number, number] }) {
  const hex = getColorHex(color);
  const isNeon = color && (color.includes('neon') || color.includes('glow'));
  const ponyGeometry = usePonyBeadGeometry();

  const textures = useTexture({
    normalMap: '/textures/plastic/bead-normal.jpg',
    roughnessMap: '/textures/plastic/bead-roughness.jpg',
  });

  useLayoutEffect(() => {
    textures.normalMap.repeat.set(2, 1);
    textures.normalMap.wrapS = THREE.RepeatWrapping;
    textures.normalMap.wrapT = THREE.RepeatWrapping;
    textures.normalMap.needsUpdate = true;

    textures.roughnessMap.repeat.set(2, 1);
    textures.roughnessMap.wrapS = THREE.RepeatWrapping;
    textures.roughnessMap.wrapT = THREE.RepeatWrapping;
    textures.roughnessMap.needsUpdate = true;
  }, [textures]);

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow geometry={type === 'pony' ? ponyGeometry : undefined}>
        {/* Fallback Geometries */}
        {type === 'star' && <octahedronGeometry args={[0.5]} />}
        {type === 'heart' && <dodecahedronGeometry args={[0.48]} />}
        {type === 'skull' && <boxGeometry args={[0.55, 0.65, 0.55]} />}
        {type === 'flower' && <icosahedronGeometry args={[0.48]} />}
        {!['pony','star','heart','skull','flower'].includes(type) && <sphereGeometry args={[0.3, 32, 32]} />}

        <meshPhysicalMaterial 
          color={hex}
          normalMap={textures.normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)} 
          roughnessMap={textures.roughnessMap}
          roughness={0.3} 
          metalness={0.0}
          clearcoat={0} 
          emissive={hex}
          emissiveIntensity={isNeon ? 0.35 : 0}
          side={THREE.FrontSide} // Now correctly renders the outside because normals are fixed
        />
      </mesh>
    </group>
  );
}

function BraceletRing({ pattern, rows = 1, stitch = 'ladder' }: { pattern: any[], rows?: number, stitch?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const { beads, radius } = useMemo(() => {
    if (!pattern || pattern.length === 0) return { beads: [], radius: 2.8 };

    let normalizedPattern = pattern.map(p => {
        if (typeof p === 'string') return { type: 'pony', color: p };
        return { type: p.type || 'pony', color: p.color };
    });

    const TARGET_MIN_BEADS = 24; 
    
    if (normalizedPattern.length < TARGET_MIN_BEADS) {
        const repeatCount = Math.ceil(TARGET_MIN_BEADS / normalizedPattern.length);
        const newPattern = [];
        for (let i = 0; i < repeatCount; i++) {
            newPattern.push(...normalizedPattern);
        }
        normalizedPattern = newPattern.slice(0, Math.max(normalizedPattern.length * repeatCount, TARGET_MIN_BEADS));
    }

    const totalBeadWidth = normalizedPattern.reduce((sum, bead) => sum + (BEAD_WIDTHS[bead.type] || 0.6) + BEAD_GAP, 0);
    const calculatedRadius = totalBeadWidth / (2 * Math.PI);
    const finalRadius = Math.max(calculatedRadius, 2.6); 

    const allBeads: any[] = [];
    
    const stitchMode = stitch.toLowerCase();
    let verticalSpacing = 0.55; 
    let stagger = false;

    if (stitchMode.includes('peyote') || stitchMode.includes('brick')) {
        verticalSpacing = 0.55 * 0.85; 
        stagger = true;
    }

    const totalHeight = (rows - 1) * verticalSpacing;
    const startZ = -totalHeight / 2;

    for (let r = 0; r < rows; r++) {
        const rowZ = startZ + (r * verticalSpacing); 
        const isOddRow = r % 2 !== 0;
        const rowPatternShift = (stagger && isOddRow) ? 0.5 : 0;

        normalizedPattern.forEach((bead, i) => {
            const shiftedI = i + rowPatternShift;
            const angle = (shiftedI / normalizedPattern.length) * Math.PI * 2;
            
            const x = Math.cos(angle) * finalRadius;
            const y = Math.sin(angle) * finalRadius;
            
            const jitterX = (Math.random() - 0.5) * 0.05; 
            const jitterY = (Math.random() - 0.5) * 0.05; 
            const jitterZ = (Math.random() - 0.5) * 0.05;
            const twist = (Math.random() - 0.5) * 0.15; 

            // Alignment: Orient local Y-axis (Hole) to Ring Tangent
            const alignmentRotation = angle; 

            allBeads.push({ 
                ...bead, 
                x, 
                y, 
                z: rowZ,
                rotZ: alignmentRotation, 
                jitterRot: [jitterX, jitterY, jitterZ + twist] 
            });
        });
    }

    return { beads: allBeads, radius: finalRadius };
  }, [pattern, rows, stitch]);

  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.z -= delta * 0.1;
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* SOLID STRING */}
      {range(rows).map(r => {
          const stitchMode = stitch.toLowerCase();
          let vSpacing = 0.55;
          if (stitchMode.includes('peyote') || stitchMode.includes('brick')) vSpacing = 0.55 * 0.85;
          
          const totalHeight = (rows - 1) * vSpacing;
          const zPos = -totalHeight / 2 + (r * vSpacing);
          
          return (
            <mesh key={`string-${r}`} position={[0, 0, zPos]}>
                <torusGeometry args={[radius, 0.035, 12, 100]} />
                <meshStandardMaterial 
                  color="#F5F5F5" 
                  roughness={0.9} 
                  opacity={1} 
                />
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
            b.jitterRot[0], 
            b.jitterRot[1], 
            b.rotZ + b.jitterRot[2]
          ]} 
        />
      ))}
    </group>
  );
}

function SnapshotManager({ captureMode, controlsRef }: { captureMode: boolean, controlsRef: any }) {
  const api = useBounds()
  const { camera } = useThree()

  useEffect(() => {
    if (captureMode && controlsRef.current) {
        const controls = controlsRef.current
        controls.object.position.set(0, -12, 8) 
        controls.target.set(0, 0, 0)
        controls.object.up.set(0, 0, 1) 
        controls.update()
        if (api) setTimeout(() => api.refresh().fit(), 50) 
    } else {
        if (api) api.refresh().fit()
    }
  }, [captureMode, api, camera, controlsRef])

  return null
}

export default function KandiBracelet3D({ pattern, captureMode = false, rows = 1, stitch = 'ladder' }: { pattern: any[], captureMode?: boolean, rows?: number, stitch?: string }) {
  const controlsRef = useRef<any>(null)

  return (
    <div className="w-full h-[400px] cursor-grab active:cursor-grabbing">
      <Canvas 
        camera={{ position: [0, -10, 10], fov: 45 }} 
        shadows 
        gl={{ preserveDrawingBuffer: true }} 
        id="kandi-canvas"
      >
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1.2} castShadow />
        <pointLight position={[-10, -5, 5]} intensity={0.5} color="white" />
        
        <Environment preset="city" />

        <Suspense fallback={null}>
           <Bounds observe margin={1.2}>
              <Float 
                  speed={captureMode ? 0 : 3} 
                  rotationIntensity={captureMode ? 0 : 0.2} 
                  floatIntensity={captureMode ? 0 : 0.2}
                  floatingRange={captureMode ? [0,0] : undefined}
              >
                  <BraceletRing pattern={pattern} rows={rows} stitch={stitch} />
              </Float>
              
              <SnapshotManager captureMode={captureMode} controlsRef={controlsRef} />
           </Bounds>
        </Suspense>

        <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={15} blur={2.5} far={5} />
        
        <OrbitControls 
            ref={controlsRef}
            enableZoom={true} 
            enabled={!captureMode} 
            makeDefault 
        />
      </Canvas>
    </div>
  );
}
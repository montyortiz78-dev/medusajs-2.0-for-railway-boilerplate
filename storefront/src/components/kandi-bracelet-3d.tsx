'use client';

import { useRef, useMemo, useLayoutEffect, Suspense, useEffect } from 'react';
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

// --- 1. SOLID GEOMETRY (Watertight) ---
function usePonyBeadGeometry() {
  const geometry = useMemo(() => {
    const points = [];
    const holeRadius = 0.15;
    const outerRadius = 0.32;
    const height = 0.44;
    const halfH = height / 2;
    const bevel = 0.06;

    // Counter-Clockwise profile for solid normals
    points.push(new THREE.Vector2(holeRadius, -halfH));
    points.push(new THREE.Vector2(outerRadius - bevel, -halfH));
    points.push(new THREE.Vector2(outerRadius, -halfH + bevel));
    points.push(new THREE.Vector2(outerRadius + 0.01, 0));
    points.push(new THREE.Vector2(outerRadius, halfH - bevel));
    points.push(new THREE.Vector2(outerRadius - bevel, halfH));
    points.push(new THREE.Vector2(holeRadius, halfH));
    points.push(new THREE.Vector2(holeRadius, -halfH));

    const geom = new THREE.LatheGeometry(points, 32);
    geom.computeVertexNormals();
    return geom;
  }, []);
  return geometry;
}

function Bead({ type = 'pony', color = '#FFFFFF', position, rotation, tilt = 0 }: { type?: string, color?: string, position: [number, number, number], rotation: [number, number, number], tilt?: number }) {
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
    textures.roughnessMap.needsUpdate = true;
  }, [textures]);

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        castShadow 
        receiveShadow 
        geometry={type === 'pony' ? ponyGeometry : undefined}
        rotation={[tilt, 0, 0]} 
      >
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
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

function BraceletRing({ pattern, rows = 1, stitch = 'ladder' }: { pattern: any[], rows?: number, stitch?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const { beads, radius, strings } = useMemo(() => {
    if (!pattern || pattern.length === 0) return { beads: [], radius: 2.8, strings: [] };

    let normalizedPattern = pattern.map(p => {
        if (typeof p === 'string') return { type: 'pony', color: p };
        return { type: p.type || 'pony', color: p.color };
    });

    const TARGET_MIN_BEADS = 16; 
    if (normalizedPattern.length < TARGET_MIN_BEADS) {
        const repeatCount = Math.ceil(TARGET_MIN_BEADS / normalizedPattern.length);
        const newPattern = [];
        for (let i = 0; i < repeatCount; i++) {
            newPattern.push(...normalizedPattern);
        }
        normalizedPattern = newPattern.slice(0, Math.max(normalizedPattern.length * repeatCount, TARGET_MIN_BEADS));
    }

    const stitchMode = stitch ? stitch.toLowerCase() : 'ladder';
    
    // --- RADIUS MULTIPLIERS ---
    let radiusMultiplier = 0.95; 
    if (stitchMode.includes('x-base')) {
        radiusMultiplier = 2.15; 
    } else if (stitchMode.includes('flat') || stitchMode.includes('brick')) {
        radiusMultiplier = 1.05; 
    } else if (stitchMode.includes('ladder')) {
        radiusMultiplier = 1.05; 
    } else if (stitchMode.includes('multi') || stitchMode.includes('peyote')) {
        radiusMultiplier = 0.80; 
    } else if (stitchMode.includes('single')) {
        radiusMultiplier = 0.80; 
    }

    const totalBeadWidth = normalizedPattern.reduce((sum, bead) => sum + (BEAD_WIDTHS[bead.type] || 0.6) + BEAD_GAP, 0);
    const calculatedRadius = (totalBeadWidth * radiusMultiplier) / (2 * Math.PI);
    const finalRadius = Math.max(calculatedRadius, 1.0); 

    const allBeads: any[] = [];
    const generatedStrings: any[] = [];
    
    // --- 1. X-BASE ---
    if (stitchMode.includes('x-base')) {
        const X_ROW_HEIGHT = 1.60; 
        const GRID_Y_OFFSET = 0.32; 
        const OUTER_Y_OFFSET = 0.80; 
        const beadArc = 0.6 / (2 * Math.PI * finalRadius) * Math.PI * 2; 
        const gridAngleOffset = beadArc * 0.60; 
        const TILT_ANGLE = Math.PI / 4; 
        const angleStep = (Math.PI * 2) / normalizedPattern.length;

        for (let r = 0; r < rows; r++) {
            const rowCenterZ = -((rows * X_ROW_HEIGHT) / 2) + (r * X_ROW_HEIGHT) + (X_ROW_HEIGHT / 2);
            const isBottomRow = r === 0;
            const isTopRow = r === rows - 1;

            for (let i = 0; i < normalizedPattern.length; i++) {
                const patternIdx = (i + r) % normalizedPattern.length;
                const bead = normalizedPattern[patternIdx];
                const centerAngle = (i / normalizedPattern.length) * Math.PI * 2;
                
                allBeads.push({ ...bead, x: Math.cos(centerAngle) * finalRadius, y: Math.sin(centerAngle) * finalRadius, z: rowCenterZ, rotZ: centerAngle, jitterRot: [0, 0, 0], tilt: 0 });

                const frameBead = { type: 'pony', color: bead.color };
                const tlAngle = centerAngle - gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(tlAngle) * finalRadius, y: Math.sin(tlAngle) * finalRadius, z: rowCenterZ + GRID_Y_OFFSET, rotZ: tlAngle, jitterRot: [0,0,0], tilt: -TILT_ANGLE });
                const trAngle = centerAngle + gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(trAngle) * finalRadius, y: Math.sin(trAngle) * finalRadius, z: rowCenterZ + GRID_Y_OFFSET, rotZ: trAngle, jitterRot: [0,0,0], tilt: TILT_ANGLE });
                const blAngle = centerAngle - gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(blAngle) * finalRadius, y: Math.sin(blAngle) * finalRadius, z: rowCenterZ - GRID_Y_OFFSET, rotZ: blAngle, jitterRot: [0,0,0], tilt: TILT_ANGLE });
                const brAngle = centerAngle + gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(brAngle) * finalRadius, y: Math.sin(brAngle) * finalRadius, z: rowCenterZ - GRID_Y_OFFSET, rotZ: brAngle, jitterRot: [0,0,0], tilt: -TILT_ANGLE });

                const midAngle = centerAngle + (angleStep / 2);
                allBeads.push({ ...frameBead, x: Math.cos(midAngle) * finalRadius, y: Math.sin(midAngle) * finalRadius, z: rowCenterZ + OUTER_Y_OFFSET, rotZ: midAngle, jitterRot: [0,0,0], tilt: 0 });
                if (isBottomRow) {
                    allBeads.push({ ...frameBead, x: Math.cos(midAngle) * finalRadius, y: Math.sin(midAngle) * finalRadius, z: rowCenterZ - OUTER_Y_OFFSET, rotZ: midAngle, jitterRot: [0,0,0], tilt: 0 });
                }

                if (isTopRow) allBeads.push({ ...frameBead, x: Math.cos(centerAngle) * finalRadius, y: Math.sin(centerAngle) * finalRadius, z: rowCenterZ + OUTER_Y_OFFSET, rotZ: centerAngle, jitterRot: [0,0,0], tilt: 0 });
                if (isBottomRow) allBeads.push({ ...frameBead, x: Math.cos(centerAngle) * finalRadius, y: Math.sin(centerAngle) * finalRadius, z: rowCenterZ - OUTER_Y_OFFSET, rotZ: centerAngle, jitterRot: [0,0,0], tilt: 0 });
            }
        }
    } 
    // --- 2. MULTI / PEYOTE (HORIZONTAL HOLES, STAGGERED COLUMNS) ---
    else if (stitchMode.includes('multi') || stitchMode.includes('peyote')) {
        const vSpacing = 0.65; 
        const totalHeight = (rows - 1) * vSpacing;
        const startZ = -totalHeight / 2;

        for (let r = 0; r < rows; r++) {
            const rowZ = startZ + (r * vSpacing);
            
            for (let i = 0; i < normalizedPattern.length; i++) {
                const patternIdx = (i + r) % normalizedPattern.length;
                const bead = normalizedPattern[patternIdx];
                const angle = (i / normalizedPattern.length) * Math.PI * 2;
                
                // *** UPDATED STAGGER LOGIC ***
                // Instead of row-based shift, we shift based on Column Index (i)
                // Every other bead (odd columns) gets pushed up slightly
                const isOddCol = i % 2 !== 0;
                const staggerOffset = isOddCol ? (vSpacing * 0.5) : 0;

                allBeads.push({ 
                    ...bead, 
                    x: Math.cos(angle) * finalRadius, 
                    y: Math.sin(angle) * finalRadius, 
                    z: rowZ + staggerOffset, // APPLY VERTICAL STAGGER
                    rotZ: angle, 
                    jitterRot: [(Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05],
                    tilt: 0 // Horizontal holes
                });
            }
            // NO STRING
        }
    }
    // --- 3. FLAT / BRICK (VERTICAL HOLES, STAGGERED) ---
    else if (stitchMode.includes('flat') || stitchMode.includes('brick')) {
        const vSpacing = 0.45; 
        const totalHeight = (rows - 1) * vSpacing;
        const startZ = -totalHeight / 2;

        for (let r = 0; r < rows; r++) {
            const rowZ = startZ + (r * vSpacing);
            const isOddRow = r % 2 !== 0;
            const rowPatternShift = isOddRow ? 0.5 : 0;

            for (let i = 0; i < normalizedPattern.length; i++) {
                const patternIdx = (i + r) % normalizedPattern.length;
                const bead = normalizedPattern[patternIdx];
                const shiftedI = i + rowPatternShift;
                const angle = (shiftedI / normalizedPattern.length) * Math.PI * 2;
                
                allBeads.push({ 
                    ...bead, 
                    x: Math.cos(angle) * finalRadius, 
                    y: Math.sin(angle) * finalRadius, 
                    z: rowZ,
                    rotZ: angle, 
                    jitterRot: [(Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05],
                    tilt: Math.PI / 2 // Vertical holes
                });
            }
            // NO STRING
        }
    }
    // --- 4. SINGLE (HORIZONTAL HOLES, STRING) ---
    else if (stitchMode.includes('single')) {
        const vSpacing = 0.66; 
        const totalHeight = (rows - 1) * vSpacing;
        const startZ = -totalHeight / 2;

        for (let r = 0; r < rows; r++) {
            const rowZ = startZ + (r * vSpacing);
            
            for (let i = 0; i < normalizedPattern.length; i++) {
                const patternIdx = i % normalizedPattern.length; 
                const bead = normalizedPattern[patternIdx];
                const angle = (i / normalizedPattern.length) * Math.PI * 2;
                
                allBeads.push({ 
                    ...bead, 
                    x: Math.cos(angle) * finalRadius, 
                    y: Math.sin(angle) * finalRadius, 
                    z: rowZ,
                    rotZ: angle, 
                    jitterRot: [(Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05],
                    tilt: 0 // Horizontal holes
                });
            }
            // Add String
            generatedStrings.push({ z: rowZ, radius: finalRadius });
        }
    }
    // --- 5. LADDER (DEFAULT - VERTICAL HOLES) ---
    else if (stitchMode.includes('ladder')) {
        const vSpacing = 0.45; 
        const totalHeight = (rows - 1) * vSpacing;
        const startZ = -totalHeight / 2;

        for (let r = 0; r < rows; r++) {
            const rowZ = startZ + (r * vSpacing);
            
            for (let i = 0; i < normalizedPattern.length; i++) {
                const patternIdx = (i + r) % normalizedPattern.length;
                const bead = normalizedPattern[patternIdx];
                const angle = (i / normalizedPattern.length) * Math.PI * 2;
                allBeads.push({ 
                    ...bead, 
                    x: Math.cos(angle) * finalRadius, 
                    y: Math.sin(angle) * finalRadius, 
                    z: rowZ,
                    rotZ: angle, 
                    jitterRot: [(Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05],
                    tilt: Math.PI / 2 // Vertical holes
                });
            }
            // NO STRING
        }
    }

    return { beads: allBeads, strings: generatedStrings };
  }, [pattern, rows, stitch]);

  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.z -= delta * 0.1;
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {strings.map((s, i) => (
        <mesh key={`str-${i}`} position={[0, 0, s.z]}>
            <torusGeometry args={[s.radius, 0.035, 12, 100]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} />
        </mesh>
      ))}

      {beads.map((b, i) => (
        <Bead 
          key={i} 
          type={b.type} 
          color={b.color} 
          position={[b.x, b.y, b.z]} 
          rotation={[b.jitterRot[0], b.jitterRot[1], b.rotZ + b.jitterRot[2]]} 
          tilt={b.tilt}
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
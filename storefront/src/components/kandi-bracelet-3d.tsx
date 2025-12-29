'use client';

import { useRef, useMemo, useLayoutEffect, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, useTexture, Bounds, useBounds } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

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

// Dimensions - Letter bead optimized for realism
const BEAD_WIDTHS: Record<string, number> = {
  "pony": 0.6, "star": 0.65, "heart": 0.55, "flower": 0.55, "skull": 0.7, "letter": 0.52
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

// --- HELPER: Generate Letter Texture ---
function useLetterTexture(letter: string) {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    
    const canvas = document.createElement('canvas');
    const size = 256; 
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        ctx.translate(size / 2, size / 2);
        ctx.scale(-1, 1); // Flip Horizontal
        ctx.rotate(Math.PI / 2); // Rotate +90 deg

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 140px Arial, sans-serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 0, 10); 
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false; 
    return texture;
  }, [letter]);
}

// --- GEOMETRY: Rounded Box (0.40 Size) ---
function useRoundedBoxGeometry() {
    return useMemo(() => {
        return new RoundedBoxGeometry(0.40, 0.40, 0.40, 4, 0.08);
    }, []);
}

function Bead({ type = 'pony', color = '#FFFFFF', position, rotation, tilt = 0, value = '' }: { type?: string, color?: string, position: [number, number, number], rotation: [number, number, number], tilt?: number, value?: string }) {
  const hex = getColorHex(color);
  const isNeon = color && (color.includes('neon') || color.includes('glow'));
  const ponyGeometry = usePonyBeadGeometry();
  const roundedBoxGeometry = useRoundedBoxGeometry();
  
  const letterTexture = useLetterTexture(type === 'letter' ? value : '');

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

  // --- RENDER LETTER BEAD ---
  if (type === 'letter') {
      const holeMat = <meshStandardMaterial attach="material-2" color="#FDFDFD" roughness={0.3} />;
      const holeMat2 = <meshStandardMaterial attach="material-3" color="#FDFDFD" roughness={0.3} />;
      
      const textMat = (index: number) => (
        <meshStandardMaterial 
            key={index}
            attach={`material-${index}`} 
            color="#FDFDFD" 
            map={letterTexture} 
            roughness={0.3} 
        />
      );

      return (
        <group position={position} rotation={rotation}>
            <group rotation={[tilt, 0, 0]}>
                <mesh castShadow receiveShadow geometry={roundedBoxGeometry}>
                    {textMat(0)}
                    {textMat(1)}
                    {holeMat}
                    {holeMat2}
                    {textMat(4)}
                    {textMat(5)}
                </mesh>
            </group>
        </group>
      );
  }

  // --- RENDER STANDARD BEADS ---
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
        {!['pony','star','heart','skull','flower', 'letter'].includes(type) && <sphereGeometry args={[0.3, 32, 32]} />}

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

function BraceletRing({ pattern, rows = 1, stitch = 'ladder', customWord = "" }: { pattern: any[], rows?: number, stitch?: string, customWord?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const { beads, radius, strings } = useMemo(() => {
    let normalizedPattern = pattern && pattern.length > 0 ? pattern.map(p => {
        if (typeof p === 'string') return { type: 'pony', color: p };
        return { type: p.type || 'pony', color: p.color };
    }) : [];

    const wordBeads = customWord ? customWord.split('').map(char => ({ 
        type: 'letter', 
        color: 'white', 
        value: char 
    })) : [];

    const TARGET_MIN_BEADS = 18; 
    let fullSequence: any[] = [...wordBeads];
    
    if (normalizedPattern.length > 0) {
        while (fullSequence.length < TARGET_MIN_BEADS) {
            fullSequence.push(...normalizedPattern);
        }
    } else if (fullSequence.length > 0 && fullSequence.length < TARGET_MIN_BEADS) {
         while (fullSequence.length < TARGET_MIN_BEADS) {
            fullSequence.push({ type: 'pony', color: 'white' });
        }
    }
    
    if (fullSequence.length === 0) return { beads: [], radius: 2.8, strings: [] };

    const stitchMode = stitch ? stitch.toLowerCase() : 'ladder';
    
    let radiusMultiplier = 0.95; 
    if (stitchMode.includes('x-base')) radiusMultiplier = 2.15; // X-Base needs much wider radius
    else if (stitchMode.includes('flower')) radiusMultiplier = 0.85; 
    else if (stitchMode.includes('flat') || stitchMode.includes('brick')) radiusMultiplier = 1.05; 
    else if (stitchMode.includes('ladder')) radiusMultiplier = 1.05; 
    else if (stitchMode.includes('multi') || stitchMode.includes('peyote') || stitchMode.includes('single')) radiusMultiplier = 0.80; 

    const totalBeadWidth = fullSequence.reduce((sum, bead) => sum + (BEAD_WIDTHS[bead.type] || 0.6) + BEAD_GAP, 0);
    const calculatedRadius = (totalBeadWidth * radiusMultiplier) / (2 * Math.PI);
    const finalRadius = Math.max(calculatedRadius, 1.0); 

    const allBeads: any[] = [];
    const generatedStrings: any[] = [];
    
    // --- 1. X-BASE STITCH (Restored) ---
    if (stitchMode.includes('x-base')) {
        const X_ROW_HEIGHT = 1.60; 
        const GRID_Y_OFFSET = 0.32; 
        const OUTER_Y_OFFSET = 0.80; 
        const beadArc = 0.6 / (2 * Math.PI * finalRadius) * Math.PI * 2; 
        const gridAngleOffset = beadArc * 0.60; 
        const TILT_ANGLE = Math.PI / 4; 
        const angleStep = (Math.PI * 2) / fullSequence.length;

        for (let r = 0; r < rows; r++) {
            const rowCenterZ = -((rows * X_ROW_HEIGHT) / 2) + (r * X_ROW_HEIGHT) + (X_ROW_HEIGHT / 2);
            const isBottomRow = r === 0;
            const isTopRow = r === rows - 1;

            for (let i = 0; i < fullSequence.length; i++) {
                const patternIdx = (i + r) % fullSequence.length;
                const bead = fullSequence[patternIdx];
                const centerAngle = (i / fullSequence.length) * Math.PI * 2;
                
                // Center Row Bead (The main bead in the X center)
                allBeads.push({ ...bead, x: Math.cos(centerAngle) * finalRadius, y: Math.sin(centerAngle) * finalRadius, z: rowCenterZ, rotZ: centerAngle, jitterRot: [0, 0, 0], tilt: 0 });

                // Frame Beads (The legs of the X)
                // If main bead is a Letter, frames should be white ponies to match aesthetic
                const frameColor = bead.type === 'letter' ? 'white' : bead.color;
                const frameBead = { type: 'pony', color: frameColor };

                // Top-Left and Top-Right Legs
                const tlAngle = centerAngle - gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(tlAngle) * finalRadius, y: Math.sin(tlAngle) * finalRadius, z: rowCenterZ + GRID_Y_OFFSET, rotZ: tlAngle, jitterRot: [0,0,0], tilt: -TILT_ANGLE });
                const trAngle = centerAngle + gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(trAngle) * finalRadius, y: Math.sin(trAngle) * finalRadius, z: rowCenterZ + GRID_Y_OFFSET, rotZ: trAngle, jitterRot: [0,0,0], tilt: TILT_ANGLE });
                
                // Bottom-Left and Bottom-Right Legs
                const blAngle = centerAngle - gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(blAngle) * finalRadius, y: Math.sin(blAngle) * finalRadius, z: rowCenterZ - GRID_Y_OFFSET, rotZ: blAngle, jitterRot: [0,0,0], tilt: TILT_ANGLE });
                const brAngle = centerAngle + gridAngleOffset;
                allBeads.push({ ...frameBead, x: Math.cos(brAngle) * finalRadius, y: Math.sin(brAngle) * finalRadius, z: rowCenterZ - GRID_Y_OFFSET, rotZ: brAngle, jitterRot: [0,0,0], tilt: -TILT_ANGLE });

                // Outer Connectors (Between Xs)
                const midAngle = centerAngle + (angleStep / 2);
                allBeads.push({ ...frameBead, x: Math.cos(midAngle) * finalRadius, y: Math.sin(midAngle) * finalRadius, z: rowCenterZ + OUTER_Y_OFFSET, rotZ: midAngle, jitterRot: [0,0,0], tilt: 0 });
                if (isBottomRow) {
                    allBeads.push({ ...frameBead, x: Math.cos(midAngle) * finalRadius, y: Math.sin(midAngle) * finalRadius, z: rowCenterZ - OUTER_Y_OFFSET, rotZ: midAngle, jitterRot: [0,0,0], tilt: 0 });
                }

                // Top/Bottom Rim Beads (if applicable)
                if (isTopRow) allBeads.push({ ...frameBead, x: Math.cos(centerAngle) * finalRadius, y: Math.sin(centerAngle) * finalRadius, z: rowCenterZ + OUTER_Y_OFFSET, rotZ: centerAngle, jitterRot: [0,0,0], tilt: 0 });
                if (isBottomRow) allBeads.push({ ...frameBead, x: Math.cos(centerAngle) * finalRadius, y: Math.sin(centerAngle) * finalRadius, z: rowCenterZ - OUTER_Y_OFFSET, rotZ: centerAngle, jitterRot: [0,0,0], tilt: 0 });
            }
        }
    } 
   // --- 2. FLOWER STITCH ---
    else if (stitchMode.includes('flower')) {
        const ROW_HEIGHT = 0.60; 
        const flowerBeadWidth = BEAD_WIDTHS['pony'] || 0.6;
        const nestingFactor = 0.72; 
        const totalCols = fullSequence.length * 3; 
        const totalCircumference = totalCols * (flowerBeadWidth) * nestingFactor;
        const actualRadius = Math.max(totalCircumference / (2 * Math.PI), 1.0);

        for (let col = 0; col < totalCols; col++) {
            const angle = (col / totalCols) * Math.PI * 2;
            const patternIdx = Math.floor(col / 3) % fullSequence.length;
            const mainBead = fullSequence[patternIdx]; 
            const sequenceStep = col % 3; 
            const isCenterCol = sequenceStep === 1;
            const colBeadCount = isCenterCol ? 3 : 2;

            for (let r = 0; r < colBeadCount; r++) {
                let zPos = 0;
                let beadColor = mainBead.color; 
                let beadType = 'pony';
                let beadValue = '';

                if (mainBead.type === 'letter') {
                     if (isCenterCol && r === 1) {
                         beadType = 'letter';
                         beadValue = mainBead.value;
                         beadColor = 'white';
                     } else {
                         beadColor = 'white';
                     }
                }

                if (isCenterCol) {
                    zPos = (r - 1) * ROW_HEIGHT; 
                    if (r === 1 && beadType !== 'letter') beadColor = 'white';
                } else {
                    zPos = (r - 0.5) * ROW_HEIGHT;
                }

                allBeads.push({
                    type: beadType,
                    value: beadValue,
                    color: beadColor,
                    x: Math.cos(angle) * actualRadius,
                    y: Math.sin(angle) * actualRadius,
                    z: zPos,
                    rotZ: angle,
                    jitterRot: [(Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01],
                    tilt: 0 
                });
            }
        }
        return { beads: allBeads, radius: actualRadius, strings: [] };
    } 
    // --- 3. STANDARD STITCHES (Ladder, Single, Peyote) ---
    else {
        const vSpacing = stitchMode.includes('single') ? 0.66 : 0.45; 
        const totalHeight = (rows - 1) * vSpacing;
        const startZ = -totalHeight / 2;
        const isVerticalHole = stitchMode.includes('ladder') || stitchMode.includes('brick') || stitchMode.includes('flat');
        
        for (let r = 0; r < rows; r++) {
            const rowZ = startZ + (r * vSpacing);
            const isOddRow = r % 2 !== 0;
            const rowPatternShift = (stitchMode.includes('flat') || stitchMode.includes('brick')) && isOddRow ? 0.5 : 0;

            for (let i = 0; i < fullSequence.length; i++) {
                const patternIdx = (i + r) % fullSequence.length;
                const finalIdx = stitchMode.includes('single') ? i % fullSequence.length : patternIdx;
                const bead = fullSequence[finalIdx];
                const shiftedI = i + rowPatternShift;
                const angle = (shiftedI / fullSequence.length) * Math.PI * 2;
                
                let zOffset = 0;
                if (stitchMode.includes('multi') || stitchMode.includes('peyote')) {
                     const isOddCol = i % 2 !== 0;
                     zOffset = isOddCol ? (vSpacing * 0.5) : 0;
                }

                allBeads.push({ 
                    ...bead, 
                    x: Math.cos(angle) * finalRadius, 
                    y: Math.sin(angle) * finalRadius, 
                    z: rowZ + zOffset,
                    rotZ: angle, 
                    jitterRot: [(Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05],
                    tilt: isVerticalHole ? Math.PI / 2 : 0
                });
            }
            if (stitchMode.includes('single')) {
                 generatedStrings.push({ z: rowZ, radius: finalRadius });
            }
        }
    }

    return { beads: allBeads, strings: generatedStrings };
  }, [pattern, rows, stitch, customWord]);

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
          value={b.value}
          color={b.color} 
          position={[b.x, b.y, b.z]} 
          rotation={[b.jitterRot[0], b.jitterRot[1], b.rotZ + b.jitterRot[2]]} 
          tilt={b.tilt}
        />
      ))}
    </group>
  );
}

function SnapshotManager({ captureMode, controlsRef, pattern, rows, stitch }: { captureMode: boolean, controlsRef: any, pattern: any[], rows: number, stitch: string }) {
  const api = useBounds();
  const { camera } = useThree();
  const patternHash = useMemo(() => JSON.stringify(pattern), [pattern]);

  useEffect(() => {
    if (captureMode && controlsRef.current) {
        const controls = controlsRef.current;
        controls.object.position.set(0, -12, 8);
        controls.target.set(0, 0, 0);
        controls.object.up.set(0, 0, 1);
        controls.update();
        if (api) setTimeout(() => api.refresh().fit(), 50);
    } else {
        if (api) api.refresh().fit();
    }
  }, [captureMode, api, camera, controlsRef, patternHash, rows, stitch]);
  return null;
}

export default function KandiBracelet3D({ pattern, customWord, captureMode = false, rows = 1, stitch = 'ladder' }: { pattern: any[], customWord?: string, captureMode?: boolean, rows?: number, stitch?: string }) {
  const controlsRef = useRef<any>(null);

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
                  <BraceletRing pattern={pattern} customWord={customWord} rows={rows} stitch={stitch} />
              </Float>
              <SnapshotManager 
                  captureMode={captureMode} 
                  controlsRef={controlsRef} 
                  pattern={pattern}
                  rows={rows}
                  stitch={stitch}
              />
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
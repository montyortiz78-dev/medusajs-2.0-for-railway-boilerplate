'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// 1. The Neon Palette
const COLORS = [
  '#FF00CC', // Neon Pink
  '#39FF14', // Neon Green
  '#00FFFF', // Electric Blue
  '#FFFF00', // Bright Yellow
  '#9D00FF', // Purple
  '#F0F0F0', // White
  '#111111', // Black
];

function FloatingInstances({ 
  count, 
  geometry, 
  scale = 1,
  scrollOffset
}: { 
  count: number, 
  geometry: THREE.BufferGeometry, 
  scale?: number,
  scrollOffset: React.MutableRefObject<number>
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();

  // 2. Generate Random Colors & Positions
  const { positions, colors, speeds, rotations } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const rot = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;     // Wider x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35; // Wider y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 2; // z depth
      
      const colorHex = COLORS[Math.floor(Math.random() * COLORS.length)];
      const c = new THREE.Color(colorHex);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      spd[i] = Math.random() * 0.2 + 0.05;
      
      rot[i * 3] = Math.random() * Math.PI;
      rot[i * 3 + 1] = Math.random() * Math.PI;
      rot[i * 3 + 2] = Math.random() * Math.PI;
    }
    return { positions: pos, colors: col, speeds: spd, rotations: rot };
  }, [count]);

  // Animation Loop
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const mouse = state.pointer; // -1 to 1
    
    // Get scroll speed factor (0 to 1)
    const scrollY = scrollOffset.current;

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // 3. SCROLL EFFECT: Add Y movement based on scroll
      // As you scroll down, beads move up slightly
      const scrollMove = scrollY * 5;

      // Floating Wave Motion
      const t = time * speeds[i];
      dummy.position.set(
        x + Math.sin(t + x) * 0.5,
        y + Math.cos(t + y) * 0.5 + scrollMove, // Add scroll factor
        z
      );

      // 4. MOUSE INTERACTION (Boosted)
      // Map mouse -1..1 to scene coordinates roughly -18..18
      const mouseX = mouse.x * 18;
      const mouseY = mouse.y * 18;
      
      const dx = mouseX - dummy.position.x;
      const dy = mouseY - dummy.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Interaction Radius: Increased to 6 units
      if (dist < 6) {
          // Inverse force: Closer = Stronger push
          const force = (6 - dist) * 0.8; 
          
          // Move away from mouse
          dummy.position.x -= dx * force * 0.1;
          dummy.position.y -= dy * force * 0.1;
          
          // Spin wildly when touched
          dummy.rotation.x += force * 0.2;
          dummy.rotation.y += force * 0.2;
      }

      // Constant rotation + Scroll rotation
      // As you scroll, beads spin faster
      const scrollSpin = scrollY * 2;
      dummy.rotation.x = rotations[i * 3] + time * 0.2 + scrollSpin;
      dummy.rotation.y = rotations[i * 3 + 1] + time * 0.1 + scrollSpin;
      
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial 
        color="white"
        roughness={0.2}
        metalness={0.4}
        emissive="#222"
        emissiveIntensity={0.3}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

// 5. Main Scene
export default function HeroCanvas() {
  // Track window scroll position without re-rendering the component
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // Normalize scroll: 0 = top, 1 = 1000px down
      scrollRef.current = window.scrollY / 1000; 
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    // Fixed container that stays behind everything
    <div className="fixed inset-0 -z-10 top-0 left-0 h-full w-full bg-black">
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }} gl={{ antialias: false }}>
        
        <ambientLight intensity={1.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={3} />
        <pointLight position={[-10, -10, -10]} color="#FF00CC" intensity={4} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
           
           <FloatingInstances 
             count={100} 
             geometry={new THREE.SphereGeometry(0.3, 16, 16)} 
             scale={1.0} 
             scrollOffset={scrollRef}
           />

           <FloatingInstances 
             count={40} 
             geometry={new THREE.OctahedronGeometry(0.45)} 
             scale={1.2} 
             scrollOffset={scrollRef}
           />

           <FloatingInstances 
             count={30} 
             geometry={new THREE.DodecahedronGeometry(0.45)} 
             scale={1.1} 
             scrollOffset={scrollRef}
           />

        </Float>
        
        <Environment preset="city" />
        <fog attach="fog" args={['#000', 10, 35]} />
      </Canvas>
    </div>
  );
}
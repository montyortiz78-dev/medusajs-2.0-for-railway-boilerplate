'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const KANDI_COLORS = [
  '#FF00CC', // Pink
  '#39FF14', // Lime
  '#00FFFF', // Cyan
  '#FFFF00', // Yellow
  '#FF5F1F', // Orange
  '#B026FF', // Purple
  '#FFFFFF', // White
];

function FloatingBeads({ 
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

  const { positions, colors, speeds, rotations } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const rot = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Spread them out wide
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      
      const colorHex = KANDI_COLORS[Math.floor(Math.random() * KANDI_COLORS.length)];
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

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const mouse = state.pointer;
    const scrollY = scrollOffset.current;

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // Scroll moves beads up
      const scrollMove = scrollY * 8;

      const t = time * speeds[i];
      dummy.position.set(
        x + Math.sin(t + x * 0.5) * 1,
        y + Math.cos(t + y * 0.5) * 1 + scrollMove,
        z
      );

      // Mouse interaction
      const mouseX = mouse.x * 20;
      const mouseY = mouse.y * 20;
      const dx = mouseX - dummy.position.x;
      const dy = mouseY - dummy.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 5) {
          const force = (5 - dist) * 0.5;
          dummy.position.x -= dx * force * 0.2;
          dummy.position.y -= dy * force * 0.2;
          dummy.rotation.x += force * 0.5;
          dummy.rotation.y += force * 0.5;
      }

      const scrollSpin = scrollY * 5;
      dummy.rotation.x = rotations[i * 3] + time * 0.3 + scrollSpin;
      dummy.rotation.y = rotations[i * 3 + 1] + time * 0.2 + scrollSpin;
      
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial 
        roughness={0.3} 
        metalness={0.1} 
        emissive="#111"
        emissiveIntensity={0.1}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

export default function HeroCanvas() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY / 1000; 
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 top-0 left-0 h-full w-full bg-[#111]">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={2} />
        <pointLight position={[10, 10, 10]} color="#FF00CC" intensity={5} distance={20} />
        <pointLight position={[-10, -10, 10]} color="#00FFFF" intensity={5} distance={20} />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
           {/* Pony Beads (Torus) */}
           <FloatingBeads 
             count={80} 
             geometry={new THREE.TorusGeometry(0.4, 0.2, 16, 32)} 
             scale={1} 
             scrollOffset={scrollRef}
           />
           
           {/* Letter Blocks (Box) */}
           <FloatingBeads 
             count={40} 
             geometry={new THREE.BoxGeometry(0.7, 0.7, 0.7)} 
             scale={1} 
             scrollOffset={scrollRef}
           />

           {/* Spacers (Sphere) */}
           <FloatingBeads 
             count={50} 
             geometry={new THREE.SphereGeometry(0.25, 16, 16)} 
             scale={1} 
             scrollOffset={scrollRef}
           />
        </Float>
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
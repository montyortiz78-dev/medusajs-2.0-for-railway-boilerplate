'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// 1. Reusable Logic for Floating Instances
function FloatingInstances({ 
  count, 
  geometry, 
  scale = 1 
}: { 
  count: number, 
  geometry: THREE.BufferGeometry, 
  scale?: number 
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();

  // Generate random data
  const { positions, colors, speeds, rotations } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const rot = new Float32Array(count * 3); // Random initial rotation
    
    const colorPalette = [
      new THREE.Color('#FF00CC'), // Neon Pink
      new THREE.Color('#39FF14'), // Neon Green
      new THREE.Color('#00FFFF'), // Electric Blue
      new THREE.Color('#FFFF00'), // Bright Yellow
      new THREE.Color('#9D00FF'), // Purple
      new THREE.Color('#F0F0F0'), // White
    ];

    for (let i = 0; i < count; i++) {
      // Position spread wide across screen
      pos[i * 3] = (Math.random() - 0.5) * 25;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2; // z (push back slightly)
      
      // Random color
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      // Random movement speed
      spd[i] = Math.random() * 0.2 + 0.05;
      
      // Random rotation axis
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
    const mouse = state.pointer; 

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // Floating Wave Motion
      const t = time * speeds[i];
      dummy.position.set(
        x + Math.sin(t + x) * 0.5,
        y + Math.cos(t + y) * 0.5,
        z
      );

      // Mouse Interaction (Repulsion)
      const dx = (mouse.x * 12) - dummy.position.x;
      const dy = (mouse.y * 12) - dummy.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 4) {
          // Push away smoothly
          const force = (4 - dist) * 0.5;
          dummy.position.x -= dx * force * 0.05;
          dummy.position.y -= dy * force * 0.05;
          dummy.rotation.x += 0.1; // Spin when touched
      }

      // Constant slow rotation
      dummy.rotation.x = rotations[i * 3] + time * 0.2;
      dummy.rotation.y = rotations[i * 3 + 1] + time * 0.1;
      
      // Apply scale
      dummy.scale.setScalar(scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      {/* FIX: Base color must be white for instance colors to show! */}
      <meshStandardMaterial 
        color="white"
        roughness={0.1}
        metalness={0.5}
        emissive="#444"     // Gives a baseline glow so they aren't pitch black in shadows
        emissiveIntensity={0.2}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

// 2. The Main Canvas Scene
export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }} gl={{ antialias: false }}>
        
        <ambientLight intensity={1.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={3} />
  <pointLight position={[-10, -10, -10]} color="#FF00CC" intensity={5} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
           
           {/* Layer 1: Pony Beads (Spheres) */}
           <FloatingInstances 
             count={80} 
             geometry={new THREE.SphereGeometry(0.3, 16, 16)} 
             scale={1.0} 
           />

           {/* Layer 2: Stars (Octahedrons) */}
           <FloatingInstances 
             count={40} 
             geometry={new THREE.OctahedronGeometry(0.45)} 
             scale={1.2} 
           />

           {/* Layer 3: Hearts (Dodecahedrons) */}
           <FloatingInstances 
             count={30} 
             geometry={new THREE.DodecahedronGeometry(0.45)} 
             scale={1.1} 
           />

        </Float>
        
        <Environment preset="city" />
        
        {/* Deep fog for infinite depth feeling */}
        <fog attach="fog" args={['#000', 8, 25]} />
      </Canvas>
    </div>
  );
}
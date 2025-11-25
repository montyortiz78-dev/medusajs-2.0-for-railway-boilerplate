'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// 1. The Individual Bead Component
function InstancedBeads({ count = 100 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Generate random positions and colors once
  const { positions, colors, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    
    const colorPalette = [
      new THREE.Color('#FF00CC'), // Neon Pink
      new THREE.Color('#39FF14'), // Neon Green
      new THREE.Color('#00FFFF'), // Electric Blue
      new THREE.Color('#FFFF00'), // Bright Yellow
    ];

    for (let i = 0; i < count; i++) {
      // Random position in a cube
      pos[i * 3] = (Math.random() - 0.5) * 15;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
      
      // Random color
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      // Random speed
      spd[i] = Math.random() * 0.2 + 0.1;
    }
    return { positions: pos, colors: col, speeds: spd };
  }, [count]);

  // Animation Loop (Runs 60fps)
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const mouse = state.pointer; // Mouse position (-1 to +1)

    // Make the light follow the mouse
    if (lightRef.current) {
        lightRef.current.position.x = mouse.x * 10;
        lightRef.current.position.y = mouse.y * 10;
    }

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Get original positions
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // Add "Wave" motion
      const t = time * speeds[i];
      dummy.position.set(
        x + Math.sin(t + x) * 0.5,
        y + Math.cos(t + y) * 0.5,
        z
      );

      // Add Mouse Repulsion (The "Interactive" part)
      const dx = mouse.x * 10 - dummy.position.x;
      const dy = mouse.y * 10 - dummy.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 3) {
          // Push bead away if mouse is close
          dummy.position.x -= dx * 0.1;
          dummy.position.y -= dy * 0.1;
          dummy.rotation.x += 0.1;
      }

      // Constant rotation
      dummy.rotation.x += 0.01;
      dummy.rotation.y += 0.01;
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <pointLight ref={lightRef} distance={10} intensity={50} color="#fff" />
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        {/* Shape: Torus (Donut/Bead shape) */}
        <torusGeometry args={[0.3, 0.15, 16, 32]} />
        <meshStandardMaterial vertexColors roughness={0.3} metalness={0.8} />
        <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
      </instancedMesh>
    </>
  );
}

// 2. The Main Canvas
export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
           <InstancedBeads count={150} />
        </Float>
        
        {/* Environment Reflection */}
        <Environment preset="city" />
        
        {/* Post-processing fog for depth */}
        <fog attach="fog" args={['#000', 5, 20]} />
      </Canvas>
    </div>
  );
}
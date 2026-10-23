'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function MiniScene() {
  const planetRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#67E8F9" />
      <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#818CF8" />
      
      <Stars radius={10} depth={50} count={500} factor={4} saturation={0} fade speed={1} />
      
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color="#111827"
          roughness={0.7}
          metalness={0.3}
          wireframe={true}
        />
      </mesh>
    </>
  );
}

export default function SimulationPreview() {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} enablePan={false} />
        <MiniScene />
      </Canvas>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--iris-bg)] to-transparent opacity-50" />
    </div>
  );
}

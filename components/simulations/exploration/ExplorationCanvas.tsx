'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { ZoneType, POI } from '@/app/simulations/exploration/page';
import { playCollectSound } from '@/lib/audio/soundEffects';

const POIs: Record<ZoneType, POI[]> = {
  ORBITAL: [
    { id: 'orb1', name: 'Alpha Station', description: 'Primary communication relay.', position: [15, 5, 0] },
    { id: 'orb2', name: 'Nebula Probe', description: 'Deep space sensor array.', position: [-10, 10, -5] },
    { id: 'orb3', name: 'Lunar Colony', description: 'Mining and research outpost.', position: [0, -20, -30] },
    { id: 'orb4', name: 'Debris Field', description: 'Hazardous orbital debris.', position: [20, -5, 10] },
    { id: 'orb5', name: 'Gateway', description: 'FTL jump node.', position: [-15, -10, 15] },
  ],
  TERRAIN: [
    { id: 'ter1', name: 'Crystal Formation Alpha', description: 'High energy output detected.', position: [5, 2, 5] },
    { id: 'ter2', name: 'Crash Site', description: 'Unidentified vessel remnants.', position: [-8, 1, -10] },
    { id: 'ter3', name: 'Artifact', description: 'Ancient structure of unknown origin.', position: [12, 3, -4] },
    { id: 'ter4', name: 'Geyser', description: 'Venting exotic gases.', position: [-5, 1, 15] },
    { id: 'ter5', name: 'Base Camp', description: 'Temporary research setup.', position: [0, 1, 0] },
  ],
  RESEARCH: [
    { id: 'res1', name: 'Core Server', description: 'Main quantum processing unit.', position: [0, 2, 0] },
    { id: 'res2', name: 'Data Node A', description: 'Archival storage.', position: [4, 1, 4] },
    { id: 'res3', name: 'Data Node B', description: 'Real-time telemetry buffer.', position: [-4, 3, -4] },
    { id: 'res4', name: 'Analysis Terminal', description: 'User interface node.', position: [4, 2, -4] },
    { id: 'res5', name: 'Holo Projector', description: '3D visualization matrix.', position: [-4, 1, 4] },
  ],
  OBSERVATORY: [
    { id: 'obs1', name: 'Quasar', description: 'Active galactic nucleus.', position: [30, 20, -50] },
    { id: 'obs2', name: 'Pulsar', description: 'Rapidly rotating neutron star.', position: [-40, 15, -30] },
    { id: 'obs3', name: 'Dark Nebula', description: 'Dense molecular cloud.', position: [20, -10, -40] },
    { id: 'obs4', name: 'Supernova Remnant', description: 'Expanding gas shell.', position: [-25, -20, -35] },
    { id: 'obs5', name: 'Exoplanet', description: 'Potentially habitable world.', position: [0, 5, -25] },
  ],
};

function OrbitalZone({ onSelectPOI }: { onSelectPOI: (poi: POI) => void }) {
  const planetRef = useRef<THREE.Mesh>(null);
  const stationRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (planetRef.current) planetRef.current.rotation.y += 0.001;
    if (stationRef.current) stationRef.current.rotation.y -= 0.005;
  });

  return (
    <group>
      <ambientLight intensity={0.2} />
      <directionalLight position={[50, 20, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-20, -10, -10]} intensity={0.5} color="#60A5FA" />
      
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      <mesh ref={planetRef} position={[0, -60, -20]}>
        <sphereGeometry args={[50, 64, 64]} />
        <meshStandardMaterial 
          color="#0b1b3d" 
          emissive="#050a1f"
          emissiveIntensity={0.2}
          roughness={0.8}
        />
      </mesh>
      
      <group ref={stationRef} position={[15, 5, 0]}>
        <mesh>
          <torusGeometry args={[3, 0.5, 16, 50]} />
          <meshStandardMaterial color="#67E8F9" emissive="#67E8F9" emissiveIntensity={0.5} wireframe />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 4, 1]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {POIs.ORBITAL.map((poi) => (
        <POIMarker key={poi.id} poi={poi} onClick={() => onSelectPOI(poi)} />
      ))}
    </group>
  );
}

function TerrainZone({ onSelectPOI }: { onSelectPOI: (poi: POI) => void }) {
  return (
    <group>
      <fog attach="fog" args={['#1f132e', 10, 50]} />
      <ambientLight intensity={0.3} color="#818CF8" />
      <pointLight position={[0, 10, 0]} intensity={1} color="#67E8F9" />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100, 32, 32]} />
        <meshStandardMaterial color="#2d1b3f" wireframe />
      </mesh>

      {[[-5, 5], [8, -8], [-12, -3]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 2, pos[1]]}>
          <coneGeometry args={[1, 4, 4]} />
          <meshStandardMaterial color="#34D399" emissive="#34D399" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {POIs.TERRAIN.map((poi) => (
        <POIMarker key={poi.id} poi={poi} onClick={() => onSelectPOI(poi)} />
      ))}
    </group>
  );
}

function ResearchZone({ onSelectPOI }: { onSelectPOI: (poi: POI) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={2} color="#60A5FA" />
      
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 20]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[20.5, 0.1, 20.5]} />
        <meshBasicMaterial color="#67E8F9" wireframe />
      </mesh>

      <mesh position={[0, 2, 0]}>
        <octahedronGeometry args={[1]} />
        <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={0.5} wireframe />
      </mesh>

      {POIs.RESEARCH.map((poi) => (
        <POIMarker key={poi.id} poi={poi} onClick={() => onSelectPOI(poi)} />
      ))}
    </group>
  );
}

function ObservatoryZone({ onSelectPOI }: { onSelectPOI: (poi: POI) => void }) {
  const nebulaRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += 0.0005;
      nebulaRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <Stars radius={150} depth={50} count={3000} factor={6} saturation={1} />
      
      <group ref={nebulaRef}>
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, -60]}>
            <sphereGeometry args={[20, 32, 32]} />
            <meshBasicMaterial 
              color={['#67E8F9', '#818CF8', '#34D399'][i % 3]} 
              transparent 
              opacity={0.1} 
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[0, -5, -10]}>
        <cylinderGeometry args={[2, 2, 10, 16]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>

      {POIs.OBSERVATORY.map((poi) => (
        <POIMarker key={poi.id} poi={poi} onClick={() => onSelectPOI(poi)} />
      ))}
    </group>
  );
}

function POIMarker({ poi, onClick }: { poi: POI; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(hovered ? 1.5 + Math.sin(state.clock.elapsedTime * 5) * 0.2 : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <group position={poi.position}>
      <mesh
        ref={ref}
        onClick={(e) => { 
          e.stopPropagation(); 
          playCollectSound(0.3);
          onClick(); 
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#67E8F9" : "#60A5FA"} />
      </mesh>
      
      <Html position={[0, 1, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={`transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-60'}`}>
          <div className="bg-black/50 border border-[#1E293B] px-2 py-1 rounded text-xs text-white whitespace-nowrap backdrop-blur-sm">
            {poi.name}
          </div>
        </div>
      </Html>
    </group>
  );
}

function CameraController({ activeZone }: { activeZone: ZoneType }) {
  const { camera } = useThree();
  const input = useIrisInput();
  
  const targetPositions: Record<ZoneType, [number, number, number]> = useMemo(() => ({
    ORBITAL: [0, 0, 20],
    TERRAIN: [0, 5, 20],
    RESEARCH: [0, 5, 15],
    OBSERVATORY: [0, 0, 5],
  }), []);

  useFrame(() => {
    const target = new THREE.Vector3(...targetPositions[activeZone]);
    
    if (input.connected) {
      const offsetX = input.yaw * 10;
      const offsetY = -input.pitch * 10;
      target.x += offsetX;
      target.y += offsetY;
    }
    
    camera.position.lerp(target, 0.05);
  });

  return <OrbitControls enablePan={false} enableZoom={true} maxDistance={50} minDistance={5} />;
}

export default function ExplorationCanvas({ 
  activeZone, 
  onSelectPOI 
}: { 
  activeZone: ZoneType;
  onSelectPOI: (poi: POI) => void;
}) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 60, position: [0, 0, 20] }}>
      <color attach="background" args={['#05070C']} />
      
      {activeZone === 'ORBITAL' && <OrbitalZone onSelectPOI={onSelectPOI} />}
      {activeZone === 'TERRAIN' && <TerrainZone onSelectPOI={onSelectPOI} />}
      {activeZone === 'RESEARCH' && <ResearchZone onSelectPOI={onSelectPOI} />}
      {activeZone === 'OBSERVATORY' && <ObservatoryZone onSelectPOI={onSelectPOI} />}
      
      <CameraController activeZone={activeZone} />
    </Canvas>
  );
}

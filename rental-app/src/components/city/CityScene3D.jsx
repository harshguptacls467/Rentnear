import { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Preload, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import CameraRig from './CameraRig';
import Buildings from './Buildings';
import Vehicles from './Vehicles';
import PropertyPins from './PropertyPins';

function CityGround() {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Roads - horizontal */}
      {[0, 30, -30, 60, -60].map(z => (
        <mesh key={`h${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, z]}>
          <planeGeometry args={[240, 4]} />
          <meshStandardMaterial color="#111827" roughness={1} />
        </mesh>
      ))}
      {/* Roads - vertical */}
      {[0, 30, -30, 60, -60].map(x => (
        <mesh key={`v${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.45, 0]}>
          <planeGeometry args={[4, 240]} />
          <meshStandardMaterial color="#111827" roughness={1} />
        </mesh>
      ))}
      {/* Road lane markings */}
      {[-90, -60, -30, 0, 30, 60, 90].map(z =>
        [-90, -50, -10, 30, 70].map(x => (
          <mesh key={`m${x}${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.4, z]}>
            <planeGeometry args={[8, 0.3]} />
            <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.5} />
          </mesh>
        ))
      )}
      {/* City grid glow overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <planeGeometry args={[280, 280, 20, 20]} />
        <meshBasicMaterial color="#0d2a4a" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function CityLights() {
  return (
    <>
      {/* Ambient — very dark night sky */}
      <ambientLight intensity={0.15} color="#1a2a4a" />

      {/* Moonlight */}
      <directionalLight
        position={[-80, 120, -60]}
        intensity={0.4}
        color="#9ab4d4"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* District accent lights */}
      <pointLight position={[0, 5, 0]}     color="#0d9e75" intensity={30} distance={80}  decay={2} />
      <pointLight position={[-70, 5, 0]}   color="#6366f1" intensity={20} distance={60}  decay={2} />
      <pointLight position={[70, 5, 0]}    color="#0ea5e9" intensity={20} distance={60}  decay={2} />
      <pointLight position={[0, 5, -70]}   color="#f59e0b" intensity={15} distance={50}  decay={2} />
      <pointLight position={[-50, 5, 60]}  color="#d97706" intensity={15} distance={50}  decay={2} />
      <pointLight position={[50, 5, 60]}   color="#ec4899" intensity={12} distance={45}  decay={2} />

      {/* CBD tower light */}
      <spotLight
        position={[0, 100, 0]}
        angle={0.5}
        penumbra={1}
        intensity={80}
        color="#0d9e75"
        castShadow
        distance={300}
        decay={1}
      />
    </>
  );
}

export default function CityScene3D({ scrollRef }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <fog attach="fog" args={['#050a14', 100, 500]} />
      <color attach="background" args={['#040810']} />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <CityLights />

      <Suspense fallback={null}>
        <Stars radius={300} depth={60} count={4000} factor={4} saturation={0.3} fade speed={0.3} />
        <Buildings />
        <CityGround />
        <Vehicles />
        <PropertyPins />
        <Preload all />
      </Suspense>

      <CameraRig scrollRef={scrollRef} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={1.8} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}

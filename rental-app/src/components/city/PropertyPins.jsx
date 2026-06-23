import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// Key buildings to pin — approximate top positions
const PINS = [
  { x: 0,   z: 0,   h: 88,  label: '3BHK Apartment',  price: '₹18k/mo',  color: '#0D9E75' },
  { x: -68, z: 2,   h: 30,  label: 'PG Room',          price: '₹8k/mo',   color: '#6366f1' },
  { x: 0,   z: -68, h: 22,  label: 'Hostel Bed',       price: '₹5k/mo',   color: '#f59e0b' },
  { x: 68,  z: -2,  h: 58,  label: 'Office Space',     price: '₹45k/mo',  color: '#0ea5e9' },
  { x: -48, z: 62,  h: 44,  label: 'Luxury Villa',     price: '₹1.2L/mo', color: '#d97706' },
  { x: 48,  z: 62,  h: 32,  label: 'Studio Flat',      price: '₹12k/mo',  color: '#ec4899' },
  { x: 20,  z: -10, h: 70,  label: 'Penthouse',        price: '₹2L/mo',   color: '#14b8a6' },
  { x: -20, z: 8,   h: 55,  label: 'Co-working',       price: '₹800/day', color: '#8b5cf6' },
];

function PropertyPin({ x, z, h, label, price, color }) {
  const ringRef = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const scale = 1 + 0.5 * Math.abs(Math.sin(t * 1.2));
      ringRef.current.scale.setScalar(scale);
      ringRef.current.material.opacity = 0.8 - 0.5 * Math.abs(Math.sin(t * 1.2));
    }
    if (ring2Ref.current) {
      const scale2 = 1 + 0.5 * Math.abs(Math.sin(t * 1.2 + 1.5));
      ring2Ref.current.scale.setScalar(scale2);
      ring2Ref.current.material.opacity = 0.6 - 0.4 * Math.abs(Math.sin(t * 1.2 + 1.5));
    }
  });

  const pinColor = new THREE.Color(color);

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.8} floatingRange={[-1, 1]}>
      <group position={[x, h + 6, z]}>
        {/* Pulsing rings */}
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.2, 32]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.8, 3.2, 32]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* Pin sphere */}
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial color={color} emissive={pinColor} emissiveIntensity={2} />
        </mesh>

        {/* Glow light */}
        <pointLight color={color} intensity={8} distance={20} decay={2} />

        {/* Pin stem */}
        <mesh position={[0, -3.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 5, 8]} />
          <meshStandardMaterial color={color} emissive={pinColor} emissiveIntensity={1} />
        </mesh>

        {/* Label card */}
        <group position={[0, 2.5, 0]}>
          <mesh>
            <boxGeometry args={[6, 2, 0.1]} />
            <meshStandardMaterial color="#0a0a1a" transparent opacity={0.85} />
          </mesh>
          <Text
            position={[0, 0.3, 0.1]}
            fontSize={0.55}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
          >
            {label}
          </Text>
          <Text
            position={[0, -0.35, 0.1]}
            fontSize={0.5}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {price}
          </Text>
        </group>
      </group>
    </Float>
  );
}

export default function PropertyPins() {
  return (
    <group>
      {PINS.map((pin, i) => (
        <PropertyPin key={i} {...pin} />
      ))}
    </group>
  );
}

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Road paths for cars: array of [x,z] waypoints
const ROAD_PATHS = [
  [[-120,0],[120,0]],            // Main horizontal boulevard
  [[0,-120],[0,120]],            // Main vertical avenue
  [[-120,30],[120,30]],          // Side roads
  [[-120,-30],[120,-30]],
  [[30,-120],[30,120]],
  [[-30,-120],[-30,120]],
  [[-80,50],[80,50]],
  [[-80,-50],[80,-50]],
];

function Car({ pathPoints, speed, offset, color }) {
  const meshRef = useRef();
  const curve = useMemo(() => {
    const pts = pathPoints.map(([x, z]) => new THREE.Vector3(x, 0.6, z));
    return new THREE.CatmullRomCurve3(pts, true);
  }, [pathPoints]);
  const t = useRef(offset);

  useFrame((_, delta) => {
    t.current = (t.current + delta * speed) % 1;
    if (!meshRef.current) return;
    const pos = curve.getPoint(t.current);
    const tangent = curve.getTangent(t.current);
    meshRef.current.position.copy(pos);
    meshRef.current.lookAt(pos.clone().add(tangent));
  });

  return (
    <group ref={meshRef}>
      {/* Car body */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.8, 0.5, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.9, 0.4, 0.85]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Headlights */}
      <pointLight position={[0.9, 0.25, 0]} color="#ffffcc" intensity={3} distance={15} decay={2} />
      {/* Taillights */}
      <pointLight position={[-0.9, 0.25, 0]} color="#ff2200" intensity={2} distance={8} decay={2} />
    </group>
  );
}

const CAR_COLORS = ['#c8102e', '#003087', '#1a1a1a', '#f5a623', '#ffffff', '#2d6a2d', '#8b0000'];

export default function Vehicles() {
  const cars = useMemo(() => {
    const list = [];
    let id = 0;
    ROAD_PATHS.forEach((path) => {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        list.push({
          id: id++,
          path,
          speed: 0.02 + Math.random() * 0.025,
          offset: Math.random(),
          color: CAR_COLORS[id % CAR_COLORS.length],
        });
      }
    });
    return list;
  }, []);

  return (
    <group>
      {cars.map(c => (
        <Car key={c.id} pathPoints={c.path} speed={c.speed} offset={c.offset} color={c.color} />
      ))}
    </group>
  );
}

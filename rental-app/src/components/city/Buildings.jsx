import { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';

// Seeded deterministic random
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DISTRICTS = [
  { name: 'cbd',         cx: 0,    cz: 0,    spread: 40, count: 35, minH: 25, maxH: 85, color: new THREE.Color('#0d2240'), emissive: new THREE.Color('#1a4a8a') },
  { name: 'residential', cx: -70,  cz: 0,    spread: 28, count: 22, minH: 8,  maxH: 28, color: new THREE.Color('#1a2a1a'), emissive: new THREE.Color('#2a4a2a') },
  { name: 'student',     cx: 0,    cz: -70,  spread: 22, count: 18, minH: 6,  maxH: 20, color: new THREE.Color('#221a0d'), emissive: new THREE.Color('#4a3a0d') },
  { name: 'commercial',  cx: 70,   cz: 0,    spread: 28, count: 22, minH: 18, maxH: 55, color: new THREE.Color('#0d1a2a'), emissive: new THREE.Color('#0d3a5a') },
  { name: 'luxury',      cx: -50,  cz: 60,   spread: 20, count: 14, minH: 14, maxH: 42, color: new THREE.Color('#1a1408'), emissive: new THREE.Color('#5a4a10') },
  { name: 'mixed',       cx: 50,   cz: 60,   spread: 20, count: 12, minH: 10, maxH: 30, color: new THREE.Color('#0d1a1a'), emissive: new THREE.Color('#0d3a3a') },
];

function BuildingGroup({ district, seed }) {
  const meshRef = useRef();
  const { buildings, color, emissive } = useMemo(() => {
    const rand = seededRand(seed);
    const list = [];
    for (let i = 0; i < district.count; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * district.spread;
      list.push({
        x: district.cx + Math.cos(angle) * r,
        z: district.cz + Math.sin(angle) * r,
        w: 4 + rand() * 7,
        d: 4 + rand() * 7,
        h: district.minH + rand() * (district.maxH - district.minH),
      });
    }
    return { buildings: list, color: district.color, emissive: district.emissive };
  }, [district, seed]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    buildings.forEach((b, i) => {
      pos.set(b.x, b.h / 2, b.z);
      scale.set(b.w, b.h, b.d);
      matrix.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, buildings.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.6}
        roughness={0.3}
        metalness={0.7}
      />
    </instancedMesh>
  );
}

// Roof-top lights and antennas for CBD buildings
function CBDDetails() {
  const rand = seededRand(777);
  const lights = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const angle = rand() * Math.PI * 2;
      const r = rand() * 38;
      arr.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, h: 25 + rand() * 60 });
    }
    return arr;
  }, []);
  return (
    <group>
      {lights.map((l, i) => (
        <mesh key={i} position={[l.x, l.h + 3, l.z]}>
          <cylinderGeometry args={[0.15, 0.15, 6, 6]} />
          <meshStandardMaterial color="#cc3333" emissive="#ff2222" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

export default function Buildings() {
  return (
    <group>
      {DISTRICTS.map((d, i) => (
        <BuildingGroup key={d.name} district={d} seed={i * 137 + 42} />
      ))}
      <CBDDetails />
    </group>
  );
}

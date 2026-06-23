import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Camera waypoints: [position, lookAt target]
const WAYPOINTS = [
  { pos: [0, 90, 140],   target: [0, 5, 0] },     // 0%  - Hero aerial
  { pos: [-55, 28, 95],  target: [-30, 8, 10] },   // 14% - Residential
  { pos: [25, 10, 60],   target: [25, 5, 0] },     // 28% - Student street level
  { pos: [65, 55, 35],   target: [35, 25, 10] },   // 42% - Business tower
  { pos: [-45, 38, 30],  target: [-15, 14, 0] },   // 57% - Luxury
  { pos: [5, 22, 52],    target: [0, 2, 0] },      // 71% - Map center
  { pos: [0, 170, 90],   target: [0, 0, 0] },      // 85% - Pullback
  { pos: [0, 200, 60],   target: [0, 0, 0] },      // 100% - Final CTA
];

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

export default function CameraRig({ scrollRef }) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 90, 140));
  const currentTarget = useRef(new THREE.Vector3(0, 5, 0));

  useEffect(() => {
    camera.position.set(0, 90, 140);
    camera.lookAt(0, 5, 0);
    camera.fov = 60;
    camera.near = 0.5;
    camera.far = 2000;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    const t = (scrollRef.current || 0) * (WAYPOINTS.length - 1);
    const i = Math.min(Math.floor(t), WAYPOINTS.length - 2);
    const f = t - i;

    const wp0 = WAYPOINTS[i];
    const wp1 = WAYPOINTS[i + 1];

    tmpPos.set(...wp0.pos).lerp(new THREE.Vector3(...wp1.pos), f);
    tmpTarget.set(...wp0.target).lerp(new THREE.Vector3(...wp1.target), f);

    currentPos.current.lerp(tmpPos, 0.04);
    currentTarget.current.lerp(tmpTarget, 0.04);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
}

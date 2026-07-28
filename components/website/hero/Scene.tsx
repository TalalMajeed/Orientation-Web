"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Cloud, Clouds, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

// Original greyish clouds (unchanged intensity/colour/size) — only the per-cloud
// speeds are bumped up a little so the movement is a touch more lively.
function Sky() {
  return (
    <>
      <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.5} />
      <Clouds material={THREE.MeshBasicMaterial} position={[0, -12, -9]} frustumCulled={false}>
        <Cloud seed={1} segments={18} bounds={[20, 2, 4]} concentrate="outside" growth={4} volume={5} smallestVolume={2} scale={2} fade={16} speed={0.2} color="#b2b6bd" opacity={0.2} />
        <Cloud seed={4} segments={16} bounds={[18, 2, 4]} concentrate="outside" growth={3} volume={4} smallestVolume={2} scale={1.8} fade={13} speed={0.18} color="#7d848f" opacity={0.22} />
        <Cloud seed={7} segments={14} bounds={[12, 1.5, 3]} concentrate="inside" growth={2} volume={3} smallestVolume={2} scale={1.4} fade={10} speed={0.24} color="#d85503" opacity={0.1} />
      </Clouds>
    </>
  );
}

function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const enabled = useRef(true);

  useEffect(() => {
    enabled.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled.current) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5;
      pointer.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(() => {
    if (!group.current || !enabled.current) return;
    group.current.rotation.y += (pointer.current.x * 0.05 - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (-pointer.current.y * 0.03 - group.current.rotation.x) * 0.03;
  });

  return <group ref={group}>{children}</group>;
}

export default function Scene() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
      dpr={[1, 2]}
      frameloop="always"
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false
        );
      }}
    >
      <Suspense fallback={null}>
        <ParallaxRig>
          <Sky />
        </ParallaxRig>
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}

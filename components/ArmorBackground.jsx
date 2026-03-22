"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ArmorBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <ScalesInstanced speed={0.8} amplitude={0.25} scaleSize={2} />
      </Canvas>
    </div>
  );
}

function ScalesInstanced({ speed, amplitude, scaleSize }) {
  const meshRef = useRef();
  // viewport gives world-unit dimensions (not pixels)
  const { viewport } = useThree();

  const w = scaleSize;
  const h = scaleSize;
  const cols = Math.ceil(viewport.width / w) + 2;
  const rows = Math.ceil(viewport.height / (h * 0.5)) + 2;
  const count = rows * cols;

  const [colorMap, normalMap] = useTexture([
    "/textures/T_Armor4_Color.png",
    "/textures/T_Armor4_Normal.png",
  ]);

  [colorMap, normalMap].forEach((tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  });

  // Simple flat plane instead of heavy ExtrudeGeometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(w / 2, 0);
    shape.absarc(0, 0, w / 2, 0, Math.PI, true);
    shape.closePath();
    return new THREE.ShapeGeometry(shape, 4);
  }, [w, h]);

  // Lighter material — no displacement map, just color + normal
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        metalness: 0.5,
        roughness: 0.6,
      }),
    [colorMap, normalMap]
  );

  // Precompute base positions + random phases
  const { basePositions, phases } = useMemo(() => {
    const positions = [];
    const ph = [];
    const rowSpacing = h * 0.5;
    const colSpacing = w;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col - (cols - 1) / 2) * colSpacing;
        const y = ((rows - 1) / 2 - row) * rowSpacing;
        positions.push(x, y, 0);
        ph.push(Math.random() * Math.PI * 2);
      }
    }
    return { basePositions: positions, phases: ph };
  }, [rows, cols, w, h]);

  // Set initial instance transforms
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update instance matrices on mount and when grid changes
  useMemo(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(basePositions[i * 3], basePositions[i * 3 + 1], 0);
      dummy.rotation.set(0, 0, 0); // flat — no rotation
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, basePositions, dummy]);

  // Animate Z position per instance — single draw call
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * speed;
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        basePositions[i * 3],
        basePositions[i * 3 + 1],
        Math.sin(t + phases[i]) * amplitude
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

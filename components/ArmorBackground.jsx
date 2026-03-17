"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ArmorBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <AdaptiveScales speed={1} amplitude={0.3} scaleSize={2} />
      </Canvas>
    </div>
  );
}

function AdaptiveScales({ speed, amplitude, scaleSize }) {
  // get viewport size inside <Canvas>
  const { size } = useThree();
  const w = scaleSize;
  const h = scaleSize;
  const cols = Math.ceil(size.width / w) + 2;
  const rows = Math.ceil(size.height / (h * 0.5)) + 2;
  return (
    <ScalesGrid
      rows={rows}
      cols={cols}
      scaleSize={scaleSize}
      speed={speed}
      amplitude={amplitude}
    />
  );
}

function ScalesGrid({ rows, cols, scaleSize, speed, amplitude }) {
  // load textures: color, normal, height
  const [colorMap, normalMap, heightMap] = useTexture([
    "/textures/color.png",
    "/textures/normal.png",
    "/textures/height.png",
  ]);

  [colorMap, normalMap, heightMap].forEach((tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  });

  const w = scaleSize;
  const h = scaleSize;

  // shape + extruded geometry for scallop
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(w / 2, 0);
    shape.absarc(0, 0, w / 2, 0, Math.PI, true);
    shape.closePath();
    // extrude with subdivisions for displacement
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.05, // tiny depth so normals/displacement work
      steps: 20,
      bevelEnabled: false,
    });
  }, [w, h]);

  // material with full PBR + displacement
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        displacementMap: heightMap,
        displacementScale: 0.1,
        metalness: 0.5,
        roughness: 0.6,
      }),
    [colorMap, normalMap, heightMap]
  );

  // generate mesh positions in scallop tiling
  const positions = useMemo(() => {
    const arr = [];
    const rowSpacing = h * 0.5;
    const colSpacing = w;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col - (cols - 1) / 2) * colSpacing;
        const y = ((rows - 1) / 2 - row) * rowSpacing;
        arr.push([x, y, 0]);
      }
    }
    return arr;
  }, [rows, cols, w, h]);

  // random phase per scale for independent timing
  const phases = useMemo(
    () => positions.map(() => Math.random() * Math.PI * 2),
    [positions]
  );

  const groupRef = useRef();

  // animate each scale's world position up/down
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    groupRef.current.children.forEach((mesh, idx) => {
      mesh.position.z = Math.sin(t + phases[idx]) * amplitude;
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={material}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
}

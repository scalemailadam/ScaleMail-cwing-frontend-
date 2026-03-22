"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ArmorBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 10]} intensity={0.6} />
        <ScalesInstanced speed={0.8} amplitude={0.25} scaleSize={2} />
      </Canvas>
    </div>
  );
}

// Per-scale vertical gradient: light grey top → mid grey bottom
function makeGradientTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#d4d4d4");
  grad.addColorStop(1, "#8a8a8a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeScallopShape(w, h) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(w / 2, 0);
  shape.absarc(0, 0, w / 2, 0, Math.PI, true);
  shape.closePath();
  return shape;
}

function ScalesInstanced({ speed, amplitude, scaleSize }) {
  const faceRef = useRef();
  const strokeRef = useRef();
  const { viewport } = useThree();

  const w = scaleSize;
  const h = scaleSize;
  const cols = Math.ceil(viewport.width / w) + 2;
  const rows = Math.ceil(viewport.height / (h * 0.5)) + 2;
  const count = rows * cols;

  // Face geometry
  const faceGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScallopShape(w, h), 8),
    [w, h]
  );

  // Stroke geometry — slightly larger shape, rendered behind
  const strokeScale = 1.04;
  const strokeGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScallopShape(w * strokeScale, h * strokeScale), 8),
    [w, h]
  );

  // Gradient material for faces
  const gradientMap = useMemo(() => makeGradientTexture(), []);
  const faceMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: gradientMap,
        metalness: 0.3,
        roughness: 0.7,
      }),
    [gradientMap]
  );

  // Dark flat material for stroke outlines
  const strokeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: 0x555555 }),
    []
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

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyStroke = useMemo(() => new THREE.Object3D(), []);

  // Animate Y + Z per instance — X stays locked
  useFrame(({ clock }) => {
    if (!faceRef.current) return;
    const t = clock.getElapsedTime() * speed;
    for (let i = 0; i < count; i++) {
      const baseX = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];
      const phase = phases[i];
      const yOffset = Math.sin(t + phase) * amplitude * 0.5;
      const zOffset = Math.sin(t + phase) * amplitude;

      // Face (slightly in front)
      dummy.position.set(baseX, baseY + yOffset, zOffset);
      dummy.updateMatrix();
      faceRef.current.setMatrixAt(i, dummy.matrix);

      // Stroke (slightly behind)
      dummyStroke.position.set(baseX, baseY + yOffset, zOffset - 0.01);
      dummyStroke.updateMatrix();
      strokeRef.current.setMatrixAt(i, dummyStroke.matrix);
    }
    faceRef.current.instanceMatrix.needsUpdate = true;
    strokeRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Stroke layer — dark, slightly larger, slightly behind */}
      <instancedMesh
        ref={strokeRef}
        args={[strokeGeo, strokeMat, count]}
        frustumCulled={false}
      />
      {/* Face layer — gradient, in front */}
      <instancedMesh
        ref={faceRef}
        args={[faceGeo, faceMat, count]}
        frustumCulled={false}
      />
    </>
  );
}

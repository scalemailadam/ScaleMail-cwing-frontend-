"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ArmorBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 1.5]}>
        {/* Diffused top-left light source */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[-8, 6, 10]} intensity={0.7} />
        {/* Subtle fill from bottom-right to avoid pure black */}
        <directionalLight position={[6, -4, 5]} intensity={0.15} />
        <ScalesInstanced scaleSize={2} />
      </Canvas>
    </div>
  );
}

// ── Grey scale texture with central ridge shading ──────────────────
function makeScaleTexture() {
  const w = 128;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Base vertical gradient (top lighter → bottom slightly darker)
  const vGrad = ctx.createLinearGradient(0, 0, 0, h);
  vGrad.addColorStop(0, "#c8c8c8");
  vGrad.addColorStop(0.5, "#b0b0b0");
  vGrad.addColorStop(1, "#909090");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);

  // Central ridge highlight
  ctx.globalCompositeOperation = "lighter";
  const rGrad = ctx.createLinearGradient(0, 0, w, 0);
  rGrad.addColorStop(0, "rgba(0,0,0,0)");
  rGrad.addColorStop(0.35, "rgba(0,0,0,0)");
  rGrad.addColorStop(0.5, "rgba(60,60,60,1)");
  rGrad.addColorStop(0.65, "rgba(0,0,0,0)");
  rGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rGrad;
  ctx.fillRect(0, 0, w, h);

  // Darken the edges
  ctx.globalCompositeOperation = "multiply";
  const eGrad = ctx.createLinearGradient(0, 0, w, 0);
  eGrad.addColorStop(0, "rgba(120,120,120,1)");
  eGrad.addColorStop(0.2, "rgba(200,200,200,1)");
  eGrad.addColorStop(0.5, "rgba(255,255,255,1)");
  eGrad.addColorStop(0.8, "rgba(200,200,200,1)");
  eGrad.addColorStop(1, "rgba(120,120,120,1)");
  ctx.fillStyle = eGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Armor scale shape ──────────────────────────────────────────────
// Broad rounded top (hinge), tapers to a point at the bottom.
function makeScaleShape(w, h) {
  const shape = new THREE.Shape();
  const hw = w / 2;

  shape.moveTo(0, 0);
  shape.bezierCurveTo(hw * 0.5, 0, hw, -h * 0.05, hw, -h * 0.2);
  shape.bezierCurveTo(hw, -h * 0.5, hw * 0.3, -h * 0.85, 0, -h);
  shape.bezierCurveTo(-hw * 0.3, -h * 0.85, -hw, -h * 0.5, -hw, -h * 0.2);
  shape.bezierCurveTo(-hw, -h * 0.05, -hw * 0.5, 0, 0, 0);

  return shape;
}

function ScalesInstanced({ scaleSize }) {
  const faceRef = useRef();
  const strokeRef = useRef();
  const { viewport } = useThree();

  const w = scaleSize;
  const h = scaleSize * 1.4;
  const cols = Math.ceil(viewport.width / w) + 4;
  const rows = Math.ceil(viewport.height / (h * 0.45)) + 4;
  const count = rows * cols;

  const faceGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScaleShape(w, h), 12),
    [w, h]
  );

  const strokeGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScaleShape(w * 1.05, h * 1.03), 12),
    [w, h]
  );

  const scaleTexture = useMemo(() => makeScaleTexture(), []);
  const faceMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: scaleTexture,
        metalness: 0.35,
        roughness: 0.65,
        side: THREE.DoubleSide,
      }),
    [scaleTexture]
  );
  const strokeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x606060, side: THREE.DoubleSide }),
    []
  );

  // Grid positions + per-scale random seeds for the shiver
  const { basePositions, rowIndices, shiverSeeds } = useMemo(() => {
    const positions = [];
    const ri = [];
    const seeds = [];
    const rowSpacing = h * 0.45;
    const colSpacing = w;
    for (let row = 0; row < rows; row++) {
      const xOff = row % 2 === 0 ? 0 : colSpacing / 2;
      for (let col = 0; col < cols; col++) {
        const x = (col - (cols - 1) / 2) * colSpacing + xOff;
        const y = ((rows - 1) / 2 - row) * rowSpacing;
        positions.push(x, y, 0);
        ri.push(row);
        // Each scale gets unique timing offsets for organic shiver
        seeds.push({
          phase: Math.random() * Math.PI * 2,
          freq: 0.8 + Math.random() * 0.8,   // how fast it shivers
          amp: 0.008 + Math.random() * 0.012, // how far it swings (very subtle)
        });
      }
    }
    return { basePositions: positions, rowIndices: ri, shiverSeeds: seeds };
  }, [rows, cols, w, h]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!faceRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const row = rowIndices[i];
      const seed = shiverSeeds[i];

      // Subtle shiver: rotate around Y axis (left-right swing),
      // hinged at the broad top. Each scale has its own rhythm.
      // Layered sine waves at different frequencies for irregularity.
      const rotY =
        Math.sin(t * seed.freq + seed.phase) * seed.amp +
        Math.sin(t * seed.freq * 1.7 + seed.phase * 0.6) * seed.amp * 0.5 +
        Math.sin(t * seed.freq * 0.3 + seed.phase * 1.4) * seed.amp * 0.3;

      // Upper rows in front (pointed tips overlap broad tops below)
      const zLayer = (rows - row) * 0.02;

      dummy.position.set(bx, by, zLayer);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      faceRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.z = zLayer - 0.005;
      dummy.updateMatrix();
      strokeRef.current.setMatrixAt(i, dummy.matrix);
    }

    faceRef.current.instanceMatrix.needsUpdate = true;
    strokeRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={strokeRef}
        args={[strokeGeo, strokeMat, count]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={faceRef}
        args={[faceGeo, faceMat, count]}
        frustumCulled={false}
      />
    </>
  );
}

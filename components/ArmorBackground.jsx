"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ArmorBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[0, 5, 10]} intensity={0.5} />
        <ScalesInstanced scaleSize={2} />
      </Canvas>
    </div>
  );
}

// ── Grey scale texture with central ridge shading ──────────────────
// Mimics the reference image: lighter ridge down the centre, darker
// falloff toward the left/right edges, with a subtle vertical gradient
// (lighter at the broad top, darker toward the pointed bottom).
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

  // Central ridge highlight (horizontal gradient, additive-ish via overlay)
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
// Broad rounded top, tapers to a point at the bottom.
// Origin at the TOP CENTER (broad edge) — this is the hinge point.
// The scale hangs downward from its wide top.
function makeScaleShape(w, h) {
  const shape = new THREE.Shape();
  const hw = w / 2;

  // Start at the top-center (hinge point, broad edge)
  shape.moveTo(0, 0);

  // Right side: fan out to full width, then taper down to pointed bottom
  shape.bezierCurveTo(hw * 0.5, 0, hw, -h * 0.05, hw, -h * 0.2);
  shape.bezierCurveTo(hw, -h * 0.5, hw * 0.3, -h * 0.85, 0, -h);

  // Left side: mirror back up from pointed bottom to top-center
  shape.bezierCurveTo(-hw * 0.3, -h * 0.85, -hw, -h * 0.5, -hw, -h * 0.2);
  shape.bezierCurveTo(-hw, -h * 0.05, -hw * 0.5, 0, 0, 0);

  return shape;
}

function ScalesInstanced({ scaleSize }) {
  const faceRef = useRef();
  const strokeRef = useRef();
  const { viewport } = useThree();

  const w = scaleSize;
  const h = scaleSize * 1.4; // taller than wide, like the reference
  const cols = Math.ceil(viewport.width / w) + 4;
  const rows = Math.ceil(viewport.height / (h * 0.45)) + 4;
  const count = rows * cols;

  // Face geometry — origin at the top tip (hinge point)
  const faceGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScaleShape(w, h), 12),
    [w, h]
  );

  // Stroke geometry — slightly larger
  const strokeGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScaleShape(w * 1.05, h * 1.03), 12),
    [w, h]
  );

  // Materials
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

  // Grid positions — each scale's HINGE POINT (top tip).
  // Even rows offset by half a column for brick-like tiling.
  // Rows ordered top-to-bottom so lower rows render on top (natural overlap).
  const { basePositions, rowIndices } = useMemo(() => {
    const positions = [];
    const ri = [];
    const rowSpacing = h * 0.45; // overlap amount
    const colSpacing = w;
    for (let row = 0; row < rows; row++) {
      const xOff = row % 2 === 0 ? 0 : colSpacing / 2;
      for (let col = 0; col < cols; col++) {
        const x = (col - (cols - 1) / 2) * colSpacing + xOff;
        const y = ((rows - 1) / 2 - row) * rowSpacing;
        positions.push(x, y, 0);
        ri.push(row);
      }
    }
    return { basePositions: positions, rowIndices: ri };
  }, [rows, cols, w, h]);

  // Ripple state — occasional waves instead of constant motion
  const rippleState = useRef({
    // Each ripple: { originX, originY, startTime, speed, strength }
    active: [],
    nextRippleTime: 2 + Math.random() * 3,
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!faceRef.current) return;
    const t = clock.getElapsedTime();
    const rs = rippleState.current;

    // Spawn new ripple occasionally
    if (t > rs.nextRippleTime) {
      rs.active.push({
        originX: (Math.random() - 0.5) * viewport.width,
        originY: (Math.random() - 0.5) * viewport.height,
        startTime: t,
        speed: 6 + Math.random() * 4, // world units per second
        strength: 0.15 + Math.random() * 0.15,
      });
      // Next ripple in 3–7 seconds
      rs.nextRippleTime = t + 3 + Math.random() * 4;
      // Prune old ripples (keep last 4)
      if (rs.active.length > 4) rs.active.shift();
    }

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const row = rowIndices[i];

      // Sum rotation from all active ripples
      let rotX = 0;
      for (const rip of rs.active) {
        const dist = Math.sqrt((bx - rip.originX) ** 2 + (by - rip.originY) ** 2);
        const elapsed = t - rip.startTime;
        const waveFront = elapsed * rip.speed;
        const delta = dist - waveFront;

        // Gaussian-ish envelope around the wave front
        const envelope = Math.exp(-(delta * delta) / 3);
        // Fade out over time
        const fade = Math.max(0, 1 - elapsed / 4);
        rotX += Math.sin(delta * 2) * rip.strength * envelope * fade;
      }

      // Hinge rotation: pivot at top tip, rotate around X axis.
      // Positive rotX tilts the bottom toward the viewer.
      // z-layer: higher rows (larger row index = lower on screen) render in front
      const zLayer = row * 0.02;

      dummy.position.set(bx, by, zLayer);
      dummy.rotation.set(rotX, 0, 0);
      dummy.updateMatrix();
      faceRef.current.setMatrixAt(i, dummy.matrix);

      // Stroke follows the same transform, slightly behind
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

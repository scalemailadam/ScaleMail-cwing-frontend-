"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ArmorBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 1.5]}>
        {/* Diffused top-left light — pronounced gradient */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[-10, 8, 12]} intensity={1.0} />
        {/* Subtle fill from bottom-right */}
        <directionalLight position={[8, -6, 5]} intensity={0.1} />
        <ScalesInstanced scaleSize={2} />
      </Canvas>
    </div>
  );
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

  // Load the cracked texture
  const crackedTex = useTexture("/textures/cracked-scale.png");
  crackedTex.wrapS = crackedTex.wrapT = THREE.RepeatWrapping;

  // Face geometry
  const faceGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScaleShape(w, h), 12),
    [w, h]
  );

  // Stroke geometry — slightly larger
  const strokeGeo = useMemo(
    () => new THREE.ShapeGeometry(makeScaleShape(w * 1.05, h * 1.03), 12),
    [w, h]
  );

  // Per-instance UV offsets — each scale crops a different part of the texture
  const cropScale = 0.08; // each scale shows ~8% of the texture (zoomed in)
  const uvOffsets = useMemo(() => {
    const offsets = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      offsets[i * 2] = Math.random() * (1 - cropScale);
      offsets[i * 2 + 1] = Math.random() * (1 - cropScale);
    }
    return offsets;
  }, [count]);

  // Attach per-instance UV offset attribute to face geometry
  useEffect(() => {
    if (!faceRef.current) return;
    const attr = new THREE.InstancedBufferAttribute(uvOffsets, 2);
    faceRef.current.geometry.setAttribute("aUvOffset", attr);
  }, [faceRef, uvOffsets]);

  // Custom material with per-instance UV offset shader injection
  const faceMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: crackedTex,
      color: new THREE.Color(1, 1, 1), // white base — color comes from shader gradient
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.cropScale = { value: cropScale };

      // Add instance attribute + local UV varying to vertex shader
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `attribute vec2 aUvOffset;
         varying vec2 vCropUv;
         varying vec2 vLocalUv;
         uniform float cropScale;
         void main() {`
      );

      // Pass both cropped UV and local UV to fragment shader
      shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
         vCropUv = uv * cropScale + aUvOffset;
         vLocalUv = uv;`
      );

      // Declare varyings in fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `varying vec2 vCropUv;
         varying vec2 vLocalUv;
         void main() {`
      );

      // Layer: per-scale red gradient × cracked texture crop
      // Gradient: #8e3232 at tip (vLocalUv.y=0) → #4a1a1a at base/hinge (vLocalUv.y=1)
      // Central ridge: lighter in center → darker at edges
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
           // Deep red gradient: bright tip → dark base
           vec3 tipColor  = vec3(0.557, 0.196, 0.196); // #8e3232
           vec3 baseColor = vec3(0.290, 0.102, 0.102); // #4a1a1a
           vec3 scaleColor = mix(tipColor, baseColor, vLocalUv.y);
           // Central ridge highlight
           float ridge = 1.0 - 0.15 * pow(abs(vLocalUv.x - 0.5) * 2.0, 1.5);
           scaleColor *= ridge;
           // Cracked texture crop
           vec4 crackedColor = texture2D(map, vCropUv);
           // Layer: red gradient underneath, cracked texture on top
           diffuseColor.rgb = scaleColor * crackedColor.rgb;
         #endif`
      );
    };

    return mat;
  }, [crackedTex]);

  const strokeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x2a0e0e, side: THREE.DoubleSide }),
    []
  );

  // Grid positions + row indices
  const { basePositions, rowIndices } = useMemo(() => {
    const positions = [];
    const ri = [];
    const rowSpacing = h * 0.45;
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

  // Ripple state — wide waves that sweep through, scales pendulum-swing
  const rippleState = useRef({
    active: [],
    nextRippleTime: 1.5 + Math.random() * 2,
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!faceRef.current) return;
    const t = clock.getElapsedTime();
    const rs = rippleState.current;

    // Spawn ripple waves occasionally
    if (t > rs.nextRippleTime) {
      rs.active.push({
        originY: (Math.random() - 0.5) * viewport.height,
        direction: Math.random() > 0.5 ? 1 : -1,
        startTime: t,
        speed: 5 + Math.random() * 3,
        strength: 0.06 + Math.random() * 0.06,
      });
      rs.nextRippleTime = t + 2.5 + Math.random() * 4;
      if (rs.active.length > 3) rs.active.shift();
    }

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const row = rowIndices[i];

      // Sum Z-axis rotation (pendulum swing) from all active ripples
      let rotZ = 0;
      for (const rip of rs.active) {
        const elapsed = t - rip.startTime;
        const waveFrontY = rip.originY + elapsed * rip.speed * rip.direction;
        const delta = (by - waveFrontY) * rip.direction;

        // Wide envelope for big sweeping ripple
        const envelope = Math.exp(-(delta * delta) / 4);
        const fade = Math.max(0, 1 - elapsed / 5);
        const distanceFade = Math.max(0, 1 - (elapsed * rip.speed) / (viewport.height * 2));
        rotZ += Math.sin(delta * 2) * rip.strength * envelope * fade * distanceFade;
      }

      // Upper rows in front
      const zLayer = (rows - row) * 0.02;

      // Z rotation = pendulum swing (left/right, stays flat)
      dummy.position.set(bx, by, zLayer);
      dummy.rotation.set(0, 0, rotZ);
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

import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import vertexShader from "../../shaders/fold/vertex.glsl";
import fragmentShader from "../../shaders/fold/fragment.glsl";
import { Html } from "@react-three/drei";

interface WarpPlaneProps {
  texture: THREE.Texture;
  images: React.MutableRefObject<Map<string, any>>;
  id: string;
}

export function WarpPlane({ texture, images, id }: WarpPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const [foldLineY, setFoldLineY] = useState(0.5); // State to track fold line position
  const el = document.querySelector(
    `[data-webgl-id="${id.split("-").at(-1)}"]`,
  ) as HTMLImageElement;

  // Initialize shader uniforms matching ImageTest.tsx
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uScrollProgress: { value: 0.5 },
      uEdgeThreshold: { value: 0.2 },
      uDirection: { value: 1.0 },
      uScaleIntensity: { value: 100.0 },
      uMaskPosition: { value: 0.5 },
      uFoldLineY: { value: 0.0 }, // Position of fold line in mesh space
    }),
    [texture],
  );

  // Store mesh ref in the images map so ImageScene can access it
  const imageData = images.current.get(id);
  if (imageData && meshRef.current) {
    imageData.mesh = meshRef.current;
  }

  // Calculate scroll progress and fold line position
  useFrame(() => {
    const imageData = images.current.get(id);

    if (!imageData?.domRef?.current || !meshRef.current || !el) return;

    // Update shader uniforms
    const material = meshRef.current.material as THREE.ShaderMaterial;

    const worldPosition = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPosition);

    const halfHeight = viewport.height / 2;
    const rawNormalizedY = worldPosition.y / halfHeight; // -1 to 1
    const threshold = 0.5; // The "dead zone" (40% of the way to the edge)
    const animSpeed = 1.2; // Optional: Adjust how fast the mask moves once it starts

    let movement = 0;

    if (Math.abs(rawNormalizedY) > threshold) {
      // Calculate how far we are past the threshold
      const distancePast = Math.abs(rawNormalizedY) - threshold;

      // Maintain the direction (top or bottom)
      const sign = Math.sign(rawNormalizedY);

      // The movement starts at 0 and grows at a normal 1:1 rate (or faster via animSpeed)
      movement = distancePast * sign * animSpeed;
    }

    // 2. Set Mask Position
    // We want the mask to "track" the object's center
    material.uniforms.uMaskPosition.value = movement;

    // 3. Determine Direction based on Viewport Hemisphere
    // If normalizedY > 0, it's in the top half (flip mask to fade towards top)
    // If normalizedY < 0, it's in the bottom half (flip mask to fade towards bottom)
    material.uniforms.uDirection.value = movement > 0 ? 1.0 : 1.0;

    // 4. Calculate Scroll Progress (Intensity)
    // This creates a 0 to 1 value based on how close it is to ANY edge.
    // Near center = 0.5, Near top/bottom = 1.0 or 0.0
    const progress = THREE.MathUtils.clamp((movement + 1) / 2, 0, 1);
    material.uniforms.uScrollProgress.value = progress;
  });

  return (
    <>
      <Html>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={foldLineY}
          onChange={(e) => setFoldLineY(Number(e.currentTarget.value))}
        />
      </Html>
      <mesh ref={meshRef}>
        {/* Higher segment count for smooth curved fold */}
        <planeGeometry args={[1, 1, 48, 48]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          // wireframe={true}
          side={THREE.DoubleSide}
          transparent={true}
        />
      </mesh>
    </>
  );
}

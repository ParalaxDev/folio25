import { Canvas, useFrame } from "@react-three/fiber";
import { WebGLImageProvider, DOMImage } from "./WebGLImage";
import * as THREE from "three";
import { useMemo, useState, useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";

const texture = new THREE.TextureLoader().load(
  "https://picsum.photos/800/600?random=1",
);

const vertexShader = `
  uniform float uScrollProgress;
  uniform float uEdgeThreshold;
  uniform float uDirection;
  uniform float uScaleIntensity; // New uniform to control the "pop"

  varying vec2 vUv;

  float smootherstep(float edge0, float edge1, float x) {
      x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  void main() {
      vUv = uv;

      // 1. Calculate global activation
      float edgeDistance = abs(uScrollProgress - 0.5) * 2.0;
      float bendAmount = smootherstep(uEdgeThreshold, 1.0, edgeDistance);
      bendAmount = sin(bendAmount * 1.570796);

      // 2. Determine direction
      float direction = uDirection * sign(uScrollProgress - 0.5);

      // 3. Create the spatial mask
      // Map scroll progress to vertical position (-height/2 to +height/2)
      // When scrollProgress = 0 (top of viewport), bend at top of image
      // When scrollProgress = 1 (bottom of viewport), bend at bottom of image
      float localThreshold = (uScrollProgress - 0.5) * 400.0 * direction;
      float transitionRange = 400.0;
      float vertexYMask = smootherstep(localThreshold, localThreshold + transitionRange, -(position.y * direction));

      // 4. Exponential Weight
      float exponentialWeight = smootherstep(0.0, 1.0, pow(vertexYMask, 2.0));

      vec3 newPosition = position;

      // --- THE FIX FOR ORTHOGRAPHIC ---

      // Calculate a scale factor.
      // 1.0 is the base size. uScaleIntensity (e.g., 0.5) is how much it grows.
      float scaleFactor = 1.0 + (bendAmount * exponentialWeight * uScaleIntensity);

      // Scale X and Y relative to the center of the plane
      newPosition.x *= scaleFactor;
      newPosition.y *= scaleFactor;

      // Optional: Keep Z movement if you still want depth testing/sorting to work
      // newPosition.z += bendAmount * exponentialWeight * 200.0;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
  `;

const fragmentShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(uTexture, vUv);
    // gl_FragColor = vec4(vec3(vertexYMask), 1.0);
    gl_FragColor = color;
  }
`;

export interface ImageTestConfig {
  /** Intensity of the bend effect (default: 4.0) */
  bendIntensity?: number;
  /** Frequency of the sine wave bend (default: 1.5) */
  bendFrequency?: number;
  /** How close to edge before bend starts (0-1, default: 0.3) */
  edgeThreshold?: number;
  /** Direction multiplier for bend (1 or -1, default: 1) */
  bendDirection?: number;
  /** Custom scroll progress (0-1) - if not provided, uses element position in viewport */
  scrollProgress?: number;
}

export default function ImageTest({
  bendIntensity = 4.0,
  bendFrequency = 1.5,
  edgeThreshold = 0.2,
  bendDirection = 1,
  scrollProgress: customScrollProgress,
}: ImageTestConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0.5);

  useEffect(() => {
    if (customScrollProgress !== undefined) {
      setScrollProgress(customScrollProgress);
      return;
    }
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const elementCenter = rect.top + rect.height / 2;
      const progress = elementCenter / viewportHeight;
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };
    handleScroll(); // Initial calculation
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [customScrollProgress]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Canvas
        camera={{ zoom: 1, position: [0, 0, 10], near: 0.1, far: 200 }}
        orthographic
        className="w-full h-full"
      >
        <OrbitControls enableZoom={false} />
        <ambientLight intensity={1} />
        <ImagePlane
          scrollProgress={scrollProgress}
          bendIntensity={bendIntensity}
          bendFrequency={bendFrequency}
          edgeThreshold={edgeThreshold}
          bendDirection={bendDirection}
        />
      </Canvas>
    </div>
  );
}

const ImagePlane = ({
  scrollProgress,
  bendIntensity,
  bendFrequency,
  edgeThreshold,
  bendDirection,
}: {
  scrollProgress: number;
  bendIntensity: number;
  bendFrequency: number;
  edgeThreshold: number;
  bendDirection: number;
}) => {
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uScrollProgress: { value: scrollProgress },
      uBendIntensity: { value: bendIntensity },
      uBendFrequency: { value: bendFrequency },
      uEdgeThreshold: { value: edgeThreshold },
      uDirection: { value: bendDirection },
      uScaleIntensity: { value: 100 },
    }),
    [],
  );

  useFrame(() => {
    uniforms.uScrollProgress.value = scrollProgress;
    uniforms.uBendIntensity.value = bendIntensity;
    uniforms.uBendFrequency.value = bendFrequency;
    uniforms.uEdgeThreshold.value = edgeThreshold;
    uniforms.uDirection.value = bendDirection;
    uniforms.uScaleIntensity.value = 100;
  });

  return (
    <mesh>
      <planeGeometry args={[400, 300, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        wireframe={true}
      />
    </mesh>
  );
};

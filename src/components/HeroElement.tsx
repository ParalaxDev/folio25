"use client";

import { AsciiRenderer } from "@react-three/drei";
import {
  extend,
  Canvas,
  useFrame,
  useThree,
  type ThreeElements,
} from "@react-three/fiber";
import * as THREE from "three";
import {
  shaderMaterial,
  OrbitControls,
  OrthographicCamera,
} from "@react-three/drei";

import { useEffect, useRef } from "react";
import { AsciiEffect } from "three/examples/jsm/Addons.js";

import fragmentShader from "../shaders/noise/fragment.glsl";
import vertextShader from "../shaders/noise/vertex.glsl";

const NoiseShader = shaderMaterial(
  {
    u_time: { value: 1.0 },
    u_resolution: { value: new THREE.Vector2() },
    u_offset: { value: 1.0 },
  },
  vertextShader,
  fragmentShader,
);

extend({ NoiseShader });

import mouseFragmentShader from "../shaders/mouse/fragment.glsl";
import mouseVertextShader from "../shaders/mouse/vertex.glsl";

const MouseShader = shaderMaterial(
  {
    u_time: { value: 1.0 },
    u_resolution: { value: new THREE.Vector2() },
    u_opacity: { value: 1.0 },
  },
  mouseVertextShader,
  mouseFragmentShader,
);

extend({ MouseShader });

const WhiteFadeMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uOpacity: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity);
    }
  `,
});

const NoisePlane = (props) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useEffect(() => {
    if (matRef.current) {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const { width, height } = canvas;

        matRef.current.uniforms.u_resolution = {
          value: [width, height],
        };
      }
    }
  }, [matRef]);

  useFrame(({ clock, mouse }) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time = { value: clock.getElapsedTime() };
    }
  });

  return (
    <mesh {...props} rotation={[degInRad(0), degInRad(0), degInRad(0)]}>
      <planeGeometry args={[40, 15, 1]} />
      <noiseShader ref={matRef} u_offset={props.u_offset} />
    </mesh>
  );
};

function degInRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const MousePointer = ({ ...props }) => {
  const ref = useRef<THREE.Mesh>(null!);
  const animatedRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { size, viewport } = useThree();

  useEffect(() => {
    if (matRef.current) {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const { width, height } = canvas;
        matRef.current.uniforms.u_resolution = {
          value: [width, height],
        };

        matRef.current.uniforms.u_opacity.value = 0.65
        
        matRef.current.transparent = true
      }
    }
  }, [matRef]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const scale = 1 + 0.3 * Math.sin(time * 2); // adjust speed and range
    animatedRef.current.scale.set(scale, scale, scale);
  });

  useEffect(() => {
    const handleMouseMove = (event) => {
      const canvas = document.querySelector("canvas");
      if (canvas && ref.current) {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        const worldX = (x * viewport.width) / 2;
        const worldY = (y * viewport.height) / 2;
        ref.current.position.set(worldX, worldY, 2);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [viewport]);

  return (
    <group ref={ref}>
      <mesh position={[0, 0, 5]} ref={animatedRef}>
        <sphereGeometry args={[1.5, 16, 8]} />
        <mouseShader ref={matRef} />
      </mesh>
    </group>
  );
};

export function FadeOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(WhiteFadeMaterial);
  const elapsed = useRef(0);
  const duration = 3; // fade duration in seconds

  function cubicEaseOut(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = 1; // Start fully white
    }
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current && materialRef.current.opacity > 0) {
      elapsed.current += delta;
      let progress = Math.min(elapsed.current / duration, 1);
      // Apply cubic ease-out (invert so opacity goes from 1 to 0)
      materialRef.current.uniforms.uOpacity.value = 1 - cubicEaseOut(progress);
    }
  });

  return (
    <mesh position={[0, 0, 10]}>
      <planeGeometry args={[2000, 2000]} />
      <primitive object={materialRef.current} />
    </mesh>
  );
}

export default function HeroElement({}) {
  return (
    <div className="w-full h-full hover:cursor-none">
      <Canvas>
        <AsciiRenderer
          bgColor="transparent"
          fgColor="#78716c"
          // color
          resolution={0.12}
          characters=" .:-=+*#%@"
          invert={false}
        />
        <MousePointer />
        {/* <OrbitControls /> */}

        <OrthographicCamera
          makeDefault
          zoom={45}
          near={1}
          far={2000}
          position={[0, 0, 200]}
        />
        <NoisePlane position={[0, 0, 0]} u_offset={0} />
        <NoisePlane position={[0, 5, 1]} u_offset={1} />
        <NoisePlane position={[0, 10, 2]} u_offset={2} />
        <FadeOverlay />
      </Canvas>
    </div>
  );
}

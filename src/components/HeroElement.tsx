"use client";

import {
  AsciiRenderer,
  MarchingCubes,
  MarchingPlane,
  MarchingCube,
} from "@react-three/drei";
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

import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { AsciiEffect } from "three/examples/jsm/Addons.js";
import { useTheme } from "../hooks/useTheme";

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

interface FloatingBall {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  strength: number;
  phase: number;
  speed: number;
}

const FloatingBalls = ({
  count = 8,
  fgColor,
}: {
  count?: number;
  fgColor: string;
}) => {
  const initialBalls = useMemo<FloatingBall[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
      ],
      velocity: [
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.01,
      ],
      strength: 0.15 + Math.random() * 0.5, // Random strength between 0.15 and 0.45
      phase: Math.random() * Math.PI * 2, // Random phase for oscillation
      speed: 0.1 + Math.random() * 0.5, // Random speed multiplier
    }));
  }, [count]);

  const [balls, setBalls] = useState<FloatingBall[]>(initialBalls);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    setBalls((currentBalls) =>
      currentBalls.map((ball) => {
        const newBall = { ...ball };

        // Smooth floating motion with sine waves
        const floatX = Math.sin(time * ball.speed + ball.phase) * 0.3;
        const floatY = Math.cos(time * ball.speed * 0.7 + ball.phase) * 0.3;
        const floatZ = Math.sin(time * ball.speed + ball.phase) * 0.3;

        // Update position with base position + floating motion + gradual drift
        let newX =
          initialBalls[ball.id].position[0] + floatX + ball.velocity[0] * time;
        let newY =
          initialBalls[ball.id].position[1] + floatY + ball.velocity[1] * time;
        let newZ =
          initialBalls[ball.id].position[2] + floatZ + ball.velocity[2] * time;

        // Boundary collision detection and velocity reversal
        const bounds = 0.8; // Slightly smaller than the actual bounds to prevent clipping

        // X-axis collision
        // if (newX > bounds || newX < -bounds) {
        //   newBall.velocity = [
        //     -ball.velocity[0],
        //     ball.velocity[1],
        //     ball.velocity[2],
        //   ];
        //   newX = Math.max(-bounds, Math.min(bounds, newX));
        // }

        // Y-axis collision
        // if (newY > bounds || newY < -bounds) {
        //   newBall.velocity = [
        //     ball.velocity[0],
        //     -ball.velocity[1],
        //     ball.velocity[2],
        //   ];
        //   newY = Math.max(-bounds, Math.min(bounds, newY));
        // }

        // Z-axis collision
        // if (newZ > bounds || newZ < -bounds) {
        //   newBall.velocity = [
        //     ball.velocity[0],
        //     ball.velocity[1],
        //     -ball.velocity[2],
        //   ];
        //   newZ = Math.max(-bounds, Math.min(bounds, newZ));
        // }

        // newBall.position = [newX, newY, newZ];
        newBall.position = [ball.position[0], newY, ball.position[2]];

        return newBall;
      }),
    );
  });

  return (
    <>
      {balls.map((ball) => (
        <MarchingCube
          key={ball.id}
          strength={ball.strength}
          subtract={6}
          color={new THREE.Color(fgColor)}
          position={ball.position}
        />
      ))}
    </>
  );
};

const RevolvingCamera = () => {
  const { camera, gl } = useThree();
  const radius = 80; // Distance from center
  const speed = 0.1; // Revolution speed (radians per second)

  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const currentAngle = useRef(0); // Current camera angle
  const timeOffset = useRef(0); // Offset to make auto rotation continue smoothly

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
      gl.domElement.style.cursor = "grabbing";
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - previousMousePosition.current.x;
      const sensitivity = 0.01; // Adjust drag sensitivity

      currentAngle.current += deltaX * sensitivity;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        gl.domElement.style.cursor = "grab";
        // Calculate time offset so auto rotation continues from current position
        const currentTime = performance.now() / 1000; // Convert to seconds
        timeOffset.current = currentAngle.current - currentTime * speed;
      }
    };

    const canvas = gl.domElement;
    canvas.style.cursor = "grab";

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gl]);

  useFrame(({ clock }) => {
    if (isDragging.current) {
      // Use user-controlled angle while dragging
      // currentAngle.current is already updated in handleMouseMove
    } else {
      // Continue auto rotation using time offset for smooth transition
      const time = clock.getElapsedTime();
      currentAngle.current = time * speed + timeOffset.current;
    }

    const angle = currentAngle.current;

    // Calculate position on a circle around the scene
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Keep camera at same height (y = 0 for horizon level)
    camera.position.set(x, 0, z + 30); // Adding 10 to z to maintain original distance

    // Always look at the center of the scene
    camera.lookAt(0, 0, 0);
  });

  return null;
};

export function FadeOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(WhiteFadeMaterial);
  const elapsed = useRef(0);
  const duration = 5; // fade duration in seconds
  const delay = 1.25;

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
      if (state.clock.getElapsedTime() < delay) return;
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
  const theme = useTheme();
  const [fgColor, setFgColor] = useState("#78716c"); // fallback

  useEffect(() => {
    // Get the CSS variable value for --color-text-primary
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-text-primary")
      .trim();
    if (color) setFgColor(color);
  }, [theme]);

  return (
    <div className="w-full h-full">
      <Canvas style={{ zIndex: 1 }}>
        <AsciiRenderer
          bgColor="transparent"
          fgColor={fgColor}
          resolution={0.2}
          characters=" .:-=+*%@#"
          // characters="#@%*+=-:. "
          invert={false}
        />
        <OrthographicCamera
          makeDefault
          zoom={400}
          near={0.01}
          far={2000}
          position={[0, 0, 40]}
        />
        <RevolvingCamera />
        {/*<OrbitControls />*/}
        <directionalLight position={[10, 10, 5]} intensity={1.7} />
        <directionalLight position={[-10, 10, -5]} intensity={1.7} />
        <Suspense fallback={null}>
          <MarchingCubes
            resolution={48}
            maxPolyCount={20000}
            enableUvs={false}
            enableColors={false}
          >
            <meshPhongMaterial
              color={new THREE.Color("#fff")}
              wireframe={false}
              transparent={false}
            />
            <FloatingBalls count={30} fgColor={"#fff"} />
            <MarchingPlane planeType="y" strength={0.3} subtract={8} />
          </MarchingCubes>
        </Suspense>
        {/*<NoisePlane position={[0, 0, -10]} u_offset={0} />*/}
        {/*<NoisePlane position={[0, 5, 1]} u_offset={1} />
        <NoisePlane position={[0, 10, 2]} u_offset={2} />*/}
        <FadeOverlay />
      </Canvas>
    </div>
  );
}

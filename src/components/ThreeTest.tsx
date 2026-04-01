"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { EffectComposer } from "@react-three/postprocessing";
import { PerspectiveFoldEffect } from "./PerspectiveFoldEffect";
import { Html } from "@react-three/drei";
import type { CollectionEntry } from "astro:content";

// Fold effect configuration - easy to modify
interface FoldConfig {
  enabled: boolean;
  strength: number;
  edgeThreshold: number;
  foldAngle: number;
  depth: number;
}

const FOLD_CONFIG: FoldConfig = {
  enabled: true,
  strength: 0.05,
  edgeThreshold: 0.85,
  foldAngle: 0,
  depth: -0.04,
};

const GALLERY_CONFIG = {
  imageWidth: 16 / 2,
  imageHeight: 9 / 2,
  spacing: 0.5,
  scrollSpeed: 2,
  dragDamping: 0.9, // Momentum damping (0-1, lower = more momentum)
  centerScaleMultiplier: 1, // How much bigger the center image gets
  scaleDistance: 4, // Distance from center where scaling effect applies
};

// Sample images - replace with your own
const IMAGES = [
  { url: "https://picsum.photos/800/600?random=1", title: "Image 1" },
  { url: "https://picsum.photos/800/600?random=2", title: "Image 2" },
  { url: "https://picsum.photos/800/600?random=3", title: "Image 3" },
  { url: "https://picsum.photos/800/600?random=4", title: "Image 4" },
  { url: "https://picsum.photos/800/600?random=5", title: "Image 5" },
];

const PIXEL_MULTIPLIER = 25;

const widthInPixels = GALLERY_CONFIG.imageWidth * PIXEL_MULTIPLIER;

// Inside your component:

// Individual image component
function GalleryImage({
  project,
  position,
  index,
}: {
  project: CollectionEntry<"projects">;
  position: [number, number, number];
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const { size, viewport } = useThree();

  // 1. Calculate the ratio of screen pixels to 3D world units
  const pixelsPerUnit = size.width / viewport.width;

  // 2. Multiply your 3D width by that ratio
  const exactPixelWidth = GALLERY_CONFIG.imageWidth * pixelsPerUnit;

  // Load texture with useEffect instead of useState
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      project.data.thumbnail?.src!,
      (loadedTexture) => {
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error("Error loading texture:", error);
      },
    );
  }, [project]); // Re-load if URL changes
  // });

  // Animate based on distance from center
  useFrame((state) => {
    if (meshRef.current) {
      // Get the world position of this mesh
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);

      // Calculate distance from center of screen (x = 0 in world space)
      const distanceFromCenter = Math.abs(worldPosition.x);

      // Calculate scale based on distance (closer to center = bigger)
      const normalizedDistance = Math.min(
        distanceFromCenter / GALLERY_CONFIG.scaleDistance,
        1,
      );
      const baseScale = THREE.MathUtils.lerp(
        GALLERY_CONFIG.centerScaleMultiplier,
        1,
        normalizedDistance,
      );

      // Add hover effect on top of distance-based scale
      const targetScale = hovered ? baseScale * 1 : baseScale;

      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1,
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      visible={texture !== null} // Hide until texture is loaded
    >
      <Html
        center // Automatically centers it horizontally and vertically
        position={[0, GALLERY_CONFIG.imageHeight / 2 + 0.25, 0]}
      >
        <div style={{ width: `${exactPixelWidth}px` }}>
          <h1>01</h1>
          <h1></h1>
        </div>
      </Html>
      <planeGeometry
        args={[GALLERY_CONFIG.imageWidth, GALLERY_CONFIG.imageHeight]}
      />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={!texture}
        opacity={texture ? 1 : 0}
      />
      <Html
        center // Automatically centers it horizontally and vertically
        position={[0, -GALLERY_CONFIG.imageHeight / 2 - 0.25, 0]}
      >
        <div style={{ width: `${exactPixelWidth}px` }}>
          <h1>TEST</h1>
        </div>
      </Html>
    </mesh>
  );
}

// Gallery container with scroll functionality
function Gallery({ projects }: { projects: CollectionEntry<"projects">[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();

  // Scroll state
  const scrollOffset = useRef(0);
  const targetScrollOffset = useRef(0);
  const velocity = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, scrollOffset: 0 });

  // Handle wheel events
  useState(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Support both vertical and horizontal wheel
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      targetScrollOffset.current -= delta * 0.01 * GALLERY_CONFIG.scrollSpeed;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  });

  // Handle pointer events for dragging
  const handlePointerDown = (e: PointerEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      scrollOffset: targetScrollOffset.current,
    };
    velocity.current = 0; // Stop momentum when starting to drag
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;

    // Calculate drag delta in normalized coordinates
    const dragDelta = (e.clientX - dragStart.current.x) / size.width;

    // Convert to world space (viewport.width gives us the world units)
    const worldDelta = dragDelta * viewport.width * 2;

    targetScrollOffset.current = dragStart.current.scrollOffset + worldDelta;
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging.current) return;

    isDragging.current = false;

    // Calculate velocity for momentum
    const dragDelta = (e.clientX - dragStart.current.x) / size.width;
    const worldDelta = dragDelta * viewport.width * 2;
    velocity.current = worldDelta * 10; // Adjust multiplier for momentum strength
  };

  // Animation loop
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Calculate scroll bounds
      // First image should stop at center, last image should stop at center
      const totalWidth =
        (projects.length - 1) *
        (GALLERY_CONFIG.imageWidth + GALLERY_CONFIG.spacing);
      const minScroll = -totalWidth; // Last image at center
      const maxScroll = 0; // First image at center

      // Apply momentum when not dragging
      if (!isDragging.current && Math.abs(velocity.current) > 0.001) {
        targetScrollOffset.current += velocity.current * delta;
        velocity.current *= GALLERY_CONFIG.dragDamping; // Apply damping
      }

      // Clamp target scroll offset to bounds
      targetScrollOffset.current = THREE.MathUtils.clamp(
        targetScrollOffset.current,
        minScroll,
        maxScroll,
      );

      // Smooth interpolation to target
      scrollOffset.current = THREE.MathUtils.lerp(
        scrollOffset.current,
        targetScrollOffset.current,
        0.1,
      );

      // Apply scroll position
      groupRef.current.position.x = scrollOffset.current;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {projects.map((proj, index) => {
        const xPosition =
          index * (GALLERY_CONFIG.imageWidth + GALLERY_CONFIG.spacing);
        return (
          <GalleryImage
            key={index}
            project={proj}
            position={[xPosition, 0, 0]}
            index={index}
          />
        );
      })}

      {/* Invisible plane to capture drag events */}
      <mesh position={[0, 0, -1]} visible={false}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Effects() {
  return (
    <EffectComposer>
      <primitive
        object={
          new PerspectiveFoldEffect({
            strength: FOLD_CONFIG.strength,
            edgeThreshold: FOLD_CONFIG.edgeThreshold,
            foldAngle: FOLD_CONFIG.foldAngle,
            depth: FOLD_CONFIG.depth,
          })
        }
      />
    </EffectComposer>
  );
}

export default function ThreeTest({
  projects,
}: {
  projects: CollectionEntry<"projects">[];
}) {
  return (
    <div className="w-full h-full relative bg-[#D7D8D6]">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={1} />
        <Gallery projects={projects} />
        <Effects />
      </Canvas>
    </div>
  );
}

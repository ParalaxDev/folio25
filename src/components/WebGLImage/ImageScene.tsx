import { useFrame, useThree } from "@react-three/fiber";
import { useScrollVelocity } from "../../hooks/useScrollVelocity";
import { WarpPlane } from "./WarpPlane";
import { useEffect } from "react";
import * as THREE from "three";

interface ImageSceneProps {
  images: React.MutableRefObject<Map<string, any>>;
}

/**
 * Runs inside the Canvas - syncs WebGL planes to DOM image positions each frame
 */
export function ImageScene({ images }: ImageSceneProps) {
  const { size } = useThree();
  const scrollVel = useScrollVelocity();

  useFrame(() => {
    images.current.forEach(({ domRef, mesh }) => {
      if (!domRef.current || !mesh) return;

      const rect = domRef.current.getBoundingClientRect();

      // Ortho camera: map DOM pixel coords to world space
      // DOM origin is top-left, Three.js origin is center
      mesh.position.x = rect.left + rect.width / 2 - size.width / 2;
      mesh.position.y = -(rect.top + rect.height / 2 - size.height / 2);
      mesh.scale.x = rect.width;
      mesh.scale.y = rect.height;

      // No uniforms to update - fold effect calculates screen position in shader
    });
  });

  return (
    <>
      {[...images.current.entries()].map(([id, { texture }]) => (
        <WarpPlane key={id} texture={texture} images={images} id={id} />
      ))}
    </>
  );
}

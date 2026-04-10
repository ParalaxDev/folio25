import { useFrame, useThree } from "@react-three/fiber";
import { WarpPlane } from "./WarpPlane";
import { Suspense, type RefObject } from "react";
import * as THREE from "three";

interface ImageSceneProps {
  images: RefObject<Map<string, any>>;
}

// Find the nearest parent with overflow hidden/scroll/auto
function findOverflowParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    const overflow = style.overflow + style.overflowX + style.overflowY;

    if (
      overflow.includes("hidden") ||
      overflow.includes("scroll") ||
      overflow.includes("auto")
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

export function ImageScene({ images }: ImageSceneProps) {
  const { size } = useThree();

  useFrame(() => {
    images.current.forEach(({ domRef, mesh }) => {
      if (!domRef.current || !mesh) return;

      const rect = domRef.current.getBoundingClientRect();

      mesh.position.x = rect.left + rect.width / 2 - size.width / 2;
      mesh.position.y = -(rect.top + rect.height / 2 - size.height / 2);
      mesh.scale.x = rect.width;
      mesh.scale.y = rect.height;

      // Find overflow container and calculate clipping bounds
      const overflowParent = findOverflowParent(domRef.current);

      if (overflowParent) {
        const containerRect = overflowParent.getBoundingClientRect();
        const material = mesh.material as THREE.ShaderMaterial;

        // Pass clipping bounds to shader in screen space
        material.uniforms.uClipBounds.value = new THREE.Vector4(
          containerRect.left,
          containerRect.top,
          containerRect.right,
          containerRect.bottom,
        );

        material.uniforms.uElementBounds.value = new THREE.Vector4(
          rect.left,
          rect.top,
          rect.right,
          rect.bottom,
        );

        material.uniforms.uUseClipping.value = 1.0;
      } else {
        const material = mesh.material as THREE.ShaderMaterial;
        material.uniforms.uUseClipping.value = 0.0;
      }
    });
  });

  return (
    <>
      {[...images.current.entries()].map(([id, { texture }]) => (
        <Suspense fallback={null} key={id}>
          <WarpPlane key={id} texture={texture} images={images} id={id} />
        </Suspense>
      ))}
    </>
  );
}

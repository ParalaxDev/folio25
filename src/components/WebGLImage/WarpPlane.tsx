import { useRef, useMemo, useEffect, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import vertexShader from "../../shaders/fold/vertex.glsl";
import fragmentShader from "../../shaders/fold/fragment.glsl";

interface WarpPlaneProps {
  texture: THREE.Texture;
  images: RefObject<Map<string, any>>;
  id: string;
}

export function WarpPlane({ texture, images, id }: WarpPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const el = document.querySelector(
    `[data-webgl-id="${id.split("-").at(-1)}"]`,
  ) as HTMLImageElement | HTMLVideoElement;

  const isVideo = el instanceof HTMLVideoElement;

  const getMediaSize = () => {
    if (isVideo) {
      const video = el as HTMLVideoElement;
      return new THREE.Vector2(
        video.videoWidth || 1920,
        video.videoHeight || 1080,
      );
    } else {
      return new THREE.Vector2(
        texture.source.data === null ? 1920 : texture.source.data.width,
        texture.source.data === null ? 1080 : texture.source.data.height,
      );
    }
  };

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uScrollProgress: { value: 0.5 },
      uMaskPosition: { value: 0.5 },
      uContainerSize: {
        value: new THREE.Vector2(
          el.getBoundingClientRect().width,
          el.getBoundingClientRect().height,
        ),
      },
      uImageSize: {
        value: getMediaSize(),
      },
      uClipBounds: { value: new THREE.Vector4(0, 0, 0, 0) },
      uElementBounds: { value: new THREE.Vector4(0, 0, 0, 0) },
      uUseClipping: { value: 0.0 },
      uViewportSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }),
    [texture],
  );

  useEffect(() => {
    if (!meshRef.current || !el) return;

    const material = meshRef.current.material as THREE.ShaderMaterial;

    const updateSize = () => {
      if (isVideo) {
        const video = el as HTMLVideoElement;
        material.uniforms.uImageSize.value = new THREE.Vector2(
          video.videoWidth || 1920,
          video.videoHeight || 1080,
        );
      } else {
        material.uniforms.uImageSize.value =
          texture?.image === null
            ? new THREE.Vector2(1920, 1080)
            : new THREE.Vector2(
                texture.source.data.width,
                texture.source.data.height,
              );
      }
    };

    if (isVideo) {
      const video = el as HTMLVideoElement;
      // Update size once video metadata is loaded
      video.addEventListener('loadedmetadata', updateSize);
      return () => video.removeEventListener('loadedmetadata', updateSize);
    } else {
      updateSize();
    }
  }, [texture.image, isVideo]);

  useEffect(() => {
    const handleResize = () => {
      if (!meshRef.current || !el) return;

      const material = meshRef.current.material as THREE.ShaderMaterial;

      material.uniforms.uContainerSize.value = new THREE.Vector2(
        el.getBoundingClientRect().width,
        el.getBoundingClientRect().height,
      );
      
      material.uniforms.uViewportSize.value = new THREE.Vector2(
        window.innerWidth,
        window.innerHeight,
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const imageData = images.current.get(id);
  if (imageData && meshRef.current) {
    imageData.mesh = meshRef.current;
  }

  useFrame(() => {
    if (!meshRef.current || !el) return;

    const material = meshRef.current.material as THREE.ShaderMaterial;

    const worldPosition = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPosition);

    const rect = el.getBoundingClientRect();

    const viewHeight = window.innerHeight;

    const triggerMargin = 100;
    const totalZone = rect.height + triggerMargin / 2;

    let movement = 0;

    if (rect.top < triggerMargin) {
      const startPoint = triggerMargin;
      const endPoint = triggerMargin - totalZone;

      movement = (rect.top - startPoint) / (endPoint - startPoint);
    } else if (rect.bottom > viewHeight - triggerMargin) {
      const startPoint = viewHeight - triggerMargin;
      const endPoint = viewHeight - triggerMargin + totalZone;

      movement = -(rect.bottom - startPoint) / (endPoint - startPoint);
    }

    material.uniforms.uMaskPosition.value = movement;

    const progress = THREE.MathUtils.clamp((movement + 1) / 2, 0, 1);
    material.uniforms.uScrollProgress.value = progress;
  });

  return (
    <>
      <mesh ref={meshRef}>
        <planeGeometry args={[1, 1, 48, 48]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          side={THREE.DoubleSide}
          transparent={true}
        />
      </mesh>
    </>
  );
}

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import vertexShader from "../../shaders/warp/vertex.glsl";
import fragmentShader from "../../shaders/warp/fragment.glsl";

interface WarpPlaneProps {
  texture: THREE.Texture;
  images: React.MutableRefObject<Map<string, any>>;
  id: string;
}

export function WarpPlane({ texture, images, id }: WarpPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Store mesh ref in the images map so ImageScene can access it
  const imageData = images.current.get(id);
  if (imageData && meshRef.current) {
    imageData.mesh = meshRef.current;
  }

  return (
    <mesh ref={meshRef}>
      {/* Higher segment count for smoother fold effect */}
      <planeGeometry args={[1, 1, 32, 32]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={!texture}
        opacity={texture ? 1 : 0}
      />
      {/*<shaderMaterial
        uniforms={uniforms.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />*/}
    </mesh>
  );
}

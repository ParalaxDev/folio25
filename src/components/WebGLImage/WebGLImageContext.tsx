import {
  createContext,
  useCallback,
  useRef,
  useContext,
  useEffect,
  useId,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ImageScene } from "./ImageScene";
import { EffectComposer } from "@react-three/postprocessing";
import { PerspectiveFoldEffect } from "../PerspectiveFoldEffect";

interface ImageData {
  domRef: React.RefObject<HTMLImageElement>;
  texture: THREE.Texture;
  mesh?: THREE.Mesh;
}

interface WebGLImageContextValue {
  images: React.MutableRefObject<Map<string, ImageData>>;
  register: (
    id: string,
    domRef: React.RefObject<HTMLImageElement>,
    src: string,
  ) => () => void;
}

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
  depth: -0.02,
};

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

const WebGLImageContext = createContext<WebGLImageContextValue | null>(null);

interface WebGLImageProviderProps {
  children: ReactNode;
}

/**
 * Provider that manages the fixed WebGL canvas and all registered images
 */
export function WebGLImageProvider({ children }: WebGLImageProviderProps) {
  const images = useRef(new Map<string, ImageData>());

  const register = useCallback(
    (id: string, domRef: React.RefObject<HTMLImageElement>, src: string) => {
      const texture = new THREE.TextureLoader().load(src);
      images.current.set(id, { domRef, texture });

      // Return cleanup function
      return () => {
        images.current.delete(id);
        texture.dispose();
      };
    },
    [],
  );

  return (
    <WebGLImageContext.Provider value={{ images, register }}>
      {/* Fixed WebGL canvas behind everything */}
      <Canvas
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1], near: 0.1, far: 100 }}
        dpr={[1, 2]}
      >
        <ImageScene images={images} />
        <Effects />
      </Canvas>

      {/* Normal DOM content in front */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </WebGLImageContext.Provider>
  );
}

/**
 * Hook to register a DOM image with the WebGL system
 * Returns a ref to attach to a hidden <img> element
 */
export function useWebGLImage(src: string) {
  const ref = useRef<HTMLImageElement>(null);
  const id = useId();
  const context = useContext(WebGLImageContext);

  if (!context) {
    throw new Error("useWebGLImage must be used within WebGLImageProvider");
  }

  const { register } = context;

  useEffect(() => {
    return register(id, ref, src);
  }, [id, src, register]);

  return ref;
}

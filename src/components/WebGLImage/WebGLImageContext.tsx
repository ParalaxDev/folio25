import {
  createContext,
  useCallback,
  useRef,
  useContext,
  useEffect,
  useId,
  type ReactNode,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ImageScene } from "./ImageScene";
import { EffectComposer } from "@react-three/postprocessing";
import { PerspectiveFoldEffect } from "../PerspectiveFoldEffect";
import { OrbitControls } from "@react-three/drei";

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
  const [, forceUpdate] = useState({});

  const register = useCallback(
    (id: string, domRef: React.RefObject<HTMLImageElement>, src: string) => {
      const texture = new THREE.TextureLoader().load(src);
      images.current.set(id, { domRef, texture });
      forceUpdate({}); // Trigger re-render for ImageScene

      // Return cleanup function
      return () => {
        images.current.delete(id);
        texture.dispose();
        forceUpdate({}); // Trigger re-render on cleanup
      };
    },
    [],
  );

  // Scan for data-webgl-image attributes on mount and watch for changes
  useEffect(() => {
    const scanImages = () => {
      const webglImages = document.querySelectorAll<HTMLImageElement>(
        "img[data-webgl-image]",
      );

      webglImages.forEach((img) => {
        const src = img.src || img.getAttribute("src");
        if (!src) return;

        // Generate a unique ID based on the element
        const id = `data-attr-${img.dataset.webglId || Math.random().toString(36).slice(2)}`;

        // Store the ID on the element for future reference
        if (!img.dataset.webglId) {
          img.dataset.webglId = id.replace("data-attr-", "");
        }

        // Check if already registered
        if (images.current.has(id)) return;

        // Create a ref object from the DOM element
        const domRef = { current: img };
        const texture = new THREE.TextureLoader().load(src);
        images.current.set(id, { domRef, texture });
      });

      forceUpdate({});
    };

    // Initial scan
    scanImages();

    console.log(
      "Initial WebGL images registered:",
      Array.from(images.current.keys()),
    );

    // Watch for new images added to the DOM
    const observer = new MutationObserver(() => {
      scanImages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-webgl-image", "src"],
    });

    return () => {
      observer.disconnect();

      // Clean up data-attribute registered images
      images.current.forEach((data, id) => {
        if (id.startsWith("data-attr-")) {
          data.texture.dispose();
          images.current.delete(id);
        }
      });
    };
  }, []);

  return (
    <WebGLImageContext.Provider value={{ images, register }}>
      {/* Fixed WebGL canvas behind everything */}
      <Canvas
        style={{
          position: "fixed",
          inset: 0,
          // pointerEvents: "none",
          zIndex: 2,
        }}
        camera={{ zoom: 1, position: [0, 0, 10], near: 0.1, far: 200 }}
        orthographic
        dpr={[1, 2]}
      >
        <ImageScene images={images} />
        {/* Effects disabled - using per-mesh shaders instead of post-processing */}
        {/* <Effects /> */}
        {/*<OrbitControls />*/}
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

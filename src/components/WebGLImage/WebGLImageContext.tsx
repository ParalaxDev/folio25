import {
  createContext,
  useCallback,
  useRef,
  useContext,
  useEffect,
  useId,
  type ReactNode,
  useState,
  type RefObject,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ImageScene } from "./ImageScene";
import { useWindowSize } from "../../hooks/useWindowSize";

interface ImageData {
  domRef: React.RefObject<HTMLImageElement | HTMLVideoElement>;
  texture: THREE.Texture;
  mesh?: THREE.Mesh;
  type: 'image' | 'video';
}

interface WebGLImageContextValue {
  images: RefObject<Map<string, ImageData>>;
  register: (
    id: string,
    domRef: RefObject<HTMLImageElement>,
    src: string,
  ) => () => void;
}

const WebGLImageContext = createContext<WebGLImageContextValue | null>(null);

interface WebGLImageProviderProps {
  children: ReactNode;
}

export function WebGLImageProvider({ children }: WebGLImageProviderProps) {
  const images = useRef(new Map<string, ImageData>());
  const [, forceUpdate] = useState({});
  const { width } = useWindowSize();

  const register = useCallback(
    (id: string, domRef: React.RefObject<HTMLImageElement | HTMLVideoElement>, src: string) => {
      const isVideo = domRef.current instanceof HTMLVideoElement;
      const texture = isVideo 
        ? new THREE.VideoTexture(domRef.current as HTMLVideoElement)
        : new THREE.TextureLoader().load(src);
      
      images.current.set(id, { domRef, texture, type: isVideo ? 'video' : 'image' });
      forceUpdate({});

      return () => {
        images.current.delete(id);
        texture.dispose();
        forceUpdate({});
      };
    },
    [],
  );

  useEffect(() => {
    const scanMedia = () => {
      // Scan images
      const webglImages = document.querySelectorAll<HTMLImageElement>(
        "img[data-webgl-image]",
      );

      webglImages.forEach((img) => {
        const src = img.src || img.getAttribute("src");
        if (!src) return;

        const id = `data-attr-img-${img.dataset.webglId || Math.random().toString(36).slice(2)}`;

        if (!img.dataset.webglId) {
          img.dataset.webglId = id.replace("data-attr-img-", "");
        }

        if (images.current.has(id)) return;

        const domRef = { current: img };
        const texture = new THREE.TextureLoader().load(src);
        images.current.set(id, { domRef, texture, type: 'image' });
      });

      // Scan videos
      const webglVideos = document.querySelectorAll<HTMLVideoElement>(
        "video[data-webgl-video]",
      );

      webglVideos.forEach((video) => {
        const src = video.src || video.getAttribute("src");
        if (!src) return;

        const id = `data-attr-video-${video.dataset.webglId || Math.random().toString(36).slice(2)}`;

        if (!video.dataset.webglId) {
          video.dataset.webglId = id.replace("data-attr-video-", "");
        }

        if (images.current.has(id)) return;

        const domRef = { current: video };
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        images.current.set(id, { domRef, texture, type: 'video' });
      });

      forceUpdate({});
    };

    scanMedia();

    console.log(
      "Initial WebGL media registered:",
      Array.from(images.current.keys()),
    );

    const observer = new MutationObserver(() => {
      scanMedia();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-webgl-image", "data-webgl-video", "src"],
    });

    return () => {
      observer.disconnect();

      images.current.forEach((data, id) => {
        if (id.startsWith("data-attr-")) {
          data.texture.dispose();
          images.current.delete(id);
        }
      });
    };
  }, []);

  return (
    <>
      <WebGLImageContext.Provider value={{ images, register }}>
        <Canvas
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
          camera={{ zoom: 1, position: [0, 0, 10], near: 0.1, far: 200 }}
          orthographic
          dpr={[1, 2]}
        >
          {width > 768 ? <ImageScene images={images} /> : null}
        </Canvas>

        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </WebGLImageContext.Provider>
    </>
  );
}

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

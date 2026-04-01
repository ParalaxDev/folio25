import { useWebGLImage } from "./WebGLImageContext";

interface DOMImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Drop-in replacement for <img> that automatically gets WebGL warp effects
 * The DOM image is invisible but maintains layout - the WebGL plane is rendered on top
 */
export function DOMImage({ src, style, ...props }: DOMImageProps) {
  const ref = useWebGLImage(src);

  return (
    <img
      ref={ref}
      src={src}
      aria-hidden="true"
      {...props}
      style={{ ...style, opacity: 0 }}
    />
  );
}

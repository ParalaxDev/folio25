import { WebGLImageProvider, DOMImage } from "./WebGLImage";

export default function ImageTest({}: {}) {
  return (
    <WebGLImageProvider>
      <div className="w-full min-h-screen">
        {/* Spacer for scroll */}

        {/* Vertical stack of full-width images */}
        <section className="grid grid-cols-2 gap-8 px-8 w-full">
          {new Array(8).fill(0).map((_, i) => (
            <DOMImage
              key={i}
              src={`https://picsum.photos/1200/800?random=${i}`}
              className="w-full h-full object-cover"
              alt={`Image ${i + 1}`}
            />
          ))}
        </section>

        {/* Footer spacer */}
        <div className="h-screen" />
      </div>
    </WebGLImageProvider>
  );
}

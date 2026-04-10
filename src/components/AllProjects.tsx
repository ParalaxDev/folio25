import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedDot from "./AnimatedDot";

type ProjectThumbnail = {
  src: string;
  type?: "img" | "vid";
};

type ProjectData = {
  title: string;
  type: string;
  date: string;
  thumbnail?: ProjectThumbnail;
};

type WritingData = {
  title: string;
  type: string;
  date: string;
  thumbnail?: ProjectThumbnail;
};

type AllItem = {
  id: string;
  collection: "projects" | "writings";
  data: ProjectData | WritingData;
};

type Props = {
  items: AllItem[];
};

type Cursor = {
  x: number;
  y: number;
};

export default function AllProjects({ items }: Props) {
  const [activeItem, setActiveItem] = useState<AllItem | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const targetRef = useRef<Cursor>({ x: 0, y: 0 });
  const currentRef = useRef<Cursor>({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      const nextX = current.x + (target.x - current.x) * 0.15;
      const nextY = current.y + (target.y - current.y) * 0.15;

      currentRef.current = { x: nextX, y: nextY };

      if (previewRef.current) {
        previewRef.current.style.transform = `translate(${nextX}px, ${nextY}px) translate(5%, -50%)`;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-GB", {
      month: "numeric",
      year: "2-digit",
    });
  };

  const activeThumbnail = useMemo(() => {
    if (!activeItem) return null;
    const data = activeItem.data;
    return data.thumbnail ?? null;
  }, [activeItem]);

  return (
    <div
      className="relative"
      onMouseEnter={(event) => {
        targetRef.current = { x: event.clientX, y: event.clientY };
      }}
      onMouseMove={(event) => {
        targetRef.current = { x: event.clientX, y: event.clientY };
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveItem(null);
      }}
    >
      <div className="w-full min-h-screen px-8 mb-32">
        <hr className="border-t-[1.5px] border-t-border/25 mb-2" />
        <h3
          className="text-[0px] text-background opacity-0 select-none"
          aria-hidden="true"
        >
          All Projects
        </h3>
        <h4 className="text-secondary font-mono mb-8">All Projects</h4>
        {items.map((item, i) => {
          const href =
            item.collection === "projects"
              ? `project/${item.id}`
              : `writing/${item.id}`;

          const isActive =
            activeItem?.id === item.id &&
            activeItem?.collection === item.collection;

          return (
            <a
              key={`${item.collection}-${item.id}`}
              href={href}
              data-project={item.id}
              data-title={
                item.collection == "writings" ? "Writing" : item.data.title
              }
              data-index={i + 1}
              className="pt-8 pb-2 w-full flex justify-between first-of-type:border-t-[1.5px] border-b-[1.5px] border-border/25 text-secondary animate-in hover:cursor-pointer"
              onMouseEnter={() => {
                setActiveItem(item);
                const hasThumb = !!item.data.thumbnail?.src;
                setIsHovering(hasThumb);
              }}
              onMouseLeave={() => {
                setIsHovering(false);
                setActiveItem(null);
              }}
            >
              <span className="flex items-center">
                <span className="font-mono mr-4">
                  {formatDate(item.data.date)}
                </span>
                <span className="font-sans text-primary text-xl inline-flex items-center">
                  <AnimatedDot active={isActive} />
                  {item.data.title}
                </span>
              </span>
              <span className="capitalize font-mono">{item.data.type}</span>
            </a>
          );
        })}
      </div>

      <div
        ref={previewRef}
        className={`fixed top-0 left-0 z-50 pointer-events-none transition-opacity w-1/3 aspect-video duration-200 ${
          isHovering && activeThumbnail ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        {activeThumbnail ? (
          activeThumbnail.type === "vid" ? (
            <video
              src={activeThumbnail.src}
              className="w-full h-full aspect-video object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={activeThumbnail.src}
              alt=""
              className="w-full h-full aspect-video object-cover"
              draggable={false}
            />
          )
        ) : null}
      </div>
    </div>
  );
}

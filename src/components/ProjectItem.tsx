import { useRef, useState, type RefObject } from "react";
import type { CollectionEntry } from "astro:content";
import { motion } from "motion/react";

export default ({
  project,
  setSelectedProject,
  selectedProject,
  modalRef,
}: {
  project: CollectionEntry<"projects">;
  setSelectedProject: (id: string | null) => void;
  selectedProject: string | null;
  modalRef: RefObject<HTMLDivElement | null>;
}) => {
  const projectItemRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={projectItemRef}
      className="hover:cursor-pointer odd:border-r not-last:border-b border-border group"
      layout
      layoutId={project.id}
      onClick={() => {
        selectedProject == project.id
          ? setSelectedProject(null)
          : setSelectedProject(project.id);

        modalRef.current?.scrollIntoView();
      }}
    >
      <motion.img
        className="bg-border w-full aspect-[1.414/1] border-b border-border object-cover"
        src={project.data.coverImg.src}
        alt={project.data.coverImg.alt}
      />
      <div className="p-4">
        <p className="w-full text-xs flex justify-between font-departure-mono text-text-secondary">
          <span className="lowercase">[{project.data.type}]</span>{" "}
          <span className="uppercase">{project.data.date}</span>
        </p>
        <h3 className="text-2xl w-fit mt-2 relative text-text-primary">
          {project.data.name}
          <span className="absolute left-0 mt-1 bottom-0 w-0 h-[2px] bg-text-primary text-text-primary transition-all duration-300 group-hover:w-full"></span>
        </h3>
      </div>
    </motion.div>
  );
};

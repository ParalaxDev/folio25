import { useRef, useState } from "react";
import type { CollectionEntry } from "astro:content";
import { motion } from "motion/react";

export default ({
  project,
  setSelectedProject,
  selectedProject,
}: {
  project: CollectionEntry<"projects">;
  setSelectedProject: (id: string | null) => void;
  selectedProject: string | null;
}) => {
  const projectItemRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={projectItemRef}
      className="hover:cursor-pointer border-b border-r border-stone-300"
      layout
      layoutId={project.id}
      onClick={() => {
        selectedProject == project.id
          ? setSelectedProject(null)
          : setSelectedProject(project.id);

        projectItemRef.current?.scrollIntoView();
      }}
    >
      <motion.img
        className="bg-stone-300 w-full aspect-[1.414/1]"
        src={project.data.coverImg.src}
        alt={project.data.coverImg.alt}
      />
      <div className="p-4">
        <p className="w-full text-xs flex justify-between font-departure-mono text-slate-500">
          <span className="lowercase">[{project.data.type}]</span>{" "}
          <span className="uppercase">{project.data.date}</span>
        </p>
        <h3 className="text-2xl mt-2">{project.data.name}</h3>
      </div>
    </motion.div>
  );
};

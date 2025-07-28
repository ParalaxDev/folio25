import { useState, useMemo, useRef, useEffect } from "react";
import ProjectItem from "./ProjectItem";
import type { CollectionEntry } from "astro:content";
import { motion } from "motion/react";
import { useSelectedProject } from "../hooks/useSelectedProject";

const formatDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default ({ projects }: { projects: CollectionEntry<"projects">[] }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const projectPreviewRef = useRef<HTMLDivElement | null>(null);

  // Sort projects by date (newest first)
  const sortedProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) => b.data.date.getTime() - a.data.date.getTime(),
    );
  }, [projects]);

  const actualSelectedProject = useSelectedProject(
    sortedProjects,
    selectedProject,
  );

  return (
    <>
      {selectedProject && (
        <motion.div
          key={selectedProject}
          ref={projectPreviewRef}
          layoutId={selectedProject}
          className="w-full h-full flex justify-center items-center"
          onClick={() => {
            // projectPreviewRef.current?.scrollIntoView();
            setSelectedProject(null);
          }}
        >
          <div className="h-full w-full bg-background border-b border-border">
            <motion.img
              className="w-full h-auto object-cover aspect-[1.414/1] border-b border-border"
              src={actualSelectedProject?.data.coverImg.src}
              alt={actualSelectedProject?.data.coverImg.alt}
            />
            <div className="p-4">
              <motion.p className="w-full flex justify-between font-departure-mono text-text-secondary text-sm">
                <span className="lowercase">
                  [{actualSelectedProject?.data.type}]
                </span>{" "}
                <span className="uppercase">
                  {actualSelectedProject?.data.date &&
                    formatDate(actualSelectedProject.data.date)}
                </span>
              </motion.p>
              <h3 className="text-4xl mt-2 text-text-primary">
                {actualSelectedProject?.data.name}
              </h3>
              <div
                className="prose prose-stone dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: actualSelectedProject?.rendered?.html ?? "error",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
      <motion.div layout className="w-full grid grid-cols-1 md:grid-cols-2">
        {sortedProjects.map((project) => {
          if (selectedProject == project.id) return;
          return (
            <ProjectItem
              project={project}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              modalRef={projectPreviewRef}
            />
          );
        })}
      </motion.div>
    </>
  );
};

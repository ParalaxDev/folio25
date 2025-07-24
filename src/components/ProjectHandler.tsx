import { useState, useMemo, useRef } from "react";
import ProjectItem from "./ProjectItem";
import type { CollectionEntry } from "astro:content";
import { motion } from "motion/react";

const getProjectFromId = (
  projects: CollectionEntry<"projects">[],
  id: string,
) => {
  return projects.find((o) => o.id === id);
};

function useSelectedProject(
  projects: CollectionEntry<"projects">[],
  selectedProjectId: string | null,
) {
  const selectedProject = useMemo(() => {
    if (!selectedProjectId || !projects || !Array.isArray(projects)) {
      return null;
    }

    return projects.find((project) => project.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  return selectedProject;
}

export default ({ projects }: { projects: CollectionEntry<"projects">[] }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const projectPreviewRef = useRef<HTMLDivElement | null>(null);

  const actualSelectedProject = useSelectedProject(projects, selectedProject);

  return (
    <>
      {selectedProject && (
        <motion.div
          ref={projectPreviewRef}
          layout
          layoutId={selectedProject}
          className=" z-10 w-full h-full flex justify-center items-center"
          onClick={() => {
            projectPreviewRef.current?.scrollIntoView();
            setSelectedProject(null);
          }}
        >
          <div className="h-full w-full bg-white border-b border-slate-300">
            <motion.img
              className="w-full h-auto"
              src={actualSelectedProject?.data.coverImg.src}
              alt={actualSelectedProject?.data.coverImg.alt}
            />
            <div className="p-4">
              <p className="w-full text-xs flex justify-between font-departure-mono text-slate-500">
                <span className="lowercase">
                  [{actualSelectedProject?.data.type}]
                </span>{" "}
                <span className="uppercase">
                  {actualSelectedProject?.data.date}
                </span>
              </p>
              <h3 className="text-2xl mt-2">
                {actualSelectedProject?.data.name}
              </h3>
              <div
                className="prose prose-stone"
                dangerouslySetInnerHTML={{
                  __html: actualSelectedProject?.rendered?.html ?? "error",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
      <div className="w-full grid grid-cols-2">
        {projects.map((project) => {
          return (
            <ProjectItem
              project={project}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
            />
          );
        })}
      </div>
    </>
  );
};

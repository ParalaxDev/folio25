import { useState, useMemo, useRef } from "react";
import ProjectItem from "./ProjectItem";
import type { CollectionEntry } from "astro:content";
import { motion } from "motion/react";

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
          key={selectedProject}
          ref={projectPreviewRef}
          layoutId={selectedProject}
          className="w-full h-full flex justify-center items-center bg-red-300"
          onClick={() => {
            // projectPreviewRef.current?.scrollIntoView();
            setSelectedProject(null);
          }}
        >
          <div className="h-full w-full bg-white border-b border-slate-300">
            <motion.img
              className="w-full h-auto object-cover aspect-[1.414/1] border-b border-stone-300"
              src={actualSelectedProject?.data.coverImg.src}
              alt={actualSelectedProject?.data.coverImg.alt}
            />
            <div className="p-4">
              <motion.p className="w-full flex justify-between font-departure-mono text-slate-500 text-sm">
                <span className="lowercase">
                  [{actualSelectedProject?.data.type}]
                </span>{" "}
                <span className="uppercase">
                  {actualSelectedProject?.data.date}
                </span>
              </motion.p>
              <h3 className="text-4xl mt-2">
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
      <motion.div layout className="w-full grid grid-cols-1 md:grid-cols-2">
        {projects.map((project) => {
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

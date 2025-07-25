import { useMemo } from "react";
import type { CollectionEntry } from "astro:content";

/**
 * useSelectedProject hook
 * Returns the selected project object from a list of projects and a selected project ID.
 *
 * @param projects - Array of project entries
 * @param selectedProjectId - The ID of the selected project
 * @returns The selected project object or null
 */
export function useSelectedProject(
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

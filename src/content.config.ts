import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob, file } from "astro/loaders";

// 3. Define your collection(s)
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/projects/" }),
  schema: z.object({
    name: z.string(),
    type: z.string(),
    date: z.string(),
    coverImg: z.object({
      src: z.string(),
      alt: z.string(),
    }),
  }),
  /* ... */
});

const writings = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/writings/" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),
    date: z.coerce.date(),
    description: z.string(),
  }),
});

export const collections = { projects, writings };

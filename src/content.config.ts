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

export const collections = { projects };

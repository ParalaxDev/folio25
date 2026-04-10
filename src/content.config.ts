import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob, file } from "astro/loaders";

const projects = defineCollection({
  loader: file("src/data/project.json", { parser: (text) => JSON.parse(text) }),
  schema: z.object({
    title: z.string(),
    outline: z.string(),
    date: z.coerce.date(),
    type: z.string(),
    featured: z.boolean().default(false),
    thumbnail: z
      .object({
        src: z.string(),
        blur: z.string().optional(),
        type: z.enum(["img", "vid"]).default("img"),
      })
      .optional(),
    slideshows: z
      .object({
        title: z.string(),
        ratio: z.string().optional(),
        images: z
          .object({
            type: z.enum(["img", "vid"]).default("img"),
            fit: z.boolean().optional(),
            src: z.string(),
            alt: z.string(),
          })
          .array(),
      })
      .array(),
    table: z
      .object({
        key: z.string(),
        value: z.string(),
        isLink: z.boolean().optional(),
        isList: z.boolean().optional(),
      })
      .array(),
  }),
});

const writings = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/writings/" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    thumbnail: z.object({
      src: z.string(),
      blur: z.string().optional(),
      type: z.enum(["img", "vid"]).default("img"),
    }),
  }),
});

export const collections = { projects, writings };

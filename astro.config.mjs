// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import glsl from "vite-plugin-glsl";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://willb.cc",
  integrations: [react(), mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss(), glsl()],
  },
});

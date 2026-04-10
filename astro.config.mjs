// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import glsl from "vite-plugin-glsl";

import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],

  vite: {
    plugins: [tailwindcss(), glsl()],
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
  }),

  output: "server",
});

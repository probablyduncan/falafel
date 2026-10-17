import { defineConfig } from "astro/config";
import generateStandardSiteWellKnownFile from "./src/lib/generateStandardSiteWellKnownFile";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";
import { footnotes } from "./src/lib/footnotes";
import { sectionMarkers } from "./src/lib/sectionMarkers";

export default defineConfig({
    site: "https://falafel.fyi",
    markdown: { processor: satteri({ mdastPlugins: [footnotes, sectionMarkers] }) },
    integrations: [generateStandardSiteWellKnownFile(), mdx()]
});
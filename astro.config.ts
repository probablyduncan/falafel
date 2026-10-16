import { defineConfig } from "astro/config";
import generateStandardSiteWellKnownFile from "./src/lib/generateStandardSiteWellKnownFile";

import mdx from "@astrojs/mdx";

export default defineConfig({
    site: "https://falafel.fyi",
    integrations: [generateStandardSiteWellKnownFile(), mdx()]
});
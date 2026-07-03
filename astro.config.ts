
import { defineConfig } from "astro/config";
import generateStandardSiteWellKnownFile from "./src/lib/generateStandardSiteWellKnownFile";

export default defineConfig({
    site: "https://falafel.fyi",
    integrations: [
        generateStandardSiteWellKnownFile(),
    ]
});
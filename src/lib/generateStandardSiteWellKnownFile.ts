import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";
import { getPublicationUri } from "./atprotoHelpers";

/**
 * Generates a `site.standard.publication` file in the `.well-known` directory of the build output.
 * See https://standard.site/docs/quick-start/#3-verify-the-publication.
 */
export default function generateStandardSiteWellKnownFile(): AstroIntegration {
    return {
        name: "generate-standard-site-well-known-file",
        hooks: {
            "astro:build:done": async ({ dir, logger }) => {

                const filepath = new URL(".well-known/site.standard.publication", dir).pathname;

                if (!fs.existsSync(path.dirname(filepath))) {
                    fs.mkdirSync(path.dirname(filepath), { recursive: true });
                }

                fs.writeFileSync(filepath, getPublicationUri(), "utf-8");

                logger.info(`generated standard.site /.well-known/ endpoint`);
            },
        },
    };
}
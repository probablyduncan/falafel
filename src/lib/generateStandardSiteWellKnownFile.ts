import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";

/**
 * Generates a `site.standard.publication` file in the `.well-known` directory of the build output.
 * See https://standard.site/docs/quick-start/#3-verify-the-publication.
 */
export default function generateStandardSiteWellKnownFile(): AstroIntegration {
    return {
        name: "generate-standard-site-well-known-file",
        hooks: {
            "astro:build:done": async ({ dir, logger }) => {

                const namespace = "site.standard.publication";
                const location = new URL(".well-known/" + namespace, dir);
                const contents = `at://${process.env.ATPROTO_DID}/${namespace}/${process.env.ATPROTO_PUBLICATION_RKEY}`;

                if (!fs.existsSync(path.dirname(location.pathname))) {
                    fs.mkdirSync(path.dirname(location.pathname), { recursive: true });
                }

                fs.writeFileSync(location.pathname, contents, "utf-8");

                logger.info(`generated standard.site /.well-known/ endpoint`);
            },
        },
    };
}
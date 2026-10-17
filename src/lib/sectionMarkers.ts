import type { satteri } from "@astrojs/markdown-satteri";

type MdastPlugin = NonNullable<
    NonNullable<Parameters<typeof satteri>[0]>["mdastPlugins"]
>[number] &
    object;

/**
 * Headings stay in the document for SEO and screen readers (about.astro hides
 * them visually). Each section's first paragraph instead gets a
 * <span class="section-marker" title="Heading text"> at its start; the
 * "[n]" itself is a CSS counter, so numbering needs no state here.
 */
export const sectionMarkers: MdastPlugin = () => {
    let pendingTitle: string | undefined;

    return {
        name: "section-markers",

        heading(node, ctx) {
            if (node.depth === 2) pendingTitle = ctx.textContent(node);
        },

        paragraph(node, ctx) {
            if (pendingTitle === undefined) return;
            // const title = pendingTitle;
            pendingTitle = undefined;
            ctx.prependChild(node, {
                type: "mdxJsxTextElement",
                name: "span",
                attributes: [
                    { type: "mdxJsxAttribute", name: "class", value: "section-marker" },
                    // { type: "mdxJsxAttribute", name: "title", value: title },
                    // the real <h2> already names the section for assistive tech
                    { type: "mdxJsxAttribute", name: "aria-hidden", value: "true" },
                ],
                children: [],
            });
        },
    };
};

import type { satteri } from "@astrojs/markdown-satteri";

type MdastPlugin = NonNullable<
    NonNullable<Parameters<typeof satteri>[0]>["mdastPlugins"]
>[number] &
    object;

/**
 * Turns inline `[^KEY]` / `[^KEY]: text` footnotes into an unnumbered <sup>
 * and an <aside class="footnote"> that stays where the definition is written.
 * Numbers come from CSS counters (see about.astro), so they stay consecutive
 * across however many mdx files are rendered into the same article. That only
 * works if each note sits after the text citing it, in citation order, so
 * this throws when a reference and its definition don't line up.
 */
export const footnotes: MdastPlugin = () => {
    const referenced: string[] = [];
    const defined: string[] = [];
    // The parser leaves a reference with no definition as plain text.
    const undefinedRefs: string[] = [];

    return {
        name: "footnotes",

        footnoteReference(node, ctx) {
            referenced.push(node.identifier);
            ctx.replaceNode(node, {
                type: "mdxJsxTextElement",
                name: "sup",
                attributes: [
                    {
                        type: "mdxJsxAttribute",
                        name: "class",
                        value: "footnote-ref",
                    },
                ],
                children: [],
            });
        },

        text(node) {
            for (const m of node.value.matchAll(/\[\^([^\]\s]+)\]/g)) {
                undefinedRefs.push(m[1].toLowerCase());
            }
        },

        footnoteDefinition(node, ctx) {
            defined.push(node.identifier);
            ctx.replaceNode(node, {
                type: "mdxJsxFlowElement",
                name: "aside",
                attributes: [
                    {
                        type: "mdxJsxAttribute",
                        name: "class",
                        value: "footnote",
                    },
                ],
                children: node.children,
            });
        },

        after() {
            const missing = [
                ...referenced.filter((k) => !defined.includes(k)),
                ...undefinedRefs,
            ];
            const unused = defined.filter((k) => !referenced.includes(k));
            if (!missing.length && !unused.length) return;
            const list = (keys: string[]) =>
                [...new Set(keys)].map((k) => `[^${k}]`).join(", ");
            throw new Error(
                [
                    missing.length &&
                        `Footnotes cited but never defined: ${list(missing)}`,
                    unused.length &&
                        `Footnotes defined but never cited: ${list(unused)}`,
                ]
                    .filter(Boolean)
                    .join("\n"),
            );
        },
    };
};

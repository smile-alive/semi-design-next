import type { Component, Snippet } from 'svelte';
import type { HTMLAttributes, SvelteHTMLElements } from 'svelte/elements';
import type { MarkdownRenderBaseProps } from '@fibrae/semi-foundation/markdown-render/foundation';
import type { MarkdownNode } from './runtime.js';

// The index signature admits tag names too: without it an intrinsic key could not keep its own tag name, nor could a
// spread of this type be assigned back to it.
export type MarkdownRenderComponents = Partial<{ [K in keyof SvelteHTMLElements]: Component<any> | K }> & Record<string, Component<any> | keyof SvelteHTMLElements | undefined>;

/** Props a component in `components` receives besides the attributes of its element */
export interface MarkdownRenderElementProps {
    /** The content, rendered */
    children?: Snippet;
    /**
     * The compiled element. `node.props.children` is the source tree of the content: `codeText(node.props.children)` is
     * the text of a code element, which the `children` snippet cannot give. Destructure it out before spreading the
     * rest of the props onto a DOM element.
     */
    node?: MarkdownNode;
}

export interface MarkdownRenderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    raw: string;
    /** Merged over `MarkdownRender.defaultComponents`; a change only renders again, it does not compile again */
    components?: MarkdownRenderComponents;
    format?: 'md' | 'mdx';
    remarkPlugins?: MarkdownRenderBaseProps['remarkPlugins'];
    rehypePlugins?: MarkdownRenderBaseProps['rehypePlugins'];
    remarkGfm?: boolean;
}

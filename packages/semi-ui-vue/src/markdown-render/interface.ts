import type { Component, IntrinsicElementAttributes } from 'vue';
import type { MarkdownRenderBaseProps } from '@fibrae/semi-foundation/markdown-render/foundation';

// The index signature admits tag names too: without it an intrinsic key could not keep its own tag name, nor could a
// spread of this type be assigned back to it.
export type MarkdownRenderComponents = Partial<{ [K in keyof IntrinsicElementAttributes]: Component | K }> & Record<string, Component | keyof IntrinsicElementAttributes | undefined>;

export interface MarkdownRenderProps {
    raw: string;
    /** Merged over `MarkdownRender.defaultComponents`; a change only renders again, it does not compile again */
    components?: MarkdownRenderComponents;
    format?: 'md' | 'mdx';
    remarkPlugins?: MarkdownRenderBaseProps['remarkPlugins'];
    rehypePlugins?: MarkdownRenderBaseProps['rehypePlugins'];
    remarkGfm?: boolean;
}

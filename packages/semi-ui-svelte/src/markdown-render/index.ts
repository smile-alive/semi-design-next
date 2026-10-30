import * as defaultComponents from './components/index.js';
import MarkdownRenderBase from './markdown-render.svelte';

export const MarkdownRender = Object.assign(MarkdownRenderBase, { defaultComponents });
export { default as codeText } from './code-text.js';
export type { MarkdownRenderComponents, MarkdownRenderElementProps, MarkdownRenderProps } from './interface.js';
export type { MarkdownChild as MarkdownRenderChild, MarkdownNode as MarkdownRenderNode } from './runtime.js';

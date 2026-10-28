import * as defaultComponents from './components';
import MarkdownRender from './markdown-render.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const MarkdownRenderWithComponents: typeof MarkdownRender & { defaultComponents: typeof defaultComponents } = Object.assign(MarkdownRender, { defaultComponents });
export default MarkdownRenderWithComponents;
export { default as codeText } from './code-text';
export type * from './interface';

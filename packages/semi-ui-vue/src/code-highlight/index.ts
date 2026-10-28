import { register } from '@fibrae/semi-foundation/code-highlight/registry';
import CodeHighlight from './code-highlight.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const CodeHighlightWithRegister: typeof CodeHighlight & { register: typeof register } = Object.assign(CodeHighlight, {
    register,
});
export default CodeHighlightWithRegister;
export type * from './interface';

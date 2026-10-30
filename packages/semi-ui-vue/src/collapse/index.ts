import Collapse from './collapse.vue';
import CollapsePanel from './panel.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const CollapseWithPanel: typeof Collapse & { Panel: typeof CollapsePanel } = Object.assign(Collapse, {
    Panel: CollapsePanel,
});
export default CollapseWithPanel;
export { default as CollapsePanel } from './panel.vue';
export type * from './interface';

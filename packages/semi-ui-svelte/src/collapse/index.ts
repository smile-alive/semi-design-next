import CollapseBase from './collapse.svelte';
import CollapsePanelPart from './panel.svelte';

// Svelte components are functions, so the part attaches to the component itself
export const Collapse: typeof CollapseBase & { Panel: typeof CollapsePanelPart } = Object.assign(CollapseBase, { Panel: CollapsePanelPart });
export { default as CollapsePanel } from './panel.svelte';
export type { CollapsePanelProps, CollapseProps } from './interface.js';

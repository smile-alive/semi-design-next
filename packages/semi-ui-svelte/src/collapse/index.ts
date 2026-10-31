import CollapseBase from './collapse.svelte';
import CollapsePanelPart from './panel.svelte';

export const Collapse: typeof CollapseBase & { Panel: typeof CollapsePanelPart } = Object.assign(CollapseBase, { Panel: CollapsePanelPart });
export { default as CollapsePanel } from './panel.svelte';
export type { CollapsePanelProps, CollapseProps } from './interface.js';

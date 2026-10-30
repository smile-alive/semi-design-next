import CheckboxGroupPart from './checkbox-group.svelte';
import CheckboxBase from './checkbox.svelte';

// Svelte components are functions, so the part attaches to the component itself
export const Checkbox: typeof CheckboxBase & { Group: typeof CheckboxGroupPart } = Object.assign(CheckboxBase, { Group: CheckboxGroupPart });
export { default as CheckboxGroup } from './checkbox-group.svelte';
export type { CheckboxDirection, CheckboxEvent, CheckboxEventTarget, CheckboxGroupOptionSnippetProps, CheckboxGroupProps, CheckboxOptionItem, CheckboxProps, CheckboxType, CheckboxValue } from './interface.js';

import RadioGroupPart from './radio-group.svelte';
import RadioBase from './radio.svelte';

// Svelte components are functions, so the part attaches to the component itself
export const Radio: typeof RadioBase & { Group: typeof RadioGroupPart } = Object.assign(RadioBase, { Group: RadioGroupPart });
export { default as RadioGroup } from './radio-group.svelte';
export type { RadioChangeEvent, RadioChangeEventTarget, RadioDirection, RadioDisplayMode, RadioGroupButtonSize, RadioGroupOptionSnippetParams, RadioGroupProps, RadioMode, RadioOptionItem, RadioProps, RadioType, RadioValue } from './interface.js';

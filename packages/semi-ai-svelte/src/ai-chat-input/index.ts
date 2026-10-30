import { getCustomSlotAttribute } from '@fibrae/semi-ai-foundation/ai-chat-input/utils';
import AIChatInputBase from './ai-chat-input.svelte';
import Configure from './configure/index.js';

// Svelte components are functions, so the parts attach to the component itself
export const AIChatInput: typeof AIChatInputBase & {
    Configure: typeof Configure;
    getCustomSlotAttribute: typeof getCustomSlotAttribute;
} = Object.assign(AIChatInputBase, { Configure, getCustomSlotAttribute });

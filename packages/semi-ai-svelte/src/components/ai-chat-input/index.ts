import { getCustomSlotAttribute } from '@fibrae/semi-ai-foundation/components/ai-chat-input/utils';
import AIChatInputBase from './ai-chat-input.svelte';
import Configure from './configure/index.js';

export const AIChatInput: typeof AIChatInputBase & {
    Configure: typeof Configure;
    getCustomSlotAttribute: typeof getCustomSlotAttribute;
} = Object.assign(AIChatInputBase, { Configure, getCustomSlotAttribute });

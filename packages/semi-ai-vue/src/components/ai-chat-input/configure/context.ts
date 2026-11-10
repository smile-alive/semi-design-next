import type { ComputedRef } from 'vue';
import type { Setup } from '@fibrae/semi-ai-foundation/components/ai-chat-input/interface';
import { createContext } from '@fibrae/semi-ui-vue/base/create-context';

export interface ConfigureContext {
    view: ComputedRef<Setup>;
    /** `init` registers an item's initial value without reporting a change */
    onChange: (changed: Setup, init?: boolean) => void;
    onRemove: (field: string) => void;
}

export const [provideConfigureContext, useConfigureContext] = createContext<ConfigureContext>('AIChatInputConfigure', { optional: true });

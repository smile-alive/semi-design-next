import type { ComputedRef } from 'vue';
import type { LeftMenuChangeProps } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import { createContext } from '@fibrae/semi-ui-vue/_base/create-context';

export interface ConfigureContext {
    view: ComputedRef<LeftMenuChangeProps>;
    /** `init` registers an item's initial value without reporting a change */
    onChange: (changed: LeftMenuChangeProps, init?: boolean) => void;
    onRemove: (field: string) => void;
}

export const [provideConfigureContext, useConfigureContext] = createContext<ConfigureContext>('AIChatInputConfigure', { optional: true });

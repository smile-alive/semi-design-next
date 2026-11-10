import type { Setup } from '@fibrae/semi-ai-foundation/components/ai-chat-input/interface';
import { createContext } from '@fibrae/semi-ui-svelte/base';

/** `view` is read through a getter, so the items follow the input's values */
export interface ConfigureContextValue {
    readonly view: Setup;
    /** `init` registers an item's initial value without reporting a change */
    onChange: (changed: Setup, init?: boolean) => void;
    onRemove: (field: string) => void;
}

export const [getConfigureContext, setConfigureContext] = createContext<ConfigureContextValue>('AIChatInputConfigure', { optional: true });

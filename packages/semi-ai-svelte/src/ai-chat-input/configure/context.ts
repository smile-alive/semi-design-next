import type { LeftMenuChangeProps } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import { createContext } from '@fibrae/semi-ui-svelte/_base/create-context';

/** `view` is read through a getter, so the items follow the input's values */
export interface ConfigureContextValue {
    readonly view: LeftMenuChangeProps;
    /** `init` registers an item's initial value without reporting a change */
    onChange: (changed: LeftMenuChangeProps, init?: boolean) => void;
    onRemove: (field: string) => void;
}

export const [getConfigureContext, setConfigureContext] = createContext<ConfigureContextValue>('AIChatInputConfigure', { optional: true });

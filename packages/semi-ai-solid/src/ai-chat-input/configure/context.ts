import type { Accessor } from 'solid-js';
import { createContext } from '@fibrae/semi-ui-solid/_base/create-context';

export interface ConfigureContextType {
    value: Accessor<Record<string, any>>;
    onChange: (changed: Record<string, any>, init?: boolean) => void;
    onRemove: (field: string) => void;
}

export const [ConfigureContext, useConfigureContext] = createContext<ConfigureContextType>('Configure');

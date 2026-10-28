import { createContext } from '@fibrae/semi-ui-react/_base/create-context';

export interface ConfigureContextType {
    value: any;
    onChange: (value: any, init?: boolean) => void;
    onRemove: (field: string) => void;
}

export const [ConfigureContext, useConfigureContext] = createContext<ConfigureContextType>('Configure');

import { noop } from '@fibrae/semi-foundation/utils';
import { createContext } from '../../base/index';

export interface ContextType {
    siderHook: {
        addSider: (id: string) => void;
        removeSider: (id: string) => void;
    };
}

export const [LayoutContext, useLayoutContext] = createContext<ContextType>('Layout', {
    defaultValue: {
        siderHook: {
            addSider: noop,
            removeSider: noop,
        },
    },
});

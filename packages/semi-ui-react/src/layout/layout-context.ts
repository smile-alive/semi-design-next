import { noop } from '@fibrae/semi-foundation/utils/function';
import { createContext } from '../_base/create-context';

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

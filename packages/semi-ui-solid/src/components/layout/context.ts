import { createContext } from '../../base/index';

export interface LayoutContextValue {
    addSider: () => void;
    removeSider: () => void;
}

export const [LayoutContext, useLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });

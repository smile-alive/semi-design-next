import { createContext } from '../_base/create-context';

export interface LayoutContextValue {
    addSider: () => void;
    removeSider: () => void;
}

export const [LayoutContext, useLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });

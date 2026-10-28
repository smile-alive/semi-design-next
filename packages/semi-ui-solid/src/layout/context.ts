import { createContext } from '../_base/create-context';

/** Siders register themselves so a Sider nested below a wrapper still marks its Layout */
export interface LayoutContextValue {
    addSider: () => void;
    removeSider: () => void;
}

export const [LayoutContext, useLayoutContext] = createContext<LayoutContextValue>('Layout', { optional: true });

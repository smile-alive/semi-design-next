import type React from 'react';
import { createContext } from '../_base/create-context';

export interface CollapseContextType {
    activeSet: Set<string>;
    expandIcon: React.ReactNode;
    collapseIcon: React.ReactNode;
    clickHeaderToExpand: boolean;
    // undefined defers to the global Collapsible default
    keepDOM?: boolean;
    expandIconPosition: 'left' | 'right';
    onClick: (activeKey: string, e: React.MouseEvent) => void;
    motion: boolean;
    lazyRender: boolean;
}

export const [CollapseContext, useCollapseContext] = createContext<CollapseContextType>('Collapse');

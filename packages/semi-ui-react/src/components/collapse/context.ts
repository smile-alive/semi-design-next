import type React from 'react';
import type { CollapsePart } from '@fibrae/semi-foundation/components/collapse/constants';
import { createContext } from '../../base/index';

export interface CollapseContextType {
    classNames?: Partial<Record<CollapsePart, string>>;
    styles?: Partial<Record<CollapsePart, React.CSSProperties>>;
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

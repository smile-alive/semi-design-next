import type { Accessor } from 'solid-js';
import { createContext } from '../../base/create-context';
import type { AnchorClickEvent, AnchorProps } from './interface';

export interface AnchorView {
    activeLink: string;
    autoCollapse: boolean;
    childMap: Record<string, Set<string>>;
    position: AnchorProps['position'];
    showTooltip: NonNullable<AnchorProps['showTooltip']>;
    size: NonNullable<AnchorProps['size']>;
}

export interface AnchorContextValue {
    view: Accessor<AnchorView>;
    onClick: (event: AnchorClickEvent, link: string) => void;
    addLink: (link: string) => void;
    removeLink: (link: string) => void;
}

export const [AnchorContext, useAnchorContext] = createContext<AnchorContextValue>('Anchor');

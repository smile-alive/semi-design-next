import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { AnchorClickEvent, AnchorProps } from './interface';

export interface AnchorContextView {
    activeLink: string;
    autoCollapse: boolean;
    position: AnchorProps['position'];
    showTooltip: NonNullable<AnchorProps['showTooltip']>;
    size: NonNullable<AnchorProps['size']>;
}

export interface AnchorContext {
    view: ComputedRef<AnchorContextView>;
    /** Nesting depth of the links rendered inside: 1 under Anchor, one more under each Link */
    level: number;
    onClick: (event: AnchorClickEvent, link: string) => void;
    addLink: (link: string) => void;
    removeLink: (link: string) => void;
}

export const [provideAnchorContext, useAnchorContext] = createContext<AnchorContext>('Anchor');

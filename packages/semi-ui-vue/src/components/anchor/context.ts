import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { AnchorClickEvent, AnchorProps } from './interface';

export interface AnchorContextView {
    activeLink: string;
    autoCollapse: boolean;
    /** The links registered below each mounted link, whatever components render them */
    childMap: Record<string, Set<string>>;
    position: AnchorProps['position'];
    showTooltip: NonNullable<AnchorProps['showTooltip']>;
    size: NonNullable<AnchorProps['size']>;
}

export interface AnchorContext {
    view: ComputedRef<AnchorContextView>;
    /** Nesting depth of the links rendered inside: 1 under Anchor, one more under each Link */
    level: number;
    /** Href of the Link the links rendered inside are nested in, read when they mount */
    parentHref: () => string | undefined;
    onClick: (event: AnchorClickEvent, link: string) => void;
    addLink: (link: string, parent?: string) => void;
    removeLink: (link: string) => void;
}

export const [provideAnchorContext, useAnchorContext] = createContext<AnchorContext>('Anchor');

import type { Snippet } from 'svelte';
import { createContext } from '../_base/create-context.js';
import type { AnchorClickEvent, AnchorProps, AnchorTitleContext } from './interface.js';

export interface AnchorContext {
    readonly activeLink: string;
    readonly autoCollapse: boolean;
    /** Hrefs nested below each href, read for the collapse decision */
    readonly childMap: Record<string, Set<string>>;
    readonly position: AnchorProps['position'];
    readonly showTooltip: NonNullable<AnchorProps['showTooltip']>;
    readonly size: NonNullable<AnchorProps['size']>;
    readonly title?: Snippet<[AnchorTitleContext]>;
    onClick: (event: AnchorClickEvent, link: string) => void;
}

export const [getAnchorContext, setAnchorContext] = createContext<AnchorContext>('Anchor');

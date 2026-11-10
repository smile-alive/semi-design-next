import type { AnchorProps, AnchorState } from '.';
import { createContext } from '../../base/create-context';

export type AnchorContextType = Pick<AnchorProps, 'showTooltip' | 'position' | 'autoCollapse' | 'size'> &
    Pick<AnchorState, 'activeLink'> & {
        /** The links registered below each mounted link, whatever components render them */
        childMap: Record<string, Set<string>>;
        /** Nesting depth of the links rendered inside: 1 under Anchor, one more under each Link */
        level: number;
        /** Href of the Link the links rendered inside are nested in */
        parentHref?: string;
        onClick: NonNullable<AnchorProps['onClick']>;
        addLink: (link: string, parent?: string) => void;
        removeLink: (link: string) => void;
    };

export const [AnchorContext, useAnchorContext] = createContext<AnchorContextType>('Anchor');

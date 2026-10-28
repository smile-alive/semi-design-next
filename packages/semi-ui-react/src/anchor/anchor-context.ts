import type { AnchorProps, AnchorState } from '.';
import { createContext } from '../_base/create-context';

export type AnchorContextType = Pick<AnchorProps, 'showTooltip' | 'position' | 'autoCollapse' | 'size'> &
    Pick<AnchorState, 'activeLink'> & {
        childMap: Record<string, Set<string>>;
        /** Nesting depth of the links rendered inside: 1 under Anchor, one more under each Link */
        level: number;
        onClick: NonNullable<AnchorProps['onClick']>;
        addLink: (link: string) => void;
        removeLink: (link: string) => void;
    };

export const [AnchorContext, useAnchorContext] = createContext<AnchorContextType>('Anchor');

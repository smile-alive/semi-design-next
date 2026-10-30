import { createContext } from '../_base/create-context.js';
import type { AvatarShape } from './interface.js';

export interface AvatarGroupMoreValue {
    /** The popup layer the `more` content renders in */
    readonly layer?: symbol;
    readonly size?: string;
    readonly shape?: AvatarShape;
    readonly itemClass?: string;
}

/** Set around the group's `more` content so the avatar in it becomes a list item styled like the group */
export const [getAvatarGroupMoreContext, setAvatarGroupMoreContext] = createContext<AvatarGroupMoreValue | undefined>('AvatarGroupMore', { optional: true });

import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { AvatarShape } from './interface';

export interface AvatarGroupMoreItem {
    size?: string;
    shape?: AvatarShape;
    itemClass?: string;
    /** Popup layer of the group; avatars in a popup opened from inside the `more` slot are not list items. */
    layer?: symbol;
}

export interface AvatarGroupItem {
    size: string;
    shape: AvatarShape;
    /** Popup layer of the group; avatars inside a popup opened from the group do not inherit. */
    layer?: symbol;
}

/** Reaches avatars that Tooltip or Popover wrap, which the group's direct-child prop binding cannot touch. */
export const [provideAvatarGroupContext, useAvatarGroupContext] = createContext<ComputedRef<AvatarGroupItem> | undefined>('AvatarGroup', { optional: true });

/** Set around AvatarGroup's `more` slot so the avatar in it becomes a list item styled like the group. */
export const [provideAvatarGroupMoreContext, useAvatarGroupMoreContext] = createContext<ComputedRef<AvatarGroupMoreItem> | undefined>('AvatarGroupMore', { optional: true });

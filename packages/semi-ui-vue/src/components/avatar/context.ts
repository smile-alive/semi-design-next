import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
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

export const [provideAvatarGroupContext, useAvatarGroupContext] = createContext<ComputedRef<AvatarGroupItem> | undefined>('AvatarGroup', { optional: true });

export const [provideAvatarGroupMoreContext, useAvatarGroupMoreContext] = createContext<ComputedRef<AvatarGroupMoreItem> | undefined>('AvatarGroupMore', { optional: true });

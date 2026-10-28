import { createContext } from '../_base/create-context';
import type { AvatarProps } from './interface';

export type AvatarContextType = {
    // Holds even when a wrapper returned by renderMore sits between the group and the avatar
    inGroup?: boolean;
    // Popup layer of the group; avatars in a popup opened from inside the group are not list items
    layer?: symbol;
    // The group's size and shape override the avatar's own and the overlap class is added, also through a Tooltip or
    // Popover around it
    item?: Pick<AvatarProps, 'size' | 'shape' | 'className'>;
    // cloneElement on renderMore's result would reach a wrapper or Fragment, not the avatar, so it reads these here
    // (its own props win)
    moreItem?: Pick<AvatarProps, 'size' | 'shape' | 'className'>;
};
export const [AvatarGroupContext, useAvatarGroupContext] = createContext<AvatarContextType>('AvatarGroup', { defaultValue: {} });

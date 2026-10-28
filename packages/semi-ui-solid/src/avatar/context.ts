import type { Accessor, JSX } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { AvatarProps, AvatarShape } from './interface';

/** What a group tells the avatars it creates */
export interface AvatarGroupItem {
    size: Accessor<string>;
    shape: Accessor<AvatarShape>;
    overlapClass: (index: number) => string;
    /**
     * The nodes shown in the list, set after the children resolved: avatars are created while they resolve, so an
     * avatar finds its position by locating its own element in this list. Undefined until then. An avatar in no node
     * of the list is hidden by `maxCount` and shown elsewhere, so it is not a list item.
     */
    order: Accessor<readonly unknown[] | undefined>;
    /**
     * Registers an avatar by the node it returns (its token while hidden) until its owner is disposed, and returns
     * whether `maxCount` hides it. As in React, `maxCount` counts the group's children: an avatar ranks by the position
     * of its node among them, located by identity once they have resolved. On the first frame, and on the server,
     * avatars rank in creation order instead. An avatar not among the children (inside a wrapper, or created since they
     * last resolved) is shown, and its wrapper counts as one child that is hidden whole past `maxCount`.
     * shortcut: creation order differs from the position when other nodes sit among the avatars or avatars sit inside a
     * wrapper, so on the first frame a wrapped avatar may be hidden: its wrapper gets the token, which renders nothing
     * (or "[object Object]" inside an array) until the group mounts; upgrade when such children must render on the
     * server, by having wrappers register with the group too.
     */
    register: (node: Accessor<unknown>) => Accessor<boolean>;
}

/** What a hidden avatar hands the group in place of its nodes, under the `hiddenAvatar` token type */
export interface AvatarGroupHiddenItem {
    // From `alt` only: reading the children would create them
    name: Accessor<string>;
    render: (props?: AvatarProps) => JSX.Element;
}

export const hiddenAvatar = 'AvatarGroup.Hidden';

/** Applies to the avatar that `renderMore` returns, whatever wrapper surrounds it; its own props win */
export interface AvatarGroupMoreItem {
    size: string;
    shape: AvatarShape;
    class: string;
}

export interface AvatarContextType {
    // Holds even when a wrapper returned by renderMore sits between the group and the avatar
    inGroup?: boolean;
    // Popup layer of the group; avatars in a popup opened from inside the group are not list items
    layer?: symbol;
    item?: AvatarGroupItem;
    moreItem?: Accessor<AvatarGroupMoreItem>;
}

export const [AvatarGroupContext, useAvatarGroupContext] = createContext<AvatarContextType>('AvatarGroup', { defaultValue: {} });

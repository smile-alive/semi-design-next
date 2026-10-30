import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/tag/constants';
import type { AvatarShape } from '../avatar/interface.js';
import type { PopoverProps } from '../popover/index.js';

export type TagColor = (typeof strings.TAG_COLOR)[number];
export type TagType = (typeof strings.TAG_TYPE)[number];
export type TagSize = (typeof strings.TAG_SIZE)[number];
export type TagShape = 'circle' | 'square';
export type TagCloseEvent = MouseEvent | KeyboardEvent;

export interface TagProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
    tagKey?: string | number;
    size?: TagSize;
    color?: TagColor;
    type?: TagType;
    closable?: boolean;
    /** Bindable; `undefined` means the tag closes itself and shows until then */
    visible?: boolean;
    avatarSrc?: string;
    colorful?: boolean;
    gradient?: boolean;
    avatarShape?: AvatarShape;
    shape?: TagShape;
    /** Runs before the tag hides; `event.preventDefault()` keeps it open */
    onClose?: (event: TagCloseEvent, tagKey?: string | number) => void;
    children?: Snippet;
    prefixIcon?: Snippet;
    suffixIcon?: Snippet;
}

export interface TagGroupItem extends Omit<TagProps, 'children' | 'prefixIcon' | 'suffixIcon'> {
    children?: string | number;
}

export interface TagGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    tagList: TagGroupItem[];
    maxTagCount?: number;
    restCount?: number;
    size?: TagSize;
    showPopover?: boolean;
    /** Spread onto the `+N` Popover; the rest tags and the trigger stay the group's own */
    popoverProps?: PopoverProps;
    avatarShape?: AvatarShape;
    onTagClose?: (event: TagCloseEvent, tagKey?: string | number) => void;
    onPlusNMouseEnter?: (event: MouseEvent) => void;
    /** Replaces the default tag; `index` counts across the visible tags and the `+N` popover */
    tag?: Snippet<[scope: { tag: TagGroupItem; index: number }]>;
}

export interface SplitTagGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children?: Snippet;
}

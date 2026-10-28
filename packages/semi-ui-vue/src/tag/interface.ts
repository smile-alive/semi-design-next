import type { VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/tag/constants';
import type { PopoverProps } from '../popover/interface';

export type TagColor = (typeof strings.TAG_COLOR)[number];
export type TagType = (typeof strings.TAG_TYPE)[number];
export type TagSize = (typeof strings.TAG_SIZE)[number];
export type AvatarShape = 'circle' | 'square';
export type TagShape = 'circle' | 'square';
export type TagCloseEvent = MouseEvent | KeyboardEvent;

export interface TagProps {
    tabindex?: number;
    tagKey?: string | number;
    size?: TagSize;
    color?: TagColor;
    type?: TagType;
    closable?: boolean;
    visible?: boolean;
    avatarSrc?: string;
    colorful?: boolean;
    gradient?: boolean;
    avatarShape?: AvatarShape;
    shape?: TagShape;
}
export interface TagSlots {
    default?: () => VNode[];
    prefixIcon?: () => VNode[];
    suffixIcon?: () => VNode[];
}
export interface TagEmits {
    close: [event: TagCloseEvent, tagKey: string | number | undefined];
    'update:visible': [visible: boolean];
    keydown: [event: KeyboardEvent];
}

export interface TagGroupItem extends TagProps {
    children?: string | number;
}
export interface TagGroupProps {
    tagList: TagGroupItem[];
    maxTagCount?: number;
    restCount?: number;
    size?: TagSize;
    showPopover?: boolean;
    popoverProps?: PopoverProps;
    avatarShape?: AvatarShape;
}
export interface TagGroupSlots {
    tag?: (props: { tag: TagGroupItem; index: number }) => VNode[];
}
export interface TagGroupEmits {
    tagClose: [event: TagCloseEvent, tagKey: string | number | undefined];
    plusNMouseEnter: [];
}

export interface SplitTagGroupProps {}
export interface SplitTagGroupSlots {
    default?: () => VNode[];
}

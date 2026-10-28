import type { JSX } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/tag/constants';
import type { ElementProps } from '../_base/element-props';
import type { PopoverProps } from '../popover';

export type TagColor = (typeof strings.TAG_COLOR)[number];
export type TagType = (typeof strings.TAG_TYPE)[number];
export type TagSize = (typeof strings.TAG_SIZE)[number];
export type AvatarShape = 'circle' | 'square';
export type TagShape = 'circle' | 'square';
export type TagCloseEvent = (MouseEvent | KeyboardEvent) & { currentTarget: HTMLElement; target: Element };

export interface TagProps extends ElementProps<'div', 'onClose'> {
    tagKey?: string | number;
    size?: TagSize;
    color?: TagColor;
    type?: TagType;
    closable?: boolean;
    visible?: boolean;
    /** `event` is the click on the close icon, or the Backspace or Delete keydown on the tag */
    onClose?: (tagChildren: JSX.Element, event: TagCloseEvent, tagKey?: string | number) => void;
    prefixIcon?: JSX.Element;
    suffixIcon?: JSX.Element;
    avatarSrc?: string;
    colorful?: boolean;
    gradient?: boolean;
    avatarShape?: AvatarShape;
    shape?: TagShape;
}

/** A TagGroup item is data: content other than text goes through `renderTag` */
export interface TagGroupItem extends Omit<TagProps, 'children' | 'prefixIcon' | 'suffixIcon'> {
    children?: string | number;
}

export interface TagGroupProps extends ElementProps<'div', 'children'> {
    tagList: TagGroupItem[];
    renderTag?: (tag: TagGroupItem, index: number) => JSX.Element;
    maxTagCount?: number;
    restCount?: number;
    size?: TagSize;
    showPopover?: boolean;
    popoverProps?: PopoverProps;
    avatarShape?: AvatarShape;
    onTagClose?: (tagChildren: JSX.Element, event: TagCloseEvent, tagKey?: string | number) => void;
    onPlusNMouseEnter?: () => void;
}

export type { SplitTagGroupProps } from './split-tag-group';

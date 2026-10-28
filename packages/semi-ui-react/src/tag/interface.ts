import React from 'react';
import type { strings } from '@fibrae/semi-foundation/tag/constants';
import type { ElementProps } from '../_base/base';
import type { PopoverProps } from '../popover/index';

export type TagColor = (typeof strings.TAG_COLOR)[number];
export type TagType = (typeof strings.TAG_TYPE)[number];
export type TagSize = (typeof strings.TAG_SIZE)[number];
export type AvatarShape = 'circle' | 'square';
export type TagShape = 'circle' | 'square';
type TagCloseEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;

export interface TagProps extends ElementProps<'div'> {
    /** TagInput passes -1 so its arrow keys, not Tab, move focus between tags */
    tabIndex?: number;
    children?: React.ReactNode;
    tagKey?: string | number;
    size?: TagSize;
    color?: TagColor;
    type?: TagType;
    closable?: boolean;
    visible?: boolean;
    /** `event` is the click on the close icon, or the Backspace or Delete keydown on the tag */
    onClose?: (tagChildren: React.ReactNode, event: TagCloseEvent, tagKey: string | number) => void;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    avatarSrc?: string;
    colorful?: boolean;
    gradient?: boolean;
    avatarShape?: AvatarShape;
    shape?: TagShape;
    onMouseEnter?: () => void;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

interface TagGroupBaseProps extends ElementProps<'div', 'children'> {
    style?: React.CSSProperties;
    className?: string;
    maxTagCount?: number;
    restCount?: number;
    size?: TagSize;
    showPopover?: boolean;
    popoverProps?: PopoverProps;
    avatarShape?: AvatarShape;
    onTagClose?: (tagChildren: React.ReactNode, event: TagCloseEvent, tagKey: string | number) => void;
    onPlusNMouseEnter?: () => void;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

/** `mode="custom"` renders `tagList` entries as given instead of wrapping them in Tag */
export type TagGroupProps = TagGroupBaseProps & ({ mode: 'custom'; tagList: React.ReactNode[] } | { mode?: undefined; tagList: TagProps[] });

export type { SplitTagGroupProps } from './split-tag-group';

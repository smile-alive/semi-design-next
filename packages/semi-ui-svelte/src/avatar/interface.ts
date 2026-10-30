import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLImgAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/avatar/constants';

export type AvatarShape = 'circle' | 'square';
export type AvatarSize = (typeof strings.SIZE)[number];
export type AvatarColor = 'amber' | 'blue' | 'cyan' | 'green' | 'grey' | 'indigo' | 'light-blue' | 'light-green' | 'lime' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'violet' | 'yellow';

export interface AvatarTopSlot {
    gradientStart?: string;
    gradientEnd?: string;
    textColor?: string;
    className?: string;
    style?: string;
    /** Replaces the whole top mark */
    render?: Snippet;
}

export interface AvatarBottomSlot {
    shape?: AvatarShape;
    bgColor?: string;
    textColor?: string;
    className?: string;
    style?: string;
    /** Replaces the whole bottom mark */
    render?: Snippet;
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'onmouseenter' | 'onmouseleave'> {
    color?: AvatarColor;
    shape?: AvatarShape;
    size?: string;
    src?: string;
    srcSet?: string;
    alt?: string;
    gap?: number;
    imgAttr?: HTMLImgAttributes;
    topSlot?: AvatarTopSlot;
    bottomSlot?: AvatarBottomSlot;
    border?: boolean | { color?: string; motion?: boolean };
    contentMotion?: boolean;
    /** Returning `false` keeps the broken image instead of falling back to the content */
    onError?: () => boolean | void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
    children?: Snippet;
    hoverMask?: Snippet;
    topSlotText?: Snippet;
    bottomSlotText?: Snippet;
}

export type AvatarGroupShape = AvatarShape;
export type AvatarGroupSize = AvatarSize;
export type AvatarGroupOverlapFrom = 'start' | 'end';

/** One avatar of the group; the group's `size` and `shape` override the item's own, as in React */
export type AvatarGroupItem = AvatarProps;

export interface AvatarGroupItemContext {
    item: AvatarGroupItem;
    index: number;
}

export interface AvatarGroupMoreContext {
    restNumber: number;
    /** The hidden items, in order */
    restAvatars: AvatarGroupItem[];
}

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    shape?: AvatarGroupShape;
    size?: string;
    overlapFrom?: AvatarGroupOverlapFrom;
    maxCount?: number;
    items?: AvatarGroupItem[];
    /** Content of every avatar, taking precedence over the item's own `children` */
    item?: Snippet<[AvatarGroupItemContext]>;
    /** Replaces the default `+N` avatar */
    more?: Snippet<[AvatarGroupMoreContext]>;
}

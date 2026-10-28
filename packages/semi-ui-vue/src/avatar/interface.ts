import type { CSSProperties, ImgHTMLAttributes, VNode } from 'vue';
import type { strings } from '@fibrae/semi-foundation/avatar/constants';

export type AvatarShape = 'circle' | 'square';
export type AvatarSize = (typeof strings.SIZE)[number];
export type AvatarColor = 'amber' | 'blue' | 'cyan' | 'green' | 'grey' | 'indigo' | 'light-blue' | 'light-green' | 'lime' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'violet' | 'yellow';
export interface AvatarTopSlot {
    gradientStart?: string;
    gradientEnd?: string;
    textColor?: string;
    className?: string;
    style?: CSSProperties;
}
export interface AvatarBottomSlot {
    shape?: AvatarShape;
    bgColor?: string;
    textColor?: string;
    className?: string;
    style?: CSSProperties;
}
export interface AvatarProps {
    color?: AvatarColor;
    shape?: AvatarShape;
    size?: string;
    src?: string;
    srcSet?: string;
    alt?: string;
    gap?: number;
    imgAttr?: ImgHTMLAttributes;
    topSlot?: AvatarTopSlot;
    bottomSlot?: AvatarBottomSlot;
    border?: boolean | { color?: string; motion?: boolean };
    contentMotion?: boolean;
    onError?: () => boolean | void;
}
export interface AvatarSlots {
    default?: () => VNode[];
    hoverMask?: () => VNode[];
    topSlot?: () => VNode[];
    bottomSlot?: () => VNode[];
    topSlotText?: () => VNode[];
    bottomSlotText?: () => VNode[];
}
// click stays a native listener in attrs: its presence is what makes the avatar a button.
export interface AvatarEmits {
    mouseEnter: [event: MouseEvent];
    mouseLeave: [event: MouseEvent];
}
export type AvatarGroupShape = AvatarShape;
export type AvatarGroupSize = AvatarSize;
export type AvatarGroupOverlapFrom = 'start' | 'end';
export interface AvatarGroupProps {
    shape?: AvatarGroupShape;
    size?: string;
    overlapFrom?: AvatarGroupOverlapFrom;
    maxCount?: number;
}
export interface AvatarGroupSlots {
    default?: () => VNode[];
    more?: (props: { restNumber: number; restAvatars: VNode[] }) => VNode[];
}

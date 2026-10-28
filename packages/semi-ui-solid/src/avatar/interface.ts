import type { JSX } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/avatar/constants';
import type { ElementProps } from '../_base/element-props';

export type AvatarShape = 'circle' | 'square';
export type AvatarSize = (typeof strings.SIZE)[number];
export type AvatarColor = 'amber' | 'blue' | 'cyan' | 'green' | 'grey' | 'indigo' | 'light-blue' | 'light-green' | 'lime' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'violet' | 'yellow';

/** Badge text; a function renders other content and is called only when the badge shows */
export type AvatarSlotText = string | number | (() => JSX.Element);

export interface AvatarProps extends ElementProps<'span', 'onError'> {
    children?: JSX.Element;
    color?: AvatarColor;
    shape?: AvatarShape;
    size?: string;
    hoverMask?: JSX.Element;
    src?: string;
    srcSet?: string;
    alt?: string;
    gap?: number;
    /** Called without an event when the image fails to load; returning `false` keeps the broken image */
    onError?: () => boolean | void;
    imgAttr?: ElementProps<'img'>;
    bottomSlot?: {
        render?: () => JSX.Element;
        shape?: AvatarShape;
        text: AvatarSlotText;
        bgColor?: string;
        textColor?: string;
        class?: string;
        style?: JSX.CSSProperties | string;
    };
    topSlot?: {
        render?: () => JSX.Element;
        gradientStart?: string;
        gradientEnd?: string;
        text: AvatarSlotText;
        textColor?: string;
        class?: string;
        style?: JSX.CSSProperties | string;
    };
    border?:
        | {
              color?: string;
              motion?: boolean;
          }
        | boolean;
    contentMotion?: boolean;
}

export type AvatarGroupShape = 'circle' | 'square';
export type AvatarGroupSize = 'extra-extra-small' | 'extra-small' | 'small' | 'default' | 'medium' | 'large' | 'extra-large';
export type AvatarGroupOverlapFrom = 'start' | 'end';

/** Undeclared props go to the root element, the list */
export interface AvatarGroupProps extends ElementProps<'div'> {
    children?: JSX.Element;
    shape?: AvatarGroupShape;
    size?: string;
    overlapFrom?: AvatarGroupOverlapFrom;
    maxCount?: number;
    /**
     * `restAvatars` render the hidden avatars where they are called, as standalone avatars; the props passed override
     * the avatar's own (`avatar({ size: 'extra-small' })`)
     */
    renderMore?: (restNumber: number, restAvatars: ((props?: AvatarProps) => JSX.Element)[]) => JSX.Element;
}

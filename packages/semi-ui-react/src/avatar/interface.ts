import React, { type CSSProperties } from 'react';
import type { strings } from '@fibrae/semi-foundation/avatar/constants';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';

export type AvatarShape = 'circle' | 'square';
export type AvatarSize = (typeof strings.SIZE)[number];
export type AvatarColor = 'amber' | 'blue' | 'cyan' | 'green' | 'grey' | 'indigo' | 'light-blue' | 'light-green' | 'lime' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'violet' | 'yellow';

export interface AvatarProps extends BaseProps, ElementProps<'span', 'onError'> {
    children?: React.ReactNode;
    color?: AvatarColor;
    shape?: AvatarShape;
    size?: string;
    hoverMask?: React.ReactNode;
    src?: string;
    srcSet?: string;
    alt?: string;
    gap?: number;
    onError?: React.MouseEventHandler;
    onClick?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    imgAttr?: React.ImgHTMLAttributes<HTMLImageElement>;
    bottomSlot?: {
        render?: () => React.ReactNode;
        shape?: 'circle' | 'square';
        text: React.ReactNode;
        bgColor?: string;
        textColor?: string;
        className?: string;
        style?: CSSProperties;
    };
    topSlot?: {
        render?: () => React.ReactNode;
        gradientStart?: string;
        gradientEnd?: string;
        text: React.ReactNode;
        textColor?: string;
        className?: string;
        style?: CSSProperties;
    };
    border?:
        | {
              color?: string;
              motion?: boolean;
          }
        | boolean;
    contentMotion?: boolean;
    /** Attached to the `.semi-avatar` element, which sits inside a wrapper when topSlot, bottomSlot or border is set */
    ref?: React.Ref<HTMLSpanElement>;
}

export type AvatarGroupShape = 'circle' | 'square';
export type AvatarGroupSize = 'extra-extra-small' | 'extra-small' | 'small' | 'default' | 'medium' | 'large' | 'extra-large';
export type AvatarGroupOverlapFrom = 'start' | 'end';

/** Undeclared props go to the root element, the list */
export interface AvatarGroupProps extends ElementProps<'div'> {
    children?: React.ReactNode;
    shape?: AvatarGroupShape;
    size?: string;
    overlapFrom?: AvatarGroupOverlapFrom;
    maxCount?: number;
    renderMore?: (restNumber?: number, restAvatars?: React.ReactNode[]) => React.ReactNode;
    /** Attached to the root element, the list */
    ref?: React.Ref<HTMLDivElement>;
}

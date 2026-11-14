import type { ClassValue, StyleValue, VNode } from 'vue';
import type { ButtonPart } from '@fibrae/semi-foundation/components/button/constants';
import type { Size } from '@fibrae/semi-foundation/utils';

export type HtmlType = 'button' | 'reset' | 'submit';
export type { Size };
export type Theme = 'solid' | 'borderless' | 'light' | 'outline';
export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type HorizontalPaddingType = 'left' | 'right';

export interface ButtonProps {
    block?: boolean;
    colorful?: boolean;
    classNames?: Partial<Record<ButtonPart, ClassValue>>;
    disabled?: boolean;
    htmlType?: HtmlType;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    /** Only applies to a button that shows an icon or the loading spinner. */
    noHorizontalPadding?: boolean | HorizontalPaddingType | HorizontalPaddingType[];
    size?: Size;
    styles?: Partial<Record<ButtonPart, StyleValue>>;
    theme?: Theme;
    type?: Type;
}

export interface ButtonSlots {
    default?: () => VNode[];
    icon?: () => VNode[];
}

export interface ButtonGroupProps {
    colorful?: boolean;
    disabled?: boolean;
    size?: Size;
    theme?: Theme;
    type?: Type;
}

export interface ButtonGroupSlots {
    default?: () => VNode[];
}

export interface SplitButtonGroupProps {}

export interface SplitButtonGroupSlots {
    default?: () => VNode[];
}

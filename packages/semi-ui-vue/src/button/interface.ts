import type { VNode } from 'vue';
import type { Size } from '@fibrae/semi-foundation/utils/type';

export type HtmlType = 'button' | 'reset' | 'submit';
export type { Size };
export type Theme = 'solid' | 'borderless' | 'light' | 'outline';
export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type HorizontalPaddingType = 'left' | 'right';

export interface ButtonProps {
    block?: boolean;
    colorful?: boolean;
    contentClassName?: string;
    disabled?: boolean;
    htmlType?: HtmlType;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    /** Only applies to a button that shows an icon or the loading spinner. */
    noHorizontalPadding?: boolean | HorizontalPaddingType | HorizontalPaddingType[];
    size?: Size;
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

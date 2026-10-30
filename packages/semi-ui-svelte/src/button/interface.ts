import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { Size } from '@fibrae/semi-foundation/utils/type';

export type HtmlType = 'button' | 'reset' | 'submit';
export type { Size };
export type Theme = 'solid' | 'borderless' | 'light' | 'outline';
export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type HorizontalPaddingType = 'left' | 'right';

/** What the `icon` snippet receives; a colorful button passes the fill its icon has to apply */
export interface ButtonIconArgs {
    fill?: string[];
}

export interface ButtonProps extends Omit<HTMLButtonAttributes, 'children' | 'type'> {
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
    children?: Snippet;
    icon?: Snippet<[ButtonIconArgs]>;
}

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
    colorful?: boolean;
    disabled?: boolean;
    size?: Size;
    theme?: Theme;
    type?: Type;
}

export interface SplitButtonGroupProps extends HTMLAttributes<HTMLDivElement> {}

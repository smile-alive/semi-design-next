import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { ButtonPart } from '@fibrae/semi-foundation/components/button/constants';
import type { Size } from '@fibrae/semi-foundation/utils';

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
    classNames?: Partial<Record<ButtonPart, ClassValue>>;
    colorful?: boolean;
    disabled?: boolean;
    htmlType?: HtmlType;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    /** Only applies to a button that shows an icon or the loading spinner. */
    noHorizontalPadding?: boolean | HorizontalPaddingType | HorizontalPaddingType[];
    size?: Size;
    styles?: Partial<Record<ButtonPart, string>>;
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

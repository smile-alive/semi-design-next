import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { TooltipTriggerProps } from '../tooltip/interface.js';

export type { RatingState } from '@fibrae/semi-foundation/rating/foundation';

export interface RatingProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onblur' | 'onchange' | 'onclick' | 'onfocus' | 'onkeydown'> {
    value?: number;
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    disabled?: boolean;
    size?: 'small' | 'default' | number;
    tooltips?: string[];
    prefixCls?: string;
    preventScroll?: boolean;
    /** Drawn in every star; a string is also the unit that names the star values, a snippet is named by the locale */
    character?: string | Snippet;
    onChange?: (value: number) => void;
    /** `undefined` when the pointer leaves the stars or a click clears the value */
    onHoverChange?: (value?: number) => void;
    onClick?: (event: MouseEvent | KeyboardEvent, index: number) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    /** An arrow key that moved the value */
    onKeyDown?: (event: KeyboardEvent) => void;
}

export interface RatingItemProps {
    /** The committed value: decides aria-checked and the roving Tab stop */
    value: number;
    /** The value the star fill shows: the hovered value while hovering, else `value` */
    displayValue: number;
    index: number;
    prefixCls: string;
    allowHalf: boolean;
    disabled: boolean;
    count: number;
    size: number | 'small' | 'default';
    /** A custom unit used as is; otherwise the locale names it */
    unit?: string;
    preventScroll?: boolean;
    /** No radio stands for the value: this star's first radio is the Tab stop */
    firstTabStop?: boolean;
    character?: string | Snippet;
    /** From a wrapping Tooltip: the description reaches the radios, the Tab stop is dropped */
    trigger?: TooltipTriggerProps;
    /** The pointer moved over the star: a preview of its value */
    onPreview: (event: MouseEvent) => void;
    onPick: (event: MouseEvent) => void;
    /** Enter or Space on a radio, or a click without a pointer (assistive technology): the value that radio stands for */
    onSelect: (event: KeyboardEvent | MouseEvent, value: number) => void;
    onRadioFocus: (event: FocusEvent) => void;
}

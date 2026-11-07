import type { VNode } from 'vue';

export type { RatingState } from '@fibrae/semi-foundation/components/rating/foundation';

export interface RatingProps {
    modelValue?: number;
    defaultValue?: number;
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    disabled?: boolean;
    size?: 'small' | 'default' | number;
    tooltips?: string[];
    prefixCls?: string;
    autofocus?: boolean;
    preventScroll?: boolean;
    /** Names the radiogroup; without it the name summarizes the value */
    ariaLabel?: string;
}

export interface RatingSlots {
    /** Drawn in every star; text-only content also names the unit of the star values */
    character?: () => VNode[];
}

export interface RatingEmits {
    'update:modelValue': [value: number];
    change: [value: number];
    /** `undefined` when the pointer leaves the stars or a click clears the value */
    hoverChange: [value: number | undefined];
    click: [event: MouseEvent | KeyboardEvent, index: number];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    keydown: [event: KeyboardEvent];
}

export interface RatingHandle {
    focus: () => void;
    blur: () => void;
}

export interface RatingItemHandle {
    /** Focuses the radio of this star that stands for `value`: the first half for a half value */
    starFocus: (value: number) => void;
    getDomNode: () => HTMLLIElement | null;
}

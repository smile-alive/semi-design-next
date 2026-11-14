import type { ClassValue, StyleValue, VNode } from 'vue';
import type { SliderPart } from '@fibrae/semi-foundation/components/slider/constants';
import type { HandleDot } from '@fibrae/semi-foundation/components/slider/foundation';

export type { HandleDot, SliderState } from '@fibrae/semi-foundation/components/slider/foundation';

export interface SliderProps {
    modelValue?: number | number[];
    defaultValue?: number | number[];
    disabled?: boolean;
    included?: boolean;
    /** Mark labels by value; node labels go through the `mark` slot */
    marks?: Record<number, string | number>;
    max?: number;
    min?: number;
    range?: boolean;
    step?: number;
    /** Called with one handle's value; `null` hides the handle tooltips */
    tipFormatter?: ((value: number) => string | number) | null;
    tooltipVisible?: boolean;
    tooltipOnMark?: boolean;
    showMarkLabel?: boolean;
    showArrow?: boolean;
    showBoundary?: boolean;
    vertical?: boolean;
    verticalReverse?: boolean;
    classNames?: Partial<Record<SliderPart, ClassValue>>;
    styles?: Partial<Record<SliderPart, StyleValue>>;
    handleDot?: HandleDot | HandleDot[];
    /** Names the first handle's input, so a `<label for>` focuses the slider */
    id?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaValuetext?: string;
    getAriaValueText?: (value: number, index?: number) => string;
}

export interface SliderMarkSlotProps {
    value: number;
    label: string | number;
}

export interface SliderTipSlotProps {
    value: string | number;
    handle: 'min' | 'max';
}

export interface SliderSlots {
    mark?: (props: SliderMarkSlotProps) => VNode[];
    tip?: (props: SliderTipSlotProps) => VNode[];
}

export interface SliderEmits {
    'update:modelValue': [value: number | number[]];
    change: [value: number | number[]];
    afterChange: [value: number | number[]];
    mouseUp: [event: PointerEvent | KeyboardEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
}

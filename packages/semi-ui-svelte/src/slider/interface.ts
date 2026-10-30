import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { HandleDot } from '@fibrae/semi-foundation/slider/foundation';

export type { HandleDot, SliderState } from '@fibrae/semi-foundation/slider/foundation';

export interface SliderMarkSnippetProps {
    value: number;
    label: string | number;
}

export interface SliderTipSnippetProps {
    /** The handle's value after `tipFormatter` */
    value: string | number;
    handle: 'min' | 'max';
}

// The wrapper div takes the other attributes. name, autofocus and the key listener reach the handle inputs, which the
// div's attributes do not cover; the lowercase listeners are the camelCase callbacks below, and `tabindex` is dropped
// because the inputs are the Tab stops.
type NativeKeys = 'children' | 'onfocus' | 'onblur' | 'onkeydown' | 'tabindex';

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys>, Pick<HTMLInputAttributes, 'name' | 'autofocus'> {
    /** Bindable; leave it out for an uncontrolled slider. `bind:value={get, set}` makes it fully controlled */
    value?: number | number[];
    disabled?: boolean;
    included?: boolean;
    /** Mark labels by value; node labels go through the `mark` snippet */
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
    railStyle?: string;
    /** One dot for a single handle, one per handle for a range */
    handleDot?: HandleDot | HandleDot[];
    /** Names the first handle's input, so a `<label for>` focuses the slider */
    id?: string;
    getAriaValueText?: (value: number, index?: number) => string;
    onChange?: (value: number | number[]) => void;
    onAfterChange?: (value: number | number[]) => void;
    onMouseUp?: (event: PointerEvent | KeyboardEvent) => void;
    /** focusin on the wrapper, so focus moving between the handles fires it each time */
    onFocus?: (event: FocusEvent) => void;
    /** Only when focus leaves the whole slider */
    onBlur?: (event: FocusEvent) => void;
    /** On the handle inputs, before the slider's own handling, so `preventDefault()` keeps a value key from moving the handle */
    onKeyDown?: (event: KeyboardEvent) => void;
    /** A mark's label next to the mark and, with `tooltipOnMark`, in its tooltip */
    mark?: Snippet<[SliderMarkSnippetProps]>;
    /** A handle's tooltip content */
    tip?: Snippet<[SliderTipSnippetProps]>;
}

import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { ColorPickerPart } from '@fibrae/semi-foundation/components/color-picker/constants';
import type { ColorValue } from '@fibrae/semi-foundation/components/color-picker/foundation';
import type { ColorFormat, HsvaColor, RgbaColor } from '@fibrae/semi-foundation/components/color-picker/interface';
import type { PopoverProps } from '../popover/index.js';

export type { ColorValue, ColorFormat, HsvaColor, RgbaColor };

export type ColorPickerClassNames = Partial<Record<ColorPickerPart, ClassValue>>;
export type ColorPickerStyles = Partial<Record<ColorPickerPart, string>>;

// The attributes land on the picker div, which is inside the popover when `usePopover`
export interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
    /**
     * Bindable; leave it out for an uncontrolled picker. `bind:value={get, set}` makes it fully controlled.
     * `null` is a controlled empty value: shows the default color and only reports changes
     */
    value?: ColorValue | null;
    alpha?: boolean;
    eyeDropper?: boolean;
    defaultFormat?: ColorFormat;
    width?: number;
    height?: number;
    usePopover?: boolean;
    popoverProps?: PopoverProps;
    classNames?: ColorPickerClassNames;
    styles?: ColorPickerStyles;
    onChange?: (value: ColorValue) => void;
    /** The popover trigger when `usePopover`, a swatch of the current color by default; not rendered otherwise */
    children?: Snippet;
    topSlot?: Snippet;
    bottomSlot?: Snippet;
}

export interface ColorChooseAreaProps {
    hsva: HsvaColor;
    width: number;
    height: number;
    handleSize: number;
    classNames?: ColorPickerClassNames;
    styles?: ColorPickerStyles;
    onChange: (color: { s: number; v: number }) => void;
}

export interface ColorSliderProps {
    hue: number;
    width: number;
    height: number;
    handleSize: number;
    class?: string;
    classNames?: ColorPickerClassNames;
    styles?: ColorPickerStyles;
    onChange: (hue: number) => void;
}

export interface AlphaSliderProps {
    hsva: HsvaColor;
    width: number;
    height: number;
    handleSize: number;
    classNames?: ColorPickerClassNames;
    styles?: ColorPickerStyles;
    onChange: (alpha: number) => void;
}

export interface DataPartProps {
    currentColor: ColorValue;
    defaultFormat: ColorFormat;
    width: number;
    alpha: boolean;
    eyeDropper: boolean;
    classNames?: ColorPickerClassNames;
    styles?: ColorPickerStyles;
    onChange: (color: HsvaColor | RgbaColor | string, format: ColorFormat) => void;
    onAlphaChange: (alpha: number) => void;
}

import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
import type { ColorValue } from '@fibrae/semi-foundation/color-picker/foundation';
import type { ColorFormat, HsvaColor, RgbaColor } from '@fibrae/semi-foundation/color-picker/interface';
import type { PopoverEmits, PopoverProps } from '../popover/interface';

export type { ColorValue, ColorFormat, HsvaColor, RgbaColor };

// Popover's events as listener props: ColorPicker has no emit that forwards them.
type PopoverListeners = {
    [K in keyof PopoverEmits & string as `on${Capitalize<K>}`]?: (...args: PopoverEmits[K]) => void;
};

/** Popover's props and listeners; `class` and `style` replace React's `className` and `style` */
export type ColorPickerPopoverProps = PopoverProps & PopoverListeners & { class?: HTMLAttributes['class']; style?: StyleValue };

export interface ColorPickerProps {
    modelValue?: ColorValue;
    defaultValue?: ColorValue;
    alpha?: boolean;
    eyeDropper?: boolean;
    defaultFormat?: ColorFormat;
    width?: number;
    height?: number;
    usePopover?: boolean;
    popoverProps?: ColorPickerPopoverProps;
}

export interface ColorPickerEmits {
    'update:modelValue': [value: ColorValue];
    change: [value: ColorValue];
}

export interface ColorPickerSlots {
    /** The popover trigger when `usePopover`, a swatch of the current color by default; not rendered otherwise */
    default?: () => VNode[];
    topSlot?: () => VNode[];
    bottomSlot?: () => VNode[];
}

export interface ColorPickerHandle {
    /** The picker div: inside the popover when `usePopover`, so null while the popover is closed */
    readonly root: HTMLElement | null;
}

export interface ColorPickerPanelSlots {
    topSlot?: () => VNode[];
    bottomSlot?: () => VNode[];
}

export interface ColorChooseAreaProps {
    hsva: HsvaColor;
    width: number;
    height: number;
    handleSize: number;
}

export interface ColorSliderProps {
    foundation: ColorPickerFoundation;
    hue: number;
    width: number;
    height: number;
    handleSize: number;
}

export interface AlphaSliderProps {
    foundation: ColorPickerFoundation;
    hsva: HsvaColor;
    width: number;
    height: number;
    handleSize: number;
}

export interface DataPartProps {
    foundation: ColorPickerFoundation;
    currentColor: ColorValue;
    defaultFormat: ColorFormat;
    width: number;
    alpha: boolean;
    eyeDropper: boolean;
}

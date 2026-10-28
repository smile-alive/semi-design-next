import ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
import ColorPicker from './color-picker.vue';

// Annotated so declaration emit refers to the SFC type instead of inlining it with Vue's GlobalComponents.
const ColorPickerWithStatics: typeof ColorPicker & {
    colorStringToValue: typeof ColorPickerFoundation.colorStringToValue;
} = Object.assign(ColorPicker, { colorStringToValue: ColorPickerFoundation.colorStringToValue });
export default ColorPickerWithStatics;
export type { ColorFormat, ColorPickerEmits, ColorPickerHandle, ColorPickerPopoverProps, ColorPickerProps, ColorPickerSlots, ColorValue, HsvaColor, RgbaColor } from './interface';

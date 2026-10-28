import type { ComputedRef } from 'vue';
import type ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
import { createContext } from '../_base/create-context';
import type { ColorFormat, ColorValue } from './interface';

export interface ColorPickerView {
    currentColor: ColorValue;
    alpha: boolean;
    eyeDropper: boolean;
    defaultFormat: ColorFormat;
    width: number;
    height: number;
}

export interface ColorPickerContextValue {
    view: ComputedRef<ColorPickerView>;
    foundation: ColorPickerFoundation;
}

export const [provideColorPickerContext, useColorPickerContext] = createContext<ColorPickerContextValue>('ColorPicker');

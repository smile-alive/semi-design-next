import type { ComputedRef } from 'vue';
import type ColorPickerFoundation from '@fibrae/semi-foundation/components/color-picker/foundation';
import { createContext } from '../../base/index';
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

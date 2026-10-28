import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { Size, Theme, Type } from './interface';

export interface ButtonGroupContext {
    disabled?: boolean;
    size?: Size;
    type?: Type;
    theme?: Theme;
    colorful?: boolean;
    /** Popup layer the group was rendered in; buttons inside a popup opened from the group do not inherit. */
    layer?: symbol;
}

export const [provideButtonGroupContext, useButtonGroupContext] = createContext<ComputedRef<ButtonGroupContext>>('ButtonGroup', { optional: true });

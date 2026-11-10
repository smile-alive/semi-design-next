import type { VNode } from 'vue';
import type { Size } from '@fibrae/semi-foundation/utils';

export interface SwitchProps {
    modelValue?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    loading?: boolean;
    size?: Size;
}

export interface SwitchSlots {
    checkedText?: () => VNode[];
    uncheckedText?: () => VNode[];
}

export interface SwitchEmits {
    'update:modelValue': [checked: boolean];
    change: [checked: boolean, event: Event];
}

import type { ClassValue, StyleValue, VNode } from 'vue';
import type { SwitchPart } from '@fibrae/semi-foundation/components/switch/constants';
import type { Size } from '@fibrae/semi-foundation/utils';

export interface SwitchProps {
    classNames?: Partial<Record<SwitchPart, ClassValue>>;
    styles?: Partial<Record<SwitchPart, StyleValue>>;
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

import type { StyleValue, VNode } from 'vue';

export type CheckboxValue = string | number | boolean;
export type CheckboxType = 'default' | 'card' | 'pureCard';
export type CheckboxDirection = 'horizontal' | 'vertical';

export interface CheckboxProps {
    modelValue?: boolean;
    defaultChecked?: boolean;
    /** Identifies the checkbox inside a CheckboxGroup; a checkbox without it works on its own. */
    value?: CheckboxValue;
    disabled?: boolean;
    indeterminate?: boolean;
    type?: CheckboxType;
    addonId?: string;
    extraId?: string;
    prefixCls?: string;
    preventScroll?: boolean;
}

// A type alias rather than an interface: the foundation reads the event through an index signature.
export type CheckboxEventTarget = {
    checked: boolean;
    value: CheckboxValue | undefined;
    name: string | undefined;
    disabled: boolean;
};

export type CheckboxEvent = {
    target: CheckboxEventTarget;
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent: MouseEvent;
};

export interface CheckboxSlots {
    default?: () => VNode[];
    extra?: () => VNode[];
}

export interface CheckboxEmits {
    'update:modelValue': [checked: boolean];
    change: [event: CheckboxEvent];
}

export interface CheckboxHandle {
    focus: () => void;
    blur: () => void;
}

export interface CheckboxOptionItem {
    label?: string | number;
    value?: CheckboxValue;
    disabled?: boolean;
    extra?: string | number;
    class?: string;
    style?: StyleValue;
}

export interface CheckboxGroupProps {
    modelValue?: CheckboxValue[];
    defaultValue?: CheckboxValue[];
    disabled?: boolean;
    name?: string;
    options?: Array<string | CheckboxOptionItem>;
    direction?: CheckboxDirection;
    type?: CheckboxType;
    prefixCls?: string;
}

export interface CheckboxGroupOptionSlotProps {
    option: CheckboxOptionItem;
    index: number;
}

export interface CheckboxGroupSlots {
    default?: () => VNode[];
    label?: (props: CheckboxGroupOptionSlotProps) => VNode[];
    extra?: (props: CheckboxGroupOptionSlotProps) => VNode[];
}

export interface CheckboxGroupEmits {
    'update:modelValue': [value: CheckboxValue[]];
    change: [value: CheckboxValue[]];
    blur: [event: FocusEvent];
}

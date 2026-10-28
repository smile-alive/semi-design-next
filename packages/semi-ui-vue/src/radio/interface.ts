import type { StyleValue, VNode } from 'vue';

export type RadioValue = string | number | boolean;
export type RadioType = 'default' | 'button' | 'card' | 'pureCard';
export type RadioMode = 'advanced' | '';
export type RadioDisplayMode = 'vertical' | '';
export type RadioGroupButtonSize = 'middle' | 'small' | 'large';
export type RadioDirection = 'horizontal' | 'vertical';

export interface RadioProps {
    modelValue?: boolean;
    defaultChecked?: boolean;
    /** Identifies the radio inside a RadioGroup, and is the native input's value in a form submission. */
    value?: RadioValue;
    disabled?: boolean;
    displayMode?: RadioDisplayMode;
    mode?: RadioMode;
    type?: RadioType;
    addonStyle?: StyleValue;
    addonClassName?: string;
    addonId?: string;
    extraId?: string;
    prefixCls?: string;
    preventScroll?: boolean;
}

// A type alias rather than an interface: the foundation reads the event through an index signature.
export type RadioChangeEventTarget = {
    checked: boolean;
    value: RadioValue | undefined;
    name: string | undefined;
    disabled: boolean;
};

export interface RadioChangeEvent {
    target: RadioChangeEventTarget;
    stopPropagation: () => void;
    preventDefault: () => void;
}

export interface RadioSlots {
    default?: () => VNode[];
    /** Not rendered for type="button". */
    extra?: () => VNode[];
}

export interface RadioEmits {
    'update:modelValue': [checked: boolean];
    change: [event: RadioChangeEvent];
}

export interface RadioHandle {
    focus: () => void;
    blur: () => void;
}

export interface RadioOptionItem {
    label?: string | number;
    value?: RadioValue;
    disabled?: boolean;
    extra?: string | number;
    class?: string;
    style?: StyleValue;
    addonId?: string;
    addonStyle?: StyleValue;
    addonClass?: string;
    extraId?: string;
}

export interface RadioGroupProps {
    modelValue?: RadioValue;
    defaultValue?: RadioValue;
    disabled?: boolean;
    name?: string;
    options?: Array<string | RadioOptionItem>;
    direction?: RadioDirection;
    mode?: RadioMode;
    type?: RadioType;
    buttonSize?: RadioGroupButtonSize;
    prefixCls?: string;
}

export interface RadioGroupOptionSlotProps {
    option: RadioOptionItem;
    index: number;
}

export interface RadioGroupSlots {
    default?: () => VNode[];
    label?: (props: RadioGroupOptionSlotProps) => VNode[];
    extra?: (props: RadioGroupOptionSlotProps) => VNode[];
}

export interface RadioGroupEmits {
    /** `undefined` when mode="advanced" unchecks the selected radio. */
    'update:modelValue': [value: RadioValue | undefined];
    change: [event: RadioChangeEvent];
    blur: [event: FocusEvent];
}

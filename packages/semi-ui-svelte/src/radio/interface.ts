import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

export type RadioValue = string | number | boolean;
export type RadioType = 'default' | 'button' | 'card' | 'pureCard';
export type RadioMode = 'advanced' | '';
export type RadioDisplayMode = 'vertical' | '';
export type RadioGroupButtonSize = 'middle' | 'small' | 'large';
export type RadioDirection = 'horizontal' | 'vertical';

// A type alias rather than an interface: the foundation reads the event through an index signature.
export type RadioChangeEventTarget = {
    checked: boolean;
    value: RadioValue | undefined;
    name?: string;
    disabled: boolean;
};

export interface RadioChangeEvent {
    target: RadioChangeEventTarget;
    stopPropagation: () => void;
    preventDefault: () => void;
}

// name and autofocus reach the inner input, which the label's attributes do not cover
export interface RadioProps extends Omit<HTMLAttributes<HTMLLabelElement>, 'onchange'>, Pick<HTMLInputAttributes, 'name' | 'autofocus'> {
    checked?: boolean;
    /** Identifies the radio inside a RadioGroup, and is the native input's value in a form submission. */
    value?: RadioValue;
    disabled?: boolean;
    displayMode?: RadioDisplayMode;
    mode?: RadioMode;
    type?: RadioType;
    addonStyle?: string;
    addonClassName?: string;
    addonId?: string;
    extraId?: string;
    prefixCls?: string;
    preventScroll?: boolean;
    onChange?: (event: RadioChangeEvent) => void;
    /** Not rendered for type="button". */
    extra?: Snippet;
}

export interface RadioOptionItem {
    label?: string | number;
    value?: RadioValue;
    disabled?: boolean;
    extra?: string | number;
    class?: string;
    style?: string;
    addonId?: string;
    addonStyle?: string;
    addonClass?: string;
    extraId?: string;
}

export interface RadioGroupOptionSnippetParams {
    option: RadioOptionItem;
    index: number;
}

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'onblur'> {
    value?: RadioValue;
    disabled?: boolean;
    name?: string;
    options?: Array<string | RadioOptionItem>;
    direction?: RadioDirection;
    mode?: RadioMode;
    type?: RadioType;
    buttonSize?: RadioGroupButtonSize;
    prefixCls?: string;
    /** `target.value` is `undefined` when mode="advanced" unchecks the selected radio. */
    onChange?: (event: RadioChangeEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    label?: Snippet<[RadioGroupOptionSnippetParams]>;
    extra?: Snippet<[RadioGroupOptionSnippetParams]>;
}

import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

export type CheckboxValue = string | number | boolean;
export type CheckboxType = 'default' | 'card' | 'pureCard';
export type CheckboxDirection = 'horizontal' | 'vertical';

// A type alias rather than an interface: the foundation reads the event through an index signature.
export type CheckboxEventTarget = {
    checked: boolean;
    value?: CheckboxValue;
    name?: string;
    disabled: boolean;
};

export type CheckboxEvent = {
    target: CheckboxEventTarget;
    stopPropagation: () => void;
    preventDefault: () => void;
    nativeEvent: MouseEvent;
};

// name and autofocus reach the inner input, which the span's attributes do not cover
export interface CheckboxProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onchange'>, Pick<HTMLInputAttributes, 'name' | 'autofocus'> {
    checked?: boolean;
    /** Identifies the checkbox inside a CheckboxGroup; a checkbox without it works on its own. */
    value?: CheckboxValue;
    disabled?: boolean;
    indeterminate?: boolean;
    type?: CheckboxType;
    addonId?: string;
    extraId?: string;
    prefixCls?: string;
    preventScroll?: boolean;
    onChange?: (event: CheckboxEvent) => void;
    extra?: Snippet;
}

export interface CheckboxOptionItem {
    label?: string | number;
    value?: CheckboxValue;
    disabled?: boolean;
    extra?: string | number;
    class?: string;
    style?: string;
}

export interface CheckboxGroupOptionSnippetProps {
    option: CheckboxOptionItem;
    index: number;
}

export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'onblur'> {
    value?: CheckboxValue[];
    disabled?: boolean;
    name?: string;
    options?: Array<string | CheckboxOptionItem>;
    direction?: CheckboxDirection;
    type?: CheckboxType;
    prefixCls?: string;
    onChange?: (value: CheckboxValue[]) => void;
    /** Fires when focus leaves the whole group, not between its boxes */
    onBlur?: (event: FocusEvent) => void;
    label?: Snippet<[CheckboxGroupOptionSnippetProps]>;
    extra?: Snippet<[CheckboxGroupOptionSnippetProps]>;
}

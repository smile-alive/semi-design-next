import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { CheckboxGroupPart, CheckboxPart } from '@fibrae/semi-foundation/components/checkbox/constants';

export type CheckboxValue = string | number | boolean;
export type CheckboxType = 'default' | 'card' | 'pureCard';
export type CheckboxDirection = 'horizontal' | 'vertical';

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
    value?: CheckboxValue;
    disabled?: boolean;
    indeterminate?: boolean;
    type?: CheckboxType;
    classNames?: Partial<Record<CheckboxPart, ClassValue>>;
    styles?: Partial<Record<CheckboxPart, string>>;
    addonId?: string;
    extraId?: string;
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
    classNames?: Partial<Record<CheckboxGroupPart, ClassValue>>;
    styles?: Partial<Record<CheckboxGroupPart, string>>;
    onChange?: (value: CheckboxValue[]) => void;
    /** Fires when focus leaves the whole group, not between its boxes */
    onBlur?: (event: FocusEvent) => void;
    label?: Snippet<[CheckboxGroupOptionSnippetProps]>;
    extra?: Snippet<[CheckboxGroupOptionSnippetProps]>;
}

import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { SwitchPart } from '@fibrae/semi-foundation/components/switch/constants';
import type { Size } from '@fibrae/semi-foundation/utils';

// name reaches the inner input, which the div's attributes do not cover
export interface SwitchProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'>, Pick<HTMLInputAttributes, 'name'> {
    checked?: boolean;
    classNames?: Partial<Record<SwitchPart, ClassValue>>;
    styles?: Partial<Record<SwitchPart, string>>;
    disabled?: boolean;
    loading?: boolean;
    size?: Size;
    onChange?: (checked: boolean, event: Event) => void;
    checkedText?: Snippet;
    uncheckedText?: Snippet;
}

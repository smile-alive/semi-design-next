import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { Size } from '@fibrae/semi-foundation/utils/type';

// name reaches the inner input, which the div's attributes do not cover
export interface SwitchProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'>, Pick<HTMLInputAttributes, 'name'> {
    checked?: boolean;
    disabled?: boolean;
    loading?: boolean;
    size?: Size;
    onChange?: (checked: boolean, event: Event) => void;
    checkedText?: Snippet;
    uncheckedText?: Snippet;
}

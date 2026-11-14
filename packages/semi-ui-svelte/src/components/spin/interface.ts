import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { SpinPart } from '@fibrae/semi-foundation/components/spin/constants';

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps extends HTMLAttributes<HTMLDivElement> {
    size?: SpinSize;
    spinning?: boolean;
    delay?: number;
    classNames?: Partial<Record<SpinPart, ClassValue>>;
    styles?: Partial<Record<SpinPart, string>>;
    indicator?: Snippet;
    tip?: Snippet;
}

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps extends HTMLAttributes<HTMLDivElement> {
    size?: SpinSize;
    spinning?: boolean;
    delay?: number;
    wrapperClassName?: string;
    childStyle?: string;
    indicator?: Snippet;
    tip?: Snippet;
}

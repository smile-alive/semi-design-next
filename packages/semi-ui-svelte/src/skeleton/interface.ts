import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

// `placeholder` is the snippet, not the input hint HTMLAttributes declares
export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'placeholder'> {
    active?: boolean;
    loading?: boolean;
    /** Shown while `loading` is true */
    placeholder?: Snippet;
    /** Shown once `loading` is false */
    children?: Snippet;
}

export interface SkeletonBasicProps extends HTMLAttributes<HTMLDivElement> {
    prefixCls?: string;
    /** Replaces the kit's own type, which also names its class */
    type?: string;
}

export interface SkeletonAvatarProps extends SkeletonBasicProps {
    size?: 'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    shape?: 'circle' | 'square';
}

export interface SkeletonParagraphProps extends HTMLAttributes<HTMLUListElement> {
    prefixCls?: string;
    rows?: number;
}

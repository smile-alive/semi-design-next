import type { VNode } from 'vue';

export interface SkeletonProps {
    active?: boolean;
    loading?: boolean;
}

export interface SkeletonSlots {
    /** Shown once `loading` is false */
    default?: () => VNode[];
    /** Shown while `loading` is true */
    placeholder?: () => VNode[];
}

export interface SkeletonBasicProps {
    prefixCls?: string;
    /** Replaces the kit's own type, which also names its class */
    type?: string;
}

export interface SkeletonAvatarProps extends SkeletonBasicProps {
    size?: 'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    shape?: 'circle' | 'square';
}

export interface SkeletonParagraphProps {
    prefixCls?: string;
    rows?: number;
}

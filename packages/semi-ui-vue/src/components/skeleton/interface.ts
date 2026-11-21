import type { ClassValue, StyleValue, VNode } from 'vue';
import type { SkeletonParagraphPart } from '@fibrae/semi-foundation/components/skeleton/constants';

export interface SkeletonProps {
    active?: boolean;
    loading?: boolean;
}

export interface SkeletonSlots {
    default?: () => VNode[];
    placeholder?: () => VNode[];
}

export interface SkeletonBasicProps {
    /** Replaces the kit's own type, which also names its class */
    type?: string;
}

export interface SkeletonAvatarProps extends SkeletonBasicProps {
    size?: 'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    shape?: 'circle' | 'square';
}

export interface SkeletonParagraphProps {
    classNames?: Partial<Record<SkeletonParagraphPart, ClassValue>>;
    rows?: number;
    styles?: Partial<Record<SkeletonParagraphPart, StyleValue>>;
}

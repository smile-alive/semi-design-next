import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { BannerPart } from '@fibrae/semi-foundation/components/banner/constants';

export type BannerType = 'info' | 'danger' | 'warning' | 'success';

// `title` is the heading here, so the native tooltip attribute is not accepted
export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    bordered?: boolean;
    classNames?: Partial<Record<BannerPart, ClassValue>>;
    fullMode?: boolean;
    styles?: Partial<Record<BannerPart, string>>;
    title?: string | Snippet;
    type?: BannerType;
    /** The close button's click event; the banner hides right after the callback returns */
    onClose?: (event: MouseEvent) => void;
    description?: Snippet;
    icon?: Snippet | null;
    /** Replaces the icon of the close button; `null` removes the button */
    closeIcon?: Snippet | null;
    children?: Snippet;
}

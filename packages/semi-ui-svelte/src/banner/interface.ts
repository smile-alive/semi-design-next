import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type BannerType = 'info' | 'danger' | 'warning' | 'success';

// `title` is the heading here, so the native tooltip attribute is not accepted; `role` is always "alert"
export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
    bordered?: boolean;
    fullMode?: boolean;
    title?: string | Snippet;
    type?: BannerType;
    /** The close button's click event; the banner hides right after the callback returns */
    onClose?: (event: MouseEvent) => void;
    description?: Snippet;
    /** Replaces the icon of the type; `null` hides the icon */
    icon?: Snippet | null;
    /** Replaces the icon of the close button; `null` removes the button */
    closeIcon?: Snippet | null;
    /** Content below the message, in the `-extra` area */
    children?: Snippet;
}

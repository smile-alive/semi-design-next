import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ContainerProps } from '../container/interface.js';

export interface AnnotationItem {
    type?: 'video' | 'text';
    title?: string;
    /** Opened in a new tab; an item without it renders a link that only the pointer can activate */
    url?: string;
    detail?: string;
    logo?: string;
    siteName?: string;
    order?: number;
    /** The video cover */
    img?: string;
    /** The video length in seconds */
    duration?: number;
}

export interface AnnotationInfo {
    header: string;
    key: string;
    annotations: AnnotationItem[];
}

export interface AnnotationHeaderSnippetProps {
    item: AnnotationInfo;
    index: number;
}

export interface AnnotationItemSnippetProps {
    item: AnnotationItem;
    /** The position within its group */
    index: number;
}

interface AnnotationContentOwnProps {
    /** Bindable; the open groups */
    activeKey?: string | string[];
    info?: AnnotationInfo[];
    /** A group opened or closed */
    onChange?: (activeKey: string | string[]) => void;
    /** An item was clicked; the native click of the root is not reported apart from it */
    onClick?: (event: MouseEvent, item: AnnotationItem) => void;
    /** A group's header after its icon; the `header` field is its plain-text form */
    header?: Snippet<[AnnotationHeaderSnippetProps]>;
    /** Replaces the built-in item */
    item?: Snippet<[AnnotationItemSnippetProps]>;
}

export interface AnnotationContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'onclick'>, AnnotationContentOwnProps {}

// The container's `header` replaces its header, so the content's group header is renamed `infoHeader`
export interface AnnotationProps extends Omit<ContainerProps, 'onchange' | 'onclick' | 'children'>, Omit<AnnotationContentOwnProps, 'header'> {
    infoHeader?: Snippet<[AnnotationHeaderSnippetProps]>;
}

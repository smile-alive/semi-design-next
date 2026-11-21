import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { AnnotationPart } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
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
    img?: string;
    /** In seconds */
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
    index: number;
}

interface AnnotationContentOwnProps {
    classNames?: Partial<Record<AnnotationPart, ClassValue>>;
    styles?: Partial<Record<AnnotationPart, string>>;
    /** Bindable; the open groups */
    activeKey?: string | string[];
    info?: AnnotationInfo[];
    onChange?: (activeKey: string | string[]) => void;
    /** An item was clicked; the native click of the root is not reported apart from it */
    onClick?: (event: MouseEvent, item: AnnotationItem) => void;
    /** A group's header after its icon; the `header` field is its plain-text form */
    header?: Snippet<[AnnotationHeaderSnippetProps]>;
    item?: Snippet<[AnnotationItemSnippetProps]>;
}

export interface AnnotationContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'onclick'>, AnnotationContentOwnProps {}

// The container's `header` replaces its header, so the content's group header is renamed `infoHeader`
export interface AnnotationProps extends Omit<ContainerProps, 'onchange' | 'onclick' | 'children' | 'classNames' | 'styles'>, Omit<AnnotationContentOwnProps, 'header'> {
    infoHeader?: Snippet<[AnnotationHeaderSnippetProps]>;
}

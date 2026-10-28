import type { VNode } from 'vue';
import type { ContainerEmits, ContainerProps } from '../container/interface';

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

export interface AnnotationContentProps {
    activeKey?: string | string[];
    info?: AnnotationInfo[];
}

export interface AnnotationContentEmits {
    'update:activeKey': [activeKey: string[]];
    /** A group opened or closed */
    change: [activeKey: string | string[]];
    /** An item was clicked; the native click of the root is not reported apart from it */
    click: [event: MouseEvent, item: AnnotationItem];
}

export interface AnnotationHeaderSlotProps {
    item: AnnotationInfo;
    index: number;
}

export interface AnnotationItemSlotProps {
    item: AnnotationItem;
    /** The position within its group */
    index: number;
}

export interface AnnotationContentSlots {
    /** A group's header after its icon; the `header` field is its plain-text form */
    header?: (props: AnnotationHeaderSlotProps) => VNode[];
    /** Replaces the built-in item */
    item?: (props: AnnotationItemSlotProps) => VNode[];
}

export interface AnnotationProps extends ContainerProps, AnnotationContentProps {}

export interface AnnotationEmits extends ContainerEmits, AnnotationContentEmits {}

export interface AnnotationSlots {
    title?: () => VNode[];
    /** Replaces the container header; empty content falls back to the default header */
    header?: () => VNode[];
    /** AnnotationContent's `#header`, renamed beside the container's */
    infoHeader?: (props: AnnotationHeaderSlotProps) => VNode[];
    item?: (props: AnnotationItemSlotProps) => VNode[];
}

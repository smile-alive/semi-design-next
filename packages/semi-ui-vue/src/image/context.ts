import type { ComputedRef } from 'vue';
import type { PreviewGroupImage } from '@fibrae/semi-foundation/image/preview-foundation';
import { createContext } from '../_base/create-context';

export interface GroupImage extends PreviewGroupImage {
    title?: string;
}

export interface PreviewGroupView {
    lazyLoad: boolean;
    titles: (string | undefined)[];
    alts: (string | undefined)[];
    setDownloadName?: (src: string) => string;
}

// Images register themselves because a group also collects images rendered inside other components.
export interface PreviewContextValue {
    view: ComputedRef<PreviewGroupView>;
    setCurrentIndex: (index: number) => void;
    registerImage: (image: GroupImage) => void;
    unregisterImage: (node: Element) => void;
    openImage: (node: Element) => void;
}

export const [providePreviewContext, usePreviewContext] = createContext<PreviewContextValue>('ImagePreview', { optional: true });

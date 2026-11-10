import type { Accessor } from 'solid-js';
import { createContext } from '../../base/create-context';
import type { GroupImage, PreviewProps } from './interface';

export interface PreviewGroupView {
    lazyLoad: boolean;
    titles: PreviewProps['previewTitle'][];
    alts: (string | undefined)[];
    setDownloadName?: (src: string) => string;
}

// Images register themselves, so a group also collects the images that other components render inside it
export interface PreviewContextValue {
    view: Accessor<PreviewGroupView>;
    setCurrentIndex: (index: number) => void;
    registerImage: (image: GroupImage) => void;
    unregisterImage: (node: Element) => void;
    openImage: (node: Element) => void;
}

export const [PreviewContext, usePreviewContext] = createContext<PreviewContextValue>('ImagePreview', { optional: true });

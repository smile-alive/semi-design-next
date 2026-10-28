import type { Accessor, JSX } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { GroupImage } from './interface';

export interface PreviewGroupView {
    lazyLoad: boolean;
    titles: JSX.Element[];
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

import type { ReactNode } from 'react';
import { createContext } from '../_base/create-context';
import type { GroupImage } from './interface';
export interface PreviewContextProps {
    isGroup: boolean;
    lazyLoad: boolean;
    titles: ReactNode[];
    alts: string[];
    setCurrentIndex: (current: number) => void;
    setDownloadName: (src: string) => string;
    registerImage: (image: GroupImage) => void;
    unregisterImage: (node: Element) => void;
    openImage: (node: Element) => void;
}

export const [PreviewContext, usePreviewContext] = createContext<PreviewContextProps>('ImagePreview', { optional: true });

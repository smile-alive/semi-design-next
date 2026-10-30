import { createContext } from '../_base/create-context.js';

/** What an Image in an ImagePreview group reads: the group's list is data, so images never register themselves */
export interface PreviewContextValue {
    readonly srcList: string[];
    readonly lazyLoad: boolean;
    readonly lazyLoadMargin: string;
    /** Opens the group preview at `index` */
    open: (index: number) => void;
}

export const [getPreviewContext, setPreviewContext] = createContext<PreviewContextValue>('ImagePreview', { optional: true });

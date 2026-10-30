import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export type ImageLoadStatus = 'loading' | 'success' | 'error';

/** The props the foundation reads */
export interface ImageBaseProps {
    preview?: boolean | { visible?: boolean };
}

export interface ImageBaseState {}

export interface ImageAdapter<P extends ImageBaseProps = ImageBaseProps, S extends ImageBaseState = ImageBaseState> extends DefaultAdapter<P, S> {
    getIsInGroup: () => boolean;
    /** Opens the group preview at this image */
    openGroupPreview: () => void;
    setLoadStatus: (status: ImageLoadStatus) => void;
    setPreviewVisible: (visible: boolean) => void;
    notifyLoad: (e: any) => void;
    notifyError: (e: any) => void;
    notifyPreviewVisibleChange: (visible: boolean) => void;
}

export default class ImageFoundation<P extends ImageBaseProps = ImageBaseProps, S extends ImageBaseState = ImageBaseState> extends BaseFoundation<ImageAdapter<P, S>, P, S> {
    // static: render derives these, and a foundation method must not run during render
    /** A lone image opens only once loaded; a group's preview does not wait for the thumbnail */
    static canOpen(preview: ImageBaseProps['preview'], loadStatus: ImageLoadStatus, isInGroup: boolean) {
        return Boolean(preview) && (loadStatus === 'success' || isInGroup);
    }

    /** The lone image's own preview stays mounted while the thumbnail loads, so an open preview survives a reload, a controlled visible need not wait for it, and closing it can restore focus */
    static canPreview(preview: ImageBaseProps['preview'], isInGroup: boolean) {
        return Boolean(preview) && !isInGroup;
    }

    handleClick = (_e: unknown) => {
        const { preview } = this.getProps();
        if (!preview) {
            return;
        }
        if (this._adapter.getIsInGroup()) {
            this._adapter.openGroupPreview();
        } else {
            this.handlePreviewVisibleChange(true);
        }
    };

    handleKeyDown = (e: Pick<KeyboardEvent, 'currentTarget' | 'key' | 'preventDefault' | 'target'>) => {
        if (e.target === e.currentTarget && e.currentTarget instanceof HTMLElement && (e.key === 'Enter' || e.key === ' ')) {
            // Space would scroll the page
            e.preventDefault();
            // takes the route of a mouse click, so the consumer's onClick on the img is called too
            e.currentTarget.querySelector<HTMLElement>(':scope > img')?.click();
        }
    };

    handleLoaded = (e: unknown) => {
        this._adapter.notifyLoad(e);
        this._adapter.setLoadStatus('success');
    };

    handleError = (e: unknown) => {
        this._adapter.notifyError(e);
        this._adapter.setLoadStatus('error');
    };

    handlePreviewVisibleChange = (newVisible: boolean) => {
        const { preview } = this.getProps();
        if (typeof preview === 'object' && preview !== null) {
            this._adapter.notifyPreviewVisibleChange(newVisible);
            if (preview.visible === undefined) {
                this._adapter.setPreviewVisible(newVisible);
            }
        } else {
            this._adapter.setPreviewVisible(newVisible);
        }
    };
}

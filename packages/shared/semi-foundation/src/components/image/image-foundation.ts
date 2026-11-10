import { BaseFoundation, type DefaultAdapter } from '../../base/index';

export type ImageLoadStatus = 'loading' | 'success' | 'error';

export interface ImageBaseProps {
    src?: string;
    preview?: boolean | { visible?: boolean };
}

export interface ImageState {
    loadStatus: ImageLoadStatus;
    /** Its own value while `preview.visible` is unset, and the last controlled value after that */
    previewVisible: boolean;
}

export interface ImageAdapter<P extends ImageBaseProps = ImageBaseProps> extends DefaultAdapter<P, ImageState> {
    getIsInGroup: () => boolean;
    openGroupPreview: () => void;
    notifyLoad: (e: any) => void;
    notifyError: (e: any) => void;
    notifyPreviewVisibleChange: (visible: boolean) => void;
}

function getControlledVisible(preview: ImageBaseProps['preview']) {
    return typeof preview === 'object' && preview !== null && preview.visible !== undefined ? Boolean(preview.visible) : undefined;
}

export default class ImageFoundation<P extends ImageBaseProps = ImageBaseProps> extends BaseFoundation<ImageAdapter<P>, P, ImageState> {
    static override readonly propKeys = ['src', 'preview'];

    // `preview` is usually a new object every render; only its controlled visible matters
    static override readonly propEquals = { preview: (a: ImageBaseProps['preview'], b: ImageBaseProps['preview']) => getControlledVisible(a) === getControlledVisible(b) };

    // static: render derives these, and a foundation method must not run during render
    static getInitialState(props: ImageBaseProps): ImageState {
        return { loadStatus: 'loading', previewVisible: getControlledVisible(props.preview) ?? false };
    }

    /** The controlled visible wins in the commit it arrives in, before `handlePropsChange` stores it */
    static getPreviewVisible(preview: ImageBaseProps['preview'], state: ImageState) {
        return getControlledVisible(preview) ?? state.previewVisible;
    }

    /** A lone image opens only once loaded; a group's preview does not wait for the thumbnail */
    static canOpen(preview: ImageBaseProps['preview'], loadStatus: ImageLoadStatus, isInGroup: boolean) {
        return Boolean(preview) && (loadStatus === 'success' || isInGroup);
    }

    /** The lone image's own preview stays mounted while the thumbnail loads, so an open preview survives a reload, a controlled visible need not wait for it, and closing it can restore focus */
    static canPreview(preview: ImageBaseProps['preview'], isInGroup: boolean) {
        return Boolean(preview) && !isInGroup;
    }

    override handlePropsChange(prev: Partial<P>) {
        if (prev.src !== this.getProp('src')) {
            this.setState({ loadStatus: 'loading' });
        }
        const visible = getControlledVisible(this.getProp('preview'));
        if (visible !== undefined && visible !== this.getState('previewVisible')) {
            this.setState({ previewVisible: visible });
        }
    }

    handleClick = (_e: unknown) => {
        const { preview } = this.getProps();
        if (!preview) {
            return;
        }
        if (this.adapter.getIsInGroup()) {
            this.adapter.openGroupPreview();
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
        this.adapter.notifyLoad(e);
        this.setState({ loadStatus: 'success' });
    };

    handleError = (e: unknown) => {
        this.adapter.notifyError(e);
        this.setState({ loadStatus: 'error' });
    };

    handlePreviewVisibleChange = (newVisible: boolean) => {
        const { preview } = this.getProps();
        if (typeof preview === 'object' && preview !== null) {
            this.adapter.notifyPreviewVisibleChange(newVisible);
            if (preview.visible === undefined) {
                this.setState({ previewVisible: newVisible });
            }
        } else {
            this.setState({ previewVisible: newVisible });
        }
    };
}

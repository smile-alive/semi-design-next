import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export interface PreviewGroupImage {
    /** The thumbnail element: the group lists its images in document order */
    node: Element;
    src: string;
    /** The srcs the image adds to the group preview; undefined when the image does not open the group preview */
    previewSrc?: string | string[];
    title?: unknown;
    alt?: string;
}

export interface PreviewBaseProps {
    src?: string | string[];
    visible?: boolean;
    defaultVisible?: boolean;
    currentIndex?: number;
    defaultCurrentIndex?: number;
}

export interface PreviewBaseState {
    visible: boolean;
    currentIndex: number;
    /** The registered images in document order */
    images: PreviewGroupImage[];
}

export interface PreviewAdapter<P extends PreviewBaseProps = PreviewBaseProps, S extends PreviewBaseState = PreviewBaseState> extends DefaultAdapter<P, S> {
    notifyVisibleChange: (visible: boolean) => void;
    notifyChange: (index: number) => void;
}

function byDocumentOrder(a: PreviewGroupImage, b: PreviewGroupImage) {
    return a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/**
 * The group's preview list: its own `src` entries, then the srcs of the images that open the preview. An image
 * with several preview srcs adds them all and opens at its first.
 */
export function getGroupPreviewList<I extends PreviewGroupImage>(src: string | string[] | undefined, images: I[]) {
    const srcList = Array.isArray(src) ? src : typeof src === 'string' ? [src] : [];
    const entries = images.flatMap((image) => (image.previewSrc === undefined ? [] : [image.previewSrc].flat().map((previewSrc) => ({ image, previewSrc }))));
    return {
        srcList: [...srcList, ...entries.map((entry) => entry.previewSrc)],
        titles: [...srcList.map(() => undefined), ...entries.map((entry) => entry.image.title)],
        alts: [...srcList.map(() => undefined), ...entries.map((entry) => entry.image.alt)],
        nodes: [...srcList.map(() => undefined), ...entries.map((entry) => entry.image.node)],
    };
}

/** Gives the imgs that entered the viewport their src; a loaded img has no data-src left and is skipped */
export function loadLazyImages(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    for (const entry of entries) {
        const { target } = entry;
        if (!(target instanceof HTMLImageElement)) {
            continue;
        }
        const lazySrc = target.dataset.src;
        if (entry.isIntersecting && lazySrc) {
            target.src = lazySrc;
            target.removeAttribute('data-src');
            observer.unobserve(target);
        }
    }
}

export default class PreviewFoundation<P extends PreviewBaseProps = PreviewBaseProps, S extends PreviewBaseState = PreviewBaseState> extends BaseFoundation<PreviewAdapter<P, S>, P, S> {
    #images = new Map<Element, S['images'][number]>();

    #syncImages() {
        const images = [...this.#images.values()].toSorted(byDocumentOrder);
        const current = this.getState('images');
        if (images.length !== current.length || images.some((image, i) => image !== current[i])) {
            this.setState({ images });
        }
        return images;
    }

    /** `I` is the framework's image type, which hosts register through `registerImage` */
    static getInitialState<I extends PreviewGroupImage = PreviewGroupImage>(props: PreviewBaseProps): PreviewBaseState & { images: I[] } {
        return {
            currentIndex: props.currentIndex || props.defaultCurrentIndex || 0,
            visible: props.visible || props.defaultVisible || false,
            images: [],
        };
    }

    registerImage = (image: S['images'][number]) => {
        this.#images.set(image.node, image);
        this.#syncImages();
    };

    unregisterImage = (node: Element) => {
        this.#images.delete(node);
        this.#syncImages();
    };

    /** Keeps the list in document order after images moved without re-registering */
    syncImageOrder = () => {
        this.#syncImages();
    };

    /** Opens the group preview at the image whose thumbnail is `node` */
    openImage = (node: Element) => {
        const { nodes } = getGroupPreviewList(this.getProp('src'), this.#syncImages());
        this.handleCurrentIndexChange(nodes.indexOf(node));
        this.handleVisibleChange(true);
    };

    handleVisibleChange = (newVisible: boolean) => {
        if (!this.isControlledComponent('visible')) {
            this.setState({
                visible: newVisible,
            });
        }
        this.adapter.notifyVisibleChange(newVisible);
    };

    handleCurrentIndexChange = (index: number) => {
        if (!this.isControlledComponent('currentIndex')) {
            this.setState({
                currentIndex: index,
            });
        }
        this.adapter.notifyChange(index);
    };
}

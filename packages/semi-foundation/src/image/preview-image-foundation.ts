import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import type { RatioType } from './preview-inner-foundation';
import { clampZoom } from './utils';

export interface PreviewImageAdapter<P extends PreviewImageBaseProps = PreviewImageBaseProps, S extends PreviewImageBaseState = PreviewImageBaseState> extends DefaultAdapter<P, S> {
    getContainer: () => HTMLDivElement;
    getImage: () => HTMLImageElement;
    setLoading: (loading: boolean) => void;
    setImageCursor: (canDrag: boolean) => void;
    capturePointer: (pointerId: number) => void;
    /** Asks the owner of the zoom to set it; `reportToUser` decides whether onZoomIn / onZoomOut are called */
    requestZoom: (zoom: number, reportToUser: boolean) => void;
    notifyLoad: (src: string) => void;
    notifyError: (src: string) => void;
}

export interface DragDirection {
    canDragVertical: boolean;
    canDragHorizontal: boolean;
}

export interface ExtremeTranslate {
    x: number;
    y: number;
}

export interface Translate {
    x: number;
    y: number;
}

/** The props the foundation reads with getProp */
export interface PreviewImageBaseProps {
    src?: string;
    rotation?: number;
    disableDownload?: boolean;
    maxZoom?: number;
    minZoom?: number;
    zoom?: number;
    ratio?: RatioType;
    initialZoom?: number;
}

export interface PreviewImageBaseState {
    loading: boolean;
    width: number;
    height: number;
    translate: Translate;
}

export default class PreviewImageFoundation<P extends PreviewImageBaseProps = PreviewImageBaseProps, S extends PreviewImageBaseState = PreviewImageBaseState> extends BaseFoundation<PreviewImageAdapter<P, S>, P, S> {
    #initialZoomApplied = false;
    #initialZoomAppliedSrc: any = undefined;

    #startMouseClientPosition = { x: 0, y: 0 };
    #originImageWidth = null;
    #originImageHeight = null;

    #containerWidth = 0;
    #containerHeight = 0;

    #syncInitialZoomFlagWithSrc() {
        const src = this.getProp('src');
        if (src !== this.#initialZoomAppliedSrc) {
            this.#initialZoomAppliedSrc = src;
            this.#initialZoomApplied = false;
        }
    }

    #clampZoom(zoom: number) {
        const { maxZoom, minZoom } = this.getProps();
        return clampZoom(zoom, minZoom, maxZoom);
    }

    #getContainerBoundingRectSize() {
        const containerDOM = this._adapter.getContainer();
        if (containerDOM) {
            this.#containerWidth = containerDOM.clientWidth;
            this.#containerHeight = containerDOM.clientHeight;
        }
    }

    #getAdaptationZoom() {
        let _zoom = 1;
        const containerDOM = this._adapter.getContainer();

        if (containerDOM && this.#originImageWidth && this.#originImageHeight) {
            const { rotation } = this.getProps();
            const { width: imageWidth, height: imageHeight } = this.calcBoundingRectSize(this.#originImageWidth, this.#originImageHeight, rotation);
            const reservedWidth = this.#containerWidth - 80;
            const reservedHeight = this.#containerHeight - 80;

            _zoom = Number(Math.min(reservedWidth / imageWidth, reservedHeight / imageHeight).toFixed(2));
        }

        return _zoom;
    }

    #getInitialZoom() {
        const { ratio, initialZoom } = this.getProps();
        let _zoom = 1;

        this.#syncInitialZoomFlagWithSrc();
        if (!this.#initialZoomApplied && typeof initialZoom === 'number' && Number.isFinite(initialZoom) && initialZoom > 0) {
            this.#initialZoomApplied = true;
            return this.#clampZoom(initialZoom);
        }

        if (ratio === 'adaptation') {
            _zoom = this.#getAdaptationZoom();
        }

        return this.#clampZoom(_zoom);
    }

    #setLoading(loading: boolean) {
        this._adapter.setLoading(loading);
    }

    #handleRatioChange() {
        this.#initializeImage();
    }

    #initializeImageZoom(reportToUser = true) {
        const { zoom } = this.getProps();

        const _zoom = this.#getInitialZoom();

        if (zoom !== _zoom) {
            // the new zoom comes back as a prop, and handlePropsUpdate applies it
            this._adapter.requestZoom(_zoom, reportToUser);
        } else {
            this.#applyZoom(zoom);
        }
    }

    #initializeTranslate() {
        this.setState({
            translate: {
                x: 0,
                y: 0,
            },
        });
    }

    #initializeImage(reportToUser = true) {
        this.#initializeImageZoom(reportToUser);
        this.#initializeTranslate();
    }

    #moveImage({ clientX, clientY }: Pick<PointerEvent, 'clientX' | 'clientY'>) {
        const { width, height, translate } = this.getStates();
        const { rotation } = this.getProps();
        const imageBound = this.calcBoundingRectSize(width, height, rotation);
        const { canDragVertical, canDragHorizontal } = this.getCanDragDirection(imageBound.width, imageBound.height);

        if (canDragVertical || canDragHorizontal) {
            let newTranslateX = canDragHorizontal ? translate.x + clientX - this.#startMouseClientPosition.x : translate.x;
            let newTranslateY = canDragVertical ? translate.y + clientY - this.#startMouseClientPosition.y : translate.y;

            const newTranslate = this.getSafeTranslate(imageBound.width, imageBound.height, newTranslateX, newTranslateY);

            this.setState({
                translate: newTranslate,
            });

            this.#startMouseClientPosition = {
                x: clientX,
                y: clientY,
            };
        }
    }

    #applyZoom(prevZoom: number, e?: WheelEvent) {
        const imageDOM = this._adapter.getImage();
        const { translate, width, height } = this.getStates();
        const { rotation, zoom: newZoom } = this.getProps();
        const changeScale = newZoom / (prevZoom || 1);
        const newWidth = Math.floor(this.#originImageWidth * newZoom);
        const newHeight = Math.floor(this.#originImageHeight * newZoom);
        let newTranslateX = Math.floor(translate.x * changeScale);
        let newTranslateY = Math.floor(translate.y * changeScale);

        const imageBound = this.calcBoundingRectSize(width, height, rotation);
        const newImageBound = {
            width: imageBound.width * changeScale,
            height: imageBound.height * changeScale,
        };

        if (e && imageDOM && e.target === imageDOM) {
            let angle = rotation % 360;
            if (angle < 0) {
                angle = 360 + angle;
            }
            switch (angle) {
                case 0:
                    newTranslateX = (e.offsetX - 0.5 * width) * (1 - newZoom / prevZoom) + translate.x;
                    newTranslateY = (e.offsetY - 0.5 * height) * (1 - newZoom / prevZoom) + translate.y;
                    break;
                case 90:
                    newTranslateX = (0.5 * height - e.offsetY) * (1 - newZoom / prevZoom) + translate.x;
                    newTranslateY = (e.offsetX - 0.5 * width) * (1 - newZoom / prevZoom) + translate.y;
                    break;
                case 180:
                    newTranslateX = (0.5 * width - e.offsetX) * (1 - newZoom / prevZoom) + translate.x;
                    newTranslateY = (0.5 * height - e.offsetY) * (1 - newZoom / prevZoom) + translate.y;
                    break;
                case 270:
                    newTranslateX = (e.offsetY - 0.5 * height) * (1 - newZoom / prevZoom) + translate.x;
                    newTranslateY = (0.5 * width - e.offsetX) * (1 - newZoom / prevZoom) + translate.y;
                    break;
                default:
                    break;
            }
        }

        const newTranslate = this.getSafeTranslate(newImageBound.width, newImageBound.height, newTranslateX, newTranslateY);

        this.setState({
            translate: newTranslate,
            width: newWidth,
            height: newHeight,
        });
        if (imageDOM) {
            const { canDragVertical, canDragHorizontal } = this.getCanDragDirection(newImageBound.width, newImageBound.height);
            const canDrag = canDragVertical || canDragHorizontal;

            this._adapter.setImageCursor(canDrag);
        }
    }

    protected calcBoundingRectSize(width = 0, height = 0, rotation = 0) {
        const angleInRadians = (rotation * Math.PI) / 180;
        const sinTheta = Math.abs(Math.sin(angleInRadians));
        const cosTheta = Math.abs(Math.cos(angleInRadians));
        const boundingWidth = width * cosTheta + height * sinTheta;
        const boundingHeight = width * sinTheta + height * cosTheta;

        return {
            width: boundingWidth,
            height: boundingHeight,
        };
    }

    protected getCanDragDirection(width: number, height: number): DragDirection {
        let canDragHorizontal = width > this.#containerWidth;
        let canDragVertical = height > this.#containerHeight;

        return {
            canDragVertical,
            canDragHorizontal,
        };
    }

    protected getExtremeTranslate(width: number, height: number): ExtremeTranslate {
        return {
            x: (width - this.#containerWidth) / 2,
            y: (height - this.#containerHeight) / 2,
        };
    }

    protected getSafeTranslate(width: number, height: number, translateX: number, translateY: number) {
        const { x: extremeX, y: extremeY } = this.getExtremeTranslate(width, height);
        const { canDragVertical, canDragHorizontal } = this.getCanDragDirection(width, height);

        let newTranslateX = 0,
            newTranslateY = 0;

        if (canDragHorizontal) {
            newTranslateX = translateX > 0 ? Math.min(translateX, extremeX) : Math.max(translateX, -extremeX);
        }

        if (canDragVertical) {
            newTranslateY = translateY > 0 ? Math.min(translateY, extremeY) : Math.max(translateY, -extremeY);
        }

        return {
            x: newTranslateX,
            y: newTranslateY,
        };
    }

    override init() {
        this.#getContainerBoundingRectSize();
    }

    handleWindowResize = () => {
        this.#getContainerBoundingRectSize();
        this.#initializeImage();
    };

    handleLoad = (e: { target: EventTarget }) => {
        if (e.target) {
            const { naturalWidth: w, naturalHeight: h } = e.target as HTMLImageElement;
            this.#originImageHeight = h;
            this.#originImageWidth = w;
            this.#syncInitialZoomFlagWithSrc();
            this.setState({
                loading: false,
            });
            this.#initializeImage(false);
        }
        this._adapter.notifyLoad(this.getProp('src'));
    };

    handleError = (_e: any) => {
        this.setState({
            loading: false,
        });
        this._adapter.notifyError(this.getProp('src'));
    };

    // A new src re-initializes on load, so a ratio or rotation reset arriving with it must not re-initialize (and
    // report a zoom) for the outgoing image. `zoomEvent` is the wheel event that set the zoom, if any.
    handlePropsUpdate(prevProps: { src?: string; ratio?: string; rotation?: number; zoom?: number }, zoomEvent?: WheelEvent) {
        const { zoom, src, ratio, rotation } = this.getProps();
        const srcChange = src && src !== prevProps.src;
        if (srcChange) {
            this.#setLoading(true);
        }
        if (zoom !== prevProps.zoom) {
            this.#applyZoom(prevProps.zoom, zoomEvent);
        }
        if (!srcChange) {
            if (ratio !== prevProps.ratio) {
                this.#handleRatioChange();
            }
            if (rotation !== prevProps.rotation) {
                this.handleWindowResize();
            }
        }
    }

    handleRightClickImage = (e: any) => {
        const { disableDownload } = this.getProps();
        if (disableDownload) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        } else {
            return true;
        }
    };

    handleImageMove(e: Pick<PointerEvent, 'buttons' | 'clientX' | 'clientY'>) {
        // touch contact reports buttons 1, like the primary mouse button
        if (e.buttons === 1) {
            this.#moveImage(e);
        }
    }

    handleImagePointerDown = (e: Pick<PointerEvent, 'button' | 'clientX' | 'clientY' | 'pointerId'>) => {
        if (isSecondaryPress(e)) {
            return;
        }
        this.#startMouseClientPosition = {
            x: e.clientX,
            y: e.clientY,
        };
        // the drag keeps following a pointer that leaves the image
        this._adapter.capturePointer(e.pointerId);
    };
}

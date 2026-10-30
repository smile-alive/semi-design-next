import { throttle, type ThrottledFunction } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../base/foundation';
import { handlePrevent } from '../utils/a11y';
import { ESC_KEY } from '../utils/key-code';
import { clampZoom, getPreloadSrcList, downloadImage } from './utils';

export type RatioType = 'adaptation' | 'realSize';
export type SwitchDirection = 'prev' | 'next';
export type RotateDirection = 'left' | 'right';
/** What the preview reads around it; the group keys are provided only inside an image group */
export interface PreviewInnerContext extends DirectionContext {
    isGroup?: boolean;
    setCurrentIndex?: (index: number) => void;
    setDownloadName?: (src: string) => string;
    popupContainer?: () => HTMLElement;
}

export interface PreviewInnerAdapter<P extends PreviewInnerBaseProps = PreviewInnerBaseProps, S extends PreviewInnerBaseState = PreviewInnerBaseState> extends DefaultAdapter<P, S, PreviewInnerContext> {
    getIsInGroup: () => boolean;
    notifyChange: (index: number, direction: SwitchDirection) => void;
    notifyZoom: (zoom: number, increase: boolean) => void;
    notifyClose: () => void;
    notifyVisibleChange: (visible: boolean) => void;
    notifyRatioChange: (type: RatioType) => void;
    notifyRotateChange: (angle: number) => void;
    notifyDownload: (src: string, index: number) => void;
    notifyDownloadError: (src: string) => void;
    registerKeyDownListener: () => void;
    unregisterKeyDownListener: () => void;
    /** Puts the preview on the overlay stack (utils/layer); `onEscape` receives Escape while the preview is on top */
    openLayer: (onEscape: (e: KeyboardEvent) => boolean) => void;
    closeLayer: () => void;
    disabledBodyScroll: () => void;
    enabledBodyScroll: () => void;
    getSetDownloadFunc: () => (src: string) => string;
    isValidTarget: (e: any) => boolean;
    /** Whether a keyboard event comes from the preview, from the page itself (window, body), or from no element at all */
    isEventInPreview: (e: KeyboardEvent) => boolean;
    setRatio: (ratio: RatioType) => void;
}

function isEditable(target: any) {
    return Boolean(target?.isContentEditable) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
}

/** The props the foundation reads with getProp */
export interface PreviewInnerBaseProps {
    closeOnEsc?: boolean;
    src?: string | string[];
    zoomStep?: number;
    maxZoom?: number;
    minZoom?: number;
    preLoad?: boolean;
    preLoadGap?: number;
    infinite?: boolean;
    viewerVisibleDelay?: number;
    visible?: boolean;
    maskClosable?: boolean;
    currentIndex?: number;
}

export interface PreviewInnerBaseState {
    viewerVisible?: boolean;
    zoom?: number;
    /** the wheel event that set `zoom`, which the image centers the zoom on; undefined for other zoom changes */
    zoomEvent?: WheelEvent;
    rotation?: number;
    /** used when currentIndex is not a prop */
    currentIndex?: number;
    /** of the latest switch; undefined before the first one */
    direction?: SwitchDirection;
    /** keyed by src */
    imgLoadStatus?: Record<string, boolean>;
    preloadAfterVisibleChange?: boolean;
}

export default class PreviewInnerFoundation<P extends PreviewInnerBaseProps = PreviewInnerBaseProps, S extends PreviewInnerBaseState = PreviewInnerBaseState> extends BaseFoundation<PreviewInnerAdapter<P, S>, P, S> {
    #timer = null;
    #startMouseDown = { x: 0, y: 0 };

    #getImgSrc() {
        return PreviewInnerFoundation.getSrcList(this.getProp('src'));
    }

    #getCurrentIndex() {
        return PreviewInnerFoundation.getCurrentIndex(this.getProps(), this.getStates());
    }

    #handleViewVisibleChange = () => {
        const { viewerVisible } = this.getStates();
        if (viewerVisible) {
            this.setState({
                viewerVisible: false,
            });
            this.#clearTimer();
        }
    };

    #mouseMoveHandler: ThrottledFunction<(e: unknown) => void> = throttle((e: unknown) => {
        const { viewerVisible } = this.getStates();
        const isValidTarget = this._adapter.isValidTarget(e);
        if (isValidTarget) {
            if (!viewerVisible) {
                this.setState({
                    viewerVisible: true,
                });
            }
            this.updateTimer();
        } else {
            this.#clearTimer();
        }
    }, 50);

    #handleEscape = () => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this._adapter.notifyVisibleChange(false);
        this._adapter.notifyClose();
        return true;
    };

    #clearTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    #onWheel(e: WheelEvent) {
        const { zoomStep } = this.getProps();
        const { zoom: currZoom } = this.getStates();
        if (e.deltaY !== 0) {
            const step = e.deltaY < 0 ? zoomStep : -zoomStep;
            this.handleZoomImage(Number((currZoom + step).toFixed(2)), true, e);
        }
    }

    #preloadGapImage() {
        const { preLoad, preLoadGap, infinite } = this.getProps();
        if (!preLoad || typeof preLoadGap !== 'number' || preLoadGap < 1) {
            return;
        }

        const preloadImages = getPreloadSrcList(this.#getImgSrc(), this.#getCurrentIndex(), preLoadGap, infinite);
        if (preloadImages.length === 0) {
            return;
        }

        const Img = new Image();
        let index = 0;
        const callback = () => {
            index++;
            if (index < preloadImages.length) {
                Img.src = preloadImages[index];
            }
        };
        Img.onload = () => {
            // keyed by the src as given: Img.src reads back resolved against the document
            this.#setLoadSuccessStatus(preloadImages[index]);
            callback();
        };
        Img.onerror = callback;
        Img.src = preloadImages[0];
    }

    #setLoadSuccessStatus(src: string) {
        const { imgLoadStatus } = this.getStates();
        const status = { ...imgLoadStatus };
        status[src] = true;
        this.setState({
            imgLoadStatus: status,
        });
    }

    static getSrcList(src: string | string[]) {
        return Array.isArray(src) ? src : [src];
    }

    static getCurrentIndex(props: Record<string, any>, state: Record<string, any>): number {
        return props.currentIndex === undefined ? state.currentIndex : props.currentIndex;
    }

    static canSwitch(direction: 'prev' | 'next', currentIndex: number, total: number, infinite: boolean) {
        if (total <= 1) {
            return false;
        }
        return infinite || (direction === 'prev' ? currentIndex > 0 : currentIndex < total - 1);
    }

    beforeShow = () => {
        this._adapter.registerKeyDownListener();
        this._adapter.openLayer(this.#handleEscape);
        this._adapter.disabledBodyScroll();
        this.updateTimer();
    };

    afterHide = () => {
        this._adapter.unregisterKeyDownListener();
        this._adapter.closeLayer();
        this._adapter.enabledBodyScroll();
        this.#clearTimer();
        this.setState({
            viewerVisible: true,
            rotation: 0,
            preloadAfterVisibleChange: true,
        });
        this._adapter.setRatio('adaptation');
    };

    override destroy() {
        this.#mouseMoveHandler.cancel();
    }

    handleMouseMove = (e: unknown) => {
        this.#mouseMoveHandler(e);
    };

    // hidden operations stay focusable, so keyboard activity shows them
    handleKeyboardActivity = (e: unknown) => {
        if (!this.getState('viewerVisible')) {
            this.setState({
                viewerVisible: true,
            });
        }
        if (this._adapter.isValidTarget(e)) {
            this.updateTimer();
        } else {
            this.#clearTimer();
        }
    };

    updateTimer = () => {
        const { viewerVisibleDelay, visible } = this.getProps();
        this.#clearTimer();
        // a timer on a hidden preview would hide the operations on its next show
        if (visible) {
            this.#timer = setTimeout(this.#handleViewVisibleChange, viewerVisibleDelay);
        }
    };

    handleWheel = (e: WheelEvent) => {
        this.#onWheel(e);
        handlePrevent(e);
    };

    handleMouseUp = (e: MouseEvent) => {
        // a context menu or middle click is not a click on the mask
        if (e.button !== 0) {
            return;
        }
        const { maskClosable } = this.getProps();
        // the close button closes on click, and its mouseup must not close through the mask first
        let couldClose = this._adapter.isValidTarget(e);
        const { clientX, clientY } = e;
        const { x, y } = this.#startMouseDown;
        if (Math.abs(clientX - x) > 5 || Math.abs(y - clientY) > 5) {
            couldClose = false;
        }
        if (couldClose && maskClosable) {
            this._adapter.notifyVisibleChange(false);
        }
    };

    handleMouseDown = ({ button, clientX, clientY }: Pick<MouseEvent, 'button' | 'clientX' | 'clientY'>) => {
        if (button !== 0) {
            return;
        }
        this.#startMouseDown = { x: clientX, y: clientY };
    };

    // an Escape that closes the preview reaches it through the overlay stack instead
    handleKeyDown = (e: KeyboardEvent) => {
        // the listener is on window: keys typed in a control outside the preview, such as a page button or a Modal above
        // a non-modal preview, are not meant for it
        if (!this._adapter.isEventInPreview(e)) {
            return;
        }
        if (e.key === ESC_KEY && this.getProp('closeOnEsc')) {
            return;
        }
        this.handleKeyboardActivity(e);
        const arrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
        // a focused Slider handle consumes the arrows itself; modified arrows belong to the browser
        if (!arrow || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || isEditable(e.target)) {
            return;
        }
        const isRTL = this.getContext('direction') === 'rtl';
        const direction = (e.key === 'ArrowLeft') !== isRTL ? 'prev' : 'next';
        const { infinite } = this.getProps();
        if (PreviewInnerFoundation.canSwitch(direction, this.#getCurrentIndex(), this.#getImgSrc().length, infinite)) {
            e.preventDefault();
            this.handleSwitchImage(direction);
        }
    };

    handleSwitchImage = (direction: SwitchDirection) => {
        const step = direction === 'prev' ? -1 : 1;
        const srcLength = this.#getImgSrc().length;
        const newIndex = (this.#getCurrentIndex() + step + srcLength) % srcLength;
        if (this._isControlledComponent('currentIndex')) {
            if (this._adapter.getIsInGroup()) {
                this._adapter.getContext('setCurrentIndex')?.(newIndex);
            }
        } else {
            this.setState({
                currentIndex: newIndex,
            });
        }
        this._adapter.notifyChange(newIndex, direction);
        this.setState({
            direction,
            rotation: 0,
        });
    };

    handleDownload = () => {
        const currentIndex = this.#getCurrentIndex();
        const setDownloadName = this._adapter.getSetDownloadFunc();
        const downloadSrc = this.#getImgSrc()[currentIndex];
        if (downloadSrc === undefined) {
            return;
        }
        const downloadName = setDownloadName ? setDownloadName(downloadSrc) : downloadSrc.slice(downloadSrc.lastIndexOf('/') + 1).split('?')[0];
        void downloadImage(downloadSrc, downloadName, this._adapter.notifyDownloadError);
        this._adapter.notifyDownload(downloadSrc, currentIndex);
    };

    handlePreviewClose = (e: Pick<Event, 'preventDefault' | 'stopPropagation'>) => {
        this._adapter.notifyVisibleChange(false);
        this._adapter.notifyClose();
        handlePrevent(e);
    };

    handleAdjustRatio = (type: RatioType) => {
        this._adapter.setRatio(type);
        this._adapter.notifyRatioChange(type);
    };

    handleRotateImage = (direction: RotateDirection) => {
        const { rotation } = this.getStates();
        const ROTATE_STEP = 90;
        const newRotation = rotation + (direction === 'left' ? -ROTATE_STEP : ROTATE_STEP);

        this.setState({
            rotation: newRotation,
        });
        this._adapter.notifyRotateChange(newRotation);
    };

    handleZoomImage = (newZoom: number, notify: boolean = true, e?: WheelEvent) => {
        const { zoom } = this.getStates();
        const { maxZoom, minZoom } = this.getProps();
        const nextZoom = clampZoom(newZoom, minZoom, maxZoom);
        if (zoom !== nextZoom) {
            if (notify) {
                this._adapter.notifyZoom(nextZoom, nextZoom > zoom);
            }

            this.setState({
                zoom: nextZoom,
                zoomEvent: e,
            });
        }
    };

    preloadSingleImage = () => {
        const { preLoad, preLoadGap, infinite } = this.getProps();
        const { direction, imgLoadStatus } = this.getStates();
        const imgSrc = this.#getImgSrc();
        const currentIndex = this.#getCurrentIndex();
        if (!preLoad || typeof preLoadGap !== 'number' || preLoadGap < 1) {
            return;
        }
        let preloadIndex = currentIndex + (direction === 'prev' ? -1 : 1) * preLoadGap;
        if (preloadIndex < 0 || preloadIndex >= imgSrc.length) {
            if (infinite) {
                preloadIndex = (preloadIndex + imgSrc.length) % imgSrc.length;
            } else {
                return;
            }
        }
        if (!imgLoadStatus[imgSrc[preloadIndex]]) {
            const Img = new Image();
            Img.onload = () => {
                this.#setLoadSuccessStatus(imgSrc[preloadIndex]);
            };
            Img.src = imgSrc[preloadIndex];
        }
    };

    onImageLoad = (src: string) => {
        const { preloadAfterVisibleChange } = this.getStates();
        this.#setLoadSuccessStatus(src);
        if (preloadAfterVisibleChange) {
            this.#preloadGapImage();
            this.setState({
                preloadAfterVisibleChange: false,
            });
        } else {
            this.preloadSingleImage();
        }
    };
}

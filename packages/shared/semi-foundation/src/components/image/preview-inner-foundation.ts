import { isEqual, throttle, type ThrottledFunction } from 'es-toolkit';
import FocusTrapHandle from '../../base/focus-handle';
import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../../base/foundation';
import ModalResources from '../../base/modal-resources';
import { handlePrevent } from '../../utils/a11y';
import { resolvePopupContainer } from '../../utils/dom';
import { ESC_KEY } from '../../utils/key-code';
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

export interface PreviewInnerAdapter<P extends PreviewInnerBaseProps = PreviewInnerBaseProps> extends DefaultAdapter<P, PreviewInnerState, PreviewInnerContext> {
    getIsInGroup: () => boolean;
    notifyChange: (index: number, direction: SwitchDirection) => void;
    notifyZoom: (zoom: number, increase: boolean) => void;
    notifyClose: () => void;
    notifyVisibleChange: (visible: boolean) => void;
    notifyRatioChange: (type: RatioType) => void;
    notifyRotateChange: (angle: number) => void;
    notifyDownload: (src: string, index: number) => void;
    notifyDownloadError: (src: string) => void;
    /** The `role="dialog"` element: it goes on the overlay stack and takes focus */
    getWrap: () => HTMLElement | null | undefined;
    isValidTarget: (e: any) => boolean;
    setRatio: (ratio: RatioType) => void;
}

function isEditable(target: any) {
    return Boolean(target?.isContentEditable) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
}

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
    defaultCurrentIndex?: number;
    /** The group's `setDownloadName` (context) takes precedence */
    setDownloadName?: (src: string) => string;
}

export interface PreviewInnerState {
    viewerVisible: boolean;
    zoom: number;
    /** the wheel event that set `zoom`, which the image centers the zoom on; undefined for other zoom changes */
    zoomEvent?: WheelEvent;
    rotation: number;
    /** used when currentIndex is not a prop */
    currentIndex: number;
    /** of the latest switch; undefined before the first one */
    direction?: SwitchDirection;
    /** keyed by src */
    imgLoadStatus: Record<string, boolean>;
    preloadAfterVisibleChange: boolean;
}

export default class PreviewInnerFoundation<P extends PreviewInnerBaseProps = PreviewInnerBaseProps> extends BaseFoundation<PreviewInnerAdapter<P>, P, PreviewInnerState> {
    #timer = null;
    #startMouseDown = { x: 0, y: 0 };
    readonly #resources = new ModalResources();
    // between beforeShow and afterHide: the window listener, layer, scroll lock and focus trap are held
    #shown = false;
    // destroyed while shown (Activity, KeepAlive): init takes them again
    #resume = false;

    static override readonly propKeys = ['src'];

    // a group builds a new list every render, which must not restart the delay
    static override readonly propEquals = { src: isEqual };

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
        const isValidTarget = this.adapter.isValidTarget(e);
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
        this.adapter.notifyVisibleChange(false);
        this.adapter.notifyClose();
        return true;
    };

    // a non-modal preview leaves focus the user moved elsewhere where it is
    #release() {
        this.#shown = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        this.#resources.release();
        this.#clearTimer();
    }

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

    static getInitialState(props: PreviewInnerBaseProps): PreviewInnerState {
        return {
            imgLoadStatus: {},
            zoom: 0.1,
            currentIndex: props.defaultCurrentIndex ?? 0,
            rotation: 0,
            viewerVisible: true,
            preloadAfterVisibleChange: true,
        };
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

    /** Hosts call this once the dialog is in the document and displayed, after `recordFocus` */
    beforeShow = () => {
        if (this.#shown) {
            return;
        }
        this.#shown = true;
        window.addEventListener('keydown', this.handleKeyDown);
        const wrap = this.adapter.getWrap();
        // browsers skip autofocus on elements inserted after page load
        if (wrap && !wrap.contains(FocusTrapHandle.getActiveElement(wrap))) {
            FocusTrapHandle.findAutofocus(wrap)?.focus({ preventScroll: true });
        }
        // only a preview in body covers the page: it is modal, locks scroll and keeps Tab inside
        const modal = resolvePopupContainer(this.getContext('popupContainer')) === document.body;
        this.#resources.hold({ modal, layer: wrap, onEscape: this.#handleEscape, focus: wrap, preventScroll: true });
        this.updateTimer();
    };

    afterHide = () => {
        this.#resume = false;
        if (!this.#shown) {
            return;
        }
        this.#release();
        this.setState({
            viewerVisible: true,
            rotation: 0,
            preloadAfterVisibleChange: true,
        });
        this.adapter.setRatio('adaptation');
    };

    /** Remembers the element to return focus to; hosts call it before the preview renders, or its own focus would be recorded */
    recordFocus = () => {
        this.#resources.record();
    };

    override handlePropsChange() {
        this.updateTimer();
    }

    // A hidden preview (Activity, KeepAlive) holds nothing of the page and stays open; init takes it all again
    override init() {
        if (this.#resume) {
            this.#resume = false;
            this.beforeShow();
        }
    }

    override destroy() {
        this.#mouseMoveHandler.cancel();
        if (this.#shown) {
            this.#release();
            this.#resume = true;
        }
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
        if (this.adapter.isValidTarget(e)) {
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
        let couldClose = this.adapter.isValidTarget(e);
        const { clientX, clientY } = e;
        const { x, y } = this.#startMouseDown;
        if (Math.abs(clientX - x) > 5 || Math.abs(y - clientY) > 5) {
            couldClose = false;
        }
        if (couldClose && maskClosable) {
            this.adapter.notifyVisibleChange(false);
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
        const { target } = e;
        if (target instanceof Element && target !== document.body && !this.adapter.getWrap()?.contains(target)) {
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
        if (this.isControlledComponent('currentIndex')) {
            if (this.adapter.getIsInGroup()) {
                this.adapter.getContext('setCurrentIndex')?.(newIndex);
            }
        } else {
            this.setState({
                currentIndex: newIndex,
            });
        }
        this.adapter.notifyChange(newIndex, direction);
        this.setState({
            direction,
            rotation: 0,
        });
    };

    handleDownload = () => {
        const currentIndex = this.#getCurrentIndex();
        const setDownloadName = this.getContext('setDownloadName') ?? this.getProp('setDownloadName');
        const downloadSrc = this.#getImgSrc()[currentIndex];
        if (downloadSrc === undefined) {
            return;
        }
        const downloadName = setDownloadName ? setDownloadName(downloadSrc) : downloadSrc.slice(downloadSrc.lastIndexOf('/') + 1).split('?')[0];
        void downloadImage(downloadSrc, downloadName, this.adapter.notifyDownloadError);
        this.adapter.notifyDownload(downloadSrc, currentIndex);
    };

    handlePreviewClose = (e: Pick<Event, 'preventDefault' | 'stopPropagation'>) => {
        this.adapter.notifyVisibleChange(false);
        this.adapter.notifyClose();
        handlePrevent(e);
    };

    handleAdjustRatio = (type: RatioType) => {
        this.adapter.setRatio(type);
        this.adapter.notifyRatioChange(type);
    };

    handleRotateImage = (direction: RotateDirection) => {
        const { rotation } = this.getStates();
        const ROTATE_STEP = 90;
        const newRotation = rotation + (direction === 'left' ? -ROTATE_STEP : ROTATE_STEP);

        this.setState({
            rotation: newRotation,
        });
        this.adapter.notifyRotateChange(newRotation);
    };

    handleZoomImage = (newZoom: number, notify: boolean = true, e?: WheelEvent) => {
        const { zoom } = this.getStates();
        const { maxZoom, minZoom } = this.getProps();
        const nextZoom = clampZoom(newZoom, minZoom, maxZoom);
        if (zoom !== nextZoom) {
            if (notify) {
                this.adapter.notifyZoom(nextZoom, nextZoom > zoom);
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

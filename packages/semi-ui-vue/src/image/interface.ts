import type { StyleValue, VNode } from 'vue';
import type { RatioType } from '@fibrae/semi-foundation/image/preview-inner-foundation';

export type { RatioType, RotateDirection, SwitchDirection } from '@fibrae/semi-foundation/image/preview-inner-foundation';

export interface ImagePreviewComponentProps {
    src?: string | string[];
    visible?: boolean;
    defaultVisible?: boolean;
    currentIndex?: number;
    defaultCurrentIndex?: number;
    /** Names the preview dialog and fills its header; a custom header goes through the `title` slot */
    previewTitle?: string;
    lazyLoad?: boolean;
    /** Margin around the viewport within which a lazy image of the group starts loading */
    lazyLoadMargin?: string;
    maskClosable?: boolean;
    closable?: boolean;
    closeOnEsc?: boolean;
    infinite?: boolean;
    showTooltip?: boolean;
    preLoad?: boolean;
    preLoadGap?: number;
    viewerVisibleDelay?: number;
    zoomStep?: number;
    maxZoom?: number;
    minZoom?: number;
    zIndex?: number;
    disableDownload?: boolean;
    initialZoom?: number;
    crossOrigin?: 'anonymous' | 'use-credentials';
    previewCls?: string;
    previewStyle?: StyleValue;
    prevTip?: string;
    nextTip?: string;
    zoomInTip?: string;
    zoomOutTip?: string;
    rotateTip?: string;
    downloadTip?: string;
    adaptiveTip?: string;
    originTip?: string;
    getPopupContainer?: () => HTMLElement;
    setDownloadName?: (src: string) => string;
}

/**
 * The `preview` object of a single Image: data and callbacks only. Its custom nodes go through Image's slots, and
 * the callbacks stay here because Image has no component events for its preview.
 */
export interface ImagePreviewProps extends Omit<ImagePreviewComponentProps, 'lazyLoad' | 'lazyLoadMargin'> {
    onVisibleChange?: (visible: boolean) => void;
    onChange?: (index: number) => void;
    onClose?: () => void;
    onZoomIn?: (zoom: number) => void;
    onZoomOut?: (zoom: number) => void;
    onPrev?: (index: number) => void;
    onNext?: (index: number) => void;
    onRatioChange?: (type: RatioType) => void;
    onRotateLeft?: (angle: number) => void;
    onDownload?: (src: string, index: number) => void;
    onDownloadError?: (src: string) => void;
}

export interface ImageProps {
    src?: string;
    width?: string | number;
    height?: string | number;
    alt?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
    /** Image shown when loading fails; a custom node goes through the `fallback` slot, which wins */
    fallback?: string;
    preview?: boolean | ImagePreviewProps;
    imgStyle?: StyleValue;
    imgCls?: string;
    setDownloadName?: (src: string) => string;
}

export interface ImageEmits {
    load: [event: Event];
    error: [event: Event];
}

/** The zoom values are percentages, as the footer shows them */
export interface MenuProps {
    min: number;
    max: number;
    step: number;
    curPage: number;
    totalNum: number;
    zoom: number;
    ratio: RatioType;
    disabledPrev: boolean;
    disabledNext: boolean;
    disabledZoomIn: boolean;
    disabledZoomOut: boolean;
    disableDownload: boolean;
    /** The default footer items in order: prev, page, next, zoom out, slider, zoom in, ratio, rotate, download */
    menuItems: VNode[];
    onDownload: () => void;
    onNext: () => void;
    onPrev: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRatioClick: () => void;
    onRotateLeft: () => void;
    onRotateRight: () => void;
}

export interface ImagePreviewTitleSlotProps {
    /** The current image's previewTitle, else ImagePreview's */
    title: string | undefined;
    index: number;
}

export interface ImagePreviewIconSlotProps {
    index: number;
}

/** Custom nodes of the preview; on Image they apply to its own preview only, not inside a group */
export interface ImagePreviewSlots {
    default?: () => VNode[];
    title?: (props: ImagePreviewTitleSlotProps) => VNode[];
    previewMenu?: (props: MenuProps) => VNode[];
    leftIcon?: (props: ImagePreviewIconSlotProps) => VNode[];
    rightIcon?: (props: ImagePreviewIconSlotProps) => VNode[];
    closeIcon?: () => VNode[];
}

export interface ImageSlots extends Omit<ImagePreviewSlots, 'default'> {
    placeholder?: () => VNode[];
    fallback?: () => VNode[];
}

export interface ImagePreviewEmits {
    'update:visible': [visible: boolean];
    visibleChange: [visible: boolean];
    'update:currentIndex': [index: number];
    change: [index: number];
    close: [];
    zoomIn: [zoom: number];
    zoomOut: [zoom: number];
    prev: [index: number];
    next: [index: number];
    ratioChange: [type: RatioType];
    rotateLeft: [angle: number];
    download: [src: string, index: number];
    downloadError: [src: string];
}

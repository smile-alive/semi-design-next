import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes, HTMLImgAttributes } from 'svelte/elements';
import type { ImagePart, ImagePreviewPart } from '@fibrae/semi-foundation/components/image/constants';
import type { RatioType } from '@fibrae/semi-foundation/components/image/preview-inner-foundation';

export type { RatioType, RotateDirection, SwitchDirection } from '@fibrae/semi-foundation/components/image/preview-inner-foundation';

export interface PreviewOptions {
    /** The images of the preview. A group lists the srcs its `Image` children open at */
    src?: string | string[];
    /** Controlled while set: the preview only notifies and the parent decides */
    visible?: boolean;
    /** Controlled while set: the preview only notifies and the parent decides */
    currentIndex?: number;
    /** Names the preview dialog and fills its header; a custom header goes through the `title` snippet */
    previewTitle?: string;
    /** One per entry of `src`; the title of the shown image wins over `previewTitle` */
    titles?: (string | undefined)[];
    alts?: (string | undefined)[];
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
    classNames?: Partial<Record<ImagePreviewPart, ClassValue>>;
    styles?: Partial<Record<ImagePreviewPart, string>>;
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

export type ImagePreviewProps = PreviewOptions;

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
    /**
     * Renders the default footer items in order: prev, page, next, zoom out, slider, zoom in, ratio, rotate, download.
     * `start` and `end` pick the items like `Array.prototype.slice`, so one item or a group renders where it is placed.
     */
    menuItems: Snippet<[start?: number, end?: number]>;
    onDownload: () => void;
    onNext: () => void;
    onPrev: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRatioClick: () => void;
    onRotateLeft: () => void;
    onRotateRight: () => void;
}

export interface ImagePreviewTitleSnippetProps {
    title?: string;
    index: number;
}

export interface ImagePreviewIconSnippetProps {
    index: number;
}

/** Custom nodes of the preview; on Image they apply to its own preview only, not inside a group */
export interface PreviewSnippets {
    title?: Snippet<[ImagePreviewTitleSnippetProps]>;
    previewMenu?: Snippet<[MenuProps]>;
    leftIcon?: Snippet<[ImagePreviewIconSnippetProps]>;
    rightIcon?: Snippet<[ImagePreviewIconSnippetProps]>;
    closeIcon?: Snippet;
}

type NativeKeys = 'children' | 'title' | 'onchange';

/**
 * The group of an image preview. `src` is the list; the `Image` children whose src (or `preview.src`) is in it open the
 * preview at their entry. An Image whose src is not in the list previews on its own.
 */
export interface PreviewProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys>, PreviewOptions, PreviewSnippets {
    /** Bindable; leave it out for an uncontrolled preview. `bind:visible={get, set}` makes it fully controlled */
    visible?: boolean;
    /** Bindable; leave it out for an uncontrolled preview. `bind:currentIndex={get, set}` makes it fully controlled */
    currentIndex?: number;
    lazyLoad?: boolean;
    lazyLoadMargin?: string;
    children?: Snippet;
}

type ImgNativeKeys = 'src' | 'width' | 'height' | 'alt' | 'crossorigin' | 'onload' | 'onerror' | 'children' | 'title' | 'placeholder';

/** `class` and `style` go on the thumbnail element; the other attributes land on the img */
export interface ImageProps extends Omit<HTMLImgAttributes, ImgNativeKeys>, PreviewSnippets {
    src?: string;
    width?: string | number;
    height?: string | number;
    alt?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
    /** A string is the src of the image shown when loading fails; a snippet renders instead of it */
    fallback?: string | Snippet;
    placeholder?: Snippet;
    preview?: boolean | ImagePreviewProps;
    classNames?: Partial<Record<ImagePart, ClassValue>>;
    styles?: Partial<Record<ImagePart, string>>;
    setDownloadName?: (src: string) => string;
    onLoad?: (event: Event) => void;
    onError?: (event: Event) => void;
}

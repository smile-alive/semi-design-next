import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLImgAttributes } from 'svelte/elements';
import type { RatioType } from '@fibrae/semi-foundation/image/preview-inner-foundation';

export type { RatioType, RotateDirection, SwitchDirection } from '@fibrae/semi-foundation/image/preview-inner-foundation';

/** The preview's data and callbacks, shared by a group (`ImagePreview`) and the `preview` object of a single `Image` */
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
    /** One per entry of `src`; the alt of the shown preview image */
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
    previewCls?: string;
    previewStyle?: string;
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

/** The `preview` object of a single Image: its custom nodes go through Image's snippets */
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
    /** Renders the default footer items in order: prev, page, next, zoom out, slider, zoom in, ratio, rotate, download */
    menuItems: Snippet;
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
    /** The shown image's title, else `previewTitle` */
    title: string | undefined;
    index: number;
}

export interface ImagePreviewIconSnippetProps {
    index: number;
}

/** Custom nodes of the preview; on Image they apply to its own preview only, not inside a group */
export interface PreviewSnippets {
    /** Replaces the title text; the dialog keeps its name */
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
    /** Whether the images of the group wait for the viewport before they load */
    lazyLoad?: boolean;
    /** Margin around the viewport within which a lazy image of the group starts loading */
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
    /** Shown while the image loads, instead of the skeleton */
    placeholder?: Snippet;
    preview?: boolean | ImagePreviewProps;
    imgStyle?: string;
    imgCls?: string;
    setDownloadName?: (src: string) => string;
    onLoad?: (event: Event) => void;
    onError?: (event: Event) => void;
}

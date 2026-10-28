import type { JSX } from 'solid-js';
import type { PreviewGroupImage } from '@fibrae/semi-foundation/image/preview-foundation';
import type { RatioType, RotateDirection } from '@fibrae/semi-foundation/image/preview-inner-foundation';
import type { ElementProps } from '../_base/element-props';

export type { RatioType } from '@fibrae/semi-foundation/image/preview-inner-foundation';

type Style = JSX.CSSProperties | string;

/** `class` and `style` go on the thumbnail element; `ref` and the other undeclared attributes land on the img */
export interface ImageProps extends ElementProps<'img', 'width' | 'height' | 'crossOrigin' | 'style' | 'onLoad' | 'onError'> {
    src?: string;
    width?: string | number;
    height?: string | number;
    alt?: string;
    placeholder?: JSX.Element;
    /** A string is the src of a fallback image */
    fallback?: JSX.Element;
    preview?: boolean | ImagePreviewProps;
    crossOrigin?: 'anonymous' | 'use-credentials';
    setDownloadName?: (src: string) => string;
    style?: Style;
    imgStyle?: Style;
    imgCls?: string;
    onLoad?: JSX.EventHandlerUnion<HTMLImageElement, Event>;
    onError?: JSX.EventHandlerUnion<HTMLImageElement, Event>;
}

/** The props a single Image reads; class and style are replaced by previewCls and previewStyle */
export type ImagePreviewProps = Omit<PreviewProps, 'lazyLoad' | 'lazyLoadMargin' | 'children' | 'class' | 'style'>;

export interface PreviewProps extends ElementProps<'div', 'onChange'> {
    visible?: boolean;
    src?: string | string[];
    previewTitle?: JSX.Element;
    currentIndex?: number;
    defaultCurrentIndex?: number;
    defaultVisible?: boolean;
    maskClosable?: boolean;
    closable?: boolean;
    zoomStep?: number;
    infinite?: boolean;
    showTooltip?: boolean;
    closeOnEsc?: boolean;
    prevTip?: string;
    nextTip?: string;
    zoomInTip?: string;
    zoomOutTip?: string;
    rotateTip?: string;
    downloadTip?: string;
    adaptiveTip?: string;
    originTip?: string;
    lazyLoad?: boolean;
    lazyLoadMargin?: string;
    preLoad?: boolean;
    preLoadGap?: number;
    viewerVisibleDelay?: number;
    disableDownload?: boolean;
    zIndex?: number;
    children?: JSX.Element;
    crossOrigin?: 'anonymous' | 'use-credentials';
    maxZoom?: number;
    minZoom?: number;
    previewCls?: string;
    previewStyle?: Style;
    initialZoom?: number;
    renderLeftIcon?: JSX.Element | ((index: number) => JSX.Element);
    renderRightIcon?: JSX.Element | ((index: number) => JSX.Element);
    renderCloseIcon?: JSX.Element | (() => JSX.Element);
    renderHeader?: (title: JSX.Element) => JSX.Element;
    renderPreviewMenu?: (props: MenuProps) => JSX.Element;
    getPopupContainer?: () => HTMLElement;
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
    setDownloadName?: (src: string) => string;
}

export interface PreviewInnerProps extends Omit<PreviewProps, 'previewCls' | 'previewStyle'> {
    /** alt of the previewed image, for a single Image; a group passes its images' alts by context */
    alt?: string;
}

/** Read live: the fields are getters, so a menu rendered once keeps up with the preview */
export interface MenuProps {
    min?: number;
    max?: number;
    step?: number;
    curPage?: number;
    totalNum?: number;
    zoom?: number;
    ratio?: RatioType;
    disabledPrev?: boolean;
    disabledNext?: boolean;
    disabledZoomIn?: boolean;
    disabledZoomOut?: boolean;
    disableDownload?: boolean;
    menuItems?: JSX.Element[];
    onDownload?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onRatioClick?: () => void;
    onRotateLeft?: () => void;
    onRotateRight?: () => void;
}

export interface HeaderProps {
    closable: boolean;
    renderHeader?: (title: JSX.Element) => JSX.Element;
    title?: JSX.Element;
    /** id of the title section, which names the preview dialog */
    titleId?: string;
    class?: string;
    onClose?: (e: MouseEvent) => void;
    renderCloseIcon?: JSX.Element | (() => JSX.Element);
    ref?: (element: HTMLElement) => void;
}

export interface FooterProps {
    min?: number;
    max?: number;
    step?: number;
    curPage?: number;
    totalNum?: number;
    disabledPrev?: boolean;
    disabledNext?: boolean;
    disableDownload?: boolean;
    class?: string;
    zoom?: number;
    ratio?: RatioType;
    prevTip?: string;
    nextTip?: string;
    zoomInTip?: string;
    zoomOutTip?: string;
    rotateTip?: string;
    downloadTip?: string;
    adaptiveTip?: string;
    originTip?: string;
    showTooltip?: boolean;
    onZoomIn?: (zoom: number) => void;
    onZoomOut?: (zoom: number) => void;
    onPrev?: () => void;
    onNext?: () => void;
    onAdjustRatio?: (type: RatioType) => void;
    onRotate?: (direction: RotateDirection) => void;
    onDownload?: () => void;
    renderPreviewMenu?: (props: MenuProps) => JSX.Element;
    ref?: (element: HTMLElement) => void;
}

export interface PreviewImageProps {
    src?: string;
    alt?: string;
    rotation?: number;
    maxZoom?: number;
    minZoom?: number;
    zoom?: number;
    ratio?: RatioType;
    disableDownload?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    initialZoom?: number;
    onZoom?: (zoom: number, reportToUser?: boolean) => void;
    onLoad?: (src: string) => void;
    onError?: (src: string) => void;
}

export interface GroupImage extends PreviewGroupImage {
    title?: JSX.Element;
}

export interface PreviewState {
    currentIndex: number;
    visible: boolean;
    images: GroupImage[];
}

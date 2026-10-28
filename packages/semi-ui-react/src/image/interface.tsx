import React, { type ReactNode } from 'react';
import type { PreviewGroupImage } from '@fibrae/semi-foundation/image/preview-foundation';
import type { RatioType, RotateDirection } from '@fibrae/semi-foundation/image/preview-inner-foundation';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';

export type { RatioType } from '@fibrae/semi-foundation/image/preview-inner-foundation';

export interface ImageProps extends BaseProps, React.ImgHTMLAttributes<HTMLImageElement> {
    /** Attached to the img, where undeclared attributes land too */
    ref?: React.Ref<HTMLImageElement>;
    src?: string;
    width?: string | number;
    height?: string | number;
    alt?: string;
    placeholder?: ReactNode;
    fallback?: string | ReactNode;
    preview?: boolean | ImagePreviewProps;
    onClick?: (event: any) => void;
    crossOrigin?: 'anonymous' | 'use-credentials';
    children?: ReactNode;
    setDownloadName?: (src: string) => string;
    imgStyle?: React.CSSProperties;
    imgCls?: string;
}

/** The props a single Image reads; className and style are replaced by previewCls and previewStyle */
export type ImagePreviewProps = Omit<PreviewProps, 'lazyLoad' | 'lazyLoadMargin' | 'children' | 'className' | 'style'>;

export interface PreviewProps extends BaseProps, ElementProps<'div', 'onChange'> {
    visible?: boolean;
    src?: string | string[];
    previewTitle?: ReactNode;
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
    children?: ReactNode;
    crossOrigin?: 'anonymous' | 'use-credentials';
    maxZoom?: number;
    minZoom?: number;
    previewCls?: string;
    previewStyle?: React.CSSProperties;
    initialZoom?: number;
    renderLeftIcon?: React.ReactElement | ((index: number) => React.ReactElement);
    renderRightIcon?: React.ReactElement | ((index: number) => React.ReactElement);
    renderCloseIcon?: React.ReactElement | (() => React.ReactElement);
    renderHeader?: (info: any) => ReactNode;
    renderPreviewMenu?: (props: MenuProps) => ReactNode;
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
    menuItems?: ReactNode[];
    onDownload?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onRatioClick?: () => void;
    onRotateLeft?: () => void;
    onRotateRight?: () => void;
}

export interface SliderProps {
    max?: number;
    min?: number;
    step?: number;
}

export interface HeaderProps {
    closable: boolean;
    renderHeader?: (info: any) => ReactNode;
    title?: ReactNode;
    /** id of the title section, which names the preview dialog */
    titleId?: string;
    titleStyle?: React.CSSProperties;
    className?: string;
    onClose?: (e: React.MouseEvent<HTMLElement>) => void;
    renderCloseIcon?: React.ReactElement | (() => React.ReactElement);
    /** Attached to the header section */
    ref?: React.Ref<HTMLElement>;
}

export interface FooterProps extends SliderProps {
    curPage?: number;
    totalNum?: number;
    disabledPrev?: boolean;
    disabledNext?: boolean;
    disableDownload?: boolean;
    className?: string;
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
    renderPreviewMenu?: (props: MenuProps) => ReactNode;
    /** Attached to the footer section */
    ref?: React.Ref<HTMLElement>;
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
    title?: ReactNode;
}

export interface PreviewState {
    currentIndex: number;
    visible: boolean;
    images: GroupImage[];
}

import type React from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { omit, pick } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
import PreviewFoundation, { type PreviewAdapter, getGroupPreviewList, loadLazyImages } from '@fibrae/semi-foundation/components/image/preview-foundation';
import '@fibrae/semi-foundation/components/image/image.scss';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useIntersectionObserver from '../_base/use-intersection-observer';
import useMergedRef from '../_base/use-merged-ref';
import type { PreviewProps, PreviewState } from './interface';
import { PreviewContext } from './preview-context';
import PreviewInner from './preview-inner';

type Foundation = PreviewFoundation<PreviewProps, PreviewState>;
type Adapter = PreviewAdapter<PreviewProps, PreviewState>;

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    src: [],
    lazyLoad: true,
    lazyLoadMargin: '0px 100px 100px 0px',
    closable: true,
} satisfies Partial<PreviewProps>;

const innerKeys = [
    'previewTitle',
    'maskClosable',
    'closable',
    'zoomStep',
    'infinite',
    'showTooltip',
    'closeOnEsc',
    'prevTip',
    'nextTip',
    'zoomInTip',
    'zoomOutTip',
    'rotateTip',
    'downloadTip',
    'adaptiveTip',
    'originTip',
    'preLoad',
    'preLoadGap',
    'viewerVisibleDelay',
    'disableDownload',
    'zIndex',
    'crossOrigin',
    'maxZoom',
    'minZoom',
    'initialZoom',
    'renderLeftIcon',
    'renderRightIcon',
    'renderCloseIcon',
    'renderHeader',
    'renderPreviewMenu',
    'getPopupContainer',
    'onClose',
    'onZoomIn',
    'onZoomOut',
    'onPrev',
    'onNext',
    'onRatioChange',
    'onRotateLeft',
    'onDownload',
    'onDownloadError',
] as const satisfies readonly (keyof PreviewProps)[];

export default function ImagePreview(rawProps: PreviewProps & { ref?: React.Ref<HTMLDivElement> }) {
    const props = useDefaultProps('ImagePreview', rawProps, defaultProps);

    const {
        ref,
        src,
        className,
        style,
        lazyLoad,
        lazyLoadMargin,
        setDownloadName,
        children,
        previewCls,
        previewStyle,
        currentIndex: currentIndexProp,
        defaultCurrentIndex,
        visible: visibleProp,
        defaultVisible,
        onVisibleChange,
        // the group notifies through setCurrentIndex; PreviewInner calling it too would report each switch twice
        onChange,
        ...others
    } = props;

    const groupRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, PreviewProps, PreviewState>(
        PreviewFoundation,
        props,
        () => PreviewFoundation.getInitialState(props),
        (base) => ({
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            notifyChange: (index) => base.getProps().onChange?.(index),
        })
    );

    const mergedRef = useMergedRef(ref, groupRef);
    const currentIndex = currentIndexProp === undefined ? state.currentIndex : currentIndexProp;
    const visible = visibleProp === undefined ? state.visible : visibleProp;
    const { srcList, titles, alts } = useMemo(() => getGroupPreviewList(src, state.images), [src, state.images]);

    // children come from props and skip re-rendering, so a stable value keeps every Image in the group from
    // re-rendering when only the current index or visibility changes
    const contextValue = useMemo(
        () => ({
            isGroup: true,
            titles,
            alts,
            lazyLoad,
            setCurrentIndex: foundation.handleCurrentIndexChange,
            setDownloadName: setDownloadName,
            registerImage: foundation.registerImage,
            unregisterImage: foundation.unregisterImage,
            openImage: foundation.openImage,
        }),
        [titles, alts, lazyLoad, setDownloadName, foundation]
    );

    useLayoutEffect(() => {
        foundation.syncImageOrder();
    });

    // a lazy img gets its src from the observer and every Image re-registers, so a new list is observed again.
    // The viewport is the root: a non-scrolling group element as root would intersect all of its own images
    useIntersectionObserver(() => (lazyLoad && state.images.length ? groupRef.current.querySelectorAll(`.${prefixCls}-img`) : []), loadLazyImages, { rootMargin: lazyLoadMargin }, lazyLoad && state.images);

    return (
        <PreviewContext value={contextValue}>
            <div role={namedRole(others)} {...omit(others, innerKeys)} ref={mergedRef} className={clsx(`${prefixCls}-preview-group`, className)} style={style}>
                {children}
            </div>
            <PreviewInner {...pick(others, innerKeys)} className={previewCls} style={previewStyle} currentIndex={currentIndex} src={srcList} visible={visible} onVisibleChange={foundation.handleVisibleChange} />
        </PreviewContext>
    );
}

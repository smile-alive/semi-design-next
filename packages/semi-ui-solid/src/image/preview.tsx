import { type JSX, createMemo, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import PreviewFoundation, { type PreviewAdapter, getGroupPreviewList, loadLazyImages } from '@fibrae/semi-foundation/image/preview-foundation';
import '@fibrae/semi-foundation/image/image.scss';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useIntersectionObserver from '../_base/use-intersection-observer';
import useMutationObserver from '../_base/use-mutation-observer';
import { PreviewContext, type PreviewContextValue } from './context';
import type { PreviewProps, PreviewState } from './interface';
import PreviewInner from './preview-inner';

type Foundation = PreviewFoundation<PreviewProps, PreviewState>;
type Adapter = PreviewAdapter<PreviewProps, PreviewState>;

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    src: [] as string[],
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

export default function ImagePreview(rawProps: PreviewProps) {
    const props = useDefaultProps('ImagePreview', rawProps, defaultProps);

    // onChange stays out of the inner preview: the group reports each switch through setCurrentIndex
    const [local, inner, rest] = splitProps(props, ['children', 'class', 'currentIndex', 'defaultCurrentIndex', 'defaultVisible', 'lazyLoad', 'lazyLoadMargin', 'onChange', 'onVisibleChange', 'previewCls', 'previewStyle', 'ref', 'setDownloadName', 'src', 'style', 'visible'], innerKeys);

    let group: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, PreviewProps, PreviewState>(
        PreviewFoundation,
        props,
        (initial) => ({
            currentIndex: initial.currentIndex || initial.defaultCurrentIndex || 0,
            visible: initial.visible || initial.defaultVisible || false,
            images: [],
        }),
        (base) => ({
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            notifyChange: (index) => base.getProps().onChange?.(index),
        })
    );

    const list = createMemo(() => getGroupPreviewList(local.src, state().images));

    // a lazy img gets its src from the observer and every Image re-registers on change, so a new list is observed
    // again; a loaded img has no data-src left and is skipped
    const lazyTargets = createMemo(() => (local.lazyLoad && state().images.length && group ? [...group.querySelectorAll(`.${prefixCls}-img`)] : []));
    const view = createMemo(() => ({ lazyLoad: local.lazyLoad, titles: list().titles, alts: list().alts, setDownloadName: local.setDownloadName }));

    const currentIndex = () => (local.currentIndex === undefined ? state().currentIndex : local.currentIndex);

    const visible = () => (local.visible === undefined ? state().visible : local.visible);

    const context: PreviewContextValue = {
        view,
        setCurrentIndex: foundation.handleCurrentIndexChange,
        registerImage: foundation.registerImage,
        unregisterImage: foundation.unregisterImage,
        openImage: foundation.openImage,
    };

    // The viewport is the root: a non-scrolling group element as root would intersect all of its own images
    useIntersectionObserver(lazyTargets, loadLazyImages, () => ({ root: null, rootMargin: local.lazyLoadMargin }));

    // Images moved without remounting do not register again; the group re-reads their document order
    useMutationObserver(
        () => group,
        () => foundation.syncImageOrder(),
        { childList: true, subtree: true }
    );

    return (
        <PreviewContext.Provider value={context}>
            {/* the Provider's children memo tracks the ref read; a spread props signal would rebuild the group and the open preview */}
            <div {...rest} ref={untrack(() => mergeRefs(local.ref, (node: HTMLDivElement) => (group = node)))} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']} class={clsx(`${prefixCls}-preview-group`, local.class)} style={local.style}>
                {local.children}
            </div>
            <PreviewInner {...inner} class={local.previewCls} style={local.previewStyle} currentIndex={currentIndex()} src={list().srcList} visible={visible()} onVisibleChange={(isVisible) => foundation.handleVisibleChange(isVisible)} />
        </PreviewContext.Provider>
    );
}

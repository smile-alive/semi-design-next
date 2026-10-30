<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewFoundation, { getGroupPreviewList, type PreviewAdapter, type PreviewBaseState } from '@fibrae/semi-foundation/image/preview-foundation';
    import '@fibrae/semi-foundation/image/image.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { setPreviewContext } from './context.js';
    import { previewDefaults } from './defaults.js';
    import type { PreviewProps } from './interface.js';
    import PreviewInner from './preview-inner.svelte';

    type Foundation = PreviewFoundation<PreviewProps, PreviewBaseState>;
    type Adapter = PreviewAdapter<PreviewProps, PreviewBaseState>;

    const defaults = useDefaultProps('ImagePreview');

    // No fallback on `visible` and `currentIndex`: a bound `undefined` would throw with one, and undefined means closed, first
    let {
        src = defaults('src', []),
        visible = $bindable(),
        currentIndex = $bindable(),
        previewTitle = defaults('previewTitle'),
        titles = defaults('titles'),
        alts = defaults('alts'),
        lazyLoad = defaults('lazyLoad', true),
        lazyLoadMargin = defaults('lazyLoadMargin', '0px 100px 100px 0px'),
        maskClosable = defaults('maskClosable', previewDefaults.maskClosable),
        closable = defaults('closable', previewDefaults.closable),
        closeOnEsc = defaults('closeOnEsc', previewDefaults.closeOnEsc),
        infinite = defaults('infinite', previewDefaults.infinite),
        showTooltip = defaults('showTooltip', previewDefaults.showTooltip),
        preLoad = defaults('preLoad', previewDefaults.preLoad),
        preLoadGap = defaults('preLoadGap', previewDefaults.preLoadGap),
        viewerVisibleDelay = defaults('viewerVisibleDelay', previewDefaults.viewerVisibleDelay),
        zoomStep = defaults('zoomStep', previewDefaults.zoomStep),
        maxZoom = defaults('maxZoom', previewDefaults.maxZoom),
        minZoom = defaults('minZoom', previewDefaults.minZoom),
        zIndex = defaults('zIndex', previewDefaults.zIndex),
        disableDownload = defaults('disableDownload', previewDefaults.disableDownload),
        initialZoom = defaults('initialZoom'),
        crossOrigin = defaults('crossOrigin'),
        previewCls = defaults('previewCls'),
        previewStyle = defaults('previewStyle'),
        prevTip = defaults('prevTip'),
        nextTip = defaults('nextTip'),
        zoomInTip = defaults('zoomInTip'),
        zoomOutTip = defaults('zoomOutTip'),
        rotateTip = defaults('rotateTip'),
        downloadTip = defaults('downloadTip'),
        adaptiveTip = defaults('adaptiveTip'),
        originTip = defaults('originTip'),
        getPopupContainer = defaults('getPopupContainer'),
        setDownloadName = defaults('setDownloadName'),
        children,
        title,
        previewMenu,
        leftIcon,
        rightIcon,
        closeIcon,
        onVisibleChange,
        onChange,
        onClose,
        onZoomIn,
        onZoomOut,
        onPrev,
        onNext,
        onRatioChange,
        onRotateLeft,
        onDownload,
        onDownloadError,
        ...rest
    }: PreviewProps = $props();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const { foundation } = useFoundation<Foundation, Adapter, PreviewProps, PreviewBaseState>(
        PreviewFoundation,
        {
            get src() {
                return src;
            },
            get visible() {
                return visible;
            },
            get currentIndex() {
                return currentIndex;
            },
        },
        () => ({}),
        () => ({
            // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
            notifyVisibleChange: (next) => {
                visible = next;
                onVisibleChange?.(next);
            },
            notifyChange: (index) => {
                currentIndex = index;
                onChange?.(index);
            },
        })
    );

    const prefixCls = cssClasses.PREFIX;
    const srcList = $derived(getGroupPreviewList(src, []).srcList);

    const handleOpen = (index: number) => {
        foundation.handleCurrentIndexChange(index);
        foundation.handleVisibleChange(true);
    };

    setPreviewContext({
        get srcList() {
            return srcList;
        },
        get lazyLoad() {
            return lazyLoad;
        },
        get lazyLoadMargin() {
            return lazyLoadMargin;
        },
        open: handleOpen,
    });
</script>

<div {...rest} class={[`${prefixCls}-preview-group`, rest.class]} role={groupRole(rest)}>
    {@render children?.()}
    <PreviewInner
        {adaptiveTip}
        {alts}
        {closable}
        {closeIcon}
        {closeOnEsc}
        {crossOrigin}
        currentIndex={currentIndex ?? 0}
        {disableDownload}
        {downloadTip}
        {getPopupContainer}
        {infinite}
        {initialZoom}
        {leftIcon}
        {maskClosable}
        {maxZoom}
        {minZoom}
        {nextTip}
        {onClose}
        {onDownload}
        {onDownloadError}
        {onNext}
        {onPrev}
        {onRatioChange}
        {onRotateLeft}
        onVisibleChange={foundation.handleVisibleChange}
        {onZoomIn}
        {onZoomOut}
        {originTip}
        {preLoad}
        {preLoadGap}
        {prevTip}
        {previewCls}
        {previewMenu}
        {previewStyle}
        {previewTitle}
        {rightIcon}
        {rotateTip}
        setCurrentIndex={foundation.handleCurrentIndexChange}
        {setDownloadName}
        {showTooltip}
        src={srcList}
        {title}
        {titles}
        {viewerVisibleDelay}
        visible={Boolean(visible)}
        {zIndex}
        {zoomInTip}
        {zoomOutTip}
        {zoomStep}
    />
</div>

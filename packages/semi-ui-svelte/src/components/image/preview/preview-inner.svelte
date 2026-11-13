<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
    import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerBaseProps, type PreviewInnerState } from '@fibrae/semi-foundation/components/image/preview-inner-foundation';
    import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-svelte';
    import { useFoundation } from '../../../base/index.js';
    import { useOverlayResources } from '../../../hooks/index.js';
    import { Portal } from '../../../internal/index.js';
    import { getConfigContext } from '../../config-provider/context.js';
    import useLocale from '../../locale/use-locale.svelte.js';
    import type { PreviewOptions, PreviewSnippets } from '../interface.js';
    import { previewDefaults } from './defaults.js';
    import PreviewFooter from './preview-footer.svelte';
    import PreviewHeader from './preview-header.svelte';
    import PreviewImage from './preview-image.svelte';

    // Internal: Image and ImagePreview have already filled the global defaults
    interface Props extends PreviewOptions, PreviewSnippets {
        visible: boolean;
        alt?: string;
        /** Given by a group, which owns the index: a controlled index changes through it */
        setCurrentIndex?: (index: number) => void;
    }

    type Foundation = PreviewInnerFoundation<PreviewInnerBaseProps>;
    type Adapter = PreviewInnerAdapter<PreviewInnerBaseProps>;

    let {
        visible,
        src,
        currentIndex: controlledIndex,
        alt,
        alts,
        previewTitle,
        titles,
        previewCls,
        previewStyle,
        getPopupContainer,
        setDownloadName,
        crossOrigin,
        initialZoom,
        prevTip,
        nextTip,
        zoomInTip,
        zoomOutTip,
        rotateTip,
        downloadTip,
        adaptiveTip,
        originTip,
        showTooltip = previewDefaults.showTooltip,
        zoomStep = previewDefaults.zoomStep,
        infinite = previewDefaults.infinite,
        closable = previewDefaults.closable,
        closeOnEsc = previewDefaults.closeOnEsc,
        preLoad = previewDefaults.preLoad,
        preLoadGap = previewDefaults.preLoadGap,
        zIndex = previewDefaults.zIndex,
        maskClosable = previewDefaults.maskClosable,
        viewerVisibleDelay = previewDefaults.viewerVisibleDelay,
        maxZoom = previewDefaults.maxZoom,
        minZoom = previewDefaults.minZoom,
        disableDownload = previewDefaults.disableDownload,
        setCurrentIndex,
        title: titleSnippet,
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
    }: Props = $props();

    const config = getConfigContext();
    const locale = useLocale('Image');

    const uid = $props.id();
    let wrapEl = $state.raw<HTMLDivElement | null>(null);
    let header = $state.raw<ReturnType<typeof PreviewHeader> | null>(null);
    let footer = $state.raw<ReturnType<typeof PreviewFooter> | null>(null);
    let leftButton = $state.raw<HTMLButtonElement | null>(null);
    let rightButton = $state.raw<HTMLButtonElement | null>(null);

    const { foundation, states } = useFoundation<Foundation, Adapter, PreviewInnerBaseProps, PreviewInnerState>(
        PreviewInnerFoundation,
        {
            get closeOnEsc() {
                return closeOnEsc;
            },
            get src() {
                return src;
            },
            get zoomStep() {
                return zoomStep;
            },
            get maxZoom() {
                return maxZoom;
            },
            get minZoom() {
                return minZoom;
            },
            get preLoad() {
                return preLoad;
            },
            get preLoadGap() {
                return preLoadGap;
            },
            get infinite() {
                return infinite;
            },
            get viewerVisibleDelay() {
                return viewerVisibleDelay;
            },
            get visible() {
                return visible;
            },
            get maskClosable() {
                return maskClosable;
            },
            get currentIndex() {
                return controlledIndex;
            },
            get setDownloadName() {
                return setDownloadName;
            },
        },
        (view) => PreviewInnerFoundation.getInitialState(view),
        () => ({
            notifyChange: (index, direction) => {
                onChange?.(index);
                if (direction === 'prev') {
                    onPrev?.(index);
                } else {
                    onNext?.(index);
                }
            },
            notifyZoom: (zoom, increase) => (increase ? onZoomIn?.(zoom) : onZoomOut?.(zoom)),
            notifyClose: () => onClose?.(),
            notifyVisibleChange: (next) => onVisibleChange?.(next),
            notifyRatioChange: (type) => onRatioChange?.(type),
            notifyRotateChange: (angle) => onRotateLeft?.(angle),
            notifyDownload: (source, index) => onDownload?.(source, index),
            notifyDownloadError: (source) => onDownloadError?.(source),
            getWrap: () => wrapEl,
            isOutsideControls: ({ target }: Event) => !(target instanceof Node && [header?.getRoot(), footer?.getRoot(), leftButton, rightButton].some((element) => element?.contains(target))),
        }),
        {
            context: () => ({ setCurrentIndex, direction: config.direction, popupContainer: getPopupContainer ?? config.getPopupContainer }),
        }
    );

    const cls = `${cssClasses.PREFIX}-preview`;
    const srcList = $derived(PreviewInnerFoundation.getSrcList(src!));
    const total = $derived(srcList.length);
    const currentIndex = $derived(PreviewInnerFoundation.getCurrentIndex({ currentIndex: controlledIndex }, states()));
    const ratio = $derived(PreviewInnerFoundation.getRatio({ currentIndex: controlledIndex }, states()));
    const showPrev = $derived(PreviewInnerFoundation.canSwitch('prev', currentIndex, total, infinite));
    const showNext = $derived(PreviewInnerFoundation.canSwitch('next', currentIndex, total, infinite));
    const title = $derived(titles?.[currentIndex] ?? previewTitle);
    const hasTitle = $derived(title != null && title !== '');

    // 0.29 * 100 is 28.999999999999996, which the slider would read out
    const toPercent = (value: number) => Number((value * 100).toFixed(2));

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    // Recorded before the preview renders, or its own focus would be recorded
    useOverlayResources(
        foundation,
        () => visible,
        () => Boolean(visible && wrapEl)
    );
</script>

{#if visible}
    <Portal {getPopupContainer} {zIndex}>
        {#snippet children({ inBody })}
            <div
                aria-label={hasTitle ? undefined : locale().locale.preview}
                aria-labelledby={hasTitle ? `${uid}-title` : undefined}
                aria-modal={inBody ? 'true' : undefined}
                bind:this={wrapEl}
                class={[cls, { [`${cls}-popup`]: !inBody }, previewCls]}
                role="dialog"
                style={previewStyle}
                tabindex="-1"
                onfocusin={foundation.handleKeyboardActivity}
                onmousedown={foundation.handleMouseDown}
                onmousemove={foundation.handleMouseMove}
                onmouseup={foundation.handleMouseUp}
                onwheel={foundation.handleWheel}
            >
                <PreviewHeader bind:this={header} {closable} {closeIcon} hidden={!states().controlsVisible} index={currentIndex} onClose={foundation.handlePreviewClose} {title} titleId={`${uid}-title`} {titleSnippet} />
                <PreviewImage
                    alt={alts?.[currentIndex] ?? alt}
                    {crossOrigin}
                    {disableDownload}
                    {initialZoom}
                    {maxZoom}
                    {minZoom}
                    onError={foundation.preloadSingleImage}
                    onLoad={foundation.onImageLoad}
                    onZoom={(zoom, reportToUser) => foundation.handleZoomImage(zoom, reportToUser)}
                    {ratio}
                    rotation={states().rotation!}
                    src={srcList[currentIndex]}
                    zoom={states().zoom!}
                    zoomEvent={states().zoomEvent}
                />
                {#if showPrev}
                    <button aria-label={prevTip ?? locale().locale.prevTip} bind:this={leftButton} class={[`${cls}-icon`, `${cls}-prev`, { [`${cls}-hide`]: !states().controlsVisible }]} type="button" onclick={handlePrev}>
                        {#if leftIcon}
                            {@render leftIcon({ index: currentIndex })}
                        {:else}
                            <IconArrowLeft size="large" />
                        {/if}
                    </button>
                {/if}
                {#if showNext}
                    <button aria-label={nextTip ?? locale().locale.nextTip} bind:this={rightButton} class={[`${cls}-icon`, `${cls}-next`, { [`${cls}-hide`]: !states().controlsVisible }]} type="button" onclick={handleNext}>
                        {#if rightIcon}
                            {@render rightIcon({ index: currentIndex })}
                        {:else}
                            <IconArrowRight size="large" />
                        {/if}
                    </button>
                {/if}
                <PreviewFooter
                    {adaptiveTip}
                    bind:this={footer}
                    curPage={currentIndex + 1}
                    {disableDownload}
                    disabledNext={!showNext}
                    disabledPrev={!showPrev}
                    {downloadTip}
                    hidden={!states().controlsVisible}
                    max={toPercent(maxZoom)}
                    min={toPercent(minZoom)}
                    {nextTip}
                    onAdjustRatio={foundation.handleAdjustRatio}
                    onDownload={foundation.handleDownload}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onRotate={foundation.handleRotateImage}
                    onZoomIn={(zoom) => foundation.handleZoomImage(zoom)}
                    onZoomOut={(zoom) => foundation.handleZoomImage(zoom)}
                    {originTip}
                    {prevTip}
                    {previewMenu}
                    {ratio}
                    {rotateTip}
                    {showTooltip}
                    step={toPercent(zoomStep)}
                    totalNum={total}
                    zoom={toPercent(states().zoom!)}
                    {zoomInTip}
                    {zoomOutTip}
                />
            </div>
        {/snippet}
    </Portal>
{/if}

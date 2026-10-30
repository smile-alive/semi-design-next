<script lang="ts">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerBaseProps, type PreviewInnerBaseState } from '@fibrae/semi-foundation/image/preview-inner-foundation';
    import { coversPage } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
    import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-svelte';
    import Portal from '../_base/portal.svelte';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { previewDefaults } from './defaults.js';
    import type { PreviewOptions, PreviewSnippets, RatioType } from './interface.js';
    import PreviewFooter from './preview-footer.svelte';
    import PreviewHeader from './preview-header.svelte';
    import PreviewImage from './preview-image.svelte';

    // Internal: Image and ImagePreview have already filled the global defaults
    interface Props extends PreviewOptions, PreviewSnippets {
        visible: boolean;
        /** The alt of the previewed image when `alts` has no entry for it, for a single Image */
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

    // The index a ratio was set at: an index change brings the ratio back to fit in the same render as the new src, so
    // the image leaving is not re-fitted
    let ratioState = $state.raw<{ index: number; ratio: RatioType }>({ index: -1, ratio: 'adaptation' });
    let previousList = untrack(() => PreviewInnerFoundation.getSrcList(src as string | string[]));
    const scroll = new ReleaseHolder();
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();

    // Read once per show: only a preview over the whole page is modal (aria-modal, inert page, scroll lock, Tab trap,
    // focus return)
    let modal = false;

    const { foundation, states } = useFoundation<Foundation, Adapter, PreviewInnerBaseProps, PreviewInnerBaseState>(
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
        },
        () => ({ imgLoadStatus: {}, zoom: 0.1, currentIndex: 0, rotation: 0, viewerVisible: true, preloadAfterVisibleChange: true }),
        (base) => ({
            getIsInGroup: () => Boolean(setCurrentIndex),
            disabledBodyScroll: () => (modal ? scroll.hold(lockBodyScroll) : scroll.release()),
            enabledBodyScroll: () => scroll.release(),
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
            registerKeyDownListener: () => window.addEventListener('keydown', handleKeyDown),
            unregisterKeyDownListener: () => window.removeEventListener('keydown', handleKeyDown),
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: wrapEl as HTMLDivElement, modal, onEscape })),
            closeLayer: () => layer.release(),
            getSetDownloadFunc: () => setDownloadName as (source: string) => string,
            isValidTarget: ({ target }: Event) => !(target instanceof Node && [header?.getRoot(), footer?.getRoot(), leftButton, rightButton].some((element) => element?.contains(target))),
            isEventInPreview: (event) => !(event.target instanceof Element) || event.target === document.body || Boolean(wrapEl?.contains(event.target)),
            setRatio: (ratio) => {
                ratioState = { index: PreviewInnerFoundation.getCurrentIndex(base.getProps(), base.getStates()), ratio };
            },
        }),
        {
            context: () => ({ isGroup: Boolean(setCurrentIndex), setCurrentIndex, direction: config.direction }),
        }
    );

    const cls = `${cssClasses.PREFIX}-preview`;
    const srcList = $derived(PreviewInnerFoundation.getSrcList(src as string | string[]));
    const total = $derived(srcList.length);
    const currentIndex = $derived(PreviewInnerFoundation.getCurrentIndex({ currentIndex: controlledIndex }, states()));
    const ratio = $derived(ratioState.index === currentIndex ? ratioState.ratio : 'adaptation');
    const showPrev = $derived(PreviewInnerFoundation.canSwitch('prev', currentIndex, total, infinite));
    const showNext = $derived(PreviewInnerFoundation.canSwitch('next', currentIndex, total, infinite));
    const title = $derived(titles?.[currentIndex] ?? previewTitle);
    const hasTitle = $derived(title != null && title !== '');

    // 0.29 * 100 is 28.999999999999996, which the slider would read out
    const toPercent = (value: number) => Number((value * 100).toFixed(2));

    // stable reference: the listener added on show is the one removed on hide
    const handleKeyDown = (event: KeyboardEvent) => foundation.handleKeyDown(event);

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    // Recorded before the preview renders, or its own focus would be recorded
    $effect.pre(() => {
        if (visible) {
            untrack(() => focusScope.record());
        }
    });

    // The preview takes the layer, scroll lock and focus once its dialog is in the document
    $effect(() => {
        const element = wrapEl;
        if (!visible || !element) {
            return;
        }
        untrack(() => {
            modal = coversPage(getPopupContainer ?? config.getPopupContainer);
            foundation.beforeShow();
            // Browsers skip autofocus on elements inserted after page load
            if (!element.contains(FocusTrapHandle.getActiveElement(element))) {
                FocusTrapHandle.findAutofocus(element)?.focus({ preventScroll: true });
            }
            focusScope.engage(element, modal, true);
        });
        return () => {
            // afterHide releases the inert around the preview first, so the opener can take focus again
            foundation.afterHide();
            focusScope.deactivate();
        };
    });

    // After the effect above has released the inert: Svelte runs one component's effects in creation order. A non-modal
    // preview leaves focus the user moved elsewhere where it is.
    watch(
        () => visible,
        (shown) => {
            const active = FocusTrapHandle.getActiveElement();
            if (!shown && (modal || !active || active === document.body)) {
                focusScope.restore(true);
            }
        }
    );

    // by content: a group builds a new list on every change, which must not restart the delay
    watch(
        () => srcList,
        (next) => {
            if (!isEqual(previousList, next)) {
                foundation.updateTimer();
            }
            previousList = next;
        }
    );

    // A focused prev or next button disappears at the first or last image; focus stays in the dialog. Focus the user
    // moved elsewhere is left alone.
    watch(
        () => currentIndex,
        () => {
            const active = FocusTrapHandle.getActiveElement();
            if (wrapEl && (!active || active === document.body)) {
                wrapEl.focus({ preventScroll: true });
            }
        }
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
                <PreviewHeader bind:this={header} {closable} {closeIcon} hidden={!states().viewerVisible} index={currentIndex} onClose={foundation.handlePreviewClose} {title} titleId={`${uid}-title`} {titleSnippet} />
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
                    <button aria-label={prevTip ?? locale().locale.prevTip} bind:this={leftButton} class={[`${cls}-icon`, `${cls}-prev`, { [`${cls}-hide`]: !states().viewerVisible }]} type="button" onclick={handlePrev}>
                        {#if leftIcon}
                            {@render leftIcon({ index: currentIndex })}
                        {:else}
                            <IconArrowLeft size="large" />
                        {/if}
                    </button>
                {/if}
                {#if showNext}
                    <button aria-label={nextTip ?? locale().locale.nextTip} bind:this={rightButton} class={[`${cls}-icon`, `${cls}-next`, { [`${cls}-hide`]: !states().viewerVisible }]} type="button" onclick={handleNext}>
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
                    hidden={!states().viewerVisible}
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

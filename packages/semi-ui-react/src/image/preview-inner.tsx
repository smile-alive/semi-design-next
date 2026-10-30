import { type CSSProperties, isValidElement, type RefObject, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, numbers } from '@fibrae/semi-foundation/image/constants';
import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerBaseState, type RatioType } from '@fibrae/semi-foundation/image/preview-inner-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer, type Layer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-react';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useIsServerRender from '../_base/use-is-server-render';
import Portal from '../_portal';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import type { PreviewInnerProps } from './interface';
import { usePreviewContext } from './preview-context';
import Footer from './preview-footer';
import Header from './preview-header';
import PreviewImage from './preview-image';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    showTooltip: false,
    zoomStep: 0.1,
    infinite: false,
    closable: true,
    closeOnEsc: true,
    lazyLoad: false,
    preLoad: true,
    preLoadGap: 2,
    zIndex: numbers.DEFAULT_Z_INDEX,
    maskClosable: true,
    viewerVisibleDelay: 10000,
    maxZoom: 5,
    minZoom: 0.1,
} satisfies Partial<PreviewInnerProps>;

class PreviewInnerRuntime {
    #foundation: PreviewInnerFoundation | null = null;
    readonly #scroll = new ReleaseHolder();
    readonly #layer = new ReleaseHolder();
    readonly focusScope = new FocusScope();
    readonly handleKeyDown = (e: KeyboardEvent) => this.#foundation?.handleKeyDown(e);

    mount(foundation: PreviewInnerFoundation) {
        this.#foundation = foundation;
    }

    disableBodyScroll(locksBody: boolean) {
        if (locksBody) {
            this.#scroll.hold(lockBodyScroll);
        } else {
            this.#scroll.release();
        }
    }

    enableBodyScroll() {
        this.#scroll.release();
    }

    openLayer(layer: Layer) {
        this.#layer.hold(() => openLayer(layer));
    }

    closeLayer() {
        this.#layer.release();
    }
}

// 0.29 * 100 is 28.999999999999996, which the slider would read out
const toPercent = (ratio: number) => Number((ratio * 100).toFixed(2));

interface PreviewOpenEffectsProps {
    foundation: PreviewInnerFoundation;
    inBody: boolean;
    runtime: PreviewInnerRuntime;
    wrapRef: RefObject<HTMLDivElement | null>;
}

// Rendered in the Portal after the dialog, so these effects run once its DOM and refs exist: in the Portal's first
// commit, which on a hydrated page comes after hydration rather than with the preview's own mount
function PreviewOpenEffects({ foundation, inBody, runtime, wrapRef }: PreviewOpenEffectsProps) {
    // records the opener before the layout phase moves focus into the preview
    useInsertionEffect(() => runtime.focusScope.record(), [runtime]);

    useLayoutEffect(() => {
        const wrap = wrapRef.current;
        // React's onWheel is passive, but the trackpad pinch must preventDefault or the whole page zooms
        wrap.addEventListener('wheel', foundation.handleWheel, { passive: false });
        foundation.beforeShow();
        runtime.focusScope.engage(wrap, inBody, true);
        return () => {
            wrap.removeEventListener('wheel', foundation.handleWheel);
            // afterHide releases the inert around the preview first, so the opener can take focus again
            foundation.afterHide();
            runtime.focusScope.deactivate();
        };
    }, [inBody, foundation, runtime, wrapRef]);

    return null;
}

export default function PreviewInner(rawProps: PreviewInnerProps) {
    // internal component: fill undefined props from defaultProps without reading global defaults
    const props: PreviewInnerProps = { ...rawProps };

    for (const key of Object.keys(defaultProps) as (keyof typeof defaultProps)[]) {
        if (props[key] === undefined) {
            (props as Record<string, unknown>)[key] = defaultProps[key];
        }
    }

    const {
        getPopupContainer,
        closable,
        zIndex,
        visible,
        className,
        style,
        src,
        maxZoom,
        minZoom,
        initialZoom,
        infinite,
        zoomStep,
        crossOrigin,
        prevTip,
        nextTip,
        zoomInTip,
        zoomOutTip,
        rotateTip,
        downloadTip,
        adaptiveTip,
        originTip,
        showTooltip,
        disableDownload,
        renderLeftIcon,
        renderRightIcon,
        renderCloseIcon,
        renderPreviewMenu,
        renderHeader,
        previewTitle,
        alt,
    } = props;

    const previewContext = usePreviewContext();
    const config = useConfigContext();
    const { locale } = useLocale('Image');

    const [runtime] = useState(() => new PreviewInnerRuntime());
    const wrapRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const footerRef = useRef<HTMLElement>(null);
    const leftIconRef = useRef<HTMLButtonElement>(null);
    const rightIconRef = useRef<HTMLButtonElement>(null);

    // an index change resets the ratio in the same commit as the new src, so PreviewImage does not re-fit the old image
    const [ratioState, setRatioState] = useState<{ index: number; ratio: RatioType }>(() => ({
        index: props.currentIndex ?? props.defaultCurrentIndex ?? 0,
        ratio: 'adaptation',
    }));

    const isServerRender = useIsServerRender();

    const titleId = useId();

    const popupContainer = props.getPopupContainer ?? config.getPopupContainer;
    const context = { ...previewContext, direction: config.direction, popupContainer };

    const [foundation, state] = useFoundation<PreviewInnerFoundation<PreviewInnerProps>, PreviewInnerAdapter<PreviewInnerProps>, PreviewInnerProps, PreviewInnerBaseState>(
        PreviewInnerFoundation,
        props,
        () => ({
            imgLoadStatus: {},
            zoom: 0.1,
            currentIndex: props.defaultCurrentIndex ?? 0,
            rotation: 0,
            viewerVisible: true,
            preloadAfterVisibleChange: true,
        }),
        (base) => ({
            getIsInGroup: () => Boolean(base.getContexts()?.isGroup),
            disabledBodyScroll: () => runtime.disableBodyScroll(coversPage(base.getContext('popupContainer'))),
            enabledBodyScroll: () => runtime.enableBodyScroll(),
            notifyChange: (index, direction) => {
                const { onChange, onPrev, onNext } = base.getProps();
                onChange?.(index);
                if (direction === 'prev') {
                    onPrev?.(index);
                } else {
                    onNext?.(index);
                }
            },
            notifyZoom: (zoom, increase) => {
                const { onZoomIn, onZoomOut } = base.getProps();
                if (increase) {
                    onZoomIn?.(zoom);
                } else {
                    onZoomOut?.(zoom);
                }
            },
            notifyClose: () => base.getProps().onClose?.(),
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            notifyRatioChange: (type) => base.getProps().onRatioChange?.(type),
            notifyRotateChange: (angle) => base.getProps().onRotateLeft?.(angle),
            notifyDownload: (src, index) => base.getProps().onDownload?.(src, index),
            notifyDownloadError: (src) => base.getProps().onDownloadError?.(src),
            registerKeyDownListener: () => window.addEventListener('keydown', runtime.handleKeyDown),
            unregisterKeyDownListener: () => window.removeEventListener('keydown', runtime.handleKeyDown),
            openLayer: (onEscape) =>
                runtime.openLayer({
                    element: wrapRef.current,
                    modal: coversPage(base.getContext('popupContainer')),
                    onEscape,
                }),
            closeLayer: () => runtime.closeLayer(),
            getSetDownloadFunc: () => base.getContexts()?.setDownloadName ?? base.getProp('setDownloadName'),
            isValidTarget: (e) => !(e.target instanceof Node && [headerRef, footerRef, leftIconRef, rightIconRef].some((item) => item.current?.contains(e.target))),
            isEventInPreview: (e) => !(e.target instanceof Element) || e.target === document.body || Boolean(wrapRef.current?.contains(e.target)),
            setRatio: (ratio) => setRatioState((prev) => ({ ...prev, ratio })),
        }),
        context
    );

    const currentIndex = PreviewInnerFoundation.getCurrentIndex(props, state);

    if (ratioState.index !== currentIndex) {
        setRatioState({ index: currentIndex, ratio: 'adaptation' });
    }

    const ratio = ratioState.index === currentIndex ? ratioState.ratio : 'adaptation';

    // only a preview in body covers the page: it is modal, locks scroll and keeps Tab inside. The caller's getter may
    // read document; on the server and while hydrating the Portal renders nothing anyway
    const inBody = !isServerRender && coversPage(popupContainer);

    useLayoutEffect(() => runtime.mount(foundation), [runtime, foundation]);

    // a non-modal preview leaves focus the user moved elsewhere where it is
    useDidUpdate(visible, (isVisible) => {
        const active = FocusTrapHandle.getActiveElement();
        if (!isVisible && (inBody || !active || active === document.body)) {
            runtime.focusScope.restore(true);
        }
    });

    // by content: a group builds a new list every render, which must not restart the delay
    useDidUpdate(src, foundation.updateTimer, isEqual);

    // a focused prev or next button disappears at the first or last image; focus stays in the dialog. Focus the user
    // moved elsewhere is left alone.
    useDidUpdate(currentIndex, () => {
        const wrap = wrapRef.current;
        const active = FocusTrapHandle.getActiveElement();
        if (wrap && (!active || active === document.body)) {
            wrap.focus({ preventScroll: true });
        }
    });

    if (!visible) {
        return null;
    }

    const { zoom, zoomEvent, rotation, viewerVisible } = state;
    const imgSrc = PreviewInnerFoundation.getSrcList(src);
    const wrapperStyle: CSSProperties = inBody ? { zIndex } : { zIndex, position: 'static' };
    const previewPrefixCls = `${prefixCls}-preview`;

    const previewWrapperCls = clsx(
        previewPrefixCls,
        {
            [`${previewPrefixCls}-popup`]: !inBody,
        },
        className
    );

    const hideViewerCls = !viewerVisible ? `${previewPrefixCls}-hide` : '';
    const total = imgSrc.length;
    const showPrev = PreviewInnerFoundation.canSwitch('prev', currentIndex, total, infinite);
    const showNext = PreviewInnerFoundation.canSwitch('next', currentIndex, total, infinite);
    const title = previewContext?.titles?.[currentIndex] ?? previewTitle;
    const hasTitle = title != null && title !== '';
    const leftIcon = typeof renderLeftIcon === 'function' ? renderLeftIcon(currentIndex) : renderLeftIcon;
    const rightIcon = typeof renderRightIcon === 'function' ? renderRightIcon(currentIndex) : renderRightIcon;

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    return (
        <Portal style={wrapperStyle} getPopupContainer={getPopupContainer}>
            <div
                ref={wrapRef}
                className={previewWrapperCls}
                style={style}
                aria-label={hasTitle ? undefined : locale.preview}
                aria-labelledby={hasTitle ? titleId : undefined}
                aria-modal={inBody ? 'true' : undefined}
                role="dialog"
                tabIndex={-1}
                onFocus={foundation.handleKeyboardActivity}
                onMouseDown={foundation.handleMouseDown}
                onMouseMove={foundation.handleMouseMove}
                onMouseUp={(e) => foundation.handleMouseUp(e.nativeEvent)}
            >
                <Header ref={headerRef} className={clsx(hideViewerCls)} title={title} closable={closable} titleId={titleId} renderCloseIcon={renderCloseIcon} renderHeader={renderHeader} onClose={foundation.handlePreviewClose} />
                <PreviewImage
                    alt={previewContext?.alts?.[currentIndex] ?? alt}
                    crossOrigin={crossOrigin}
                    disableDownload={disableDownload}
                    initialZoom={initialZoom}
                    maxZoom={maxZoom}
                    minZoom={minZoom}
                    ratio={ratio}
                    rotation={rotation}
                    src={imgSrc[currentIndex]}
                    zoom={zoom}
                    zoomEvent={zoomEvent}
                    onError={foundation.preloadSingleImage}
                    onLoad={foundation.onImageLoad}
                    onZoom={foundation.handleZoomImage}
                />
                {showPrev && (
                    <button ref={leftIconRef} type="button" className={clsx(`${previewPrefixCls}-icon`, `${previewPrefixCls}-prev`, hideViewerCls)} aria-label={prevTip ?? locale.prevTip} onClick={handlePrev}>
                        {isValidElement(leftIcon) ? leftIcon : <IconArrowLeft size="large" />}
                    </button>
                )}
                {showNext && (
                    <button ref={rightIconRef} type="button" className={clsx(`${previewPrefixCls}-icon`, `${previewPrefixCls}-next`, hideViewerCls)} aria-label={nextTip ?? locale.nextTip} onClick={handleNext}>
                        {isValidElement(rightIcon) ? rightIcon : <IconArrowRight size="large" />}
                    </button>
                )}
                <Footer
                    ref={footerRef}
                    className={hideViewerCls}
                    max={toPercent(maxZoom)}
                    min={toPercent(minZoom)}
                    step={toPercent(zoomStep)}
                    adaptiveTip={adaptiveTip}
                    curPage={currentIndex + 1}
                    disabledNext={!showNext}
                    disableDownload={disableDownload || total === 0}
                    disabledPrev={!showPrev}
                    downloadTip={downloadTip}
                    nextTip={nextTip}
                    originTip={originTip}
                    prevTip={prevTip}
                    ratio={ratio}
                    rotateTip={rotateTip}
                    showTooltip={showTooltip}
                    totalNum={total}
                    zoom={toPercent(zoom)}
                    zoomInTip={zoomInTip}
                    zoomOutTip={zoomOutTip}
                    renderPreviewMenu={renderPreviewMenu}
                    onAdjustRatio={foundation.handleAdjustRatio}
                    onDownload={foundation.handleDownload}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onRotate={foundation.handleRotateImage}
                    onZoomIn={foundation.handleZoomImage}
                    onZoomOut={foundation.handleZoomImage}
                />
            </div>
            <PreviewOpenEffects foundation={foundation} inBody={inBody} runtime={runtime} wrapRef={wrapRef} />
        </Portal>
    );
}

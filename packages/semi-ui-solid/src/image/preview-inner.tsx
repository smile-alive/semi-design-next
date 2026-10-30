import { Show, children, createEffect, createMemo, createSignal, createUniqueId, mergeProps, on, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, numbers } from '@fibrae/semi-foundation/image/constants';
import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerBaseState, type RatioType } from '@fibrae/semi-foundation/image/preview-inner-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import PopupPortal from '../_base/popup-portal';
import useFoundation from '../_base/use-foundation';
import useMounted from '../_base/use-mounted';
import useRecordFocus from '../_base/use-record-focus';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import { usePreviewContext } from './context';
import type { PreviewInnerProps } from './interface';
import Footer from './preview-footer';
import Header from './preview-header';
import PreviewImage from './preview-image';

type Foundation = PreviewInnerFoundation<PreviewInnerProps>;
type Adapter = PreviewInnerAdapter<PreviewInnerProps>;

const prefixCls = cssClasses.PREFIX;
const previewPrefixCls = `${prefixCls}-preview`;

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

// 0.29 * 100 is 28.999999999999996, which the slider would read out
const toPercent = (ratio: number) => Number((ratio * 100).toFixed(2));

export default function PreviewInner(rawProps: PreviewInnerProps) {
    // internal: Image and ImagePreview have already filled the global defaults
    const props = mergeProps(defaultProps, rawProps);

    const previewContext = usePreviewContext();
    const config = useConfig();
    const locale = useLocale('Image');

    const titleId = createUniqueId();
    const [wrap, setWrap] = createSignal<HTMLDivElement>();

    // an index change resets the ratio together with the new src, so PreviewImage does not re-fit the old image
    const [ratioState, setRatioState] = createSignal<{ index: number; ratio: RatioType }>({ index: -1, ratio: 'adaptation' });
    const scroll = new ReleaseHolder();
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();
    let header: HTMLElement | undefined;
    let footer: HTMLElement | undefined;
    let leftIcon: HTMLButtonElement | undefined;
    let rightIcon: HTMLButtonElement | undefined;

    // getPopupContainer may query a node that exists only once the parent is inserted
    const mounted = useMounted();

    const { foundation, state } = useFoundation<Foundation, Adapter, PreviewInnerProps, PreviewInnerBaseState>(
        PreviewInnerFoundation,
        props,
        (initial) => ({
            imgLoadStatus: {},
            zoom: 0.1,
            currentIndex: initial.defaultCurrentIndex ?? 0,
            rotation: 0,
            viewerVisible: true,
            preloadAfterVisibleChange: true,
        }),
        (base) => ({
            getIsInGroup: () => Boolean(previewContext),
            disabledBodyScroll: () => (inBody() ? scroll.hold(lockBodyScroll) : scroll.release()),
            enabledBodyScroll: () => scroll.release(),
            notifyChange: (index, direction) => {
                const { onChange, onPrev, onNext } = base.getProps();
                onChange?.(index);
                if (direction === 'prev') {
                    onPrev?.(index);
                } else {
                    onNext?.(index);
                }
            },
            notifyZoom: (zoom, increase) => (increase ? base.getProps().onZoomIn?.(zoom) : base.getProps().onZoomOut?.(zoom)),
            notifyClose: () => base.getProps().onClose?.(),
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            notifyRatioChange: (type) => base.getProps().onRatioChange?.(type),
            notifyRotateChange: (angle) => base.getProps().onRotateLeft?.(angle),
            notifyDownload: (src, index) => base.getProps().onDownload?.(src, index),
            notifyDownloadError: (src) => base.getProps().onDownloadError?.(src),
            registerKeyDownListener: () => window.addEventListener('keydown', handleKeyDown),
            unregisterKeyDownListener: () => window.removeEventListener('keydown', handleKeyDown),
            openLayer: (onEscape) => {
                const element = wrap() as HTMLElement;
                const modal = inBody();
                layer.hold(() => openLayer({ element, modal, onEscape }));
            },
            closeLayer: () => layer.release(),
            getSetDownloadFunc: () => (base.getContexts()?.setDownloadName ?? base.getProp('setDownloadName')) as (src: string) => string,
            isValidTarget: (e) => !(e.target instanceof Node && [header, footer, leftIcon, rightIcon].some((element) => element?.contains(e.target))),
            isEventInPreview: (e) => !(e.target instanceof Element) || e.target === document.body || Boolean(wrap()?.contains(e.target)),
            setRatio: (ratio) => setRatioState({ index: currentIndex(), ratio }),
        }),
        {
            context: () => ({
                isGroup: Boolean(previewContext),
                setCurrentIndex: previewContext?.setCurrentIndex,
                setDownloadName: previewContext?.view().setDownloadName,
                direction: config().direction,
            }),
        }
    );

    const visible = createMemo(() => Boolean(props.visible));
    const currentIndex = createMemo(() => PreviewInnerFoundation.getCurrentIndex(props, state()));

    // the popup is not inserted until it is mounted and visible, so the slots below are created only then
    const shown = createMemo(() => mounted() && visible());

    // by content: a group builds a new list on every change, which must not restart the delay
    const srcList = createMemo(() => PreviewInnerFoundation.getSrcList(props.src as string | string[]), undefined, { equals: isEqual });
    const total = createMemo(() => srcList().length);
    const showPrev = createMemo(() => PreviewInnerFoundation.canSwitch('prev', currentIndex(), total(), props.infinite));
    const showNext = createMemo(() => PreviewInnerFoundation.canSwitch('next', currentIndex(), total(), props.infinite));
    const title = children(() => (shown() ? (previewContext?.view().titles[currentIndex()] ?? props.previewTitle) : undefined));

    // only a preview in body covers the page: it is modal, locks scroll and keeps Tab inside. A memo, so a consumer
    // spreading a props signal does not re-run the show effect, which would restart the delay and pull focus back
    // Not called before mount (nor on the server): the container the consumer's getter queries may not be inserted yet
    const inBody = createMemo(() => !mounted() || coversPage(props.getPopupContainer ?? config().getPopupContainer));

    const ratio = () => (ratioState().index === currentIndex() ? ratioState().ratio : 'adaptation');

    const leftIconSlot = children(() => {
        const render = props.renderLeftIcon;
        if (!shown() || !showPrev()) {
            return undefined;
        }
        return typeof render === 'function' ? render(currentIndex()) : render;
    });

    const rightIconSlot = children(() => {
        const render = props.renderRightIcon;
        if (!shown() || !showNext()) {
            return undefined;
        }
        return typeof render === 'function' ? render(currentIndex()) : render;
    });

    const hideCls = () => (state().viewerVisible ? '' : `${previewPrefixCls}-hide`);

    // one function for the whole show: the listener added on show is the one removed on hide
    const handleKeyDown = (e: KeyboardEvent) => foundation.handleKeyDown(e);

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    useRecordFocus(focusScope, visible);

    // tracks the dialog, so the layer, scroll lock and focus are taken once it is in the document
    createEffect(() => {
        const element = wrap();
        if (!visible() || !element) {
            return;
        }
        const modal = inBody();
        untrack(() => {
            foundation.beforeShow();
            focusScope.engage(element, modal, true);
        });
        onCleanup(() => {
            // afterHide releases the inert around the preview first, so the opener can take focus again
            foundation.afterHide();
            focusScope.deactivate();
        });
    });

    // a non-modal preview leaves focus the user moved elsewhere where it is
    createEffect(
        on(
            visible,
            (isVisible) => {
                const active = FocusTrapHandle.getActiveElement();
                if (!isVisible && (inBody() || !active || active === document.body)) {
                    focusScope.restore(true);
                }
            },
            { defer: true }
        )
    );

    useWatch(srcList, foundation.updateTimer);

    // a focused prev or next button disappears at the first or last image; focus stays in the dialog. Focus the user
    // moved elsewhere is left alone.
    createEffect(
        on(
            currentIndex,
            () => {
                const element = wrap();
                const active = FocusTrapHandle.getActiveElement();
                if (element && (!active || active === document.body)) {
                    element.focus({ preventScroll: true });
                }
            },
            { defer: true }
        )
    );

    return (
        <Show when={mounted() && visible()}>
            <PopupPortal getPopupContainer={props.getPopupContainer} zIndex={props.zIndex} inBody={inBody()}>
                <div
                    ref={(node) => {
                        setWrap(node);
                        onCleanup(() => setWrap(undefined));
                    }}
                    class={clsx(previewPrefixCls, { [`${previewPrefixCls}-popup`]: !inBody() }, props.class)}
                    style={props.style}
                    aria-label={hasContent(title()) ? undefined : locale().locale.preview}
                    aria-labelledby={hasContent(title()) ? titleId : undefined}
                    aria-modal={inBody() ? 'true' : undefined}
                    role="dialog"
                    tabIndex={-1}
                    onFocusIn={foundation.handleKeyboardActivity}
                    onMouseDown={foundation.handleMouseDown}
                    onMouseMove={foundation.handleMouseMove}
                    onMouseUp={foundation.handleMouseUp}
                    // not delegated, so a native listener on an element: not passive, and the trackpad pinch can be
                    // kept from zooming the page
                    onWheel={foundation.handleWheel}
                >
                    <Header ref={(node) => (header = node)} class={hideCls()} title={title()} closable={props.closable} titleId={titleId} renderCloseIcon={props.renderCloseIcon} renderHeader={props.renderHeader} onClose={foundation.handlePreviewClose} />
                    <PreviewImage
                        alt={previewContext?.view().alts[currentIndex()] ?? props.alt}
                        crossOrigin={props.crossOrigin}
                        disableDownload={props.disableDownload}
                        initialZoom={props.initialZoom}
                        maxZoom={props.maxZoom}
                        minZoom={props.minZoom}
                        ratio={ratio()}
                        rotation={state().rotation}
                        src={srcList()[currentIndex()]}
                        zoom={state().zoom}
                        zoomEvent={state().zoomEvent}
                        onError={foundation.preloadSingleImage}
                        onLoad={foundation.onImageLoad}
                        onZoom={(zoom, reportToUser) => foundation.handleZoomImage(zoom, reportToUser)}
                    />
                    <Show when={showPrev()}>
                        <button ref={(node) => (leftIcon = node)} type="button" class={clsx(`${previewPrefixCls}-icon`, `${previewPrefixCls}-prev`, hideCls())} aria-label={props.prevTip ?? locale().locale.prevTip} onClick={handlePrev}>
                            {hasContent(leftIconSlot()) ? leftIconSlot() : <IconArrowLeft size="large" />}
                        </button>
                    </Show>
                    <Show when={showNext()}>
                        <button ref={(node) => (rightIcon = node)} type="button" class={clsx(`${previewPrefixCls}-icon`, `${previewPrefixCls}-next`, hideCls())} aria-label={props.nextTip ?? locale().locale.nextTip} onClick={handleNext}>
                            {hasContent(rightIconSlot()) ? rightIconSlot() : <IconArrowRight size="large" />}
                        </button>
                    </Show>
                    <Footer
                        ref={(node) => (footer = node)}
                        class={hideCls()}
                        max={toPercent(props.maxZoom)}
                        min={toPercent(props.minZoom)}
                        step={toPercent(props.zoomStep)}
                        adaptiveTip={props.adaptiveTip}
                        curPage={currentIndex() + 1}
                        disabledNext={!showNext()}
                        disableDownload={props.disableDownload || total() === 0}
                        disabledPrev={!showPrev()}
                        downloadTip={props.downloadTip}
                        nextTip={props.nextTip}
                        originTip={props.originTip}
                        prevTip={props.prevTip}
                        ratio={ratio()}
                        rotateTip={props.rotateTip}
                        showTooltip={props.showTooltip}
                        totalNum={total()}
                        zoom={toPercent(state().zoom ?? 0)}
                        zoomInTip={props.zoomInTip}
                        zoomOutTip={props.zoomOutTip}
                        renderPreviewMenu={props.renderPreviewMenu}
                        onAdjustRatio={foundation.handleAdjustRatio}
                        onDownload={foundation.handleDownload}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        onRotate={foundation.handleRotateImage}
                        onZoomIn={(zoom) => foundation.handleZoomImage(zoom)}
                        onZoomOut={(zoom) => foundation.handleZoomImage(zoom)}
                    />
                </div>
            </PopupPortal>
        </Show>
    );
}

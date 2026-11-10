import { Show, children, createEffect, createMemo, createSignal, createUniqueId, mergeProps, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, numbers } from '@fibrae/semi-foundation/components/image/constants';
import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerState } from '@fibrae/semi-foundation/components/image/preview-inner-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-solid';
import useFoundation from '../../base/use-foundation';
import PopupPortal from '../../internal/popup-portal';
import useMounted from '../../primitives/use-mounted';
import useRecordFocus from '../../primitives/use-record-focus';
import hasContent from '../../utils/has-content';
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
    let header: HTMLElement | undefined;
    let footer: HTMLElement | undefined;
    let leftIcon: HTMLButtonElement | undefined;
    let rightIcon: HTMLButtonElement | undefined;

    // getPopupContainer may query a node that exists only once the parent is inserted
    const mounted = useMounted();

    const { foundation, state } = useFoundation<Foundation, Adapter, PreviewInnerProps, PreviewInnerState>(
        PreviewInnerFoundation,
        props,
        (initial) => PreviewInnerFoundation.getInitialState(initial),
        (base) => ({
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
            getWrap: () => wrap(),
            isValidTarget: (e) => !(e.target instanceof Node && [header, footer, leftIcon, rightIcon].some((element) => element?.contains(e.target))),
        }),
        {
            context: () => ({
                setCurrentIndex: previewContext?.setCurrentIndex,
                setDownloadName: previewContext?.view().setDownloadName,
                direction: config().direction,
                popupContainer: props.getPopupContainer ?? config().getPopupContainer,
            }),
        }
    );

    const visible = createMemo(() => Boolean(props.visible));
    const currentIndex = createMemo(() => PreviewInnerFoundation.getCurrentIndex(props, state()));
    const shown = createMemo(() => mounted() && visible());

    // by content: a group builds a new list on every change
    const srcList = createMemo(() => PreviewInnerFoundation.getSrcList(props.src as string | string[]), undefined, { equals: isEqual });
    const total = createMemo(() => srcList().length);
    const showPrev = createMemo(() => PreviewInnerFoundation.canSwitch('prev', currentIndex(), total(), props.infinite));
    const showNext = createMemo(() => PreviewInnerFoundation.canSwitch('next', currentIndex(), total(), props.infinite));
    const title = children(() => (shown() ? (previewContext?.view().titles[currentIndex()] ?? props.previewTitle) : undefined));

    // A memo, so every reader does not call the consumer's getter again. Not called before mount (nor on the server):
    // the container the consumer's getter queries may not be inserted yet
    const inBody = createMemo(() => !mounted() || coversPage(props.getPopupContainer ?? config().getPopupContainer));

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

    const ratio = () => PreviewInnerFoundation.getRatio(props, state());

    const hideCls = () => (state().viewerVisible ? '' : `${previewPrefixCls}-hide`);

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    useRecordFocus({ record: foundation.recordFocus }, visible);

    // tracks the dialog, so the layer, scroll lock and focus are taken once it is in the document
    createEffect(() => {
        if (!visible() || !wrap()) {
            return;
        }
        untrack(foundation.beforeShow);
        onCleanup(foundation.afterHide);
    });

    return (
        <Show when={mounted() && visible()}>
            <PopupPortal getPopupContainer={props.getPopupContainer} zIndex={props.zIndex}>
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

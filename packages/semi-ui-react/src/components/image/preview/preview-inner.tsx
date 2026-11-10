import { isValidElement, type RefObject, useId, useInsertionEffect, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/components/image/constants';
import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerState } from '@fibrae/semi-foundation/components/image/preview-inner-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-react';
import useFoundation from '../../../base/use-foundation';
import useIsServerRender from '../../../hooks/use-is-server-render';
import Portal from '../../../internal/portal';
import { useConfigContext } from '../../config-provider/context';
import useLocale from '../../locale/use-locale';
import { usePreviewContext } from '../context';
import type { PreviewInnerProps } from '../interface';
import Footer from './preview-footer';
import Header from './preview-header';
import PreviewImage from './preview-image';

type Foundation = PreviewInnerFoundation<PreviewInnerProps>;
type Adapter = PreviewInnerAdapter<PreviewInnerProps>;

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

// 0.29 * 100 is 28.999999999999996, which the slider would read out
const toPercent = (ratio: number) => Number((ratio * 100).toFixed(2));

interface PreviewOpenEffectsProps {
    foundation: PreviewInnerFoundation;
    wrapRef: RefObject<HTMLDivElement | null>;
}

// Rendered in the Portal after the dialog, so these effects run once its DOM and refs exist: in the Portal's first
// commit, which on a hydrated page comes after hydration rather than with the preview's own mount
function PreviewOpenEffects({ foundation, wrapRef }: PreviewOpenEffectsProps) {
    // records the opener before the layout phase moves focus into the preview
    useInsertionEffect(() => foundation.recordFocus(), [foundation]);

    useLayoutEffect(() => {
        const wrap = wrapRef.current;
        // React's onWheel is passive, but the trackpad pinch must preventDefault or the whole page zooms
        wrap.addEventListener('wheel', foundation.handleWheel, { passive: false });
        foundation.beforeShow();
        return () => {
            wrap.removeEventListener('wheel', foundation.handleWheel);
            foundation.afterHide();
        };
    }, [foundation, wrapRef]);

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

    const wrapRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef(new Set<HTMLElement>());

    const isServerRender = useIsServerRender();

    const titleId = useId();

    const popupContainer = props.getPopupContainer ?? config.getPopupContainer;
    const context = { ...previewContext, direction: config.direction, popupContainer };

    const [foundation, state] = useFoundation<Foundation, Adapter, PreviewInnerProps, PreviewInnerState>(
        PreviewInnerFoundation,
        props,
        () => PreviewInnerFoundation.getInitialState(props),
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
            getWrap: () => wrapRef.current,
            isOutsideControls: (e) => !(e.target instanceof Node && [...controlsRef.current].some((node) => node.contains(e.target))),
        }),
        context
    );

    const currentIndex = PreviewInnerFoundation.getCurrentIndex(props, state);
    const ratio = PreviewInnerFoundation.getRatio(props, state);

    // only a preview whose container covers the page is modal, locks scroll and keeps Tab inside. The caller's getter
    // may read document; on the server and while hydrating the Portal renders nothing anyway
    const inBody = !isServerRender && coversPage(popupContainer);

    if (!visible) {
        return null;
    }

    const { zoom, zoomEvent, rotation, controlsVisible } = state;
    const imgSrc = PreviewInnerFoundation.getSrcList(src);
    const previewPrefixCls = `${prefixCls}-preview`;

    const previewWrapperCls = clsx(
        previewPrefixCls,
        {
            [`${previewPrefixCls}-popup`]: !inBody,
        },
        className
    );

    const hideViewerCls = !controlsVisible ? `${previewPrefixCls}-hide` : '';
    const total = imgSrc.length;
    const showPrev = PreviewInnerFoundation.canSwitch('prev', currentIndex, total, infinite);
    const showNext = PreviewInnerFoundation.canSwitch('next', currentIndex, total, infinite);
    const title = previewContext?.titles?.[currentIndex] ?? previewTitle;
    const hasTitle = title != null && title !== '';
    const leftIcon = typeof renderLeftIcon === 'function' ? renderLeftIcon(currentIndex) : renderLeftIcon;
    const rightIcon = typeof renderRightIcon === 'function' ? renderRightIcon(currentIndex) : renderRightIcon;

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    const attachControl = (node: HTMLElement | null) => {
        if (!node) {
            return undefined;
        }
        controlsRef.current.add(node);
        return () => {
            controlsRef.current.delete(node);
        };
    };

    return (
        <Portal style={{ zIndex }} getPopupContainer={getPopupContainer}>
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
                <Header ref={attachControl} className={clsx(hideViewerCls)} title={title} closable={closable} titleId={titleId} renderCloseIcon={renderCloseIcon} renderHeader={renderHeader} onClose={foundation.handlePreviewClose} />
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
                    <button ref={attachControl} type="button" className={clsx(`${previewPrefixCls}-icon`, `${previewPrefixCls}-prev`, hideViewerCls)} aria-label={prevTip ?? locale.prevTip} onClick={handlePrev}>
                        {isValidElement(leftIcon) ? leftIcon : <IconArrowLeft size="large" />}
                    </button>
                )}
                {showNext && (
                    <button ref={attachControl} type="button" className={clsx(`${previewPrefixCls}-icon`, `${previewPrefixCls}-next`, hideViewerCls)} aria-label={nextTip ?? locale.nextTip} onClick={handleNext}>
                        {isValidElement(rightIcon) ? rightIcon : <IconArrowRight size="large" />}
                    </button>
                )}
                <Footer
                    ref={attachControl}
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
            <PreviewOpenEffects foundation={foundation} wrapRef={wrapRef} />
        </Portal>
    );
}

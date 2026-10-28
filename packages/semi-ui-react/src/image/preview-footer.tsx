import type { ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import PreviewFooterFoundation, { type PreviewFooterAdapter } from '@fibrae/semi-foundation/image/preview-footer-foundation';
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus, IconRotate, IconDownload, IconWindowAdaptionStroked, IconRealSizeStroked } from '@fibrae/semi-icons-react';
import useFoundation from '../_base/use-foundation';
import Divider from '../divider';
import useLocale from '../locale/use-locale';
import Slider from '../slider';
import Tooltip from '../tooltip';
import type { FooterProps, MenuProps } from './interface';

const prefixCls = cssClasses.PREFIX;
const footerPrefixCls = `${cssClasses.PREFIX}-preview-footer`;
const disabledCls = `${footerPrefixCls}-disabled`;

function tipFormatter(v: unknown) {
    return `${v}%`;
}

export default function Footer(props: FooterProps) {
    const { ref, className, min = 10, max = 500, step = 10, curPage, totalNum, ratio, zoom, disabledPrev, disabledNext, disableDownload = false, showTooltip = false, prevTip, nextTip, zoomInTip, zoomOutTip, rotateTip, downloadTip, adaptiveTip, originTip, onNext, onPrev, onDownload, renderPreviewMenu } = props;

    const { locale } = useLocale('Image');

    let content: ReactNode;

    const [foundation] = useFoundation<PreviewFooterFoundation<FooterProps, Record<string, never>>, PreviewFooterAdapter<FooterProps, Record<string, never>>, FooterProps, Record<string, never>>(
        PreviewFooterFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyZoomIn: (zoom) => base.getProps().onZoomIn?.(zoom),
            notifyZoomOut: (zoom) => base.getProps().onZoomOut?.(zoom),
            notifyAdjustRatio: (type) => base.getProps().onAdjustRatio?.(type),
            notifyRotate: (direction) => base.getProps().onRotate?.(direction),
        })
    );

    const disabledZoomIn = zoom === max;
    const disabledZoomOut = zoom === min;

    const handleMinusClick = () => foundation.changeSliderValue('minus');

    const handlePlusClick = () => foundation.changeSliderValue('plus');

    const handleRotateLeft = () => foundation.handleRotate('left');

    const handleRotateRight = () => foundation.handleRotate('right');

    const handleRatioClick = () => foundation.handleRatioClick();

    // a disabled button stays focusable (aria-disabled) so focus is not lost at the last image or zoom limit
    const getButton = (key: string, label: string, icon: ReactNode, onClick: () => void, disabled = false, gap = false) => {
        const button = (
            <button
                key={key}
                type="button"
                className={clsx(`${footerPrefixCls}-button`, {
                    [`${prefixCls}-tooltip-children-wrapper`]: showTooltip,
                    [`${footerPrefixCls}-gap`]: gap,
                })}
                aria-disabled={disabled || undefined}
                aria-label={label}
                onClick={disabled ? undefined : onClick}
            >
                {icon}
            </button>
        );
        return showTooltip ? (
            <Tooltip key={`tooltip-${key}`} content={label}>
                {button}
            </Tooltip>
        ) : (
            button
        );
    };

    const getMenu = () => {
        const ratioIcon = ratio === 'adaptation' ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />;
        return [
            getButton('chevron-left', prevTip ?? locale.prevTip, <IconChevronLeft className={disabledPrev ? disabledCls : ''} size="large" />, onPrev, disabledPrev),
            <div key="info" className={`${footerPrefixCls}-page`} aria-atomic="true" aria-live="polite">
                {curPage}/{totalNum}
            </div>,
            getButton('chevron-right', nextTip ?? locale.nextTip, <IconChevronRight className={disabledNext ? disabledCls : ''} size="large" />, onNext, disabledNext),
            getButton('minus', zoomOutTip ?? locale.zoomOutTip, <IconMinus className={disabledZoomOut ? disabledCls : ''} size="large" />, handleMinusClick, disabledZoomOut),
            <Slider key="slider" aria-label={locale.zoom} max={max} min={min} step={step} value={zoom} getAriaValueText={tipFormatter} tipFormatter={tipFormatter} tooltipVisible={showTooltip ? undefined : false} onChange={foundation.handleSlideChange} />,
            getButton('plus', zoomInTip ?? locale.zoomInTip, <IconPlus className={disabledZoomIn ? disabledCls : ''} size="large" />, handlePlusClick, disabledZoomIn),
            getButton('ratio', ratio === 'adaptation' ? (originTip ?? locale.originTip) : (adaptiveTip ?? locale.adaptiveTip), ratioIcon, handleRatioClick, false, true),
            getButton('rotate', rotateTip ?? locale.rotateTip, <IconRotate size="large" />, handleRotateLeft),
            getButton('download', downloadTip ?? locale.downloadTip, <IconDownload className={disableDownload ? disabledCls : ''} size="large" />, onDownload, disableDownload, true),
        ];
    };

    if (renderPreviewMenu) {
        const menuProps = {
            min,
            max,
            step,
            curPage,
            totalNum,
            ratio,
            zoom,
            disabledPrev,
            disabledNext,
            disableDownload,
            onNext,
            onPrev,
            onDownload,
            onRotateLeft: handleRotateLeft,
            onRotateRight: handleRotateRight,
            disabledZoomIn,
            disabledZoomOut,
            onRatioClick: handleRatioClick,
            onZoomIn: handlePlusClick,
            onZoomOut: handleMinusClick,
            menuItems: getMenu(),
        } satisfies MenuProps;
        content = renderPreviewMenu(menuProps);
    } else {
        const menu = getMenu();
        content = [...menu.slice(0, 3), <Divider key="divider-first" layout="vertical" />, ...menu.slice(3, 7), <Divider key="divider-second" layout="vertical" />, ...menu.slice(7)];
    }

    return (
        <section
            ref={ref}
            className={clsx(footerPrefixCls, `${footerPrefixCls}-wrapper`, className, {
                [`${footerPrefixCls}-content`]: !renderPreviewMenu,
            })}
        >
            {content}
        </section>
    );
}

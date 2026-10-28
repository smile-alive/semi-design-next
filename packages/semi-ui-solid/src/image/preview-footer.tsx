import { type JSX, Show, children, mergeProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import PreviewFooterFoundation, { type PreviewFooterAdapter } from '@fibrae/semi-foundation/image/preview-footer-foundation';
import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-solid';
import useFoundation from '../_base/use-foundation';
import Divider from '../divider';
import useLocale from '../locale/use-locale';
import Slider from '../slider';
import Tooltip, { type GetTriggerProps } from '../tooltip';
import type { FooterProps, MenuProps } from './interface';

type Foundation = PreviewFooterFoundation<FooterProps, Record<string, never>>;
type Adapter = PreviewFooterAdapter<FooterProps, Record<string, never>>;

interface FooterButtonProps {
    label: string;
    showTooltip: boolean;
    disabled?: boolean;
    gap?: boolean;
    onClick?: () => void;
    children: JSX.Element;
}

const prefixCls = cssClasses.PREFIX;
const footerPrefixCls = `${cssClasses.PREFIX}-preview-footer`;
const disabledCls = `${footerPrefixCls}-disabled`;

const defaultProps = {
    min: 10,
    max: 500,
    step: 10,
    disableDownload: false,
    showTooltip: false,
} satisfies Partial<FooterProps>;

function tipFormatter(v: unknown) {
    return `${v}%`;
}

// a disabled button stays focusable (aria-disabled) so focus is not lost at the last image or zoom limit
function FooterButton(props: FooterButtonProps) {
    const icon = children(() => props.children);

    const button = (triggerProps?: ReturnType<GetTriggerProps>) => (
        <button
            {...triggerProps}
            type="button"
            class={clsx(`${footerPrefixCls}-button`, {
                [`${prefixCls}-tooltip-children-wrapper`]: props.showTooltip,
                [`${footerPrefixCls}-gap`]: props.gap,
            })}
            aria-disabled={props.disabled || undefined}
            aria-label={props.label}
            onClick={() => {
                if (!props.disabled) {
                    props.onClick?.();
                }
            }}
        >
            {icon()}
        </button>
    );

    return (
        <Show when={props.showTooltip} fallback={button()}>
            <Tooltip content={props.label}>{(getTriggerProps) => button(getTriggerProps())}</Tooltip>
        </Show>
    );
}

export default function Footer(rawProps: FooterProps) {
    const props = mergeProps(defaultProps, rawProps);

    const locale = useLocale('Image');

    const { foundation } = useFoundation<Foundation, Adapter, FooterProps, Record<string, never>>(
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

    const disabledZoomIn = () => props.zoom === props.max;

    const disabledZoomOut = () => props.zoom === props.min;

    const isAdaptation = () => props.ratio === 'adaptation';

    const handleMinusClick = () => foundation.changeSliderValue('minus');

    const handlePlusClick = () => foundation.changeSliderValue('plus');

    const handleRotateLeft = () => foundation.handleRotate('left');

    const handleRotateRight = () => foundation.handleRotate('right');

    const handleRatioClick = () => foundation.handleRatioClick();

    // built once: every binding inside stays live, so a custom menu that places them needs no re-render
    const menuItems = [
        <FooterButton label={props.prevTip ?? locale().locale.prevTip} showTooltip={props.showTooltip} disabled={props.disabledPrev} onClick={() => props.onPrev?.()}>
            <IconChevronLeft class={props.disabledPrev ? disabledCls : ''} size="large" />
        </FooterButton>,
        <div class={`${footerPrefixCls}-page`} aria-atomic="true" aria-live="polite">
            {props.curPage}/{props.totalNum}
        </div>,
        <FooterButton label={props.nextTip ?? locale().locale.nextTip} showTooltip={props.showTooltip} disabled={props.disabledNext} onClick={() => props.onNext?.()}>
            <IconChevronRight class={props.disabledNext ? disabledCls : ''} size="large" />
        </FooterButton>,
        <FooterButton label={props.zoomOutTip ?? locale().locale.zoomOutTip} showTooltip={props.showTooltip} disabled={disabledZoomOut()} onClick={handleMinusClick}>
            <IconMinus class={disabledZoomOut() ? disabledCls : ''} size="large" />
        </FooterButton>,
        <Slider aria-label={locale().locale.zoom} max={props.max} min={props.min} step={props.step} value={props.zoom} getAriaValueText={tipFormatter} tipFormatter={tipFormatter} tooltipVisible={props.showTooltip ? undefined : false} onChange={(value) => value !== undefined && foundation.handleSlideChange(value)} />,
        <FooterButton label={props.zoomInTip ?? locale().locale.zoomInTip} showTooltip={props.showTooltip} disabled={disabledZoomIn()} onClick={handlePlusClick}>
            <IconPlus class={disabledZoomIn() ? disabledCls : ''} size="large" />
        </FooterButton>,
        <FooterButton label={isAdaptation() ? (props.originTip ?? locale().locale.originTip) : (props.adaptiveTip ?? locale().locale.adaptiveTip)} showTooltip={props.showTooltip} gap onClick={handleRatioClick}>
            {isAdaptation() ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />}
        </FooterButton>,
        <FooterButton label={props.rotateTip ?? locale().locale.rotateTip} showTooltip={props.showTooltip} onClick={handleRotateLeft}>
            <IconRotate size="large" />
        </FooterButton>,
        <FooterButton label={props.downloadTip ?? locale().locale.downloadTip} showTooltip={props.showTooltip} disabled={props.disableDownload} gap onClick={() => props.onDownload?.()}>
            <IconDownload class={props.disableDownload ? disabledCls : ''} size="large" />
        </FooterButton>,
    ];

    const menuProps: MenuProps = {
        get min() {
            return props.min;
        },
        get max() {
            return props.max;
        },
        get step() {
            return props.step;
        },
        get curPage() {
            return props.curPage;
        },
        get totalNum() {
            return props.totalNum;
        },
        get ratio() {
            return props.ratio;
        },
        get zoom() {
            return props.zoom;
        },
        get disabledPrev() {
            return props.disabledPrev;
        },
        get disabledNext() {
            return props.disabledNext;
        },
        get disableDownload() {
            return props.disableDownload;
        },
        get disabledZoomIn() {
            return disabledZoomIn();
        },
        get disabledZoomOut() {
            return disabledZoomOut();
        },
        onNext: () => props.onNext?.(),
        onPrev: () => props.onPrev?.(),
        onDownload: () => props.onDownload?.(),
        onRotateLeft: handleRotateLeft,
        onRotateRight: handleRotateRight,
        onRatioClick: handleRatioClick,
        onZoomIn: handlePlusClick,
        onZoomOut: handleMinusClick,
        menuItems,
    };

    return (
        <section
            ref={(node) => props.ref?.(node)}
            class={clsx(footerPrefixCls, `${footerPrefixCls}-wrapper`, props.class, {
                [`${footerPrefixCls}-content`]: !props.renderPreviewMenu,
            })}
        >
            <Show keyed when={props.renderPreviewMenu} fallback={[...menuItems.slice(0, 3), <Divider layout="vertical" />, ...menuItems.slice(3, 7), <Divider layout="vertical" />, ...menuItems.slice(7)]}>
                {(render) => render(menuProps)}
            </Show>
        </section>
    );
}

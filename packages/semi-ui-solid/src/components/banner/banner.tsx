import { children, Show, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, type BannerPart } from '@fibrae/semi-foundation/components/banner/constants';
import BannerFoundation, { type BannerAdapter, type BannerState } from '@fibrae/semi-foundation/components/banner/foundation';
import { findFocusAfter } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/banner/banner.scss';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-solid';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useFocusHandover } from '../../primitives/index';
import { hasContent } from '../../utils/index';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import Typography from '../typography';

const prefixCls = cssClasses.PREFIX;

export type BannerType = 'info' | 'danger' | 'warning' | 'success';

export interface BannerProps extends ElementProps<'div', 'title' | 'onClose'> {
    type?: BannerType;
    classNames?: Partial<Record<BannerPart, string>>;
    fullMode?: boolean;
    styles?: Partial<Record<BannerPart, JSX.CSSProperties | string>>;
    title?: JSX.Element;
    description?: JSX.Element;
    /** Replaces the icon of `type`; `null` removes the icon */
    icon?: JSX.Element;
    /** Replaces the close icon; `null` removes the close button */
    closeIcon?: JSX.Element;
    bordered?: boolean;
    onClose?(e: MouseEvent): void;
}

type Foundation = BannerFoundation<BannerProps, MouseEvent>;
type Adapter = BannerAdapter<BannerProps, MouseEvent>;

const defaultProps = {
    type: 'info',
    fullMode: true,
} satisfies Partial<BannerProps>;

const iconMap = {
    warning: IconAlertTriangle,
    success: IconTickCircle,
    info: IconInfoCircle,
    danger: IconAlertCircle,
};

export default function Banner(rawProps: BannerProps) {
    const props = useDefaultProps('Banner', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['bordered', 'children', 'class', 'classNames', 'closeIcon', 'description', 'fullMode', 'icon', 'onClose', 'style', 'styles', 'title', 'type']);

    const locale = useLocale('Banner');

    // closing removes the whole banner, so the element to land on is read before it goes
    let focusAfterClose: HTMLElement | null = null;

    const { foundation, state } = useFoundation<Foundation, Adapter, BannerProps, BannerState>(
        BannerFoundation,
        props,
        () => BannerFoundation.getInitialState(),
        (base) => ({
            notifyClose: (e) => base.getProps().onClose?.(e),
        })
    );

    const handoverFocus = useFocusHandover<HTMLDivElement>(() => focusAfterClose);

    const icon = children(() => local.icon);
    const closeIcon = children(() => local.closeIcon);
    const title = children(() => local.title);
    const description = children(() => local.description);
    const extra = children(() => local.children);

    const showIcon = () => (icon() === undefined ? local.type in iconMap : hasContent(icon()));

    // a native listener: a delegated one runs after the click has already reached the ancestors' own listeners
    const remove = (e: MouseEvent & { currentTarget: HTMLElement }) => {
        e.stopPropagation();
        const root = e.currentTarget.closest(`.${prefixCls}`);
        focusAfterClose = root && findFocusAfter(root);
        foundation.removeBanner(e);
    };

    return (
        <Show when={state().visible}>
            <div
                {...rest}
                class={clsx(prefixCls, local.class, {
                    [`${prefixCls}-${local.type}`]: local.type,
                    [`${prefixCls}-full`]: local.fullMode,
                    [`${prefixCls}-in-container`]: !local.fullMode,
                    [`${prefixCls}-bordered`]: !local.fullMode && local.bordered,
                })}
                style={local.style}
            >
                <div ref={handoverFocus} class={`${prefixCls}-content-wrapper`}>
                    <div class={`${prefixCls}-content`}>
                        <Show when={showIcon()}>
                            <div class={clsx(`${prefixCls}-icon`, local.classNames?.icon)} style={local.styles?.icon} x-semi-prop="icon">
                                <Show when={icon() === undefined} fallback={icon()}>
                                    <Dynamic component={iconMap[local.type]} aria-label={locale().locale[local.type]} size="large" />
                                </Show>
                            </div>
                        </Show>
                        <div class={`${prefixCls}-content-body`}>
                            <Show when={hasContent(title())}>
                                <Typography.Title component="div" class={clsx(`${prefixCls}-title`, local.classNames?.title)} style={local.styles?.title} heading={5} x-semi-prop="title">
                                    {title()}
                                </Typography.Title>
                            </Show>
                            <Show when={hasContent(description())}>
                                <Typography.Paragraph component="div" class={clsx(`${prefixCls}-description`, local.classNames?.description)} style={local.styles?.description} x-semi-prop="description">
                                    {description()}
                                </Typography.Paragraph>
                            </Show>
                        </div>
                    </div>
                    <Show when={closeIcon() !== null}>
                        <IconButton
                            type="tertiary"
                            class={clsx(`${prefixCls}-close`, local.classNames?.close)}
                            style={local.styles?.close}
                            aria-label={locale().locale.close}
                            size="small"
                            theme="borderless"
                            icon={
                                <Show when={closeIcon()} fallback={<IconClose x-semi-prop="closeIcon" />}>
                                    {closeIcon()}
                                </Show>
                            }
                            on:click={remove}
                        />
                    </Show>
                </div>
                <Show when={hasContent(extra())}>
                    <div class={clsx(`${prefixCls}-extra`, local.classNames?.extra)} style={local.styles?.extra} x-semi-prop="children">
                        {extra()}
                    </div>
                </Show>
            </div>
        </Show>
    );
}

import { children, Show, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/banner/constants';
import BannerFoundation, { type BannerAdapter } from '@fibrae/semi-foundation/banner/foundation';
import { findFocusAfter } from '@fibrae/semi-foundation/utils/focus-handover';
import '@fibrae/semi-foundation/banner/banner.scss';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import Typography from '../typography';

const prefixCls = cssClasses.PREFIX;

export type BannerType = 'info' | 'danger' | 'warning' | 'success';

export interface BannerProps extends ElementProps<'div', 'title' | 'onClose'> {
    type?: BannerType;
    fullMode?: boolean;
    title?: JSX.Element;
    description?: JSX.Element;
    /** Replaces the icon of `type`; `null` removes the icon */
    icon?: JSX.Element;
    /** Replaces the close icon; `null` removes the close button */
    closeIcon?: JSX.Element;
    bordered?: boolean;
    onClose?(e: MouseEvent): void;
}

interface BannerState {
    visible: boolean;
}

type Foundation = BannerFoundation<BannerProps, BannerState, MouseEvent>;
type Adapter = BannerAdapter<BannerProps, BannerState, MouseEvent>;

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
    const [local, rest] = splitProps(props, ['bordered', 'children', 'class', 'closeIcon', 'description', 'fullMode', 'icon', 'onClose', 'style', 'title', 'type']);

    const locale = useLocale('Banner');

    // closing removes the whole banner, so the element to land on is read before it goes
    let focusAfterClose: HTMLElement | null = null;

    const { foundation, state } = useFoundation<Foundation, Adapter, BannerProps, BannerState>(
        BannerFoundation,
        props,
        () => ({ visible: true }),
        (base) => ({
            hide: () => base.setState({ visible: false }),
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
                role="alert"
            >
                <div ref={handoverFocus} class={`${prefixCls}-content-wrapper`}>
                    <div class={`${prefixCls}-content`}>
                        <Show when={showIcon()}>
                            <div class={`${prefixCls}-icon`} x-semi-prop="icon">
                                <Show when={icon() === undefined} fallback={icon()}>
                                    <Dynamic component={iconMap[local.type]} aria-label={locale().locale[local.type]} size="large" />
                                </Show>
                            </div>
                        </Show>
                        <div class={`${prefixCls}-content-body`}>
                            <Show when={hasContent(title())}>
                                <Typography.Title component="div" class={`${prefixCls}-title`} heading={5} x-semi-prop="title">
                                    {title()}
                                </Typography.Title>
                            </Show>
                            <Show when={hasContent(description())}>
                                <Typography.Paragraph component="div" class={`${prefixCls}-description`} x-semi-prop="description">
                                    {description()}
                                </Typography.Paragraph>
                            </Show>
                        </div>
                    </div>
                    <Show when={closeIcon() !== null}>
                        <IconButton
                            type="tertiary"
                            class={`${prefixCls}-close`}
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
                    <div class={`${prefixCls}-extra`} x-semi-prop="children">
                        {extra()}
                    </div>
                </Show>
            </div>
        </Show>
    );
}

import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/banner/constants';
import BannerFoundation, { type BannerAdapter } from '@fibrae/semi-foundation/banner/foundation';
import { findFocusAfter } from '@fibrae/semi-foundation/utils/focus-handover';
import '@fibrae/semi-foundation/banner/banner.scss';
import { IconClose, IconAlertTriangle, IconInfoCircle, IconTickCircle, IconAlertCircle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import { hasContent } from '../_utils';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';
import Typography from '../typography';

const prefixCls = cssClasses.PREFIX;

export type Type = 'info' | 'danger' | 'warning' | 'success';
export interface BannerProps extends ElementProps<'div', 'title'> {
    type?: Type;
    className?: string;
    children?: React.ReactNode;
    fullMode?: boolean;
    title?: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    closeIcon?: React.ReactNode;
    style?: React.CSSProperties;
    bordered?: boolean;
    onClose?(e: React.MouseEvent): void;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

export interface BannerState {
    visible: boolean;
}

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
    const { ref, children, type, className, style, bordered, title, description, fullMode, icon, closeIcon, onClose, ...rest } = props;

    const { locale } = useLocale('Banner');

    // closing removes the whole banner, so the element to land on is read before it goes
    const focusAfterClose = useRef<HTMLElement | null>(null);

    const [foundation, state] = useFoundation<BannerFoundation<BannerProps, BannerState, React.MouseEvent>, BannerAdapter<BannerProps, BannerState, React.MouseEvent>, BannerProps, BannerState>(
        BannerFoundation,
        props,
        () => ({ visible: true }),
        (base) => ({
            hide: () => base.setState({ visible: false }),
            notifyClose: (e) => base.getProps().onClose?.(e),
        })
    );

    const handoverFocus = useFocusHandover<HTMLDivElement>(() => focusAfterClose.current);

    if (!state.visible) {
        return null;
    }

    const TypeIcon = iconMap[type];
    const iconNode = icon === undefined ? TypeIcon && <TypeIcon aria-label={locale[type]} size="large" /> : icon;

    const remove = (e: React.MouseEvent) => {
        e.stopPropagation();
        const root = e.currentTarget.closest(`.${prefixCls}`);
        focusAfterClose.current = root && findFocusAfter(root);
        foundation.removeBanner(e);
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={clsx(prefixCls, className, {
                [`${prefixCls}-${type}`]: type,
                [`${prefixCls}-full`]: fullMode,
                [`${prefixCls}-in-container`]: !fullMode,
                [`${prefixCls}-bordered`]: !fullMode && bordered,
            })}
            style={style}
            role="alert"
        >
            <div ref={handoverFocus} className={`${prefixCls}-content-wrapper`}>
                <div className={`${prefixCls}-content`}>
                    {hasContent(iconNode) && (
                        <div className={`${prefixCls}-icon`} x-semi-prop="icon">
                            {iconNode}
                        </div>
                    )}
                    <div className={`${prefixCls}-content-body`}>
                        {hasContent(title) && (
                            <Typography.Title component="div" className={`${prefixCls}-title`} heading={5} x-semi-prop="title">
                                {title}
                            </Typography.Title>
                        )}
                        {hasContent(description) && (
                            <Typography.Paragraph component="div" className={`${prefixCls}-description`} x-semi-prop="description">
                                {description}
                            </Typography.Paragraph>
                        )}
                    </div>
                </div>
                {!(closeIcon === null) && <Button type="tertiary" className={`${prefixCls}-close`} aria-label={locale.close} size="small" theme="borderless" icon={closeIcon || <IconClose x-semi-prop="closeIcon" />} onClick={remove} />}
            </div>
            {hasContent(children) && (
                <div className={`${prefixCls}-extra`} x-semi-prop="children">
                    {children}
                </div>
            )}
        </div>
    );
}

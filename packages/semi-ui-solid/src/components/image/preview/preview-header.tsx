import { type JSX, Show, children, createMemo, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
import { IconClose } from '@fibrae/semi-icons-solid';
import { hasContent } from '../../../utils/index';
import useLocale from '../../locale/use-locale';
import type { HeaderProps } from '../interface';

const prefixCls = `${cssClasses.PREFIX}-preview-header`;

export default function Header(props: HeaderProps) {
    const locale = useLocale('Image');

    // children() also calls the zero-argument function form
    const closeIcon = children(() => (props.closable ? (props.renderCloseIcon as JSX.Element) : undefined));

    // called again for each title, as the image switches
    const title = createMemo(() => {
        const render = props.renderHeader;
        const value = props.title;
        return render ? untrack(() => render(value)) : value;
    });

    return (
        <section ref={(node) => props.ref?.(node)} class={clsx(prefixCls, props.class, props.classNames?.header)} style={props.styles?.header}>
            <section id={props.titleId} class={clsx(`${prefixCls}-title`, props.classNames?.title)} style={props.styles?.title}>
                {title()}
            </section>
            <Show when={props.closable}>
                <button type="button" class={clsx(`${prefixCls}-close`, props.classNames?.close)} style={props.styles?.close} aria-label={locale().locale.close} onClick={(e) => props.onClose?.(e)}>
                    {hasContent(closeIcon()) ? closeIcon() : <IconClose />}
                </button>
            </Show>
        </section>
    );
}

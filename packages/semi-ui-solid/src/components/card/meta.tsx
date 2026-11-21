import { children, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type CardMetaPart } from '@fibrae/semi-foundation/components/card/constants';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefixCls = cssClasses.PREFIX;

export interface MetaProps extends ElementProps<'div', 'title'> {
    avatar?: JSX.Element;
    classNames?: Partial<Record<CardMetaPart, string>>;
    description?: JSX.Element;
    styles?: Partial<Record<CardMetaPart, JSX.CSSProperties | string>>;
    title?: JSX.Element;
}

export default function Meta(props: MetaProps) {
    const [local, rest] = splitProps(props, ['avatar', 'class', 'classNames', 'description', 'styles', 'title']);

    const avatar = children(() => local.avatar);
    const title = children(() => local.title);
    const description = children(() => local.description);

    return (
        <div {...rest} class={clsx(`${prefixCls}-meta`, local.class)}>
            <Show when={hasContent(avatar())}>
                <div class={clsx(`${prefixCls}-meta-avatar`, local.classNames?.avatar)} style={local.styles?.avatar}>
                    {avatar()}
                </div>
            </Show>
            <Show when={hasContent(title()) || hasContent(description())}>
                <div class={clsx(`${prefixCls}-meta-wrapper`, local.classNames?.section)} style={local.styles?.section}>
                    <Show when={hasContent(title())}>
                        <div class={clsx(`${prefixCls}-meta-wrapper-title`, local.classNames?.title)} style={local.styles?.title}>
                            {title()}
                        </div>
                    </Show>
                    <Show when={hasContent(description())}>
                        <div class={clsx(`${prefixCls}-meta-wrapper-description`, local.classNames?.description)} style={local.styles?.description}>
                            {description()}
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}

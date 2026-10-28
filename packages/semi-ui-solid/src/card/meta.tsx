import { children, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/card/constants';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';

const prefixCls = cssClasses.PREFIX;

export interface MetaProps extends ElementProps<'div', 'title'> {
    avatar?: JSX.Element;
    description?: JSX.Element;
    title?: JSX.Element;
}

export default function Meta(props: MetaProps) {
    const [local, rest] = splitProps(props, ['avatar', 'class', 'description', 'title']);

    const avatar = children(() => local.avatar);
    const title = children(() => local.title);
    const description = children(() => local.description);

    return (
        <div {...rest} class={clsx(`${prefixCls}-meta`, local.class)}>
            <Show when={hasContent(avatar())}>
                <div class={`${prefixCls}-meta-avatar`}>{avatar()}</div>
            </Show>
            <Show when={hasContent(title()) || hasContent(description())}>
                <div class={`${prefixCls}-meta-wrapper`}>
                    <Show when={hasContent(title())}>
                        <div class={`${prefixCls}-meta-wrapper-title`}>{title()}</div>
                    </Show>
                    <Show when={hasContent(description())}>
                        <div class={`${prefixCls}-meta-wrapper-description`}>{description()}</div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}

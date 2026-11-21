import { children, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/components/steps/constants';
import { IconChevronRight } from '@fibrae/semi-icons-solid';
import { mergeStyles } from '../../utils/index';
import type { NavStepProps } from './interface';
import { createStepItem } from './use-step-item';

const prefixCls = css.ITEM;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function NavStep(props: NavStepProps) {
    // nav steps show only the title: description, icon and status of the Step stay off the DOM
    const [local, rest] = splitProps(props, ['active', 'class', 'classNames', 'description', 'icon', 'index', 'onChange', 'onClick', 'onKeyDown', 'role', 'status', 'stepsClassNames', 'stepsStyles', 'style', 'styles', 'title', 'total']);

    const item = createStepItem(local, rest);
    const title = children(() => local.title);

    return (
        <div
            {...rest}
            class={clsx(prefixCls, { [`${prefixCls}-active`]: local.active }, local.stepsClassNames?.item, local.class)}
            style={mergeStyles(local.stepsStyles?.item, local.style)}
            aria-current={local.active ? 'step' : undefined}
            role={item.role()}
            tabIndex={item.tabIndex()}
            onClick={item.onClick}
            onKeyDown={item.onKeyDown}
        >
            <div class={`${prefixCls}-container`}>
                <div class={clsx(`${prefixCls}-content`, local.stepsClassNames?.itemContent, local.classNames?.content)} style={mergeStyles(local.stepsStyles?.itemContent, local.styles?.content)}>
                    <div class={clsx(`${prefixCls}-title`, local.stepsClassNames?.itemTitle, local.classNames?.title)} style={mergeStyles(local.stepsStyles?.itemTitle, local.styles?.title)}>
                        {title()}
                    </div>
                </div>
                <Show when={local.index !== (local.total ?? 0) - 1}>
                    <div class={clsx(`${prefixCls}-icon`, local.stepsClassNames?.itemIcon, local.classNames?.icon)} style={mergeStyles(local.stepsStyles?.itemIcon, local.styles?.icon)}>
                        <IconChevronRight size="small" />
                    </div>
                </Show>
            </div>
        </div>
    );
}

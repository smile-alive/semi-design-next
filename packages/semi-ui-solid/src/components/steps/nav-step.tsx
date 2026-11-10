import { children, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/components/steps/constants';
import { IconChevronRight } from '@fibrae/semi-icons-solid';
import type { NavStepProps } from './interface';
import { createStepItem } from './use-step-item';

const prefixCls = css.ITEM;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function NavStep(props: NavStepProps) {
    // nav steps show only the title: description, icon and status of the Step stay off the DOM
    const [local, rest] = splitProps(props, ['active', 'class', 'description', 'icon', 'index', 'onChange', 'onClick', 'onKeyDown', 'role', 'status', 'title', 'total']);

    const item = createStepItem(local, rest);
    const title = children(() => local.title);

    return (
        <div {...rest} class={clsx(prefixCls, { [`${prefixCls}-active`]: local.active }, local.class)} aria-current={local.active ? 'step' : undefined} role={item.role()} tabIndex={item.tabIndex()} onClick={item.onClick} onKeyDown={item.onKeyDown}>
            <div class={`${prefixCls}-container`}>
                <div class={`${prefixCls}-content`}>
                    <div class={`${prefixCls}-title`}>{title()}</div>
                </div>
                <Show when={local.index !== (local.total ?? 0) - 1}>
                    <div class={`${prefixCls}-icon`}>
                        <IconChevronRight size="small" />
                    </div>
                </Show>
            </div>
        </div>
    );
}

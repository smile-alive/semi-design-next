import { children, mergeProps, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { IconChevronRight } from '@fibrae/semi-icons-solid';
import type { NavStepProps } from './interface';
import { createStepItem } from './use-step-item';

const defaultProps = { prefixCls: css.ITEM } satisfies Partial<NavStepProps>;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function NavStep(rawProps: NavStepProps) {
    const props = mergeProps(defaultProps, rawProps);

    // nav steps show only the title: description, icon and status of the Step stay off the DOM
    const [local, rest] = splitProps(props, ['active', 'class', 'description', 'icon', 'index', 'onChange', 'onClick', 'onKeyDown', 'prefixCls', 'role', 'status', 'title', 'total']);

    const item = createStepItem(local, rest);
    const title = children(() => local.title);

    return (
        <div {...rest} class={clsx(local.prefixCls, { [`${local.prefixCls}-active`]: local.active }, local.class)} aria-current={local.active ? 'step' : undefined} role={item.role()} tabIndex={item.tabIndex()} onClick={item.onClick} onKeyDown={item.onKeyDown}>
            <div class={`${local.prefixCls}-container`}>
                <div class={`${local.prefixCls}-content`}>
                    <div class={`${local.prefixCls}-title`}>{title()}</div>
                </div>
                <Show when={local.index !== (local.total ?? 0) - 1}>
                    <div class={`${local.prefixCls}-icon`}>
                        <IconChevronRight size="small" />
                    </div>
                </Show>
            </div>
        </div>
    );
}

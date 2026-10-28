import { children, Match, mergeProps, Show, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { IconAlertCircle, IconAlertTriangle, IconTickCircle } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import type { BasicStepProps } from './interface';
import { createStepItem } from './use-step-item';

const stepSizeMapIconSize = {
    small: 'large',
    default: 'extra-large',
} as const;

const defaultProps = { prefixCls: css.ITEM, status: 'wait', size: 'default' } satisfies Partial<BasicStepProps>;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function BasicStep(rawProps: BasicStepProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ['active', 'class', 'description', 'done', 'icon', 'onChange', 'onClick', 'onKeyDown', 'prefixCls', 'role', 'size', 'status', 'stepNumber', 'title']);

    const item = createStepItem(local, rest);
    const title = children(() => local.title);
    const description = children(() => local.description);
    const icon = children(() => local.icon);

    // an explicit icon, even null, replaces the status icon
    const customIcon = () => icon() !== undefined;

    const iconSize = () => stepSizeMapIconSize[local.size];

    return (
        <div
            {...rest}
            class={clsx(
                local.prefixCls,
                `${local.prefixCls}-${local.status}`,
                {
                    [`${local.prefixCls}-active`]: local.active,
                    [`${local.prefixCls}-done`]: local.done,
                    [`${local.prefixCls}-hover`]: item.clickable(),
                    [`${local.prefixCls}-clickable`]: item.clickable(),
                    [`${local.prefixCls}-${local.status}-hover`]: item.clickable(),
                },
                local.class
            )}
            aria-current={local.active ? 'step' : undefined}
            role={item.role()}
            tabIndex={item.tabIndex()}
            onClick={item.onClick}
            onKeyDown={item.onKeyDown}
        >
            <div class={`${local.prefixCls}-container`}>
                <div class={`${local.prefixCls}-left`}>
                    <Show when={!customIcon() || hasContent(icon())}>
                        <span
                            class={clsx(`${local.prefixCls}-icon`, {
                                [`${local.prefixCls}-custom-icon`]: customIcon(),
                                [`${local.prefixCls}-icon-process`]: !customIcon() && local.status === 'process',
                            })}
                        >
                            <Show when={!customIcon()} fallback={icon()}>
                                <Switch>
                                    <Match when={local.status === 'error'}>
                                        <IconAlertCircle size={iconSize()} />
                                    </Match>
                                    <Match when={local.status === 'finish'}>
                                        <IconTickCircle size={iconSize()} />
                                    </Match>
                                    <Match when={local.status === 'warning'}>
                                        <IconAlertTriangle size={iconSize()} />
                                    </Match>
                                    <Match when={local.status === 'wait' || local.status === 'process'}>
                                        <span class={`${local.prefixCls}-number-icon`}>{local.stepNumber}</span>
                                    </Match>
                                </Switch>
                            </Show>
                        </span>
                    </Show>
                </div>
                <div class={`${local.prefixCls}-content`}>
                    <div class={`${local.prefixCls}-title`}>
                        <div class={clsx(`${local.prefixCls}-title-text`, { [`${local.prefixCls}-title-text-empty`]: !hasContent(title()) })}>{title()}</div>
                    </div>
                    <Show when={hasContent(description())}>
                        <div class={`${local.prefixCls}-description`}>{description()}</div>
                    </Show>
                </div>
            </div>
        </div>
    );
}

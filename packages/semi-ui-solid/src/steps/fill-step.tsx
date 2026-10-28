import { children, Match, mergeProps, Show, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { IconAlertCircle, IconAlertTriangle, IconTickCircle } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import type { FillStepProps } from './interface';
import { createStepItem } from './use-step-item';

const defaultProps = { prefixCls: css.ITEM, status: 'wait' } satisfies Partial<FillStepProps>;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function FillStep(rawProps: FillStepProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ['active', 'class', 'description', 'icon', 'onChange', 'onClick', 'onKeyDown', 'prefixCls', 'role', 'status', 'stepNumber', 'title']);

    const item = createStepItem(local, rest);
    const title = children(() => local.title);
    const description = children(() => local.description);
    const icon = children(() => local.icon);

    // an explicit icon, even null, replaces the status icon
    const customIcon = () => icon() !== undefined;

    return (
        <div
            {...rest}
            class={clsx(
                {
                    [local.prefixCls]: true,
                    [`${local.prefixCls}-${local.status}`]: true,
                    [`${local.prefixCls}-${local.status}-hover`]: item.clickable(),
                    [`${local.prefixCls}-${local.status}-active`]: item.clickable(),
                    [`${local.prefixCls}-clickable`]: item.clickable(),
                },
                local.class
            )}
            aria-current={local.active ? 'step' : undefined}
            role={item.role()}
            tabIndex={item.tabIndex()}
            onClick={item.onClick}
            onKeyDown={item.onKeyDown}
        >
            <Show when={!customIcon() || hasContent(icon())}>
                <div
                    class={clsx({
                        [`${local.prefixCls}-left`]: true,
                        [`${local.prefixCls}-icon`]: customIcon(),
                        [`${local.prefixCls}-plain`]: !customIcon(),
                        [`${local.prefixCls}-icon-process`]: !customIcon() && local.status === 'process',
                        [`${local.prefixCls}-hover`]: item.clickable(),
                    })}
                >
                    <Show when={!customIcon()} fallback={icon()}>
                        <Switch>
                            <Match when={local.status === 'error'}>
                                <IconAlertCircle size="extra-large" />
                            </Match>
                            <Match when={local.status === 'finish'}>
                                <IconTickCircle size="extra-large" />
                            </Match>
                            <Match when={local.status === 'warning'}>
                                <IconAlertTriangle size="extra-large" />
                            </Match>
                            <Match when={local.status === 'wait' || local.status === 'process'}>{local.stepNumber}</Match>
                        </Switch>
                    </Show>
                </div>
            </Show>
            <div class={`${local.prefixCls}-content`}>
                <div class={`${local.prefixCls}-title`} title={typeof title() === 'string' ? (title() as string) : undefined}>
                    <span class={`${local.prefixCls}-title-text`}>{title()}</span>
                </div>
                <div class={`${local.prefixCls}-description`} title={typeof description() === 'string' ? (description() as string) : undefined}>
                    {description()}
                </div>
            </div>
        </div>
    );
}

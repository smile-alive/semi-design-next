import { children, Match, mergeProps, Show, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/components/steps/constants';
import { IconAlertCircle, IconAlertTriangle, IconTickCircle } from '@fibrae/semi-icons-solid';
import hasContent from '../../utils/has-content';
import type { FillStepProps } from './interface';
import { createStepItem } from './use-step-item';

const defaultProps = { status: 'wait' } satisfies Partial<FillStepProps>;

const prefixCls = css.ITEM;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function FillStep(rawProps: FillStepProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ['active', 'class', 'description', 'icon', 'onChange', 'onClick', 'onKeyDown', 'role', 'status', 'stepNumber', 'title']);

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
                    [prefixCls]: true,
                    [`${prefixCls}-${local.status}`]: true,
                    [`${prefixCls}-${local.status}-hover`]: item.clickable(),
                    [`${prefixCls}-${local.status}-active`]: item.clickable(),
                    [`${prefixCls}-clickable`]: item.clickable(),
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
                        [`${prefixCls}-left`]: true,
                        [`${prefixCls}-icon`]: customIcon(),
                        [`${prefixCls}-plain`]: !customIcon(),
                        [`${prefixCls}-icon-process`]: !customIcon() && local.status === 'process',
                        [`${prefixCls}-hover`]: item.clickable(),
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
            <div class={`${prefixCls}-content`}>
                <div class={`${prefixCls}-title`} title={typeof title() === 'string' ? (title() as string) : undefined}>
                    <span class={`${prefixCls}-title-text`}>{title()}</span>
                </div>
                <div class={`${prefixCls}-description`} title={typeof description() === 'string' ? (description() as string) : undefined}>
                    {description()}
                </div>
            </div>
        </div>
    );
}

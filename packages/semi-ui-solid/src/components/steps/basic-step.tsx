import { children, Match, mergeProps, Show, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/components/steps/constants';
import { IconAlertCircle, IconAlertTriangle, IconTickCircle } from '@fibrae/semi-icons-solid';
import { hasContent, mergeStyles } from '../../utils/index';
import type { BasicStepProps } from './interface';
import { createStepItem } from './use-step-item';

const stepSizeMapIconSize = {
    small: 'large',
    default: 'extra-large',
} as const;

const defaultProps = { status: 'wait', size: 'default' } satisfies Partial<BasicStepProps>;

const prefixCls = css.ITEM;

// An internal item: Steps builds its props, so the global defaults of Step do not apply
export default function BasicStep(rawProps: BasicStepProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ['active', 'class', 'classNames', 'description', 'done', 'icon', 'onChange', 'onClick', 'onKeyDown', 'role', 'size', 'status', 'stepNumber', 'stepsClassNames', 'stepsStyles', 'style', 'styles', 'title']);

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
                prefixCls,
                `${prefixCls}-${local.status}`,
                {
                    [`${prefixCls}-active`]: local.active,
                    [`${prefixCls}-done`]: local.done,
                    [`${prefixCls}-hover`]: item.clickable(),
                    [`${prefixCls}-clickable`]: item.clickable(),
                    [`${prefixCls}-${local.status}-hover`]: item.clickable(),
                },
                local.stepsClassNames?.item,
                local.class
            )}
            style={mergeStyles(local.stepsStyles?.item, local.style)}
            aria-current={local.active ? 'step' : undefined}
            role={item.role()}
            tabIndex={item.tabIndex()}
            onClick={item.onClick}
            onKeyDown={item.onKeyDown}
        >
            <div class={`${prefixCls}-container`}>
                <div class={`${prefixCls}-left`}>
                    <Show when={!customIcon() || hasContent(icon())}>
                        <span
                            class={clsx(
                                `${prefixCls}-icon`,
                                {
                                    [`${prefixCls}-custom-icon`]: customIcon(),
                                    [`${prefixCls}-icon-process`]: !customIcon() && local.status === 'process',
                                },
                                local.stepsClassNames?.itemIcon,
                                local.classNames?.icon
                            )}
                            style={mergeStyles(local.stepsStyles?.itemIcon, local.styles?.icon)}
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
                                        <span class={`${prefixCls}-number-icon`}>{local.stepNumber}</span>
                                    </Match>
                                </Switch>
                            </Show>
                        </span>
                    </Show>
                </div>
                <div class={clsx(`${prefixCls}-content`, local.stepsClassNames?.itemContent, local.classNames?.content)} style={mergeStyles(local.stepsStyles?.itemContent, local.styles?.content)}>
                    <div class={clsx(`${prefixCls}-title`, local.stepsClassNames?.itemTitle, local.classNames?.title)} style={mergeStyles(local.stepsStyles?.itemTitle, local.styles?.title)}>
                        <div class={clsx(`${prefixCls}-title-text`, { [`${prefixCls}-title-text-empty`]: !hasContent(title()) })}>{title()}</div>
                    </div>
                    <Show when={hasContent(description())}>
                        <div class={clsx(`${prefixCls}-description`, local.stepsClassNames?.itemDescription, local.classNames?.description)} style={mergeStyles(local.stepsStyles?.itemDescription, local.styles?.description)}>
                            {description()}
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}

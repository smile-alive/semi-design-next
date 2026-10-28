import { createEffect, createMemo, createSignal, For, type JSX, on, onCleanup, Show, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/progress/constants';
import { type StrokeArr, generateColor } from '@fibrae/semi-foundation/progress/generates';
import { calcCircleGeometry, calcPercent, createPercentAnimation } from '@fibrae/semi-foundation/progress/utils';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/progress/progress.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export interface ProgressProps extends ElementProps<'div', 'children'> {
    direction?: 'horizontal' | 'vertical';
    format?: (percent: number) => JSX.Element;
    indeterminate?: boolean;
    motion?: boolean;
    orbitStroke?: string;
    percent?: number;
    showInfo?: boolean;
    size?: Size;
    stroke?: string | StrokeArr;
    strokeGradient?: boolean;
    strokeLinecap?: 'round' | 'square';
    strokeWidth?: number;
    type?: 'line' | 'circle';
    width?: number;
}

const defaultProps = {
    direction: 'horizontal',
    format: (percent: number) => `${percent}%`,
    indeterminate: false,
    motion: true,
    percent: 0,
    showInfo: false,
    size: 'default',
    strokeGradient: false,
    strokeLinecap: 'round',
    strokeWidth: 4,
    type: 'line',
} satisfies Partial<ProgressProps>;

export default function Progress(rawProps: ProgressProps) {
    const props = useDefaultProps('Progress', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['class', 'direction', 'format', 'indeterminate', 'motion', 'orbitStroke', 'percent', 'showInfo', 'size', 'stroke', 'strokeGradient', 'strokeLinecap', 'strokeWidth', 'type', 'width']);

    // only the initial value: later changes reach it through the animation below
    const [shown, setShown] = createSignal(untrack(() => local.percent));

    const animation = createPercentAnimation(setShown);
    const percent = createMemo(() => calcPercent(local.percent));
    const strokeColor = createMemo(() => (Array.isArray(local.stroke) ? generateColor(local.stroke, percent(), local.strokeGradient) : local.stroke));
    const diameter = createMemo(() => local.width || (local.size === 'small' ? 24 : 72));
    const geometry = createMemo(() => calcCircleGeometry(diameter(), local.strokeWidth, percent(), local.indeterminate));

    const text = () => local.format(calcPercent(shown()));

    const horizontal = () => local.direction === strings.DEFAULT_DIRECTION;

    const valueNow = () => (local.indeterminate ? undefined : percent());

    // Not deferred, so the first change reports the initial percent as `previous` and the NaN check covers it; a
    // deferred on() would report undefined there
    createEffect(
        on(
            createMemo(() => local.percent, undefined, { equals: Object.is }),
            (next, previous) => {
                if (previous !== undefined) {
                    animation.update(next, previous, shown(), local.motion);
                }
            }
        )
    );

    onCleanup(animation.stop);

    return (
        <Show
            when={local.type === 'line'}
            fallback={
                <div {...rest} class={clsx(`${prefixCls}-circle`, local.class)} aria-valuemax={100} aria-valuemin={0} aria-valuenow={valueNow()} role="progressbar">
                    {/* keyed by size so a size change restarts the ring from its new geometry */}
                    <For each={[local.size]}>
                        {() => (
                            <svg class={`${prefixCls}-circle-ring`} aria-hidden="true" height={diameter()} width={diameter()}>
                                <circle
                                    class={`${prefixCls}-circle-ring-track`}
                                    style={{ stroke: local.orbitStroke }}
                                    aria-hidden="true"
                                    cx={geometry().center}
                                    cy={geometry().center}
                                    fill="transparent"
                                    r={geometry().radius}
                                    stroke-dasharray={`${geometry().circumference} ${geometry().circumference}`}
                                    stroke-dashoffset={0}
                                    stroke-linecap={local.strokeLinecap}
                                    stroke-width={local.strokeWidth}
                                />
                                <circle
                                    class={clsx(`${prefixCls}-circle-ring-inner`, { [`${prefixCls}-circle-ring-inner-indeterminate`]: local.indeterminate })}
                                    style={{ stroke: strokeColor() }}
                                    aria-hidden="true"
                                    cx={geometry().center}
                                    cy={geometry().center}
                                    fill="transparent"
                                    r={geometry().radius}
                                    stroke-dasharray={geometry().strokeDasharray}
                                    stroke-dashoffset={geometry().strokeDashoffset}
                                    stroke-linecap={local.strokeLinecap}
                                    stroke-width={local.strokeWidth}
                                />
                            </svg>
                        )}
                    </For>
                    <Show when={local.showInfo && local.size !== 'small' && !local.indeterminate}>
                        <span class={`${prefixCls}-circle-text`}>{text()}</span>
                    </Show>
                </div>
            }
        >
            <div
                {...rest}
                class={clsx(prefixCls, local.class, {
                    [`${prefixCls}-horizontal`]: horizontal(),
                    [`${prefixCls}-vertical`]: !horizontal(),
                    [`${prefixCls}-large`]: local.size === 'large',
                    [`${prefixCls}-indeterminate`]: local.indeterminate,
                })}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={valueNow()}
                role="progressbar"
            >
                <div class={`${prefixCls}-track`} style={local.orbitStroke ? { 'background-color': local.orbitStroke } : {}} aria-hidden="true">
                    <div
                        class={clsx(`${prefixCls}-track-inner`, { [`${prefixCls}-track-inner-indeterminate`]: local.indeterminate })}
                        // indeterminate is driven by CSS animation; percent is ignored
                        style={{ background: strokeColor(), ...(local.indeterminate ? {} : horizontal() ? { width: `${percent()}%` } : { height: `${percent()}%` }) }}
                        aria-hidden="true"
                    />
                </div>
                <Show when={local.showInfo && !local.indeterminate}>
                    <div class={`${prefixCls}-line-text`}>{text()}</div>
                </Show>
            </div>
        </Show>
    );
}

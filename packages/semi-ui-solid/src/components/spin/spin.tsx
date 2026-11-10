import { children, createEffect, on, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/spin/constants';
import SpinFoundation, { type SpinAdapter, type SpinState } from '@fibrae/semi-foundation/components/spin/foundation';
import '@fibrae/semi-foundation/components/spin/spin.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { hasContent, mergeRefs } from '../../utils/index';
import useLocale from '../locale/use-locale';
import SpinIcon from './icon';

const prefixCls = cssClasses.PREFIX;

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps extends ElementProps<'div'> {
    size?: SpinSize;
    spinning?: boolean;
    indicator?: JSX.Element;
    delay?: number;
    tip?: JSX.Element;
    wrapperClassName?: string;
    childStyle?: JSX.CSSProperties | string;
}

type Foundation = SpinFoundation<SpinProps>;
type Adapter = SpinAdapter<SpinProps>;

const defaultProps = {
    size: 'middle',
    spinning: true,
    delay: 0,
} satisfies Partial<SpinProps>;

export default function Spin(rawProps: SpinProps) {
    const props = useDefaultProps('Spin', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['ref', 'children', 'class', 'wrapperClassName', 'childStyle', 'size', 'spinning', 'indicator', 'delay', 'tip']);

    const locale = useLocale('Spin');

    let root!: HTMLDivElement;

    const { foundation, state } = useFoundation<Foundation, Adapter, SpinProps, SpinState>(
        SpinFoundation,
        props,
        (view) => SpinFoundation.getInitialState(view),
        () => ({})
    );

    const content = children(() => local.children);

    const loading = () => (local.delay ? state().loading : local.spinning);

    const tip = children(() => (loading() ? local.tip : undefined));
    const indicator = children(() => (loading() ? local.indicator : undefined));

    const blocked = () => loading() && hasContent(content());

    createEffect(on(blocked, (isBlocked) => foundation.handleBlockedChange(root, isBlocked)));

    return (
        <div
            tabIndex={blocked() ? -1 : undefined}
            {...rest}
            ref={mergeRefs(local.ref, (node: HTMLDivElement) => (root = node))}
            class={clsx(prefixCls, local.wrapperClassName, local.class, {
                [`${prefixCls}-${local.size}`]: local.size,
                [`${prefixCls}-block`]: hasContent(content()),
                [`${prefixCls}-hidden`]: !loading(),
            })}
            // content that is being replaced is not final yet; a bare spinner is the status itself
            aria-busy={blocked() || undefined}
        >
            <Show when={loading()}>
                {/* <output> is a live status region; absolutely positioned, it blockifies like a div */}
                <output class={`${prefixCls}-wrapper`} aria-label={locale().locale.loading}>
                    <Show when={hasContent(indicator())} fallback={<SpinIcon />}>
                        <div class={`${prefixCls}-animate`} x-semi-prop="indicator">
                            {indicator()}
                        </div>
                    </Show>
                    <Show when={hasContent(tip())}>
                        <div x-semi-prop="tip">{tip()}</div>
                    </Show>
                </output>
            </Show>
            <div class={`${prefixCls}-children`} style={local.childStyle} inert={blocked()} x-semi-prop="children">
                {content()}
            </div>
        </div>
    );
}

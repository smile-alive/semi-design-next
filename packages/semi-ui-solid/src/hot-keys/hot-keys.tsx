import { children, createEffect, createMemo, Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, Keys } from '@fibrae/semi-foundation/hot-keys/constants';
import HotKeysFoundation, { type HotKeysAdapter } from '@fibrae/semi-foundation/hot-keys/foundation';
import '@fibrae/semi-foundation/hot-keys/hot-keys.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';

const prefixCls = cssClasses.PREFIX;

export interface HotKeysProps extends ElementProps<'div', 'content' | 'children'> {
    preventDefault?: boolean;
    hotKeys: KeyboardEvent['key'][];
    content?: string[];
    onHotKey?: (e: KeyboardEvent) => void;
    /** `null`, or a function returning `null`, renders no root element; the shortcut stays active */
    render?: (() => JSX.Element) | JSX.Element;
    getListenerTarget?: () => HTMLElement | null | undefined;
}

export interface HotKeysState {}

// module level: a stable identity is not a target change on every render
function getDefaultTarget() {
    return document.body;
}

const defaultProps = {
    preventDefault: false,
    getListenerTarget: getDefaultTarget,
} satisfies Partial<HotKeysProps>;

const sameKeys = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((key, index) => key === b[index]);

function HotKeys(rawProps: HotKeysProps) {
    const props = useDefaultProps('HotKeys', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['hotKeys', 'content', 'onHotKey', 'preventDefault', 'render', 'getListenerTarget', 'class']);

    const { foundation } = useFoundation<HotKeysFoundation, HotKeysAdapter<HotKeysProps, HotKeysState>, HotKeysProps, HotKeysState>(
        HotKeysFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyHotKey: (e) => base.getProps().onHotKey?.(e),
        })
    );

    // children() calls a function, which JSX.Element itself does not admit
    const custom = children(() => local.render as JSX.Element);
    const keys = createMemo(() => local.content ?? local.hotKeys);

    // an inline array is new on every parent update
    const hotKeys = createMemo(() => [...local.hotKeys], undefined, { equals: sameKeys });

    // tracked on purpose: signals read by `getListenerTarget` also move the listener. Declared after the host's init
    // effect, so the first run finds the target already bound
    createEffect(foundation.handleTargetChange);
    useWatch(hotKeys, foundation.handleHotKeysChange);

    return (
        <Show when={custom() !== null}>
            <div {...rest} class={clsx(prefixCls, local.class)}>
                <Show
                    when={custom() !== undefined}
                    fallback={
                        <Index each={keys()}>
                            {(key, index) => (
                                <span>
                                    <Show when={index > 0}>
                                        <span class={`${prefixCls}-split`}>+</span>
                                    </Show>
                                    <span class={`${prefixCls}-content`}>{key()}</span>
                                </span>
                            )}
                        </Index>
                    }
                >
                    {custom()}
                </Show>
            </div>
        </Show>
    );
}

export default Object.assign(HotKeys, { Keys });

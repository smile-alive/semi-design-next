import type React from 'react';
import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses, Keys } from '@fibrae/semi-foundation/hot-keys/constants';
import HotKeysFoundation, { type HotKeysAdapter } from '@fibrae/semi-foundation/hot-keys/foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/hot-keys/hot-keys.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';

const prefixCls = cssClasses.PREFIX;

export interface HotKeysProps extends ElementProps<'div', 'content' | 'children'> {
    preventDefault?: boolean;
    hotKeys: KeyboardEvent['key'][];
    content?: string[];
    onHotKey?: (e: KeyboardEvent) => void;
    render?: (() => ReactNode) | ReactNode;
    getListenerTarget?: () => HTMLElement | null | undefined;
    className?: string;
    style?: React.CSSProperties;
    /** Attached to the root element, which is not rendered when `render` yields null */
    ref?: React.Ref<HTMLDivElement>;
}

export interface HotKeysState {}

// module level: a stable identity is not a target change on every render
function getDefaultTarget() {
    return document.body;
}

const defaultProps = {
    preventDefault: false,
    content: null,
    onHotKey: noop,
    getListenerTarget: getDefaultTarget,
    className: '',
    style: null,
} satisfies Partial<HotKeysProps>;

function HotKeys(rawProps: HotKeysProps) {
    const props = useDefaultProps('HotKeys', rawProps, defaultProps);
    const { ref, hotKeys, content, onHotKey, preventDefault, render, getListenerTarget, className, style, ...rest } = props;

    const [foundation] = useFoundation<HotKeysFoundation, HotKeysAdapter<HotKeysProps, HotKeysState>, HotKeysProps, HotKeysState>(
        HotKeysFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyHotKey: (e) => base.getProps().onHotKey?.(e),
        })
    );

    const custom = typeof render === 'function' ? render() : render;

    // init runs in the layout phase, when refs to a parent or a later sibling are still null
    useEffect(() => {
        foundation.handleTargetChange();
    }, [foundation]);

    useDidUpdate(props.getListenerTarget, () => foundation.handleTargetChange());
    useDidUpdate(props.hotKeys, () => foundation.handleHotKeysChange());

    if (render !== undefined && custom === null) {
        return null;
    }

    return (
        <div {...rest} ref={ref} className={clsx(prefixCls, className)} style={style}>
            {render !== undefined
                ? custom
                : (content ?? hotKeys).map((key: KeyboardEvent['key'], index) => (
                      <span key={index}>
                          {index > 0 && <span className={prefixCls + '-split'}>+</span>}
                          <span className={prefixCls + '-content'}>{key}</span>
                      </span>
                  ))}
        </div>
    );
}

export default Object.assign(HotKeys, { Keys });

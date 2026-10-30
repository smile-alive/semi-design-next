import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses as css } from '@fibrae/semi-foundation/spin/constants';
import SpinFoundation, { type SpinAdapter } from '@fibrae/semi-foundation/spin/foundation';
import '@fibrae/semi-foundation/spin/spin.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import { hasContent } from '../_utils';
import useLocale from '../locale/use-locale';
import SpinIcon from './icon';

const prefixCls = css.PREFIX;

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps extends ElementProps<'div'> {
    size?: SpinSize;
    spinning?: boolean;
    indicator?: React.ReactNode;
    delay?: number;
    tip?: React.ReactNode;
    wrapperClassName?: string;
    style?: React.CSSProperties;
    childStyle?: React.CSSProperties;
    children?: React.ReactNode;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

interface SpinState {
    loading: boolean;
}

const defaultProps = {
    size: 'middle',
    spinning: true,
    delay: 0,
} satisfies Partial<SpinProps>;

export default function Spin(rawProps: SpinProps) {
    const props = useDefaultProps('Spin', rawProps, defaultProps);
    const { ref, children, style, className, wrapperClassName, childStyle, size, spinning, indicator, delay, tip, ...rest } = props;

    const { locale } = useLocale('Spin');

    const rootRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<SpinFoundation<SpinProps, SpinState>, SpinAdapter<SpinProps, SpinState>, SpinProps, SpinState>(
        SpinFoundation,
        props,
        () => ({ loading: props.spinning }),
        (base) => ({
            setLoading: (loading) => base.setState({ loading }),
        })
    );

    const loading = delay ? state.loading : spinning;
    const blocked = loading && hasContent(children);
    const mergedRef = useMergedRef(ref, rootRef);

    useDidUpdate(props.spinning, foundation.handleSpinningChange);
    useLayoutEffect(() => foundation.handleBlockedChange(rootRef.current, blocked), [blocked, foundation]);

    return (
        <div
            tabIndex={blocked ? -1 : undefined}
            {...rest}
            ref={mergedRef}
            className={clsx(prefixCls, wrapperClassName, className, {
                [`${prefixCls}-${size}`]: size,
                [`${prefixCls}-block`]: hasContent(children),
                [`${prefixCls}-hidden`]: !loading,
            })}
            style={style}
            // content that is being replaced is not final yet; a bare spinner is the status itself
            aria-busy={blocked || undefined}
        >
            {loading && (
                // <output> is a live status region; absolutely positioned, it blockifies like a div
                <output className={`${prefixCls}-wrapper`} aria-label={locale.loading}>
                    {indicator ? (
                        <div className={`${prefixCls}-animate`} x-semi-prop="indicator">
                            {indicator}
                        </div>
                    ) : (
                        <SpinIcon />
                    )}
                    {hasContent(tip) && <div x-semi-prop="tip">{tip}</div>}
                </output>
            )}
            <div className={`${prefixCls}-children`} style={childStyle} inert={blocked} x-semi-prop="children">
                {children}
            </div>
        </div>
    );
}

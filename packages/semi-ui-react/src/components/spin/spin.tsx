import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { type SpinPart, cssClasses as css } from '@fibrae/semi-foundation/components/spin/constants';
import SpinFoundation, { type SpinAdapter, type SpinState } from '@fibrae/semi-foundation/components/spin/foundation';
import '@fibrae/semi-foundation/components/spin/spin.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useMergedRef } from '../../hooks/index';
import { hasContent } from '../../utils/index';
import useLocale from '../locale/use-locale';
import SpinIcon from './icon';

type Foundation = SpinFoundation<SpinProps>;
type Adapter = SpinAdapter<SpinProps>;

const prefixCls = css.PREFIX;

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps extends ElementProps<'div'> {
    size?: SpinSize;
    spinning?: boolean;
    indicator?: React.ReactNode;
    delay?: number;
    tip?: React.ReactNode;
    classNames?: Partial<Record<SpinPart, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<SpinPart, React.CSSProperties>>;
    children?: React.ReactNode;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    size: 'middle',
    spinning: true,
    delay: 0,
} satisfies Partial<SpinProps>;

export default function Spin(rawProps: SpinProps) {
    const props = useDefaultProps('Spin', rawProps, defaultProps);
    const { ref, children, style, className, classNames, styles, size, spinning, indicator, delay, tip, ...rest } = props;

    const { locale } = useLocale('Spin');

    const rootRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, SpinProps, SpinState>(
        SpinFoundation,
        props,
        () => SpinFoundation.getInitialState(props),
        () => ({})
    );

    const loading = delay ? state.loading : spinning;
    const blocked = loading && hasContent(children);
    const mergedRef = useMergedRef(ref, rootRef);

    useLayoutEffect(() => foundation.handleBlockedChange(rootRef.current, blocked), [blocked, foundation]);

    return (
        <div
            tabIndex={blocked ? -1 : undefined}
            {...rest}
            ref={mergedRef}
            className={clsx(prefixCls, className, {
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
            <div className={clsx(`${prefixCls}-children`, classNames?.child)} style={styles?.child} inert={blocked} x-semi-prop="children">
                {children}
            </div>
        </div>
    );
}

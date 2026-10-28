import type React from 'react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/progress/constants';
import { type StrokeArr, generateColor } from '@fibrae/semi-foundation/progress/generates';
import { calcCircleGeometry, calcPercent, createPercentAnimation } from '@fibrae/semi-foundation/progress/utils';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/progress/progress.scss';
import type { ElementProps, Motion } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';

const prefixCls = cssClasses.PREFIX;

export interface ProgressProps extends ElementProps<'div', 'children'> {
    className?: string;
    direction?: 'horizontal' | 'vertical';
    format?: (percent: number) => React.ReactNode;
    indeterminate?: boolean;
    motion?: Motion;
    orbitStroke?: string;
    percent?: number;
    showInfo?: boolean;
    size?: Size;
    stroke?: string | StrokeArr;
    strokeGradient?: boolean;
    strokeLinecap?: 'round' | 'square';
    strokeWidth?: number;
    style?: React.CSSProperties;
    type?: 'line' | 'circle';
    width?: number;
    /** Attached to the root element (the `role="progressbar"` div) */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    className: '',
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
    style: {},
    type: 'line',
} satisfies Partial<ProgressProps>;

function selectStroke(stroke: string | StrokeArr | undefined, percent: number, strokeGradient: boolean) {
    return Array.isArray(stroke) ? generateColor(stroke, percent, strokeGradient) : stroke;
}

export default function Progress(rawProps: ProgressProps) {
    const { ref, className, direction, format, indeterminate, motion, orbitStroke, percent, showInfo, size, stroke, strokeGradient, strokeLinecap, strokeWidth, type, width, ...rest } = useDefaultProps('Progress', rawProps, defaultProps);

    const [percentNumber, setPercentNumber] = useState(percent);
    const [animation] = useState(() => createPercentAnimation(setPercentNumber));

    const perc = calcPercent(percent);
    const percNumber = calcPercent(percentNumber);
    const strokeColor = selectStroke(stroke, perc, strokeGradient);
    const text = format(percNumber);

    useDidUpdate(percent, (next, previous) => animation.update(next, previous, percentNumber, motion));
    useEffect(() => () => animation.stop(), [animation]);

    if (type === 'line') {
        const innerStyle: React.CSSProperties = { background: strokeColor };
        // indeterminate is driven by CSS animation; percent is ignored
        if (!indeterminate) {
            if (direction === strings.DEFAULT_DIRECTION) {
                innerStyle.width = `${perc}%`;
            } else {
                innerStyle.height = `${perc}%`;
            }
        }
        return (
            <div
                {...rest}
                ref={ref}
                className={clsx(prefixCls, className, {
                    [`${prefixCls}-horizontal`]: direction === strings.DEFAULT_DIRECTION,
                    [`${prefixCls}-vertical`]: direction !== strings.DEFAULT_DIRECTION,
                    [`${prefixCls}-large`]: size === 'large',
                    [`${prefixCls}-indeterminate`]: indeterminate,
                })}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={indeterminate ? undefined : perc}
                role="progressbar"
            >
                <div className={`${prefixCls}-track`} style={orbitStroke ? { backgroundColor: orbitStroke } : {}} aria-hidden>
                    <div
                        className={clsx(`${prefixCls}-track-inner`, {
                            [`${prefixCls}-track-inner-indeterminate`]: indeterminate,
                        })}
                        style={innerStyle}
                        aria-hidden
                    />
                </div>
                {showInfo && !indeterminate && <div className={`${prefixCls}-line-text`}>{text}</div>}
            </div>
        );
    }

    const diameter = width || (size === 'small' ? 24 : 72);
    const { center, radius, circumference, strokeDasharray, strokeDashoffset } = calcCircleGeometry(diameter, strokeWidth, perc, indeterminate);

    return (
        <div {...rest} ref={ref} className={clsx(`${prefixCls}-circle`, className)} aria-valuemax={100} aria-valuemin={0} aria-valuenow={indeterminate ? undefined : perc} role="progressbar">
            <svg key={size} className={`${prefixCls}-circle-ring`} aria-hidden height={diameter} width={diameter}>
                <circle className={`${prefixCls}-circle-ring-track`} style={{ stroke: orbitStroke }} aria-hidden cx={center} cy={center} fill="transparent" r={radius} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={0} strokeLinecap={strokeLinecap} strokeWidth={strokeWidth} />
                <circle
                    className={clsx(`${prefixCls}-circle-ring-inner`, {
                        [`${prefixCls}-circle-ring-inner-indeterminate`]: indeterminate,
                    })}
                    style={{ stroke: strokeColor }}
                    aria-hidden
                    cx={center}
                    cy={center}
                    fill="transparent"
                    r={radius}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap={strokeLinecap}
                    strokeWidth={strokeWidth}
                />
            </svg>
            {showInfo && size !== 'small' && !indeterminate && <span className={`${prefixCls}-circle-text`}>{text}</span>}
        </div>
    );
}

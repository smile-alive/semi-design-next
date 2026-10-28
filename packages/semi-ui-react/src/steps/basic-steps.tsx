import type React from 'react';
import { cloneElement, Children, isValidElement, type ReactElement } from 'react';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { getStepState } from '@fibrae/semi-foundation/steps/utils';
import type { ElementProps } from '../_base/base';
import flattenChildren from '../_base/flatten-children';
import { namedRole } from '../_base/named-role';
import type { Direction, Size, Status } from './types';

export interface BasicStepsProps extends ElementProps<'div', 'onChange'> {
    prefixCls?: string;
    className?: string;
    direction?: Direction;
    current?: number;
    initial?: number;
    status?: Status;
    style?: React.CSSProperties;
    size?: Size;
    hasLine?: boolean;
    children?: React.ReactNode;
    onChange?: (current: number) => void;
    'aria-label'?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function Steps({ size = 'default', current = 0, status = 'process', children, prefixCls = css.PREFIX, initial = 0, direction = 'horizontal', className, hasLine = true, onChange, ...rest }: BasicStepsProps) {
    const filteredChildren = flattenChildren(children).filter((c) => isValidElement(c)) as Array<ReactElement<any>>;

    const inner = Children.map(filteredChildren, (child: React.ReactElement<any>, index) => {
        // a host element keeps its position but takes no step props, which React would report as unknown DOM attributes
        if (typeof child.type === 'string') {
            return child;
        }
        const stepNumber = initial + index;
        const childProps = {
            stepNumber: `${stepNumber + 1}`,
            size,
            ...child.props,
        };

        const state = getStepState(stepNumber, current, status, Boolean(child.props.status));
        if (state.nextError) {
            childProps.className = clsx(child.props.className, `${prefixCls}-next-error`);
        }
        if (state.status) {
            childProps.status = state.status;
        }
        childProps.active = state.active;
        childProps.done = state.done;
        childProps.onChange = onChange
            ? () => {
                  if (stepNumber !== current) {
                      onChange(stepNumber);
                  }
              }
            : undefined;
        return cloneElement(child, { ...childProps });
    });

    const wrapperCls = clsx(className, {
        [`${prefixCls}-basic`]: true,
        [`${prefixCls}-${direction}`]: true,
        [`${prefixCls}-${size}`]: size !== 'default',
        [`${prefixCls}-hasline`]: hasLine,
    });

    return (
        <div {...rest} className={wrapperCls} role={namedRole(rest)}>
            {inner}
        </div>
    );
}

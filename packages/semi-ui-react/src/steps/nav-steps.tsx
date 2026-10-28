import type React from 'react';
import { cloneElement, Children, isValidElement, type ReactElement } from 'react';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import type { ElementProps } from '../_base/base';
import flattenChildren from '../_base/flatten-children';
import { namedRole } from '../_base/named-role';
import type { Size } from './types';

export interface NavStepsProps extends ElementProps<'div', 'onChange'> {
    prefixCls?: string;
    className?: string;
    style?: React.CSSProperties;
    current?: number;
    initial?: number;
    size?: Size;
    children?: React.ReactNode;
    onChange?: (current: number) => void;
    'aria-label'?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function Steps({ size = 'default', current = 0, initial = 0, children, prefixCls = css.PREFIX, className, onChange, ...rest }: NavStepsProps) {
    const filteredChildren = flattenChildren(children).filter((c) => isValidElement(c)) as Array<ReactElement<any>>;
    const total = filteredChildren.length;

    const inner = Children.map(filteredChildren, (child: React.ReactElement<any>, index) => {
        // a host element keeps its position but takes no step props, which React would report as unknown DOM attributes
        if (typeof child.type === 'string') {
            return child;
        }
        const stepNumber = initial + index;
        const childProps = {
            index,
            total,
            ...child.props,
        };
        childProps.active = stepNumber === current;
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
        [`${prefixCls}-nav`]: true,
        [`${prefixCls}-${size}`]: size !== 'default',
    });

    return (
        <div {...rest} className={wrapperCls} role={namedRole(rest)}>
            {inner}
        </div>
    );
}

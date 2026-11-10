import type React from 'react';
import { cloneElement, Children, type ReactElement, isValidElement } from 'react';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/components/steps/constants';
import { getStepState } from '@fibrae/semi-foundation/components/steps/utils';
import { namedRole } from '@fibrae/semi-foundation/utils';
import type { ElementProps } from '../../base/index';
import { flattenChildren } from '../../utils/index';
import { Row, Col } from '../grid';
import type { Direction, Status } from './types';

const prefixCls = css.PREFIX;

export interface FillStepsProps extends ElementProps<'div', 'onChange'> {
    className?: string;
    current?: number;
    direction?: Direction;
    initial?: number;
    status?: Status;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    onChange?: (current: number) => void;
    'aria-label'?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function Steps({ current = 0, status = 'process', children, initial = 0, direction = 'horizontal', className, onChange, ...rest }: FillStepsProps) {
    const filteredChildren = flattenChildren(children).filter((c) => isValidElement(c)) as Array<ReactElement<any>>;
    const colStyle = direction === 'vertical' ? null : { width: `${100 / filteredChildren.length}%` };

    const inner = Children.map(filteredChildren, (child: ReactElement<any>, index) => {
        // a host element keeps its column but takes no step props, which React would report as unknown DOM attributes
        if (typeof child.type === 'string') {
            return <Col style={colStyle}>{child}</Col>;
        }
        const stepNumber = initial + index;
        const childProps = {
            stepNumber: `${stepNumber + 1}`,
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
        childProps.onChange = onChange
            ? () => {
                  if (stepNumber !== current) {
                      onChange(stepNumber);
                  }
              }
            : undefined;
        return <Col style={colStyle}>{cloneElement(child, { ...childProps })}</Col>;
    });

    const wrapperCls = clsx(className, {
        [prefixCls]: true,
        [`${prefixCls}-${direction}`]: true,
    });

    return (
        <div {...rest} className={wrapperCls} role={namedRole(rest)}>
            <Row justify="start">{inner}</Row>
        </div>
    );
}

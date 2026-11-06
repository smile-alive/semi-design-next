import type React from 'react';
import { useMemo, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseState } from '@fibrae/semi-foundation/resizable/foundation';
import '@fibrae/semi-foundation/resizable/resizable.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useEventListener, { getWindow } from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import useResizeObserver from '../_base/use-resize-observer';
import { ResizeContext } from './context';

type Foundation = ResizeGroupFoundation<ResizeGroupProps>;
type Adapter = ResizeGroupAdapter<ResizeGroupProps>;

const prefixCls = cssClasses.PREFIX;

export interface ResizeGroupProps extends ElementProps<'div'> {
    children?: React.ReactNode;
    direction?: 'horizontal' | 'vertical';
    className?: string;
    /** Attached to the group's root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    direction: 'horizontal',
} satisfies Partial<ResizeGroupProps>;

export default function ResizeGroup(rawProps: ResizeGroupProps) {
    const props = useDefaultProps('ResizeGroup', rawProps, defaultProps);
    const { ref, children, direction, className, ...rest } = props;

    const groupRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, ResizeGroupProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        props,
        () => ResizeGroupFoundation.getInitialState(),
        () => ({
            getGroupRef: () => groupRef.current,
        })
    );

    const contextValue = useMemo(
        () => ({
            direction,
            registerItem: foundation.registerItem,
            registerHandler: foundation.registerHandler,
            notifyResizeStart: foundation.onResizeStart,
            notifyResizing: foundation.onResizing,
            notifyResizeEnd: foundation.onResizeEnd,
            notifyKeyDown: foundation.resizeByKey,
        }),
        [direction, foundation]
    );

    const mergedRef = useMergedRef(ref, groupRef);

    // vw and vh limits change with the window even when the group keeps its size
    useEventListener(getWindow, 'resize', () => foundation.ensureConstraint());

    useResizeObserver(groupRef, () => {
        // a group first mounted inside display:none measures 0: lay out again once it becomes measurable. #3336
        foundation.handleGroupResize();
        // a container resize without a window resize can leave px limits violated
        foundation.ensureConstraint();
    });

    return (
        <ResizeContext value={contextValue}>
            <div role={namedRole(rest)} {...rest} ref={mergedRef} className={clsx(className, prefixCls + '-group')} style={{ ...rest.style, flexDirection: direction === 'vertical' ? 'column' : 'row' }}>
                {state.isResizing && <div className={prefixCls + '-background'} style={state.backgroundStyle} />}
                {children}
            </div>
        </ResizeContext>
    );
}

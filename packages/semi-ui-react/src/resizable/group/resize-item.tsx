import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import type { ResizeCallback, ResizeStartCallback } from '@fibrae/semi-foundation/resizable/types';
import type { ElementProps } from '../../_base/base';
import { namedRole } from '../../_base/named-role';
import useDefaultProps from '../../_base/use-default-props';
import useMergedRef from '../../_base/use-merged-ref';
import { useResizeContext } from './resize-context';

const prefixCls = cssClasses.PREFIX;

export interface ResizeItemProps extends ElementProps<'div', 'onChange'> {
    style?: React.CSSProperties;
    className?: string;
    min?: string;
    max?: string;
    children?: React.ReactNode;
    onResizeStart?: ResizeStartCallback;
    onChange?: ResizeCallback;
    onResizeEnd?: ResizeCallback;
    defaultSize?: string | number;
    /** Attached to the item's root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function ResizeItem(rawProps: ResizeItemProps) {
    const props = useDefaultProps('ResizeItem', rawProps, {});
    const { ref, style, className, min, max, children, onResizeStart, onChange, onResizeEnd, defaultSize, ...rest } = props;

    const { registerItem } = useResizeContext('ResizeItem');

    const itemRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(props);

    const mergedRef = useMergedRef(ref, itemRef);

    useLayoutEffect(() => {
        propsRef.current = props;
    });

    useLayoutEffect(() => registerItem(itemRef, propsRef), [registerItem]);

    return (
        <div role={namedRole(rest)} {...rest} ref={mergedRef} className={clsx(className, prefixCls + '-item')} style={style}>
            {children}
        </div>
    );
}

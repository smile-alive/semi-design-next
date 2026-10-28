import { type JSX, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import type { ResizeCallback, ResizeStartCallback } from '@fibrae/semi-foundation/resizable/types';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import { useResizeGroupContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface ResizeItemProps extends ElementProps<'div', 'onChange'> {
    min?: string;
    max?: string;
    onResizeStart?: ResizeStartCallback;
    onChange?: ResizeCallback;
    onResizeEnd?: ResizeCallback;
    defaultSize?: string | number;
}

export default function ResizeItem(rawProps: ResizeItemProps) {
    const props = useDefaultProps('ResizeItem', rawProps, {});
    const [local, rest] = splitProps(props, ['ref', 'class', 'children', 'min', 'max', 'onResizeStart', 'onChange', 'onResizeEnd', 'defaultSize']);

    const group = useResizeGroupContext('ResizeItem');

    // The group writes style.width and style.height on the element directly. Known limit: a consumer's string style is
    // reapplied whole when it changes and drops them, while an object style leaves them alone; upgrade by replaying
    // the sizes after the group's update if string styles are needed.
    const register = (el: HTMLDivElement) =>
        onCleanup(
            group.registerItem({
                el,
                min: () => props.min,
                max: () => props.max,
                defaultSize: () => props.defaultSize,
                start: (e, direction) => props.onResizeStart?.(e, direction),
                change: (size, e, direction) => props.onChange?.(size, e, direction),
                end: (size, e, direction) => props.onResizeEnd?.(size, e, direction),
            })
        );

    return (
        <div role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']} {...rest} ref={mergeRefs(local.ref, register)} class={clsx(local.class, `${prefixCls}-item`)}>
            {local.children}
        </div>
    );
}

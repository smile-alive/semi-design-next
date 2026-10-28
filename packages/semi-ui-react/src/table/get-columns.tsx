import React from 'react';
import { omit } from 'es-toolkit';
import elementTypeOf from '../_base/element-type';
import Column from './column';
import type { ColumnProps } from './interface';

/**
 * Convert jsx children into object columns
 */
export default function getColumns(children: React.ReactNode) {
    if (children) {
        const columns: ColumnProps[] = [];

        React.Children.forEach(children, (child) => {
            if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) {
                columns.push(...getColumns(child.props.children));
                return;
            }
            if (React.isValidElement<ColumnProps>(child) && elementTypeOf(child) === Column.elementType) {
                const col: ColumnProps = omit(child.props, ['children']);

                const nested = getColumns(child.props.children as React.ReactNode);
                if (nested.length) {
                    col.children = nested;
                }

                columns.push({
                    key: child.key,
                    ...col,
                });
            }
        });

        return columns;
    }

    return [];
}

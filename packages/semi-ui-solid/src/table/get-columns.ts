import { isToken, type Token } from '../_base/token';
import { type ColumnElementProps, TABLE_COLUMN } from './column';
import type { ColumnProps } from './interface';

function collectTokens(node: unknown, tokens: Token<ColumnElementProps>[]) {
    if (Array.isArray(node)) {
        node.forEach((item) => collectTokens(item, tokens));
    } else if (typeof node === 'function' && node.length === 0) {
        // a zero-argument function is how Solid passes a dynamic child
        collectTokens((node as () => unknown)(), tokens);
    } else if (isToken<ColumnElementProps>(node, TABLE_COLUMN)) {
        tokens.push(node);
    }
}

/** Converts `Table.Column` children into column objects; anything else is dropped */
export default function getColumns(children: unknown): ColumnProps[] {
    const tokens: Token<ColumnElementProps>[] = [];
    collectTokens(children, tokens);
    return tokens.map(({ props }) => {
        const column: Record<string, unknown> & ColumnProps = {};
        for (const key of Object.keys(props)) {
            if (key !== 'children') {
                column[key] = props[key as keyof ColumnElementProps];
            }
        }
        const nested = getColumns(props.children);
        if (nested.length) {
            column.children = nested;
        }
        return column;
    });
}

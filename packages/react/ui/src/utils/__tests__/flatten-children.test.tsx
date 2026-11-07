import { Fragment, isValidElement } from 'react';
import { describe, expect, it } from 'vite-plus/test';
import flattenChildren from '../flatten-children';

const keysOf = (nodes: ReturnType<typeof flattenChildren>) => nodes.map((node) => (isValidElement(node) ? node.key : node));

describe('flattenChildren', () => {
    it('展开嵌套的 Fragment，丢掉不渲染的节点', () => {
        const nodes = flattenChildren([
            <i key="a" />,
            null,
            false,
            <>
                text
                <i key="b" />
                <>
                    <i key="c" />
                </>
            </>,
            0,
        ]);
        expect(nodes.map((node) => (isValidElement(node) ? 'element' : node))).toEqual(['element', 'text', 'element', 'element', 0]);
    });

    it('唯一子节点是 Fragment 时同样展开', () => {
        const nodes = flattenChildren(
            <>
                <i />
                <i />
            </>
        );
        expect(nodes).toHaveLength(2);
    });

    it('不同 Fragment 中同 key 的子项拿到不同的 key，Fragment 的 key 保留在前缀里', () => {
        const nodes = flattenChildren([
            <Fragment key="x">
                <i key="k" />
            </Fragment>,
            <Fragment key="y">
                <i key="k" />
            </Fragment>,
            <i key="k" />,
        ]);
        const keys = keysOf(nodes);
        expect(new Set(keys).size).toBe(3);
        expect(keys[0]).toContain('x');
        expect(keys[1]).toContain('y');
    });
});

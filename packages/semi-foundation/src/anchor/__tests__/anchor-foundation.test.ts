import { describe, expect, it } from 'vite-plus/test';
import AnchorFoundation from '../foundation';

const map = (children) => Object.fromEntries(Object.entries(AnchorFoundation.getChildMap(children)).map(([href, set]) => [href, [...set]]));

describe('AnchorFoundation.getChildMap', () => {
    it('把每个链接映射到其下所有嵌套的链接', () => {
        const tree = [{ href: '#a', children: [{ href: '#b', children: [{ href: '#c' }] }, { href: '#d' }] }, { href: '#e' }];
        expect(map(tree)).toEqual({ '#a': ['#b', '#c', '#d'], '#b': ['#c'], '#c': [], '#d': [], '#e': [] });
    });

    it('单个子项也保留祖先链', () => {
        expect(map([{ href: '#a', children: [{ href: '#b' }] }])).toEqual({ '#a': ['#b'], '#b': [] });
    });

    it('遍历没有 href 的元素，如 fragment 和包装元素', () => {
        const tree = [{ children: [{ href: '#a', children: [{ children: [{ href: '#b' }] }] }] }];
        expect(map(tree)).toEqual({ '#a': ['#b'], '#b': [] });
    });

    it('空树没有子链接', () => {
        expect(map(undefined)).toEqual({});
        expect(map([])).toEqual({});
    });
});

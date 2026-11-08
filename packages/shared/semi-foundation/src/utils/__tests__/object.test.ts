import { describe, expect, it } from 'vite-plus/test';
import { remove, set } from '../object';

describe('object set', () => {
    it('只复制路径上的容器', () => {
        const source = { a: { b: 1 }, c: { d: 2 }, list: [{ x: 1 }, { y: 2 }] };
        const result = set(source, 'list[1].y', 3);
        expect(result).not.toBe(source);
        expect(result.list).not.toBe(source.list);
        expect(result.list[1]).toEqual({ y: 3 });
        expect(result.list[0]).toBe(source.list[0]);
        expect(result.a).toBe(source.a);
        expect(source).toEqual({ a: { b: 1 }, c: { d: 2 }, list: [{ x: 1 }, { y: 2 }] });
    });

    it('创建缺失的容器', () => {
        const source = { a: 1 };
        expect(set(source, 'b.c[1]', 2)).toEqual({ a: 1, b: { c: [undefined, 2] } });
        expect(source).toEqual({ a: 1 });
    });

    it('删除值为 undefined 的叶子，以及因此变空的容器', () => {
        const source = { a: { b: { c: 1 } }, d: 1 };
        expect(set(source, 'a.b.c', undefined)).toEqual({ d: 1 });
        expect(source).toEqual({ a: { b: { c: 1 } }, d: 1 });
    });

    it('保留数组中值为 undefined 的叶子，避免兄弟索引偏移', () => {
        const source = { a: [1, 2] };
        expect(set(source, 'a[0]', undefined)).toEqual({ a: [undefined, 2] });
        expect(source).toEqual({ a: [1, 2] });
    });

    it('allowEmpty 时保留值为 undefined 的叶子', () => {
        const result = set({ a: { b: 1 } }, 'a.b', undefined, true);
        expect(result).toEqual({ a: { b: undefined } });
        expect(Object.hasOwn(result.a, 'b')).toBe(true);
    });
});

describe('object remove', () => {
    it('删除叶子及变空的父级，且不修改源对象', () => {
        const source = { a: { b: 1 }, c: { d: 2 } };
        const result = remove(source, 'a.b');
        expect(result).toEqual({ c: { d: 2 } });
        expect(result.c).toBe(source.c);
        expect(source).toEqual({ a: { b: 1 }, c: { d: 2 } });
    });
});

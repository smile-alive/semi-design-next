import { Fragment, StrictMode, Suspense, lazy, memo } from 'react';
import { describe, expect, it } from 'vite-plus/test';
import elementTypeOf from '../element-type';

const Marked = Object.assign(
    memo(() => null),
    { elementType: 'Marked' }
);
const Plain = () => null;
const Lazy = lazy(async () => ({ default: Plain }));

describe('elementTypeOf', () => {
    it('读取组件声明的 elementType', () => {
        expect(elementTypeOf(<Marked />)).toBe('Marked');
    });

    it('未声明的组件、原生元素与非元素返回 undefined', () => {
        expect(elementTypeOf(<Plain />)).toBeUndefined();
        expect(elementTypeOf(<span />)).toBeUndefined();
        expect(elementTypeOf('text')).toBeUndefined();
        expect(elementTypeOf(null)).toBeUndefined();
    });

    it('type 为 symbol 或 lazy 对象的元素不抛错', () => {
        expect(elementTypeOf(<></>)).toBeUndefined();
        expect(elementTypeOf(<Fragment />)).toBeUndefined();
        expect(elementTypeOf(<Suspense fallback={null} />)).toBeUndefined();
        expect(elementTypeOf(<StrictMode />)).toBeUndefined();
        expect(elementTypeOf(<Lazy />)).toBeUndefined();
    });
});

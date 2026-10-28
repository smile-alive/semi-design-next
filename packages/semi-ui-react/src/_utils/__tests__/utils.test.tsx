import { Fragment, StrictMode, Suspense } from 'react';
import { describe, expect, it } from 'vite-plus/test';
import { IconSearch } from '@fibrae/semi-icons-react';
import { isSemiIcon } from '../index';

describe('isSemiIcon', () => {
    it('Semi 图标返回 true，原生元素与普通组件返回 false', () => {
        expect(isSemiIcon(<IconSearch />)).toBe(true);
        expect(isSemiIcon(<span />)).toBe(false);
        expect(isSemiIcon(<Plain />)).toBe(false);
        expect(isSemiIcon('text')).toBe(false);
    });

    it('type 为 symbol 的 Fragment、Suspense、StrictMode 返回 false，不抛错', () => {
        expect(isSemiIcon(<></>)).toBe(false);
        expect(isSemiIcon(<Fragment />)).toBe(false);
        expect(isSemiIcon(<Suspense fallback={null} />)).toBe(false);
        expect(isSemiIcon(<StrictMode />)).toBe(false);
    });
});

function Plain() {
    return null;
}

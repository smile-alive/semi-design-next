import { describe, expect, it } from 'vite-plus/test';
import CollapseFoundation from '../foundation';

const { getInitialState, deriveActiveSet } = CollapseFoundation;
const keys = (state) => [...state.activeSet];

describe('CollapseFoundation.getInitialState', () => {
    it('打开 defaultActiveKey（字符串或数组）', () => {
        expect(keys(getInitialState({ defaultActiveKey: '1' }))).toEqual(['1']);
        expect(keys(getInitialState({ defaultActiveKey: ['1', '2'] }))).toEqual(['1', '2']);
        expect(keys(getInitialState({ defaultActiveKey: '' }))).toEqual([]);
        expect(keys(getInitialState({}))).toEqual([]);
    });

    it('手风琴模式只打开第一个默认键，但会打开所有受控键', () => {
        expect(keys(getInitialState({ accordion: true, defaultActiveKey: ['1', '2'] }))).toEqual(['1']);
        expect(keys(getInitialState({ accordion: true, defaultActiveKey: [] }))).toEqual([]);
        expect(keys(getInitialState({ accordion: true, activeKey: ['1', '2'] }))).toEqual(['1', '2']);
    });

    it('只要 activeKey 不是 undefined 就优先于 defaultActiveKey，空字符串与 null 是空集合', () => {
        expect(keys(getInitialState({ activeKey: '2', defaultActiveKey: '1' }))).toEqual(['2']);
        expect(keys(getInitialState({ activeKey: [], defaultActiveKey: '1' }))).toEqual([]);
        expect(keys(getInitialState({ activeKey: '', defaultActiveKey: '1' }))).toEqual([]);
        expect(keys(getInitialState({ activeKey: null, defaultActiveKey: '1' }))).toEqual([]);
    });
});

describe('CollapseFoundation.isEverOpened / isContentMounted', () => {
    const base = { hasBody: true, active: false, keepDOM: true, lazyRender: true, everOpened: false };

    it('门闩在面板展开后置位，内容消失时复位', () => {
        expect(CollapseFoundation.isEverOpened({ hasBody: true, active: true, everOpened: false })).toBe(true);
        expect(CollapseFoundation.isEverOpened({ hasBody: true, active: false, everOpened: true })).toBe(true);
        expect(CollapseFoundation.isEverOpened({ hasBody: false, active: true, everOpened: true })).toBe(false);
    });

    it('展开、或 keepDOM 保留（lazyRender 时需渲染过）时内容在 DOM 中', () => {
        expect(CollapseFoundation.isContentMounted({ ...base, active: true, keepDOM: false })).toBe(true);
        expect(CollapseFoundation.isContentMounted({ ...base, keepDOM: false, everOpened: true })).toBe(false);
        expect(CollapseFoundation.isContentMounted(base)).toBe(false);
        expect(CollapseFoundation.isContentMounted({ ...base, everOpened: true })).toBe(true);
        expect(CollapseFoundation.isContentMounted({ ...base, lazyRender: false })).toBe(true);
        expect(CollapseFoundation.isContentMounted({ ...base, hasBody: false, active: true })).toBe(false);
    });
});

describe('CollapseFoundation.deriveActiveSet', () => {
    it('activeKey 不是 undefined 时使用它，空字符串与 null 得到空集合，否则使用 state', () => {
        const state = { activeSet: new Set(['1']) };
        expect([...deriveActiveSet({ activeKey: ['2', '3'] }, state)]).toEqual(['2', '3']);
        expect([...deriveActiveSet({ activeKey: [] }, state)]).toEqual([]);
        expect([...deriveActiveSet({ activeKey: '' }, state)]).toEqual([]);
        expect([...deriveActiveSet({ activeKey: null }, state)]).toEqual([]);
        expect(deriveActiveSet({}, state)).toBe(state.activeSet);
    });
});

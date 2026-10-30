import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { CollapsibleProps } from '../interface';
import Host from './collapsible-host.svelte';

type Store = CollapsibleProps & { text?: string; height?: string; log?: string[] };

const queryContent = () => screen.queryByText('hello');
const getWrapper = (container: Element) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper') as HTMLElement;
const getInner = (container: Element) => container.querySelector<HTMLElement>('[x-semi-prop="children"]') as HTMLElement;
// the wrapper's height goes through this custom property (collapsible.scss)
const heightVar = '--semi-collapsible-height';
const openHeight = 'calc-size(auto, size)';

function setup(props: Store = {}) {
    const store = createStore<Store>({ log: [], ...props });
    const view = render(Host, { props: { store } });
    const update = (next: Store) => {
        Object.assign(store, next);
        flushSync();
    };
    const end = async (propertyName = 'height', target: Element = getWrapper(view.container)) => {
        await fireEvent.transitionEnd(target, { propertyName });
        flushSync();
    };
    return { store, container: view.container, update, end, wrapper: () => getWrapper(view.container) };
}

describe('Svelte Collapsible', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('keepDOM = true、lazyRender = false', () => {
        const { update } = setup({ keepDOM: true, motion: false, lazyRender: false });
        expect(queryContent()).toBeInTheDocument();
        update({ isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        update({ isOpen: false });
        expect(queryContent()).toBeInTheDocument();
    });

    it('keepDOM、lazyRender = false', () => {
        const { update } = setup({ keepDOM: false, motion: false, lazyRender: false });
        expect(queryContent()).toBeNull();
        update({ isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        update({ isOpen: false });
        expect(queryContent()).toBeNull();
    });

    it('除非 collapseHeight 留出预览区域，关闭的 keepDOM 内容为 inert', () => {
        const { container, update } = setup({ keepDOM: true, motion: false });
        // jsdom has no inert reflection, so the property is what Svelte sets
        const inert = () => (getInner(container) as HTMLElement & { inert?: boolean }).inert;
        expect(inert()).toBe(true);
        update({ isOpen: true });
        expect(inert()).toBeFalsy();
        update({ isOpen: false, collapseHeight: 40 });
        expect(inert()).toBeFalsy();
    });

    // calc-size(auto, size) interpolates with a length directly, with no measured pixel value in between
    it('展开时高度直接变为内容的自然高度，不需要先测量内容高度', () => {
        const { wrapper, update } = setup({ isOpen: false });
        update({ isOpen: true });
        expect(wrapper().style.getPropertyValue(heightVar)).toBe(openHeight);
    });

    it('首次挂载时默认展开不播放动画', () => {
        const { wrapper } = setup({ isOpen: true });
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(wrapper().style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('默认渲染折叠的外层容器，overflow 隐藏且不渲染 children', () => {
        const { container, wrapper } = setup();
        expect(container.firstElementChild).toBe(wrapper());
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.getPropertyValue(heightVar)).toBe('0px');
        expect(wrapper().style.overflow).toBe('hidden');
        expect(wrapper().style.opacity).toBe('1');
        expect(wrapper().style.transitionDuration).toBe('0ms');
        expect(getInner(container).style.overflow).toBe('hidden');
        expect(queryContent()).toBeNull();
    });

    it('展开动画持续到过渡结束', async () => {
        const { store, wrapper, update, end } = setup();
        update({ isOpen: true });
        expect(wrapper()).toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.transitionDuration).toBe('250ms');
        expect(wrapper().style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        expect(store.log).toEqual([]);

        await end();
        expect(store.log).toEqual(['transitionend', 'motionEnd']);
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭内容在过渡结束前保持挂载', async () => {
        const { store, wrapper, update, end } = setup({ isOpen: true, duration: 400 });
        update({ isOpen: false });
        expect(wrapper()).toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.transitionDuration).toBe('400ms');
        expect(wrapper().style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeInTheDocument();

        await end();
        expect(store.log).toContain('motionEnd');
        expect(queryContent()).toBeNull();
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
    });

    it('无动效时立即完成，且从不触发 motionEnd', () => {
        const { store, wrapper, update } = setup({ motion: false });
        update({ isOpen: true });
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.transitionDuration).toBe('0ms');
        expect(wrapper().style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        update({ isOpen: false });
        expect(wrapper().style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeNull();
        expect(store.log).toEqual([]);
    });

    it('duration 为 0 时与无动效相同：关闭后立即卸载，不留过渡类', () => {
        const { wrapper, update } = setup({ isOpen: true, duration: 0 });
        update({ isOpen: false });
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
        expect(queryContent()).toBeNull();
    });

    it('懒渲染内容首次展开后保持挂载', () => {
        const { update } = setup({ keepDOM: true, lazyRender: true, motion: false });
        expect(queryContent()).toBeNull();
        update({ isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        update({ isOpen: false });
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭时以 collapseHeight 渲染 children', () => {
        const { wrapper } = setup({ collapseHeight: 30 });
        expect(wrapper().style.getPropertyValue(heightVar)).toBe('30px');
        expect(queryContent()).toBeInTheDocument();
    });

    it('collapseHeightAdaptive 关闭时以 calc-size 钳制到内容高度', () => {
        const { wrapper } = setup({ collapseHeight: 30, collapseHeightAdaptive: true });
        expect(wrapper().style.getPropertyValue(heightVar)).toBe('calc-size(auto, min(size, 30px))');
    });

    it('仅当 collapseHeight 为 0 时，关闭内容淡出', () => {
        const { wrapper, update } = setup({ fade: true });
        expect(wrapper().style.opacity).toBe('0');
        update({ isOpen: true });
        expect(wrapper().style.opacity).toBe('1');
        update({ isOpen: false, collapseHeight: 10 });
        expect(wrapper().style.opacity).toBe('1');
    });

    it('仅在外层 height 过渡结束时结束动效，冒泡事件与 opacity 过渡不结束', async () => {
        const { store, wrapper, update, end } = setup({ isOpen: true, fade: true });
        update({ isOpen: false });
        await end('height', screen.getByTestId('content'));
        await end('opacity');
        expect(store.log).not.toContain('motionEnd');
        expect(screen.getByTestId('content')).toBeInTheDocument();
        await end('height', wrapper());
        expect(store.log).toContain('motionEnd');
        expect(screen.queryByTestId('content')).toBeNull();
    });

    // isOpen always flips height between a length and auto/calc-size(), two different computed values, so a
    // height transition always runs and ends the motion
    it('展开时 fade 以 height 过渡结束，而不是 opacity', async () => {
        const { store, update, end } = setup({ fade: true });
        update({ isOpen: true });
        await end('opacity');
        expect(store.log).not.toContain('motionEnd');
        await end('height');
        expect(store.log).toContain('motionEnd');
    });

    it('id 放在内容元素上，data 属性、class 与 style 传到外层', () => {
        const { container, wrapper } = setup({ id: 'panel', class: 'custom', style: 'height: 5px; color: red', title: 'tip' });
        expect(getInner(container)).toHaveAttribute('id', 'panel');
        expect(wrapper()).not.toHaveAttribute('id');
        expect(wrapper()).toHaveClass('custom');
        expect(wrapper()).toHaveAttribute('title', 'tip');
        expect(wrapper().style.height).toBe('5px');
        expect(wrapper().style.color).toBe('red');
        expect(wrapper().style.overflow).toBe('hidden');
    });

    it('使用方的 ontransitionend 与组件自身处理同时触发', async () => {
        const { store, update, end } = setup();
        update({ isOpen: true });
        await end();
        expect(store.log).toEqual(['transitionend', 'motionEnd']);
    });

    it('展开更新中同时写入新高度与过渡类，而不是分两次提交', () => {
        const { wrapper, update } = setup({ isOpen: false });
        // one flush after the prop change: the height, the class and the duration are all already on the element
        update({ isOpen: true });
        expect(wrapper().style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(wrapper()).toHaveClass('semi-collapsible-transition');
        expect(wrapper().style.transitionDuration).toBe('250ms');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { motion: false, keepDOM: true } };
        const { wrapper, update } = setup();
        expect(queryContent()).toBeInTheDocument();
        update({ isOpen: true });
        expect(wrapper()).not.toHaveClass('semi-collapsible-transition');
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Collapsible: { keepDOM: true, collapseHeight: 20 } };
        const store = createStore<Store>({});
        const { container } = render(Host, { props: { store }, context: new Map([[semiGlobalKey, semi]]) });
        expect(queryContent()).toBeInTheDocument();
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe('20px');
    });

    it('显式传 undefined 的 prop 回落全局值，再回落兜底值', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { collapseHeight: 20 } };
        const first = setup({ collapseHeight: undefined, duration: undefined });
        expect(first.wrapper().style.getPropertyValue(heightVar)).toBe('20px');
        semiGlobal.config.overrideDefaultProps = {};
        const second = setup({ collapseHeight: undefined, duration: undefined });
        expect(second.wrapper().style.getPropertyValue(heightVar)).toBe('0px');
    });
});

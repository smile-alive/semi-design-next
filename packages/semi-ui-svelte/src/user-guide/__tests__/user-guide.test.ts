import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { UserGuideProps, UserGuideStepItem } from '../interface';
import ConfigContainer from './config-container.svelte';
import CurrentModes from './current-modes.svelte';
import GuideFixture from './guide-fixture.svelte';
import LocaleGuide from './locale-guide.svelte';
import WithModal from './with-modal.svelte';

const prefix = `${BASE_CLASS_PREFIX}-userGuide`;
const modalPrefix = `${prefix}-modal`;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const $$ = (selector: string) => document.querySelectorAll<HTMLElement>(selector);

type TestTarget = HTMLDivElement & { rect: { x: number; y: number; width: number; height: number } };
type Mode = 'bind' | 'function' | 'one-way';
type Store = {
    visible?: boolean;
    current?: number;
    accept: boolean;
    log: string[];
    steps: UserGuideStepItem[];
    rich: boolean;
    covers: 'none' | 'first' | 'all';
    texts: boolean;
    props: Omit<UserGuideProps, 'visible' | 'current' | 'steps' | 'nextText' | 'prevText' | 'onChange' | 'onNext' | 'onPrev' | 'onSkip' | 'onFinish'>;
};

let targets: TestTarget[] = [];

function makeTarget(x: number, y: number, width: number, height: number) {
    const el = document.createElement('div') as TestTarget;
    el.rect = { x, y, width, height };
    el.getBoundingClientRect = () => new DOMRect(el.rect.x, el.rect.y, el.rect.width, el.rect.height);
    document.body.appendChild(el);
    targets.push(el);
    return el;
}

const targetOf = (step: UserGuideStepItem) => step.target as TestTarget;

function makeSteps(): UserGuideStepItem[] {
    const a = makeTarget(10, 20, 100, 30);
    const b = makeTarget(200, 300, 50, 40);
    const c = makeTarget(400, 100, 80, 20);
    return [
        { target: a, title: 'Title A', description: 'Desc A' },
        { target: () => b, title: 'Title B', description: 'Desc B' },
        { target: c, title: 'Title C', description: 'Desc C' },
    ];
}

function setup(props: Store['props'] = {}, { mode = 'one-way' as Mode, ...init }: Partial<Omit<Store, 'props'>> & { mode?: Mode } = {}) {
    const store = createStore<Store>({
        visible: true,
        accept: true,
        log: [],
        steps: makeSteps(),
        rich: false,
        covers: 'none',
        texts: false,
        ...init,
        props,
    });
    const view = render(GuideFixture, { props: { mode, store } });
    flushSync();
    return { store, view };
}

const spotRect = () => $(`.${prefix}-spotlight-rect`);
const rectOf = (el: Element | null) => ['x', 'y', 'width', 'height'].map((key) => Number(el?.getAttribute(key)));
const indicator = () => $(`.${prefix}-popup-content-indicator`)?.textContent?.trim();
async function click(name: string) {
    await fireEvent.click(screen.getByRole('button', { name }));
    flushSync();
}
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
const overflow = () => document.body.style.overflow;

afterEach(() => {
    for (const el of targets) {
        el.remove();
    }
    targets = [];
    document.body.removeAttribute('style');
    semiGlobal.config = {};
});

describe('Svelte UserGuide 弹出模式', () => {
    it('隐藏或无步骤时不渲染任何内容', async () => {
        const { store } = setup({}, { visible: false });
        await nextFrame();
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        store.visible = true;
        store.steps = [];
        flushSync();
        await nextFrame();
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('在 popover 中渲染当前步骤，并应用 class 与 style', async () => {
        setup({ class: 'custom', style: 'color: red' }, { covers: 'first' });
        await screen.findByText('Title A');
        expect(screen.getByAltText('cover-a').parentElement).toHaveClass(`${prefix}-popup-content-cover`);
        expect(screen.queryByText('Title B')).toBeNull();
        expect(indicator()).toBe('1/3');
        const popover = $(`.${prefix}-popover`);
        expect(popover).toHaveClass('custom');
        expect(popover).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(popover).toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        expect(screen.getByRole('button', { name: '跳过' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();
    });

    it('单步骤时隐藏指示器，步骤要求时隐藏箭头', async () => {
        setup({}, { steps: [{ target: makeTarget(0, 0, 10, 10), title: 'Only', showArrow: false }] });
        await screen.findByText('Only');
        expect(indicator()).toBeUndefined();
        expect($(`.${prefix}-popover`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
    });

    it('title、description、cover 的 snippet 得到 { item, index }，字符串直接渲染', async () => {
        setup({}, { rich: true, covers: 'first' });
        await screen.findByText('Title A-0');
        expect($('.custom-title')).toHaveTextContent('Title A-0');
        expect(screen.getByText('Desc A')).toBeInTheDocument();
        expect(screen.getByAltText('cover-a')).toBeInTheDocument();
        await click('下一步');
        await screen.findByText('Title B-1');
        expect($('.custom-description')).toHaveTextContent('d1');
        expect(screen.queryByAltText('cover-a')).toBeNull();
        expect($(`.${prefix}-popup-content-cover`)).toBeNull();
    });

    it('next、prev、skip 与 finish 通知回调并移动当前步骤，每次点击各回调只调用一次', async () => {
        const { store } = setup({}, { current: undefined });
        await screen.findByText('Title A');
        await click('下一步');
        expect(store.log).toEqual(['change 1', 'next 1']);
        await screen.findByText('Title B');
        expect(indicator()).toBe('2/3');

        await click('上一步');
        expect(store.log.slice(2)).toEqual(['change 0', 'prev 0']);
        await screen.findByText('Title A');

        await click('下一步');
        await screen.findByText('Title B');
        await click('下一步');
        await screen.findByText('Title C');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(store.log.filter((entry) => entry.startsWith('change'))).toHaveLength(4);

        store.log.length = 0;
        await click('完成');
        expect(store.log).toEqual(['finish']);
        expect(store.visible).toBe(true);
    });

    it('skip 单向绑定 visible 时只作本地覆盖：步骤消失并通知一次', async () => {
        const { store } = setup();
        await screen.findByText('Title A');
        await click('跳过');
        expect(store.log).toEqual(['skip']);
        await waitFor(() => expect(screen.queryByText('Title A')).toBeNull());
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('关闭时隐藏全部内容，重新打开时从第一步开始', async () => {
        const { store } = setup({}, { visible: false });
        store.visible = true;
        flushSync();
        await screen.findByText('Title A');
        await click('下一步');
        await screen.findByText('Title B');

        store.visible = false;
        flushSync();
        expect(screen.queryByText('Title B')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();

        store.visible = true;
        flushSync();
        await screen.findByText('Title A');
        expect(indicator()).toBe('1/3');
    });

    it('以默认 padding 在当前目标周围开出聚光区域，并跟随 current', async () => {
        setup({ zIndex: 2000 });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        const svg = $(`.${prefix}-spotlight`) as unknown as SVGElement;
        expect(svg.style.zIndex).toBe('2000');
        expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]);
        expect(svg.querySelector('rect[mask]')).not.toBeNull();
        expect($$(`.${prefix}-spotlight-transparent-rect`)).toHaveLength(4);

        await click('下一步');
        await waitFor(() => expect(rectOf(spotRect())).toEqual([195, 295, 60, 50]));
    });

    it('spotlightPadding 全局生效，步骤可覆盖', async () => {
        const steps = makeSteps();
        steps[1].spotlightPadding = 15;
        setup({ spotlightPadding: 10 }, { steps });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([0, 10, 120, 50]));
        await click('下一步');
        await waitFor(() => expect(rectOf(spotRect())).toEqual([185, 285, 80, 70]));
    });

    it('mask 为 false 时保留镂空定义但不绘制遮罩', async () => {
        setup({ mask: false });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        expect($$(`.${prefix}-spotlight-transparent-rect`)).toHaveLength(0);
    });

    it('没有 target 的步骤不渲染 popover 与聚光区域', async () => {
        setup({}, { steps: [{ title: 'Nowhere' }] });
        await nextFrame();
        expect(screen.queryByText('Nowhere')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('主题可由组件或步骤设置为 primary，步骤的 default 覆盖全局的 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'primary';
        const { view } = setup({}, { steps });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
        await click('下一步');
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
        view.unmount();

        const overridden = makeSteps();
        overridden[1].theme = 'default';
        setup({ theme: 'primary' }, { steps: overridden });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
        await click('下一步');
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
    });

    it('steps 在显示后才到达时，补上聚光区域', async () => {
        const steps = makeSteps();
        const { store } = setup({}, { steps: [] });
        expect(spotRect()).toBeNull();
        store.steps = steps;
        flushSync();
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        await screen.findByText('Title A');
    });

    it('target 在显示后才挂载时，换新 steps 数组即补上聚光区域', async () => {
        let target: Element | undefined;
        const { store } = setup({}, { steps: [{ target: () => target, title: 'Late' }] });
        expect(spotRect()).toBeNull();
        target = makeTarget(10, 20, 100, 30);
        store.steps = [{ target: () => target, title: 'Late' }];
        flushSync();
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
    });

    it('切换到没有 target 的步骤时，不沿用上一步的聚光区域', async () => {
        const steps = makeSteps();
        setup({}, { steps: [steps[0], { title: 'Nowhere' }] });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        await click('下一步');
        await waitFor(() => expect(spotRect()).toBeNull());
        expect(screen.queryByText('Nowhere')).toBeNull();
    });

    it('target 函数返回 null 或 undefined 时不抛错且不显示', async () => {
        setup(
            {},
            {
                steps: [
                    { target: () => null, title: 'Null' },
                    { target: () => undefined, title: 'Undefined' },
                ],
            }
        );
        await nextFrame();
        expect(screen.queryByText('Null')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('按钮文案经 nextText、prevText snippet 与 finishText 替换，并可隐藏按钮', async () => {
        const { store } = setup({ finishText: 'Done' }, { current: 1, texts: true });
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();

        store.current = 2;
        flushSync();
        await screen.findByText('Title C');
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

        store.current = 1;
        store.props.showPrevButton = false;
        store.props.showSkipButton = false;
        flushSync();
        await screen.findByText('Title B');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    });

    it('没有文案 snippet 时用语言包', async () => {
        setup({}, { current: 1 });
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: '上一步' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
    });

    it('按钮文案跟随语言包', async () => {
        const steps = makeSteps();
        const view = render(LocaleGuide, { props: { locale: en_US, steps, current: 1 } });
        await screen.findByText('Title B');
        for (const name of ['Skip', 'Prev', 'Next']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
        view.unmount();
        render(LocaleGuide, { props: { locale: en_US, steps, current: 2 } });
        expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument();
    });

    it('按钮文案在日语语言包下跟随语言包', async () => {
        const steps = makeSteps();
        const view = render(LocaleGuide, { props: { locale: ja_JP, steps, current: 1 } });
        await screen.findByText('Title B');
        for (const name of [ja_JP.UserGuide.skip, ja_JP.UserGuide.prev, ja_JP.UserGuide.next]) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
        view.unmount();
        render(LocaleGuide, { props: { locale: ja_JP, steps, current: 2 } });
        expect(await screen.findByRole('button', { name: ja_JP.UserGuide.finish })).toBeInTheDocument();
    });

    it('步骤的 mask 覆盖全局 mask', async () => {
        const steps = makeSteps();
        steps[1].mask = false;
        const { store } = setup({}, { current: 1, steps });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        store.current = 0;
        flushSync();
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
        store.steps[0].mask = true;
        store.props.mask = false;
        flushSync();
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
    });

    it('class 与步骤的 class 应用到 popover', async () => {
        const steps = makeSteps();
        steps[0].class = 'step-cls';
        setup({ class: 'guide-cls' }, { steps });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popover`)).toHaveClass('guide-cls', 'step-cls');
    });

    it('getPopupContainer 与 zIndex 只作用于遮罩，不作用于 top layer 中的 popover', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        setup({ getPopupContainer: () => container, zIndex: 2000 });
        await screen.findByText('Title A');
        const card = screen.getByText('Title A');
        expect(container.contains(card)).toBe(false);
        expect(card.closest<HTMLElement>('[style*="z-index"]')).toBeNull();
        expect(($(`.${prefix}-spotlight`) as unknown as SVGElement).style.zIndex).toBe('2000');
        container.remove();
    });

    it('锚点的位置与尺寸带 px 单位且不是 Tab 停靠点', async () => {
        setup();
        await screen.findByText('Title A');
        const anchor = $('[tabindex="-1"][style*="position: fixed"]') as HTMLElement;
        expect(anchor).not.toBeNull();
        expect(anchor.style.left).toBe('5px');
        expect(anchor.style.top).toBe('15px');
        expect(anchor.style.width).toBe('110px');
        expect(anchor.style.height).toBe('40px');
        expect(anchor.style.pointerEvents).toBe('none');
    });
});

describe('Svelte UserGuide 滚动锁', () => {
    it('显示时锁定 body 滚动，关闭与卸载时恢复', async () => {
        const { store, view } = setup({}, { visible: false });
        expect(overflow()).toBe('');
        store.visible = true;
        flushSync();
        await waitFor(() => expect(overflow()).toBe('hidden'));
        store.visible = false;
        flushSync();
        expect(overflow()).toBe('');

        store.visible = true;
        flushSync();
        await waitFor(() => expect(overflow()).toBe('hidden'));
        view.unmount();
        expect(overflow()).toBe('');
    });

    it('挂载时已可见则锁定 body 滚动', async () => {
        const { view } = setup();
        await waitFor(() => expect(overflow()).toBe('hidden'));
        view.unmount();
        expect(overflow()).toBe('');
    });

    it('getPopupContainer 指向 body 时与未设置一样锁定 body 滚动', async () => {
        const { store } = setup({ getPopupContainer: () => document.body }, { visible: false });
        store.visible = true;
        flushSync();
        await waitFor(() => expect(overflow()).toBe('hidden'));
        store.visible = false;
        flushSync();
        expect(overflow()).toBe('');
    });

    it('getPopupContainer 指向其他元素或 overflow 已为 hidden 时不改动 body 滚动', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        const first = setup({ getPopupContainer: () => host });
        await screen.findByText('Title A');
        expect(overflow()).toBe('');
        first.view.unmount();

        document.body.style.overflow = 'hidden';
        const second = setup({}, { visible: false });
        second.store.visible = true;
        flushSync();
        await screen.findByText('Title A');
        second.store.visible = false;
        flushSync();
        expect(overflow()).toBe('hidden');
        host.remove();
    });

    it('ConfigProvider 的 getPopupContainer 指向其他元素时，modal 模式渲染进容器且不锁定 body 滚动', async () => {
        render(ConfigContainer, { props: { steps: makeSteps(), mode: 'modal' } });
        const host = $('.config-container') as HTMLElement;
        await waitFor(() => expect(host.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull());
        expect(overflow()).toBe('');
    });

    it('popup 模式：ConfigProvider 的容器不是 body 时不锁，自己的 getPopupContainer 指向 body 时锁', async () => {
        const view = render(ConfigContainer, { props: { steps: makeSteps() } });
        await screen.findByText('Title A');
        expect(overflow()).toBe('');
        view.unmount();

        render(ConfigContainer, { props: { steps: makeSteps(), ownContainer: () => document.body } });
        await waitFor(() => expect(overflow()).toBe('hidden'));
    });

    it('没有可显示的步骤时不锁定 body 滚动', async () => {
        const { store } = setup({}, { steps: [] });
        expect(overflow()).toBe('');
        store.steps = [{ title: 'Nowhere' }];
        flushSync();
        await nextFrame();
        expect(overflow()).toBe('');
        store.steps = makeSteps();
        flushSync();
        await waitFor(() => expect(overflow()).toBe('hidden'));
    });

    it('与 Modal 交错打开关闭时，最后一个关闭前 body 保持锁定', async () => {
        const view = render(WithModal, { props: { steps: makeSteps(), guide: true, modal: true } });
        await waitFor(() => expect(overflow()).toBe('hidden'));
        await view.rerender({ guide: false });
        await settle();
        expect(overflow()).toBe('hidden');
        await view.rerender({ modal: false });
        await waitFor(() => expect(overflow()).toBe(''));
    });

    it('popup 模式没有遮罩时不锁定 body 滚动，步骤的 mask 随步骤改变锁', async () => {
        const noMask = setup({ mask: false });
        await screen.findByText('Title A');
        expect(overflow()).toBe('');
        noMask.view.unmount();

        const steps = makeSteps();
        steps[1].mask = false;
        const { view } = setup({}, { steps });
        await screen.findByText('Title A');
        await waitFor(() => expect(overflow()).toBe('hidden'));
        await click('下一步');
        await screen.findByText('Title B');
        await waitFor(() => expect(overflow()).toBe(''));
        await click('上一步');
        await screen.findByText('Title A');
        await waitFor(() => expect(overflow()).toBe('hidden'));
        view.unmount();
    });

    it('modal 模式没有遮罩时不锁，有遮罩时由 Modal 锁一次', async () => {
        const noMask = setup({ mode: 'modal', mask: false });
        await screen.findByText('Title A');
        expect(overflow()).toBe('');
        noMask.view.unmount();

        setup({ mode: 'modal' });
        await screen.findByText('Title A');
        await waitFor(() => expect(overflow()).toBe('hidden'));
    });

    it('关闭时恢复 body 的结束内边距', async () => {
        document.body.style.paddingInlineEnd = '4px';
        const { store } = setup({}, { visible: false });
        store.visible = true;
        flushSync();
        await waitFor(() => expect(document.body.style.paddingInlineEnd).not.toBe('4px'));
        store.visible = false;
        flushSync();
        expect(document.body.style.paddingInlineEnd).toBe('4px');
        document.body.style.paddingInlineEnd = '';
    });
});

describe('Svelte UserGuide 测量', () => {
    it('窗口缩放及任意容器内滚动时重新计算聚光区域', async () => {
        const steps = makeSteps();
        setup({}, { steps });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        targetOf(steps[0]).rect = { x: 30, y: 40, width: 100, height: 30 };
        await fireEvent(window, new Event('resize'));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([25, 35, 110, 40]));
        targetOf(steps[0]).rect = { x: 30, y: 10, width: 100, height: 30 };
        await fireEvent.scroll(targetOf(steps[2]));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([25, 5, 110, 40]));
    });

    it('关闭或卸载后停止测量', async () => {
        const steps = makeSteps();
        const measure = vi.spyOn(targetOf(steps[0]), 'getBoundingClientRect');
        const { store, view } = setup({}, { steps });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        store.visible = false;
        flushSync();
        measure.mockClear();
        await fireEvent(window, new Event('resize'));
        expect(measure).not.toHaveBeenCalled();

        store.visible = true;
        flushSync();
        await waitFor(() => expect(spotRect()).not.toBeNull());
        view.unmount();
        measure.mockClear();
        await fireEvent(window, new Event('resize'));
        await fireEvent.scroll(document);
        expect(measure).not.toHaveBeenCalled();
    });

    it('spotlightPadding 为 0 表示无内边距，而非默认值；变化时重新计算', async () => {
        const { store } = setup({ spotlightPadding: 0 });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
        store.props.spotlightPadding = 10;
        flushSync();
        await waitFor(() => expect(rectOf(spotRect())).toEqual([0, 10, 120, 50]));
    });

    it('步骤字段原地改变时重新计算', async () => {
        const { store } = setup();
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        store.steps[0].spotlightPadding = 0;
        flushSync();
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
    });

    it('父级每次渲染都传入新的 steps 数组时测量次数有界', async () => {
        const steps = makeSteps();
        const measure = vi.spyOn(targetOf(steps[0]), 'getBoundingClientRect');
        const { store } = setup({}, { steps: [...steps] });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        measure.mockClear();
        for (let i = 0; i < 3; i += 1) {
            store.steps = steps.map((step) => ({ ...step }));
            flushSync();
        }
        await nextFrame();
        expect(measure.mock.calls.length).toBeLessThan(20);
        expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]);
    });

    it('无步骤时切换 visible 不报错，current 超出范围时不渲染', async () => {
        const { store } = setup({}, { steps: [], visible: false });
        store.visible = true;
        flushSync();
        await nextFrame();
        expect($(`.${prefix}-spotlight`)).toBeNull();

        store.steps = makeSteps();
        store.current = 5;
        flushSync();
        await nextFrame();
        expect($(`.${prefix}-popover`)).toBeNull();
        store.props.mode = 'modal';
        flushSync();
        await nextFrame();
        expect($(`.${modalPrefix}`)).toBeNull();
    });
});

describe('Svelte UserGuide 全局默认值', () => {
    it('读取 semiGlobal.config.overrideDefaultProps，传入值优先', async () => {
        semiGlobal.config.overrideDefaultProps = {
            UserGuide: { showSkipButton: false, finishText: 'All done', nextButtonProps: { type: 'danger' } },
        };
        const last = setup({}, { current: 2 });
        const finish = await screen.findByRole('button', { name: 'All done' });
        expect(finish).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`);
        last.view.unmount();

        const middle = setup({}, { current: 1 });
        await screen.findByRole('button', { name: '下一步' });
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        middle.view.unmount();

        setup({ showSkipButton: true }, { current: 1 });
        expect(await screen.findByRole('button', { name: '跳过' })).toBeInTheDocument();
    });

    it('spotlightPadding、mask 取全局值', async () => {
        semiGlobal.config.overrideDefaultProps = { UserGuide: { spotlightPadding: 0, mask: false } };
        setup();
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
    });

    it('全局 getPopupContainer 决定 modal 模式的渲染容器', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        semiGlobal.config.overrideDefaultProps = { UserGuide: { getPopupContainer: () => host } };
        setup({ mode: 'modal' });
        await waitFor(() => expect(host.contains($(`.${modalPrefix}`))).toBe(true));
        host.remove();
    });
});

describe('Svelte UserGuide 弹窗模式', () => {
    const activeDot = () => [...$$(`.${modalPrefix}-indicator-item`)].findIndex((dot) => dot.classList.contains(`${modalPrefix}-indicator-item-active`));

    it('在弹窗中渲染封面、指示器、标题与描述，并可逐步切换', async () => {
        const { store } = setup({ mode: 'modal' }, { rich: true, covers: 'first' });
        await screen.findByText('Title A-0');
        expect($(`.${modalPrefix}`)).not.toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        expect($(`.${prefix}-popover`)).toBeNull();
        expect(screen.getByAltText('cover-a').parentElement).toHaveClass(`${modalPrefix}-cover`);
        expect($$(`.${modalPrefix}-indicator-item`)).toHaveLength(3);
        expect(activeDot()).toBe(0);
        expect(screen.getByText('Title A-0').parentElement).toHaveClass(`${modalPrefix}-body-title`);
        expect(screen.getByText('Desc A')).toHaveClass(`${modalPrefix}-body-description`);
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();

        await click('下一步');
        expect(store.log).toEqual(['change 1', 'next 1']);
        await screen.findByText('Title B-1');
        expect($(`.${modalPrefix}-cover`)).toBeNull();
        expect($(`.${modalPrefix}-indicator`)).toBeNull();
        expect(screen.getByRole('button', { name: '上一步' })).toBeInTheDocument();

        await click('下一步');
        await screen.findByText('Title C-2');
        store.log.length = 0;
        await click('完成');
        expect(store.log).toEqual(['finish']);
    });

    it('指示器跟随 current，圆点对读屏隐藏，进度以文本给出', async () => {
        const { store } = setup({ mode: 'modal' }, { current: 0, covers: 'all' });
        await screen.findByText('Title A');
        expect(activeDot()).toBe(0);
        expect($(`.${modalPrefix}-indicator`)).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('1/3')).toHaveClass(`${modalPrefix}-progress`);
        store.current = 2;
        flushSync();
        await screen.findByText('Title C');
        expect(activeDot()).toBe(2);
        expect(screen.getByText('3/3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
    });

    it('skip、自定义文案与语言包', async () => {
        const steps = makeSteps();
        const { store } = setup({ mode: 'modal', finishText: 'Done' }, { current: 1, steps });
        await screen.findByText('Title B');
        await click('跳过');
        expect(store.log).toEqual(['skip']);
        await waitFor(() => expect(screen.queryByText('Title B')).toBeNull());

        const last = setup({ mode: 'modal', finishText: 'Done' }, { current: 2, steps });
        expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument();
        last.view.unmount();
        render(LocaleGuide, { props: { locale: en_US, steps, current: 1, mode: 'modal' } });
        expect(await screen.findByRole('button', { name: 'Skip' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Prev' })).toBeInTheDocument();
    });

    it('步骤标题为对话框命名', async () => {
        const { store } = setup({ mode: 'modal' }, { current: 0 });
        expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
        store.current = 1;
        flushSync();
        expect(await screen.findByRole('dialog', { name: 'Title B' })).toBeInTheDocument();
    });

    it('没有标题的步骤没有可访问名称，也不指向不存在的元素', async () => {
        setup({ mode: 'modal' }, { steps: [{ target: makeTarget(0, 0, 10, 10), description: 'Only desc' }] });
        await screen.findByText('Only desc');
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const first = setup({ mode: 'modal' }, { current: 0 });
        await screen.findByRole('dialog');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(first.store.log).toEqual(['skip']);
        first.view.unmount();
        const last = setup({ mode: 'modal' }, { current: 2 });
        await screen.findByText('Title C');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(last.store.log).toEqual(['skip']);
    });

    it('主按钮带 autofocus，跳过没有', async () => {
        setup({ mode: 'modal' });
        const next = await screen.findByRole('button', { name: '下一步' });
        expect(next).toHaveAttribute('autofocus');
        expect(screen.getByRole('button', { name: '跳过' })).not.toHaveAttribute('autofocus');
    });

    it('modal 模式接收 class、style、步骤 mask、getPopupContainer 与 zIndex', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const steps = makeSteps();
        steps[0].class = 'step-cls';
        steps[0].mask = false;
        setup({ getPopupContainer: () => container, mode: 'modal', zIndex: 2000, class: 'guide-cls', style: 'color: red' }, { steps });
        await screen.findByText('Title A');
        const modal = $(`.${modalPrefix}`) as HTMLElement;
        expect(modal).toHaveClass('guide-cls', 'step-cls');
        expect(modal.querySelector(`.${BASE_CLASS_PREFIX}-modal`) ?? modal).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.contains(modal)).toBe(true);
        expect(modal.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-portal`)?.style.zIndex).toBe('2000');
        expect($(`.${BASE_CLASS_PREFIX}-modal-mask`)).toBeNull();
        container.remove();
    });
});

describe('Svelte UserGuide 弹出模式 Escape 与名称', () => {
    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const { store } = setup({}, { current: 2 });
        await screen.findByText('Title C');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(store.log).toEqual(['skip']);
    });

    it('步骤标题为弹出对话框命名，主按钮带 autofocus', async () => {
        setup();
        expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一步' })).toHaveAttribute('autofocus');
        expect(screen.getByRole('button', { name: '跳过' })).not.toHaveAttribute('autofocus');
    });

    it('没有标题的步骤没有可访问名称，也不指向不存在的元素', async () => {
        setup({}, { steps: [{ target: makeTarget(0, 0, 10, 10), description: 'Only desc' }] });
        await screen.findByText('Only desc');
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });
});

describe('Svelte UserGuide visible 的四种写法', () => {
    it('bind:visible：跳过与完成写回 false，先于回调', async () => {
        const { store } = setup({}, { mode: 'bind', steps: makeSteps().slice(0, 1) });
        await screen.findByText('Title A');
        await click('完成');
        expect(store.visible).toBe(false);
        expect(store.log).toEqual(['finish']);
        await waitFor(() => expect(screen.queryByText('Title A')).toBeNull());
    });

    it('bind:visible：跳过关闭引导', async () => {
        const { store } = setup({}, { mode: 'bind' });
        await screen.findByText('Title A');
        await click('跳过');
        expect(store.visible).toBe(false);
        expect(store.log).toEqual(['skip']);
        await waitFor(() => expect(screen.queryByText('Title A')).toBeNull());
    });

    it('函数绑定：setter 拒绝时引导保持显示，只通知', async () => {
        const { store } = setup({}, { mode: 'function', accept: false });
        await screen.findByText('Title A');
        await click('跳过');
        expect(store.log).toEqual(['set visible false', 'skip']);
        expect(store.visible).toBe(true);
        expect(screen.getByText('Title A')).toBeInTheDocument();
    });

    it('函数绑定：setter 拒绝时 Escape 也保持显示（modal）', async () => {
        const { store } = setup({ mode: 'modal' }, { mode: 'function', accept: false });
        await screen.findByRole('dialog');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(store.log).toEqual(['set visible false', 'skip']);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('函数绑定：setter 接受时关闭', async () => {
        const { store } = setup({}, { mode: 'function' });
        await screen.findByText('Title A');
        await click('跳过');
        expect(store.visible).toBe(false);
        await waitFor(() => expect(screen.queryByText('Title A')).toBeNull());
    });

    it('Escape 在非最后一步同样写 visible 并通知 skip，modal 模式的 Escape 同样', async () => {
        const popup = setup({}, { mode: 'bind' });
        await screen.findByText('Title A');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(popup.store.visible).toBe(false);
        expect(popup.store.log).toEqual(['skip']);
        popup.view.unmount();

        const modal = setup({ mode: 'modal' }, { mode: 'bind' });
        await screen.findByRole('dialog');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(modal.store.visible).toBe(false);
    });
});

describe('Svelte UserGuide current 的四种写法', () => {
    type CurrentStore = { visible: boolean; current: number | undefined; accept: boolean; log: string[]; steps: UserGuideStepItem[] };

    const setupCurrent = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', current?: number, accept = true) => {
        const store = createStore<CurrentStore>({ visible: true, current, accept, log: [], steps: makeSteps() });
        const view = render(CurrentModes, { props: { mode, store } });
        flushSync();
        return { store, view };
    };

    it('bind:current：点击写回，onChange 在写回之后', async () => {
        const { store } = setupCurrent('bind', 0);
        await screen.findByText('Title A');
        await click('下一步');
        expect(store.current).toBe(1);
        expect(store.log).toEqual(['change 1']);
        await screen.findByText('Title B');
        await click('上一步');
        expect(store.current).toBe(0);
    });

    it('bind:current 初值为 undefined 时由组件保管，并写回父级；关闭再打开从第一步开始', async () => {
        const { store } = setupCurrent('bind');
        await screen.findByText('Title A');
        await click('下一步');
        expect(store.current).toBe(1);
        await screen.findByText('Title B');
        store.visible = false;
        flushSync();
        expect(store.current).toBeUndefined();
        store.visible = true;
        flushSync();
        await screen.findByText('Title A');
        expect(indicator()).toBe('1/3');
    });

    it('bind:current 初值已定义时，关闭再打开保持当前步骤', async () => {
        const { store } = setupCurrent('bind', 0);
        await screen.findByText('Title A');
        await click('下一步');
        await screen.findByText('Title B');
        store.visible = false;
        flushSync();
        store.visible = true;
        flushSync();
        await screen.findByText('Title B');
        expect(store.current).toBe(1);
    });

    it('函数绑定：setter 拒绝时步骤不动，只通知', async () => {
        const { store } = setupCurrent('function', 1, false);
        await screen.findByText('Title B');
        await click('下一步');
        expect(store.log).toEqual(['set 2', 'change 2']);
        expect(screen.getByText('Title B')).toBeInTheDocument();
        expect(indicator()).toBe('2/3');

        store.current = 2;
        flushSync();
        await screen.findByText('Title C');
        expect(indicator()).toBe('3/3');
        await click('上一步');
        expect(store.log.at(-1)).toBe('change 1');
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('单向 current：点击在本地移动，父级再推新值时以父级为准；同值重渲染保持原步骤', async () => {
        const { store } = setupCurrent('one-way', 1);
        await screen.findByText('Title B');
        await click('下一步');
        expect(store.log).toEqual(['change 2']);
        await screen.findByText('Title C');

        store.current = 0;
        flushSync();
        await screen.findByText('Title A');
        expect(indicator()).toBe('1/3');
    });

    it('不传 current：组件保管步骤并通知', async () => {
        const { store } = setupCurrent('uncontrolled');
        await screen.findByText('Title A');
        await click('下一步');
        await screen.findByText('Title B');
        expect(store.log).toEqual(['change 1']);
        expect(indicator()).toBe('2/3');
    });

    it('current 变回 undefined 时从上一个值继续', async () => {
        const { store } = setupCurrent('one-way', 0);
        await screen.findByText('Title A');
        store.current = 2;
        flushSync();
        await screen.findByText('Title C');
        store.current = undefined;
        flushSync();
        await settle();
        expect(screen.getByText('Title C')).toBeInTheDocument();
        expect(indicator()).toBe('3/3');
    });
});

describe('Svelte UserGuide 按钮属性', () => {
    it('onclick 先于内置处理被调用，步骤仍推进', async () => {
        const onclick = vi.fn<() => void>();
        const prevClick = vi.fn<() => void>();
        const { store } = setup({ nextButtonProps: { onclick }, prevButtonProps: { onclick: prevClick } }, { current: 1 });
        await screen.findByText('Title B');
        await click('下一步');
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(store.log).toEqual(['change 2', 'next 2']);
        await click('上一步');
        expect(prevClick).toHaveBeenCalledTimes(1);
        // one-way `current` moved to 2 locally, so Prev lands on 1
        expect(store.log.slice(2)).toEqual(['change 1', 'prev 1']);
    });

    it('最后一步的 onclick 之后仍通知 finish', async () => {
        const onclick = vi.fn<() => void>();
        const { store } = setup({ nextButtonProps: { onclick } }, { current: 2 });
        await screen.findByText('Title C');
        await click('完成');
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(store.log).toEqual(['finish']);
    });

    it('class、style 与内置值合并，disabled 生效', async () => {
        setup({ nextButtonProps: { class: 'my-next', style: 'color: red', disabled: true }, prevButtonProps: { theme: 'borderless' } }, { current: 1 });
        await screen.findByText('Title B');
        const next = screen.getByRole('button', { name: '下一步' });
        expect(next).toHaveClass('my-next', `${BASE_CLASS_PREFIX}-button-solid`);
        expect(next).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(next).toBeDisabled();
        expect(screen.getByRole('button', { name: '上一步' })).toHaveClass(`${BASE_CLASS_PREFIX}-button-borderless`);
    });

    it('primary 主题的下一步按钮用主题 token 作背景', async () => {
        setup({ theme: 'primary' });
        await screen.findByText('Title A');
        expect(screen.getByRole('button', { name: '下一步' }).getAttribute('style')).toContain('--semi-color-white');
    });
});

describe('Svelte UserGuide 未声明的属性', () => {
    it('popup 模式：id、data-*、aria-*、onclick 被丢弃', async () => {
        const onclick = vi.fn<() => void>();
        setup({ class: 'attr-cls', id: 'guide-id', 'data-x': '1', 'aria-label': 'ignored', onclick } as never);
        await screen.findByText('Title A');
        const popover = $(`.${prefix}-popover`) as HTMLElement;
        expect(popover).toHaveClass('attr-cls');
        expect($('#guide-id')).toBeNull();
        expect($('[data-x]')).toBeNull();
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
        await click('下一步');
        await fireEvent.click(popover);
        expect(onclick).not.toHaveBeenCalled();
    });

    it('modal 模式同样丢弃其余属性', async () => {
        const onclick = vi.fn<() => void>();
        setup({ mode: 'modal', class: 'attr-cls', id: 'guide-id', 'data-x': '1', 'aria-label': 'ignored', onclick } as never);
        await screen.findByText('Title A');
        expect($(`.${modalPrefix}`)).toHaveClass('attr-cls');
        expect($('#guide-id')).toBeNull();
        expect($('[data-x]')).toBeNull();
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
        await fireEvent.click($(`.${modalPrefix}`) as HTMLElement);
        expect(onclick).not.toHaveBeenCalled();
    });
});

/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { render } from '@test/utils/vue';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider/config-provider.vue';
import LocaleProvider from '../../locale/locale-provider.vue';
import type { UserGuideProps, UserGuideSlots, UserGuideStepItem } from '../interface';
import UserGuide from '../user-guide.vue';
import Cached from './fixtures/cached.vue';
import ConfigContainer from './fixtures/config-container.vue';
import Model from './fixtures/model.vue';
import TemplateSlots from './fixtures/template-slots.vue';
import WithModal from './fixtures/with-modal.vue';

const prefix = `${BASE_CLASS_PREFIX}-userGuide`;
const modalPrefix = `${prefix}-modal`;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const $$ = (selector: string) => document.querySelectorAll<HTMLElement>(selector);

type TestTarget = HTMLDivElement & { rect: { x: number; y: number; width: number; height: number } };

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

const coverOfFirst = ({ index }: { index: number }) => (index === 0 ? [<img alt="cover-a" />] : []);

type Props = UserGuideProps & Record<string, unknown>;
type SlotMap = Record<string, (args: never) => unknown>;

function renderGuide(props: Props = {}, slots: SlotMap = {}) {
    return render(UserGuide, { props: { steps: makeSteps(), visible: true, ...props }, slots: slots as never });
}

const spotRect = () => $(`.${prefix}-spotlight-rect`);
const rectOf = (el: Element | null) => ['x', 'y', 'width', 'height'].map((key) => Number(el?.getAttribute(key)));
const indicator = () => $(`.${prefix}-popup-content-indicator`)?.textContent?.trim();
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(() => {
    for (const el of targets) {
        el.remove();
    }
    targets = [];
    document.body.removeAttribute('style');
    semiGlobal.config.overrideDefaultProps = {};
});

describe('UserGuide 弹出模式', () => {
    it('隐藏或无步骤时不渲染任何内容', () => {
        const hidden = renderGuide({ visible: false });
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        hidden.unmount();
        renderGuide({ steps: [] });
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('在 popover 中渲染当前步骤，并应用 class 与 style', async () => {
        render(UserGuide, {
            props: { steps: makeSteps(), visible: true },
            attrs: { class: 'custom', style: { color: 'red' } },
            slots: { cover: coverOfFirst },
        });
        await screen.findByText('Title A');
        expect(screen.getByText('Desc A')).toBeInTheDocument();
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
        const target = makeTarget(0, 0, 10, 10);
        renderGuide({ steps: [{ target, title: 'Only', showArrow: false }] });
        await screen.findByText('Only');
        expect(indicator()).toBeUndefined();
        expect($(`.${prefix}-popover`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
    });

    it('next、prev、skip 与 finish 发出事件并移动当前步骤，每次点击各事件只发一次', async () => {
        const view = renderGuide();
        await screen.findByText('Title A');
        await click('跳过');
        expect(view.emitted().skip).toHaveLength(1);

        await click('下一步');
        expect(view.emitted().next).toEqual([[1]]);
        expect(view.emitted().change).toEqual([[1]]);
        expect(view.emitted()['update:current']).toEqual([[1]]);
        await screen.findByText('Title B');
        expect(indicator()).toBe('2/3');

        await click('上一步');
        expect(view.emitted().prev).toEqual([[0]]);
        expect(view.emitted().change?.at(-1)).toEqual([0]);
        await screen.findByText('Title A');

        await click('下一步');
        await screen.findByText('Title B');
        await click('下一步');
        await screen.findByText('Title C');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(view.emitted().change).toHaveLength(4);

        await click('完成');
        expect(view.emitted().finish).toHaveLength(1);
        expect(view.emitted().next).toHaveLength(3);
        expect(view.emitted().change).toHaveLength(4);
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('受控 current 仅在属性变化时移动', async () => {
        const steps = makeSteps();
        const view = renderGuide({ current: 1, steps });
        await screen.findByText('Title B');
        await click('下一步');
        expect(view.emitted().change).toEqual([[2]]);
        expect(view.emitted().next).toEqual([[2]]);
        expect(screen.getByText('Title B')).toBeInTheDocument();
        expect(indicator()).toBe('2/3');

        await view.rerender({ current: 2 });
        await screen.findByText('Title C');
        expect(indicator()).toBe('3/3');

        await click('上一步');
        expect(view.emitted().change?.at(-1)).toEqual([1]);
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('关闭时隐藏全部内容，重新打开时从第一步开始', async () => {
        const steps = makeSteps();
        const view = renderGuide({ steps, visible: false });
        await view.rerender({ visible: true });
        await screen.findByText('Title A');
        await click('下一步');
        await screen.findByText('Title B');

        await view.rerender({ visible: false });
        expect(screen.queryByText('Title B')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();

        await view.rerender({ visible: true });
        await screen.findByText('Title A');
        expect(indicator()).toBe('1/3');
    });

    it('以默认 padding 在当前目标周围开出聚光区域，并跟随 current', async () => {
        renderGuide({ zIndex: 2000 });
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
        renderGuide({ spotlightPadding: 10, steps });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([0, 10, 120, 50]));
        await click('下一步');
        await waitFor(() => expect(rectOf(spotRect())).toEqual([185, 285, 80, 70]));
    });

    it('mask 为 false 时保留镂空定义但不绘制遮罩', async () => {
        renderGuide({ mask: false });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        expect($$(`.${prefix}-spotlight-transparent-rect`)).toHaveLength(0);
    });

    it('没有 target 的步骤不渲染 popover 与聚光区域', async () => {
        renderGuide({ steps: [{ title: 'Nowhere' }] });
        await nextFrame();
        expect(screen.queryByText('Nowhere')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('主题可由组件或步骤设置为 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'primary';
        renderGuide({ steps });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
        await click('下一步');
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
    });

    it('步骤的 theme 为 default 时覆盖全局的 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'default';
        renderGuide({ steps, theme: 'primary' });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
        await click('下一步');
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
    });

    it('steps 在显示后才到达时，补上聚光区域', async () => {
        const steps = makeSteps();
        const view = renderGuide({ steps: [] });
        expect(spotRect()).toBeNull();
        await view.rerender({ steps });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        await screen.findByText('Title A');
    });

    it('target 在显示后才挂载时，换新 steps 数组即补上聚光区域', async () => {
        let target: Element | undefined;
        const view = renderGuide({ steps: [{ target: () => target, title: 'Late' }] });
        expect(spotRect()).toBeNull();
        target = makeTarget(10, 20, 100, 30);
        await view.rerender({ steps: [{ target: () => target, title: 'Late' }] });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
    });

    it('切换到没有 target 的步骤时，不沿用上一步的聚光区域', async () => {
        const steps = makeSteps();
        renderGuide({ steps: [steps[0], { title: 'Nowhere' }] });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        await click('下一步');
        await waitFor(() => expect(spotRect()).toBeNull());
        expect(screen.queryByText('Nowhere')).toBeNull();
    });

    it('target 函数返回 null 或 undefined 时不抛错且不显示', async () => {
        renderGuide({
            steps: [
                { target: () => null, title: 'Null' },
                { target: () => undefined, title: 'Undefined' },
            ],
        });
        await nextFrame();
        expect(screen.queryByText('Null')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('按钮文案经 nextText、prevText 插槽与 finishText 替换，并可隐藏按钮', async () => {
        const steps = makeSteps();
        const view = renderGuide({ current: 1, finishText: 'Done', steps }, { nextText: () => 'Forward', prevText: () => 'Back' });
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();

        await view.rerender({ current: 2 });
        await screen.findByText('Title C');
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

        await view.rerender({ current: 1, showPrevButton: false, showSkipButton: false });
        await screen.findByText('Title B');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    });

    it('按钮文案插槽渲染为空时回落语言包', async () => {
        renderGuide({ current: 1 }, { nextText: () => [], prevText: () => [] });
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: '上一步' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
    });

    it('按钮文案跟随语言包', async () => {
        const steps = makeSteps();
        const view = render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <UserGuide current={1} steps={steps} visible /> },
        });
        await screen.findByText('Title B');
        for (const name of ['Skip', 'Prev', 'Next']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
        view.unmount();
        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <UserGuide current={2} steps={steps} visible /> },
        });
        expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument();
    });

    it('按钮文案在日语语言包下跟随语言包', async () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <UserGuide current={1} steps={makeSteps()} visible /> },
        });
        await screen.findByText('Title B');
        for (const name of [ja_JP.UserGuide.skip, ja_JP.UserGuide.prev, ja_JP.UserGuide.next]) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });

    it('完成按钮在日语语言包下跟随语言包', async () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <UserGuide current={2} steps={makeSteps()} visible /> },
        });
        expect(await screen.findByRole('button', { name: ja_JP.UserGuide.finish })).toBeInTheDocument();
    });

    it('显示时锁定 body 滚动，关闭与卸载时恢复', async () => {
        const view = renderGuide({ visible: false });
        expect(document.body.style.overflow).toBe('');
        await view.rerender({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('');

        await view.rerender({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 指向 body 时与未设置一样锁定 body 滚动', async () => {
        const container = () => document.body;
        const view = renderGuide({ getPopupContainer: container, visible: false });
        await view.rerender({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 指向其他元素或 overflow 已为 hidden 时不改动 body 滚动', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        const view = renderGuide({ getPopupContainer: () => host, visible: false });
        await view.rerender({ visible: true });
        expect(document.body.style.overflow).toBe('');
        view.unmount();

        document.body.style.overflow = 'hidden';
        const second = renderGuide({ visible: false });
        await second.rerender({ visible: true });
        await second.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        host.remove();
    });

    it('ConfigProvider 的 getPopupContainer 指向其他元素时，modal 模式渲染进容器且不锁定 body 滚动', async () => {
        render(ConfigContainer, { props: { steps: makeSteps(), mode: 'modal' } });
        await nextTick();
        const host = $('.config-container') as HTMLElement;
        expect(host.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('popup 模式：ConfigProvider 的容器不是 body 时不锁，自己的 getPopupContainer 指向 body 时锁', async () => {
        const view = render(ConfigContainer, { props: { steps: makeSteps() } });
        await nextTick();
        expect(document.body.style.overflow).toBe('');
        view.unmount();

        render(ConfigContainer, { props: { steps: makeSteps(), ownContainer: () => document.body } });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('没有可显示的步骤时不锁定 body 滚动', async () => {
        const view = renderGuide({ steps: [] });
        expect(document.body.style.overflow).toBe('');
        await view.rerender({ steps: [{ title: 'Nowhere' }] });
        await nextFrame();
        expect(document.body.style.overflow).toBe('');
        await view.rerender({ steps: makeSteps() });
        await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
    });

    it('与 Modal 交错打开关闭时，最后一个关闭前 body 保持锁定', async () => {
        const steps = makeSteps();
        const view = render(WithModal, { props: { steps, guide: true, modal: true } });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ guide: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ modal: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('');
    });

    it('popup 模式没有遮罩时不锁定 body 滚动，步骤的 mask 随步骤改变锁', async () => {
        const noMask = renderGuide({ mask: false });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('');
        noMask.unmount();

        const steps = makeSteps();
        steps[1].mask = false;
        const view = renderGuide({ steps });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('hidden');
        await click('下一步');
        await screen.findByText('Title B');
        await waitFor(() => expect(document.body.style.overflow).toBe(''));
        await click('上一步');
        await screen.findByText('Title A');
        await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
        view.unmount();
    });

    it('modal 模式没有遮罩时不锁，有遮罩时由 Modal 锁一次', async () => {
        const noMask = renderGuide({ mode: 'modal', mask: false });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('');
        noMask.unmount();

        renderGuide({ mode: 'modal' });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('移除受控 current 时从上一个受控步骤继续', async () => {
        const steps = makeSteps();
        const view = renderGuide({ current: 0, steps });
        await screen.findByText('Title A');
        await view.rerender({ current: 2 });
        await screen.findByText('Title C');
        await view.rerender({ current: undefined });
        expect(screen.getByText('Title C')).toBeInTheDocument();
        expect(indicator()).toBe('3/3');
    });

    it('步骤的 mask 覆盖全局 mask', async () => {
        const steps = makeSteps();
        steps[1].mask = false;
        const view = renderGuide({ current: 1, steps });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        await view.rerender({ current: 0 });
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
        steps[0].mask = true;
        await view.rerender({ current: 0, mask: false, steps: [...steps] });
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
    });

    it('步骤的 class 应用到 popover', async () => {
        const steps = makeSteps();
        steps[0].class = 'step-cls';
        render(UserGuide, { props: { steps, visible: true }, attrs: { class: 'guide-cls' } });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popover`)).toHaveClass('guide-cls', 'step-cls');
    });

    it('getPopupContainer 与 zIndex 只作用于遮罩，不作用于 top layer 中的 popover', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        renderGuide({ getPopupContainer: () => container, zIndex: 2000 });
        await screen.findByText('Title A');
        const card = screen.getByText('Title A');
        expect(container.contains(card)).toBe(false);
        expect(card.closest<HTMLElement>('[style*="z-index"]')).toBeNull();
        expect(($(`.${prefix}-spotlight`) as unknown as SVGElement).style.zIndex).toBe('2000');
        container.remove();
    });

    it('modal 模式接收 class、style、步骤 mask、getPopupContainer 与 zIndex', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const steps = makeSteps();
        steps[0].class = 'step-cls';
        steps[0].mask = false;
        render(UserGuide, {
            props: { getPopupContainer: () => container, mode: 'modal', steps, visible: true, zIndex: 2000 },
            attrs: { class: 'guide-cls', style: { color: 'red' } },
        });
        await screen.findByText('Title A');
        const modal = $(`.${modalPrefix}`) as HTMLElement;
        expect(modal).toHaveClass('guide-cls', 'step-cls');
        expect(modal.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(modal).not.toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.contains(modal)).toBe(true);
        expect(modal.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-portal`)?.style.zIndex).toBe('2000');
        expect($(`.${BASE_CLASS_PREFIX}-modal-mask`)).toBeNull();
        container.remove();
    });
});

describe('UserGuide 测量', () => {
    it('窗口缩放及任意容器内滚动时重新计算聚光区域', async () => {
        const steps = makeSteps();
        renderGuide({ steps });
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
        const view = renderGuide({ steps });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        await view.rerender({ visible: false });
        measure.mockClear();
        await fireEvent(window, new Event('resize'));
        expect(measure).not.toHaveBeenCalled();

        await view.rerender({ visible: true });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        view.unmount();
        measure.mockClear();
        await fireEvent(window, new Event('resize'));
        await fireEvent.scroll(document);
        expect(measure).not.toHaveBeenCalled();
    });

    it('spotlightPadding 为 0 表示无内边距，而非默认值', async () => {
        renderGuide({ spotlightPadding: 0 });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
    });

    it('spotlightPadding 变化时重新计算', async () => {
        const view = renderGuide({ spotlightPadding: 0 });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
        await view.rerender({ spotlightPadding: 10 });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([0, 10, 120, 50]));
    });

    it('锚点的位置与尺寸带 px 单位且不是 Tab 停靠点', async () => {
        renderGuide();
        await screen.findByText('Title A');
        const anchor = $('[tabindex="-1"][style*="position: fixed"]') as HTMLElement;
        expect(anchor).not.toBeNull();
        expect(anchor.style.left).toBe('5px');
        expect(anchor.style.top).toBe('15px');
        expect(anchor.style.width).toBe('110px');
        expect(anchor.style.height).toBe('40px');
        expect(anchor.style.pointerEvents).toBe('none');
    });

    it('父级每次渲染都传入新的 steps 数组时测量次数有界', async () => {
        const steps = makeSteps();
        const measure = vi.spyOn(targetOf(steps[0]), 'getBoundingClientRect');
        const view = renderGuide({ steps: [...steps] });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        measure.mockClear();
        for (let i = 0; i < 3; i += 1) {
            await view.rerender({ steps: steps.map((step) => ({ ...step })) });
        }
        await nextFrame();
        expect(measure.mock.calls.length).toBeLessThan(20);
        expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]);
    });

    it('关闭时恢复 body 的结束内边距', async () => {
        document.body.style.paddingInlineEnd = '4px';
        const view = renderGuide({ visible: false });
        await view.rerender({ visible: true });
        expect(document.body.style.paddingInlineEnd).not.toBe('4px');
        await view.rerender({ visible: false });
        expect(document.body.style.paddingInlineEnd).toBe('4px');
        document.body.style.paddingInlineEnd = '';
    });

    it('挂载时已可见则锁定 body 滚动', () => {
        const view = renderGuide();
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('无步骤时切换 visible 不报错', async () => {
        const view = renderGuide({ steps: [], visible: false });
        await view.rerender({ visible: true });
        await nextFrame();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('受控 current 超出 steps 范围时不渲染且不抛错', () => {
        const steps = makeSteps();
        renderGuide({ current: 5, steps });
        renderGuide({ current: 5, mode: 'modal', steps });
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${modalPrefix}`)).toBeNull();
    });
});

describe('UserGuide 全局默认值', () => {
    it('读取 semiGlobal.config.overrideDefaultProps，传入值优先', async () => {
        semiGlobal.config.overrideDefaultProps = {
            UserGuide: {
                showSkipButton: false,
                finishText: 'All done',
                nextButtonProps: { type: 'danger' },
            },
        };
        const view = renderGuide({ current: 2 });
        const finish = await screen.findByRole('button', { name: 'All done' });
        expect(finish).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`);
        view.unmount();

        const middle = renderGuide({ current: 1 });
        await screen.findByRole('button', { name: '下一步' });
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        middle.unmount();

        renderGuide({ current: 1, showSkipButton: true });
        expect(await screen.findByRole('button', { name: '跳过' })).toBeInTheDocument();
    });

    it('spotlightPadding、mask 与 getPopupContainer 取全局值', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        semiGlobal.config.overrideDefaultProps = {
            UserGuide: { spotlightPadding: 0, mask: false, getPopupContainer: () => host },
        };
        render(UserGuide, { props: { steps: makeSteps(), visible: true } });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        host.remove();
    });

    it('全局 getPopupContainer 决定 modal 模式的渲染容器', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        semiGlobal.config.overrideDefaultProps = { UserGuide: { getPopupContainer: () => host } };
        renderGuide({ mode: 'modal' });
        await waitFor(() => expect(host.contains($(`.${modalPrefix}`))).toBe(true));
        host.remove();
    });

    it('应用级 semiGlobal 配置生效', async () => {
        const global = new SemiGlobal();
        global.config = { overrideDefaultProps: { UserGuide: { finishText: 'Okay' } } };
        render(UserGuide, {
            props: { current: 2, steps: makeSteps(), visible: true },
            global: { provide: { [semiGlobalKey as symbol]: global } },
        });
        expect(await screen.findByRole('button', { name: 'Okay' })).toBeInTheDocument();
    });
});

describe('UserGuide 弹窗模式', () => {
    const activeDot = () => [...$$(`.${modalPrefix}-indicator-item`)].findIndex((dot) => dot.classList.contains(`${modalPrefix}-indicator-item-active`));

    it('在弹窗中渲染封面、指示器、标题与描述，并可逐步切换', async () => {
        const view = renderGuide({ mode: 'modal' }, { cover: coverOfFirst });
        await screen.findByText('Title A');
        expect($(`.${modalPrefix}`)).not.toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        expect($(`.${prefix}-popover`)).toBeNull();
        expect(screen.getByAltText('cover-a').parentElement).toHaveClass(`${modalPrefix}-cover`);
        expect($$(`.${modalPrefix}-indicator-item`)).toHaveLength(3);
        expect(activeDot()).toBe(0);
        expect(screen.getByText('Title A')).toHaveClass(`${modalPrefix}-body-title`);
        expect(screen.getByText('Desc A')).toHaveClass(`${modalPrefix}-body-description`);
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();

        await click('下一步');
        expect(view.emitted().next).toEqual([[1]]);
        await screen.findByText('Title B');
        expect($(`.${modalPrefix}-cover`)).toBeNull();
        expect($(`.${modalPrefix}-indicator`)).toBeNull();
        expect(screen.getByRole('button', { name: '上一步' })).toBeInTheDocument();

        await click('下一步');
        await screen.findByText('Title C');
        await click('完成');
        expect(view.emitted().finish).toHaveLength(1);
    });

    it('指示器跟随受控 current，圆点对读屏隐藏，进度以文本给出', async () => {
        const cover = ({ item }: { item: UserGuideStepItem }) => [<img alt={`cover-${item.title}`} />];
        const view = renderGuide({ current: 0, mode: 'modal' }, { cover });
        await screen.findByText('Title A');
        expect(activeDot()).toBe(0);
        expect($(`.${modalPrefix}-indicator`)).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('1/3')).toHaveClass(`${modalPrefix}-progress`);
        await view.rerender({ current: 2 });
        await screen.findByText('Title C');
        expect(activeDot()).toBe(2);
        expect(screen.getByText('3/3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
    });

    it('skip、自定义文案与语言包', async () => {
        const steps = makeSteps();
        const onSkip = vi.fn<() => void>();
        const view = render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <UserGuide current={1} mode="modal" steps={steps} visible onSkip={onSkip} /> },
        });
        await screen.findByText('Title B');
        await fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Prev' })).toBeInTheDocument();
        view.unmount();
        render(LocaleProvider, {
            props: { locale: en_US },
            slots: {
                default: () => <UserGuide current={2} finishText="Done" mode="modal" steps={steps} visible />,
            },
        });
        expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('步骤标题为对话框命名，且不产生缺少名称的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const steps = makeSteps();
        const view = renderGuide({ current: 0, mode: 'modal', steps });
        expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
        await view.rerender({ current: 1 });
        expect(await screen.findByRole('dialog', { name: 'Title B' })).toBeInTheDocument();
        expect(warn.mock.calls.filter(([message]) => String(message).includes('accessible name'))).toHaveLength(0);
    });

    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const steps = makeSteps();
        const first = renderGuide({ current: 0, mode: 'modal', steps });
        await screen.findByRole('dialog');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(first.emitted().skip).toHaveLength(1);
        first.unmount();
        const last = renderGuide({ current: 2, mode: 'modal', steps });
        await screen.findByText('Title C');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(last.emitted().skip).toHaveLength(1);
        expect(last.emitted().finish).toBeUndefined();
    });

    it('打开时焦点候选是主按钮', async () => {
        renderGuide({ mode: 'modal' });
        const next = await screen.findByRole('button', { name: '下一步' });
        expect(next).toHaveAttribute('autofocus');
        expect(screen.getByRole('button', { name: '跳过' })).not.toHaveAttribute('autofocus');
    });
});

describe('UserGuide 弹出模式 Escape 与名称', () => {
    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const view = renderGuide({ current: 2 });
        await screen.findByText('Title C');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(view.emitted().skip).toHaveLength(1);
        expect(view.emitted().finish).toBeUndefined();
    });

    it('步骤标题为弹出对话框命名，主按钮带 autofocus', async () => {
        renderGuide();
        expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一步' })).toHaveAttribute('autofocus');
        expect(screen.getByRole('button', { name: '跳过' })).not.toHaveAttribute('autofocus');
    });

    it('没有标题的步骤没有可访问名称，也不指向不存在的元素', async () => {
        renderGuide({ steps: [{ target: makeTarget(0, 0, 10, 10), description: 'Only desc' }] });
        await screen.findByText('Only desc');
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });
});

describe('UserGuide 受控与 v-model', () => {
    it('v-model:current 与 v-model:visible 双向绑定', async () => {
        render(Model, { props: { steps: makeSteps() } });
        await screen.findByText('Title A');
        await click('下一步');
        await screen.findByText('Title B');
        expect(screen.getByTestId('current')).toHaveTextContent('1');
        await click('上一步');
        await screen.findByText('Title A');
        expect(screen.getByTestId('current')).toHaveTextContent('0');

        await click('跳过');
        expect(screen.getByTestId('visible')).toHaveTextContent('false');
        await waitFor(() => expect(screen.queryByText('Title A')).toBeNull());
    });

    it('v-model:visible 在 finish 与 modal 模式的 Escape 时关闭', async () => {
        const popup = render(Model, { props: { steps: makeSteps().slice(0, 1) } });
        await screen.findByText('Title A');
        await click('完成');
        expect(screen.getByTestId('visible')).toHaveTextContent('false');
        popup.unmount();

        render(Model, { props: { steps: makeSteps(), mode: 'modal' } });
        await screen.findByRole('dialog');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.getByTestId('visible')).toHaveTextContent('false');
    });

    it('update:current 先于 change、next 发出', async () => {
        const order: string[] = [];
        renderGuide({
            'onUpdate:current': () => order.push('update:current'),
            onChange: () => order.push('change'),
            onNext: () => order.push('next'),
        });
        await screen.findByText('Title A');
        await click('下一步');
        expect(order).toEqual(['update:current', 'change', 'next']);
    });

    it('skip 与 finish 先发 update:visible(false) 再发各自的事件，finish 不发 change 与 next', async () => {
        const order: string[] = [];
        const listeners = {
            'onUpdate:visible': (visible: boolean) => order.push(`update:visible:${visible}`),
            onSkip: () => order.push('skip'),
            onFinish: () => order.push('finish'),
            onChange: () => order.push('change'),
            onNext: () => order.push('next'),
        };
        const skipped = renderGuide(listeners);
        await screen.findByText('Title A');
        await click('跳过');
        expect(order).toEqual(['update:visible:false', 'skip']);
        skipped.unmount();

        order.length = 0;
        renderGuide({ ...listeners, steps: makeSteps().slice(0, 1) });
        await screen.findByText('Title A');
        await click('完成');
        expect(order).toEqual(['update:visible:false', 'finish']);
    });

    it('Escape 在非最后一步同样发 update:visible(false) 与 skip', async () => {
        const order: string[] = [];
        renderGuide({
            'onUpdate:visible': () => order.push('update:visible'),
            onSkip: () => order.push('skip'),
        });
        await screen.findByText('Title A');
        await fireEvent.keyDown(document, { key: 'Escape' });
        expect(order).toEqual(['update:visible', 'skip']);
    });

    it('单向绑定 visible 时点击跳过步骤不消失，只通知', async () => {
        const view = renderGuide();
        await screen.findByText('Title A');
        await click('跳过');
        expect(view.emitted().skip).toHaveLength(1);
        expect(screen.getByText('Title A')).toBeInTheDocument();
    });

    it('单向绑定 current 时点击不自翻转，同值重渲染保持原步骤', async () => {
        const steps = makeSteps();
        const view = renderGuide({ current: 1, steps });
        await screen.findByText('Title B');
        await click('下一步');
        expect(view.emitted().change).toEqual([[2]]);
        await view.rerender({ current: 1 });
        expect(screen.getByText('Title B')).toBeInTheDocument();
        expect(indicator()).toBe('2/3');
    });
});

describe('UserGuide 插槽与文本', () => {
    it('title、description、cover 得到 { item, index }，插槽优先于数据文本', async () => {
        const title = vi.fn<NonNullable<UserGuideSlots['title']>>(({ item, index }) => [<b class="custom-title">{`${item.title}-${index}`}</b>]);
        const description = ({ index }: { index: number }) => [<i class="custom-description">{`d${index}`}</i>];
        const view = renderGuide({}, { title, description, cover: coverOfFirst });
        await screen.findByText('Title A-0');
        expect(title.mock.calls[0][0]).toMatchObject({ index: 0, item: { title: 'Title A' } });
        expect($('.custom-description')).toHaveTextContent('d0');
        expect(screen.queryByText('Desc A')).toBeNull();
        expect(screen.getByAltText('cover-a')).toBeInTheDocument();
        await click('下一步');
        await screen.findByText('Title B-1');
        expect($('.custom-description')).toHaveTextContent('d1');
        expect(screen.queryByAltText('cover-a')).toBeNull();
        view.unmount();
    });

    it('插槽对某步骤渲染为空时回落数据文本，封面为空则没有封面区', async () => {
        const steps = makeSteps();
        render(TemplateSlots, { props: { steps, showTitle: false, mode: 'modal' } });
        await screen.findByText('Title A');
        expect(screen.getByText('Desc A')).toBeInTheDocument();
        expect(screen.getByAltText('slot-cover').parentElement).toHaveClass(`${modalPrefix}-cover`);
        await click('Forward');
        await screen.findByText('Title B');
        expect($('.custom-description')).toHaveTextContent('Slot description');
        expect(screen.queryByText('Desc B')).toBeNull();
        expect($(`.${modalPrefix}-cover`)).toBeNull();
        expect($(`.${modalPrefix}-indicator`)).toBeNull();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('aria-labelledby 在有插槽标题或数据标题时指向标题元素，两者皆无则不设', async () => {
        const steps = makeSteps();
        const view = render(TemplateSlots, { props: { steps, showTitle: true } });
        const dialog = await screen.findByRole('dialog', { name: 'Title A-0' });
        const titleId = dialog.getAttribute('aria-labelledby') as string;
        expect(document.getElementById(titleId)).toContainElement(screen.getByText('Title A-0'));
        view.unmount();

        render(UserGuide, {
            props: { steps: [{ target: steps[0].target, title: '' }], visible: true },
            slots: { title: () => [] } as never,
        });
        await nextFrame();
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('nextText 与 prevText 的模板写法替换文字，最后一步仍用 finishText', async () => {
        const view = render(TemplateSlots, { props: { steps: makeSteps(), current: 1 } });
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        await view.rerender({ current: 2 });
        await screen.findByText('Title C');
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
    });

    it('模板写法与 h() 写法的插槽在挂载与切换步骤时都没有 Vue 告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const template = render(TemplateSlots, { props: { steps: makeSteps(), showTitle: true } });
        await screen.findByText('Title A-0');
        await click('Forward');
        await screen.findByText('Title B-1');
        template.unmount();

        const slots = {
            title: ({ item }: { item: UserGuideStepItem }) => [<b>{item.title}</b>],
            cover: coverOfFirst,
        };
        renderGuide({}, slots);
        await screen.findByText('Title A');
        await click('下一步');
        await screen.findByText('Title B');
        expect(warn.mock.calls.filter(([message]) => String(message).includes('Vue warn'))).toHaveLength(0);
    });

    it('一次渲染中每个作用域插槽只求值一次', async () => {
        const title = vi.fn<NonNullable<UserGuideSlots['title']>>(() => [<b>T</b>]);
        const view = renderGuide({ mode: 'modal' }, { title });
        await screen.findByText('T');
        const calls = title.mock.calls.length;
        await view.rerender({ zIndex: 1500 });
        await nextTick();
        expect(title.mock.calls.length - calls).toBeLessThanOrEqual(1);
    });
});

describe('UserGuide 按钮属性', () => {
    it('onClick 先于内置处理被调用，步骤仍推进', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const prevClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderGuide({
            current: 1,
            nextButtonProps: { onClick },
            prevButtonProps: { onClick: prevClick },
        });
        await screen.findByText('Title B');
        await click('下一步');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(view.emitted().next).toEqual([[2]]);
        await click('上一步');
        expect(prevClick).toHaveBeenCalledTimes(1);
        expect(view.emitted().prev).toEqual([[0]]);
    });

    it('最后一步的 onClick 之后仍发 finish', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderGuide({ current: 2, nextButtonProps: { onClick } });
        await screen.findByText('Title C');
        await click('完成');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(view.emitted().finish).toHaveLength(1);
    });

    it('class、style 与内置值合并，disabled 生效', async () => {
        renderGuide({
            current: 1,
            nextButtonProps: { class: 'my-next', style: { color: 'red' }, disabled: true },
            prevButtonProps: { theme: 'borderless' },
        });
        await screen.findByText('Title B');
        const next = screen.getByRole('button', { name: '下一步' });
        expect(next).toHaveClass('my-next', `${BASE_CLASS_PREFIX}-button-solid`);
        expect(next).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(next).toBeDisabled();
        expect(screen.getByRole('button', { name: '上一步' })).toHaveClass(`${BASE_CLASS_PREFIX}-button-borderless`);
    });

    it('primary 主题的下一步按钮用主题 token 作背景', async () => {
        renderGuide({ theme: 'primary' });
        await screen.findByText('Title A');
        expect(screen.getByRole('button', { name: '下一步' }).getAttribute('style')).toContain('--semi-color-white');
    });
});

describe('UserGuide attrs', () => {
    it('class 与 style 落在 popover，id、data-*、aria-*、onClick 被丢弃，没有多根告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const onClick = vi.fn<(event: MouseEvent) => void>();
        render(UserGuide, {
            props: { steps: makeSteps(), visible: true },
            attrs: { class: 'attr-cls', id: 'guide-id', 'data-x': '1', 'aria-label': 'ignored', onClick },
        });
        await screen.findByText('Title A');
        const popover = $(`.${prefix}-popover`) as HTMLElement;
        expect(popover).toHaveClass('attr-cls');
        expect($('#guide-id')).toBeNull();
        expect($('[data-x]')).toBeNull();
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
        await click('下一步');
        await fireEvent.click(popover);
        expect(onClick).not.toHaveBeenCalled();
        expect(warn.mock.calls.filter(([message]) => String(message).includes('Extraneous'))).toHaveLength(0);
    });

    it('modal 模式同样丢弃其余属性，且没有告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const onClick = vi.fn<(event: MouseEvent) => void>();
        render(UserGuide, {
            props: { mode: 'modal', steps: makeSteps(), visible: true },
            attrs: { class: 'attr-cls', id: 'guide-id', 'data-x': '1', 'aria-label': 'ignored', onClick },
        });
        await screen.findByText('Title A');
        expect($(`.${modalPrefix}`)).toHaveClass('attr-cls');
        expect($('#guide-id')).toBeNull();
        expect($('[data-x]')).toBeNull();
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
        await click('下一步');
        await fireEvent.click($(`.${modalPrefix}`) as HTMLElement);
        expect(onClick).not.toHaveBeenCalled();
        expect(warn.mock.calls.filter(([message]) => String(message).includes('Extraneous'))).toHaveLength(0);
    });
});

describe('UserGuide KeepAlive', () => {
    const guide = (mode: 'popup' | 'modal') => ({ mode, steps: makeSteps(), visible: true });

    it('popup 失活后释放滚动锁、卡片不在页面上且不发事件，激活后恢复', async () => {
        const view = render(Cached, { props: { shown: true, guide: guide('popup') } });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('hidden');

        await view.rerender({ shown: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('');
        expect(screen.queryByText('Title A')).toBeNull();

        await view.rerender({ shown: true });
        await screen.findByText('Title A');
        await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
        expect(view.emitted().change).toBeUndefined();
        expect(view.emitted().skip).toBeUndefined();
        expect(view.emitted()['update:visible']).toBeUndefined();
    });

    it('modal 失活后释放滚动锁且不发事件，激活后恢复', async () => {
        const view = render(Cached, { props: { shown: true, guide: guide('modal') } });
        await screen.findByText('Title A');
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');

        await view.rerender({ shown: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('');
        expect(screen.queryByText('Title A')).toBeNull();

        await view.rerender({ shown: true });
        await nextTick();
        expect(screen.getByText('Title A')).toBeInTheDocument();
        expect(document.body.style.overflow).toBe('hidden');
        expect(view.emitted().skip).toBeUndefined();
    });
});

describe('UserGuide 与 ConfigProvider', () => {
    it('ConfigProvider 内的 popup 引导可正常渲染', async () => {
        render(ConfigProvider, {
            slots: { default: () => <UserGuide steps={makeSteps()} visible /> },
        });
        expect(await screen.findByText('Title A')).toBeInTheDocument();
    });
});

/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import LocaleProvider from '../../locale/locale-provider.vue';
import Banner from '../banner.vue';
import type { BannerEmits, BannerType } from '../interface';
import RootRef from './fixtures/root-ref.vue';
import Slots from './fixtures/slots.vue';
import Toggle from './fixtures/toggle.vue';

const prefix = 'semi-banner';
const getRoot = (container: Element) => container.querySelector<HTMLElement>(`.${prefix}`);
const closeButton = () => screen.getByRole('button', { name: zh_CN.Banner.close });

describe('Banner', () => {
    it('关闭按钮持焦时关闭，焦点交给文档顺序里的下一个可聚焦元素', async () => {
        render({
            render: () => (
                <>
                    <button>before</button>
                    <Banner title="t" />
                    <button>after</button>
                </>
            ),
        });
        const button = closeButton();
        button.focus();
        await fireEvent.click(button);
        await nextTick();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('不同 type 的 Banner', async () => {
        const view = render(Banner);
        expect(getRoot(view.container)).toHaveClass(`${prefix}-info`);
        for (const type of ['danger', 'success', 'warning', 'info'] as const) {
            await view.rerender({ type });
            expect(getRoot(view.container)).toHaveClass(`${prefix}-${type}`);
        }
    });

    it('class 与 style 落在根元素', () => {
        const view = render(Banner, { attrs: { class: 'test', style: { color: 'red' } } });
        expect(view.container.querySelector('div.test')).toBe(getRoot(view.container));
        expect(getRoot(view.container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('点击关闭按钮发出 close 事件，之后根元素消失', async () => {
        const view = render(Banner);
        const button = closeButton();
        await fireEvent.click(button);
        const [[event]] = view.emitted().close as [[MouseEvent]];
        expect(event.type).toBe('click');
        expect(event.target).toBe(button);
        expect(getRoot(view.container)).toBeNull();
    });

    it('close 监听返回之前根元素仍在，返回之后才消失', async () => {
        let presentInListener = false;
        const view = render(Banner, {
            props: {
                onClose: () => {
                    presentInListener = getRoot(document.body) !== null;
                },
            },
        });
        await fireEvent.click(closeButton());
        expect(presentInListener).toBe(true);
        expect(getRoot(view.container)).toBeNull();
    });

    it('根元素为 alert，每种 type 在 icon 区域显示带名称的默认图标', async () => {
        const view = render(Banner);
        for (const type of ['info', 'success', 'danger', 'warning'] as const satisfies BannerType[]) {
            await view.rerender({ type });
            expect(screen.getByRole('alert')).toBe(getRoot(view.container));
            const slot = view.container.querySelector('[x-semi-prop="icon"]');
            expect(slot).toHaveClass(`${prefix}-icon`);
            expect(slot?.parentElement).toHaveClass(`${prefix}-content`);
            const icon = screen.getByRole('img', { name: zh_CN.Banner[type] });
            expect(slot).toContainElement(icon);
            expect(icon).toHaveClass('semi-icon-large');
        }
    });

    it('fullMode 与 bordered 类名', async () => {
        const view = render(Banner, { props: { bordered: true } });
        expect(getRoot(view.container)).toHaveClass(`${prefix}-full`);
        expect(getRoot(view.container)).not.toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);

        await view.rerender({ bordered: false, fullMode: false });
        expect(getRoot(view.container)).toHaveClass(`${prefix}-in-container`);
        expect(getRoot(view.container)).not.toHaveClass(`${prefix}-full`, `${prefix}-bordered`);

        await view.rerender({ bordered: true, fullMode: false });
        expect(getRoot(view.container)).toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);
    });

    it('title、description 与默认插槽组成的结构', async () => {
        const view = render(Banner, {
            slots: { title: () => 'T', description: () => 'D', default: () => <span>extra</span> },
        });
        const root = getRoot(view.container) as HTMLElement;
        expect(root.children).toHaveLength(2);
        expect(root.firstElementChild).toHaveClass(`${prefix}-content-wrapper`);
        const body = view.container.querySelector(`.${prefix}-content-body`) as HTMLElement;
        const title = view.container.querySelector('[x-semi-prop="title"]') as HTMLElement;
        const description = view.container.querySelector('[x-semi-prop="description"]') as HTMLElement;
        expect(title.tagName).toBe('DIV');
        expect(title).toHaveClass(`${prefix}-title`, 'semi-typography');
        expect(title).toHaveTextContent(/^T$/);
        expect(description.tagName).toBe('DIV');
        expect(description).toHaveClass(`${prefix}-description`, 'semi-typography');
        expect(description).toHaveTextContent(/^D$/);
        expect([...body.children]).toEqual([title, description]);
        const extra = view.container.querySelector('[x-semi-prop="children"]');
        expect(extra).toHaveClass(`${prefix}-extra`);
        expect(root.lastElementChild).toBe(extra);
        expect(extra).toHaveTextContent(/^extra$/);
    });

    it('没有内容时 content-body 为空且没有 extra', () => {
        const view = render(Banner);
        expect(view.container.querySelector(`.${prefix}-content-body`)).toBeEmptyDOMElement();
        expect(view.container.querySelector(`.${prefix}-extra`)).toBeNull();
        expect(getRoot(view.container)?.children).toHaveLength(1);
    });

    it('title 可以是字符串 prop，同时给出插槽时插槽优先，且不成为原生 tooltip', () => {
        const view = render(Banner, { props: { title: 'plain' } });
        const root = getRoot(view.container) as HTMLElement;
        expect(view.container.querySelector('[x-semi-prop="title"]')).toHaveTextContent(/^plain$/);
        expect(root).not.toHaveAttribute('title');

        view.unmount();
        const both = render(Banner, { props: { title: 'plain' }, slots: { title: () => 'slotted' } });
        expect(both.container.querySelector('[x-semi-prop="title"]')).toHaveTextContent(/^slotted$/);
    });

    it('渲染 0 作为 title 与 description 内容', () => {
        const view = render(Banner, {
            slots: { title: () => 0 as unknown as string, description: () => 0 as unknown as string },
        });
        expect(view.container.querySelector('[x-semi-prop="title"]')).toHaveTextContent(/^0$/);
        expect(view.container.querySelector('[x-semi-prop="description"]')).toHaveTextContent(/^0$/);
    });

    it('#icon 替换默认图标，空的 #icon 隐藏图标区域', () => {
        const custom = render(Slots, { props: { icon: true } });
        expect(custom.container.querySelector('[x-semi-prop="icon"]')).toContainElement(screen.getByTestId('my-icon'));
        expect(screen.queryByRole('img', { name: zh_CN.Banner.danger })).toBeNull();
        custom.unmount();

        const empty = render(Banner, { props: { type: 'danger' }, slots: { icon: () => [] } });
        expect(empty.container.querySelector(`.${prefix}-icon`)).toBeNull();
        expect(screen.queryByRole('img', { name: zh_CN.Banner.danger })).toBeNull();
    });

    it('默认关闭按钮：可访问名称与默认图标', () => {
        const view = render(Banner);
        const button = closeButton();
        expect(button).toHaveClass(`${prefix}-close`);
        expect(button.parentElement).toBe(view.container.querySelector(`.${prefix}-content-wrapper`));
        const icon = button.querySelector('[x-semi-prop="closeIcon"]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).toHaveClass('semi-icon-close');
    });

    it('#closeIcon 替换按钮内的图标，空的 #closeIcon 移除按钮', () => {
        const custom = render(Slots, { props: { closeIcon: true } });
        expect(closeButton()).toContainElement(screen.getByTestId('my-close'));
        expect(closeButton().querySelector('[x-semi-prop="closeIcon"]')).toBeNull();
        custom.unmount();

        const empty = render(Banner, { slots: { closeIcon: () => [] } });
        expect(screen.queryByRole('button')).toBeNull();
        expect(empty.container.querySelector(`.${prefix}-close`)).toBeNull();
    });

    it('关闭时点击不冒泡到祖先元素，重渲染后保持关闭', async () => {
        const onBodyClick = vi.fn<() => void>();
        document.body.addEventListener('click', onBodyClick);
        try {
            const view = render(Banner);
            await fireEvent.click(closeButton());
            expect(view.emitted().close).toHaveLength(1);
            expect(onBodyClick).not.toHaveBeenCalled();
            expect(getRoot(view.container)).toBeNull();

            await view.rerender({ title: 'again' });
            expect(getRoot(view.container)).toBeNull();
        } finally {
            document.body.removeEventListener('click', onBodyClick);
        }
    });

    it('v-if 卸载后再挂载，关闭状态复位', async () => {
        const view = render(Toggle);
        await fireEvent.click(closeButton());
        expect(getRoot(view.container)).toBeNull();

        await fireEvent.click(view.getByRole('button', { name: 'toggle' }));
        expect(getRoot(view.container)).toBeNull();
        await fireEvent.click(view.getByRole('button', { name: 'toggle' }));
        expect(getRoot(view.container)).not.toBeNull();
        expect(view.getByText('hello')).toBeVisible();
    });

    it('没有 close 监听也能关闭', async () => {
        const view = render(Banner);
        await fireEvent.click(closeButton());
        expect(getRoot(view.container)).toBeNull();
    });

    it('data-* 属性落在根元素', () => {
        const view = render(Banner, { attrs: { 'data-foo': 'bar', 'data-testid': 'b' } });
        expect(screen.getByTestId('b')).toBe(getRoot(view.container));
        expect(getRoot(view.container)).toHaveAttribute('data-foo', 'bar');
    });

    it('未声明的属性落在根元素，role 固定为 alert', () => {
        const onMouseenter = vi.fn<() => void>();
        const view = render(Banner, {
            attrs: { id: 'b', 'aria-live': 'polite', role: 'status', onMouseenter },
        });
        const root = getRoot(view.container) as HTMLElement;
        expect(root).toHaveAttribute('id', 'b');
        expect(root).toHaveAttribute('aria-live', 'polite');
        expect(root).toHaveAttribute('role', 'alert');
        root.dispatchEvent(new MouseEvent('mouseenter'));
        expect(onMouseenter).toHaveBeenCalledTimes(1);
    });

    it('组件 ref 的 $el 是根元素', async () => {
        const view = render(RootRef);
        await nextTick();
        expect(view.getByLabelText('root-class')).toHaveTextContent(new RegExp(`^${prefix} ${prefix}-info ${prefix}-full$`));
    });

    it('读取 app 的全局默认值，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Banner: { type: 'danger', fullMode: false, bordered: true } };
        const view = render(Banner, { global: { provide: { [semiGlobalKey]: semi } } });
        expect(getRoot(view.container)).toHaveClass(`${prefix}-danger`, `${prefix}-in-container`, `${prefix}-bordered`);

        await view.rerender({ type: 'success', fullMode: true });
        expect(getRoot(view.container)).toHaveClass(`${prefix}-success`, `${prefix}-full`);
    });

    it('已移除的 target 属性作为普通属性落在根元素，不给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const view = render(Banner, { attrs: { target: '_blank' } });
            expect(getRoot(view.container)).toHaveAttribute('target', '_blank');
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('根元素被 v-if 隐藏后传入 attrs 不给出 Vue 警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const view = render(Banner, { attrs: { 'data-a': '1' } });
            await fireEvent.click(closeButton());
            expect(getRoot(view.container)).toBeNull();
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('关闭按钮和图标名称跟随语言包', () => {
        const view = render(Banner);
        expect(screen.getByRole('button', { name: zh_CN.Banner.close })).toBeInTheDocument();
        view.unmount();

        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <Banner type="success" /> },
        });
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: en_US.Banner.success })).toBeInTheDocument();
    });

    it('close 事件载荷类型是原生 MouseEvent', () => {
        expectTypeOf<BannerEmits['close']>().toEqualTypeOf<[event: MouseEvent]>();
    });
});

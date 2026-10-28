import { createSignal, Show } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Banner from '..';
import semiGlobal from '../../_utils/semi-global';
import { LocaleProvider } from '../../locale';
import type { BannerProps } from '../banner';

const prefix = `${BASE_CLASS_PREFIX}-banner`;
const getRoot = (container: HTMLElement) => container.querySelector(`.${prefix}`) as HTMLElement;
const query = (container: HTMLElement, selector: string) => container.querySelector(selector) as HTMLElement;
const closeButton = () => screen.getByRole('button', { name: zh_CN.Banner.close });

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Banner', () => {
    it('用键盘关闭后焦点交给文档顺序里的下一个可聚焦元素', async () => {
        render(() => (
            <>
                <button>before</button>
                <Banner title="t" />
                <button>after</button>
            </>
        ));
        closeButton().focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('父组件在 onClose 里卸载 Banner 时，焦点同样交给下一个可聚焦元素', async () => {
        const [visible, setVisible] = createSignal(true);
        render(() => (
            <>
                <Show when={visible()}>
                    <Banner title="t" onClose={() => setVisible(false)} />
                </Show>
                <button>after</button>
            </>
        ));
        closeButton().focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('不同 type 的 Banner', () => {
        const cases: [BannerProps['type'], string][] = [
            [undefined, `.${prefix}-info`],
            ['danger', `.${prefix}-danger`],
            ['success', `.${prefix}-success`],
            ['warning', `.${prefix}-warning`],
        ];
        for (const [type, selector] of cases) {
            const { container, unmount } = render(() => <Banner type={type} />);
            expect(getRoot(container)).toBe(container.querySelector(selector));
            unmount();
        }
    });

    it('自定义 class 与 style', () => {
        const { container } = render(() => <Banner class="test" style={{ color: 'red' }} />);
        expect(container.querySelector('div.test')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('调用 onClose', async () => {
        const onClose = vi.fn<(e: MouseEvent) => EventTarget | null>((e) => e.target);
        const { container } = render(() => <Banner onClose={onClose} />);
        const button = closeButton();
        await userEvent.click(button);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.results[0].value).toBe(button);
        expect(getRoot(container)).toBeNull();
    });

    it('根元素为 alert，每种 type 在 icon 插槽中显示默认图标', () => {
        for (const type of ['info', 'success', 'danger', 'warning'] as const) {
            const { container, unmount } = render(() => <Banner type={type} />);
            expect(screen.getByRole('alert')).toBe(getRoot(container));
            const slot = query(container, '[x-semi-prop="icon"]');
            expect(slot).toHaveClass(`${prefix}-icon`);
            expect(slot.parentElement).toHaveClass(`${prefix}-content`);
            const icon = screen.getByRole('img', { name: zh_CN.Banner[type] });
            expect(slot).toContainElement(icon);
            expect(icon).toHaveClass(`${BASE_CLASS_PREFIX}-icon-large`);
            unmount();
        }
    });

    it('fullMode 与 bordered 类名', () => {
        const [props, setProps] = createSignal<BannerProps>({ bordered: true });
        const { container } = render(() => <Banner {...props()} />);
        expect(getRoot(container)).toHaveClass(`${prefix}-full`);
        expect(getRoot(container)).not.toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);

        setProps({ fullMode: false });
        expect(getRoot(container)).toHaveClass(`${prefix}-in-container`);
        expect(getRoot(container)).not.toHaveClass(`${prefix}-full`, `${prefix}-bordered`);

        setProps({ bordered: true, fullMode: false });
        expect(getRoot(container)).toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);
    });

    it('title、description 与 children 通过 slots 组成的结构', () => {
        const [filled, setFilled] = createSignal(true);
        const { container } = render(() => (
            <Banner title={filled() ? 'T' : undefined} description={filled() ? 'D' : undefined}>
                {filled() ? <span>extra</span> : undefined}
            </Banner>
        ));
        const root = getRoot(container);
        expect(root.children).toHaveLength(2);
        expect(root.firstElementChild).toHaveClass(`${prefix}-content-wrapper`);
        const body = query(container, `.${prefix}-content-body`);
        const title = query(container, '[x-semi-prop="title"]');
        const description = query(container, '[x-semi-prop="description"]');
        expect(title.tagName).toBe('DIV');
        expect(title).toHaveClass(`${prefix}-title`, `${BASE_CLASS_PREFIX}-typography`);
        expect(title).toHaveTextContent(/^T$/);
        expect(description.tagName).toBe('DIV');
        expect(description).toHaveClass(`${prefix}-description`, `${BASE_CLASS_PREFIX}-typography`);
        expect(description).toHaveTextContent(/^D$/);
        expect([...body.children]).toEqual([title, description]);
        const extra = query(container, '[x-semi-prop="children"]');
        expect(extra).toHaveClass(`${prefix}-extra`);
        expect(root.lastElementChild).toBe(extra);
        expect(extra).toHaveTextContent(/^extra$/);

        setFilled(false);
        expect(body.children).toHaveLength(0);
        expect(body.textContent).toBe('');
        expect(container.querySelector(`.${prefix}-extra`)).toBeNull();
        expect(getRoot(container).children).toHaveLength(1);
    });

    it('自定义 icon 替换默认图标；icon 为 null 时隐藏 icon 插槽', () => {
        const [icon, setIcon] = createSignal<null | undefined>(undefined);
        const { container } = render(() => <Banner type="danger" icon={icon() === null ? null : <span data-testid="my-icon" />} />);
        expect(container.querySelector('[x-semi-prop="icon"]')).toContainElement(screen.getByTestId('my-icon'));
        expect(screen.queryByRole('img', { name: zh_CN.Banner.danger })).toBeNull();

        setIcon(null);
        expect(container.querySelector(`.${prefix}-icon`)).toBeNull();
        expect(screen.queryByRole('img', { name: zh_CN.Banner.danger })).toBeNull();
    });

    it('默认关闭按钮：可访问名称与默认 icon 插槽', () => {
        const { container } = render(() => <Banner />);
        const button = closeButton();
        expect(button).toHaveClass(`${prefix}-close`);
        expect(button.parentElement).toBe(container.querySelector(`.${prefix}-content-wrapper`));
        const icon = query(button, '[x-semi-prop="closeIcon"]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).toHaveClass(`${BASE_CLASS_PREFIX}-icon-close`);
    });

    it('自定义 closeIcon 渲染到关闭按钮中；closeIcon 为 null 时移除', () => {
        const [removed, setRemoved] = createSignal(false);
        const { container } = render(() => <Banner closeIcon={removed() ? null : <span data-testid="my-close" />} />);
        const button = closeButton();
        expect(button).toContainElement(screen.getByTestId('my-close'));
        expect(button.querySelector('[x-semi-prop="closeIcon"]')).toBeNull();

        setRemoved(true);
        expect(screen.queryByRole('button')).toBeNull();
        expect(container.querySelector(`.${prefix}-close`)).toBeNull();
    });

    it('关闭时点击不冒泡到祖先元素，重新传入属性后保持关闭', async () => {
        const onBodyClick = vi.fn<() => void>();
        const onClose = vi.fn<NonNullable<BannerProps['onClose']>>();
        document.body.addEventListener('click', onBodyClick);
        try {
            const [title, setTitle] = createSignal<string>();
            const { container } = render(() => <Banner title={title()} onClose={onClose} />);
            await userEvent.click(closeButton());
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onClose.mock.calls[0][0].type).toBe('click');
            expect(onBodyClick).not.toHaveBeenCalled();
            expect(getRoot(container)).toBeNull();

            setTitle('again');
            expect(getRoot(container)).toBeNull();
        } finally {
            document.body.removeEventListener('click', onBodyClick);
        }
    });

    it('未传 onClose 时关闭仍正常', async () => {
        const { container } = render(() => <Banner />);
        await userEvent.click(closeButton());
        expect(getRoot(container)).toBeNull();
    });

    it('将 data-* 属性传给根元素', () => {
        const { container } = render(() => <Banner data-foo="bar" data-testid="b" />);
        expect(screen.getByTestId('b')).toBe(getRoot(container));
        expect(getRoot(container)).toHaveAttribute('data-foo', 'bar');
    });

    it('将未声明的属性传给根元素，role 始终是 alert', () => {
        const onMouseEnter = vi.fn<() => void>();
        const { container } = render(() => <Banner id="b" aria-live="polite" onMouseEnter={onMouseEnter} />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'b');
        expect(root).toHaveAttribute('aria-live', 'polite');
        expect(root).toHaveAttribute('role', 'alert');
        root.dispatchEvent(new MouseEvent('mouseenter'));
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('ref 指向根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <Banner ref={(node) => (ref = node)} />);
        expect(ref).toBe(getRoot(container));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        const onClose = vi.fn<NonNullable<BannerProps['onClose']>>();
        semiGlobal.config.overrideDefaultProps = {
            Banner: { type: 'danger', fullMode: false, bordered: true, onClose },
        };
        const [explicit, setExplicit] = createSignal(false);
        const { container } = render(() => <Banner {...(explicit() ? { type: 'success' as const, fullMode: true } : {})} />);
        expect(getRoot(container)).toHaveClass(`${prefix}-danger`, `${prefix}-in-container`, `${prefix}-bordered`);
        setExplicit(true);
        expect(getRoot(container)).toHaveClass(`${prefix}-success`, `${prefix}-full`);
        await userEvent.click(closeButton());
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('已移除的 target 属性不再有警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const removed = { target: '_blank' } as unknown as BannerProps;
            render(() => <Banner {...removed} />);
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('数字 0 的 title、description、icon、children 照常渲染', () => {
        const { container } = render(() => (
            <Banner title={0} description={0} icon={0}>
                {0}
            </Banner>
        ));
        expect(container.querySelector(`.${prefix}-title`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefix}-description`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefix}-icon`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefix}-extra`)).toHaveTextContent(/^0$/);
    });

    it('关闭按钮的名称跟随语言包', () => {
        render(() => <Banner />);
        expect(closeButton()).toBeInTheDocument();

        render(() => (
            <LocaleProvider locale={en_US}>
                <Banner />
            </LocaleProvider>
        ));
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('展开信号对象时，改动无关属性不会让已关闭的状态或已选 icon 重建', async () => {
        const [props, setProps] = createSignal<BannerProps>({ icon: <span data-testid="my-icon" /> });
        const { container } = render(() => <Banner {...props()} />);
        const icon = screen.getByTestId('my-icon');
        setProps((prev) => ({ ...prev, class: 'x' }));
        expect(screen.getByTestId('my-icon')).toBe(icon);
        await userEvent.click(closeButton());
        setProps((prev) => ({ ...prev, bordered: true }));
        expect(getRoot(container)).toBeNull();
    });
});

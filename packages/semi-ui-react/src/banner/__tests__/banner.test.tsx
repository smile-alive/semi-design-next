import { StrictMode, createRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Banner, LocaleProvider } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { BannerProps } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-banner`;
const getRoot = (container) => container.querySelector(`.${prefix}`);

describe('Banner', () => {
    it('用键盘关闭后焦点交给文档顺序里的下一个可聚焦元素', async () => {
        render(
            <>
                <button>before</button>
                <Banner title="t" />
                <button>after</button>
            </>
        );
        screen.getByRole('button', { name: zh_CN.Banner.close }).focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('父组件在 onClose 里卸载 Banner 时，焦点同样交给下一个可聚焦元素', async () => {
        function Host() {
            const [visible, setVisible] = useState(true);
            return (
                <>
                    {visible && <Banner title="t" onClose={() => setVisible(false)} />}
                    <button>after</button>
                </>
            );
        }
        render(<Host />);
        screen.getByRole('button', { name: zh_CN.Banner.close }).focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('不同 type 的 Banner', () => {
        const cases: [BannerProps['type'], string][] = [
            [undefined, `.${BASE_CLASS_PREFIX}-banner-info`],
            ['danger', `.${BASE_CLASS_PREFIX}-banner-danger`],
            ['success', `.${BASE_CLASS_PREFIX}-banner-success`],
            ['warning', `.${BASE_CLASS_PREFIX}-banner-warning`],
        ];
        for (const [type, selector] of cases) {
            const { container, unmount } = render(<Banner type={type} />);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-banner`)).toBe(container.querySelector(selector));
            unmount();
        }
    });

    it('自定义 className 与 style', () => {
        const { container } = render(<Banner className="test" style={{ color: 'red' }} />);
        expect(container.querySelector('div.test')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('调用 onClose', async () => {
        const onClose = vi.fn<(e: ReactMouseEvent) => EventTarget>((e) => e.target);
        const { container } = render(<Banner onClose={onClose} />);
        const closeButton = screen.getByRole('button', { name: zh_CN.Banner.close });
        await userEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.results[0].value).toBe(closeButton);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-banner`)).toBeNull();
    });

    it('根元素为 alert，每种 type 在 icon 插槽中显示默认图标', () => {
        for (const type of ['info', 'success', 'danger', 'warning'] as const) {
            const { container, unmount } = render(<Banner type={type} />);
            expect(screen.getByRole('alert')).toBe(getRoot(container));
            const slot = container.querySelector('[x-semi-prop="icon"]');
            expect(slot).toHaveClass(`${prefix}-icon`);
            expect(slot.parentElement).toHaveClass(`${prefix}-content`);
            const icon = screen.getByRole('img', { name: zh_CN.Banner[type] });
            expect(slot).toContainElement(icon);
            expect(icon).toHaveClass(`${BASE_CLASS_PREFIX}-icon-large`);
            unmount();
        }
    });

    it('fullMode 与 bordered 类名', () => {
        const { container, rerender } = render(<Banner bordered />);
        expect(getRoot(container)).toHaveClass(`${prefix}-full`);
        expect(getRoot(container)).not.toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);

        rerender(<Banner fullMode={false} />);
        expect(getRoot(container)).toHaveClass(`${prefix}-in-container`);
        expect(getRoot(container)).not.toHaveClass(`${prefix}-full`, `${prefix}-bordered`);

        rerender(<Banner bordered fullMode={false} />);
        expect(getRoot(container)).toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);
    });

    it('title、description 与 children 通过 slots 组成的结构', () => {
        const { container, rerender } = render(
            <Banner title="T" description="D">
                <span>extra</span>
            </Banner>
        );
        const root = getRoot(container);
        expect(root.children).toHaveLength(2);
        expect(root.firstChild).toHaveClass(`${prefix}-content-wrapper`);
        const body = container.querySelector(`.${prefix}-content-body`);
        const title = container.querySelector('[x-semi-prop="title"]');
        const description = container.querySelector('[x-semi-prop="description"]');
        expect(title.tagName).toBe('DIV');
        expect(title).toHaveClass(`${prefix}-title`, `${BASE_CLASS_PREFIX}-typography`);
        expect(title).toHaveTextContent(/^T$/);
        expect(description.tagName).toBe('DIV');
        expect(description).toHaveClass(`${prefix}-description`, `${BASE_CLASS_PREFIX}-typography`);
        expect(description).toHaveTextContent(/^D$/);
        expect([...body.children]).toEqual([title, description]);
        const extra = container.querySelector('[x-semi-prop="children"]');
        expect(extra).toHaveClass(`${prefix}-extra`);
        expect(root.lastChild).toBe(extra);
        expect(extra).toHaveTextContent(/^extra$/);

        rerender(<Banner />);
        expect(container.querySelector(`.${prefix}-content-body`)).toBeEmptyDOMElement();
        expect(container.querySelector(`.${prefix}-extra`)).toBeNull();
        expect(getRoot(container).children).toHaveLength(1);
    });

    it('自定义 icon 替换默认图标；icon 为 null 时隐藏 icon 插槽', () => {
        const { container, rerender } = render(<Banner type="danger" icon={<span data-testid="my-icon" />} />);
        expect(container.querySelector('[x-semi-prop="icon"]')).toContainElement(screen.getByTestId('my-icon'));
        expect(screen.queryByRole('img', { name: 'danger' })).toBeNull();

        rerender(<Banner type="danger" icon={null} />);
        expect(container.querySelector(`.${prefix}-icon`)).toBeNull();
        expect(screen.queryByRole('img', { name: 'danger' })).toBeNull();
    });

    it('默认关闭按钮：可访问名称与默认 icon 插槽', () => {
        const { container } = render(<Banner />);
        const button = screen.getByRole('button', { name: zh_CN.Banner.close });
        expect(button).toHaveClass(`${prefix}-close`);
        expect(button.parentElement).toBe(container.querySelector(`.${prefix}-content-wrapper`));
        const icon = button.querySelector('[x-semi-prop="closeIcon"]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).toHaveClass(`${BASE_CLASS_PREFIX}-icon-close`);
    });

    it('自定义 closeIcon 渲染到关闭按钮中；closeIcon 为 null 时移除', () => {
        const { container, rerender } = render(<Banner closeIcon={<span data-testid="my-close" />} />);
        const button = screen.getByRole('button', { name: zh_CN.Banner.close });
        expect(button).toContainElement(screen.getByTestId('my-close'));
        expect(button.querySelector('[x-semi-prop="closeIcon"]')).toBeNull();

        rerender(<Banner closeIcon={null} />);
        expect(screen.queryByRole('button')).toBeNull();
        expect(container.querySelector(`.${prefix}-close`)).toBeNull();
    });

    it('关闭时点击不冒泡到祖先元素，重渲染后保持关闭', async () => {
        const onBodyClick = vi.fn<() => void>();
        const onClose = vi.fn<NonNullable<BannerProps['onClose']>>();
        document.body.addEventListener('click', onBodyClick);
        try {
            const { container, rerender } = render(<Banner onClose={onClose} />);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Banner.close }));
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onClose.mock.calls[0][0].type).toBe('click');
            expect(onBodyClick).not.toHaveBeenCalled();
            expect(getRoot(container)).toBeNull();

            rerender(<Banner title="again" onClose={onClose} />);
            expect(getRoot(container)).toBeNull();
        } finally {
            document.body.removeEventListener('click', onBodyClick);
        }
    });

    it('未传 onClose 及 StrictMode 下关闭仍正常', async () => {
        const { container } = render(
            <StrictMode>
                <Banner />
            </StrictMode>
        );
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Banner.close }));
        expect(getRoot(container)).toBeNull();
    });

    it('将 data-* 属性传给根元素', () => {
        const { container } = render(<Banner data-foo="bar" data-testid="b" />);
        expect(screen.getByTestId('b')).toBe(getRoot(container));
        expect(getRoot(container)).toHaveAttribute('data-foo', 'bar');
    });

    it('将未声明的属性传给根元素', () => {
        const onMouseEnter = vi.fn<() => void>();
        const { container } = render(<Banner id="b" aria-live="polite" onMouseEnter={onMouseEnter} />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'b');
        expect(root).toHaveAttribute('aria-live', 'polite');
        expect(root).toHaveAttribute('role', 'alert');
        root.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('ref 指向根元素', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Banner ref={ref} />);
        expect(ref.current).toBe(getRoot(container));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        const onClose = vi.fn<NonNullable<BannerProps['onClose']>>();
        semiGlobal.config.overrideDefaultProps = {
            Banner: { type: 'danger', fullMode: false, bordered: true, onClose },
        };
        try {
            const { container, rerender } = render(<Banner />);
            expect(getRoot(container)).toHaveClass(`${prefix}-danger`, `${prefix}-in-container`, `${prefix}-bordered`);
            rerender(<Banner type="success" fullMode />);
            expect(getRoot(container)).toHaveClass(`${prefix}-success`, `${prefix}-full`);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Banner.close }));
            expect(onClose).toHaveBeenCalledTimes(1);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('不再对已移除的 target 属性给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const removed = { target: '_blank' } as unknown as BannerProps;
            render(<Banner {...removed} />);
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('数字 0 的 title、description、icon、children 照常渲染', () => {
        const { container } = render(
            <Banner title={0} description={0} icon={0}>
                {0}
            </Banner>
        );
        expect(container.querySelector(`.${prefix}-title`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefix}-description`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefix}-icon`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefix}-extra`)).toHaveTextContent(/^0$/);
    });

    it('关闭按钮的名称跟随语言包', () => {
        const { rerender } = render(<Banner />);
        expect(screen.getByRole('button', { name: zh_CN.Banner.close })).toBeInTheDocument();

        rerender(
            <LocaleProvider locale={en_US}>
                <Banner />
            </LocaleProvider>
        );
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
});

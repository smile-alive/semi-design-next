import { createSignal, type JSX, onMount } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing } from '@test/utils/browser';
import Avatar, { AvatarGroup } from '..';

const prefixCls = `${BASE_CLASS_PREFIX}-avatar`;

const svg = (color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/></svg>`)}`;

describe('Avatar', () => {
    it.each([
        ['extra-extra-small', '3px'],
        ['extra-small', '3px'],
        ['small', '3px'],
        ['large', '6px'],
        ['extra-large', '12px'],
    ] as const)('方形头像的描边环在 %s 尺寸下圆角跟随头像', (size, radius) => {
        const { container } = render(() => <Avatar border shape="square" size={size} src={svg('red')} />);
        const ring = container.querySelector(`.${prefixCls}-additionalBorder`) as Element;
        expect(getComputedStyle(ring).borderTopLeftRadius).toBe(radius);
    });

    it('extra-small 方形头像的底部 slot 应用该尺寸的边框宽度', () => {
        const { container } = render(() => <Avatar bottomSlot={{ shape: 'square', text: 'N' }} size="extra-small" src={svg('red')} />);
        const slot = container.querySelector(`.${prefixCls}-bottom_slot-shape_square-extra-small`) as Element;
        expect(getComputedStyle(slot).borderTopWidth).toBe('2px');
    });

    it('键盘交互', async () => {
        const onClick = vi.fn<(message: string) => void>();
        const { container } = render(() => (
            <>
                <button data-testid="initial_focus_point">start</button>
                <Avatar alt="a cat 1" src={svg('red')} onClick={() => onClick('click avatar 1')} />
                <Avatar alt="a cat 2" size="small" src={svg('blue')} onClick={() => onClick('click avatar 2')} />
            </>
        ));
        const avatar = container.querySelectorAll(`.${prefixCls}`)[0];

        await userEvent.click(screen.getByTestId('initial_focus_point'));
        await userEvent.keyboard('{Tab}');
        expectThemeFocusRing(avatar);

        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledWith('click avatar 1');

        await userEvent.keyboard('{Escape}');
        expectThemeFocusRing(avatar);
        await userEvent.keyboard('{Backspace}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it.each<[string, () => JSX.Element]>([
        ['图片', () => <Avatar alt="cat" src={svg('red')} onClick={() => {}} />],
        ['文字', () => <Avatar onClick={() => {}}>U</Avatar>],
        [
            '元素',
            () => (
                <Avatar alt="icon" onClick={() => {}}>
                    <b>★</b>
                </Avatar>
            ),
        ],
    ])('可点击的%s头像：鼠标点击后不显示焦点环，再按键后显示主题焦点环', async (_, avatarElement) => {
        const { container } = render(avatarElement);
        const avatar = container.querySelector(`.${prefixCls}`) as Element;
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('button')).toHaveFocus();
        expect(getComputedStyle(avatar).outlineStyle).toBe('none');
        // Backspace is ignored by the avatar but makes the browser treat focus as keyboard focus
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(avatar);
    });

    it('不可点击的头像里获得焦点的子元素不在头像上画焦点环', async () => {
        const { container } = render(() => (
            <Avatar>
                <a aria-label="link" href="#top" />
            </Avatar>
        ));
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('link')).toHaveFocus();
        expect(getComputedStyle(container.querySelector(`.${prefixCls}`) as Element).outlineStyle).toBe('none');
    });

    it('src 变化', async () => {
        const srcGroup = {
            successSrc1: svg('red'),
            successSrc2: svg('green'),
            errorSrc: 'data:image/png;base64,AAAA',
        };
        const [src, setSrc] = createSignal<keyof typeof srcGroup>('successSrc1');
        const { container } = render(() => (
            <>
                <button onClick={() => setSrc('successSrc2')}>success 2</button>
                <button onClick={() => setSrc('errorSrc')}>error</button>
                <Avatar alt="test image" src={srcGroup[src()]} />
            </>
        ));
        const avatar = () => container.querySelector(`.${prefixCls}`);

        await userEvent.click(screen.getByText('success 2'));
        await waitFor(() => expect(avatar()).toHaveClass(`${prefixCls}-img`));
        await userEvent.click(screen.getByText('error'));
        await waitFor(() => expect(avatar()).toHaveClass(`${prefixCls}-grey`));
        expect(avatar()).not.toHaveClass(`${prefixCls}-img`);
    });
});

describe('Avatar 文字缩放', () => {
    const measure = (container: HTMLElement) => {
        const content = container.querySelector(`.${prefixCls}-content`) as HTMLElement;
        const avatar = container.querySelector(`.${prefixCls}`) as HTMLElement;
        return { transform: content.style.transform, contentWidth: content.getBoundingClientRect().width, avatarWidth: avatar.getBoundingClientRect().width };
    };

    it('过长的文字缩小到头像之内', () => {
        const { container } = render(() => (
            <Avatar size="small" gap={3}>
                Semi Design
            </Avatar>
        ));
        const { transform, contentWidth, avatarWidth } = measure(container);
        expect(transform).not.toBe('scale(1)');
        expect(contentWidth).toBeLessThanOrEqual(avatarWidth);
    });

    it('组内头像按组的 size 测量', () => {
        const { container } = render(() => (
            <AvatarGroup size="small">
                <Avatar gap={3}>Semi Design</Avatar>
            </AvatarGroup>
        ));
        const { transform, contentWidth, avatarWidth } = measure(container);
        expect(transform).not.toBe('scale(1)');
        expect(contentWidth).toBeLessThanOrEqual(avatarWidth);
    });

    it('父组件挂载时就换成过长的文字，缩小到头像之内', () => {
        function Demo() {
            const [text, setText] = createSignal('S');
            onMount(() => setText('Semi Design'));
            return (
                <Avatar size="small" gap={3}>
                    {text()}
                </Avatar>
            );
        }
        const { container } = render(() => <Demo />);
        const { transform, contentWidth, avatarWidth } = measure(container);
        expect(transform).not.toBe('scale(1)');
        expect(contentWidth).toBeLessThanOrEqual(avatarWidth);
    });

    it('文字变短后恢复原大小，再变长时重新缩小', () => {
        const [text, setText] = createSignal('Semi Design');
        const { container } = render(() => (
            <Avatar size="small" gap={3}>
                {text()}
            </Avatar>
        ));
        setText('S');
        expect(measure(container).transform).toBe('scale(1)');
        setText('Semi Design');
        const { transform, contentWidth, avatarWidth } = measure(container);
        expect(transform).not.toBe('scale(1)');
        expect(contentWidth).toBeLessThanOrEqual(avatarWidth);
    });
});

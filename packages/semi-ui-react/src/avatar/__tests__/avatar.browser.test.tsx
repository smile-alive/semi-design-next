import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Avatar, Radio, RadioGroup } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing } from '@test/utils/browser';

const prefixCls = `${BASE_CLASS_PREFIX}-avatar`;

const svg = (color) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/></svg>`)}`;

describe('Avatar', () => {
    it.each([
        ['extra-extra-small', '3px'],
        ['extra-small', '3px'],
        ['small', '3px'],
        ['large', '6px'],
        ['extra-large', '12px'],
    ] as const)('方形头像的描边环在 %s 尺寸下圆角跟随头像', (size, radius) => {
        const { container } = render(<Avatar border shape="square" size={size} src={svg('red')} />);
        const ring = container.querySelector(`.${prefixCls}-additionalBorder`);
        expect(getComputedStyle(ring).borderTopLeftRadius).toBe(radius);
    });

    it('extra-small 方形头像的底部 slot 应用该尺寸的边框宽度', () => {
        const { container } = render(<Avatar bottomSlot={{ shape: 'square', text: 'N' }} size="extra-small" src={svg('red')} />);
        const slot = container.querySelector(`.${prefixCls}-bottom_slot-shape_square-extra-small`);
        expect(getComputedStyle(slot).borderTopWidth).toBe('2px');
    });

    it('键盘交互', async () => {
        const onClick = vi.fn<(message: string) => void>();
        const { container } = render(
            <>
                <button data-testid="initial_focus_point">start</button>
                <Avatar alt="a cat 1" src={svg('red')} onClick={() => onClick('click avatar 1')} />
                <Avatar alt="a cat 2" size="small" src={svg('blue')} onClick={() => onClick('click avatar 2')} />
            </>
        );
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

    it.each([
        ['图片', <Avatar key="img" alt="cat" src={svg('red')} onClick={() => {}} />],
        [
            '文字',
            <Avatar key="text" onClick={() => {}}>
                U
            </Avatar>,
        ],
        [
            '元素',
            <Avatar key="node" alt="icon" onClick={() => {}}>
                <b>★</b>
            </Avatar>,
        ],
    ])('可点击的%s头像：鼠标点击后不显示焦点环，再按键后显示主题焦点环', async (_, avatarElement) => {
        const { container } = render(avatarElement);
        const avatar = container.querySelector(`.${prefixCls}`);
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('button')).toHaveFocus();
        expect(getComputedStyle(avatar).outlineStyle).toBe('none');
        // Backspace is ignored by the avatar but makes the browser treat focus as keyboard focus
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(avatar);
    });

    it('不可点击的头像里获得焦点的子元素不在头像上画焦点环', async () => {
        const { container } = render(
            <Avatar>
                <a aria-label="link" href="#top" />
            </Avatar>
        );
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('link')).toHaveFocus();
        expect(getComputedStyle(container.querySelector(`.${prefixCls}`)).outlineStyle).toBe('none');
    });

    it('src 变化', async () => {
        const srcGroup = {
            successSrc1: svg('red'),
            successSrc2: svg('green'),
            errorSrc: 'data:image/png;base64,AAAA',
        };
        function Demo() {
            const [src, setSrc] = useState('successSrc1');
            return (
                <>
                    <RadioGroup value={src} onChange={(e) => setSrc(e.target.value)}>
                        <Radio value="successSrc1">success 1</Radio>
                        <Radio value="successSrc2">success 2</Radio>
                        <Radio value="errorSrc">error</Radio>
                    </RadioGroup>
                    <Avatar alt="test image" src={srcGroup[src]} />
                </>
            );
        }
        const { container } = render(<Demo />);
        const avatar = () => container.querySelector(`.${prefixCls}`);

        await userEvent.click(screen.getByText('success 2'));
        await waitFor(() => expect(avatar()).toHaveClass(`${prefixCls}-img`));
        await userEvent.click(screen.getByText('error'));
        await waitFor(() => expect(avatar()).toHaveClass(`${prefixCls}-grey`));
        expect(avatar()).not.toHaveClass(`${prefixCls}-img`);
    });
});

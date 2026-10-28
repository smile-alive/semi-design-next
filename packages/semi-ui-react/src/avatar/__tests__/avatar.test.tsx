import React, { StrictMode, type ImgHTMLAttributes } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Tooltip from '@fibrae/semi-ui-react/tooltip';
import Avatar from '../index';
import type { AvatarColor, AvatarProps } from '../interface';
import TopSlotSvg from '../top-slot-svg';

const avartarPrefix = `${BASE_CLASS_PREFIX}-avatar`;
const src = 'https://example.com/dy.png';

const getAvatars = () => [...document.querySelectorAll(`.${avartarPrefix}`)];
const getAvatar = () => document.querySelector(`.${avartarPrefix}`);

describe('Avatar', () => {
    it('topSlot、bottomSlot 只有 text 必填', () => {
        expectTypeOf<{ text: string }>().toExtend<NonNullable<AvatarProps['topSlot']>>();
        expectTypeOf<{ text: string }>().toExtend<NonNullable<AvatarProps['bottomSlot']>>();
        expectTypeOf<{ text?: undefined }>().not.toExtend<NonNullable<AvatarProps['topSlot']>>();
    });

    it('hoverMask 为 0 时悬停后照常渲染', async () => {
        const { container } = render(<Avatar hoverMask={0} />);
        await userEvent.hover(getAvatar());
        expect(container.querySelector(`.${avartarPrefix}-hover`)).toHaveTextContent(/^0$/);
    });

    it('单独使用时不是列表项', () => {
        render(<Avatar>U</Avatar>);
        expect(getAvatar()).not.toHaveAttribute('role');
        expect(screen.queryByRole('listitem')).toBeNull();
    });

    it('size', () => {
        const element = (
            <div>
                <Avatar style={{ margin: 4 }} size="extra-extra-small">
                    U
                </Avatar>
                <Avatar style={{ margin: 4 }} size="extra-small">
                    U
                </Avatar>
                <Avatar style={{ margin: 4 }} size="small">
                    U
                </Avatar>
                <Avatar style={{ margin: 4 }} size="default">
                    U
                </Avatar>
                <Avatar style={{ margin: 4 }}>U</Avatar>
                <Avatar style={{ margin: 4 }} size="large">
                    U
                </Avatar>
                <Avatar style={{ margin: 4 }} size="extra-large">
                    U
                </Avatar>
            </div>
        );
        render(element);
        const avatars = getAvatars();
        expect(avatars[1]).not.toHaveClass(`${avartarPrefix}-extra-extra-small`);
        expect(avatars[0]).toHaveClass(`${avartarPrefix}-extra-extra-small`);
        expect(avatars[1]).toHaveClass(`${avartarPrefix}-extra-small`);
        expect(avatars[2]).toHaveClass(`${avartarPrefix}-small`);
        expect(avatars[3]).toHaveClass(`${avartarPrefix}-default`);
        expect(avatars[4]).toHaveClass(`${avartarPrefix}-medium`);
        expect(avatars[5]).toHaveClass(`${avartarPrefix}-large`);
        expect(avatars[6]).toHaveClass(`${avartarPrefix}-extra-large`);
    });

    it('color', () => {
        const colors: AvatarColor[] = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow'];
        render(
            <div>
                {colors.map((color) => (
                    <Avatar key={color} style={{ margin: 4 }} color={color}>
                        TJ
                    </Avatar>
                ))}
            </div>
        );
        const avatars = getAvatars();
        expect(avatars[1]).not.toHaveClass(`${avartarPrefix}-amber`);
        colors.forEach((color, index) => {
            expect(avatars[index]).toHaveClass(`${avartarPrefix}-${color}`);
        });
    });

    it('src', () => {
        render(<Avatar style={{ margin: 4 }} src={src} />);
        expect(screen.getByRole('img')).toHaveAttribute('src', src);
        expect(getAvatar()).toHaveClass(`${avartarPrefix}-img`);
    });

    it('shape', () => {
        const element = (
            <div>
                <Avatar style={{ margin: 4 }}>U</Avatar>
                <Avatar style={{ margin: 4 }} shape="square">
                    U
                </Avatar>
            </div>
        );
        render(element);
        const avatars = getAvatars();
        expect(avatars[1]).not.toHaveClass(`${avartarPrefix}-circle`);
        expect(avatars[0]).toHaveClass(`${avartarPrefix}-circle`);
        expect(avatars[1]).toHaveClass(`${avartarPrefix}-square`);
    });

    it('className 与 style', () => {
        render(
            <Avatar className="test-avatar" style={{ color: 'red' }}>
                A
            </Avatar>
        );
        const avatar = getAvatar();
        expect(avatar).toHaveClass('test-avatar');
        expect(avatar).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('gap 与 scale', () => {
        const gap = 10;
        const { container } = render(<Avatar gap={gap}>Semi</Avatar>);
        // jsdom has no text layout, so the text width is 0 and the content keeps its initial scale
        expect(container.querySelector(`.${avartarPrefix}-content`)).toHaveStyle({ transform: 'scale(1)' });
    });

    it('onError', () => {
        const spyOnError = vi.fn<React.MouseEventHandler>();
        const { container } = render(
            <Avatar src={src} onError={spyOnError}>
                fallback
            </Avatar>
        );
        fireEvent.error(container.querySelector('img'));
        expect(spyOnError).toHaveBeenCalled();
        expect(container.querySelector('img')).toBeNull();
        expect(getAvatar()).not.toHaveClass(`${avartarPrefix}-img`);
        expect(screen.getByRole('img', { name: 'fallback' })).toHaveTextContent(/^fallback$/);
    });

    it('图片每次出错时 onError 调用一次', () => {
        const spyOnError = vi.fn<React.MouseEventHandler>();
        const { container } = render(<Avatar src={src} onError={spyOnError} />);
        fireEvent.error(container.querySelector('img'));
        expect(spyOnError).toHaveBeenCalledTimes(1);
    });

    it('onClick', async () => {
        const spyOnClick = vi.fn<React.MouseEventHandler>();
        render(<Avatar onClick={spyOnClick} />);
        await userEvent.click(getAvatar());
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('onClick，topSlot', async () => {
        const spyOnClick = vi.fn<React.MouseEventHandler>();
        render(<Avatar topSlot={{ text: '直播' }} onClick={spyOnClick} />);
        expect(screen.getByText('直播')).toBeInTheDocument();
        await userEvent.click(getAvatar());
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('onMouseEnter', async () => {
        const spyOnMouseEnter = vi.fn<React.MouseEventHandler>();
        render(<Avatar onMouseEnter={spyOnMouseEnter} />);
        await userEvent.hover(getAvatar());
        expect(spyOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('onMouseEnter，topSlot', async () => {
        const spyOnMouseEnter = vi.fn<React.MouseEventHandler>();
        const { container } = render(<Avatar topSlot={{ text: '直播' }} onMouseEnter={spyOnMouseEnter} />);
        await userEvent.hover(container.firstChild as HTMLElement);
        expect(spyOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('onMouseLeave', async () => {
        const spyOnMouseLeave = vi.fn<React.MouseEventHandler>();
        render(<Avatar onMouseLeave={spyOnMouseLeave} />);
        await userEvent.hover(getAvatar());
        await userEvent.unhover(getAvatar());
        expect(spyOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('onMouseLeave，topSlot', async () => {
        const spyOnMouseLeave = vi.fn<React.MouseEventHandler>();
        const { container } = render(<Avatar topSlot={{ text: '直播' }} onMouseLeave={spyOnMouseLeave} />);
        const wrapper = container.firstChild as HTMLElement;
        await userEvent.hover(wrapper);
        await userEvent.unhover(wrapper);
        expect(spyOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('带 topSlot 悬停头像时 onMouseEnter 与 onMouseLeave 各只触发一次', async () => {
        const spyOnMouseEnter = vi.fn<React.MouseEventHandler>();
        const spyOnMouseLeave = vi.fn<React.MouseEventHandler>();
        render(<Avatar topSlot={{ text: '直播' }} onMouseEnter={spyOnMouseEnter} onMouseLeave={spyOnMouseLeave} />);
        await userEvent.hover(getAvatar());
        await userEvent.unhover(getAvatar());
        expect(spyOnMouseEnter).toHaveBeenCalledTimes(1);
        expect(spyOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('hoverMask', async () => {
        const { container } = render(<Avatar hoverMask="asd" />);
        expect(container.querySelector(`.${avartarPrefix}-hover`)).toBeNull();
        await userEvent.hover(getAvatar());
        expect(container.querySelector(`.${avartarPrefix}-hover`)).toHaveTextContent(/^asd$/);
        await userEvent.unhover(getAvatar());
        expect(container.querySelector(`.${avartarPrefix}-hover`)).toBeNull();
    });

    it('topSlot 渐变 id 在重渲染间保持稳定，且每个实例唯一', () => {
        const { container, rerender } = render(<TopSlotSvg gradientEnd="blue" gradientStart="red" />);
        const gradientId = container.querySelector('linearGradient').id;
        rerender(<TopSlotSvg gradientEnd="blue" gradientStart="green" />);
        expect(container.querySelector('linearGradient').id).toBe(gradientId);
        expect(container.querySelector('path')).toHaveAttribute('fill', `url(#${gradientId})`);

        const { container: other } = render(<TopSlotSvg gradientEnd="blue" gradientStart="red" />);
        const otherIds = [...other.querySelectorAll('[id]')].map((el) => el.id);
        const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
        expect(otherIds.filter((id) => ids.includes(id))).toEqual([]);
    });

    describe('基线', () => {
        it('渲染带 alt 与 imgAttr 的图片', () => {
            render(<Avatar alt="Bob" imgAttr={{ draggable: false, 'data-img': 'x' } as ImgHTMLAttributes<HTMLImageElement>} src={src} />);
            const img = screen.getByRole('img', { name: 'Bob' });
            expect(img).toHaveAttribute('src', src);
            expect(img).toHaveAttribute('draggable', 'false');
            expect(img).toHaveAttribute('data-img', 'x');
            expect(img).not.toHaveAttribute('tabindex');
        });

        it('imgAttr.className 与可点击头像的焦点类合并', () => {
            render(<Avatar alt="Bob" imgAttr={{ className: 'my-img' }} src={src} onClick={() => {}} />);
            expect(screen.getByRole('button', { name: 'Bob' })).toHaveClass('my-img', `${avartarPrefix}-no-focus-visible`);
        });

        it('imgAttr.onError 与内置回退都执行', () => {
            const onImgError = vi.fn<() => void>();
            const { container } = render(
                <Avatar imgAttr={{ onError: onImgError }} src={src}>
                    B
                </Avatar>
            );
            fireEvent.error(container.querySelector('img'));
            expect(onImgError).toHaveBeenCalledTimes(1);
            expect(container.querySelector('img')).toBeNull();
        });

        it('数字与多段文本 children 作为文字，带名称与缩放容器', () => {
            const { container, rerender } = render(<Avatar size="large">{1}</Avatar>);
            expect(screen.getByRole('img')).toHaveAttribute('aria-label', '1');
            expect(container.querySelector(`.${avartarPrefix}-content`)).not.toBeNull();
            rerender(<Avatar alt="x">A{1}</Avatar>);
            expect(screen.getByRole('img', { name: 'x' })).toHaveTextContent('A1');
        });

        it('图片加载失败时回退为以 alt 命名的字符串 children', () => {
            const { container } = render(
                <Avatar alt="Bob" color="red" src={src}>
                    B
                </Avatar>
            );
            expect(getAvatar()).not.toHaveClass(`${avartarPrefix}-red`);
            fireEvent.error(container.querySelector('img'));
            expect(container.querySelector('img')).toBeNull();
            expect(screen.getByRole('img', { name: 'Bob' })).toHaveTextContent(/^B$/);
            expect(getAvatar()).toHaveClass(`${avartarPrefix}-red`);
        });

        it('回退时原样渲染非字符串 children', () => {
            const { container } = render(
                <Avatar src={src}>
                    <i className="custom-icon" />
                </Avatar>
            );
            fireEvent.error(container.querySelector('img'));
            expect(getAvatar().querySelector('.custom-icon')).toBeInTheDocument();
            expect(container.querySelector(`.${avartarPrefix}-content`)).toBeNull();
        });

        it('onError 返回 false 时保留图片', () => {
            const { container } = render(<Avatar src={src} onError={() => false} />);
            fireEvent.error(container.querySelector('img'));
            expect(container.querySelector('img')).toHaveAttribute('src', src);
            expect(getAvatar()).toHaveClass(`${avartarPrefix}-img`);
        });

        it('加载失败后 src 变化时重新显示图片', async () => {
            // jsdom loads no images; this one reports success asynchronously
            class LoadingImage {
                onload?: () => void;
                set src(_value) {
                    setTimeout(() => this.onload?.());
                }
            }
            vi.stubGlobal('Image', LoadingImage);
            try {
                const other = `${src}?v=2`;
                const { container, rerender } = render(<Avatar src={src}>B</Avatar>);
                fireEvent.error(container.querySelector('img'));
                expect(container.querySelector('img')).toBeNull();
                rerender(<Avatar src={other}>B</Avatar>);
                await waitFor(() => expect(container.querySelector('img')).toHaveAttribute('src', other));
                expect(getAvatar()).toHaveClass(`${avartarPrefix}-img`);
            } finally {
                vi.unstubAllGlobals();
            }
        });

        describe('文字缩放', () => {
            let descriptor;
            beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
                Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
                    configurable: true,
                    get() {
                        if (this.classList.contains(`${avartarPrefix}-content`)) {
                            return this.textContent.length * 10;
                        }
                        return this.classList.contains(avartarPrefix) ? 40 : 0;
                    },
                });
            });
            afterEach(() => {
                Object.defineProperty(HTMLElement.prototype, 'offsetWidth', descriptor);
            });
            const content = () => document.querySelector(`.${avartarPrefix}-content`);

            it('文字宽度超出头像减去两侧 gap 后会被缩小', () => {
                render(<Avatar>Semi</Avatar>);
                expect(content()).toHaveStyle({ transform: `scale(${34 / 40})` });
            });

            it('字符串 children 变化时重新测量', () => {
                const { rerender } = render(<Avatar gap={5}>Semi Design</Avatar>);
                expect(content()).toHaveStyle({ transform: `scale(${30 / 110})` });
                rerender(<Avatar gap={5}>AB</Avatar>);
                expect(content()).toHaveStyle({ transform: 'scale(1)' });
            });

            it('gap 占满整个宽度时 scale 保持为 1', () => {
                render(<Avatar gap={20}>Semi</Avatar>);
                expect(content()).toHaveStyle({ transform: 'scale(1)' });
            });

            it('测量图片失败后显示的文字', () => {
                const { container } = render(<Avatar src={src}>Semi</Avatar>);
                fireEvent.error(container.querySelector('img'));
                expect(content()).toHaveStyle({ transform: `scale(${34 / 40})` });
            });

            it('StrictMode 下测量文字', () => {
                render(
                    <StrictMode>
                        <Avatar>Semi</Avatar>
                    </StrictMode>
                );
                expect(content()).toHaveStyle({ transform: `scale(${34 / 40})` });
            });
        });

        it('通过 style 设置自定义尺寸', () => {
            render(
                <Avatar style={{ margin: 4 }} size="56px">
                    U
                </Avatar>
            );
            expect(getAvatar()).toHaveStyle({ width: '56px', height: '56px', margin: '4px' });
        });

        it('默认为灰色中号圆形', () => {
            render(<Avatar>U</Avatar>);
            expect(getAvatar()).toHaveClass(`${avartarPrefix}-grey`, `${avartarPrefix}-medium`, `${avartarPrefix}-circle`);
            expect(getAvatar()).not.toHaveAttribute('style');
        });

        it('将其他属性透传到头像元素', () => {
            render(
                <Avatar id="a1" data-testid="avatar" aria-describedby="desc" role="note" topSlot={{ text: 'x' }}>
                    U
                </Avatar>
            );
            const avatar = screen.getByTestId('avatar');
            expect(avatar).toBe(getAvatar());
            expect(avatar).toHaveAttribute('aria-describedby', 'desc');
            expect(avatar).toHaveAttribute('id', 'a1');
            expect(avatar).toHaveAttribute('role', 'note');
        });

        it('仅在可点击时支持键盘操作', () => {
            const onClick = vi.fn<React.MouseEventHandler>();
            const { rerender } = render(<Avatar>U</Avatar>);
            const label = () => screen.getByRole(clickable ? 'button' : 'img');
            let clickable = false;
            expect(label()).toHaveAccessibleName('U');
            expect(label()).not.toHaveAttribute('tabindex');

            rerender(<Avatar onClick={onClick}>U</Avatar>);
            clickable = true;
            expect(label()).toHaveAccessibleName('U');
            expect(label()).toHaveAttribute('tabindex', '0');
            expect(label()).toHaveClass(`${avartarPrefix}-no-focus-visible`);
            fireEvent.keyDown(label(), { key: 'Enter' });
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick.mock.calls[0][0].type).toBe('click');
            fireEvent.keyDown(label(), { key: 'a' });
            expect(onClick).toHaveBeenCalledTimes(1);

            label().focus();
            expect(label()).toHaveFocus();
            fireEvent.keyDown(label(), { key: 'Escape' });
            expect(label()).toHaveFocus();
        });

        it('可点击头像是 button，按 Space 调用 onClick 且不滚动页面', () => {
            const onClick = vi.fn<React.MouseEventHandler>();
            render(<Avatar onClick={onClick}>U</Avatar>);
            const button = screen.getByRole('button');
            const notPrevented = fireEvent.keyDown(button, { key: ' ' });
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(notPrevented).toBe(false);
        });

        it.each([
            ['text', { children: 'U' }],
            ['image', { src, alt: 'Bob' }],
        ])('Tooltip 中可点击的 %s 头像只有一个 Tab 停靠点，并带有注入的属性', async (_, props) => {
            const { container } = render(
                <Tooltip content="tip">
                    <Avatar onClick={() => {}} {...props} />
                </Tooltip>
            );
            const stops = container.querySelectorAll('[tabindex="0"]');
            expect(stops).toHaveLength(1);
            expect(stops[0]).toBe(screen.getByRole('button'));
            await userEvent.tab();
            await waitFor(() => expect(stops[0]).toHaveAccessibleDescription('tip'));
            expect(getAvatar()).not.toHaveAttribute('tabindex');
            expect(getAvatar()).not.toHaveAttribute('aria-describedby');
        });

        it('Tooltip 中不可点击的头像以根元素作为 Tab 停靠点', () => {
            const { container } = render(
                <Tooltip content="tip">
                    <Avatar>U</Avatar>
                </Tooltip>
            );
            expect(Array.from(container.querySelectorAll('[tabindex="0"]'))).toEqual([getAvatar()]);
        });

        it('可点击图片可获得焦点，并以 alt 作为名称', () => {
            const onClick = vi.fn<React.MouseEventHandler>();
            render(<Avatar alt="Bob" src={src} onClick={onClick} />);
            const img = screen.getByRole('button', { name: 'Bob' });
            expect(img).toHaveAttribute('tabindex', '0');
            fireEvent.keyDown(img, { key: 'Enter' });
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('可点击的元素 children 头像是 button，可用键盘操作', () => {
            const onClick = vi.fn<React.MouseEventHandler>();
            render(
                <Avatar aria-label="user" onClick={onClick}>
                    <i />
                </Avatar>
            );
            const button = screen.getByRole('button', { name: 'user' });
            expect(button).toHaveAttribute('tabindex', '0');
            expect(getAvatar()).not.toHaveAttribute('tabindex');
            fireEvent.keyDown(button, { key: 'Enter' });
            fireEvent.keyDown(button, { key: ' ' });
            expect(onClick).toHaveBeenCalledTimes(2);
        });

        it('将鼠标事件传给回调', async () => {
            const onClick = vi.fn<React.MouseEventHandler>();
            const onMouseEnter = vi.fn<React.MouseEventHandler>();
            const onMouseLeave = vi.fn<React.MouseEventHandler>();
            render(
                <Avatar onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                    U
                </Avatar>
            );
            await userEvent.hover(getAvatar());
            await userEvent.unhover(getAvatar());
            fireEvent.click(getAvatar());
            expect(onMouseEnter).toHaveBeenCalledTimes(1);
            expect(onMouseEnter.mock.calls[0][0].type).toBe('mouseenter');
            expect(onMouseLeave).toHaveBeenCalledTimes(1);
            expect(onMouseLeave.mock.calls[0][0].type).toBe('mouseleave');
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick.mock.calls[0][0].type).toBe('click');
        });

        it('onMouseEnter、onMouseLeave 同步调用，currentTarget 是头像元素', async () => {
            const seen: Array<EventTarget | null> = [];
            const record = (event: React.MouseEvent) => seen.push(event.currentTarget);
            render(
                <Avatar onMouseEnter={record} onMouseLeave={record}>
                    U
                </Avatar>
            );
            await userEvent.hover(getAvatar());
            await userEvent.unhover(getAvatar());
            expect(seen).toEqual([getAvatar(), getAvatar()]);
        });

        it('悬停期间 hoverMask 变化会更新遮罩', async () => {
            const { container, rerender } = render(<Avatar hoverMask={<b>one</b>}>U</Avatar>);
            await userEvent.hover(getAvatar());
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toHaveTextContent(/^one$/);
            rerender(<Avatar hoverMask={<b>two</b>}>U</Avatar>);
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toHaveTextContent(/^two$/);
        });

        it('使用 slots 时悬停遮罩覆盖在外层容器上', async () => {
            const { container } = render(<Avatar border bottomSlot={{ text: 'live' }} hoverMask={<b>mask</b>} />);
            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass(`${avartarPrefix}-wrapper`);
            await userEvent.hover(wrapper);
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toHaveTextContent(/^mask$/);
            await userEvent.unhover(wrapper);
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toBeNull();
        });

        it('仅预设尺寸的圆形头像渲染 topSlot', () => {
            const { container, rerender } = render(
                <Avatar contentMotion size="large" topSlot={{ text: 'LIVE', textColor: 'red', className: 'top' }}>
                    U
                </Avatar>
            );
            const top = container.querySelector('.top');
            expect(top).toHaveClass(`${avartarPrefix}-top_slot-wrapper`, `${avartarPrefix}-animated`);
            expect(container.querySelector(`.${avartarPrefix}-top_slot-bg-large`)).toBeInTheDocument();
            expect(container.querySelector(`.${avartarPrefix}-top_slot-content-large`)).toHaveStyle({
                color: 'rgb(255, 0, 0)',
            });
            expect(getAvatar()).toHaveClass(`${avartarPrefix}-animated`);

            rerender(
                <Avatar shape="square" size="large" topSlot={{ text: 'LIVE' }}>
                    U
                </Avatar>
            );
            expect(container.querySelector(`.${avartarPrefix}-top_slot-wrapper`)).toBeNull();
            rerender(
                <Avatar size="extra-extra-small" topSlot={{ text: 'LIVE' }}>
                    U
                </Avatar>
            );
            expect(container.querySelector(`.${avartarPrefix}-top_slot-wrapper`)).toBeNull();
            rerender(<Avatar topSlot={{ text: 'LIVE', render: () => <em className="own-top" /> }}>U</Avatar>);
            expect(container.querySelector('.own-top')).toBeInTheDocument();
        });

        it('渲染 bottomSlot', () => {
            const { container, rerender } = render(
                <Avatar
                    bottomSlot={{
                        text: 'NEW',
                        shape: 'square',
                        bgColor: 'blue',
                        textColor: 'red',
                        className: 'bottom',
                    }}
                    size="small"
                >
                    U
                </Avatar>
            );
            const content = container.querySelector('.bottom');
            expect(content).toHaveClass(`${avartarPrefix}-bottom_slot-shape_square`, `${avartarPrefix}-bottom_slot-shape_square-small`);
            expect(content).toHaveStyle({ color: 'rgb(255, 0, 0)', backgroundColor: 'rgb(0, 0, 255)' });
            expect(content).toHaveTextContent(/^NEW$/);
            expect(content.parentElement).toHaveClass(`${avartarPrefix}-bottom_slot`);

            rerender(<Avatar bottomSlot={{ text: 'NEW', render: () => <em className="own-bottom" /> }}>U</Avatar>);
            expect(container.querySelector('.own-bottom')).toBeInTheDocument();
            expect(container.querySelector(`.${avartarPrefix}-bottom_slot`)).toBeNull();
        });

        it('带边框的头像，使用方 style 只作用在外层容器上', () => {
            const { container } = render(
                <Avatar style={{ margin: 4 }} border>
                    U
                </Avatar>
            );
            expect(container.firstChild).toHaveStyle({ margin: '4px' });
            expect((container.firstChild as HTMLElement).firstElementChild).not.toHaveStyle({ margin: '4px' });
        });

        it('绘制边框，并使用 motion 做动画', () => {
            const { container, rerender } = render(
                <Avatar style={{ margin: 4 }} border>
                    U
                </Avatar>
            );
            const borders = () => container.querySelectorAll(`.${avartarPrefix}-additionalBorder`);
            expect(borders()).toHaveLength(1);
            expect(borders()[0]).toHaveClass(`${avartarPrefix}-additionalBorder-medium`, `${avartarPrefix}-circle`);
            expect(container.firstChild).toHaveStyle({ margin: '4px' });
            expect(getAvatar()).not.toHaveAttribute('style');

            rerender(<Avatar border={{ color: 'red', motion: true }}>U</Avatar>);
            expect(borders()).toHaveLength(2);
            expect(borders()[1]).toHaveClass(`${avartarPrefix}-additionalBorder-animated`);
            borders().forEach((border) => expect(border).toHaveStyle({ borderColor: 'rgb(255, 0, 0)' }));
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
            semiGlobal.config.overrideDefaultProps = { Avatar: { shape: 'square', color: 'red' } };
            try {
                const { rerender } = render(<Avatar>U</Avatar>);
                expect(getAvatar()).toHaveClass(`${avartarPrefix}-square`, `${avartarPrefix}-red`);
                rerender(<Avatar shape="circle">U</Avatar>);
                expect(getAvatar()).toHaveClass(`${avartarPrefix}-circle`, `${avartarPrefix}-red`);
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });
    });

    describe('函数组件', () => {
        it('ref 指向头像元素，包括 slot 包裹层内的情况', () => {
            const ref = React.createRef<HTMLSpanElement>();
            const { rerender } = render(<Avatar ref={ref}>U</Avatar>);
            expect(ref.current).toBe(getAvatar());
            rerender(
                <Avatar ref={ref} border>
                    U
                </Avatar>
            );
            expect(ref.current).toBe(getAvatar());
        });

        it('新 src 再次加载失败时重新调用 onError', () => {
            const onError = vi.fn<React.MouseEventHandler>();
            const { container, rerender } = render(
                <Avatar src={src} onError={onError}>
                    B
                </Avatar>
            );
            fireEvent.error(container.querySelector('img'));
            rerender(
                <Avatar src={`${src}?v=2`} onError={onError}>
                    B
                </Avatar>
            );
            fireEvent.error(container.querySelector('img'));
            expect(onError).toHaveBeenCalledTimes(2);
            expect(container.querySelector('img')).toBeNull();
        });
    });
});

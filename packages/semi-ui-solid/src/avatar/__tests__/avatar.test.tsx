import { createSignal, For, type JSX } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Avatar from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';
import type { AvatarColor, AvatarProps } from '../interface';
import TopSlotSvg from '../top-slot-svg';

type MouseHandler = (event: MouseEvent) => void;

const avatarPrefix = `${BASE_CLASS_PREFIX}-avatar`;
const src = 'https://example.com/dy.png';

const getAvatars = () => [...document.querySelectorAll<HTMLElement>(`.${avatarPrefix}`)];
const getAvatar = () => document.querySelector(`.${avatarPrefix}`) as HTMLElement;

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Avatar', () => {
    it('topSlot、bottomSlot 只有 text 必填', () => {
        expectTypeOf<{ text: string }>().toExtend<NonNullable<AvatarProps['topSlot']>>();
        expectTypeOf<{ text: string }>().toExtend<NonNullable<AvatarProps['bottomSlot']>>();
        expectTypeOf<{ text?: undefined }>().not.toExtend<NonNullable<AvatarProps['topSlot']>>();
    });

    // A node in the data would be created wherever the object is read; other content comes from a function
    it('槽位 text 只接受文字或渲染函数', () => {
        expectTypeOf<{ text: () => JSX.Element }>().toExtend<NonNullable<AvatarProps['bottomSlot']>>();
        expectTypeOf<{ text: HTMLElement }>().not.toExtend<NonNullable<AvatarProps['topSlot']>>();
        expectTypeOf<{ text: HTMLElement }>().not.toExtend<NonNullable<AvatarProps['bottomSlot']>>();
    });

    it('槽位 text 的渲染函数只在槽位显示时调用', () => {
        const [size, setSize] = createSignal('40px');
        const text = vi.fn<() => JSX.Element>(() => <b class="badge">NEW</b>);
        render(() => <Avatar size={size()} bottomSlot={{ text }} />);
        expect(text).not.toHaveBeenCalled();
        setSize('small');
        expect(text).toHaveBeenCalledTimes(1);
        expect(document.querySelector(`.${avatarPrefix}-bottom_slot .badge`)).toHaveTextContent('NEW');
    });

    it('hoverMask 为 0 时悬停后照常渲染', async () => {
        const { container } = render(() => <Avatar hoverMask={0} />);
        await userEvent.hover(getAvatar());
        expect(container.querySelector(`.${avatarPrefix}-hover`)).toHaveTextContent(/^0$/);
    });

    it('hoverMask 在悬停时才创建', async () => {
        const read = vi.fn<() => JSX.Element>(() => <b>mask</b>);
        render(() => <Avatar hoverMask={read()}>U</Avatar>);
        expect(read).not.toHaveBeenCalled();
        await userEvent.hover(getAvatar());
        expect(read).toHaveBeenCalledTimes(1);
    });

    it('单独使用时不是列表项', () => {
        render(() => <Avatar>U</Avatar>);
        expect(getAvatar()).not.toHaveAttribute('role');
        expect(screen.queryByRole('listitem')).toBeNull();
    });

    it('size', () => {
        render(() => (
            <div>
                <Avatar style={{ margin: '4px' }} size="extra-extra-small">
                    U
                </Avatar>
                <Avatar style={{ margin: '4px' }} size="extra-small">
                    U
                </Avatar>
                <Avatar style={{ margin: '4px' }} size="small">
                    U
                </Avatar>
                <Avatar style={{ margin: '4px' }} size="default">
                    U
                </Avatar>
                <Avatar style={{ margin: '4px' }}>U</Avatar>
                <Avatar style={{ margin: '4px' }} size="large">
                    U
                </Avatar>
                <Avatar style={{ margin: '4px' }} size="extra-large">
                    U
                </Avatar>
            </div>
        ));
        const avatars = getAvatars();
        expect(avatars[1]).not.toHaveClass(`${avatarPrefix}-extra-extra-small`);
        expect(avatars[0]).toHaveClass(`${avatarPrefix}-extra-extra-small`);
        expect(avatars[1]).toHaveClass(`${avatarPrefix}-extra-small`);
        expect(avatars[2]).toHaveClass(`${avatarPrefix}-small`);
        expect(avatars[3]).toHaveClass(`${avatarPrefix}-default`);
        expect(avatars[4]).toHaveClass(`${avatarPrefix}-medium`);
        expect(avatars[5]).toHaveClass(`${avatarPrefix}-large`);
        expect(avatars[6]).toHaveClass(`${avatarPrefix}-extra-large`);
    });

    it('color', () => {
        const colors: AvatarColor[] = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow'];
        render(() => (
            <div>
                <For each={colors}>
                    {(color) => (
                        <Avatar style={{ margin: '4px' }} color={color}>
                            TJ
                        </Avatar>
                    )}
                </For>
            </div>
        ));
        const avatars = getAvatars();
        expect(avatars[1]).not.toHaveClass(`${avatarPrefix}-amber`);
        colors.forEach((color, index) => {
            expect(avatars[index]).toHaveClass(`${avatarPrefix}-${color}`);
        });
    });

    it('src', () => {
        render(() => <Avatar style={{ margin: '4px' }} src={src} />);
        expect(screen.getByRole('img')).toHaveAttribute('src', src);
        expect(getAvatar()).toHaveClass(`${avatarPrefix}-img`);
    });

    it('shape', () => {
        render(() => (
            <div>
                <Avatar style={{ margin: '4px' }}>U</Avatar>
                <Avatar style={{ margin: '4px' }} shape="square">
                    U
                </Avatar>
            </div>
        ));
        const avatars = getAvatars();
        expect(avatars[1]).not.toHaveClass(`${avatarPrefix}-circle`);
        expect(avatars[0]).toHaveClass(`${avatarPrefix}-circle`);
        expect(avatars[1]).toHaveClass(`${avatarPrefix}-square`);
    });

    it('class 与 style', () => {
        render(() => (
            <Avatar class="test-avatar" style={{ color: 'red' }}>
                A
            </Avatar>
        ));
        expect(getAvatar()).toHaveClass('test-avatar');
        expect(getAvatar()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('style 为字符串时与自定义尺寸合并', () => {
        const style = 'margin: 4px';
        render(() => (
            <Avatar style={style} size="56px">
                U
            </Avatar>
        ));
        expect(getAvatar()).toHaveStyle({ width: '56px', height: '56px', margin: '4px' });
    });

    it('gap 与 scale', () => {
        const { container } = render(() => <Avatar gap={10}>Semi</Avatar>);
        // jsdom has no text layout, so the text width is 0 and the content keeps its initial scale
        expect(container.querySelector(`.${avatarPrefix}-content`)).toHaveStyle({ transform: 'scale(1)' });
    });

    it('onError', () => {
        const spyOnError = vi.fn<NonNullable<AvatarProps['onError']>>();
        const { container } = render(() => (
            <Avatar src={src} onError={spyOnError}>
                fallback
            </Avatar>
        ));
        fireEvent.error(container.querySelector('img') as Element);
        expect(spyOnError).toHaveBeenCalled();
        expect(container.querySelector('img')).toBeNull();
        expect(getAvatar()).not.toHaveClass(`${avatarPrefix}-img`);
        expect(screen.getByRole('img', { name: 'fallback' })).toHaveTextContent(/^fallback$/);
    });

    it('图片每次出错时 onError 调用一次', () => {
        const spyOnError = vi.fn<NonNullable<AvatarProps['onError']>>();
        const { container } = render(() => <Avatar src={src} onError={spyOnError} />);
        fireEvent.error(container.querySelector('img') as Element);
        expect(spyOnError).toHaveBeenCalledTimes(1);
    });

    it('使用方展开信号对象时，无关属性变化不让出错的图片重新出现', () => {
        const [p, setP] = createSignal<AvatarProps>({ src, alt: 'pic' });
        const { container } = render(() => <Avatar {...p()} />);
        fireEvent.error(container.querySelector('img') as Element);
        expect(container.querySelector('img')).toBeNull();
        setP((prev) => ({ ...prev, class: 'other' }));
        expect(container.querySelector('img')).toBeNull();
    });

    it('onClick', async () => {
        const spyOnClick = vi.fn<MouseHandler>();
        render(() => <Avatar onClick={spyOnClick} />);
        await userEvent.click(getAvatar());
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('onClick，topSlot', async () => {
        const spyOnClick = vi.fn<MouseHandler>();
        render(() => <Avatar topSlot={{ text: '直播' }} onClick={spyOnClick} />);
        expect(screen.getByText('直播')).toBeInTheDocument();
        await userEvent.click(getAvatar());
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('onMouseEnter', async () => {
        const spyOnMouseEnter = vi.fn<MouseHandler>();
        render(() => <Avatar onMouseEnter={spyOnMouseEnter} />);
        await userEvent.hover(getAvatar());
        expect(spyOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('onMouseEnter，topSlot', async () => {
        const spyOnMouseEnter = vi.fn<MouseHandler>();
        const { container } = render(() => <Avatar topSlot={{ text: '直播' }} onMouseEnter={spyOnMouseEnter} />);
        await userEvent.hover(container.firstChild as HTMLElement);
        expect(spyOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('onMouseLeave', async () => {
        const spyOnMouseLeave = vi.fn<MouseHandler>();
        render(() => <Avatar onMouseLeave={spyOnMouseLeave} />);
        await userEvent.hover(getAvatar());
        await userEvent.unhover(getAvatar());
        expect(spyOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('onMouseLeave，topSlot', async () => {
        const spyOnMouseLeave = vi.fn<MouseHandler>();
        const { container } = render(() => <Avatar topSlot={{ text: '直播' }} onMouseLeave={spyOnMouseLeave} />);
        const wrapper = container.firstChild as HTMLElement;
        await userEvent.hover(wrapper);
        await userEvent.unhover(wrapper);
        expect(spyOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('带 topSlot 悬停头像时 onMouseEnter 与 onMouseLeave 各只触发一次', async () => {
        const spyOnMouseEnter = vi.fn<MouseHandler>();
        const spyOnMouseLeave = vi.fn<MouseHandler>();
        render(() => <Avatar topSlot={{ text: '直播' }} onMouseEnter={spyOnMouseEnter} onMouseLeave={spyOnMouseLeave} />);
        await userEvent.hover(getAvatar());
        await userEvent.unhover(getAvatar());
        expect(spyOnMouseEnter).toHaveBeenCalledTimes(1);
        expect(spyOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('hoverMask', async () => {
        const { container } = render(() => <Avatar hoverMask="asd" />);
        expect(container.querySelector(`.${avatarPrefix}-hover`)).toBeNull();
        await userEvent.hover(getAvatar());
        expect(container.querySelector(`.${avatarPrefix}-hover`)).toHaveTextContent(/^asd$/);
        await userEvent.unhover(getAvatar());
        expect(container.querySelector(`.${avatarPrefix}-hover`)).toBeNull();
    });

    it('topSlot 渐变 id 每个实例唯一', () => {
        const { container } = render(() => <TopSlotSvg gradientEnd="blue" gradientStart="red" />);
        const gradientId = (container.querySelector('linearGradient') as Element).id;
        expect(container.querySelector('path')).toHaveAttribute('fill', `url(#${gradientId})`);

        const { container: other } = render(() => <TopSlotSvg gradientEnd="blue" gradientStart="red" />);
        const otherIds = [...other.querySelectorAll('[id]')].map((element) => element.id);
        const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
        expect(otherIds.filter((id) => ids.includes(id))).toEqual([]);
    });

    describe('基线', () => {
        it('渲染带 alt 与 imgAttr 的图片', () => {
            render(() => <Avatar alt="Bob" imgAttr={{ draggable: false, 'data-img': 'x' } as AvatarProps['imgAttr']} src={src} />);
            const img = screen.getByRole('img', { name: 'Bob' });
            expect(img).toHaveAttribute('src', src);
            expect(img).toHaveAttribute('draggable', 'false');
            expect(img).toHaveAttribute('data-img', 'x');
            expect(img).not.toHaveAttribute('tabindex');
        });

        it('imgAttr.class 与可点击头像的焦点类合并', () => {
            render(() => <Avatar alt="Bob" imgAttr={{ class: 'my-img' }} src={src} onClick={() => {}} />);
            expect(screen.getByRole('button', { name: 'Bob' })).toHaveClass('my-img', `${avatarPrefix}-no-focus-visible`);
        });

        it('imgAttr.onError 与内置回退都执行', () => {
            const onImgError = vi.fn<(event: Event) => void>();
            const { container } = render(() => (
                <Avatar imgAttr={{ onError: onImgError }} src={src}>
                    B
                </Avatar>
            ));
            fireEvent.error(container.querySelector('img') as Element);
            expect(onImgError).toHaveBeenCalledTimes(1);
            expect(container.querySelector('img')).toBeNull();
        });

        it('数字与多段文本 children 作为文字，带名称与缩放容器', () => {
            const [alt, setAlt] = createSignal<string>();
            const { container, unmount } = render(() => <Avatar size="large">{1}</Avatar>);
            expect(screen.getByRole('img')).toHaveAttribute('aria-label', '1');
            expect(container.querySelector(`.${avatarPrefix}-content`)).not.toBeNull();
            unmount();

            render(() => <Avatar alt={alt()}>A{1}</Avatar>);
            expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'A1');
            setAlt('x');
            expect(screen.getByRole('img', { name: 'x' })).toHaveTextContent('A1');
        });

        it('图片加载失败时回退为以 alt 命名的字符串 children', () => {
            const { container } = render(() => (
                <Avatar alt="Bob" color="red" src={src}>
                    B
                </Avatar>
            ));
            expect(getAvatar()).not.toHaveClass(`${avatarPrefix}-red`);
            fireEvent.error(container.querySelector('img') as Element);
            expect(container.querySelector('img')).toBeNull();
            expect(screen.getByRole('img', { name: 'Bob' })).toHaveTextContent(/^B$/);
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-red`);
        });

        it('回退时原样渲染非字符串 children', () => {
            const { container } = render(() => (
                <Avatar src={src}>
                    <i class="custom-icon" />
                </Avatar>
            ));
            fireEvent.error(container.querySelector('img') as Element);
            expect(getAvatar().querySelector('.custom-icon')).toBeInTheDocument();
            expect(container.querySelector(`.${avatarPrefix}-content`)).toBeNull();
        });

        it('onError 返回 false 时保留图片', () => {
            const { container } = render(() => <Avatar src={src} onError={() => false} />);
            fireEvent.error(container.querySelector('img') as Element);
            expect(container.querySelector('img')).toHaveAttribute('src', src);
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-img`);
        });

        it('加载失败后 src 变化时重新显示图片', () => {
            const other = `${src}?v=2`;
            const [current, setCurrent] = createSignal(src);
            const { container } = render(() => <Avatar src={current()}>B</Avatar>);
            fireEvent.error(container.querySelector('img') as Element);
            expect(container.querySelector('img')).toBeNull();
            setCurrent(other);
            expect(container.querySelector('img')).toHaveAttribute('src', other);
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-img`);
        });

        describe('文字缩放', () => {
            let descriptor: PropertyDescriptor | undefined;
            beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
                Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
                    configurable: true,
                    get(this: HTMLElement) {
                        if (this.classList.contains(`${avatarPrefix}-content`)) {
                            return (this.textContent?.length ?? 0) * 10;
                        }
                        return this.classList.contains(avatarPrefix) ? 40 : 0;
                    },
                });
            });
            afterEach(() => {
                if (descriptor) {
                    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', descriptor);
                }
            });
            const content = () => document.querySelector(`.${avatarPrefix}-content`);

            it('文字宽度超出头像减去两侧 gap 后会被缩小', () => {
                render(() => <Avatar>Semi</Avatar>);
                expect(content()).toHaveStyle({ transform: `scale(${34 / 40})` });
            });

            it('字符串 children 变化时重新测量', () => {
                const [label, setLabel] = createSignal('Semi Design');
                render(() => <Avatar gap={5}>{label()}</Avatar>);
                expect(content()).toHaveStyle({ transform: `scale(${30 / 110})` });
                setLabel('AB');
                expect(content()).toHaveStyle({ transform: 'scale(1)' });
            });

            it('gap 占满整个宽度时 scale 保持为 1', () => {
                render(() => <Avatar gap={20}>Semi</Avatar>);
                expect(content()).toHaveStyle({ transform: 'scale(1)' });
            });

            it('测量图片失败后显示的文字', () => {
                const { container } = render(() => <Avatar src={src}>Semi</Avatar>);
                fireEvent.error(container.querySelector('img') as Element);
                expect(content()).toHaveStyle({ transform: `scale(${34 / 40})` });
            });
        });

        it('通过 style 设置自定义尺寸', () => {
            render(() => (
                <Avatar style={{ margin: '4px' }} size="56px">
                    U
                </Avatar>
            ));
            expect(getAvatar()).toHaveStyle({ width: '56px', height: '56px', margin: '4px' });
        });

        it('默认为灰色中号圆形', () => {
            render(() => <Avatar>U</Avatar>);
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-grey`, `${avatarPrefix}-medium`, `${avatarPrefix}-circle`);
            expect(getAvatar()).not.toHaveAttribute('style');
        });

        it('将其他属性透传到头像元素', () => {
            render(() => (
                <Avatar id="a1" data-testid="avatar" aria-describedby="desc" role="note" topSlot={{ text: 'x' }}>
                    U
                </Avatar>
            ));
            const avatar = screen.getByTestId('avatar');
            expect(avatar).toBe(getAvatar());
            expect(avatar).toHaveAttribute('aria-describedby', 'desc');
            expect(avatar).toHaveAttribute('id', 'a1');
            expect(avatar).toHaveAttribute('role', 'note');
        });

        it('仅在可点击时支持键盘操作', () => {
            const onClick = vi.fn<MouseHandler>();
            const [handler, setHandler] = createSignal<MouseHandler | undefined>();
            render(() => <Avatar onClick={handler()}>U</Avatar>);
            expect(screen.getByRole('img')).toHaveAccessibleName('U');
            expect(screen.getByRole('img')).not.toHaveAttribute('tabindex');

            setHandler(() => onClick);
            const label = () => screen.getByRole('button');
            expect(label()).toHaveAccessibleName('U');
            expect(label()).toHaveAttribute('tabindex', '0');
            expect(label()).toHaveClass(`${avatarPrefix}-no-focus-visible`);
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
            const onClick = vi.fn<MouseHandler>();
            render(() => <Avatar onClick={onClick}>U</Avatar>);
            const notPrevented = fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(notPrevented).toBe(false);
        });

        it.each([
            ['text', { children: 'U' }],
            ['image', { src, alt: 'Bob' }],
        ])('Tooltip 中可点击的 %s 头像只有一个 Tab 停靠点，并带有注入的属性', async (_, props) => {
            const { container } = render(() => <Tooltip content="tip">{(trigger) => <Avatar onClick={() => {}} {...props} {...trigger()} />}</Tooltip>);
            const stops = container.querySelectorAll('[tabindex="0"]');
            expect(stops).toHaveLength(1);
            expect(stops[0]).toBe(screen.getByRole('button'));
            await userEvent.tab();
            await waitFor(() => expect(stops[0]).toHaveAccessibleDescription('tip'));
            expect(getAvatar()).not.toHaveAttribute('tabindex');
            expect(getAvatar()).not.toHaveAttribute('aria-describedby');
        });

        it('Tooltip 中不可点击的头像以根元素作为 Tab 停靠点', () => {
            const { container } = render(() => <Tooltip content="tip">{(trigger) => <Avatar {...trigger()}>U</Avatar>}</Tooltip>);
            expect(Array.from(container.querySelectorAll('[tabindex="0"]'))).toEqual([getAvatar()]);
        });

        it('可点击图片可获得焦点，并以 alt 作为名称', () => {
            const onClick = vi.fn<MouseHandler>();
            render(() => <Avatar alt="Bob" src={src} onClick={onClick} />);
            const img = screen.getByRole('button', { name: 'Bob' });
            expect(img).toHaveAttribute('tabindex', '0');
            fireEvent.keyDown(img, { key: 'Enter' });
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('可点击的元素 children 头像是 button，可用键盘操作', () => {
            const onClick = vi.fn<MouseHandler>();
            render(() => (
                <Avatar aria-label="user" onClick={onClick}>
                    <i />
                </Avatar>
            ));
            const button = screen.getByRole('button', { name: 'user' });
            expect(button).toHaveAttribute('tabindex', '0');
            expect(getAvatar()).not.toHaveAttribute('tabindex');
            fireEvent.keyDown(button, { key: 'Enter' });
            fireEvent.keyDown(button, { key: ' ' });
            expect(onClick).toHaveBeenCalledTimes(2);
        });

        it('元素 children 在可点击状态切换后仍留在头像内', () => {
            const [handler, setHandler] = createSignal<MouseHandler | undefined>();
            render(() => (
                <Avatar aria-label="user" onClick={handler()}>
                    <i class="custom-icon" />
                </Avatar>
            ));
            setHandler(() => () => {});
            expect(screen.getByRole('button', { name: 'user' }).querySelector('.custom-icon')).toBeInTheDocument();
            setHandler(undefined);
            expect(getAvatar().querySelector('.custom-icon')).toBeInTheDocument();
        });

        it('将鼠标事件传给回调', async () => {
            const onClick = vi.fn<MouseHandler>();
            const onMouseEnter = vi.fn<MouseHandler>();
            const onMouseLeave = vi.fn<MouseHandler>();
            render(() => (
                <Avatar onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                    U
                </Avatar>
            ));
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
            const record = (event: Event) => seen.push(event.currentTarget);
            render(() => (
                <Avatar onMouseEnter={record} onMouseLeave={record}>
                    U
                </Avatar>
            ));
            await userEvent.hover(getAvatar());
            await userEvent.unhover(getAvatar());
            expect(seen).toEqual([getAvatar(), getAvatar()]);
        });

        it('悬停期间 hoverMask 变化会更新遮罩', async () => {
            const [mask, setMask] = createSignal<JSX.Element>('one');
            const { container } = render(() => <Avatar hoverMask={mask()}>U</Avatar>);
            await userEvent.hover(getAvatar());
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toHaveTextContent(/^one$/);
            setMask('two');
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toHaveTextContent(/^two$/);
        });

        it('使用 slots 时悬停遮罩覆盖在外层容器上', async () => {
            const { container } = render(() => <Avatar border bottomSlot={{ text: 'live' }} hoverMask={<b>mask</b>} />);
            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass(`${avatarPrefix}-wrapper`);
            await userEvent.hover(wrapper);
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toHaveTextContent(/^mask$/);
            await userEvent.unhover(wrapper);
            expect(container.querySelector('[x-semi-prop="hoverContent"]')).toBeNull();
        });

        it('仅预设尺寸的圆形头像渲染 topSlot', () => {
            const [props, setProps] = createSignal<AvatarProps>({ contentMotion: true, size: 'large', topSlot: { text: 'LIVE', textColor: 'red', class: 'top' } });
            const { container } = render(() => <Avatar {...props()}>U</Avatar>);
            const top = container.querySelector('.top');
            expect(top).toHaveClass(`${avatarPrefix}-top_slot-wrapper`, `${avatarPrefix}-animated`);
            expect(container.querySelector(`.${avatarPrefix}-top_slot-bg-large`)).toBeInTheDocument();
            expect(container.querySelector(`.${avatarPrefix}-top_slot-content-large`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-animated`);

            setProps({ shape: 'square', size: 'large', topSlot: { text: 'LIVE' } });
            expect(container.querySelector(`.${avatarPrefix}-top_slot-wrapper`)).toBeNull();
            setProps({ size: 'extra-extra-small', topSlot: { text: 'LIVE' } });
            expect(container.querySelector(`.${avatarPrefix}-top_slot-wrapper`)).toBeNull();
            setProps({ topSlot: { text: 'LIVE', render: () => <em class="own-top" /> } });
            expect(container.querySelector('.own-top')).toBeInTheDocument();
            setProps({ topSlot: { text: 'LIVE', render: () => <em class="other-top" /> } });
            expect(container.querySelector('.own-top')).toBeNull();
            expect(container.querySelector('.other-top')).toBeInTheDocument();
        });

        it('渲染 bottomSlot', () => {
            const [props, setProps] = createSignal<AvatarProps>({ bottomSlot: { text: 'NEW', shape: 'square', bgColor: 'blue', textColor: 'red', class: 'bottom' }, size: 'small' });
            const { container } = render(() => <Avatar {...props()}>U</Avatar>);
            const content = container.querySelector('.bottom') as HTMLElement;
            expect(content).toHaveClass(`${avatarPrefix}-bottom_slot-shape_square`, `${avatarPrefix}-bottom_slot-shape_square-small`);
            expect(content).toHaveStyle({ color: 'rgb(255, 0, 0)', backgroundColor: 'rgb(0, 0, 255)' });
            expect(content).toHaveTextContent(/^NEW$/);
            expect(content.parentElement).toHaveClass(`${avatarPrefix}-bottom_slot`);

            setProps({ bottomSlot: { text: 'NEW', render: () => <em class="own-bottom" /> } });
            expect(container.querySelector('.own-bottom')).toBeInTheDocument();
            expect(container.querySelector(`.${avatarPrefix}-bottom_slot`)).toBeNull();
            setProps({ bottomSlot: { text: 'NEW', render: () => <em class="other-bottom" /> } });
            expect(container.querySelector('.own-bottom')).toBeNull();
            expect(container.querySelector('.other-bottom')).toBeInTheDocument();
        });

        it('带边框的头像，使用方 style 只作用在外层容器上', () => {
            const { container } = render(() => (
                <Avatar style={{ margin: '4px' }} border>
                    U
                </Avatar>
            ));
            expect(container.firstChild).toHaveStyle({ margin: '4px' });
            expect((container.firstChild as HTMLElement).firstElementChild).not.toHaveStyle({ margin: '4px' });
        });

        it('绘制边框，并使用 motion 做动画', () => {
            const [props, setProps] = createSignal<AvatarProps>({ style: { margin: '4px' }, border: true });
            const { container } = render(() => <Avatar {...props()}>U</Avatar>);
            const borders = () => container.querySelectorAll(`.${avatarPrefix}-additionalBorder`);
            expect(borders()).toHaveLength(1);
            expect(borders()[0]).toHaveClass(`${avatarPrefix}-additionalBorder-medium`, `${avatarPrefix}-circle`);
            expect(container.firstChild).toHaveStyle({ margin: '4px' });
            expect(getAvatar()).not.toHaveAttribute('style');

            setProps({ border: { color: 'red', motion: true } });
            expect(borders()).toHaveLength(2);
            expect(borders()[1]).toHaveClass(`${avatarPrefix}-additionalBorder-animated`);
            borders().forEach((border) => expect(border).toHaveStyle({ borderColor: 'rgb(255, 0, 0)' }));
        });

        it('border、topSlot 可在运行时增减', () => {
            const [props, setProps] = createSignal<AvatarProps>({});
            const { container } = render(() => <Avatar {...props()}>U</Avatar>);
            expect(container.querySelector(`.${avatarPrefix}-wrapper`)).toBeNull();
            setProps({ border: true });
            expect(container.querySelector(`.${avatarPrefix}-wrapper .${avatarPrefix}-additionalBorder`)).not.toBeNull();
            expect(getAvatars()).toHaveLength(1);
            setProps({});
            expect(container.querySelector(`.${avatarPrefix}-wrapper`)).toBeNull();
            expect(getAvatars()).toHaveLength(1);
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
            semiGlobal.config.overrideDefaultProps = { Avatar: { shape: 'square', color: 'red' } };
            const [shape, setShape] = createSignal<AvatarProps['shape']>();
            render(() => <Avatar shape={shape()}>U</Avatar>);
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-square`, `${avatarPrefix}-red`);
            setShape('circle');
            expect(getAvatar()).toHaveClass(`${avatarPrefix}-circle`, `${avatarPrefix}-red`);
        });
    });

    it('整体替换 props 时保留根节点与焦点', () => {
        const onClick = vi.fn<MouseHandler>();
        const [props, setProps] = createSignal<AvatarProps>({ onClick, children: 'AB', color: 'red' });
        render(() => <Avatar {...props()} />);
        const root = getAvatar();
        const button = screen.getByRole('button');
        button.focus();
        setProps({ onClick, children: 'AB', color: 'blue' });
        expect(getAvatar()).toBe(root);
        expect(root).toHaveClass(`${avatarPrefix}-blue`);
        expect(button).toHaveFocus();
    });

    describe('函数组件', () => {
        it('ref 指向头像元素，包括 slot 包裹层内的情况', () => {
            let ref: HTMLElement | undefined;
            const [border, setBorder] = createSignal(false);
            render(() => (
                <Avatar ref={(node) => (ref = node)} border={border()}>
                    U
                </Avatar>
            ));
            expect(ref).toBe(getAvatar());
            setBorder(true);
            expect(ref).toBe(getAvatar());
        });

        it('新 src 再次加载失败时重新调用 onError', () => {
            const onError = vi.fn<() => void>();
            const [current, setCurrent] = createSignal(src);
            const { container } = render(() => (
                <Avatar src={current()} onError={onError}>
                    B
                </Avatar>
            ));
            fireEvent.error(container.querySelector('img') as Element);
            setCurrent(`${src}?v=2`);
            fireEvent.error(container.querySelector('img') as Element);
            expect(onError).toHaveBeenCalledTimes(2);
            expect(container.querySelector('img')).toBeNull();
        });
    });
});

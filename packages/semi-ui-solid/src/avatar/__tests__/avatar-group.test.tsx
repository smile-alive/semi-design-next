import { createSignal, For, type JSX, Show } from 'solid-js';
import { fireEvent, render, screen, within } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Avatar, { AvatarGroup, type AvatarGroupProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';

const prefixCls = `${BASE_CLASS_PREFIX}-avatar`;

function Group(props: AvatarGroupProps) {
    return (
        <AvatarGroup {...props}>
            <Avatar color="red">LL</Avatar>
            <Avatar>CX</Avatar>
            <Avatar color="amber">RM</Avatar>
            <Avatar style={{ color: '#f56a00', 'background-color': '#fde3cf' }}>ZL</Avatar>
            <Avatar style={{ 'background-color': '#87d068' }}>YZ</Avatar>
        </AvatarGroup>
    );
}

function Wrap(props: { children: JSX.Element }) {
    return <>{props.children}</>;
}

const getAvatars = (container: HTMLElement) => container.querySelectorAll<HTMLElement>(`.${prefixCls}`);
const getFirstAvatarOfGroups = (container: HTMLElement) => Array.from(container.querySelectorAll(`.${prefixCls}-group`), (group) => group.querySelector(`.${prefixCls}`));

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('AvatarGroup', () => {
    it('overlapFrom', () => {
        const [overlapFrom, setOverlapFrom] = createSignal<AvatarGroupProps['overlapFrom']>();
        const { container } = render(() => <Group overlapFrom={overlapFrom()} />);
        getAvatars(container).forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${prefixCls}-item-start-${index}`);
            expect(avatar).not.toHaveClass(`${prefixCls}-item-end-${index}`);
        });
        setOverlapFrom('end');
        getAvatars(container).forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${prefixCls}-item-end-${index}`);
            expect(avatar).not.toHaveClass(`${prefixCls}-item-start-${index}`);
        });
    });

    it('头像渲染为列表项', () => {
        const { container } = render(() => <Group maxCount={3} />);
        const items = within(screen.getByRole('list')).getAllByRole('listitem');
        expect(items).toEqual([...getAvatars(container)]);
        expect(items).toHaveLength(4);
    });

    // renderMore often wraps the avatar (e.g. in a Popover) in a component that does not forward props
    it('被包裹的 renderMore 头像仍是列表项', () => {
        render(() => (
            <Group
                maxCount={3}
                renderMore={(restNumber) => (
                    <Wrap>
                        <Avatar>{`+${restNumber}`}</Avatar>
                    </Wrap>
                )}
            />
        ));
        const items = within(screen.getByRole('list')).getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(items[3]).toHaveTextContent('+2');
    });

    it('maxCount', () => {
        const { container } = render(() => <Group maxCount={3} />);
        const avatars = getAvatars(container);
        expect(avatars).toHaveLength(4);
        expect(avatars[3].querySelector(`.${prefixCls}-content .${prefixCls}-label`)).toHaveTextContent(/^\+2$/);
    });

    it('maxCount 变化时更新可见头像与「+N」', () => {
        const [maxCount, setMaxCount] = createSignal(3);
        const { container } = render(() => <Group maxCount={maxCount()} />);
        expect(getAvatars(container)).toHaveLength(4);

        setMaxCount(4);
        expect(getAvatars(container)).toHaveLength(5);
        expect(container.querySelector(`.${prefixCls}-item-more`)).toHaveTextContent('+1');

        setMaxCount(10);
        expect(getAvatars(container)).toHaveLength(5);
        expect(container.querySelector(`.${prefixCls}-item-more`)).toBeNull();
    });

    it('maxCount 变化时 renderMore 收到的头像随之移动', () => {
        const [maxCount, setMaxCount] = createSignal(3);
        const { container } = render(() => (
            <Group
                maxCount={maxCount()}
                renderMore={(_, restAvatars) => (
                    <span class="rest">
                        <For each={restAvatars}>{(avatar) => avatar()}</For>
                    </span>
                )}
            />
        ));
        const rest = () => (container.querySelector('.rest') as HTMLElement).textContent;
        expect(rest()).toBe('ZLYZ');

        setMaxCount(2);
        expect(rest()).toBe('RMZLYZ');
        expect(getAvatars(container)).toHaveLength(5);

        setMaxCount(4);
        expect(rest()).toBe('YZ');
        expect(getAvatars(container)).toHaveLength(5);
    });

    it('超出 maxCount 的头像在 renderMore 调用其渲染函数时才创建', () => {
        const [open, setOpen] = createSignal(false);
        const created = vi.fn<() => void>();
        const Counted = () => {
            created();
            return 'IN';
        };
        render(() => (
            <AvatarGroup maxCount={1} renderMore={(_, restAvatars) => <span class="rest">{open() ? restAvatars[0]({ size: 'small' }) : null}</span>}>
                <Avatar>AA</Avatar>
                <Avatar>
                    <Counted />
                </Avatar>
            </AvatarGroup>
        ));
        expect(created).not.toHaveBeenCalled();
        setOpen(true);
        expect(created).toHaveBeenCalledTimes(1);
        const avatar = document.querySelector(`.rest .${prefixCls}`);
        expect(avatar).toHaveTextContent('IN');
        expect(avatar).toHaveClass(`${prefixCls}-small`);
        expect(avatar).not.toHaveAttribute('role');
    });

    it('renderMore', () => {
        const { container } = render(() => <Group maxCount={3} renderMore={(restNumber) => <span class="custom">/{restNumber}</span>} />);
        expect(container.querySelector('.custom')).toHaveTextContent(/^\/2$/);
    });

    describe('renderMore 返回的头像', () => {
        it('继承组的 size、shape 与重叠类', () => {
            render(() => (
                <Group
                    maxCount={2}
                    size="small"
                    shape="square"
                    overlapFrom="end"
                    renderMore={(restNumber) => (
                        <Wrap>
                            <Avatar>{`+${restNumber}`}</Avatar>
                        </Wrap>
                    )}
                />
            ));
            const more = within(screen.getByRole('list')).getAllByRole('listitem')[2];
            expect(more).toHaveClass(`${prefixCls}-small`, `${prefixCls}-square`, `${prefixCls}-item-end-2`);
        });

        it('Tooltip 弹层内的头像不是列表项，列表内的「+N」头像仍是', () => {
            render(() => (
                <Group
                    maxCount={2}
                    size="small"
                    renderMore={(restNumber, restAvatars) => (
                        <Tooltip
                            content={
                                <div data-testid="popup">
                                    <For each={restAvatars}>{(avatar) => avatar()}</For>
                                </div>
                            }
                            trigger="custom"
                            visible
                        >
                            {(trigger) => <Avatar {...trigger()}>{`+${restNumber}`}</Avatar>}
                        </Tooltip>
                    )}
                />
            ));
            expect(within(screen.getByRole('list')).getAllByRole('listitem')[2]).toHaveTextContent('+3');
            const popupAvatars = screen.getByTestId('popup').querySelectorAll(`.${prefixCls}`);
            expect(popupAvatars).toHaveLength(3);
            popupAvatars.forEach((avatar) => {
                expect(avatar).not.toHaveAttribute('role');
                expect(avatar).not.toHaveClass(`${prefixCls}-small`);
            });
        });

        it('显式传入的 size 优先于组的 size', () => {
            render(() => <Group maxCount={2} size="small" renderMore={(restNumber) => <Avatar size="large">{`+${restNumber}`}</Avatar>} />);
            const more = within(screen.getByRole('list')).getAllByRole('listitem')[2];
            expect(more).toHaveClass(`${prefixCls}-large`);
            expect(more).not.toHaveClass(`${prefixCls}-small`);
        });
    });

    it('size', () => {
        const sizes = ['extra-extra-small', 'extra-small', 'small', 'default', 'large', 'extra-large'];
        const { container } = render(() => (
            <div>
                <For each={sizes}>
                    {(size) => (
                        <AvatarGroup style={{ margin: '4px' }} size={size}>
                            <Avatar color="red">LL</Avatar>
                        </AvatarGroup>
                    )}
                </For>
            </div>
        ));
        const avatars = getFirstAvatarOfGroups(container);
        expect(avatars[1]).not.toHaveClass(`${prefixCls}-extra-extra-small`);
        sizes.forEach((size, index) => {
            expect(avatars[index]).toHaveClass(`${prefixCls}-${size}`);
        });
    });

    it('shape', () => {
        const { container } = render(() => (
            <div>
                <AvatarGroup style={{ margin: '4px' }} shape="circle">
                    <Avatar color="red">LL</Avatar>
                </AvatarGroup>
                <AvatarGroup style={{ margin: '4px' }} shape="square">
                    <Avatar color="red">LL</Avatar>
                </AvatarGroup>
            </div>
        ));
        const [circle, square] = getFirstAvatarOfGroups(container);
        expect(square).not.toHaveClass(`${prefixCls}-circle`);
        expect(circle).toHaveClass(`${prefixCls}-circle`);
        expect(square).toHaveClass(`${prefixCls}-square`);
    });

    it('未声明的属性放在根元素上，而不是每个头像上', () => {
        const { container } = render(() => <Group data-testid="group" aria-label="team" class="mine" style={{ margin: '4px' }} />);
        const group = container.querySelector(`.${prefixCls}-group`);
        expect(group).toHaveAttribute('data-testid', 'group');
        expect(group).toHaveAttribute('aria-label', 'team');
        expect(group).toHaveClass('mine');
        expect(group).toHaveStyle({ margin: '4px' });
        getAvatars(container).forEach((avatar) => {
            expect(avatar).not.toHaveAttribute('data-testid');
            expect(avatar).not.toHaveAttribute('aria-label');
            expect(avatar).not.toHaveClass('mine');
            expect(avatar.style.margin).toBe('');
        });
    });

    describe('基线', () => {
        // A hidden avatar is not created, so its name comes from alt, not from its children
        it('+N 头像以剩余数量与被隐藏头像的 alt 命名', () => {
            const { container } = render(() => (
                <AvatarGroup maxCount={3}>
                    <Avatar>LL</Avatar>
                    <Avatar>CX</Avatar>
                    <Avatar>RM</Avatar>
                    <Avatar alt="ZL">ZL</Avatar>
                    <Avatar alt="YZ">YZ</Avatar>
                    <Avatar>NA</Avatar>
                </AvatarGroup>
            ));
            const more = getAvatars(container)[3];
            expect(more).toHaveClass(`${prefixCls}-item-more`, `${prefixCls}-item-start-3`);
            expect(within(more).getByRole('img')).toHaveAttribute('aria-label', '另有 3 个头像: ZL,YZ');
        });

        it('将剩余数量与头像传给 renderMore', () => {
            const renderMore = vi.fn<NonNullable<AvatarGroupProps['renderMore']>>(() => <span class="custom" />);
            render(() => <Group maxCount={4} renderMore={renderMore} />);
            expect(renderMore).toHaveBeenCalled();
            const [restNumber, restAvatars] = renderMore.mock.calls[0];
            expect(restNumber).toBe(1);
            expect(restAvatars).toHaveLength(1);
            render(() => restAvatars[0]());
            expect(screen.getByText('YZ')).toBeInTheDocument();
        });

        it('未超过 maxCount 时渲染全部头像', () => {
            const { container } = render(() => <Group maxCount={5} />);
            expect(getAvatars(container)).toHaveLength(5);
            expect(container.querySelector(`.${prefixCls}-item-more`)).toBeNull();
        });

        it('渲染单个头像子节点及无子节点的情况', () => {
            const { container } = render(() => (
                <AvatarGroup>
                    <Avatar>A</Avatar>
                </AvatarGroup>
            ));
            expect(getAvatars(container)[0]).toHaveClass(`${prefixCls}-item-start-0`);

            const empty = render(() => <AvatarGroup />);
            expect(empty.getByRole('list')).toBeEmptyDOMElement();
        });

        it('把 size 与 shape 覆盖到各头像上', () => {
            const { container } = render(() => (
                <AvatarGroup shape="square" size="small">
                    <Avatar class="own" shape="circle" size="large">
                        A
                    </Avatar>
                </AvatarGroup>
            ));
            const avatar = getAvatars(container)[0];
            expect(avatar).toHaveClass('own', `${prefixCls}-small`, `${prefixCls}-square`);
            expect(avatar).not.toHaveClass(`${prefixCls}-large`);
        });

        it('默认为中号圆形，且从一开始就重叠', () => {
            const { container } = render(() => <Group />);
            getAvatars(container).forEach((avatar, index) => {
                expect(avatar).toHaveClass(`${prefixCls}-medium`, `${prefixCls}-circle`, `${prefixCls}-item-start-${index}`);
            });
        });
    });

    describe('子节点', () => {
        it('文本子节点原样渲染而不抛错', () => {
            const { container } = render(() => (
                <AvatarGroup>
                    plain text
                    <Avatar>AB</Avatar>
                </AvatarGroup>
            ));
            expect(screen.getByRole('list')).toHaveTextContent('plain text');
            expect(getAvatars(container)).toHaveLength(1);
        });

        it('只有一个文本子节点时也不抛错', () => {
            render(() => <AvatarGroup>plain text</AvatarGroup>);
            expect(screen.getByRole('list')).toHaveTextContent('plain text');
        });

        it('超出 maxCount 的文本子节点不影响「+N」头像', () => {
            const { container } = render(() => (
                <AvatarGroup maxCount={1}>
                    <Avatar>AB</Avatar>
                    text
                    <Avatar>CD</Avatar>
                </AvatarGroup>
            ));
            expect(getAvatars(container)).toHaveLength(2);
            expect(container.querySelector(`.${prefixCls}-item-more`)).toHaveTextContent('+2');
        });

        it('maxCount 对 Fragment 内的头像逐个计数', () => {
            const { container } = render(() => (
                <AvatarGroup maxCount={2}>
                    <>
                        <Avatar>AA</Avatar>
                        <Avatar>BB</Avatar>
                        <Avatar>CC</Avatar>
                    </>
                </AvatarGroup>
            ));
            expect(container.querySelector(`.${prefixCls}-item-more`)).toHaveTextContent(/^\+1$/);
            expect(within(screen.getByRole('list')).queryByText('CC')).toBeNull();
            expect(screen.getAllByRole('listitem')).toHaveLength(3);
        });

        it('前面插入子项后，已有头像的 DOM 节点保持不变', () => {
            const [show, setShow] = createSignal(false);
            const { container } = render(() => (
                <AvatarGroup>
                    {show() ? <Avatar>XX</Avatar> : null}
                    <Avatar>AA</Avatar>
                </AvatarGroup>
            ));
            const before = getAvatars(container)[0];
            setShow(true);
            expect(getAvatars(container)[1]).toBe(before);
            expect(getAvatars(container)[1]).toHaveClass(`${prefixCls}-item-start-1`);
        });

        it('被 Tooltip 包住的头像拿到组的 size、shape 与重叠层级', () => {
            render(() => (
                <AvatarGroup shape="square" size="small">
                    <Tooltip content="tip">
                        <Avatar alt="wrapped">AA</Avatar>
                    </Tooltip>
                    <Avatar>BB</Avatar>
                </AvatarGroup>
            ));
            screen.getAllByRole('listitem').forEach((avatar, index) => {
                expect(avatar).toHaveClass(`${prefixCls}-small`, `${prefixCls}-square`);
                expect(avatar).not.toHaveClass(`${prefixCls}-medium`);
                expect(avatar).toHaveClass(`${prefixCls}-item-start-${index}`);
            });
        });

        it('Tooltip 弹层里的头像不取组的 size，也不是列表项', async () => {
            render(() => (
                <AvatarGroup size="small">
                    <Tooltip content={<Avatar>IN</Avatar>} motion={false} trigger="click">
                        <Avatar>AA</Avatar>
                    </Tooltip>
                </AvatarGroup>
            ));
            fireEvent.click(screen.getByText('AA'));
            const inner = (await screen.findByText('IN')).closest(`.${prefixCls}`);
            expect(inner).not.toHaveClass(`${prefixCls}-small`);
            expect(inner).not.toHaveAttribute('role', 'listitem');
        });
    });

    describe('动态列表', () => {
        function List(props: { names: string[] }) {
            return (
                <AvatarGroup maxCount={3}>
                    <For each={props.names}>{(name) => <Avatar alt={name}>{name}</Avatar>}</For>
                </AvatarGroup>
            );
        }

        const items = () => within(screen.getByRole('list')).getAllByRole('listitem');
        const texts = () => items().map((item) => item.textContent);
        const moreName = () =>
            within(items().at(-1) as HTMLElement)
                .getByRole('img')
                .getAttribute('aria-label');

        it('avatar/删除可见头像后由被隐藏的头像补位', () => {
            const [names, setNames] = createSignal(['A', 'B', 'C', 'D', 'E']);
            render(() => <List names={names()} />);
            expect(texts()).toEqual(['A', 'B', 'C', '+2']);

            setNames(['B', 'C', 'D', 'E']);
            expect(texts()).toEqual(['B', 'C', 'D', '+1']);
            expect(moreName()).toBe('另有 1 个头像: E');
        });

        it('avatar/删除后再追加的头像计入「+N」', () => {
            const [names, setNames] = createSignal(['A', 'B', 'C', 'D', 'E']);
            render(() => <List names={names()} />);
            setNames(['B', 'C', 'D', 'E']);
            setNames(['B', 'C', 'D', 'E', 'F']);
            expect(texts()).toEqual(['B', 'C', 'D', '+2']);
            expect(moreName()).toBe('另有 2 个头像: E,F');
        });

        it('avatar/插在前面的头像按位置计入 maxCount', () => {
            const [names, setNames] = createSignal(['A', 'B', 'C', 'D']);
            render(() => <List names={names()} />);
            setNames(['X', 'A', 'B', 'C', 'D']);
            expect(texts()).toEqual(['X', 'A', 'B', '+2']);
            expect(moreName()).toBe('另有 2 个头像: C,D');
        });

        it('avatar/被 Tooltip 包住的头像在 maxCount 增大时补位', () => {
            const [maxCount, setMaxCount] = createSignal(1);
            render(() => (
                <AvatarGroup maxCount={maxCount()}>
                    <Tooltip content="A">
                        <Avatar alt="A">A</Avatar>
                    </Tooltip>
                    <Tooltip content="B">
                        <Avatar alt="B">B</Avatar>
                    </Tooltip>
                    <Tooltip content="C">
                        <Avatar alt="C">C</Avatar>
                    </Tooltip>
                </AvatarGroup>
            ));
            expect(texts()).toEqual(['A', '+2']);
            setMaxCount(2);
            expect(texts()).toEqual(['A', 'B', '+1']);
            expect(moreName()).toBe('另有 1 个头像');
        });

        it('avatar/被 Tooltip 包住的列表头像在删除后补位', () => {
            const [names, setNames] = createSignal(['A', 'B', 'C', 'D', 'E']);
            render(() => (
                <AvatarGroup maxCount={3}>
                    <For each={names()}>
                        {(name) => (
                            <Tooltip content={name}>
                                <Avatar alt={name}>{name}</Avatar>
                            </Tooltip>
                        )}
                    </For>
                </AvatarGroup>
            ));
            setNames(['B', 'C', 'D', 'E']);
            expect(texts()).toEqual(['B', 'C', 'D', '+1']);
        });

        // As in React, maxCount counts the group's children, and a wrapper is one child however many avatars it holds
        it('avatar/包装元素里的头像增删时按子节点计入 maxCount', () => {
            const [names, setNames] = createSignal(['A', 'B', 'C']);
            render(() => (
                <AvatarGroup maxCount={2}>
                    <div>
                        <For each={names()}>{(name) => <Avatar alt={name}>{name}</Avatar>}</For>
                    </div>
                    <Show when>
                        <Avatar alt="Z">Z</Avatar>
                    </Show>
                </AvatarGroup>
            ));
            expect(texts()).toEqual(['A', 'B', 'C', 'Z']);
            setNames(['C']);
            expect(texts()).toEqual(['C', 'Z']);
        });
    });

    describe('函数组件', () => {
        it('ref 指向列表元素', () => {
            let ref: HTMLDivElement | undefined;
            render(() => <Group ref={(node) => (ref = node)} />);
            expect(ref).toBe(screen.getByRole('list'));
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
            semiGlobal.config.overrideDefaultProps = { AvatarGroup: { shape: 'square', overlapFrom: 'end' } };
            const [shape, setShape] = createSignal<AvatarGroupProps['shape']>();
            const { container } = render(() => <Group shape={shape()} />);
            getAvatars(container).forEach((avatar, index) => {
                expect(avatar).toHaveClass(`${prefixCls}-square`, `${prefixCls}-item-end-${index}`);
            });
            setShape('circle');
            expect(getAvatars(container)[0]).toHaveClass(`${prefixCls}-circle`);
        });
    });
});

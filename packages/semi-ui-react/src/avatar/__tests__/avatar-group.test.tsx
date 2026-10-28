import { createRef, type ReactElement, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Popover from '../../popover';
import AvatarGroup from '../avatar-group';
import Avatar from '../index';
import type { AvatarGroupProps } from '../interface';

function getAg(props: AvatarGroupProps & { 'data-testid'?: string } = {}) {
    return (
        <AvatarGroup {...props}>
            <Avatar color="red">LL</Avatar>
            <Avatar>CX</Avatar>
            <Avatar color="amber">RM</Avatar>
            <Avatar style={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>ZL</Avatar>
            <Avatar style={{ backgroundColor: '#87d068' }}>YZ</Avatar>
        </AvatarGroup>
    );
}

const getAvatars = (container: HTMLElement) => container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-avatar`);
const getFirstAvatarOfGroups = (container: HTMLElement) => Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-avatar-group`), (group) => group.querySelector(`.${BASE_CLASS_PREFIX}-avatar`));

describe('AvatarGroup', () => {
    it('avatarGroup overlapFrom', () => {
        const { container, rerender } = render(getAg());
        getAvatars(container).forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-item-start-${index}`);
            expect(avatar).not.toHaveClass(`${BASE_CLASS_PREFIX}-avatar-item-end-${index}`);
        });
        rerender(getAg({ overlapFrom: 'end' }));
        getAvatars(container).forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-item-end-${index}`);
            expect(avatar).not.toHaveClass(`${BASE_CLASS_PREFIX}-avatar-item-start-${index}`);
        });
    });

    it('头像渲染为列表项', () => {
        const { container } = render(getAg({ maxCount: 3 }));
        const items = within(screen.getByRole('list')).getAllByRole('listitem');
        expect(items).toEqual([...getAvatars(container)]);
        expect(items).toHaveLength(4);
    });

    // renderMore often wraps the avatar (e.g. in a Popover) in a component that does not forward props
    it('被包裹的 renderMore 头像仍是列表项', () => {
        const Wrap = ({ children }: { children: ReactNode }) => children;
        render(
            getAg({
                maxCount: 3,
                renderMore: (restNumber) => (
                    <Wrap>
                        <Avatar>{`+${restNumber}`}</Avatar>
                    </Wrap>
                ),
            })
        );
        const items = within(screen.getByRole('list')).getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(items[3]).toHaveTextContent('+2');
    });

    it('maxCount', () => {
        const { container } = render(getAg({ maxCount: 3 }));
        const avatars = getAvatars(container);
        expect(avatars).toHaveLength(4);
        expect(avatars[3].querySelector(`.${BASE_CLASS_PREFIX}-avatar-content .${BASE_CLASS_PREFIX}-avatar-label`)).toHaveTextContent(/^\+2$/);
    });

    it('renderMore', () => {
        const { container } = render(
            getAg({
                maxCount: 3,
                renderMore: (restNumber) => <span className="custom">/{restNumber}</span>,
            })
        );
        expect(container.querySelector('.custom')).toHaveTextContent(/^\/2$/);
    });

    describe('renderMore 返回的头像', () => {
        const Wrap = ({ children }: { children: ReactNode }) => children;

        it('继承组的 size、shape 与重叠类，更新时不向 Fragment 注入属性', () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const props: AvatarGroupProps = {
                maxCount: 2,
                size: 'small',
                shape: 'square',
                overlapFrom: 'end',
                renderMore: (restNumber) => (
                    <Wrap>
                        <Avatar>{`+${restNumber}`}</Avatar>
                    </Wrap>
                ),
            };
            const { rerender } = render(getAg(props));
            rerender(getAg({ ...props }));
            const more = within(screen.getByRole('list')).getAllByRole('listitem')[2];
            expect(more).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-small`, `${BASE_CLASS_PREFIX}-avatar-square`, `${BASE_CLASS_PREFIX}-avatar-item-end-2`);
            expect(error).not.toHaveBeenCalled();
            error.mockRestore();
        });

        it('Popover 弹层内的头像不是列表项，列表内的「+N」头像仍是', () => {
            render(
                getAg({
                    maxCount: 2,
                    size: 'small',
                    renderMore: (restNumber, restAvatars) => (
                        <Popover content={<div data-testid="popup">{restAvatars}</div>} trigger="custom" visible>
                            <Avatar>{`+${restNumber}`}</Avatar>
                        </Popover>
                    ),
                })
            );
            expect(within(screen.getByRole('list')).getAllByRole('listitem')[2]).toHaveTextContent('+3');
            const popupAvatars = screen.getByTestId('popup').querySelectorAll(`.${BASE_CLASS_PREFIX}-avatar`);
            expect(popupAvatars).toHaveLength(3);
            popupAvatars.forEach((avatar) => expect(avatar).not.toHaveAttribute('role'));
        });

        it('显式传入的 size 优先于组的 size', () => {
            render(
                getAg({
                    maxCount: 2,
                    size: 'small',
                    renderMore: (restNumber) => <Avatar size="large">{`+${restNumber}`}</Avatar>,
                })
            );
            const more = within(screen.getByRole('list')).getAllByRole('listitem')[2];
            expect(more).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-large`);
            expect(more).not.toHaveClass(`${BASE_CLASS_PREFIX}-avatar-small`);
        });
    });

    it('size', () => {
        const sizes = ['extra-extra-small', 'extra-small', 'small', 'default', 'large', 'extra-large'];
        const { container } = render(
            <div>
                {sizes.map((size) => (
                    <AvatarGroup key={size} style={{ margin: 4 }} size={size}>
                        <Avatar color="red">LL</Avatar>
                    </AvatarGroup>
                ))}
            </div>
        );
        const avatars = getFirstAvatarOfGroups(container);
        expect(avatars[1]).not.toHaveClass(`${BASE_CLASS_PREFIX}-avatar-extra-extra-small`);
        sizes.forEach((size, index) => {
            expect(avatars[index]).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-${size}`);
        });
    });

    it('size', () => {
        const { container } = render(
            <div>
                <AvatarGroup style={{ margin: 4 }} shape="circle">
                    <Avatar color="red">LL</Avatar>
                </AvatarGroup>
                <AvatarGroup style={{ margin: 4 }} shape="square">
                    <Avatar color="red">LL</Avatar>
                </AvatarGroup>
            </div>
        );
        const [circle, square] = getFirstAvatarOfGroups(container);
        expect(square).not.toHaveClass(`${BASE_CLASS_PREFIX}-avatar-circle`);
        expect(circle).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-circle`);
        expect(square).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-square`);
    });

    it('未声明的属性放在根元素上，而不是每个头像上', () => {
        const { container } = render(getAg({ 'data-testid': 'group', 'aria-label': 'team', className: 'mine', style: { margin: 4 } }));
        const group = container.querySelector(`.${BASE_CLASS_PREFIX}-avatar-group`);
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
        it('+N 头像以剩余数量命名', () => {
            const { container } = render(getAg({ maxCount: 3 }));
            const more = getAvatars(container)[3];
            expect(more).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-item-more`, `${BASE_CLASS_PREFIX}-avatar-item-start-3`);
            expect(within(more).getByRole('img')).toHaveAttribute('aria-label', '另有 2 个头像: ZL,YZ');
        });

        it('将剩余数量与头像传给 renderMore', () => {
            const renderMore = vi.fn<NonNullable<AvatarGroupProps['renderMore']>>(() => <span className="custom" />);
            render(getAg({ maxCount: 4, renderMore }));
            expect(renderMore).toHaveBeenCalled();
            const [restNumber, restAvatars] = renderMore.mock.calls[0];
            expect(restNumber).toBe(1);
            expect(restAvatars).toHaveLength(1);
            expect((restAvatars[0] as ReactElement<{ children: string }>).props.children).toBe('YZ');
        });

        it('未超过 maxCount 时渲染全部头像', () => {
            const { container } = render(getAg({ maxCount: 5 }));
            expect(getAvatars(container)).toHaveLength(5);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-avatar-item-more`)).toBeNull();
        });

        it('渲染单个头像子节点及无子节点的情况', () => {
            const { container, rerender } = render(
                <AvatarGroup>
                    <Avatar>A</Avatar>
                </AvatarGroup>
            );
            expect(getAvatars(container)[0]).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-item-start-0`);
            rerender(<AvatarGroup />);
            expect(screen.getByRole('list')).toBeEmptyDOMElement();
        });

        it('把 size 与 shape 覆盖到各头像上', () => {
            const { container } = render(
                <AvatarGroup shape="square" size="small">
                    <Avatar className="own" shape="circle" size="large">
                        A
                    </Avatar>
                </AvatarGroup>
            );
            const avatar = getAvatars(container)[0];
            expect(avatar).toHaveClass('own', `${BASE_CLASS_PREFIX}-avatar-small`, `${BASE_CLASS_PREFIX}-avatar-square`);
            expect(avatar).not.toHaveClass(`${BASE_CLASS_PREFIX}-avatar-large`);
        });

        it('默认为中号圆形，且从一开始就重叠', () => {
            const { container } = render(getAg());
            getAvatars(container).forEach((avatar, index) => {
                expect(avatar).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-medium`, `${BASE_CLASS_PREFIX}-avatar-circle`, `${BASE_CLASS_PREFIX}-avatar-item-start-${index}`);
            });
        });
    });

    describe('子节点', () => {
        it('文本子节点原样渲染而不抛错', () => {
            const { container } = render(
                <AvatarGroup>
                    plain text
                    <Avatar>AB</Avatar>
                </AvatarGroup>
            );
            expect(screen.getByRole('list')).toHaveTextContent('plain text');
            expect(getAvatars(container)).toHaveLength(1);
        });

        it('只有一个文本子节点时也不抛错', () => {
            render(<AvatarGroup>plain text</AvatarGroup>);
            expect(screen.getByRole('list')).toHaveTextContent('plain text');
        });

        it('超出 maxCount 的文本子节点不影响「+N」头像', () => {
            const { container } = render(
                <AvatarGroup maxCount={1}>
                    <Avatar>AB</Avatar>
                    text
                    <Avatar>CD</Avatar>
                </AvatarGroup>
            );
            expect(getAvatars(container)).toHaveLength(2);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-avatar-item-more`)).toHaveTextContent('+2');
        });

        it('带 key 的子项在前面插入后，已有头像的 DOM 节点保持不变', () => {
            const App = ({ show }: { show: boolean }) => (
                <AvatarGroup>
                    {show ? <Avatar key="x">XX</Avatar> : null}
                    <Avatar key="a">AA</Avatar>
                </AvatarGroup>
            );
            const { container, rerender } = render(<App show={false} />);
            const before = getAvatars(container)[0];
            rerender(<App show />);
            expect(getAvatars(container)[1]).toBe(before);
        });
    });

    it('包装 Avatar 并透传 className 的组件只得到一份重叠 class', () => {
        const Wrapped = ({ className }: { className?: string }) => <Avatar className={className}>W</Avatar>;
        const { container } = render(
            <AvatarGroup>
                <Wrapped />
            </AvatarGroup>
        );
        const overlap = `${BASE_CLASS_PREFIX}-avatar-item-start-0`;
        expect(
            getAvatars(container)[0]
                .className.split(' ')
                .filter((name) => name === overlap)
        ).toHaveLength(1);
    });

    describe('函数组件', () => {
        it('ref 指向列表元素', () => {
            const ref = createRef<HTMLDivElement>();
            render(getAg({ ref }));
            expect(ref.current).toBe(screen.getByRole('list'));
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
            semiGlobal.config.overrideDefaultProps = { AvatarGroup: { shape: 'square', overlapFrom: 'end' } };
            try {
                const { container, rerender } = render(getAg());
                getAvatars(container).forEach((avatar, index) => {
                    expect(avatar).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-square`, `${BASE_CLASS_PREFIX}-avatar-item-end-${index}`);
                });
                rerender(getAg({ shape: 'circle' }));
                expect(getAvatars(container)[0]).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-circle`);
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });
    });
});

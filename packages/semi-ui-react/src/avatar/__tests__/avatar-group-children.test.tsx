import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Modal from '../../modal';
import Popover from '../../popover';
import AvatarGroup from '../avatar-group';
import Avatar from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-avatar`;

describe('AvatarGroup 的子项', () => {
    it('maxCount 对 Fragment 内的头像逐个计数', () => {
        const { container } = render(
            <AvatarGroup maxCount={2}>
                <>
                    <Avatar>AA</Avatar>
                    <Avatar>BB</Avatar>
                    <Avatar>CC</Avatar>
                </>
            </AvatarGroup>
        );
        expect(container.querySelector(`.${prefixCls}-item-more`)).toHaveTextContent(/^\+1$/);
        expect(screen.queryByText('CC')).toBeNull();
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('被 Popover 包住的头像拿到组的 size、shape 与重叠层级', () => {
        render(
            <AvatarGroup shape="square" size="small">
                <Popover content="tip">
                    <Avatar alt="wrapped">AA</Avatar>
                </Popover>
                <Avatar>BB</Avatar>
            </AvatarGroup>
        );
        screen.getAllByRole('listitem').forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${prefixCls}-small`, `${prefixCls}-square`);
            expect(avatar).not.toHaveClass(`${prefixCls}-medium`);
            expect(avatar).toHaveClass(`${prefixCls}-item-start-${index}`);
        });
    });

    it('Popover 弹层里的头像不取组的 size，也不是列表项', async () => {
        render(
            <AvatarGroup size="small">
                <Popover content={<Avatar>IN</Avatar>} motion={false} trigger="click">
                    <Avatar>AA</Avatar>
                </Popover>
            </AvatarGroup>
        );
        fireEvent.click(screen.getByText('AA'));
        const inner = (await screen.findByText('IN')).closest(`.${prefixCls}`);
        expect(inner).not.toHaveClass(`${prefixCls}-small`);
        expect(inner).not.toHaveAttribute('role', 'listitem');
    });

    it('组内声明的 Modal 里的头像不取组的 size，也不是列表项', () => {
        function AvatarWithDetail() {
            return (
                <>
                    <Avatar>AA</Avatar>
                    <Modal title="detail" motion={false} visible>
                        <Avatar>IN</Avatar>
                    </Modal>
                </>
            );
        }
        render(
            <AvatarGroup size="small">
                <AvatarWithDetail />
            </AvatarGroup>
        );
        expect(screen.getByText('AA').closest(`.${prefixCls}`)).toHaveClass(`${prefixCls}-small`);
        const inner = screen.getByText('IN').closest(`.${prefixCls}`);
        expect(inner).not.toHaveClass(`${prefixCls}-small`);
        expect(inner).not.toHaveAttribute('role', 'listitem');
    });
});

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import ChatBoxAvatar from '../chat-box/chat-box-avatar';

const hiddenCls = 'semi-chat-chatBox-avatar-hidden';

describe('ChatBoxAvatar', () => {
    it('continueSend 变化时更新隐藏状态', () => {
        const role = { name: 'Assistant', avatar: 'https://semi.design/avatar.png' };
        const { container, rerender } = render(<ChatBoxAvatar role={role} continueSend={false} />);
        expect(container.querySelector(`.${hiddenCls}`)).toBeNull();

        rerender(<ChatBoxAvatar role={role} continueSend />);
        expect(container.querySelector(`.${hiddenCls}`)).not.toBeNull();
    });

    it('把 roleConfig 的 color 交给节点头像', () => {
        const { container } = render(<ChatBoxAvatar role={{ name: 'A', avatar: <span>A</span>, color: 'red' }} />);
        const avatar = container.querySelector('.semi-chat-chatBox-avatar');
        expect(avatar).toHaveClass('semi-avatar-red');
        expect(avatar).not.toHaveClass('semi-avatar-grey');
    });
});

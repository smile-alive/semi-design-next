import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import ChatBoxAvatar from '../chat-box-avatar';

const hiddenCls = 'semi-chat-chatBox-avatar-hidden';

describe('ChatBoxAvatar', () => {
    it('continueSend 变化时更新隐藏状态', () => {
        const role = { name: 'Assistant', avatar: 'https://semi.design/avatar.png' };
        const [continueSend, setContinueSend] = createSignal(false);
        const { container } = render(() => <ChatBoxAvatar role={role} continueSend={continueSend()} />);
        expect(container.querySelector(`.${hiddenCls}`)).toBeNull();

        setContinueSend(true);
        expect(container.querySelector(`.${hiddenCls}`)).not.toBeNull();
    });

    it('把 roleConfig 的 color 交给 renderRoleAvatar 渲染的节点头像', () => {
        const { container } = render(() => <ChatBoxAvatar role={{ name: 'A', color: 'red' }} renderRoleAvatar={({ role }) => <span class="role-avatar">{role?.name}</span>} />);
        const avatar = container.querySelector('.semi-chat-chatBox-avatar');
        expect(avatar).toHaveClass('semi-avatar-red');
        expect(avatar).not.toHaveClass('semi-avatar-grey');
        expect(avatar?.querySelector('.role-avatar')).toHaveTextContent('A');
    });
});

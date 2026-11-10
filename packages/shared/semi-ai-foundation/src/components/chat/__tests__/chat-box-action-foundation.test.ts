import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { copyText } from '@fibrae/semi-foundation/utils';
import ChatBoxActionFoundation, { type ChatBoxActionAdapter, getChatBoxActionFlags, getChatBoxActionKeys } from '../chat-box-action-foundation';

vi.mock('@fibrae/semi-foundation/utils/clipboard', () => ({ copyText: vi.fn<(text: string) => Promise<boolean>>() }));

describe('ChatBoxActionFoundation.copyMessage', () => {
    beforeEach(() => {
        vi.mocked(copyText).mockReset();
    });

    const create = () => {
        const adapter = { getProps: () => ({ message: { content: 'hello' } }), toastCopySuccess: vi.fn<() => void>(), notifyMessageCopy: vi.fn<() => void>() };
        return { adapter, foundation: new ChatBoxActionFoundation(adapter as unknown as ChatBoxActionAdapter) };
    };

    it('复制成功后提示并通知', async () => {
        vi.mocked(copyText).mockResolvedValue(true);
        const { adapter, foundation } = create();
        foundation.copyMessage();
        await vi.waitFor(() => expect(adapter.notifyMessageCopy).toHaveBeenCalledTimes(1));
        expect(copyText).toHaveBeenCalledWith('hello');
        expect(adapter.toastCopySuccess).toHaveBeenCalledTimes(1);
    });

    it('复制失败时既不提示也不通知', async () => {
        vi.mocked(copyText).mockResolvedValue(false);
        const { adapter, foundation } = create();
        foundation.copyMessage();
        await vi.waitFor(() => expect(copyText).toHaveBeenCalledTimes(1));
        await Promise.resolve();
        expect(adapter.toastCopySuccess).not.toHaveBeenCalled();
        expect(adapter.notifyMessageCopy).not.toHaveBeenCalled();
    });
});

describe('getChatBoxActionKeys', () => {
    it('助手的最后一条完成的消息显示全部按钮', () => {
        expect(getChatBoxActionKeys(getChatBoxActionFlags({ role: 'assistant', isLast: true }))).toEqual(['copyNode', 'likeNode', 'dislikeNode', 'resetNode', 'deleteNode']);
    });

    it('用户消息没有反馈与重新生成，未完成的消息没有复制', () => {
        expect(getChatBoxActionKeys(getChatBoxActionFlags({ role: 'user', isLast: true }))).toEqual(['copyNode', 'deleteNode']);
        expect(getChatBoxActionKeys(getChatBoxActionFlags({ role: 'assistant', status: 'loading' }))).toEqual(['deleteNode']);
    });
});

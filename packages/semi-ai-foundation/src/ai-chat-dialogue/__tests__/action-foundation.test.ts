import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import DialogueActionFoundation, { type DialogueActionAdapter, getDialogueActionFlags } from '../action-foundation';

vi.mock('@fibrae/semi-foundation/utils/clipboard', () => ({ copyText: vi.fn<(text: string) => Promise<boolean>>() }));

describe('DialogueActionFoundation.copyMessage', () => {
    beforeEach(() => {
        vi.mocked(copyText).mockReset();
    });

    const create = () => {
        const adapter = { getProps: () => ({ message: { id: '1', role: 'assistant', content: 'hello' } }), toastCopySuccess: vi.fn<() => void>(), notifyMessageCopy: vi.fn<() => void>() };
        return { adapter, foundation: new DialogueActionFoundation(adapter as unknown as DialogueActionAdapter) };
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

describe('getDialogueActionFlags', () => {
    it('缺省状态视为已完成，助手消息的最后一条显示重新生成', () => {
        expect(getDialogueActionFlags({ role: 'assistant', isLastChat: true, showReset: true })).toEqual({ completed: true, finished: true, showFeedback: true, showReset: true, showEdit: false });
    });

    it('用户消息可编辑且没有反馈按钮', () => {
        expect(getDialogueActionFlags({ role: 'user', status: 'completed', isLastChat: true, showReset: true })).toEqual({ completed: true, finished: true, showFeedback: false, showReset: false, showEdit: true });
    });

    it.each(['queued', 'in_progress'])('%s 时未结束，也不算已完成', (status) => {
        expect(getDialogueActionFlags({ role: 'assistant', status })).toMatchObject({ completed: false, finished: false, showFeedback: false });
    });

    it('showReset 与 isLastChat 缺省时返回 false 而不是 undefined', () => {
        expect(getDialogueActionFlags({ role: 'assistant' }).showReset).toBe(false);
        expect(getDialogueActionFlags({ role: 'assistant', isLastChat: true }).showReset).toBe(false);
    });
});

import { describe, expect, it, vi } from 'vite-plus/test';
import DialogueFoundation, { type DialogueAdapter, type Message } from '../foundation';

describe('DialogueFoundation 点赞与点踩', () => {
    const create = (chats: Partial<Message>[]) => {
        const adapter = {
            getProps: () => ({ chats }),
            notifyLikeMessage: vi.fn<DialogueAdapter['notifyLikeMessage']>(),
            notifyDislikeMessage: vi.fn<DialogueAdapter['notifyDislikeMessage']>(),
            notifyChatsChange: vi.fn<DialogueAdapter['notifyChatsChange']>(),
        };
        return { adapter, foundation: new DialogueFoundation(adapter as unknown as DialogueAdapter) };
    };

    it.each(['likeMessage', 'dislikeMessage'])('%s 忽略不在 chats 中的消息', (method) => {
        const { adapter, foundation } = create([{ id: '1' }]);
        expect(() => foundation[method]({ id: 'missing' })).not.toThrow();
        expect(adapter.notifyChatsChange).not.toHaveBeenCalled();
    });

    it('对已知消息切换点踩状态', () => {
        const { adapter, foundation } = create([{ id: '1', like: true }]);
        foundation.dislikeMessage({ id: '1' } as Message);
        expect(adapter.notifyChatsChange).toHaveBeenCalledWith([{ id: '1', like: false, dislike: true }]);
    });
});

describe('DialogueFoundation 重新生成与选择', () => {
    const create = (chats: Partial<Message>[], selectedIds = new Set<string>()) => {
        const adapter = {
            getProps: () => ({ chats }),
            getStates: () => ({ selectedIds }),
            notifyChatsChange: vi.fn<DialogueAdapter['notifyChatsChange']>(),
            notifyMessageReset: vi.fn<DialogueAdapter['notifyMessageReset']>(),
            updateSelected: vi.fn<DialogueAdapter['updateSelected']>(),
            notifySelect: vi.fn<DialogueAdapter['notifySelect']>(),
        };
        return { adapter, foundation: new DialogueFoundation(adapter as unknown as DialogueAdapter) };
    };

    it('重新生成清除旧回答的反馈、输出和引用，保留自定义字段', () => {
        const last = { id: 'a', role: 'assistant', like: true, dislike: true, output_text: 'old', error: { message: 'x' }, references: [{ name: 'r' }], custom: 1 } as unknown as Message;
        const { adapter, foundation } = create([last]);
        foundation.resetMessage(last);
        const [reset] = adapter.notifyChatsChange.mock.calls[0][0];
        expect(reset).toMatchObject({ role: 'assistant', status: 'in_progress', content: '', like: false, dislike: false, custom: 1 });
        expect(reset.id).not.toBe('a');
        expect(reset.output_text).toBeUndefined();
        expect(reset.error).toBeUndefined();
        expect(reset.references).toBeUndefined();
    });

    it('选择变化时丢弃已不存在的消息 id', () => {
        const { adapter, foundation } = create([{ id: '1' }, { id: '2' }], new Set(['1', 'gone']));
        foundation.handleSelectOrRemove(true, '2');
        expect(adapter.notifySelect).toHaveBeenCalledWith(['1', '2']);
    });
});

describe('DialogueFoundation 滚动', () => {
    const create = () => {
        const element = { scrollTop: 0, scrollHeight: 1000, clientHeight: 100 };
        let backBottomVisible = false;
        const adapter = {
            getContainerRef: () => element,
            getStates: () => ({ backBottomVisible }),
            setBackBottomVisible: vi.fn<(visible: boolean) => void>((visible) => {
                backBottomVisible = visible;
            }),
            notifyChatsChange: vi.fn<() => void>(),
        };
        return { adapter, element, foundation: new DialogueFoundation(adapter as unknown as DialogueAdapter) };
    };

    it('回到底部的动画结束时贴住当前底部，而不是点击时的底部', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        try {
            const { element, foundation } = create();
            foundation.scrollToBottomWithAnimation();
            vi.advanceTimersByTime(100);
            element.scrollHeight = 3000;
            vi.advanceTimersByTime(500);
            expect(element.scrollTop).toBe(3000);
        } finally {
            vi.useRealTimers();
        }
    });

    it('不跟随时，内容增长后更新回到底部按钮的显隐', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        try {
            const { adapter, element, foundation } = create();
            const scrollTo = (scrollTop: number) => {
                element.scrollTop = scrollTop;
                foundation.containerScroll({ target: element as unknown as EventTarget });
            };
            scrollTo(900);
            scrollTo(850);
            vi.advanceTimersByTime(200);
            adapter.setBackBottomVisible.mockClear();
            // growth alone fires no scroll event
            element.scrollHeight = 1200;
            foundation.handleListUpdate({ chats: [{ id: '1', role: 'assistant', status: 'completed' }], hints: [] }, { chats: [{ id: '1', role: 'assistant', status: 'completed', content: 'more' }], hints: [] });
            vi.advanceTimersByTime(200);
            expect(adapter.setBackBottomVisible).toHaveBeenCalledWith(true);
            // the content shrinks to fit without any scroll event
            element.scrollHeight = 100;
            element.scrollTop = 850;
            foundation.handleListUpdate({ chats: [{ id: '1', role: 'assistant', status: 'completed' }], hints: [] }, { chats: [{ id: '1', role: 'assistant', status: 'completed', content: 'less' }], hints: [] });
            vi.advanceTimersByTime(200);
            expect(adapter.setBackBottomVisible).toHaveBeenLastCalledWith(false);
        } finally {
            vi.useRealTimers();
        }
    });
});

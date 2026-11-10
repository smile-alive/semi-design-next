import { describe, expect, it, vi } from 'vite-plus/test';
import DialogueFoundation, { type DialogueAdapter, type Message } from '../foundation';

describe('DialogueFoundation 点赞与点踩', () => {
    const create = (chats: Partial<Message>[]) => {
        const adapter = {
            getProp: (key: string) => ({ chats })[key],
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
            getProp: (key: string) => ({ chats })[key],
            getStates: () => ({ selectedIds }),
            notifyChatsChange: vi.fn<DialogueAdapter['notifyChatsChange']>(),
            notifyMessageReset: vi.fn<DialogueAdapter['notifyMessageReset']>(),
            setState: vi.fn<(state: object) => void>(),
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

function changeProps(foundation: DialogueFoundation, props: { chats?: Partial<Message>[]; hints?: string[] }, next: { chats?: Partial<Message>[]; hints?: string[] }) {
    const prev = { ...props } as { chats?: Message[]; hints?: string[] };
    Object.assign(props, next);
    foundation.handlePropsChange(prev);
}

describe('DialogueFoundation 上报 chats 变化', () => {
    const create = (chats: Partial<Message>[]) => {
        const props = { chats };
        const adapter = {
            getProp: (key: string) => props[key],
            getContainerRef: () => null,
            notifyLikeMessage: vi.fn<DialogueAdapter['notifyLikeMessage']>(),
            notifyChatsChange: vi.fn<DialogueAdapter['notifyChatsChange']>(),
            notifyChatsPropChange: vi.fn<DialogueAdapter['notifyChatsPropChange']>(),
        };
        return { adapter, props, foundation: new DialogueFoundation(adapter as unknown as DialogueAdapter) };
    };

    it('父组件换入的列表通过 notifyChatsPropChange 上报', () => {
        const { adapter, props, foundation } = create([{ id: '1' }]);
        changeProps(foundation, props, { chats: [{ id: '1' }, { id: '2' }] });
        expect(adapter.notifyChatsPropChange).toHaveBeenCalledOnce();
        expect(adapter.notifyChatsChange).not.toHaveBeenCalled();
    });

    it('组件自己写入的列表回到 chats 时不再上报，按值比较以覆盖宿主交来的副本', () => {
        const { adapter, props, foundation } = create([{ id: '1' }]);
        foundation.likeMessage({ id: '1' } as Message);
        const written = adapter.notifyChatsChange.mock.calls[0][0];
        changeProps(foundation, props, { chats: [...written] });
        expect(adapter.notifyChatsPropChange).not.toHaveBeenCalled();
        // the parent rewrote the list in the setter: a different list is reported
        foundation.likeMessage({ id: '1' } as Message);
        changeProps(foundation, props, { chats: [{ id: '1', like: true }] });
        expect(adapter.notifyChatsPropChange).toHaveBeenCalledOnce();
    });
});

describe('DialogueFoundation 滚动', () => {
    const create = () => {
        const element = { scrollTop: 0, scrollHeight: 1000, clientHeight: 100 };
        let backBottomVisible = false;
        const props = { chats: [{ id: '1', role: 'assistant', status: 'completed' }] as Partial<Message>[], hints: [] as string[] };
        const adapter = {
            getProp: (key: string) => props[key],
            getContainerRef: () => element,
            getStates: () => ({ backBottomVisible }),
            setState: vi.fn<(state: { backBottomVisible: boolean }) => void>((state) => {
                backBottomVisible = state.backBottomVisible;
            }),
            notifyChatsPropChange: vi.fn<() => void>(),
        };
        return { adapter, element, props, foundation: new DialogueFoundation(adapter as unknown as DialogueAdapter) };
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
            const { adapter, element, props, foundation } = create();
            const scrollTo = (scrollTop: number) => {
                element.scrollTop = scrollTop;
                foundation.containerScroll({ target: element as unknown as EventTarget });
            };
            scrollTo(900);
            scrollTo(850);
            vi.advanceTimersByTime(200);
            adapter.setState.mockClear();
            // growth alone fires no scroll event
            element.scrollHeight = 1200;
            changeProps(foundation, props, { chats: [{ id: '1', role: 'assistant', status: 'completed', content: 'more' }] });
            vi.advanceTimersByTime(200);
            expect(adapter.setState).toHaveBeenCalledWith({ backBottomVisible: true }, undefined);
            // the content shrinks to fit without any scroll event
            element.scrollHeight = 100;
            element.scrollTop = 850;
            changeProps(foundation, props, { chats: [{ id: '1', role: 'assistant', status: 'completed', content: 'less' }] });
            vi.advanceTimersByTime(200);
            expect(adapter.setState).toHaveBeenLastCalledWith({ backBottomVisible: false }, undefined);
        } finally {
            vi.useRealTimers();
        }
    });
});

import { describe, expect, it, vi } from 'vite-plus/test';
import ChatFoundation, { type ChatAdapter, type Message } from '../foundation';
import InputBoxFoundation from '../inputbox-foundation';

describe('ChatFoundation.getUploadProps', () => {
    it('用 true 填充对象中未设置的键', () => {
        expect(ChatFoundation.getUploadProps({ dragUpload: false })).toEqual({
            dragUpload: false,
            clickUpload: true,
            pasteUpload: true,
        });
    });

    it('将布尔值应用于每种方式，默认全部开启', () => {
        expect(ChatFoundation.getUploadProps(false)).toEqual({
            dragUpload: false,
            clickUpload: false,
            pasteUpload: false,
        });
        expect(ChatFoundation.getUploadProps(undefined)).toEqual({
            dragUpload: true,
            clickUpload: true,
            pasteUpload: true,
        });
    });
});

describe('ChatFoundation.getContentFlags', () => {
    it.each([
        ['assistant', 'complete', 'bubble', { bubble: true, user: false, error: false }],
        ['user', 'error', 'bubble', { bubble: true, user: true, error: true }],
        ['user', 'complete', 'userBubble', { bubble: true, user: true, error: false }],
        ['assistant', 'error', 'userBubble', { bubble: false, user: false, error: false }],
        ['user', 'error', 'noBubble', { bubble: false, user: false, error: false }],
    ])('%s 角色、%s 状态、%s 模式', (role, status, mode, flags) => {
        expect(ChatFoundation.getContentFlags(role, status, mode)).toEqual(flags);
    });
});

describe('ChatFoundation 上传禁用', () => {
    it('禁用上传时关闭拖放和粘贴，保留点击入口以显示禁用的按钮', () => {
        expect(ChatFoundation.getUploadProps(undefined, true)).toEqual({ dragUpload: false, clickUpload: true, pasteUpload: false });
    });
});

describe('ChatFoundation 拖拽', () => {
    function create() {
        const adapter = { setUploadAreaVisible: vi.fn<() => void>(), manualUpload: vi.fn<() => void>() };
        return { adapter, foundation: new ChatFoundation(adapter as unknown as ChatAdapter) };
    }

    it('只在拖入文件时显示放置区', () => {
        const { adapter, foundation } = create();
        foundation.handleDragOver({ dataTransfer: { types: ['text/plain'] } as unknown as DataTransfer });
        expect(adapter.setUploadAreaVisible).not.toHaveBeenCalled();
        foundation.handleDragOver({ dataTransfer: { types: ['Files'] } as unknown as DataTransfer });
        expect(adapter.setUploadAreaVisible).toHaveBeenCalledWith(true);
    });

    it('放下的内容不含文件时不触发上传', () => {
        const { adapter, foundation } = create();
        foundation.handleContainerDrop({ dataTransfer: { files: [] }, preventDefault: vi.fn<() => void>(), stopPropagation: vi.fn<() => void>() });
        expect(adapter.manualUpload).not.toHaveBeenCalled();
    });
});

describe('ChatFoundation 重新生成', () => {
    it('清除旧回答的点赞与点踩，保留自定义字段', () => {
        const last = { id: 'a', role: 'assistant', like: true, dislike: true, custom: 1 };
        const adapter = { getProp: () => [last], notifyChatsChange: vi.fn<(chats: Record<string, unknown>[]) => void>(), notifyMessageReset: vi.fn<() => void>() };
        new ChatFoundation(adapter as unknown as ChatAdapter).resetMessage(last);
        expect(adapter.notifyChatsChange.mock.calls[0][0][0]).toMatchObject({ status: 'loading', content: '', like: false, dislike: false, custom: 1 });
    });
});

describe('ChatFoundation 回到底部', () => {
    function create() {
        const element = { scrollTop: 0, scrollHeight: 1000, clientHeight: 100 };
        let backBottomVisible = false;
        const adapter = {
            getContainerRef: () => element,
            getStates: () => ({ backBottomVisible }),
            setBackBottomVisible: vi.fn<(visible: boolean) => void>((visible) => {
                backBottomVisible = visible;
            }),
        };
        return { adapter, element, foundation: new ChatFoundation(adapter as unknown as ChatAdapter) };
    }

    it('动画结束时贴住当前底部，而不是点击时的底部', () => {
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

    it('不跟随时，内容变化后更新按钮的显隐', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        try {
            const { adapter, element, foundation } = create();
            const scrollTo = (scrollTop: number) => {
                element.scrollTop = scrollTop;
                foundation.containerScroll({ target: element });
            };
            scrollTo(900);
            scrollTo(850);
            vi.advanceTimersByTime(200);
            adapter.setBackBottomVisible.mockClear();
            element.scrollHeight = 1200;
            foundation.handleChatsChange([{ id: '1', status: 'complete', content: 'more' }], [{ id: '1', status: 'complete' }]);
            vi.advanceTimersByTime(200);
            expect(adapter.setBackBottomVisible).toHaveBeenCalledWith(true);
            element.scrollHeight = 100;
            foundation.handleHintsChange(['a'], []);
            vi.advanceTimersByTime(200);
            expect(adapter.setBackBottomVisible).toHaveBeenLastCalledWith(false);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('ChatFoundation 文件后缀', () => {
    it('没有 fileInstance 的大写扩展名图片作为 image_url 发送', () => {
        const notifyChatsChange = vi.fn<ChatAdapter['notifyChatsChange']>();
        const foundation = new ChatFoundation({
            getProp: () => [],
            notifyChatsChange,
            notifyMessageSend: () => {},
        } as unknown as ChatAdapter);
        foundation.onMessageSend('', [{ name: 'IMG_0001.JPG', url: 'https://semi.design/a.jpg' }]);
        expect(notifyChatsChange.mock.calls[0][0].at(-1).content).toEqual([{ type: 'image_url', image_url: { url: 'https://semi.design/a.jpg' } }]);
    });
});

describe('InputBoxFoundation.getDisableSend', () => {
    const uploaded = { status: 'success' };

    it('设置了 canSend 时由它决定', () => {
        expect(InputBoxFoundation.getDisableSend('', [], true, true)).toBe(false);
        expect(InputBoxFoundation.getDisableSend('hi', [], false, false)).toBe(true);
    });

    it('需要有内容或已上传附件，且未设置 disableSend', () => {
        expect(InputBoxFoundation.getDisableSend('', [])).toBe(true);
        expect(InputBoxFoundation.getDisableSend('hi', [])).toBe(false);
        expect(InputBoxFoundation.getDisableSend('', [uploaded])).toBe(false);
        expect(InputBoxFoundation.getDisableSend('hi', [uploaded, { status: 'uploading' }])).toBe(true);
        expect(InputBoxFoundation.getDisableSend('hi', [], true)).toBe(true);
    });
});

describe('ChatFoundation 自动滚动', () => {
    function create() {
        const element = { scrollTop: 0, scrollHeight: 500, clientHeight: 100 };
        const foundation = new ChatFoundation({ getContainerRef: () => element, getStates: () => ({}), setBackBottomVisible: () => {} } as unknown as ChatAdapter);
        return { element, foundation };
    }

    function scrollTo(foundation, element, scrollTop) {
        vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
        element.scrollTop = scrollTop;
        foundation.containerScroll({ target: element });
    }

    it.each<[string, Message[] | undefined, Message[], boolean]>([
        ['a message is added', [{ id: '1' }], [{ id: '1' }, { id: '2' }], true],
        ['the first message arrives', undefined, [{ id: '1' }], true],
        ['the last message is still generating', [{ id: '1', status: 'loading' }], [{ id: '1', status: 'loading' }], true],
        ['the last message completes', [{ id: '1', status: 'loading' }], [{ id: '1', status: 'complete' }], true],
        ['a completed list is replaced', [{ id: '1', status: 'complete' }], [{ id: '1', status: 'complete' }], false],
        ['a message is removed', [{ id: '1' }, { id: '2' }], [{ id: '1' }], false],
    ])('当 %s：%s 时滚动到底部', (_, prev, next, scrolls) => {
        const { element, foundation } = create();
        foundation.handleChatsChange(next, prev);
        expect(element.scrollTop).toBe(scrolls ? 500 : 0);
    });

    it('hints 增加时滚动，包括从无到有', () => {
        const { element, foundation } = create();
        foundation.handleHintsChange(['a'], undefined);
        expect(element.scrollTop).toBe(500);
        element.scrollTop = 0;
        foundation.handleHintsChange(undefined, ['a']);
        expect(element.scrollTop).toBe(0);
    });

    it('用户从底部向上滚动后停止跟随', () => {
        const { element, foundation } = create();
        scrollTo(foundation, element, 400);
        scrollTo(foundation, element, 100);
        foundation.handleChatsChange([{ id: '1' }], []);
        expect(element.scrollTop).toBe(100);
    });

    it('内容缩小导致位置下降时保持跟随', () => {
        const { element, foundation } = create();
        scrollTo(foundation, element, 400);
        element.scrollHeight = 300;
        scrollTo(foundation, element, 200);
        foundation.handleChatsChange([{ id: '1' }], []);
        expect(element.scrollTop).toBe(300);
    });

    it('底部重新进入视口时恢复跟随', () => {
        const { element, foundation } = create();
        scrollTo(foundation, element, 400);
        scrollTo(foundation, element, 100);
        scrollTo(foundation, element, 400);
        foundation.handleChatsChange([{ id: '1' }], []);
        expect(element.scrollTop).toBe(500);
    });

    it('向上滚动后点击提示发送，恢复跟随', () => {
        const element = { scrollTop: 0, scrollHeight: 500, clientHeight: 100 };
        const foundation = new ChatFoundation({
            getContainerRef: () => element,
            getStates: () => ({}),
            setBackBottomVisible: () => {},
            getProp: () => [],
            notifyChatsChange: () => {},
            notifyHintClick: () => {},
        } as unknown as ChatAdapter);
        scrollTo(foundation, element, 400);
        scrollTo(foundation, element, 100);
        foundation.onHintClick('hint');
        foundation.handleChatsChange([{ id: '1' }], []);
        expect(element.scrollTop).toBe(500);
    });

    it('内容增长把底部推远但用户未向上滚动时保持跟随', () => {
        const { element, foundation } = create();
        scrollTo(foundation, element, 400);
        element.scrollHeight = 900;
        scrollTo(foundation, element, 400);
        foundation.handleChatsChange([{ id: '1' }], []);
        expect(element.scrollTop).toBe(900);
    });
});

describe('ChatFoundation 点赞与点踩', () => {
    function create(chats: Partial<Message>[]) {
        const adapter = {
            getProp: (key: string) => ({ chats })[key],
            notifyLikeMessage: vi.fn<ChatAdapter['notifyLikeMessage']>(),
            notifyDislikeMessage: vi.fn<ChatAdapter['notifyDislikeMessage']>(),
            notifyChatsChange: vi.fn<ChatAdapter['notifyChatsChange']>(),
        };
        return { adapter, foundation: new ChatFoundation(adapter as unknown as ChatAdapter) };
    }

    it.each(['likeMessage', 'dislikeMessage'])('%s 忽略不在 chats 中的消息', (method) => {
        const { adapter, foundation } = create([{ id: '1' }]);
        expect(() => foundation[method]({ id: 'missing' })).not.toThrow();
        expect(adapter.notifyChatsChange).not.toHaveBeenCalled();
    });

    it('对已知消息切换点赞状态', () => {
        const { adapter, foundation } = create([{ id: '1', dislike: true }]);
        foundation.likeMessage({ id: '1' });
        expect(adapter.notifyChatsChange).toHaveBeenCalledWith([{ id: '1', like: true, dislike: false }]);
    });
});

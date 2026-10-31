import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import type { FileItem, UploadOnChangeProps } from '@fibrae/semi-ui-svelte/upload/interface';
import { Chat } from '../index';
import type { ChatDefaultActionNodeObj, ChatMarkdownRenderProps, ChatMessage, ChatProps } from '../interface';
import ChatHost, { type ChatHostStore } from './chat-host.svelte';
import ChatModes from './chat-modes.svelte';
import CustomStrong from './custom-strong.svelte';

const text = zh_CN.Chat;
const popconfirmText = zh_CN.Popconfirm;

const roleConfig = {
    user: { name: 'User', avatar: 'https://semi.design/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://semi.design/assistant.png' },
    system: { name: 'System', avatar: 'https://semi.design/system.png' },
};

const chats: ChatMessage[] = [
    { role: 'system', id: '1', content: 'system says' },
    { role: 'user', id: '2', content: 'user says' },
    { role: 'assistant', id: '3', content: 'assistant says' },
];

const boxes = (container: Element) => [...container.querySelectorAll<HTMLElement>('.semi-chat-chatBox')];
const textarea = (container: Element) => container.querySelector('textarea') as HTMLTextAreaElement;
const sendButton = (container: Element) => container.querySelector('.semi-chat-inputBox-sendButton') as HTMLButtonElement;
const actionButtons = (box: Element) => [...box.querySelectorAll<HTMLElement>('.semi-chat-chatBox-action-btn')];
const contentArea = (container: Element) => container.querySelector('.semi-chat-container') as HTMLElement;
const root = (container: Element) => container.querySelector('.semi-chat') as HTMLElement;
const attachmentItems = (container: Element) => container.querySelectorAll('.semi-chat-attachment-item');
const filesDrag = { dataTransfer: { types: ['Files'] } };
const file = () => new File(['x'], 'a.txt', { type: 'text/plain' });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Listener<K extends keyof ChatProps> = NonNullable<ChatProps[K]>;

function renderChat(props: Partial<ChatProps> = {}, shown: ChatHostStore['shown'] = {}, initial: Partial<ChatHostStore> = {}) {
    const store = createStore<ChatHostStore>({ chats, roleConfig, shown, props: { ...props }, ...initial });
    const view = render(ChatHost, { props: { store } });
    return { ...view, container: view.container, store, handle: () => view.component.getHandle() as NonNullable<ReturnType<typeof view.component.getHandle>> };
}

async function type(container: Element, value: string) {
    await fireEvent.input(textarea(container), { target: { value } });
}

function mockClipboard(writeText: (value: string) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

// jsdom has no layout: scroll metrics are faked on Element.prototype, scrollTop backed by a map
const scrollProps = ['scrollHeight', 'clientHeight', 'scrollTop'] as const;
let savedDescriptors: Partial<Record<(typeof scrollProps)[number], PropertyDescriptor | undefined>> = {};
function mockScroll({ scrollHeight = 1000, clientHeight = 200 } = {}) {
    const size = { scrollHeight, clientHeight };
    const tops = new WeakMap<Element, number>();
    const isList = (el: Element) => el.classList?.contains('semi-chat-container');
    savedDescriptors = Object.fromEntries(scrollProps.map((key) => [key, Object.getOwnPropertyDescriptor(Element.prototype, key)]));
    Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get(this: Element) {
            return isList(this) ? size.scrollHeight : 0;
        },
    });
    Object.defineProperty(Element.prototype, 'clientHeight', {
        configurable: true,
        get(this: Element) {
            return isList(this) ? size.clientHeight : 0;
        },
    });
    Object.defineProperty(Element.prototype, 'scrollTop', {
        configurable: true,
        get(this: Element) {
            return tops.get(this) ?? 0;
        },
        set(this: Element, value: number) {
            tops.set(this, value);
        },
    });
    return size;
}

function restoreScroll() {
    for (const [key, descriptor] of Object.entries(savedDescriptors)) {
        if (descriptor) {
            Object.defineProperty(Element.prototype, key, descriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, key);
        }
    }
    savedDescriptors = {};
}

const fakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });

beforeEach(() => {
    // Upload previews files through object URLs, which jsdom does not create
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => `blob:${(blob as File).name}`);
});

afterEach(() => {
    restoreScroll();
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
});

describe('Chat 消息', () => {
    it('渲染每个角色的标题、头像与内容', async () => {
        const { container } = renderChat();
        expect(boxes(container)).toHaveLength(3);
        expect([...container.querySelectorAll('.semi-chat-chatBox-title')].map((n) => n.textContent)).toEqual(['System', 'User', 'Assistant']);
        expect([...container.querySelectorAll<HTMLImageElement>('.semi-chat-chatBox-avatar img')].map((n) => n.getAttribute('src'))).toEqual(['https://semi.design/system.png', 'https://semi.design/user.png', 'https://semi.design/assistant.png']);
        expect(await screen.findByText('assistant says')).toBeInTheDocument();
        expect(screen.getByText('system says')).toBeInTheDocument();
        expect(screen.getByText('user says')).toBeInTheDocument();
    });

    it('仅在 align 为 leftRight 时，用户消息靠右', () => {
        const { container, store } = renderChat();
        expect(boxes(container).map((b) => b.classList.contains('semi-chat-chatBox-right'))).toEqual([false, true, false]);
        store.props = { align: 'leftAlign' };
        flushSync();
        expect(container.querySelector('.semi-chat-chatBox-right')).toBeNull();
    });

    it.each([
        ['bubble', [['semi-chat-chatBox-content-bubble'], ['semi-chat-chatBox-content-bubble', 'semi-chat-chatBox-content-user'], ['semi-chat-chatBox-content-bubble']]],
        ['noBubble', [[], [], []]],
        ['userBubble', [[], ['semi-chat-chatBox-content-userBubble', 'semi-chat-chatBox-content-user'], []]],
    ] as const)('mode 为 %s 时设置内容类名', (mode, expected) => {
        const { container } = renderChat({ mode });
        const contents = [...container.querySelectorAll('.semi-chat-chatBox-content')];
        expect(contents.map((n) => [...n.classList].filter((c) => c !== 'semi-chat-chatBox-content'))).toEqual(expected);
    });

    it('同一角色连续消息时隐藏头像与标题', () => {
        const { container } = renderChat({}, {}, { chats: [...chats, { role: 'assistant', id: '4', content: 'more' }] });
        const [, , first, second] = boxes(container);
        expect(first.querySelector('.semi-chat-chatBox-avatar-hidden')).toBeNull();
        expect(first.querySelector('.semi-chat-chatBox-title')).not.toBeNull();
        expect(second.querySelector('.semi-chat-chatBox-avatar-hidden')).not.toBeNull();
        expect(second.querySelector('.semi-chat-chatBox-title')).toBeNull();
    });

    it('前一条消息不再与当前消息同角色时，头像重新显示', () => {
        const second = { role: 'assistant', id: '2', content: 'second' };
        const { container, store } = renderChat({}, {}, { chats: [{ role: 'assistant', id: '1', content: 'first' }, second] });
        expect(boxes(container)[1].querySelector('.semi-chat-chatBox-avatar-hidden')).not.toBeNull();
        store.chats = [{ role: 'user', id: '0', content: 'q' }, second];
        flushSync();
        expect(boxes(container)[1].querySelector('.semi-chat-chatBox-avatar-hidden')).toBeNull();
        expect(boxes(container)[1].querySelector('.semi-chat-chatBox-title')).toHaveTextContent('Assistant');
    });

    it('显示加载与错误状态', () => {
        const { container } = renderChat(
            {},
            {},
            {
                chats: [
                    { role: 'user', id: '1', content: 'oops', status: 'error' },
                    { role: 'assistant', id: '2', content: '', status: 'loading' },
                ],
            }
        );
        expect(container.querySelector('.semi-chat-chatBox-content-loading')).not.toBeNull();
        expect(container.querySelector('.semi-chat-chatBox-content-error')).not.toBeNull();
    });

    it('数组内容渲染为文本、图片与文件', async () => {
        const { container } = renderChat(
            {},
            {},
            {
                chats: [
                    {
                        role: 'user',
                        id: '1',
                        content: [
                            { type: 'text', text: 'look at this' },
                            { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                            { type: 'file_url', file_url: { url: 'https://semi.design/a.pdf', name: 'a.pdf', size: '1KB', type: '' } },
                        ],
                    },
                ],
            }
        );
        expect(await screen.findByText('look at this')).toBeInTheDocument();
        expect(container.querySelector<HTMLImageElement>('.semi-chat-attachment-img img')?.getAttribute('src')).toBe('https://semi.design/a.png');
        const card = container.querySelector('.semi-chat-attachment-file');
        expect(card?.getAttribute('href')).toBe('https://semi.design/a.pdf');
        expect(card).toHaveTextContent('a.pdf');
        expect(card).toHaveTextContent('1KB');
    });

    it('除非 escapeHtml 为 false，否则转义用户消息中的 HTML', async () => {
        const html = { role: 'user', id: '1', content: 'a <b>bold</b> word' };
        const { container, store } = renderChat({}, {}, { chats: [html] });
        expect(container.querySelector('.semi-chat-chatBox-content')).toHaveTextContent('<b>');
        store.props = { escapeHtml: false };
        store.chats = [{ ...html, id: '2' }];
        flushSync();
        await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content')).toHaveTextContent('word'));
        expect(container.querySelector('.semi-chat-chatBox-content')).not.toHaveTextContent('<b>');
    });

    it('使用默认或自定义分隔符渲染 divider 消息', () => {
        const withDivider = [...chats, { role: 'divider', id: 'd' }];
        const plain = renderChat({}, {}, { chats: withDivider });
        expect(plain.container.querySelector('.semi-chat-divider')).toHaveTextContent(text.clearContext);
        plain.unmount();
        const custom = renderChat({}, { divider: true }, { chats: withDivider });
        expect(custom.container.querySelector('hr[data-id="d"]')).not.toBeNull();
        expect(custom.container.querySelector('.semi-chat-divider')).toBeNull();
    });

    it('将 customMarkDownComponents 与 markdownRenderProps 传给 markdown 渲染器', async () => {
        renderChat({ customMarkDownComponents: { strong: CustomStrong }, markdownRenderProps: { class: 'my-md' } }, {}, { chats: [{ role: 'assistant', id: '1', content: 'a **b** c' }] });
        expect(await screen.findByTestId('custom-strong')).toHaveTextContent('b');
        expect(document.querySelector('.my-md')).not.toBeNull();
    });

    it('markdownRenderProps 变化后会作用到已渲染的消息', () => {
        const { container, store } = renderChat({ markdownRenderProps: { class: 'md-a' } });
        expect(container.querySelectorAll('.md-a')).toHaveLength(3);
        store.props = { markdownRenderProps: { class: 'md-b' } };
        flushSync();
        expect(container.querySelectorAll('.md-b')).toHaveLength(3);
    });

    it('customMarkDownComponents 中的 undefined 项回退到内置组件', () => {
        const { container } = renderChat({ customMarkDownComponents: { code: undefined } }, {}, { chats: [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }] });
        expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-type')).toHaveTextContent('js');
    });

    it('markdownRenderProps 不接受由每条消息决定的 raw、components', () => {
        expectTypeOf<ChatMarkdownRenderProps>().not.toHaveProperty('raw');
        expectTypeOf<ChatMarkdownRenderProps>().not.toHaveProperty('components');
        expectTypeOf<ChatMarkdownRenderProps>().toHaveProperty('format');
    });

    it('文件卡片的类型取小写扩展名，没有扩展名时取 MIME 子类型而不是文件名', () => {
        const fileMessage = (name: string, mime = '') => ({ type: 'file_url' as const, file_url: { url: `https://semi.design/${name}`, name, size: '1KB', type: mime } });
        const { container } = renderChat({}, {}, { chats: [{ role: 'user', id: '1', content: [fileMessage('Makefile'), fileMessage('README', 'text/plain'), fileMessage('a.PDF')] }] });
        expect([...container.querySelectorAll('.semi-chat-attachment-file-type')].map((n) => n.textContent)).toEqual(['', 'plain', 'pdf']);
    });

    it('代码围栏的语言含连字符时语言栏显示完整语言 id', () => {
        const { container } = renderChat({}, {}, { chats: [{ role: 'assistant', id: '1', content: '```objective-c\nint x = 1;\n```' }] });
        expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-type')?.textContent).toBe('objective-c');
    });

    it('带语言的代码围栏经高亮组件渲染，code 元素上没有 markdown 节点属性', async () => {
        const { container } = renderChat({}, {}, { chats: [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }] });
        await waitFor(() => expect(container.querySelector('code')).not.toBeNull());
        for (const code of container.querySelectorAll('code')) {
            expect(code).not.toHaveAttribute('node');
        }
        await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content-code .semi-codeHighlight')).not.toBeNull());
    });

    it('渲染时没有控制台警告与报错', async () => {
        const warn = vi.spyOn(console, 'warn');
        const error = vi.spyOn(console, 'error');
        renderChat(
            { hints: undefined },
            {},
            {
                chats: [
                    ...chats,
                    {
                        role: 'user',
                        id: '4',
                        content: [
                            { type: 'text', text: 'one' },
                            { type: 'text', text: 'two' },
                            { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                        ],
                    },
                ],
                hints: ['next'],
            }
        );
        expect(await screen.findByText('two')).toBeInTheDocument();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });
});

describe('Chat 消息插槽', () => {
    it('以默认节点调用每个 snippet', () => {
        const { container } = renderChat({}, { title: true, avatar: true, content: true, action: true }, {});
        expect([...container.querySelectorAll('.custom-title')].map((n) => n.textContent?.trim())).toEqual(['System!', 'User!', 'Assistant!']);
        expect([...container.querySelectorAll('.custom-avatar')].map((n) => n.textContent?.trim())).toEqual(['System', 'User', 'Assistant']);
        expect(container.querySelectorAll('.custom-content.semi-chat-chatBox-content-bubble')).toHaveLength(3);
        expect([...container.querySelectorAll('.custom-action')].map((n) => n.textContent?.trim())).toEqual(['copyNode,likeNode,dislikeNode,deleteNode', 'copyNode,deleteNode', 'copyNode,likeNode,dislikeNode,resetNode,deleteNode']);
        expect(container.querySelector('.custom-action')?.classList).toContain('semi-chat-chatBox-action');
    });

    it('action 的 defaultActions 渲染回去后仍可操作', async () => {
        const onMessageGoodFeedback = vi.fn<Listener<'onMessageGoodFeedback'>>();
        const { container } = renderChat({ onMessageGoodFeedback }, { action: true }, { withDefaults: true });
        const buttons = actionButtons(boxes(container)[2]);
        expect(buttons).toHaveLength(5);
        await fireEvent.click(buttons[1]);
        expect(onMessageGoodFeedback).toHaveBeenCalledTimes(1);
        expect(onMessageGoodFeedback.mock.calls[0][0].id).toBe('3');
    });

    it('ChatDefaultActionNodeObj 的键都是可选的', () => {
        expectTypeOf<ChatDefaultActionNodeObj>().toHaveProperty('deleteNode');
        expectTypeOf<Record<never, never>>().toExtend<ChatDefaultActionNodeObj>();
    });

    it('fullChatBox 接收默认节点', () => {
        const { container } = renderChat({}, { fullChatBox: true });
        expect(container.querySelectorAll('.custom-full')).toHaveLength(3);
        expect(container.querySelector('.custom-full.semi-chat-chatBox-right')).toHaveTextContent('User user says');
        expect(container.querySelector('.semi-chat-chatBox-action')).toBeNull();
    });

    it('fullChatBox 的 defaultNodes 原样渲染时与默认 DOM 一致', () => {
        // Svelte hydration markers differ with the snippet nesting and are not part of the output contract
        const html = (container: Element) =>
            contentArea(container)
                .innerHTML.replaceAll('<!---->', '')
                .replaceAll(/semi-tooltip-\w+/g, 'semi-tooltip')
                .replaceAll(/\s+/g, ' ');
        const plain = renderChat();
        const expected = html(plain.container);
        plain.unmount();
        const { container } = renderChat({}, { fullChatBox: true }, { withDefaults: true });
        expect(html(container).replaceAll('custom-full ', '')).toBe(expected);
    });

    it('fullChatBox 的默认节点使用自定义的 avatar 与 title', () => {
        const { container } = renderChat({}, { fullChatBox: true, avatar: true, title: true });
        expect(container.querySelector('.semi-chat-chatBox-avatar')).toBeNull();
        expect(container.querySelector('.semi-chat-chatBox-title')).toBeNull();
        expect([...container.querySelectorAll('.custom-title')].map((n) => n.textContent?.trim())).toEqual(['System!', 'User!', 'Assistant!']);
    });

    it('提供但为空的 avatar 不渲染头像，title 替换标题', () => {
        const store = createStore<ChatHostStore>({ chats: [{ role: 'assistant', id: '1', content: 'answer' }], roleConfig, shown: { title: true } });
        const { container } = render(ChatHost, { props: { store } });
        expect(container.querySelector('.semi-chat-chatBox-title')).toBeNull();
        expect(container.querySelector('.custom-title')).toHaveTextContent('Assistant');
    });

    it('roleAvatar 渲染没有图片的头像内容，color 传给 Avatar', () => {
        const { container } = renderChat({}, { roleAvatar: true }, { roleConfig: { ...roleConfig, assistant: { name: 'Assistant', color: 'red' } } });
        const avatar = boxes(container)[2].querySelector('.semi-chat-chatBox-avatar') as HTMLElement;
        expect(avatar).toHaveClass('semi-avatar-red');
        expect(within(avatar).getByText('A')).toHaveClass('initial');
    });
});

describe('Chat 输入框', () => {
    it('发送输入的内容并清空输入框', async () => {
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onInputChange = vi.fn<Listener<'onInputChange'>>();
        const { container, store } = renderChat({ onMessageSend, onChatsChange, onInputChange });
        expect(sendButton(container)).toBeDisabled();
        await type(container, 'hello');
        expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: 'hello', attachment: [] });
        expect(sendButton(container)).not.toBeDisabled();
        await fireEvent.click(sendButton(container));
        expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hello', []);
        const sent = [...chats, { role: 'user', id: expect.any(String), createAt: expect.any(Number), content: 'hello' }];
        expect(onChatsChange).toHaveBeenCalledExactlyOnceWith(sent);
        expect(store.chats).toHaveLength(4);
        expect(textarea(container).value).toBe('');
    });

    it.each([
        ['enter', false, 1],
        ['enter', true, 0],
        ['shift+enter', false, 0],
        ['shift+enter', true, 1],
    ] as const)('sendHotKey 为 %s、shiftKey 为 %s 时发送 %i 次', async (sendHotKey, shiftKey, times) => {
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const { container } = renderChat({ onMessageSend, sendHotKey });
        await type(container, 'hello');
        await fireEvent.keyDown(textarea(container), { key: 'Enter', keyCode: 13, shiftKey });
        expect(onMessageSend).toHaveBeenCalledTimes(times);
    });

    it('canSend 覆盖内部的发送状态', async () => {
        const { container, store } = renderChat({ canSend: true });
        expect(sendButton(container)).not.toBeDisabled();
        store.props = { canSend: false };
        await type(container, 'hello');
        expect(sendButton(container)).toBeDisabled();
        store.props = { canSend: true };
        flushSync();
        expect(sendButton(container)).not.toBeDisabled();
    });

    it('点击输入区域时聚焦 textarea', async () => {
        const { container } = renderChat();
        await fireEvent.click(container.querySelector('.semi-chat-inputBox-inner') as Element);
        expect(document.activeElement).toBe(textarea(container));
    });

    it('应用 placeholder、inputBoxCls、inputBoxStyle、snippet、class 与 style', () => {
        const { container } = renderChat({ placeholder: 'Ask me', inputBoxCls: 'my-input', inputBoxStyle: 'color: red', class: 'my-chat', style: 'width: 300px' }, { topSlot: true, bottomSlot: true });
        expect(textarea(container).placeholder).toBe('Ask me');
        expect(container.querySelector('.semi-chat-inputBox.my-input')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root(container)).toHaveClass('semi-chat', 'my-chat');
        expect(root(container)).toHaveStyle({ width: '300px' });
        expect(screen.getByTestId('top')).toBeInTheDocument();
        expect(screen.getByTestId('bottom')).toBeInTheDocument();
    });

    it('inputArea 接收默认节点及发送与清空处理函数', async () => {
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onClear = vi.fn<Listener<'onClear'>>();
        const { container, store } = renderChat({ onMessageSend, onChatsChange, onClear }, { inputArea: true });
        expect(screen.getByTestId('send').querySelector('.semi-chat-inputBox-sendButton')).not.toBeNull();
        expect(screen.getByTestId('upload').querySelector('.semi-chat-inputBox-uploadButton')).not.toBeNull();
        expect(screen.getByTestId('clear').querySelector('.semi-chat-inputBox-clearButton')).not.toBeNull();
        expect(within(screen.getByTestId('input')).getByRole('textbox')).toBeInTheDocument();
        await fireEvent.click(screen.getByText('send it'));
        expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('custom', []);
        expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'custom' })]);
        await fireEvent.click(screen.getByText('clear it'));
        expect(onClear).toHaveBeenCalledTimes(1);
        await fireEvent.click(screen.getByText('focus it'));
        expect(document.activeElement).toBe(textarea(container));

        store.withDefaults = true;
        flushSync();
        expect(within(screen.getByTestId('default')).getByRole('textbox')).toBeInTheDocument();
    });

    it('inputArea 中的输入节点照常输入并发送', async () => {
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const { container } = renderChat({ onMessageSend }, { inputArea: true });
        await type(container, 'typed');
        await fireEvent.click(sendButton(container));
        expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('typed', []);
    });
});

describe('Chat 停止与清空', () => {
    const generating: ChatMessage[] = [...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'thinking', status: 'incomplete' }];

    it('最后一条消息生成中时显示停止按钮', async () => {
        const onStopGenerator = vi.fn<Listener<'onStopGenerator'>>();
        const { container, store } = renderChat({ showStopGenerate: true, onStopGenerator }, {}, { chats: generating });
        const stop = container.querySelector('.semi-chat-action-stop') as HTMLElement;
        expect(stop).toHaveTextContent(text.stop);
        await type(container, 'hello');
        expect(sendButton(container)).toBeDisabled();
        await fireEvent.click(stop);
        expect(onStopGenerator).toHaveBeenCalledTimes(1);
        expect(onStopGenerator.mock.calls[0][0]).toBeInstanceOf(MouseEvent);

        store.props = { showStopGenerate: false };
        flushSync();
        expect(container.querySelector('.semi-chat-action-stop')).toBeNull();
        expect(sendButton(container)).not.toBeDisabled();
    });

    it('生成结束时，持有焦点的停止按钮把焦点交给输入框', async () => {
        const { container, store } = renderChat({ showStopGenerate: true }, {}, { chats: generating });
        (container.querySelector('.semi-chat-action-stop') as HTMLElement).focus();
        store.chats = [...chats.slice(0, 2), { ...generating[2], status: 'complete' }];
        flushSync();
        await waitFor(() => expect(container.querySelector('.semi-chat-action-stop')).toBeNull());
        expect(document.activeElement).toBe(textarea(container));
    });

    it('clear context 追加分隔符并触发 clear', async () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onClear = vi.fn<Listener<'onClear'>>();
        const { container } = renderChat({ showClearContext: true, onChatsChange, onClear });
        await fireEvent.click(container.querySelector('.semi-chat-inputBox-clearButton') as Element);
        expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats, { role: 'divider', id: expect.any(String), createAt: expect.any(Number) }]);
        expect(onClear).toHaveBeenCalledTimes(1);
        // the divider is already last, so a second clear adds nothing
        await fireEvent.click(container.querySelector('.semi-chat-inputBox-clearButton') as Element);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('默认没有清空按钮', () => {
        const { container } = renderChat();
        expect(container.querySelector('.semi-chat-inputBox-clearButton')).toBeNull();
    });
});

describe('Chat 消息操作', () => {
    it('仅图标按钮的名称来自语言包', () => {
        const { container } = renderChat();
        const [, user, assistant] = boxes(container).map((box) => within(box));
        for (const name of [text.copy, text.delete]) {
            expect(user.getByRole('button', { name })).toBeInTheDocument();
        }
        for (const name of [text.copy, text.like, text.dislike, text.regenerate, text.delete]) {
            expect(assistant.getByRole('button', { name })).toBeInTheDocument();
        }
        expect(screen.getByRole('button', { name: text.send })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: text.upload })).toBeInTheDocument();
    });

    it('用户消息显示复制与删除，其他消息显示反馈，仅最后一条 assistant 消息显示 reset', () => {
        const { container } = renderChat();
        expect(boxes(container).map((b) => actionButtons(b).length)).toEqual([4, 2, 5]);
        expect(container.querySelectorAll('.semi-chat-chatBox-action-icon-redo')).toHaveLength(1);
        expect(boxes(container)[2].querySelector('.semi-chat-chatBox-action-show')).not.toBeNull();
    });

    it('未完成的消息隐藏操作按钮', () => {
        const { container } = renderChat({}, {}, { chats: [{ role: 'assistant', id: '1', content: 'x', status: 'loading' }] });
        const action = container.querySelector('.semi-chat-chatBox-action') as HTMLElement;
        expect(action).toHaveClass('semi-chat-chatBox-action-hidden');
        expect(actionButtons(action)).toHaveLength(2);
        expect(action.querySelector('.semi-chat-chatBox-action-icon-redo')).not.toBeNull();
    });

    it('复制消息文本并提示成功', async () => {
        const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const onMessageCopy = vi.fn<Listener<'onMessageCopy'>>();
        const { container } = renderChat({ onMessageCopy });
        await fireEvent.click(actionButtons(boxes(container)[2])[0]);
        expect(writeText).toHaveBeenCalledWith('assistant says');
        const toast = await screen.findByText(text.copySuccess);
        expect(toast.closest('.semi-chat-toast')).not.toBeNull();
        expect(toast.closest('[role="log"]')).toBeNull();
        await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));
        expect(onMessageCopy.mock.calls[0][0].id).toBe('3');
    });

    it('写入完成前或失败时不触发 onMessageCopy', async () => {
        let resolveWrite = () => {};
        const writeText = vi.fn<(value: string) => Promise<void>>(() => new Promise((resolve) => (resolveWrite = resolve)));
        mockClipboard(writeText);
        const onMessageCopy = vi.fn<Listener<'onMessageCopy'>>();
        const { container } = renderChat({ onMessageCopy });
        await fireEvent.click(actionButtons(boxes(container)[2])[0]);
        expect(onMessageCopy).not.toHaveBeenCalled();
        resolveWrite();
        await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));

        writeText.mockImplementation(() => Promise.reject(new Error('denied')));
        await fireEvent.click(actionButtons(boxes(container)[2])[0]);
        await sleep(20);
        expect(onMessageCopy).toHaveBeenCalledTimes(1);
        expect(screen.getAllByText(text.copySuccess)).toHaveLength(1);
    });

    it('数组内容复制为拼接后的文本', async () => {
        const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const message: ChatMessage = {
            role: 'assistant',
            id: '1',
            content: [
                { type: 'text', text: 'a' },
                { type: 'text', text: 'b' },
            ],
        };
        const { container } = renderChat({}, {}, { chats: [message] });
        await fireEvent.click(actionButtons(container)[0]);
        expect(writeText).toHaveBeenCalledWith('ab');
    });

    it.each([
        ['缺失', undefined],
        ['空字符串', ''],
        ['只有图片', [{ type: 'image_url', image_url: { url: 'https://example.com/a.png' } }]],
    ] as const)('内容%s时点复制不写入、不提示、不触发 onMessageCopy', async (_name, content) => {
        const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const onMessageCopy = vi.fn<Listener<'onMessageCopy'>>();
        const { container } = renderChat({ onMessageCopy }, {}, { chats: [{ role: 'assistant', id: '1', content } as ChatMessage] });
        await fireEvent.click(actionButtons(container)[0]);
        await sleep(20);
        expect(writeText).not.toHaveBeenCalled();
        expect(screen.queryByText(text.copySuccess)).toBeNull();
        expect(onMessageCopy).not.toHaveBeenCalled();
    });

    it('like 与 dislike 通过 onChatsChange 切换标记，并写回 chats', async () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onMessageGoodFeedback = vi.fn<Listener<'onMessageGoodFeedback'>>();
        const onMessageBadFeedback = vi.fn<Listener<'onMessageBadFeedback'>>();
        const liked = [...chats.slice(0, 2), { ...chats[2], like: true }];
        const { container, store } = renderChat({ onChatsChange, onMessageGoodFeedback, onMessageBadFeedback }, {}, { chats: liked });
        const [, like, dislike] = actionButtons(boxes(container)[2]);
        expect(like.querySelector('.semi-icon-like_thumb')).not.toBeNull();
        await fireEvent.click(like);
        expect(onMessageGoodFeedback.mock.calls[0][0].id).toBe('3');
        expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), { ...chats[2], like: false, dislike: false }]);
        expect(store.chats?.[2].like).toBe(false);
        await fireEvent.click(dislike);
        expect(onMessageBadFeedback).toHaveBeenCalledTimes(1);
        expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), { ...chats[2], like: false, dislike: true }]);
        expect(actionButtons(boxes(container)[2])[2].querySelector('.semi-icon-like_thumb')).not.toBeNull();
    });

    it('reset 将最后一条消息替换为 loading 消息', async () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onMessageReset = vi.fn<Listener<'onMessageReset'>>();
        const { container } = renderChat({ onChatsChange, onMessageReset });
        await fireEvent.click(actionButtons(boxes(container)[2])[3]);
        expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats.slice(0, 2), { ...chats[2], status: 'loading', content: '', like: false, dislike: false, id: expect.any(String), createAt: expect.any(Number) }]);
        expect(onChatsChange.mock.calls[0][0][2].id).not.toBe('3');
        expect(onMessageReset.mock.calls[0][0]?.id).toBe('3');
    });

    it('delete 先请求确认，再删除消息', async () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onMessageDelete = vi.fn<Listener<'onMessageDelete'>>();
        const { container, store } = renderChat({ onChatsChange, onMessageDelete });
        await fireEvent.click(actionButtons(boxes(container)[1])[1]);
        expect(await screen.findByText(text.deleteConfirm)).toBeInTheDocument();
        expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).not.toBeNull();
        await fireEvent.click(screen.getByRole('button', { name: popconfirmText.confirm }));
        expect(onMessageDelete.mock.calls[0][0].id).toBe('2');
        expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([chats[0], chats[2]]);
        expect(store.chats).toHaveLength(2);
        await waitFor(() => expect(boxes(container)).toHaveLength(2));
    });

    it('在删除按钮外按下鼠标会关闭确认框', async () => {
        const onMessageDelete = vi.fn<Listener<'onMessageDelete'>>();
        const { container } = renderChat({ onMessageDelete });
        await fireEvent.click(actionButtons(boxes(container)[1])[1]);
        await screen.findByText(text.deleteConfirm);
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).toBeNull());
        expect(onMessageDelete).not.toHaveBeenCalled();
    });

    it('按 Escape 关闭确认框', async () => {
        const { container } = renderChat();
        await fireEvent.click(actionButtons(boxes(container)[1])[1]);
        await screen.findByText(text.deleteConfirm);
        await fireEvent.keyDown(actionButtons(boxes(container)[1])[1], { key: 'Escape' });
        await waitFor(() => expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).toBeNull());
    });

    it('使用方没有同步删除消息时，确认后确认框也会关闭', async () => {
        // the function binding rejects the write, so the confirmed message stays
        const store = createStore({ chats: chats as ChatMessage[] | undefined, roleConfig, accept: false, log: [] as string[] });
        const { container } = render(ChatModes, { props: { mode: 'function', store } });
        await fireEvent.click(actionButtons(boxes(container)[1])[1]);
        await screen.findByText(text.deleteConfirm);
        await fireEvent.click(screen.getByRole('button', { name: popconfirmText.confirm }));
        expect(store.log).toEqual(['set 2', 'change 2']);
        expect(boxes(container)).toHaveLength(3);
        await waitFor(() => expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).toBeNull());
        await waitFor(() => expect(screen.queryByText(text.deleteConfirm)).toBeNull());
        await fireEvent.click(actionButtons(boxes(container)[1])[1]);
        expect(await screen.findByText(text.deleteConfirm)).toBeInTheDocument();
    });

    it('点赞与点踩按钮用 aria-pressed 表示状态，其余操作不带', () => {
        const { container } = renderChat({}, {}, { chats: [...chats.slice(0, 2), { ...chats[2], like: true }] });
        const [copy, like, dislike] = actionButtons(boxes(container)[2]);
        expect(like).toHaveAttribute('aria-pressed', 'true');
        expect(dislike).toHaveAttribute('aria-pressed', 'false');
        expect(copy).not.toHaveAttribute('aria-pressed');
    });

    it('删除按钮本身带有确认弹层状态，外层包裹元素不带', () => {
        const { container } = renderChat();
        const triggers = container.querySelectorAll('.semi-chat-chatBox-action [aria-haspopup="dialog"]');
        expect(triggers.length).toBeGreaterThan(0);
        for (const trigger of triggers) {
            expect(trigger.tagName).toBe('BUTTON');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(trigger).not.toHaveAttribute('tabindex', '-1');
        }
    });
});

describe('Chat 代码块复制按钮', () => {
    const codeChats = [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }];
    const copyButton = (container: Element) => container.querySelector<HTMLElement>('.semi-chat-chatBox-content-code-topSlot-copy-wrapper') as HTMLElement;

    it('保持按钮焦点，复制后更新其名称', async () => {
        const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
        mockClipboard(writeText);
        const { container } = renderChat({}, {}, { chats: codeChats });
        const button = copyButton(container);
        expect(button).toHaveAccessibleName(text.copy);
        button.focus();
        await fireEvent.click(button);
        await waitFor(() => expect(button).toHaveAccessibleName(text.copied));
        expect(document.activeElement).toBe(button);
        await fireEvent.click(button);
        expect(writeText).toHaveBeenCalledTimes(1);
        expect(writeText).toHaveBeenCalledWith('const a = 1;\n');
    });

    it('没有语言的代码不带语言栏', () => {
        const { container } = renderChat({}, {}, { chats: [{ role: 'assistant', id: '1', content: 'use `inline` code' }] });
        expect(container.querySelector('.semi-chat-chatBox-content-code')).toBeNull();
        expect(container.querySelector('code')).toHaveTextContent('inline');
    });
});

describe('Chat 提示', () => {
    it('点击提示会以用户消息发送', async () => {
        const onHintClick = vi.fn<Listener<'onHintClick'>>();
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const { container } = renderChat({ onHintClick, onChatsChange, hintCls: 'my-hints', hintStyle: 'color: red' }, {}, { hints: ['first', 'second'] });
        const section = container.querySelector('.semi-chat-hints');
        expect(section).toHaveClass('my-hints');
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await fireEvent.click(screen.getByText('second'));
        expect(onHintClick).toHaveBeenCalledExactlyOnceWith('second');
        expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats, { role: 'user', id: expect.any(String), createAt: expect.any(Number), content: 'second' }]);
    });

    it('每个提示渲染为原生 button，以便键盘可达', () => {
        renderChat({}, {}, { hints: ['first', 'second'] });
        const items = [...document.querySelectorAll('.semi-chat-hint-item')];
        expect(items.map((item) => item.tagName)).toEqual(['BUTTON', 'BUTTON']);
        expect(items[0]).toHaveAttribute('type', 'button');
        expect(screen.getByText('second').closest('button')).toBe(items[1]);
    });

    it('hintBox 渲染每个提示及其点击处理函数', async () => {
        const onHintClick = vi.fn<Listener<'onHintClick'>>();
        renderChat({ onHintClick }, { hintBox: true }, { hints: ['a', 'b'] });
        await fireEvent.click(screen.getByText('1:b'));
        expect(onHintClick).toHaveBeenCalledExactlyOnceWith('b');
    });

    it('没有提示时不渲染提示区域，提示可在挂载后出现与消失', () => {
        const { container, store } = renderChat({}, {}, { hints: [] });
        expect(container.querySelector('.semi-chat-hints')).toBeNull();
        store.hints = ['a'];
        flushSync();
        expect(container.querySelector('.semi-chat-hints')).toHaveTextContent('a');
        store.hints = undefined;
        flushSync();
        expect(container.querySelector('.semi-chat-hints')).toBeNull();
    });
});

describe('Chat 上传', () => {
    const paste = (container: Element, pasted = file()) => fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile: () => pasted }] } });
    const pick = (container: Element) => fireEvent.change(container.querySelector('input[type="file"]') as Element, { target: { files: [file()] } });

    it('默认显示上传按钮，click upload 关闭时隐藏', () => {
        const { container, store } = renderChat();
        expect(container.querySelector('.semi-chat-inputBox-uploadButton')).not.toBeNull();
        store.props = { enableUpload: false };
        flushSync();
        expect(container.querySelector('.semi-chat-inputBox-upload')).toBeNull();
        store.props = { enableUpload: { clickUpload: false } };
        flushSync();
        expect(container.querySelector('.semi-chat-inputBox-upload')).toBeNull();
    });

    it('使用 uploadButton 与 uploadProps 的 class', () => {
        const { container } = renderChat({ uploadProps: { class: 'my-upload' } }, { uploadButton: true });
        expect(container.querySelector('.semi-chat-inputBox-upload.my-upload')).not.toBeNull();
        expect(screen.getByTestId('trigger')).toBeInTheDocument();
        expect(container.querySelector('.semi-chat-inputBox-uploadButton')).toBeNull();
    });

    it('uploadTip 给默认上传按钮加提示，按钮本身是唯一的 Tab 停靠点', async () => {
        const { container } = renderChat({}, { uploadTip: true });
        const upload = container.querySelector('.semi-chat-inputBox-upload') as HTMLElement;
        const stops = upload.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
        expect([...stops]).toEqual([container.querySelector('.semi-chat-inputBox-uploadButton')]);
        await fireEvent.mouseEnter(stops[0]);
        const tip = await screen.findByText('tip text');
        await waitFor(() => expect(stops[0]).toHaveAttribute('aria-describedby', tip.closest('[role="tooltip"]')?.id));
    });

    it('带提示的 uploadButton 渲染不可聚焦内容时，Upload 的添加区是唯一的 Tab 停靠点', async () => {
        const onOpenFileDialog = vi.fn<() => void>();
        const { container } = renderChat({ uploadProps: { onOpenFileDialog } }, { uploadTip: true, uploadButton: true });
        const upload = container.querySelector('.semi-chat-inputBox-upload') as HTMLElement;
        const addArea = upload.querySelector('.semi-upload-add') as HTMLElement;
        await waitFor(() => expect(addArea).toHaveAttribute('role', 'button'));
        expect([...upload.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')]).toEqual([addArea]);
        expect(screen.getByTestId('trigger').closest('[data-popupid]')).not.toBeNull();
        await fireEvent.keyDown(addArea, { key: 'Enter' });
        expect(onOpenFileDialog).toHaveBeenCalledOnce();
    });

    it('uploadProps.disabled 时默认上传按钮暴露禁用状态', () => {
        const uploadButton = (container: Element) => container.querySelector('.semi-chat-inputBox-uploadButton') as HTMLElement;
        const { container, store } = renderChat({ uploadProps: { disabled: true } });
        expect(uploadButton(container)).toHaveAttribute('aria-disabled', 'true');
        store.props = {};
        flushSync();
        expect(uploadButton(container)).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('uploadProps 的 Upload 监听照常调用', async () => {
        const onSuccess = vi.fn<(body: unknown) => void>();
        const { container } = renderChat({ uploadProps: { customRequest: ({ onSuccess: done }) => done({ ok: 1 }), onSuccess } });
        await pick(container);
        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
        expect(onSuccess.mock.calls[0][0]).toEqual({ ok: 1 });
    });

    it('只传 uploadTipProps 也给上传按钮加 Tooltip，两者都不传时不加', () => {
        const uploadButton = (container: Element) => container.querySelector('.semi-chat-inputBox-uploadButton') as HTMLElement;
        const { container, store } = renderChat({ uploadTipProps: { position: 'top' } });
        expect(uploadButton(container)).toHaveAttribute('data-popupid');
        store.props = {};
        flushSync();
        expect(uploadButton(container)).not.toHaveAttribute('data-popupid');
    });

    it('选中的文件变为附件，上传完成前阻止发送', async () => {
        const onInputChange = vi.fn<Listener<'onInputChange'>>();
        const onChange = vi.fn<(change: UploadOnChangeProps) => void>();
        const { container } = renderChat({ onInputChange, uploadProps: { uploadTrigger: 'custom', onChange } });
        await pick(container);
        await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        expect(container.querySelector('.semi-chat-attachment-file')).toHaveTextContent('a.txt');
        expect(onChange).toHaveBeenCalled();
        expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: '', attachment: [expect.objectContaining({ name: 'a.txt' })] });
        expect(sendButton(container)).toBeDisabled();
        await fireEvent.click(container.querySelector('.semi-chat-attachment-clear') as Element);
        expect(attachmentItems(container)).toHaveLength(0);
        expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: '', attachment: [] });
    });

    it('移除附件时 uploadProps.onChange 只收到一次移除后的 fileList 与被移除项', async () => {
        const onChange = vi.fn<(change: UploadOnChangeProps) => void>();
        const { container } = renderChat({ uploadProps: { uploadTrigger: 'custom', onChange } });
        await pick(container);
        await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        onChange.mockClear();
        await fireEvent.click(container.querySelector('.semi-chat-attachment-clear') as Element);
        expect(onChange).toHaveBeenCalledExactlyOnceWith({ fileList: [], currentFile: expect.objectContaining({ name: 'a.txt' }) });
    });

    it('拖拽经过时显示放置区，放下后上传文件', async () => {
        const { container } = renderChat({ uploadProps: { uploadTrigger: 'custom' } });
        await fireEvent.dragOver(root(container), filesDrag);
        const dropArea = container.querySelector('.semi-chat-dropArea') as Element;
        expect(dropArea).toHaveTextContent(text.dropAreaText);
        await fireEvent.drop(dropArea, { dataTransfer: { files: [file()] } });
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
    });

    it('在页面内部拖拽不会打开放置区', async () => {
        const { container } = renderChat();
        await fireEvent.dragStart(root(container));
        await fireEvent.dragOver(root(container), filesDrag);
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        await fireEvent.dragEnd(root(container));
        await fireEvent.dragOver(root(container), filesDrag);
        expect(container.querySelector('.semi-chat-dropArea')).not.toBeNull();
    });

    it('拖拽文本或链接时不显示放置区', async () => {
        const { container } = renderChat();
        await fireEvent.dragOver(root(container), { dataTransfer: { types: ['text/plain'] } });
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });

    it('离开放置区后隐藏', async () => {
        const { container } = renderChat({}, {}, { chats: [] });
        await fireEvent.dragOver(root(container), filesDrag);
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        await fireEvent.dragLeave(container.querySelector('.semi-chat-dropArea') as Element, { relatedTarget: document.body });
        vi.advanceTimersByTime(10);
        flushSync();
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });

    it('drag upload 关闭时没有放置区，根元素的拖拽监听照常执行', async () => {
        const ondragover = vi.fn<(event: DragEvent) => void>();
        const { container } = renderChat({ enableUpload: { dragUpload: false }, ondragover });
        await fireEvent.dragOver(root(container), filesDrag);
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        expect(ondragover).toHaveBeenCalledTimes(1);
    });

    it('根元素的拖拽监听与放置区处理都会执行，放置区处理在前', async () => {
        const ondragover = vi.fn<(event: DragEvent) => void>((event) => event.stopImmediatePropagation());
        const ondragstart = vi.fn<(event: DragEvent) => void>();
        const ondragend = vi.fn<(event: DragEvent) => void>();
        const { container } = renderChat({ ondragover, ondragstart, ondragend }, {}, { chats: [] });
        await fireEvent.dragOver(root(container), filesDrag);
        expect(ondragover).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-chat-dropArea')).not.toBeNull();
        await fireEvent.dragStart(root(container));
        await fireEvent.dragEnd(root(container));
        expect(ondragstart).toHaveBeenCalledTimes(1);
        expect(ondragend).toHaveBeenCalledTimes(1);
    });

    it('粘贴文件时上传，paste upload 关闭时除外', async () => {
        const { container, store } = renderChat({ uploadProps: { uploadTrigger: 'custom' } });
        await paste(container);
        await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        store.props = { enableUpload: { pasteUpload: false }, uploadProps: { uploadTrigger: 'custom' } };
        flushSync();
        await paste(container);
        await sleep(20);
        expect(attachmentItems(container)).toHaveLength(1);
    });

    it('粘贴时每个剪贴板项只读取一次文件', async () => {
        const getAsFile = vi.fn<() => File>(() => file());
        const { container } = renderChat({ uploadProps: { uploadTrigger: 'custom' } });
        await fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile }] } });
        await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        expect(getAsFile).toHaveBeenCalledTimes(1);
    });

    describe('只关闭点击上传', () => {
        const uploadProps = { uploadTrigger: 'custom' as const };

        it('拖拽放下的文件仍成为附件，且不渲染上传按钮', async () => {
            const { container } = renderChat({ enableUpload: { clickUpload: false }, uploadProps });
            await fireEvent.dragOver(root(container), filesDrag);
            await fireEvent.drop(container.querySelector('.semi-chat-dropArea') as Element, { dataTransfer: { files: [file()] } });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).toBeNull();
        });

        it('粘贴的文件仍成为附件', async () => {
            const { container } = renderChat({ enableUpload: { clickUpload: false }, uploadProps });
            await paste(container);
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        });

        it('三种上传方式都关闭时不渲染上传节点', () => {
            const { container } = renderChat({ enableUpload: false });
            expect(container.querySelector('.semi-upload')).toBeNull();
        });
    });

    it('uploadProps.disabled 时粘贴的文件不会成为附件，拖拽也不显示放置区', async () => {
        const { container } = renderChat({ uploadProps: { disabled: true, uploadTrigger: 'custom' } });
        await paste(container);
        await fireEvent.dragOver(root(container), filesDrag);
        await sleep(20);
        expect(attachmentItems(container)).toHaveLength(0);
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });

    it('附件作为 content parts 发送', () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const { handle } = renderChat({ onChatsChange, onMessageSend });
        // Only the fields the message builder reads; the rest of FileItem is left out
        const attachment = [
            { name: 'a.png', url: 'https://semi.design/a.png', fileInstance: { type: 'image/png' } },
            { name: 'b.pdf', url: 'https://semi.design/b.pdf', size: '1KB', fileInstance: { type: 'application/pdf' } },
        ] as unknown as FileItem[];
        handle().sendMessage('see', attachment);
        expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('see', attachment);
        expect(onChatsChange.mock.calls[0][0].at(-1)?.content).toEqual([
            { type: 'text', text: 'see' },
            { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
            { type: 'file_url', file_url: { url: 'https://semi.design/b.pdf', name: 'b.pdf', size: '1KB', type: 'application/pdf' } },
        ]);
    });
});

describe('Chat 滚动', () => {
    it('挂载时及新增消息时滚动到底部', () => {
        const size = mockScroll();
        const { container, store } = renderChat();
        expect(contentArea(container).scrollTop).toBe(1000);
        size.scrollHeight = 1500;
        store.chats = [...chats, { role: 'user', id: '4', content: 'new' }];
        flushSync();
        expect(contentArea(container).scrollTop).toBe(1500);
    });

    it('跟随流式输出中的最后一条消息，不跟随未变化的已完成消息', () => {
        const size = mockScroll();
        const streaming: ChatMessage[] = [...chats.slice(0, 2), { ...chats[2], status: 'incomplete' }];
        const { container, store } = renderChat({}, {}, { chats: streaming });
        size.scrollHeight = 1200;
        store.chats = [...streaming.slice(0, 2), { ...chats[2], content: 'more', status: 'incomplete' }];
        flushSync();
        expect(contentArea(container).scrollTop).toBe(1200);
        const done = [...streaming.slice(0, 2), { ...chats[2], content: 'done', status: 'complete' as const }];
        store.chats = done;
        flushSync();
        size.scrollHeight = 1400;
        store.chats = [...done];
        flushSync();
        expect(contentArea(container).scrollTop).toBe(1200);
    });

    it('就地追加文本与 push 时上报跟随，并跟随滚动', () => {
        const size = mockScroll();
        const streaming: ChatMessage[] = [...chats.slice(0, 2), { ...chats[2], status: 'incomplete' }];
        const { container, store } = renderChat({}, {}, { chats: streaming });
        const area = contentArea(container);
        size.scrollHeight = 1100;
        area.scrollTop = 0;
        (store.chats as ChatMessage[])[2].content += ' more';
        flushSync();
        expect(area.scrollTop).toBe(1100);
        size.scrollHeight = 1300;
        area.scrollTop = 0;
        store.chats?.push({ role: 'user', id: '4', content: 'next' });
        flushSync();
        expect(area.scrollTop).toBe(1300);
    });

    it('提示变多时滚动到底部', () => {
        const size = mockScroll();
        const { container, store } = renderChat({}, {}, { hints: [] });
        size.scrollHeight = 1300;
        store.hints = ['a'];
        flushSync();
        expect(contentArea(container).scrollTop).toBe(1300);
    });

    it('向上滚动时停止跟随，直到下次发送', async () => {
        const size = mockScroll();
        const { container, store } = renderChat();
        const area = contentArea(container);
        area.scrollTop = 800;
        await fireEvent.scroll(area);
        area.scrollTop = 0;
        await fireEvent.scroll(area);

        size.scrollHeight = 1500;
        const more = [...chats, { role: 'assistant', id: '4', content: 'more' }];
        store.chats = more;
        flushSync();
        expect(area.scrollTop).toBe(0);

        await type(container, 'hi');
        await fireEvent.click(sendButton(container));
        expect(area.scrollTop).toBe(1500);
    });

    it('滚回底部后恢复跟随', async () => {
        const size = mockScroll();
        const { container, store } = renderChat();
        const area = contentArea(container);
        area.scrollTop = 800;
        await fireEvent.scroll(area);
        area.scrollTop = 0;
        await fireEvent.scroll(area);
        area.scrollTop = 800;
        await fireEvent.scroll(area);

        size.scrollHeight = 1500;
        store.chats = [...chats, { role: 'assistant', id: '4', content: 'more' }];
        flushSync();
        expect(area.scrollTop).toBe(1500);
    });

    it('读者位于底部时，内容缩短仍保持跟随', async () => {
        const size = mockScroll();
        const { container, store } = renderChat();
        const area = contentArea(container);
        area.scrollTop = 800;
        await fireEvent.scroll(area);
        size.scrollHeight = 600;
        area.scrollTop = 400;
        await fireEvent.scroll(area);

        size.scrollHeight = 1200;
        store.chats = [...chats, { role: 'assistant', id: '4', content: 'more' }];
        flushSync();
        expect(area.scrollTop).toBe(1200);
    });

    it('离开底部时显示回到底部按钮，并带动画回到底部', async () => {
        mockScroll();
        const { container } = renderChat();
        fakeTimers();
        const area = contentArea(container);
        area.scrollTop = 100;
        await fireEvent.scroll(area);
        vi.advanceTimersByTime(200);
        flushSync();
        const back = container.querySelector('.semi-chat-action-backBottom') as HTMLElement;
        expect(back).not.toBeNull();
        expect(back).toHaveAccessibleName(text.backToBottom);

        await fireEvent.click(back);
        vi.advanceTimersByTime(400);
        expect(area.scrollTop).toBe(1000);
        await fireEvent.scroll(area);
        vi.advanceTimersByTime(200);
        flushSync();
        expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
    });

    it('显示停止按钮时隐藏回到底部按钮', async () => {
        mockScroll();
        const generating: ChatMessage[] = [...chats.slice(0, 2), { ...chats[2], status: 'loading' }];
        const { container } = renderChat({ showStopGenerate: true }, {}, { chats: generating });
        fakeTimers();
        contentArea(container).scrollTop = 0;
        await fireEvent.scroll(contentArea(container));
        vi.advanceTimersByTime(200);
        flushSync();
        expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
        expect(container.querySelector('.semi-chat-action-stop')).not.toBeNull();
    });

    it('卸载时取消待执行的滚动测量', async () => {
        const size = mockScroll();
        const reads = vi.fn<() => number>(() => size.scrollHeight);
        const { container, unmount } = renderChat();
        fakeTimers();
        await fireEvent.scroll(contentArea(container));
        unmount();
        Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get: reads });
        vi.advanceTimersByTime(200);
        expect(reads).not.toHaveBeenCalled();
    });

    it('监听滚动容器的尺寸', () => {
        const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
        const { container } = renderChat();
        expect(observe.mock.calls.map(([target]) => target)).toContain(contentArea(container));
    });
});

describe('Chat handle 方法', () => {
    it('不带附件的 sendMessage 保持 content 为字符串', () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const { handle } = renderChat({ onChatsChange, onMessageSend });
        handle().sendMessage('hi');
        expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hi', undefined);
        expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'hi' })]);
    });

    it('resetMessage、clearContext、scrollToBottom 与 sendMessage', () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const onMessageReset = vi.fn<Listener<'onMessageReset'>>();
        const onClear = vi.fn<Listener<'onClear'>>();
        const onMessageSend = vi.fn<Listener<'onMessageSend'>>();
        const { container, handle } = renderChat({ onChatsChange, onMessageReset, onClear, onMessageSend });

        handle().resetMessage();
        expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), expect.objectContaining({ role: 'assistant', status: 'loading', content: '' })]);
        expect(onMessageReset).toHaveBeenCalledExactlyOnceWith(null);

        handle().clearContext();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChatsChange.mock.calls.at(-1)?.[0].at(-1)).toEqual(expect.objectContaining({ role: 'divider' }));

        handle().sendMessage('hi', []);
        expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hi', []);
        expect(onChatsChange.mock.calls.at(-1)?.[0].at(-1)).toEqual(expect.objectContaining({ content: 'hi' }));

        mockScroll({ scrollHeight: 800 });
        handle().scrollToBottom(false);
        expect(contentArea(container).scrollTop).toBe(800);
    });

    it('scrollToBottom(true) 带动画', () => {
        const { handle } = renderChat();
        fakeTimers();
        mockScroll({ scrollHeight: 800 });
        const setTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');
        handle().scrollToBottom(true);
        expect(setTop).not.toHaveBeenCalled();
        vi.advanceTimersByTime(400);
        expect(setTop).toHaveBeenLastCalledWith(800);
    });

    it('没有消息时 clearContext 追加分隔符', () => {
        const onChatsChange = vi.fn<Listener<'onChatsChange'>>();
        const { handle } = renderChat({ onChatsChange }, {}, { chats: [], roleConfig: undefined });
        handle().clearContext();
        expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([expect.objectContaining({ role: 'divider' })]);
    });
});

describe('Chat 默认值', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Chat: { mode: 'noBubble', placeholder: 'global' } };
        const { container } = renderChat();
        expect(container.querySelector('.semi-chat-chatBox-content-bubble')).toBeNull();
        expect(textarea(container).placeholder).toBe('global');
    });

    it('全局 TextArea 默认值不给输入框加清除按钮、计数器与行号', async () => {
        semiGlobal.config.overrideDefaultProps = { TextArea: { maxCount: 5, showClear: true, showCounter: true, showLineNumber: true } };
        const { container } = renderChat();
        await type(container, 'hello');
        const inputBox = container.querySelector('.semi-chat-inputBox') as HTMLElement;
        expect(inputBox.querySelector('.semi-input-clearbtn, .semi-input-textarea-counter, .semi-input-textarea-lineNumber')).toBeNull();
    });

    it('全局的 align 与 showStopGenerate 生效，显式传入的值优先', () => {
        semiGlobal.config.overrideDefaultProps = { Chat: { align: 'leftAlign', showStopGenerate: true } };
        const loading = [...chats.slice(0, 2), { ...chats[2], status: 'loading' as const }];
        const { container, store } = renderChat({}, {}, { chats: loading });
        expect(container.querySelector('.semi-chat-chatBox-right')).toBeNull();
        expect(container.querySelector('.semi-chat-action-stop')).not.toBeNull();
        const explicit = renderChat({ align: 'leftRight', showStopGenerate: false }, {}, { chats: loading });
        expect(explicit.container.querySelector('.semi-chat-chatBox-right')).not.toBeNull();
        expect(explicit.container.querySelector('.semi-chat-action-stop')).toBeNull();
        expect(store).toBeTruthy();
    });
});

describe('Chat chats 受控写法', () => {
    const modes = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', accept = true) => {
        const store = createStore({ chats: mode === 'uncontrolled' ? undefined : (chats as ChatMessage[] | undefined), roleConfig, accept, log: [] as string[] });
        const view = render(ChatModes, { props: { mode, store } });
        return { ...view, store };
    };
    const like = (container: Element) => actionButtons(boxes(container)[2])[1];

    it('bind:chats 双向同步，点赞后 DOM 与外部列表同时更新', async () => {
        const { container, store } = modes('bind');
        await fireEvent.click(like(container));
        expect(store.chats?.[2].like).toBe(true);
        expect(like(container).querySelector('.semi-icon-like_thumb')).not.toBeNull();
        expect(store.log).toEqual(['change 3']);
    });

    it('函数绑定的 setter 拒绝写入时，列表保持不变', async () => {
        const { container, store } = modes('function', false);
        await fireEvent.click(like(container));
        expect(store.log).toEqual(['set 3', 'change 3']);
        expect(store.chats?.[2].like).toBeUndefined();
        expect(like(container).querySelector('.semi-icon-like_thumb')).toBeNull();
    });

    it('函数绑定的 setter 接受写入时，列表随之更新', async () => {
        const { container, store } = modes('function', true);
        await fireEvent.click(like(container));
        expect(store.chats?.[2].like).toBe(true);
        expect(like(container).querySelector('.semi-icon-like_thumb')).not.toBeNull();
    });

    it('单向传值只作初值，交互时本地覆盖，父级再推新值时以父级为准', async () => {
        const { container, store } = modes('one-way');
        await fireEvent.click(like(container));
        expect(like(container).querySelector('.semi-icon-like_thumb')).not.toBeNull();
        expect(store.chats?.[2].like).toBeUndefined();
        store.chats = [{ role: 'assistant', id: '9', content: 'pushed' }];
        flushSync();
        expect(boxes(container)).toHaveLength(1);
    });

    it('不传 chats 时，发送的消息由组件自己保存', async () => {
        const { container, store } = modes('uncontrolled');
        expect(boxes(container)).toHaveLength(0);
        await type(container, 'hello');
        await fireEvent.click(sendButton(container));
        expect(boxes(container)).toHaveLength(1);
        expect(store.log).toEqual(['change 1']);
    });
});

describe('Chat 属性落点', () => {
    it('将未声明属性传给根元素，自身的监听不出现在 DOM 上', () => {
        const { container } = renderChat({ 'data-testid': 'chat', 'aria-label': 'conversation', onMessageSend: vi.fn<Listener<'onMessageSend'>>(), onClear: vi.fn<Listener<'onClear'>>() } as Partial<ChatProps>);
        const node = screen.getByTestId('chat');
        expect(node).toBe(root(container));
        expect(node).toHaveAttribute('aria-label', 'conversation');
        expect(node.getAttributeNames().filter((name) => name.startsWith('on'))).toEqual([]);
    });

    it('根元素被命名时为 group，使用方的 role 优先', () => {
        const { container, store } = renderChat();
        expect(root(container)).not.toHaveAttribute('role');
        store.props = { 'aria-label': 'conversation' };
        flushSync();
        expect(screen.getByRole('group', { name: 'conversation' })).toBe(root(container));
        store.props = { 'aria-labelledby': 'heading', role: 'region' };
        flushSync();
        expect(root(container)).toHaveAttribute('role', 'region');
    });
});

describe('Chat 可访问名称与消息日志', () => {
    it('消息 textarea 的名称来自语言包', () => {
        renderChat();
        expect(screen.getByRole('textbox', { name: text.input })).toBeInTheDocument();
    });

    it('每个头像都带空 alt，消息图片的 alt 取内容 alt，缺省时取语言包', async () => {
        const { container } = renderChat(
            {},
            {},
            {
                chats: [
                    { role: 'user', id: '1', content: 'one ![chart](https://semi.design/chart.png)' },
                    { role: 'user', id: '2', content: 'two' },
                    { role: 'assistant', id: '3', content: [{ type: 'image_url', image_url: { url: 'https://semi.design/a.png' } }] },
                ],
            }
        );
        expect([...container.querySelectorAll('.semi-chat-chatBox-avatar img')].map((img) => img.getAttribute('alt'))).toEqual(['', '', '']);
        expect(await screen.findByRole('img', { name: text.image })).toHaveAttribute('src', 'https://semi.design/a.png');
        expect(screen.getByRole('img', { name: 'chart' })).toHaveAttribute('src', 'https://semi.design/chart.png');
    });

    it('消息列表是具名的 log，包含全部消息', () => {
        renderChat();
        const log = screen.getByRole('log', { name: text.messages });
        expect(within(log).getByText('assistant says')).toBeInTheDocument();
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('最后一条回复加载中或未完成时为 busy 状态', () => {
        const streaming: ChatMessage[] = [...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'assistant', status: 'loading' }];
        const { store } = renderChat({}, {}, { chats: streaming });
        const log = screen.getByRole('log');
        expect(log).toHaveAttribute('aria-busy', 'true');
        store.chats = [...chats.slice(0, 2), { ...streaming[2], status: 'incomplete' }];
        flushSync();
        expect(log).toHaveAttribute('aria-busy', 'true');
        store.chats = [...chats.slice(0, 2), { ...streaming[2], status: 'complete' }];
        flushSync();
        expect(log).toHaveAttribute('aria-busy', 'false');
    });
});

describe('Chat 直接渲染', () => {
    it('不经宿主也能渲染并暴露 handle', () => {
        const view = render(Chat, { props: { chats, roleConfig } });
        expect(view.container.querySelector('.semi-chat')).not.toBeNull();
        expect(
            Object.keys(view.component)
                .filter((key) => !key.startsWith('$'))
                .sort()
        ).toEqual(['clearContext', 'resetMessage', 'scrollToBottom', 'sendMessage']);
    });
});

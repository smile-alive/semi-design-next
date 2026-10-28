/** @jsxImportSource vue */
import { type VNode, defineComponent, nextTick, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import semiGlobal from '@fibrae/semi-ui-vue/_utils/semi-global';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import type { FileItem, UploadOnChangeProps } from '@fibrae/semi-ui-vue/upload/index';
import { mockResizeObserver, render, sleep } from '@test/utils/vue';
import Chat from '..';
import type { ChatActionSlotProps, ChatAvatarSlotProps, ChatContentSlotProps, ChatDefaultActionNodeObj, ChatEmits, ChatFullChatBoxSlotProps, ChatHandle, ChatHintBoxSlotProps, ChatInputAreaSlotProps, ChatMarkdownRenderProps, ChatMessage, ChatProps, ChatTitleSlotProps } from '../interface';
import EmptySlots from './fixtures/empty-slots.vue';
import Kebab from './fixtures/kebab.vue';
import KeepAliveHost from './fixtures/keep-alive-host.vue';
import ModelHost from './fixtures/model-host.vue';
import ToggleUploadTip from './fixtures/toggle-upload-tip.vue';

type Listener<K extends keyof ChatEmits> = (...args: ChatEmits[K]) => void;
type Props = Partial<ChatProps> & Record<string, unknown>;
type Slots = Record<string, (props: never) => VNode | VNode[] | string | null>;

const text = en_US.Chat;

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
const root = (container: Element) => container.firstElementChild as HTMLElement;
const filesDrag = { dataTransfer: { types: ['Files'] } };

function mount(props: Props = {}, slots?: Slots) {
    const state = shallowRef<Props>({ chats, roleConfig, ...props });
    let handle: ChatHandle | null = null;
    const setHandle = (instance: unknown) => {
        handle = instance as ChatHandle | null;
    };
    const view = render(() => (
        <LocaleProvider locale={en_US}>
            {() => (
                <Chat {...state.value} ref={setHandle}>
                    {slots}
                </Chat>
            )}
        </LocaleProvider>
    ));
    return {
        container: view.container,
        unmount: () => view.unmount(),
        handle: () => handle as ChatHandle,
        rerender: async (next: Props = {}) => {
            state.value = { chats, roleConfig, ...next };
            await nextTick();
        },
    };
}

async function renderChat(props: Props = {}, slots?: Slots) {
    const view = mount(props, slots);
    await waitFor(() => expect(screen.getByText('assistant says')).toBeInTheDocument());
    return view;
}

const type = (container: Element, value: string) => fireEvent.update(textarea(container), value);

function mockClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

// jsdom has no layout: give every element fixed sizes and a scrollTop that keeps what is written
function mockScroll({ scrollHeight = 1000, clientHeight = 200 } = {}) {
    const sizes = { scrollHeight, clientHeight };
    const scrollTop = new WeakMap<Element, number>();
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => sizes.scrollHeight);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => sizes.clientHeight);
    vi.spyOn(Element.prototype, 'scrollTop', 'get').mockImplementation(function (this: Element) {
        return scrollTop.get(this) ?? 0;
    });
    vi.spyOn(Element.prototype, 'scrollTop', 'set').mockImplementation(function (this: Element, value: number) {
        scrollTop.set(this, value);
    });
    return sizes;
}

const file = () => new File(['x'], 'a.txt', { type: 'text/plain' });
const attachmentItems = (container: Element) => container.querySelectorAll('.semi-chat-attachment-item');

beforeEach(() => {
    // Upload previews files through object URLs, which jsdom does not create
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => `blob:${(blob as File).name}`);
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
});

describe('Chat', () => {
    describe('消息', () => {
        it('渲染每个角色的标题、头像与内容', async () => {
            const { container } = await renderChat();
            expect(boxes(container)).toHaveLength(3);
            expect([...container.querySelectorAll('.semi-chat-chatBox-title')].map((n) => n.textContent)).toEqual(['System', 'User', 'Assistant']);
            expect([...container.querySelectorAll<HTMLImageElement>('.semi-chat-chatBox-avatar img')].map((n) => n.src)).toEqual(['https://semi.design/system.png', 'https://semi.design/user.png', 'https://semi.design/assistant.png']);
            expect(screen.getByText('system says')).toBeInTheDocument();
            expect(screen.getByText('user says')).toBeInTheDocument();
        });

        it('仅在 align 为 leftRight 时，用户消息靠右', async () => {
            const { container, rerender } = await renderChat();
            expect(boxes(container).map((b) => b.classList.contains('semi-chat-chatBox-right'))).toEqual([false, true, false]);
            await rerender({ align: 'leftAlign' });
            expect(container.querySelector('.semi-chat-chatBox-right')).toBeNull();
        });

        it.each([
            ['bubble', [['semi-chat-chatBox-content-bubble'], ['semi-chat-chatBox-content-bubble', 'semi-chat-chatBox-content-user'], ['semi-chat-chatBox-content-bubble']]],
            ['noBubble', [[], [], []]],
            ['userBubble', [[], ['semi-chat-chatBox-content-userBubble', 'semi-chat-chatBox-content-user'], []]],
        ] as const)('mode 为 %s 时设置内容类名', async (mode, expected) => {
            const { container } = await renderChat({ mode });
            const contents = [...container.querySelectorAll('.semi-chat-chatBox-content')];
            expect(contents.map((n) => [...n.classList].filter((c) => c !== 'semi-chat-chatBox-content'))).toEqual(expected);
        });

        it('同一角色连续消息时隐藏头像与标题', async () => {
            const { container } = await renderChat({
                chats: [...chats, { role: 'assistant', id: '4', content: 'more' }],
            });
            const [, , first, second] = boxes(container);
            expect(first.querySelector('.semi-chat-chatBox-avatar-hidden')).toBeNull();
            expect(first.querySelector('.semi-chat-chatBox-title')).not.toBeNull();
            expect(second.querySelector('.semi-chat-chatBox-avatar-hidden')).not.toBeNull();
            expect(second.querySelector('.semi-chat-chatBox-title')).toBeNull();
        });

        it('显示加载与错误状态', () => {
            const { container } = mount({
                chats: [
                    { role: 'user', id: '1', content: 'oops', status: 'error' },
                    { role: 'assistant', id: '2', content: '', status: 'loading' },
                ],
            });
            expect(container.querySelector('.semi-chat-chatBox-content-loading')).not.toBeNull();
            expect(container.querySelector('.semi-chat-chatBox-content-error')).not.toBeNull();
        });

        it('数组内容渲染为文本、图片与文件', async () => {
            const { container } = mount({
                chats: [
                    {
                        role: 'user',
                        id: '1',
                        content: [
                            { type: 'text', text: 'look at this' },
                            { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                            {
                                type: 'file_url',
                                file_url: { url: 'https://semi.design/a.pdf', name: 'a.pdf', size: '1KB', type: '' },
                            },
                        ],
                    },
                ],
            });
            await waitFor(() => expect(screen.getByText('look at this')).toBeInTheDocument());
            expect(container.querySelector<HTMLImageElement>('.semi-chat-attachment-img img')?.src).toBe('https://semi.design/a.png');
            const card = container.querySelector('.semi-chat-attachment-file');
            expect(card?.getAttribute('href')).toBe('https://semi.design/a.pdf');
            expect(card).toHaveTextContent('a.pdf');
            expect(card).toHaveTextContent('1KB');
        });

        it('除非 escapeHtml 为 false，否则转义用户消息中的 HTML', async () => {
            const html = { role: 'user', id: '1', content: 'a <b>bold</b> word' };
            const { container, rerender } = mount({ chats: [html] });
            await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content')).toHaveTextContent('<b>'));
            await rerender({ chats: [{ ...html, id: '2' }], escapeHtml: false });
            await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content')).toHaveTextContent('word'));
            expect(container.querySelector('.semi-chat-chatBox-content')).not.toHaveTextContent('<b>');
        });

        it('使用默认或自定义分隔符渲染 divider 消息', async () => {
            const withDivider = [...chats, { role: 'divider', id: 'd' }];
            const { container, unmount } = await renderChat({ chats: withDivider });
            expect(container.querySelector('.semi-chat-divider')).toHaveTextContent(text.clearContext);
            unmount();
            await renderChat({ chats: withDivider }, { divider: ({ message }: { message: ChatMessage }) => <hr data-id={message.id} /> });
            expect(document.querySelector('hr[data-id="d"]')).not.toBeNull();
            expect(document.querySelector('.semi-chat-divider')).toBeNull();
        });

        it('将 customMarkDownComponents 与 markdownRenderProps 传给 markdown 渲染器', async () => {
            const Strong = (_: unknown, { slots }: { slots: { default?: () => VNode[] } }) => <em data-testid="custom">{slots.default?.()}</em>;
            mount({
                chats: [{ role: 'assistant', id: '1', content: 'a **b** c' }],
                customMarkDownComponents: { strong: Strong },
                markdownRenderProps: { class: 'my-md' },
            });
            await waitFor(() => expect(screen.getByTestId('custom')).toHaveTextContent('b'));
            expect(document.querySelector('.my-md')).not.toBeNull();
        });

        it('markdownRenderProps 不接受由每条消息决定的 raw、components', () => {
            expectTypeOf<ChatMarkdownRenderProps>().not.toHaveProperty('raw');
            expectTypeOf<ChatMarkdownRenderProps>().not.toHaveProperty('components');
            expectTypeOf<ChatMarkdownRenderProps>().toHaveProperty('format');
        });
    });

    describe('消息插槽', () => {
        it('以默认节点调用每个插槽', async () => {
            const { container } = mount(
                {},
                {
                    title: ({ role, defaultTitle }: ChatTitleSlotProps) => (
                        <div class="t">
                            {`${role.name}!`}
                            {defaultTitle}
                        </div>
                    ),
                    avatar: ({ role }: ChatAvatarSlotProps) => <div class="a">{role.name}</div>,
                    content: ({ message, class: cls }: ChatContentSlotProps) => <div class={['c', cls]}>{message.content as string}</div>,
                    action: ({ defaultActionsObj, class: cls }: ChatActionSlotProps) => <div class={['x', cls]}>{Object.keys(defaultActionsObj).join(',')}</div>,
                }
            );
            expect([...container.querySelectorAll('.t')].map((n) => n.textContent)).toEqual(['System!System', 'User!User', 'Assistant!Assistant']);
            expect([...container.querySelectorAll('.a')].map((n) => n.textContent)).toEqual(['System', 'User', 'Assistant']);
            expect(container.querySelectorAll('.c.semi-chat-chatBox-content-bubble')).toHaveLength(3);
            expect([...container.querySelectorAll('.x')].map((n) => n.textContent)).toEqual(['copyNode,likeNode,dislikeNode,deleteNode', 'copyNode,deleteNode', 'copyNode,likeNode,dislikeNode,resetNode,deleteNode']);
            expect(container.querySelector('.x')?.classList).toContain('semi-chat-chatBox-action');
        });

        it('#action 的 defaultActions 渲染回去后仍可操作', async () => {
            const onLike = vi.fn<Listener<'messageGoodFeedback'>>();
            const { container } = await renderChat(
                { onMessageGoodFeedback: onLike },
                {
                    action: ({ defaultActions, class: cls }: ChatActionSlotProps) => <div class={cls}>{defaultActions}</div>,
                }
            );
            const buttons = actionButtons(boxes(container)[2]);
            expect(buttons).toHaveLength(5);
            await fireEvent.click(buttons[1]);
            expect(onLike).toHaveBeenCalledExactlyOnceWith(chats[2]);
        });

        it('ChatDefaultActionNodeObj 的键都是可选的', () => {
            expectTypeOf<{ deleteNode: VNode }>().toExtend<ChatDefaultActionNodeObj>();
        });

        it('#fullChatBox 接收默认节点', async () => {
            const { container } = await renderChat(
                {},
                {
                    fullChatBox: ({ defaultNodes, class: cls }: ChatFullChatBoxSlotProps) => (
                        <div class={['full', cls]}>
                            {defaultNodes.title}
                            {defaultNodes.content}
                        </div>
                    ),
                }
            );
            expect(container.querySelectorAll('.full')).toHaveLength(3);
            expect(container.querySelector('.full.semi-chat-chatBox-right')).toHaveTextContent('Useruser says');
            expect(container.querySelector('.semi-chat-chatBox-action')).toBeNull();
        });

        it('#fullChatBox 的 defaultNodes 原样渲染时与默认 DOM 一致', async () => {
            const html = (container: Element) => contentArea(container).innerHTML.replaceAll(/test-\d+/g, '');
            const plain = await renderChat();
            const expected = html(plain.container);
            plain.unmount();
            const { container } = await renderChat(
                {},
                {
                    fullChatBox: ({ defaultNodes, class: cls }: ChatFullChatBoxSlotProps) => (
                        <div class={cls}>
                            {defaultNodes.avatar}
                            <div class="semi-chat-chatBox-wrap">
                                {defaultNodes.title}
                                {defaultNodes.content}
                                {defaultNodes.action}
                            </div>
                        </div>
                    ),
                }
            );
            expect(html(container)).toBe(expected);
        });

        it('#fullChatBox 的默认节点使用自定义的 #avatar 与 #title', () => {
            const { container } = mount(
                {},
                {
                    fullChatBox: ({ defaultNodes, class: cls }: ChatFullChatBoxSlotProps) => (
                        <div class={cls}>
                            {defaultNodes.avatar}
                            {defaultNodes.title}
                        </div>
                    ),
                    avatar: ({ role }: ChatAvatarSlotProps) => <i class="a">{role.name}</i>,
                    title: ({ role }: ChatTitleSlotProps) => <b class="t">{`${role.name}!`}</b>,
                }
            );
            expect([...container.querySelectorAll('.a')].map((n) => n.textContent)).toEqual(['System', 'User', 'Assistant']);
            expect([...container.querySelectorAll('.t')].map((n) => n.textContent)).toEqual(['System!', 'User!', 'Assistant!']);
            expect(container.querySelector('.semi-chat-chatBox-avatar')).toBeNull();
            expect(container.querySelector('.semi-chat-chatBox-title')).toBeNull();
        });

        it('提供但为空的 #avatar 不渲染头像，#title 替换标题', async () => {
            const { container } = render(EmptySlots);
            await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
            expect(container.querySelector('.semi-chat-chatBox-avatar')).toBeNull();
            expect(container.querySelector('.semi-chat-chatBox-title')).toBeNull();
            expect(container.querySelector('.custom-title')).toHaveTextContent('Assistant');
        });

        it('#roleAvatar 渲染没有图片的头像内容，color 传给 Avatar', async () => {
            const { container } = await renderChat({ roleConfig: { ...roleConfig, assistant: { name: 'Assistant', color: 'red' } } }, { roleAvatar: ({ role }: { role: { name?: string } }) => <b class="initial">{role.name?.[0]}</b> });
            const avatar = boxes(container)[2].querySelector('.semi-chat-chatBox-avatar') as HTMLElement;
            expect(avatar).toHaveClass('semi-avatar-red');
            expect(within(avatar).getByText('A')).toHaveClass('initial');
        });
    });

    describe('输入框', () => {
        it('发送输入的内容并清空输入框', async () => {
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onUpdate = vi.fn<Listener<'update:chats'>>();
            const onInputChange = vi.fn<Listener<'inputChange'>>();
            const { container } = await renderChat({
                onMessageSend,
                onChatsChange,
                'onUpdate:chats': onUpdate,
                onInputChange,
            });
            expect(sendButton(container)).toBeDisabled();
            await type(container, 'hello');
            expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: 'hello', attachment: [] });
            expect(sendButton(container)).not.toBeDisabled();
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hello', []);
            const sent = [...chats, { role: 'user', id: expect.any(String), createAt: Date.now(), content: 'hello' }];
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith(sent);
            expect(onUpdate).toHaveBeenCalledExactlyOnceWith(sent);
            expect(textarea(container).value).toBe('');
        });

        it.each([
            ['enter', false, 1],
            ['enter', true, 0],
            ['shift+enter', false, 0],
            ['shift+enter', true, 1],
        ] as const)('sendHotKey 为 %s、shiftKey 为 %s 时发送 %i 次', async (sendHotKey, shiftKey, times) => {
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const { container } = await renderChat({ onMessageSend, sendHotKey });
            await type(container, 'hello');
            await fireEvent.keyDown(textarea(container), { key: 'Enter', keyCode: 13, shiftKey });
            expect(onMessageSend).toHaveBeenCalledTimes(times);
        });

        it('canSend 覆盖内部的发送状态', async () => {
            const { container, rerender } = await renderChat({ canSend: true });
            expect(sendButton(container)).not.toBeDisabled();
            await rerender({ canSend: false });
            await type(container, 'hello');
            expect(sendButton(container)).toBeDisabled();
            await rerender({ canSend: true });
            expect(sendButton(container)).not.toBeDisabled();
        });

        it('点击输入区域时聚焦 textarea', async () => {
            const { container } = await renderChat();
            await fireEvent.click(container.querySelector('.semi-chat-inputBox-inner') as Element);
            expect(document.activeElement).toBe(textarea(container));
        });

        it('应用 placeholder、inputBoxCls、inputBoxStyle、插槽、class 与 style', async () => {
            const { container } = await renderChat(
                {
                    placeholder: 'Ask me',
                    inputBoxCls: 'my-input',
                    inputBoxStyle: { color: 'red' },
                    class: 'my-chat',
                    style: { width: '300px' },
                },
                {
                    topSlot: () => <div data-testid="top" />,
                    bottomSlot: () => <div data-testid="bottom" />,
                }
            );
            expect(textarea(container).placeholder).toBe('Ask me');
            expect(container.querySelector('.semi-chat-inputBox.my-input')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(root(container)).toHaveClass('semi-chat', 'my-chat');
            expect(root(container)).toHaveStyle({ width: '300px' });
            expect(screen.getByTestId('top')).toBeInTheDocument();
            expect(screen.getByTestId('bottom')).toBeInTheDocument();
        });

        it('#inputArea 接收默认节点及发送与清空处理函数', async () => {
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onClear = vi.fn<Listener<'clear'>>();
            const { container } = await renderChat(
                { onMessageSend, onChatsChange, onClear },
                {
                    inputArea: (p: ChatInputAreaSlotProps) => (
                        <div>
                            <div data-testid="default">{p.defaultNode}</div>
                            <div data-testid="input">{p.inputNode}</div>
                            <div data-testid="send">{p.sendNode}</div>
                            <div data-testid="upload">{p.uploadNode}</div>
                            <div data-testid="clear">{p.clearContextNode}</div>
                            <button type="button" onClick={() => p.onSend('custom', [])}>
                                send it
                            </button>
                            <button type="button" onClick={() => p.onClear()}>
                                clear it
                            </button>
                            <button type="button" onClick={p.onClick}>
                                focus it
                            </button>
                        </div>
                    ),
                }
            );
            expect(within(screen.getByTestId('default')).getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByTestId('send').querySelector('.semi-chat-inputBox-sendButton')).not.toBeNull();
            expect(screen.getByTestId('upload').querySelector('.semi-chat-inputBox-uploadButton')).not.toBeNull();
            expect(screen.getByTestId('clear').querySelector('.semi-chat-inputBox-clearButton')).not.toBeNull();
            await fireEvent.click(screen.getByText('send it'));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('custom', []);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'custom' })]);
            await fireEvent.click(screen.getByText('clear it'));
            expect(onClear).toHaveBeenCalledTimes(1);
            await fireEvent.click(screen.getByText('focus it'));
            expect([...container.querySelectorAll('textarea')]).toContain(document.activeElement);
        });

        it('#inputArea 中的输入节点照常输入并发送', async () => {
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const { container } = await renderChat(
                { onMessageSend },
                {
                    inputArea: (p: ChatInputAreaSlotProps) => (
                        <div>
                            {p.inputNode}
                            {p.sendNode}
                        </div>
                    ),
                }
            );
            await type(container, 'typed');
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('typed', []);
        });

        it('#inputArea 同时渲染 defaultNode 与 uploadNode 后撤掉 uploadNode，粘贴的文件仍成为附件', async () => {
            const showUpload = shallowRef(true);
            const { container } = await renderChat(
                { uploadProps: { uploadTrigger: 'custom' } },
                {
                    inputArea: (p: ChatInputAreaSlotProps) => (
                        <div>
                            {p.defaultNode}
                            {showUpload.value ? p.uploadNode : null}
                        </div>
                    ),
                }
            );
            showUpload.value = false;
            await nextTick();
            const pasted = file();
            await fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile: () => pasted }] } });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        });
    });

    describe('停止与清空', () => {
        const generating: ChatMessage[] = [...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'thinking', status: 'incomplete' }];

        it('最后一条消息生成中时显示停止按钮', async () => {
            const onStopGenerator = vi.fn<Listener<'stopGenerator'>>();
            const { container, rerender } = mount({ chats: generating, showStopGenerate: true, onStopGenerator });
            const stop = container.querySelector('.semi-chat-action-stop') as HTMLElement;
            expect(stop).toHaveTextContent(text.stop);
            await type(container, 'hello');
            expect(sendButton(container)).toBeDisabled();
            await fireEvent.click(stop);
            expect(onStopGenerator).toHaveBeenCalledTimes(1);
            expect(onStopGenerator.mock.calls[0][0]).toBeInstanceOf(MouseEvent);

            await rerender({ chats: generating });
            expect(container.querySelector('.semi-chat-action-stop')).toBeNull();
            expect(sendButton(container)).not.toBeDisabled();
        });

        it('生成结束时，持有焦点的停止按钮把焦点交给输入框', async () => {
            const { container, rerender } = mount({ chats: generating, showStopGenerate: true });
            (container.querySelector('.semi-chat-action-stop') as HTMLElement).focus();
            await rerender({
                chats: [...chats.slice(0, 2), { ...generating[2], status: 'complete' }],
                showStopGenerate: true,
            });
            expect(container.querySelector('.semi-chat-action-stop')).toBeNull();
            expect(document.activeElement).toBe(textarea(container));
        });

        it('clear context 追加分隔符并触发 clear', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onClear = vi.fn<Listener<'clear'>>();
            const { container, rerender } = await renderChat({ showClearContext: true, onChatsChange, onClear });
            await fireEvent.click(container.querySelector('.semi-chat-inputBox-clearButton') as Element);
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats, { role: 'divider', id: expect.any(String), createAt: Date.now() }]);
            expect(onClear).toHaveBeenCalledTimes(1);

            const cleared = onChatsChange.mock.calls[0][0];
            await rerender({ chats: cleared, showClearContext: true, onChatsChange, onClear });
            await fireEvent.click(container.querySelector('.semi-chat-inputBox-clearButton') as Element);
            expect(onChatsChange).toHaveBeenCalledTimes(1);
            expect(onClear).toHaveBeenCalledTimes(1);
        });

        it('默认没有清空按钮', async () => {
            const { container } = await renderChat();
            expect(container.querySelector('.semi-chat-inputBox-clearButton')).toBeNull();
        });
    });

    describe('消息操作', () => {
        it('仅图标按钮的名称来自语言包', async () => {
            const { container } = await renderChat();
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

        it('用户消息显示复制与删除，其他消息显示反馈，仅最后一条 assistant 消息显示 reset', async () => {
            const { container } = await renderChat();
            expect(boxes(container).map((b) => actionButtons(b).length)).toEqual([4, 2, 5]);
            expect(container.querySelectorAll('.semi-chat-chatBox-action-icon-redo')).toHaveLength(1);
            expect(boxes(container)[2].querySelector('.semi-chat-chatBox-action-show')).not.toBeNull();
        });

        it('未完成的消息隐藏操作按钮', () => {
            const { container } = mount({ chats: [{ role: 'assistant', id: '1', content: 'x', status: 'loading' }] });
            const action = container.querySelector('.semi-chat-chatBox-action') as HTMLElement;
            expect(action).toHaveClass('semi-chat-chatBox-action-hidden');
            expect(actionButtons(action)).toHaveLength(2);
            expect(action.querySelector('.semi-chat-chatBox-action-icon-redo')).not.toBeNull();
        });

        it('复制消息文本并提示成功', async () => {
            const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const onMessageCopy = vi.fn<Listener<'messageCopy'>>();
            const { container } = await renderChat({ onMessageCopy });
            await fireEvent.click(actionButtons(boxes(container)[2])[0]);
            expect(writeText).toHaveBeenCalledWith('assistant says');
            const toast = await screen.findByText(text.copySuccess);
            expect(toast.closest('.semi-chat-toast')).not.toBeNull();
            expect(onMessageCopy).toHaveBeenCalledExactlyOnceWith(chats[2]);
        });

        it('写入完成前或失败时不触发 messageCopy', async () => {
            let resolveWrite = () => {};
            const writeText = vi.fn<(value: string) => Promise<void>>(() => new Promise((resolve) => (resolveWrite = resolve)));
            mockClipboard(writeText);
            const onMessageCopy = vi.fn<Listener<'messageCopy'>>();
            const { container } = await renderChat({ onMessageCopy });
            await fireEvent.click(actionButtons(boxes(container)[2])[0]);
            expect(onMessageCopy).not.toHaveBeenCalled();
            resolveWrite();
            await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));

            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            await fireEvent.click(actionButtons(boxes(container)[2])[0]);
            await sleep(20);
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
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
            const { container } = mount({ chats: [message] });
            await fireEvent.click(actionButtons(container)[0]);
            expect(writeText).toHaveBeenCalledWith('ab');
        });

        it.each([
            ['缺失', undefined],
            ['空字符串', ''],
            ['只有图片', [{ type: 'image_url', image_url: { url: 'https://example.com/a.png' } }]],
        ] as const)('内容%s时点复制不写入、不提示、不触发 messageCopy', async (_name, content) => {
            const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const onMessageCopy = vi.fn<Listener<'messageCopy'>>();
            const message = { role: 'assistant', id: '1', content } as ChatMessage;
            const { container } = mount({ chats: [message], onMessageCopy });
            await fireEvent.click(actionButtons(container)[0]);
            await sleep(20);
            expect(writeText).not.toHaveBeenCalled();
            expect(screen.queryByText(text.copySuccess)).toBeNull();
            expect(onMessageCopy).not.toHaveBeenCalled();
        });

        it('剪贴板写入失败时不提示成功', async () => {
            mockClipboard(() => Promise.reject(new Error('no')));
            const { container } = await renderChat();
            await fireEvent.click(actionButtons(boxes(container)[2])[0]);
            await sleep(20);
            expect(screen.queryByText(text.copySuccess)).toBeNull();
        });

        it('like 与 dislike 通过 chatsChange 切换标记', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onUpdate = vi.fn<Listener<'update:chats'>>();
            const onMessageGoodFeedback = vi.fn<Listener<'messageGoodFeedback'>>();
            const onMessageBadFeedback = vi.fn<Listener<'messageBadFeedback'>>();
            const liked = [...chats.slice(0, 2), { ...chats[2], like: true }];
            const { container } = await renderChat({
                chats: liked,
                onChatsChange,
                'onUpdate:chats': onUpdate,
                onMessageGoodFeedback,
                onMessageBadFeedback,
            });
            const [, like, dislike] = actionButtons(boxes(container)[2]);
            expect(like.querySelector('.semi-icon-like_thumb')).not.toBeNull();
            await fireEvent.click(like);
            expect(onMessageGoodFeedback).toHaveBeenCalledExactlyOnceWith(liked[2]);
            const unliked = [...chats.slice(0, 2), { ...chats[2], like: false, dislike: false }];
            expect(onChatsChange).toHaveBeenLastCalledWith(unliked);
            expect(onUpdate).toHaveBeenLastCalledWith(unliked);
            await fireEvent.click(dislike);
            expect(onMessageBadFeedback).toHaveBeenCalledExactlyOnceWith(liked[2]);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), { ...chats[2], like: false, dislike: true }]);
        });

        it('reset 将最后一条消息替换为 loading 消息', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onMessageReset = vi.fn<Listener<'messageReset'>>();
            const { container } = await renderChat({ onChatsChange, onMessageReset });
            await fireEvent.click(actionButtons(boxes(container)[2])[3]);
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats.slice(0, 2), { ...chats[2], status: 'loading', content: '', like: false, dislike: false, id: expect.any(String), createAt: Date.now() }]);
            expect(onChatsChange.mock.calls[0][0][2].id).not.toBe('3');
            expect(onMessageReset).toHaveBeenCalledExactlyOnceWith(chats[2]);
        });

        it('delete 先请求确认，再删除消息', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onMessageDelete = vi.fn<Listener<'messageDelete'>>();
            const { container } = await renderChat({ onChatsChange, onMessageDelete });
            await fireEvent.click(actionButtons(boxes(container)[1])[1]);
            expect(await screen.findByText(text.deleteConfirm)).toBeInTheDocument();
            expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).not.toBeNull();
            await fireEvent.click(screen.getByRole('button', { name: en_US.Popconfirm.confirm }));
            expect(onMessageDelete).toHaveBeenCalledExactlyOnceWith(chats[1]);
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([chats[0], chats[2]]);
        });

        it('在删除按钮外按下鼠标会关闭确认框', async () => {
            const onMessageDelete = vi.fn<Listener<'messageDelete'>>();
            const { container } = await renderChat({ onMessageDelete });
            await fireEvent.click(actionButtons(boxes(container)[1])[1]);
            await screen.findByText(text.deleteConfirm);
            await fireEvent.mouseDown(document.body);
            await waitFor(() => expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).toBeNull());
            expect(onMessageDelete).not.toHaveBeenCalled();
        });

        it('KeepAlive 缓存的 Chat 失活时关闭删除确认框', async () => {
            const { container } = render(KeepAliveHost);
            await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
            await fireEvent.click(actionButtons(boxes(container)[0])[1]);
            expect(boxes(container)[0].querySelector('.semi-chat-chatBox-action-show')).not.toBeNull();
            await fireEvent.click(screen.getByText('toggle'));
            expect(screen.getByText('away')).toBeInTheDocument();
            await fireEvent.click(screen.getByText('toggle'));
            expect(actionButtons(boxes(container)[0])[1]).toHaveAttribute('aria-expanded', 'false');
            await waitFor(() => expect(boxes(container)[0].querySelector('.semi-chat-chatBox-action-show')).toBeNull());
        });
    });

    describe('提示', () => {
        it('点击提示会以用户消息发送', async () => {
            const onHintClick = vi.fn<Listener<'hintClick'>>();
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const { container } = await renderChat({
                hints: ['first', 'second'],
                onHintClick,
                onChatsChange,
                hintCls: 'my-hints',
                hintStyle: { color: 'red' },
            });
            const section = container.querySelector('.semi-chat-hints');
            expect(section).toHaveClass('my-hints');
            expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            await fireEvent.click(screen.getByText('second'));
            expect(onHintClick).toHaveBeenCalledExactlyOnceWith('second');
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats, { role: 'user', id: expect.any(String), createAt: Date.now(), content: 'second' }]);
        });

        it('每个提示渲染为原生 button，以便键盘可达', async () => {
            await renderChat({ hints: ['first', 'second'] });
            const items = [...document.querySelectorAll('.semi-chat-hint-item')];
            expect(items.map((item) => item.tagName)).toEqual(['BUTTON', 'BUTTON']);
            expect(items[0]).toHaveAttribute('type', 'button');
            expect(screen.getByText('second').closest('button')).toBe(items[1]);
        });

        it('#hintBox 渲染每个提示及其点击处理函数', async () => {
            const onHintClick = vi.fn<Listener<'hintClick'>>();
            await renderChat(
                { hints: ['a', 'b'], onHintClick },
                {
                    hintBox: ({ content, index, onHintClick: click }: ChatHintBoxSlotProps) => <button type="button" onClick={click}>{`${index}:${content}`}</button>,
                }
            );
            await fireEvent.click(screen.getByText('1:b'));
            expect(onHintClick).toHaveBeenCalledExactlyOnceWith('b');
        });

        it('没有提示时不渲染提示区域', async () => {
            const { container } = await renderChat({ hints: [] });
            expect(container.querySelector('.semi-chat-hints')).toBeNull();
        });
    });

    describe('上传', () => {
        it('默认显示上传按钮，click upload 关闭时隐藏', async () => {
            const { container, rerender } = await renderChat();
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).not.toBeNull();
            await rerender({ enableUpload: false });
            expect(container.querySelector('.semi-chat-inputBox-upload')).toBeNull();
            await rerender({ enableUpload: { clickUpload: false } });
            expect(container.querySelector('.semi-chat-inputBox-upload')).toBeNull();
        });

        it('使用 #uploadButton 与 uploadProps 的 class', async () => {
            const { container } = await renderChat({ uploadProps: { class: 'my-upload' } }, { uploadButton: () => <span data-testid="trigger" /> });
            expect(container.querySelector('.semi-chat-inputBox-upload.my-upload')).not.toBeNull();
            expect(screen.getByTestId('trigger')).toBeInTheDocument();
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).toBeNull();
        });

        it('#uploadTip 给上传按钮加提示，且不多出 Tab 停靠点', async () => {
            const { container } = await renderChat({}, { uploadTip: () => 'tip text' });
            const upload = container.querySelector('.semi-chat-inputBox-upload') as HTMLElement;
            const stops = upload.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
            expect([...stops]).toEqual([container.querySelector('.semi-chat-inputBox-uploadButton')]);
            await fireEvent.mouseEnter(stops[0]);
            const tip = await screen.findByText('tip text');
            await waitFor(() => expect(stops[0]).toHaveAttribute('aria-describedby', tip.closest('[role="tooltip"]')?.id));
        });

        it('uploadProps.disabled 时默认上传按钮暴露禁用状态', async () => {
            const uploadButton = (container: Element) => container.querySelector('.semi-chat-inputBox-uploadButton') as HTMLElement;
            const { container, rerender } = await renderChat({ uploadProps: { disabled: true } });
            expect(uploadButton(container)).toHaveAttribute('aria-disabled', 'true');
            await rerender();
            expect(uploadButton(container)).not.toHaveAttribute('aria-disabled', 'true');
        });

        it('带提示的 #uploadButton 渲染不可聚焦内容时，Upload 的添加区是唯一的 Tab 停靠点', async () => {
            const onOpenFileDialog = vi.fn<() => void>();
            const { container } = await renderChat({ uploadProps: { onOpenFileDialog } }, { uploadTip: () => 'tip text', uploadButton: () => <span data-testid="trigger">pick</span> });
            const upload = container.querySelector('.semi-chat-inputBox-upload') as HTMLElement;
            const addArea = upload.querySelector('.semi-upload-add') as HTMLElement;
            await waitFor(() => expect(addArea).toHaveAttribute('role', 'button'));
            expect([...upload.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')]).toEqual([addArea]);
            expect(screen.getByTestId('trigger').parentElement).toHaveAttribute('data-popupid');
            await fireEvent.keyDown(addArea, { key: 'Enter' });
            expect(onOpenFileDialog).toHaveBeenCalledOnce();
        });

        it('带提示的 #uploadButton 渲染控件时，控件本身是触发器和 Tab 停靠点', async () => {
            const { container } = await renderChat({}, { uploadTip: () => 'tip text', uploadButton: () => <button type="button">pick</button> });
            const pick = screen.getByRole('button', { name: 'pick' });
            expect(pick).toHaveAttribute('data-popupid');
            const upload = container.querySelector('.semi-chat-inputBox-upload') as HTMLElement;
            expect([...upload.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')]).toEqual([pick]);
        });

        const ButtonRoot = defineComponent({ setup: () => () => <button type="button">pick</button> });
        it.each([
            ['根元素是 button 的组件', () => <ButtonRoot />],
            ['input', () => <input aria-label="pick" />],
        ])('带提示的 #uploadButton 为%s时，它是唯一的 Tab 停靠点并带 aria-describedby', async (_name, trigger) => {
            const { container } = await renderChat({}, { uploadTip: () => 'tip text', uploadButton: trigger });
            const upload = container.querySelector('.semi-chat-inputBox-upload') as HTMLElement;
            const stops = [...upload.querySelectorAll('button, input:not([type="file"]), [tabindex]:not([tabindex="-1"])')];
            const [stop] = stops;
            expect(stops).toEqual([stop]);
            expect(stop.closest('.semi-upload-add')).not.toBeNull();
            await userEvent.hover(stop);
            await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
            await waitFor(() => expect(stop).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id));
        });

        it('uploadProps 的 Upload 监听照常调用', async () => {
            const onSuccess = vi.fn<(body: unknown) => void>();
            const { container } = await renderChat({
                uploadProps: {
                    customRequest: ({ onSuccess: done }: { onSuccess: (body: unknown) => void }) => done({ ok: 1 }),
                    onSuccess,
                },
            });
            await fireEvent.change(container.querySelector('input[type="file"]') as Element, {
                target: { files: [file()] },
            });
            await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
            expect(onSuccess.mock.calls[0][0]).toEqual({ ok: 1 });
        });

        it('只传 uploadTipProps 也给上传按钮加 Tooltip，两者都不传时不加', async () => {
            const uploadButton = (container: Element) => container.querySelector('.semi-chat-inputBox-uploadButton') as HTMLElement;
            const { container, rerender } = await renderChat({ uploadTipProps: { position: 'top' } });
            expect(uploadButton(container)).toHaveAttribute('data-popupid');
            await rerender();
            expect(uploadButton(container)).not.toHaveAttribute('data-popupid');
        });

        it('挂载后增删 #uploadTip 时，Tooltip 随之出现和消失', async () => {
            const { container } = render(ToggleUploadTip);
            const uploadButton = () => container.querySelector('.semi-chat-inputBox-uploadButton') as HTMLElement;
            expect(uploadButton()).not.toHaveAttribute('data-popupid');
            await fireEvent.click(screen.getByTestId('toggle'));
            await waitFor(() => expect(uploadButton()).toHaveAttribute('data-popupid'));
            await fireEvent.click(screen.getByTestId('toggle'));
            await waitFor(() => expect(uploadButton()).not.toHaveAttribute('data-popupid'));
        });

        it('选中的文件变为附件，上传完成前阻止发送', async () => {
            const onInputChange = vi.fn<Listener<'inputChange'>>();
            const onChange = vi.fn<(change: UploadOnChangeProps) => void>();
            const { container } = await renderChat({
                onInputChange,
                uploadProps: { uploadTrigger: 'custom', onChange },
            });
            await fireEvent.change(container.querySelector('input[type="file"]') as Element, {
                target: { files: [file()] },
            });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            expect(container.querySelector('.semi-chat-attachment-file')).toHaveTextContent('a.txt');
            expect(onChange).toHaveBeenCalled();
            expect(onInputChange).toHaveBeenLastCalledWith({
                inputValue: '',
                attachment: [expect.objectContaining({ name: 'a.txt' })],
            });
            expect(sendButton(container)).toBeDisabled();
            await fireEvent.click(container.querySelector('.semi-chat-attachment-clear') as Element);
            expect(attachmentItems(container)).toHaveLength(0);
            expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: '', attachment: [] });
        });

        it('移除附件时 uploadProps.onChange 只收到一次移除后的 fileList 与被移除项', async () => {
            const onChange = vi.fn<(change: UploadOnChangeProps) => void>();
            const { container } = await renderChat({ uploadProps: { uploadTrigger: 'custom', onChange } });
            await fireEvent.change(container.querySelector('input[type="file"]') as Element, {
                target: { files: [file()] },
            });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            onChange.mockClear();
            await fireEvent.click(container.querySelector('.semi-chat-attachment-clear') as Element);
            expect(onChange).toHaveBeenCalledExactlyOnceWith({
                fileList: [],
                currentFile: expect.objectContaining({ name: 'a.txt' }),
            });
        });

        it('拖拽经过时显示放置区，放下后上传文件', async () => {
            const { container } = await renderChat({ uploadProps: { uploadTrigger: 'custom' } });
            await fireEvent.dragOver(root(container), filesDrag);
            const dropArea = container.querySelector('.semi-chat-dropArea') as Element;
            expect(dropArea).toHaveTextContent(text.dropAreaText);
            await fireEvent.drop(dropArea, { dataTransfer: { files: [file()] } });
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        });

        it('在页面内部拖拽不会打开放置区', async () => {
            const { container } = await renderChat();
            await fireEvent.dragStart(root(container));
            await fireEvent.dragOver(root(container), filesDrag);
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
            await fireEvent.dragEnd(root(container));
            await fireEvent.dragOver(root(container), filesDrag);
            expect(container.querySelector('.semi-chat-dropArea')).not.toBeNull();
        });

        it('离开放置区后隐藏', async () => {
            const { container } = mount({ chats: [] });
            await fireEvent.dragOver(root(container), filesDrag);
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            await fireEvent.dragLeave(container.querySelector('.semi-chat-dropArea') as Element, {
                relatedTarget: document.body,
            });
            vi.advanceTimersByTime(10);
            await nextTick();
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        });

        it('drag upload 关闭时没有放置区', async () => {
            const { container } = await renderChat({ enableUpload: { dragUpload: false } });
            await fireEvent.dragOver(root(container), filesDrag);
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        });

        it('根元素的拖拽监听与放置区处理都会执行，放置区处理在前', async () => {
            // Vue skips listeners after one that stops immediate propagation; the drop area proves Chat's ran first
            const onDragover = vi.fn<(e: DragEvent) => void>((e) => e.stopImmediatePropagation());
            const onDragstart = vi.fn<(e: DragEvent) => void>();
            const onDragend = vi.fn<(e: DragEvent) => void>();
            const { container } = mount({ chats: [], onDragover, onDragstart, onDragend });
            await fireEvent.dragOver(root(container), filesDrag);
            expect(onDragover).toHaveBeenCalledTimes(1);
            expect(container.querySelector('.semi-chat-dropArea')).not.toBeNull();
            await fireEvent.dragStart(root(container));
            await fireEvent.dragEnd(root(container));
            expect(onDragstart).toHaveBeenCalledTimes(1);
            expect(onDragend).toHaveBeenCalledTimes(1);
        });

        it('drag upload 关闭时根元素的拖拽监听照常执行', async () => {
            const onDragover = vi.fn<(e: DragEvent) => void>();
            const { container } = mount({ chats: [], enableUpload: { dragUpload: false }, onDragover });
            await fireEvent.dragOver(root(container), filesDrag);
            expect(onDragover).toHaveBeenCalledTimes(1);
        });

        it('粘贴文件时上传，paste upload 关闭时除外', async () => {
            const paste = (container: Element) => {
                const pasted = file();
                return fireEvent.paste(textarea(container), {
                    clipboardData: { items: [{ getAsFile: () => pasted }] },
                });
            };
            const { container, rerender } = await renderChat({ uploadProps: { uploadTrigger: 'custom' } });
            await paste(container);
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            await rerender({ enableUpload: { pasteUpload: false }, uploadProps: { uploadTrigger: 'custom' } });
            await paste(container);
            await sleep(20);
            expect(attachmentItems(container)).toHaveLength(1);
        });

        it('粘贴时每个剪贴板项只读取一次文件', async () => {
            const pasted = file();
            const getAsFile = vi.fn<() => File>(() => pasted);
            const { container } = await renderChat({ uploadProps: { uploadTrigger: 'custom' } });
            await fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile }] } });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            expect(getAsFile).toHaveBeenCalledTimes(1);
        });

        it('附件作为 content parts 发送', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const { handle } = await renderChat({ onChatsChange, onMessageSend });
            // Only the fields the message builder reads; the rest of FileItem is left out
            const attachment = [
                { name: 'a.png', url: 'https://semi.design/a.png', fileInstance: { type: 'image/png' } },
                {
                    name: 'b.pdf',
                    url: 'https://semi.design/b.pdf',
                    size: '1KB',
                    fileInstance: { type: 'application/pdf' },
                },
            ] as unknown as FileItem[];
            handle().sendMessage('see', attachment);
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('see', attachment);
            expect(onChatsChange.mock.calls[0][0].at(-1)?.content).toEqual([
                { type: 'text', text: 'see' },
                { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                {
                    type: 'file_url',
                    file_url: { url: 'https://semi.design/b.pdf', name: 'b.pdf', size: '1KB', type: 'application/pdf' },
                },
            ]);
        });
    });

    describe('滚动', () => {
        it('挂载时及新增消息时滚动到底部', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            expect(contentArea(container).scrollTop).toBe(1000);
            sizes.scrollHeight = 1500;
            await rerender({ chats: [...chats, { role: 'user', id: '4', content: 'new' }] });
            expect(contentArea(container).scrollTop).toBe(1500);
        });

        it('跟随流式输出中的最后一条消息，不跟随未变化的已完成消息', async () => {
            const sizes = mockScroll();
            const streaming: ChatMessage[] = [...chats.slice(0, 2), { ...chats[2], status: 'incomplete' }];
            const { container, rerender } = mount({ chats: streaming });
            sizes.scrollHeight = 1200;
            await rerender({
                chats: [...streaming.slice(0, 2), { ...chats[2], content: 'more', status: 'incomplete' }],
            });
            expect(contentArea(container).scrollTop).toBe(1200);
            const done = [...streaming.slice(0, 2), { ...chats[2], content: 'done', status: 'complete' as const }];
            await rerender({ chats: done });
            sizes.scrollHeight = 1400;
            await rerender({ chats: [...done] });
            expect(contentArea(container).scrollTop).toBe(1200);
        });

        it('提示变多时滚动到底部', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat({ hints: [] });
            sizes.scrollHeight = 1300;
            await rerender({ hints: ['a'] });
            expect(contentArea(container).scrollTop).toBe(1300);
        });

        it('发送前后滚动条保持可见', async () => {
            mockScroll();
            const { container } = await renderChat();
            const area = contentArea(container);
            expect(area.className).toBe('semi-chat-container');
            await type(container, 'hi');
            await fireEvent.click(sendButton(container));
            expect(area.className).toBe('semi-chat-container');
        });

        it('未使用滚轮向上滚动时停止跟随，直到下次发送', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            const area = contentArea(container);
            area.scrollTop = 800;
            await fireEvent.scroll(area);
            area.scrollTop = 0;
            await fireEvent.scroll(area);

            sizes.scrollHeight = 1500;
            const more = [...chats, { role: 'assistant', id: '4', content: 'more' }];
            await rerender({ chats: more });
            expect(area.scrollTop).toBe(0);

            await type(container, 'hi');
            await fireEvent.click(sendButton(container));
            await rerender({ chats: [...more, { role: 'user', id: '5', content: 'hi' }] });
            expect(area.scrollTop).toBe(1500);
        });

        it('滚回底部后恢复跟随', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            const area = contentArea(container);
            area.scrollTop = 800;
            await fireEvent.scroll(area);
            area.scrollTop = 0;
            await fireEvent.scroll(area);
            area.scrollTop = 800;
            await fireEvent.scroll(area);

            sizes.scrollHeight = 1500;
            await rerender({ chats: [...chats, { role: 'assistant', id: '4', content: 'more' }] });
            expect(area.scrollTop).toBe(1500);
        });

        it('读者位于底部时，内容缩短仍保持跟随', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            const area = contentArea(container);
            area.scrollTop = 800;
            await fireEvent.scroll(area);
            sizes.scrollHeight = 600;
            area.scrollTop = 400;
            await fireEvent.scroll(area);

            sizes.scrollHeight = 1200;
            await rerender({ chats: [...chats, { role: 'assistant', id: '4', content: 'more' }] });
            expect(area.scrollTop).toBe(1200);
        });

        it('离开底部时显示回到底部按钮，并带动画回到底部', async () => {
            mockScroll();
            const { container } = await renderChat();
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
            });
            const area = contentArea(container);
            area.scrollTop = 100;
            await fireEvent.scroll(area);
            vi.advanceTimersByTime(200);
            await nextTick();
            const back = container.querySelector('.semi-chat-action-backBottom') as HTMLElement;
            expect(back).not.toBeNull();
            expect(back).toHaveAccessibleName(text.backToBottom);

            await fireEvent.click(back);
            vi.advanceTimersByTime(400);
            expect(area.scrollTop).toBe(1000);
            await fireEvent.scroll(area);
            vi.advanceTimersByTime(200);
            await nextTick();
            expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
        });

        it('忽略从内容内部冒泡上来的滚动事件', async () => {
            mockScroll();
            const { container } = await renderChat();
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
            });
            contentArea(container).scrollTop = 0;
            await fireEvent.scroll(container.querySelector('.semi-chat-chatBox') as Element);
            vi.advanceTimersByTime(200);
            await nextTick();
            expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
        });

        it('显示停止按钮时隐藏回到底部按钮', async () => {
            mockScroll();
            const generating: ChatMessage[] = [...chats.slice(0, 2), { ...chats[2], status: 'loading' }];
            const { container } = mount({ chats: generating, showStopGenerate: true });
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
            });
            contentArea(container).scrollTop = 0;
            await fireEvent.scroll(contentArea(container));
            vi.advanceTimersByTime(200);
            await nextTick();
            expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
            expect(container.querySelector('.semi-chat-action-stop')).not.toBeNull();
        });
    });

    describe('handle 方法', () => {
        it('不带附件的 sendMessage 保持 content 为字符串', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const { handle } = await renderChat({ onChatsChange, onMessageSend });
            handle().sendMessage('hi');
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hi', undefined);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'hi' })]);
        });

        it('resetMessage、clearContext、scrollToBottom 与 sendMessage', async () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const onMessageReset = vi.fn<Listener<'messageReset'>>();
            const onClear = vi.fn<Listener<'clear'>>();
            const onMessageSend = vi.fn<Listener<'messageSend'>>();
            const { container, handle } = await renderChat({ onChatsChange, onMessageReset, onClear, onMessageSend });

            handle().resetMessage();
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), expect.objectContaining({ role: 'assistant', status: 'loading', content: '' })]);
            expect(onMessageReset).toHaveBeenCalledExactlyOnceWith(null);

            handle().clearContext();
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ role: 'divider' })]);
            expect(onClear).toHaveBeenCalledTimes(1);

            handle().sendMessage('hi', []);
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hi', []);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'hi' })]);

            mockScroll({ scrollHeight: 800 });
            handle().scrollToBottom(false);
            expect(contentArea(container).scrollTop).toBe(800);
        });

        it('scrollToBottom(true) 带动画', async () => {
            const { handle } = await renderChat();
            vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
            vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(800);
            const setTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');
            handle().scrollToBottom(true);
            expect(setTop).not.toHaveBeenCalled();
            vi.advanceTimersByTime(400);
            expect(setTop).toHaveBeenLastCalledWith(800);
        });

        it('handle 仅暴露文档中的方法', async () => {
            const { handle } = await renderChat();
            expect(Object.keys(handle()).sort()).toEqual(['clearContext', 'resetMessage', 'scrollToBottom', 'sendMessage']);
        });

        it('没有消息时 clearContext 追加分隔符', () => {
            const onChatsChange = vi.fn<Listener<'chatsChange'>>();
            const { handle } = mount({ chats: [], roleConfig: undefined, onChatsChange });
            handle().clearContext();
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([expect.objectContaining({ role: 'divider' })]);
        });
    });

    describe('默认值', () => {
        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });

        it('从 semiGlobal.config.overrideDefaultProps 读取默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { Chat: { mode: 'noBubble', placeholder: 'global' } };
            const { container } = await renderChat();
            expect(container.querySelector('.semi-chat-chatBox-content-bubble')).toBeNull();
            expect(textarea(container).placeholder).toBe('global');
        });

        it('全局 TextArea 默认值不给输入框加清除按钮、计数器与行号', async () => {
            semiGlobal.config.overrideDefaultProps = { TextArea: { maxCount: 5, showClear: true, showCounter: true, showLineNumber: true } };
            const { container } = await renderChat();
            await fireEvent.update(textarea(container), 'hello');
            const inputBox = container.querySelector('.semi-chat-inputBox') as HTMLElement;
            expect(inputBox.querySelector('.semi-input-clearbtn, .semi-input-textarea-counter, .semi-input-textarea-lineNumber')).toBeNull();
        });

        it('全局的 align 与 showStopGenerate 生效，显式传入的值优先', async () => {
            semiGlobal.config.overrideDefaultProps = { Chat: { align: 'leftAlign', showStopGenerate: true } };
            const loading = [...chats.slice(0, 2), { ...chats[2], status: 'loading' as const }];
            const { container, rerender } = mount({ chats: loading });
            expect(container.querySelector('.semi-chat-chatBox-right')).toBeNull();
            expect(container.querySelector('.semi-chat-action-stop')).not.toBeNull();
            await rerender({ chats: loading, align: 'leftRight', showStopGenerate: false });
            expect(container.querySelector('.semi-chat-chatBox-right')).not.toBeNull();
            expect(container.querySelector('.semi-chat-action-stop')).toBeNull();
        });

        it('kebab-case 属性与布尔简写都能设置 prop', async () => {
            const { container } = render(Kebab);
            await waitFor(() => expect(screen.getByText('question')).toBeInTheDocument());
            expect(container.querySelector('.semi-chat-action-stop')).not.toBeNull();
            expect(container.querySelector('.semi-chat-inputBox-clearButton')).not.toBeNull();
            expect(container.querySelector('.semi-upload')).toBeNull();
        });
    });

    describe('v-model:chats', () => {
        it('like 后 update:chats 回写列表，DOM 随之更新', async () => {
            const { container } = render(ModelHost);
            await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
            await fireEvent.click(actionButtons(boxes(container)[1])[1]);
            expect(screen.getByTestId('like')).toHaveTextContent('true');
            expect(actionButtons(boxes(container)[1])[1].querySelector('.semi-icon-like_thumb')).not.toBeNull();
        });

        it('单向绑定且不回写时，列表保持不变', async () => {
            const { container } = await renderChat();
            const like = () => actionButtons(boxes(container)[2])[1];
            await fireEvent.click(like());
            expect(like().querySelector('.semi-icon-like_thumb')).toBeNull();
        });
    });

    describe('属性落点', () => {
        it('将未声明属性传给根元素，自身的监听不出现在 DOM 上', async () => {
            const { container } = await renderChat({
                'data-testid': 'chat',
                'aria-label': 'conversation',
                onMessageSend: vi.fn<Listener<'messageSend'>>(),
                onClear: vi.fn<Listener<'clear'>>(),
            });
            const node = screen.getByTestId('chat');
            expect(node).toBe(root(container));
            expect(node).toHaveAttribute('aria-label', 'conversation');
            expect(node.getAttributeNames().filter((name) => name.startsWith('on'))).toEqual([]);
        });

        it('根元素被命名时为 group，使用方的 role 优先', async () => {
            const { container, rerender } = await renderChat();
            expect(root(container)).not.toHaveAttribute('role');
            await rerender({ 'aria-label': 'conversation' });
            expect(screen.getByRole('group', { name: 'conversation' })).toBe(root(container));
            await rerender({ 'aria-labelledby': 'heading', role: 'region' });
            expect(root(container)).toHaveAttribute('role', 'region');
        });
    });

    describe('更新', () => {
        it('提示可在挂载后出现，之后再消失', async () => {
            const { container, rerender } = await renderChat();
            await rerender({ hints: ['a'] });
            expect(container.querySelector('.semi-chat-hints')).toHaveTextContent('a');
            await rerender();
            expect(container.querySelector('.semi-chat-hints')).toBeNull();
        });

        it('数组内容渲染时不出现重复 key 警告', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            mount({
                chats: [
                    {
                        role: 'user',
                        id: '1',
                        content: [
                            { type: 'text', text: 'one' },
                            { type: 'text', text: 'two' },
                            { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                        ],
                    },
                ],
            });
            await waitFor(() => expect(screen.getByText('two')).toBeInTheDocument());
            expect(warn.mock.calls.filter((args) => /Duplicate keys/.test(args.map(String).join(' ')))).toEqual([]);
        });

        it('markdownRenderProps 变化后会作用到已渲染的消息', async () => {
            const { container, rerender } = await renderChat({ markdownRenderProps: { class: 'md-a' } });
            expect(container.querySelectorAll('.md-a')).toHaveLength(3);
            await rerender({ markdownRenderProps: { class: 'md-b' } });
            expect(container.querySelectorAll('.md-b')).toHaveLength(3);
        });

        it('前一条消息不再与当前消息同角色时，头像重新显示', async () => {
            const second = { role: 'assistant', id: '2', content: 'second' };
            const { container, rerender } = mount({
                chats: [{ role: 'assistant', id: '1', content: 'first' }, second],
            });
            expect(boxes(container)[1].querySelector('.semi-chat-chatBox-avatar-hidden')).not.toBeNull();
            await rerender({ chats: [{ role: 'user', id: '0', content: 'q' }, second] });
            expect(boxes(container)[1].querySelector('.semi-chat-chatBox-avatar-hidden')).toBeNull();
            expect(boxes(container)[1].querySelector('.semi-chat-chatBox-title')).toHaveTextContent('Assistant');
        });

        it('卸载时取消待执行的滚动测量', async () => {
            const sizes = mockScroll();
            const reads = vi.fn<() => number>(() => sizes.scrollHeight);
            const { container, unmount } = await renderChat();
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
            });
            await fireEvent.scroll(contentArea(container));
            unmount();
            vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(reads);
            vi.advanceTimersByTime(200);
            expect(reads).not.toHaveBeenCalled();
        });
    });

    describe('resize', () => {
        it('监听滚动容器', async () => {
            const resize = mockResizeObserver();
            const { container } = await renderChat();
            expect(resize.observed()).toContain(contentArea(container));
        });
    });

    describe('代码块复制按钮', () => {
        const codeChats = [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }];
        const copyButton = (container: Element) => container.querySelector<HTMLElement>('.semi-chat-chatBox-content-code-topSlot-copy-wrapper');

        it('保持按钮焦点，复制后更新其名称，且不提交表单', async () => {
            const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
            const { container } = render(() => (
                <form onSubmit={onSubmit}>
                    <LocaleProvider locale={en_US}>{() => <Chat chats={codeChats} roleConfig={roleConfig} />}</LocaleProvider>
                </form>
            ));
            const button = await waitFor(() => {
                expect(copyButton(container)).not.toBeNull();
                return copyButton(container) as HTMLElement;
            });
            expect(button).toHaveAccessibleName(text.copy);
            button.focus();
            await fireEvent.click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(text.copied));
            expect(document.activeElement).toBe(button);
            expect(onSubmit).not.toHaveBeenCalled();
            await fireEvent.click(button);
            expect(writeText).toHaveBeenCalledTimes(1);
        });

        it('复制 rehype 插件拆成元素的代码文本', async () => {
            const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            type HastNode = { type: string; tagName?: string; properties?: object; children?: HastNode[] };
            const wrapCodeText = () => {
                const wrap = (node: HastNode) => {
                    if (node.tagName === 'code') {
                        node.children = [{ type: 'element', tagName: 'span', properties: {}, children: node.children }];
                    }
                    node.children?.forEach(wrap);
                };
                return wrap;
            };
            const { container } = mount({ chats: codeChats, markdownRenderProps: { rehypePlugins: [wrapCodeText] } as never });
            const button = await waitFor(() => {
                expect(copyButton(container)).not.toBeNull();
                return copyButton(container) as HTMLElement;
            });
            await fireEvent.click(button);
            expect(writeText).toHaveBeenCalledWith('const a = 1;\n');
        });
    });
});

describe('Chat 可访问名称', () => {
    it('消息 textarea 的名称来自语言包', async () => {
        await renderChat();
        expect(screen.getByRole('textbox', { name: text.input })).toBeInTheDocument();
    });

    it('每个头像都带空 alt，消息图片的 alt 取内容 alt，缺省时取语言包', async () => {
        const { container } = mount({
            chats: [
                { role: 'user', id: '1', content: 'one ![chart](https://semi.design/chart.png)' },
                { role: 'user', id: '2', content: 'two' },
                {
                    role: 'assistant',
                    id: '3',
                    content: [{ type: 'image_url', image_url: { url: 'https://semi.design/a.png' } }],
                },
            ],
        });
        await waitFor(() => expect(screen.getByText('two')).toBeInTheDocument());
        const avatars = [...container.querySelectorAll('.semi-chat-chatBox-avatar img')];
        expect(avatars.map((img) => img.getAttribute('alt'))).toEqual(['', '', '']);
        expect(screen.getByRole('img', { name: text.image })).toHaveAttribute('src', 'https://semi.design/a.png');
        expect(screen.getByRole('img', { name: 'chart' })).toHaveAttribute('src', 'https://semi.design/chart.png');
    });
});

describe('Chat Tab 停靠点', () => {
    it('删除按钮本身带有确认弹层状态，外层包裹元素不带', async () => {
        const { container } = await renderChat();
        const triggers = container.querySelectorAll('.semi-chat-chatBox-action [aria-haspopup="dialog"]');
        expect(triggers.length).toBeGreaterThan(0);
        for (const trigger of triggers) {
            expect(trigger.tagName).toBe('BUTTON');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(trigger).not.toHaveAttribute('tabindex', '-1');
        }
    });
});

describe('Chat 消息日志', () => {
    it('消息列表是具名的 log，包含全部消息', async () => {
        await renderChat();
        const log = screen.getByRole('log', { name: text.messages });
        expect(within(log).getByText('assistant says')).toBeInTheDocument();
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('最后一条回复加载中或未完成时为 busy 状态', async () => {
        const streaming: ChatMessage[] = [...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'assistant', status: 'loading' }];
        const { rerender } = mount({ chats: streaming });
        const log = screen.getByRole('log');
        expect(log).toHaveAttribute('aria-busy', 'true');
        await rerender({ chats: [...chats.slice(0, 2), { ...streaming[2], status: 'incomplete' }] });
        expect(log).toHaveAttribute('aria-busy', 'true');
        await rerender({ chats: [...chats.slice(0, 2), { ...streaming[2], status: 'complete' }] });
        expect(log).toHaveAttribute('aria-busy', 'false');
    });
});

describe('Chat 代码审计修复', () => {
    const openDelete = async (container: Element) => {
        await fireEvent.click(actionButtons(boxes(container)[1])[1]);
        await screen.findByText(text.deleteConfirm);
    };
    const actionShown = (container: Element) => boxes(container)[1].querySelector('.semi-chat-chatBox-action-show');

    describe('只关闭点击上传', () => {
        const uploadProps = { uploadTrigger: 'custom' as const };

        it('拖拽放下的文件仍成为附件，且不渲染上传按钮', async () => {
            const { container } = await renderChat({ enableUpload: { clickUpload: false }, uploadProps });
            await fireEvent.dragOver(root(container), filesDrag);
            await fireEvent.drop(container.querySelector('.semi-chat-dropArea') as Element, {
                dataTransfer: { files: [file()] },
            });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).toBeNull();
        });

        it('粘贴的文件仍成为附件', async () => {
            const { container } = await renderChat({ enableUpload: { clickUpload: false }, uploadProps });
            const pasted = file();
            await fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile: () => pasted }] } });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        });

        it('三种上传方式都关闭时不渲染上传节点', async () => {
            const { container } = await renderChat({ enableUpload: false });
            expect(container.querySelector('.semi-upload')).toBeNull();
        });
    });

    it('代码围栏的语言含连字符时语言栏显示完整语言 id', async () => {
        const { container } = mount({
            chats: [{ role: 'assistant', id: '1', content: '```objective-c\nint x = 1;\n```' }],
        });
        await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-type')).toHaveTextContent(/^objective-c$/));
    });

    it('文件卡片的类型取小写扩展名，没有扩展名时取 MIME 子类型而不是文件名', async () => {
        const fileMessage = (name: string, type = '') => ({
            type: 'file_url' as const,
            file_url: { url: `https://semi.design/${name}`, name, size: '1KB', type },
        });
        const { container } = mount({
            chats: [
                {
                    role: 'user',
                    id: '1',
                    content: [fileMessage('Makefile'), fileMessage('README', 'text/plain'), fileMessage('a.PDF')],
                },
            ],
        });
        const types = () => [...container.querySelectorAll('.semi-chat-attachment-file-type')].map((n) => n.textContent);
        await waitFor(() => expect(types()).toHaveLength(3));
        expect(types()).toEqual(['', 'plain', 'pdf']);
    });

    describe('删除确认框', () => {
        it('按 Escape 关闭确认框', async () => {
            const { container } = await renderChat();
            await openDelete(container);
            await fireEvent.keyDown(actionButtons(boxes(container)[1])[1], { key: 'Escape' });
            await waitFor(() => expect(actionShown(container)).toBeNull());
        });

        it('使用方没有同步删除消息时，确认后确认框也会关闭', async () => {
            const onMessageDelete = vi.fn<Listener<'messageDelete'>>();
            const { container } = await renderChat({ onMessageDelete });
            await openDelete(container);
            await fireEvent.click(screen.getByRole('button', { name: en_US.Popconfirm.confirm }));
            expect(onMessageDelete).toHaveBeenCalledTimes(1);
            await waitFor(() => expect(actionShown(container)).toBeNull());
        });
    });
});

describe('Chat 上传禁用与拖拽', () => {
    it('uploadProps.disabled 时粘贴的文件不会成为附件，拖拽也不显示放置区', async () => {
        const { container } = await renderChat({ uploadProps: { disabled: true, uploadTrigger: 'custom' } });
        const pasted = file();
        await fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile: () => pasted }] } });
        await fireEvent.dragOver(root(container), filesDrag);
        await sleep(20);
        expect(attachmentItems(container)).toHaveLength(0);
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });

    it('拖拽文本或链接时不显示放置区', async () => {
        const { container } = await renderChat();
        await fireEvent.dragOver(root(container), { dataTransfer: { types: ['text/plain'] } });
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });
});

describe('Chat 操作与消息渲染', () => {
    it('点赞与点踩按钮用 aria-pressed 表示状态，其余操作不带', async () => {
        const { container } = await renderChat({ chats: [...chats.slice(0, 2), { ...chats[2], like: true }] });
        const [copy, like, dislike] = actionButtons(boxes(container)[2]);
        expect(like).toHaveAttribute('aria-pressed', 'true');
        expect(dislike).toHaveAttribute('aria-pressed', 'false');
        expect(copy).not.toHaveAttribute('aria-pressed');
    });

    it('customMarkDownComponents 中的 undefined 项回退到内置组件', async () => {
        const { container } = mount({ chats: [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }], customMarkDownComponents: { code: undefined } as never });
        await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-type')).toHaveTextContent('js'));
    });

    it('复制成功的提示在消息日志之外', async () => {
        mockClipboard(vi.fn<(value: string) => Promise<void>>(() => Promise.resolve()));
        const { container } = await renderChat();
        await fireEvent.click(actionButtons(boxes(container)[2])[0]);
        const toast = await screen.findByText(text.copySuccess);
        expect(toast.closest('[role="log"]')).toBeNull();
    });
});

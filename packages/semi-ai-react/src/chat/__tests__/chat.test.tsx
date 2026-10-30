import { createRef, StrictMode, type SubmitEvent, type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { Message } from '@fibrae/semi-ai-foundation/chat/foundation';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { FileItem, UploadProps } from '@fibrae/semi-ui-react/upload/index';
import { mockResizeObserver, sleep } from '@test/utils/react';
import Code from '../chat-box/code';
import Chat, { type ChatHandle } from '../index';
import type { ChatBoxRenderConfig, ChatProps, DefaultActionNodeObj, MarkdownRenderProps } from '../interface';

type Props = ChatProps;

const roleConfig = {
    user: { name: 'User', avatar: 'https://semi.design/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://semi.design/assistant.png' },
    system: { name: 'System', avatar: 'https://semi.design/system.png' },
};

const chats: Message[] = [
    { role: 'system', id: '1', content: 'system says' },
    { role: 'user', id: '2', content: 'user says' },
    { role: 'assistant', id: '3', content: 'assistant says' },
];

const boxes = (container) => [...container.querySelectorAll('.semi-chat-chatBox')];
const textarea = (container) => container.querySelector('textarea');
const sendButton = (container) => container.querySelector('.semi-chat-inputBox-sendButton');
const actionButtons = (box) => [...box.querySelectorAll('.semi-chat-chatBox-action-btn')];
const contentArea = (container) => container.querySelector('.semi-chat-container');
const filesDrag = { dataTransfer: { types: ['Files'] } };

async function renderChat(props = {}) {
    const result = render(<Chat chats={chats} roleConfig={roleConfig} {...props} />);
    await waitFor(() => expect(screen.getByText('assistant says')).toBeInTheDocument());
    return result;
}

function type(container, value) {
    fireEvent.change(textarea(container), { target: { value } });
}

function mockClipboard(writeText) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

// jsdom has no layout: give every element fixed sizes and a scrollTop that keeps what is written
function mockScroll({ scrollHeight = 1000, clientHeight = 200 } = {}) {
    const sizes = { scrollHeight, clientHeight };
    const scrollTop = new WeakMap();
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => sizes.scrollHeight);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => sizes.clientHeight);
    vi.spyOn(Element.prototype, 'scrollTop', 'get').mockImplementation(function () {
        return scrollTop.get(this) ?? 0;
    });
    vi.spyOn(Element.prototype, 'scrollTop', 'set').mockImplementation(function (value) {
        scrollTop.set(this, value);
    });
    return sizes;
}

describe('Chat', () => {
    beforeEach(() => {
        // Upload previews files through object URLs, which jsdom does not create
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
    });

    afterEach(() => {
        vi.useRealTimers();
        Reflect.deleteProperty(navigator, 'clipboard');
    });

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
            rerender(<Chat align="leftAlign" chats={chats} roleConfig={roleConfig} />);
            expect(container.querySelector('.semi-chat-chatBox-right')).toBeNull();
        });

        it.each([
            ['bubble', [['semi-chat-chatBox-content-bubble'], ['semi-chat-chatBox-content-bubble', 'semi-chat-chatBox-content-user'], ['semi-chat-chatBox-content-bubble']]],
            ['noBubble', [[], [], []]],
            ['userBubble', [[], ['semi-chat-chatBox-content-userBubble', 'semi-chat-chatBox-content-user'], []]],
        ])('mode 为 %s 时设置内容类名', async (mode, expected) => {
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

        it('首条消息没有 role 时仍显示头像与标题', () => {
            const { container } = render(<Chat chats={[{ id: '1', content: 'no role' }]} roleConfig={roleConfig} />);
            const [first] = boxes(container);
            expect(first.querySelector('.semi-chat-chatBox-avatar-hidden')).toBeNull();
            expect(first.querySelector('.semi-chat-chatBox-title')).not.toBeNull();
        });

        it('显示加载与错误状态', async () => {
            const { container } = render(
                <Chat
                    chats={[
                        { role: 'user', id: '1', content: 'oops', status: 'error' },
                        { role: 'assistant', id: '2', content: '', status: 'loading' },
                    ]}
                    roleConfig={roleConfig}
                />
            );
            expect(container.querySelector('.semi-chat-chatBox-content-loading')).not.toBeNull();
            expect(container.querySelector('.semi-chat-chatBox-content-error')).not.toBeNull();
        });

        it('数组内容渲染为文本、图片与文件', async () => {
            const { container } = render(
                <Chat
                    chats={
                        [
                            {
                                role: 'user',
                                id: '1',
                                content: [
                                    { type: 'text', text: 'look at this' },
                                    { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                                    {
                                        type: 'file_url',
                                        file_url: { url: 'https://semi.design/a.pdf', name: 'a.pdf', size: '1KB' },
                                    },
                                ],
                            },
                        ] as Message[]
                    }
                    roleConfig={roleConfig}
                />
            );
            await waitFor(() => expect(screen.getByText('look at this')).toBeInTheDocument());
            expect(container.querySelector<HTMLImageElement>('.semi-chat-attachment-img img').src).toBe('https://semi.design/a.png');
            const file = container.querySelector('.semi-chat-attachment-file');
            expect(file.getAttribute('href')).toBe('https://semi.design/a.pdf');
            expect(file).toHaveTextContent('a.pdf');
            expect(file).toHaveTextContent('1KB');
        });

        it('除非 escapeHtml 为 false，否则转义用户消息中的 HTML', async () => {
            const html = { role: 'user', id: '1', content: 'a <b>bold</b> word' };
            const { container, rerender } = render(<Chat chats={[html]} roleConfig={roleConfig} />);
            await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content')).toHaveTextContent('<b>'));
            rerender(<Chat chats={[{ ...html, id: '2' }]} escapeHtml={false} roleConfig={roleConfig} />);
            await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content')).toHaveTextContent('word'));
            expect(container.querySelector('.semi-chat-chatBox-content')).not.toHaveTextContent('<b>');
        });

        it('使用默认或自定义分隔符渲染 divider 消息', async () => {
            const withDivider = [...chats, { role: 'divider', id: 'd' }];
            const { container, rerender } = await renderChat({ chats: withDivider });
            expect(container.querySelector('.semi-chat-divider')).toHaveTextContent('上下文已清除');
            const renderDivider = vi.fn<NonNullable<Props['renderDivider']>>((message) => <hr key={message.id} data-testid="divider" />);
            rerender(<Chat chats={withDivider} roleConfig={roleConfig} renderDivider={renderDivider} />);
            expect(screen.getByTestId('divider')).toBeInTheDocument();
            expect(renderDivider).toHaveBeenCalledWith(withDivider[3]);
        });

        it('将 customMarkDownComponents 与 markdownRenderProps 传给 markdown 渲染器', async () => {
            const Strong = ({ children }) => <em data-testid="custom">{children}</em>;
            render(<Chat chats={[{ role: 'assistant', id: '1', content: 'a **b** c' }]} customMarkDownComponents={{ strong: Strong }} markdownRenderProps={{ className: 'my-md' }} roleConfig={roleConfig} />);
            await waitFor(() => expect(screen.getByTestId('custom')).toHaveTextContent('b'));
            expect(document.querySelector('.my-md')).not.toBeNull();
        });

        it('markdownRenderProps 不接受由每条消息决定的 raw、ref、components', () => {
            expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('raw');
            expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('ref');
            expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('components');
            expectTypeOf<MarkdownRenderProps>().toHaveProperty('format');
        });

        it('uploadProps 不接受由 Chat 管理的 fileList、defaultFileList', () => {
            type ChatUploadProps = NonNullable<ChatProps['uploadProps']>;
            expectTypeOf<ChatUploadProps>().not.toHaveProperty('fileList');
            expectTypeOf<ChatUploadProps>().not.toHaveProperty('defaultFileList');
            expectTypeOf<ChatUploadProps>().toHaveProperty('action');
        });
    });

    describe('chatBoxRenderConfig', () => {
        it('以默认节点调用每个渲染函数', async () => {
            const config = {
                renderChatBoxTitle: vi.fn<NonNullable<ChatBoxRenderConfig['renderChatBoxTitle']>>(({ role, defaultTitle }) => (
                    <div className="t">
                        {role.name}!{defaultTitle}
                    </div>
                )),
                renderChatBoxAvatar: vi.fn<NonNullable<ChatBoxRenderConfig['renderChatBoxAvatar']>>(({ role }) => <div className="a">{role.name}</div>),
                renderChatBoxContent: vi.fn<NonNullable<ChatBoxRenderConfig['renderChatBoxContent']>>(({ message, className }) => <div className={`c ${className}`}>{message.content as string}</div>),
                renderChatBoxAction: vi.fn<NonNullable<ChatBoxRenderConfig['renderChatBoxAction']>>(({ defaultActionsObj, className }) => <div className={`x ${className}`}>{Object.keys(defaultActionsObj).join(',')}</div>),
            };
            const { container } = render(<Chat chatBoxRenderConfig={config} chats={chats} roleConfig={roleConfig} />);
            expect([...container.querySelectorAll('.t')].map((n) => n.textContent)).toEqual(['System!System', 'User!User', 'Assistant!Assistant']);
            expect([...container.querySelectorAll('.a')].map((n) => n.textContent)).toEqual(['System', 'User', 'Assistant']);
            expect(container.querySelectorAll('.c.semi-chat-chatBox-content-bubble')).toHaveLength(3);
            expect([...container.querySelectorAll('.x')].map((n) => n.textContent)).toEqual(['copyNode,likeNode,dislikeNode,deleteNode', 'copyNode,deleteNode', 'copyNode,likeNode,dislikeNode,resetNode,deleteNode']);
            expect(container.querySelector('.x').classList).toContain('semi-chat-chatBox-action');
        });

        it('DefaultActionNodeObj 的键都是可选的', () => {
            expectTypeOf<{ deleteNode: ReactNode }>().toExtend<DefaultActionNodeObj>();
        });

        it('renderFullChatBox 接收默认节点', async () => {
            const renderFullChatBox = vi.fn<NonNullable<ChatBoxRenderConfig['renderFullChatBox']>>(({ message, defaultNodes, className }) => (
                <div key={message.id} className={`full ${className}`}>
                    {defaultNodes.title}
                    {defaultNodes.content}
                </div>
            ));
            const { container } = await renderChat({ chatBoxRenderConfig: { renderFullChatBox } });
            expect(container.querySelectorAll('.full')).toHaveLength(3);
            expect(container.querySelector('.full.semi-chat-chatBox-right')).toHaveTextContent('Useruser says');
            expect(container.querySelector('.semi-chat-chatBox-action')).toBeNull();
        });
    });

    describe('输入框', () => {
        it('发送输入的内容并清空输入框', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onInputChange = vi.fn<NonNullable<Props['onInputChange']>>();
            const { container } = await renderChat({ onMessageSend, onChatsChange, onInputChange });
            expect(sendButton(container)).toBeDisabled();
            type(container, 'hello');
            expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: 'hello', attachment: [] });
            expect(sendButton(container)).not.toBeDisabled();
            fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hello', []);
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats, { role: 'user', id: expect.any(String), createAt: Date.now(), content: 'hello' }]);
            expect(textarea(container).value).toBe('');
        });

        it.each([
            ['enter', false, 1],
            ['enter', true, 0],
            ['shift+enter', false, 0],
            ['shift+enter', true, 1],
        ])('sendHotKey 为 %s、shiftKey 为 %s 时发送 %i 次', async (sendHotKey, shiftKey, times) => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container } = await renderChat({ onMessageSend, sendHotKey });
            type(container, 'hello');
            fireEvent.keyDown(textarea(container), { key: 'Enter', keyCode: 13, shiftKey });
            expect(onMessageSend).toHaveBeenCalledTimes(times);
        });

        it('canSend 覆盖内部的发送状态', async () => {
            const { container, rerender } = await renderChat({ canSend: true });
            expect(sendButton(container)).not.toBeDisabled();
            rerender(<Chat canSend={false} chats={chats} roleConfig={roleConfig} />);
            type(container, 'hello');
            expect(sendButton(container)).toBeDisabled();
            rerender(<Chat canSend chats={chats} roleConfig={roleConfig} />);
            expect(sendButton(container)).not.toBeDisabled();
        });

        it('点击输入区域时聚焦 textarea', async () => {
            const { container } = await renderChat();
            fireEvent.click(container.querySelector('.semi-chat-inputBox-inner'));
            expect(document.activeElement).toBe(textarea(container));
        });

        it('应用 placeholder、inputBoxCls、inputBoxStyle、slots、className 与 style', async () => {
            const { container } = await renderChat({
                placeholder: 'Ask me',
                inputBoxCls: 'my-input',
                inputBoxStyle: { color: 'red' },
                topSlot: <div data-testid="top" />,
                bottomSlot: <div data-testid="bottom" />,
                className: 'my-chat',
                style: { width: 300 },
            });
            expect(textarea(container).placeholder).toBe('Ask me');
            expect(container.querySelector('.semi-chat-inputBox.my-input')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(container.firstChild).toHaveClass('semi-chat', 'my-chat');
            expect(container.firstChild).toHaveStyle({ width: '300px' });
            expect(screen.getByTestId('top')).toBeInTheDocument();
            expect(screen.getByTestId('bottom')).toBeInTheDocument();
        });

        it('renderInputArea 接收默认节点及发送与清空处理函数', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onClear = vi.fn<NonNullable<Props['onClear']>>();
            const renderInputArea = vi.fn<NonNullable<Props['renderInputArea']>>(({ defaultNode, onSend, onClear: clear, detailProps }) => (
                <div>
                    <div data-testid="default">{defaultNode}</div>
                    <div data-testid="input">{detailProps.inputNode}</div>
                    <div data-testid="send">{detailProps.sendNode}</div>
                    <div data-testid="upload">{detailProps.uploadNode}</div>
                    <div data-testid="clear">{detailProps.clearContextNode}</div>
                    <button onClick={() => onSend('custom', [])}>send it</button>
                    <button onClick={() => clear()}>clear it</button>
                    <button onClick={detailProps.onClick}>focus it</button>
                </div>
            ));
            const { container } = await renderChat({ renderInputArea, onMessageSend, onChatsChange, onClear });
            expect(within(screen.getByTestId('default')).getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByTestId('send').querySelector('.semi-chat-inputBox-sendButton')).not.toBeNull();
            expect(screen.getByTestId('upload').querySelector('.semi-chat-inputBox-uploadButton')).not.toBeNull();
            expect(screen.getByTestId('clear').querySelector('.semi-chat-inputBox-clearButton')).not.toBeNull();
            fireEvent.click(screen.getByText('send it'));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('custom', []);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'custom' })]);
            fireEvent.click(screen.getByText('clear it'));
            expect(onClear).toHaveBeenCalledTimes(1);
            fireEvent.click(screen.getByText('focus it'));
            expect(container.querySelectorAll('textarea')).toContain(document.activeElement);
        });
    });

    describe('停止与清空', () => {
        const generating: Message[] = [...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'thinking', status: 'incomplete' }];

        it('最后一条消息生成中时显示停止按钮', async () => {
            const onStopGenerator = vi.fn<NonNullable<Props['onStopGenerator']>>();
            const { container, rerender } = render(<Chat chats={generating} roleConfig={roleConfig} showStopGenerate onStopGenerator={onStopGenerator} />);
            const stop = container.querySelector('.semi-chat-action-stop');
            expect(stop).toHaveTextContent('停止');
            type(container, 'hello');
            expect(sendButton(container)).toBeDisabled();
            fireEvent.click(stop);
            expect(onStopGenerator).toHaveBeenCalledTimes(1);
            expect(onStopGenerator.mock.calls[0][0].type).toBe('click');

            rerender(<Chat chats={generating} roleConfig={roleConfig} />);
            expect(container.querySelector('.semi-chat-action-stop')).toBeNull();
            expect(sendButton(container)).not.toBeDisabled();
        });

        it('生成结束时，持有焦点的停止按钮把焦点交给输入框', () => {
            const at = (status: Message['status'], content = 'thinking') => [...chats.slice(0, 2), { role: 'assistant', id: '3', content, status }];
            const { container, rerender } = render(<Chat chats={at('incomplete')} roleConfig={roleConfig} showStopGenerate />);
            const stop = container.querySelector<HTMLElement>('.semi-chat-action-stop');
            stop.focus();
            rerender(<Chat chats={at('incomplete', 'thinking more')} roleConfig={roleConfig} showStopGenerate />);
            expect(stop).toHaveFocus();
            rerender(<Chat chats={at('complete', 'thinking more')} roleConfig={roleConfig} showStopGenerate />);
            expect(container.querySelector('.semi-chat-action-stop')).toBeNull();
            expect(textarea(container)).toHaveFocus();
        });

        it('停止按钮没有焦点时，生成结束不移动焦点', () => {
            const view = (status: Message['status']) => (
                <>
                    <button type="button">outside</button>
                    <Chat chats={[...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'x', status }]} roleConfig={roleConfig} showStopGenerate />
                </>
            );
            const { rerender } = render(view('loading'));
            const outside = screen.getByRole('button', { name: 'outside' });
            outside.focus();
            rerender(view('complete'));
            expect(outside).toHaveFocus();
        });

        it('clear context 追加分隔符并调用 onClear', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onClear = vi.fn<NonNullable<Props['onClear']>>();
            const { container, rerender } = await renderChat({ showClearContext: true, onChatsChange, onClear });
            fireEvent.click(container.querySelector('.semi-chat-inputBox-clearButton'));
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats, { role: 'divider', id: expect.any(String), createAt: Date.now() }]);
            expect(onClear).toHaveBeenCalledTimes(1);

            const cleared = onChatsChange.mock.calls[0][0];
            rerender(<Chat chats={cleared} roleConfig={roleConfig} showClearContext onChatsChange={onChatsChange} onClear={onClear} />);
            fireEvent.click(container.querySelector('.semi-chat-inputBox-clearButton'));
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
            const { Chat: text } = zh_CN;
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

        it('未完成的消息隐藏操作按钮', async () => {
            const { container } = render(<Chat chats={[{ role: 'assistant', id: '1', content: 'x', status: 'loading' }]} roleConfig={roleConfig} />);
            const action = container.querySelector('.semi-chat-chatBox-action');
            expect(action).toHaveClass('semi-chat-chatBox-action-hidden');
            expect(actionButtons(action)).toHaveLength(2);
            expect(action.querySelector('.semi-chat-chatBox-action-icon-redo')).not.toBeNull();
        });

        it('复制消息文本并提示成功', async () => {
            const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = await renderChat({ onMessageCopy });
            fireEvent.click(actionButtons(boxes(container)[2])[0]);
            expect(writeText).toHaveBeenCalledWith('assistant says');
            expect(await screen.findByText('复制成功')).toBeInTheDocument();
            expect(onMessageCopy).toHaveBeenCalledExactlyOnceWith(chats[2]);
        });

        it('写入完成前或失败时不触发 onMessageCopy', async () => {
            let resolveWrite: () => void;
            const writeText = vi.fn<() => Promise<void>>(() => new Promise((resolve) => (resolveWrite = resolve)));
            mockClipboard(writeText);
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = await renderChat({ onMessageCopy });
            fireEvent.click(actionButtons(boxes(container)[2])[0]);
            expect(onMessageCopy).not.toHaveBeenCalled();
            await act(async () => resolveWrite());
            expect(onMessageCopy).toHaveBeenCalledTimes(1);

            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            fireEvent.click(actionButtons(boxes(container)[2])[0]);
            await act(() => sleep(20));
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
        });

        it('数组内容复制为拼接后的文本', async () => {
            const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const message: Message = {
                role: 'assistant',
                id: '1',
                content: [
                    { type: 'text', text: 'a' },
                    { type: 'text', text: 'b' },
                ],
            };
            const { container } = render(<Chat chats={[message]} roleConfig={roleConfig} />);
            fireEvent.click(actionButtons(container)[0]);
            expect(writeText).toHaveBeenCalledWith('ab');
        });

        it.each([
            ['缺失', undefined],
            ['空字符串', ''],
            ['只有图片', [{ type: 'image_url', image_url: { url: 'https://example.com/a.png' } }]],
        ])('内容%s时点复制不写入、不提示、不触发 onMessageCopy', async (_name, content) => {
            const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const message = { role: 'assistant', id: '1', content } as Message;
            const { container } = render(<Chat chats={[message]} roleConfig={roleConfig} onMessageCopy={onMessageCopy} />);
            fireEvent.click(actionButtons(container)[0]);
            await act(() => sleep(20));
            expect(writeText).not.toHaveBeenCalled();
            expect(screen.queryByText('复制成功')).toBeNull();
            expect(onMessageCopy).not.toHaveBeenCalled();
        });

        it('剪贴板写入失败时不提示成功', async () => {
            mockClipboard(() => Promise.reject(new Error('no')));
            const { container } = await renderChat();
            fireEvent.click(actionButtons(boxes(container)[2])[0]);
            await act(() => sleep(20));
            expect(screen.queryByText('复制成功')).toBeNull();
        });

        it('like 与 dislike 通过 onChatsChange 切换标记', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onMessageGoodFeedback = vi.fn<NonNullable<Props['onMessageGoodFeedback']>>();
            const onMessageBadFeedback = vi.fn<NonNullable<Props['onMessageBadFeedback']>>();
            const liked = [...chats.slice(0, 2), { ...chats[2], like: true }];
            const { container } = await renderChat({
                chats: liked,
                onChatsChange,
                onMessageGoodFeedback,
                onMessageBadFeedback,
            });
            const [, like, dislike] = actionButtons(boxes(container)[2]);
            expect(like.querySelector('.semi-icon-like_thumb')).not.toBeNull();
            fireEvent.click(like);
            expect(onMessageGoodFeedback).toHaveBeenCalledExactlyOnceWith(liked[2]);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), { ...chats[2], like: false, dislike: false }]);
            fireEvent.click(dislike);
            expect(onMessageBadFeedback).toHaveBeenCalledExactlyOnceWith(liked[2]);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), { ...chats[2], like: false, dislike: true }]);
        });

        it('reset 将最后一条消息替换为 loading 消息', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onMessageReset = vi.fn<NonNullable<Props['onMessageReset']>>();
            const { container } = await renderChat({ onChatsChange, onMessageReset });
            fireEvent.click(actionButtons(boxes(container)[2])[3]);
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([...chats.slice(0, 2), { ...chats[2], status: 'loading', content: '', like: false, dislike: false, id: expect.any(String), createAt: Date.now() }]);
            expect(onChatsChange.mock.calls[0][0][2].id).not.toBe('3');
            expect(onMessageReset).toHaveBeenCalledExactlyOnceWith(chats[2]);
        });

        it('delete 先请求确认，再删除消息', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onMessageDelete = vi.fn<NonNullable<Props['onMessageDelete']>>();
            const { container } = await renderChat({ onChatsChange, onMessageDelete });
            const del = actionButtons(boxes(container)[1])[1];
            fireEvent.click(del);
            expect(await screen.findByText('确认删除该会话吗？')).toBeInTheDocument();
            expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).not.toBeNull();
            fireEvent.click(screen.getByRole('button', { name: '确定' }));
            expect(onMessageDelete).toHaveBeenCalledExactlyOnceWith(chats[1]);
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([chats[0], chats[2]]);
        });

        it('在删除按钮外按下鼠标会关闭确认框', async () => {
            const onMessageDelete = vi.fn<NonNullable<Props['onMessageDelete']>>();
            const { container } = await renderChat({ onMessageDelete });
            fireEvent.click(actionButtons(boxes(container)[1])[1]);
            await screen.findByText('确认删除该会话吗？');
            fireEvent.mouseDown(document.body);
            await waitFor(() => expect(boxes(container)[1].querySelector('.semi-chat-chatBox-action-show')).toBeNull());
            expect(onMessageDelete).not.toHaveBeenCalled();
        });
    });

    describe('提示', () => {
        it('点击提示会以用户消息发送', async () => {
            const onHintClick = vi.fn<NonNullable<Props['onHintClick']>>();
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
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
            fireEvent.click(screen.getByText('second'));
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

        it('renderHintBox 渲染每个提示及其点击处理函数', async () => {
            const onHintClick = vi.fn<NonNullable<Props['onHintClick']>>();
            const renderHintBox = vi.fn<NonNullable<Props['renderHintBox']>>(({ content, index, onHintClick: click }) => (
                <button key={index} onClick={click}>
                    {index}:{content}
                </button>
            ));
            await renderChat({ hints: ['a', 'b'], renderHintBox, onHintClick });
            fireEvent.click(screen.getByText('1:b'));
            expect(onHintClick).toHaveBeenCalledExactlyOnceWith('b');
        });

        it('没有提示时不渲染提示区域', async () => {
            const { container } = await renderChat({ hints: [] });
            expect(container.querySelector('.semi-chat-hints')).toBeNull();
        });
    });

    describe('上传', () => {
        const file = () => new File(['x'], 'a.txt', { type: 'text/plain' });

        it('默认显示上传按钮，click upload 关闭时隐藏', async () => {
            const { container, rerender } = await renderChat();
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).not.toBeNull();
            rerender(<Chat chats={chats} enableUpload={false} roleConfig={roleConfig} />);
            expect(container.querySelector('.semi-chat-inputBox-upload')).toBeNull();
            rerender(<Chat chats={chats} enableUpload={{ clickUpload: false }} roleConfig={roleConfig} />);
            expect(container.querySelector('.semi-chat-inputBox-upload')).toBeNull();
        });

        it('使用 uploadProps 的 children 与 className', async () => {
            const { container } = await renderChat({
                uploadProps: { className: 'my-upload', children: <span data-testid="trigger" /> },
            });
            expect(container.querySelector('.semi-chat-inputBox-upload.my-upload')).not.toBeNull();
            expect(screen.getByTestId('trigger')).toBeInTheDocument();
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).toBeNull();
        });

        it('uploadTipProps 的 Tooltip 以上传按钮本身为触发器，不多出 Tab 停靠点', async () => {
            const { container } = await renderChat({ uploadTipProps: { content: 'tip text' } });
            const inputBox = container.querySelector('.semi-chat-inputBox-container');
            const stops = [...inputBox.querySelectorAll('button, textarea, [tabindex]:not([tabindex="-1"])')];
            const uploadButton = container.querySelector('.semi-chat-inputBox-uploadButton');
            expect(stops).toEqual([uploadButton, textarea(container), sendButton(container)]);
            fireEvent.mouseEnter(uploadButton);
            const tip = await screen.findByText('tip text');
            await waitFor(() => expect(uploadButton).toHaveAttribute('aria-describedby', tip.closest('[role="tooltip"]').id));
        });

        it('uploadProps.disabled 时默认上传按钮暴露禁用状态', async () => {
            const uploadButton = (container) => container.querySelector('.semi-chat-inputBox-uploadButton');
            const { container, rerender } = await renderChat({ uploadProps: { disabled: true } });
            expect(uploadButton(container)).toHaveAttribute('aria-disabled', 'true');
            rerender(<Chat chats={chats} roleConfig={roleConfig} />);
            expect(uploadButton(container)).not.toHaveAttribute('aria-disabled', 'true');
        });

        it('uploadProps 的 children 本身成为 uploadTipProps 的触发器', async () => {
            const { container } = await renderChat({
                uploadProps: { children: <button type="button">pick</button> },
                uploadTipProps: { content: 'tip text' },
            });
            expect(screen.getByRole('button', { name: 'pick' })).toHaveAttribute('data-popupid');
            expect(container.querySelector('.semi-chat-inputBox-container span[tabindex]')).toBeNull();
        });

        it('选中的文件变为附件，上传完成前阻止发送', async () => {
            const onInputChange = vi.fn<NonNullable<Props['onInputChange']>>();
            const onChange = vi.fn<NonNullable<UploadProps['onChange']>>();
            const { container } = await renderChat({
                onInputChange,
                uploadProps: { uploadTrigger: 'custom', onChange },
            });
            fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file()] } });
            await waitFor(() => expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(1));
            expect(container.querySelector('.semi-chat-attachment-file')).toHaveTextContent('a.txt');
            expect(onChange).toHaveBeenCalled();
            expect(onInputChange).toHaveBeenLastCalledWith({
                inputValue: '',
                attachment: [expect.objectContaining({ name: 'a.txt' })],
            });
            expect(sendButton(container)).toBeDisabled();
            fireEvent.click(container.querySelector('.semi-chat-attachment-clear'));
            expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(0);
            expect(onInputChange).toHaveBeenLastCalledWith({ inputValue: '', attachment: [] });
        });

        it('移除附件时 uploadProps.onChange 收到移除后的 fileList 与被移除项', async () => {
            const onChange = vi.fn<NonNullable<UploadProps['onChange']>>();
            const { container } = await renderChat({ uploadProps: { uploadTrigger: 'custom', onChange } });
            fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file()] } });
            await waitFor(() => expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(1));
            onChange.mockClear();
            fireEvent.click(container.querySelector('.semi-chat-attachment-clear'));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenLastCalledWith({
                fileList: [],
                currentFile: expect.objectContaining({ name: 'a.txt' }),
            });
        });

        it('拖拽经过时显示放置区，放下后上传文件', async () => {
            const { container } = await renderChat({ uploadProps: { uploadTrigger: 'custom' } });
            fireEvent.dragOver(container.firstChild, filesDrag);
            const dropArea = container.querySelector('.semi-chat-dropArea');
            expect(dropArea).toHaveTextContent('将文件放到这里');
            fireEvent.drop(dropArea, { dataTransfer: { files: [file()] } });
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
            await waitFor(() => expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(1));
        });

        it('在页面内部拖拽不会打开放置区', async () => {
            const { container } = await renderChat();
            fireEvent.dragStart(container.firstChild);
            fireEvent.dragOver(container.firstChild, filesDrag);
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
            fireEvent.dragEnd(container.firstChild);
            fireEvent.dragOver(container.firstChild, filesDrag);
            expect(container.querySelector('.semi-chat-dropArea')).not.toBeNull();
        });

        it('离开放置区后隐藏', async () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            const { container } = render(<Chat chats={[]} roleConfig={roleConfig} />);
            fireEvent.dragOver(container.firstChild, filesDrag);
            fireEvent.dragLeave(container.querySelector('.semi-chat-dropArea'), { relatedTarget: document.body });
            void act(() => vi.advanceTimersByTime(10));
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        });

        it('drag upload 关闭时没有放置区', async () => {
            const { container } = await renderChat({ enableUpload: { dragUpload: false } });
            fireEvent.dragOver(container.firstChild, filesDrag);
            expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
        });

        it('根元素的拖拽回调与放置区处理都会执行', () => {
            const onDragOver = vi.fn<NonNullable<Props['onDragOver']>>();
            const onDragStart = vi.fn<NonNullable<Props['onDragStart']>>();
            const onDragEnd = vi.fn<NonNullable<Props['onDragEnd']>>();
            const { container } = render(<Chat chats={[]} roleConfig={roleConfig} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragStart={onDragStart} />);
            fireEvent.dragOver(container.firstChild, filesDrag);
            expect(onDragOver).toHaveBeenCalledTimes(1);
            expect(container.querySelector('.semi-chat-dropArea')).not.toBeNull();
            fireEvent.dragStart(container.firstChild);
            fireEvent.dragEnd(container.firstChild);
            expect(onDragStart).toHaveBeenCalledTimes(1);
            expect(onDragEnd).toHaveBeenCalledTimes(1);
        });

        it('drag upload 关闭时根元素的拖拽回调照常执行', () => {
            const onDragOver = vi.fn<NonNullable<Props['onDragOver']>>();
            const { container } = render(<Chat chats={[]} enableUpload={{ dragUpload: false }} roleConfig={roleConfig} onDragOver={onDragOver} />);
            fireEvent.dragOver(container.firstChild, filesDrag);
            expect(onDragOver).toHaveBeenCalledTimes(1);
        });

        it('ChatProps 不接受 children', () => {
            const props: ChatProps = {
                roleConfig,
                // @ts-expect-error the root renders its own content, so children were never shown
                children: 'child',
            };
            expectTypeOf(props).not.toHaveProperty('children');
        });

        it('粘贴文件时上传，paste upload 关闭时除外', async () => {
            const paste = (container) => {
                const f = file();
                fireEvent.paste(textarea(container), {
                    clipboardData: { items: [{ getAsFile: () => f }] },
                });
            };
            const { container, rerender } = await renderChat({ uploadProps: { uploadTrigger: 'custom' } });
            paste(container);
            await waitFor(() => expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(1));
            rerender(<Chat chats={chats} enableUpload={{ pasteUpload: false }} roleConfig={roleConfig} uploadProps={{ uploadTrigger: 'custom' } as UploadProps} />);
            paste(container);
            await act(() => sleep(20));
            expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(1);
        });

        it('粘贴时每个剪贴板项只读取一次文件', async () => {
            const pasted = file();
            const getAsFile = vi.fn<() => File>(() => pasted);
            const { container } = await renderChat({ uploadProps: { uploadTrigger: 'custom' } });
            fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile }] } });
            await waitFor(() => expect(container.querySelectorAll('.semi-chat-attachment-item')).toHaveLength(1));
            expect(getAsFile).toHaveBeenCalledTimes(1);
        });

        it('附件作为 content parts 发送', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const ref = createRef<ChatHandle>();
            await renderChat({ ref, onChatsChange, onMessageSend });
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
            act(() => ref.current.sendMessage('see', attachment));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('see', attachment);
            expect(onChatsChange.mock.calls[0][0].at(-1).content).toEqual([
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
            rerender(<Chat chats={[...chats, { role: 'user', id: '4', content: 'new' }]} roleConfig={roleConfig} />);
            expect(contentArea(container).scrollTop).toBe(1500);
        });

        it('跟随流式输出中的最后一条消息，不跟随未变化的已完成消息', async () => {
            const sizes = mockScroll();
            const streaming: Message[] = [...chats.slice(0, 2), { ...chats[2], status: 'incomplete' }];
            const { container, rerender } = render(<Chat chats={streaming} roleConfig={roleConfig} />);
            sizes.scrollHeight = 1200;
            rerender(<Chat chats={[...streaming.slice(0, 2), { ...chats[2], content: 'more', status: 'incomplete' }]} roleConfig={roleConfig} />);
            expect(contentArea(container).scrollTop).toBe(1200);
            rerender(<Chat chats={[...streaming.slice(0, 2), { ...chats[2], content: 'done', status: 'complete' }]} roleConfig={roleConfig} />);
            sizes.scrollHeight = 1400;
            rerender(<Chat chats={[...streaming.slice(0, 2), { ...chats[2], content: 'done', status: 'complete' }]} roleConfig={roleConfig} />);
            expect(contentArea(container).scrollTop).toBe(1200);
        });

        it('提示变多时滚动到底部', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat({ hints: [] });
            sizes.scrollHeight = 1300;
            rerender(<Chat chats={chats} hints={['a']} roleConfig={roleConfig} />);
            expect(contentArea(container).scrollTop).toBe(1300);
        });

        it('发送前后滚动条保持可见', async () => {
            mockScroll();
            const { container } = await renderChat();
            const area = contentArea(container);
            expect(area.className).toBe('semi-chat-container');

            type(container, 'hi');
            fireEvent.click(sendButton(container));
            expect(area.className).toBe('semi-chat-container');
        });

        it('未使用滚轮向上滚动时停止跟随，直到下次发送', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            const area = contentArea(container);
            area.scrollTop = 800;
            fireEvent.scroll(area);
            area.scrollTop = 0;
            fireEvent.scroll(area);

            sizes.scrollHeight = 1500;
            const more = [...chats, { role: 'assistant', id: '4', content: 'more' }];
            rerender(<Chat chats={more} roleConfig={roleConfig} />);
            expect(area.scrollTop).toBe(0);

            type(container, 'hi');
            fireEvent.click(sendButton(container));
            rerender(<Chat chats={[...more, { role: 'user', id: '5', content: 'hi' }]} roleConfig={roleConfig} />);
            expect(area.scrollTop).toBe(1500);
        });

        it('滚回底部后恢复跟随', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            const area = contentArea(container);
            area.scrollTop = 800;
            fireEvent.scroll(area);
            area.scrollTop = 0;
            fireEvent.scroll(area);
            area.scrollTop = 800;
            fireEvent.scroll(area);

            sizes.scrollHeight = 1500;
            const more = [...chats, { role: 'assistant', id: '4', content: 'more' }];
            rerender(<Chat chats={more} roleConfig={roleConfig} />);
            expect(area.scrollTop).toBe(1500);
        });

        it('读者位于底部时，内容缩短仍保持跟随', async () => {
            const sizes = mockScroll();
            const { container, rerender } = await renderChat();
            const area = contentArea(container);
            area.scrollTop = 800;
            fireEvent.scroll(area);
            sizes.scrollHeight = 600;
            area.scrollTop = 400;
            fireEvent.scroll(area);

            sizes.scrollHeight = 1200;
            rerender(<Chat chats={[...chats, { role: 'assistant', id: '4', content: 'more' }]} roleConfig={roleConfig} />);
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
            fireEvent.scroll(area);
            void act(() => vi.advanceTimersByTime(200));
            const back = container.querySelector('.semi-chat-action-backBottom');
            expect(back).not.toBeNull();

            fireEvent.click(back);
            void act(() => vi.advanceTimersByTime(400));
            expect(area.scrollTop).toBe(1000);
            fireEvent.scroll(area);
            void act(() => vi.advanceTimersByTime(200));
            expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
        });

        it('忽略从内容内部冒泡上来的滚动事件', async () => {
            mockScroll();
            const { container } = await renderChat();
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
            });
            contentArea(container).scrollTop = 0;
            fireEvent.scroll(container.querySelector('.semi-chat-chatBox'));
            void act(() => vi.advanceTimersByTime(200));
            expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
        });

        it('显示停止按钮时隐藏回到底部按钮', async () => {
            mockScroll();
            const generating: Message[] = [...chats.slice(0, 2), { ...chats[2], status: 'loading' }];
            const { container } = render(<Chat chats={generating} roleConfig={roleConfig} showStopGenerate />);
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
            });
            contentArea(container).scrollTop = 0;
            fireEvent.scroll(contentArea(container));
            void act(() => vi.advanceTimersByTime(200));
            expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull();
            expect(container.querySelector('.semi-chat-action-stop')).not.toBeNull();
        });
    });

    describe('ref 方法', () => {
        it('不带附件的 sendMessage 保持 content 为字符串', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const ref = createRef<ChatHandle>();
            await renderChat({ ref, onChatsChange, onMessageSend });
            act(() => ref.current.sendMessage('hi'));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hi', undefined);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'hi' })]);
        });

        it('resetMessage、clearContext、scrollToBottom 与 sendMessage', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const onMessageReset = vi.fn<NonNullable<Props['onMessageReset']>>();
            const onClear = vi.fn<NonNullable<Props['onClear']>>();
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const ref = createRef<ChatHandle>();
            const { container } = await renderChat({ ref, onChatsChange, onMessageReset, onClear, onMessageSend });

            act(() => ref.current.resetMessage());
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats.slice(0, 2), expect.objectContaining({ role: 'assistant', status: 'loading', content: '' })]);
            expect(onMessageReset).toHaveBeenCalledExactlyOnceWith(null);

            act(() => ref.current.clearContext());
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ role: 'divider' })]);
            expect(onClear).toHaveBeenCalledTimes(1);

            act(() => ref.current.sendMessage('hi', []));
            expect(onMessageSend).toHaveBeenCalledExactlyOnceWith('hi', []);
            expect(onChatsChange).toHaveBeenLastCalledWith([...chats, expect.objectContaining({ content: 'hi' })]);

            mockScroll({ scrollHeight: 800 });
            const area = contentArea(container);
            act(() => ref.current.scrollToBottom(false));
            expect(area.scrollTop).toBe(800);
        });

        it('scrollToBottom(true) 带动画', async () => {
            const ref = createRef<ChatHandle>();
            await renderChat({ ref });
            vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
            vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(800);
            const setTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');
            act(() => ref.current.scrollToBottom(true));
            expect(setTop).not.toHaveBeenCalled();
            void act(() => vi.advanceTimersByTime(400));
            expect(setTop).toHaveBeenLastCalledWith(800);
        });
    });

    describe('默认值与模式', () => {
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
            type(container, 'hello');
            const inputBox = container.querySelector('.semi-chat-inputBox');
            expect(inputBox.querySelector('.semi-input-clearbtn, .semi-input-textarea-counter, .semi-input-textarea-lineNumber')).toBeNull();
        });

        it('StrictMode 下正常工作', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const { container } = render(
                <StrictMode>
                    <Chat chats={chats} roleConfig={roleConfig} onChatsChange={onChatsChange} onMessageSend={onMessageSend} />
                </StrictMode>
            );
            await waitFor(() => expect(screen.getByText('assistant says')).toBeInTheDocument());
            type(container, 'hello');
            fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);
            expect(onChatsChange).toHaveBeenCalledTimes(1);
        });
    });

    describe('函数组件', () => {
        const keyWarnings = (spy) => spy.mock.calls.filter((args) => /same key|unique "key"/.test(args.map(String).join(' ')));

        it('将未知属性传给根元素，自身的回调不出现在 DOM 上', async () => {
            const { container } = await renderChat({
                'data-testid': 'chat',
                'aria-label': 'conversation',
                onMessageSend: vi.fn<NonNullable<Props['onMessageSend']>>(),
                onClear: vi.fn<NonNullable<Props['onClear']>>(),
            });
            const root = screen.getByTestId('chat');
            expect(root).toBe(container.firstChild);
            expect(root).toHaveAttribute('aria-label', 'conversation');
            expect(root.getAttributeNames().filter((name) => name.startsWith('on'))).toEqual([]);
        });

        it('根元素带名称且未传 role 时为 group，使用方的 role 优先', async () => {
            const { container, rerender } = await renderChat({ 'aria-label': '会话' });
            const root = container.firstChild as HTMLElement;
            expect(root).toHaveAttribute('role', 'group');
            rerender(<Chat aria-labelledby="title" chats={chats} roleConfig={roleConfig} />);
            expect(root).toHaveAttribute('role', 'group');
            rerender(<Chat chats={chats} roleConfig={roleConfig} />);
            expect(root).not.toHaveAttribute('role');
            rerender(<Chat aria-label="会话" role="application" chats={chats} roleConfig={roleConfig} />);
            expect(root).toHaveAttribute('role', 'application');
        });

        it('ref 仅暴露文档中的方法', async () => {
            const ref = createRef<ChatHandle>();
            await renderChat({ ref });
            expect(Object.keys(ref.current).sort()).toEqual(['clearContext', 'resetMessage', 'scrollToBottom', 'sendMessage']);
        });

        it('提示可在挂载后出现，之后再消失', async () => {
            const { container, rerender } = await renderChat();
            rerender(<Chat chats={chats} hints={['a']} roleConfig={roleConfig} />);
            expect(container.querySelector('.semi-chat-hints')).toHaveTextContent('a');
            rerender(<Chat chats={chats} roleConfig={roleConfig} />);
            expect(container.querySelector('.semi-chat-hints')).toBeNull();
        });

        it('没有消息时 clearContext 追加分隔符', async () => {
            const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
            const ref = createRef<ChatHandle>();
            render(<Chat ref={ref} chats={[]} onChatsChange={onChatsChange} />);
            act(() => ref.current.clearContext());
            expect(onChatsChange).toHaveBeenCalledExactlyOnceWith([expect.objectContaining({ role: 'divider' })]);
        });

        it('数组内容渲染时不出现重复 key 警告', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            render(
                <Chat
                    chats={[
                        {
                            role: 'user',
                            id: '1',
                            content: [
                                { type: 'text', text: 'one' },
                                { type: 'text', text: 'two' },
                                { type: 'image_url', image_url: { url: 'https://semi.design/a.png' } },
                            ],
                        },
                    ]}
                />
            );
            await waitFor(() => expect(screen.getByText('two')).toBeInTheDocument());
            expect(keyWarnings(error)).toEqual([]);
        });

        it('renderDivider 与 renderHintBox 的结果无需 key', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            await renderChat({
                chats: [...chats, { role: 'divider', id: 'd1' }, { role: 'divider', id: 'd2' }],
                renderDivider: () => <hr />,
                hints: ['a', 'b'],
                renderHintBox: ({ content }) => <span>{content}</span>,
            });
            expect(keyWarnings(error)).toEqual([]);
        });

        it('markdownRenderProps 变化后会作用到已渲染的消息', async () => {
            const { container, rerender } = await renderChat({ markdownRenderProps: { className: 'md-a' } });
            expect(container.querySelectorAll('.md-a')).toHaveLength(3);
            rerender(<Chat chats={chats} markdownRenderProps={{ className: 'md-b' }} roleConfig={roleConfig} />);
            expect(container.querySelectorAll('.md-b')).toHaveLength(3);
        });

        it('前一条消息不再与当前消息同角色时，头像重新显示', async () => {
            const second = { role: 'assistant', id: '2', content: 'second' };
            const { container, rerender } = render(<Chat chats={[{ role: 'assistant', id: '1', content: 'first' }, second]} roleConfig={roleConfig} />);
            expect(boxes(container)[1].querySelector('.semi-chat-chatBox-avatar-hidden')).not.toBeNull();
            rerender(<Chat chats={[{ role: 'user', id: '0', content: 'q' }, second]} roleConfig={roleConfig} />);
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
            fireEvent.scroll(contentArea(container));
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
        const copyButton = (container) => container.querySelector('.semi-chat-chatBox-content-code-topSlot-copy-wrapper');

        it('保持按钮焦点，复制后更新其名称，且不提交表单', async () => {
            const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
            mockClipboard(writeText);
            const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
            const { container } = render(
                <form onSubmit={onSubmit}>
                    <Chat chats={codeChats} roleConfig={roleConfig} />
                </form>
            );
            const button = await waitFor(() => {
                expect(copyButton(container)).not.toBeNull();
                return copyButton(container);
            });
            expect(button).toHaveAccessibleName(zh_CN.Chat.copy);
            button.focus();
            fireEvent.click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Chat.copied));
            expect(document.activeElement).toBe(button);
            expect(onSubmit).not.toHaveBeenCalled();
            fireEvent.click(button);
            expect(writeText).toHaveBeenCalledTimes(1);
        });
    });
});

describe('Chat 可访问名称', () => {
    it('消息 textarea 的名称来自语言包', async () => {
        await renderChat();
        expect(screen.getByRole('textbox', { name: zh_CN.Chat.input })).toBeInTheDocument();
    });

    it('每个头像与消息图片都带 alt', async () => {
        const { container } = render(
            <Chat
                chats={[
                    { role: 'user', id: '1', content: 'one' },
                    { role: 'user', id: '2', content: 'two' },
                    {
                        role: 'assistant',
                        id: '3',
                        content: [{ type: 'image_url', image_url: { url: 'https://semi.design/a.png' } }],
                    },
                ]}
                roleConfig={roleConfig}
            />
        );
        await waitFor(() => expect(screen.getByText('two')).toBeInTheDocument());
        const avatars = [...container.querySelectorAll('.semi-chat-chatBox-avatar img')];
        expect(avatars.map((img) => img.getAttribute('alt'))).toEqual(['', '', '']);
        expect(screen.getByRole('img', { name: zh_CN.Chat.image })).toHaveAttribute('src', 'https://semi.design/a.png');
    });

    it('markdown 图片的 alt 优先于通用文案', async () => {
        render(<Chat chats={[{ role: 'assistant', id: '1', content: '![一只猫](https://semi.design/cat.png)' }]} roleConfig={roleConfig} />);
        expect(await screen.findByRole('img', { name: '一只猫' })).toHaveAttribute('src', 'https://semi.design/cat.png');
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
        const log = screen.getByRole('log', { name: zh_CN.Chat.messages });
        expect(within(log).getByText('assistant says')).toBeInTheDocument();
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('最后一条回复加载中或未完成时为 busy 状态', async () => {
        const streaming: Message[] = [...chats.slice(0, 2), { role: 'assistant', id: '3', content: 'assistant', status: 'loading' }];
        const { rerender } = render(<Chat chats={streaming} roleConfig={roleConfig} />);
        const log = screen.getByRole('log');
        expect(log).toHaveAttribute('aria-busy', 'true');
        rerender(<Chat chats={[...chats.slice(0, 2), { ...streaming[2], status: 'incomplete' }]} roleConfig={roleConfig} />);
        expect(log).toHaveAttribute('aria-busy', 'true');
        rerender(<Chat chats={[...chats.slice(0, 2), { ...streaming[2], status: 'complete' }]} roleConfig={roleConfig} />);
        expect(log).toHaveAttribute('aria-busy', 'false');
    });
});

describe('Chat 代码审计修复', () => {
    beforeEach(() => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const file = () => new File(['x'], 'a.txt', { type: 'text/plain' });
    const attachmentItems = (container) => container.querySelectorAll('.semi-chat-attachment-item');
    const openDelete = async (container) => {
        fireEvent.click(actionButtons(boxes(container)[1])[1]);
        await screen.findByText('确认删除该会话吗？');
    };
    const actionShown = (container) => boxes(container)[1].querySelector('.semi-chat-chatBox-action-show');

    describe('只关闭点击上传', () => {
        const uploadProps = { uploadTrigger: 'custom' } as UploadProps;

        it('拖拽放下的文件仍成为附件，且不渲染上传按钮', async () => {
            const { container } = await renderChat({ enableUpload: { clickUpload: false }, uploadProps });
            fireEvent.dragOver(container.firstChild, filesDrag);
            fireEvent.drop(container.querySelector('.semi-chat-dropArea'), { dataTransfer: { files: [file()] } });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
            expect(container.querySelector('.semi-chat-inputBox-uploadButton')).toBeNull();
        });

        it('粘贴的文件仍成为附件', async () => {
            const { container } = await renderChat({ enableUpload: { clickUpload: false }, uploadProps });
            const f = file();
            fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile: () => f }] } });
            await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        });

        it('三种上传方式都关闭时不渲染上传节点', async () => {
            const { container } = await renderChat({ enableUpload: false });
            expect(container.querySelector('.semi-upload')).toBeNull();
        });
    });

    it('代码围栏的语言含连字符时语言栏显示完整语言 id', async () => {
        const { container } = render(<Chat chats={[{ role: 'assistant', id: '1', content: '```objective-c\nint x = 1;\n```' }]} />);
        await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-type')).toHaveTextContent(/^objective-c$/));
    });

    it('文件卡片的类型取小写扩展名，没有扩展名时取 MIME 子类型而不是文件名', async () => {
        const fileMessage = (name: string, type?: string) => ({
            type: 'file_url',
            file_url: { url: `https://semi.design/${name}`, name, size: '1KB', type },
        });
        const { container } = render(
            <Chat
                chats={
                    [
                        {
                            role: 'user',
                            id: '1',
                            content: [fileMessage('Makefile'), fileMessage('README', 'text/plain'), fileMessage('a.PDF')],
                        },
                    ] as Message[]
                }
            />
        );
        const types = () => [...container.querySelectorAll('.semi-chat-attachment-file-type')].map((n) => n.textContent);
        await waitFor(() => expect(types()).toHaveLength(3));
        expect(types()).toEqual(['', 'plain', 'pdf']);
    });

    describe('删除确认框', () => {
        it('按 Escape 关闭确认框', async () => {
            const { container } = await renderChat();
            await openDelete(container);
            fireEvent.keyDown(actionButtons(boxes(container)[1])[1], { key: 'Escape' });
            await waitFor(() => expect(actionShown(container)).toBeNull());
        });

        it('使用方没有同步删除消息时，确认后确认框也会关闭', async () => {
            const onMessageDelete = vi.fn<NonNullable<Props['onMessageDelete']>>();
            const { container } = await renderChat({ onMessageDelete });
            await openDelete(container);
            fireEvent.click(screen.getByRole('button', { name: '确定' }));
            expect(onMessageDelete).toHaveBeenCalledTimes(1);
            await waitFor(() => expect(actionShown(container)).toBeNull());
        });
    });
});

describe('Chat 上传禁用与拖拽', () => {
    beforeEach(() => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const file = () => new File(['x'], 'a.png', { type: 'image/png' });
    const attachmentItems = (container) => container.querySelectorAll('.semi-chat-attachment-item');
    const pasteFile = (container) => fireEvent.paste(textarea(container), { clipboardData: { items: [{ getAsFile: () => file() }] } });

    it('uploadProps.disabled 时粘贴的文件不会成为附件，拖拽也不显示放置区', async () => {
        const { container } = await renderChat({ uploadProps: { disabled: true, uploadTrigger: 'custom' } });
        pasteFile(container);
        fireEvent.dragOver(container.firstChild, filesDrag);
        await act(() => sleep(20));
        expect(attachmentItems(container)).toHaveLength(0);
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });

    it('拖拽文本或链接时不显示放置区', async () => {
        const { container } = await renderChat();
        fireEvent.dragOver(container.firstChild, { dataTransfer: { types: ['text/plain'] } });
        expect(container.querySelector('.semi-chat-dropArea')).toBeNull();
    });

    it('uploadProps 带 ref 时，粘贴上传仍可用，且 ref 拿到 Upload 的句柄', async () => {
        const uploadRef = createRef<{ upload: () => void }>();
        const { container } = await renderChat({ uploadProps: { ref: uploadRef, uploadTrigger: 'custom' } });
        pasteFile(container);
        await waitFor(() => expect(attachmentItems(container)).toHaveLength(1));
        expect(uploadRef.current?.upload).toBeTypeOf('function');
    });
});

describe('Chat 操作与消息渲染', () => {
    it('点赞与点踩按钮用 aria-pressed 表示状态，其余操作不带', async () => {
        await renderChat({ chats: [...chats.slice(0, 2), { ...chats[2], like: true }] });
        const assistant = within(boxes(document.body)[2]);
        expect(assistant.getByRole('button', { name: zh_CN.Chat.like })).toHaveAttribute('aria-pressed', 'true');
        expect(assistant.getByRole('button', { name: zh_CN.Chat.dislike })).toHaveAttribute('aria-pressed', 'false');
        expect(assistant.getByRole('button', { name: zh_CN.Chat.copy })).not.toHaveAttribute('aria-pressed');
    });

    it('customMarkDownComponents 中的 undefined 项回退到内置组件', async () => {
        const { container } = render(<Chat chats={[{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }]} customMarkDownComponents={{ code: undefined }} roleConfig={roleConfig} />);
        await waitFor(() => expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-type')).toHaveTextContent('js'));
    });

    it('代码块的子节点不是字符串时不提供复制按钮', () => {
        const { container } = render(
            <Code className="language-js">
                <span>const a = 1;</span>
            </Code>
        );
        expect(container.querySelector('.semi-chat-chatBox-content-code-topSlot-copy-wrapper')).toBeNull();
    });

    it('复制成功的提示在消息日志之外', async () => {
        mockClipboard(vi.fn<() => Promise<void>>(() => Promise.resolve()));
        const { container } = await renderChat();
        fireEvent.click(actionButtons(boxes(container)[1])[0]);
        const toast = await screen.findByText(zh_CN.Chat.copySuccess);
        expect(toast.closest('[role="log"]')).toBeNull();
        Reflect.deleteProperty(navigator, 'clipboard');
    });
});

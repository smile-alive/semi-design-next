import { createSignal } from 'solid-js';
import { render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import ConfigProvider from '@fibrae/semi-ui-solid/config-provider/index';
import Modal from '@fibrae/semi-ui-solid/modal/index';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Chat from '../index';
import type { Message } from '../interface';

const roleConfig = {
    user: { name: 'User', avatar: 'https://example.com/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://example.com/assistant.png' },
};

const findEl = (container: ParentNode, selector: string) =>
    waitFor(() => {
        const el = container.querySelector<HTMLElement>(selector);
        expect(el).not.toBeNull();
        return el as HTMLElement;
    });

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const streamingChats = (lines: number): Message[] => [...Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', id: String(i), content: `message ${i}` })), { role: 'assistant', id: 'last', status: 'incomplete', content: Array(lines).fill('line').join('\n\n') }];

const distanceToBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight;

const lineCount = (container: HTMLElement) => container.textContent?.match(/line/g)?.length ?? 0;

async function streamLines(container: HTMLElement, update: (list: Message[]) => void, first: number, last: number) {
    for (let n = first; n <= last; n++) {
        update(streamingChats(n));
        await waitFor(() => expect(lineCount(container)).toBe(n));
    }
}

const history = (from: number, to: number): Message[] => Array.from({ length: to - from }, (_, i) => ({ role: (from + i) % 2 ? 'assistant' : 'user', id: `h${from + i}`, content: `history ${from + i}` }));

function renderTall(initial: Message[]) {
    const [list, setList] = createSignal(initial);
    const { container } = render(() => (
        <div style={{ height: '400px' }}>
            <Chat chats={list()} roleConfig={roleConfig} />
        </div>
    ));
    return { container, update: setList };
}

describe('Chat', () => {
    it('在顶部加载更早的消息后，原来的第一条消息留在原位', async () => {
        const chats = history(10, 20);
        const { container, update } = renderTall(chats);
        await waitFor(() => expect(container.textContent).toContain('history 19'));
        const area = container.querySelector('.semi-chat-container') as HTMLElement;
        area.scrollTop = 0;
        await nextFrame();
        const anchor = () => [...container.querySelectorAll<HTMLElement>('.semi-chat-chatBox')].find((el) => el.textContent?.includes('history 10')) as HTMLElement;
        const offset = () => anchor().getBoundingClientRect().top - area.getBoundingClientRect().top;
        const before = offset();
        update([...history(7, 10), ...chats]);
        await waitFor(() => expect(container.textContent).toContain('history 7'));
        expect(offset()).toBeCloseTo(before, 0);
    });

    describe('跟随流式输出', () => {
        it('用户停在底部时持续跟随新内容', async () => {
            const { container, update } = renderTall(streamingChats(2));
            const area = await findEl(container, '.semi-chat-container');
            await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
            await streamLines(container, update, 3, 8);
            expect(distanceToBottom(area)).toBeLessThan(100);
        });

        it('用户未通过滚轮离开底部时停止跟随，回到底部后恢复', async () => {
            const { container, update } = renderTall(streamingChats(2));
            const area = await findEl(container, '.semi-chat-container');
            await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
            await waitFor(() => expect(lineCount(container)).toBe(2));
            area.scrollTop = area.scrollHeight;
            // scroll events fire once per frame; without the wait the two moves coalesce into one event at 0
            await nextFrame();
            area.scrollTop = 0;
            await findEl(container, '.semi-chat-action-backBottom');
            await streamLines(container, update, 3, 6);
            expect(area.scrollTop).toBe(0);

            area.scrollTop = area.scrollHeight;
            await waitFor(() => expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull());
            await streamLines(container, update, 7, 10);
            expect(distanceToBottom(area)).toBeLessThan(100);
        });

        it('流式输出时输入框保持焦点与光标位置，已有消息的节点不变', async () => {
            const { container, update } = renderTall(streamingChats(2));
            const textarea = (await findEl(container, 'textarea')) as HTMLTextAreaElement;
            await waitFor(() => expect(lineCount(container)).toBe(2));
            const boxes = [...container.querySelectorAll('.semi-chat-chatBox')];
            await userEvent.click(textarea);
            await userEvent.keyboard('draft');
            textarea.setSelectionRange(2, 2);
            await streamLines(container, update, 3, 6);
            expect(textarea).toHaveFocus();
            expect(textarea.value).toBe('draft');
            expect(textarea.selectionStart).toBe(2);
            expect([...container.querySelectorAll('.semi-chat-chatBox')]).toEqual(boxes);
        });
    });

    it('在宿主的 border-box 重置下，文件附件能容纳其内容', async () => {
        // a layered host reset like the docs site's; an unlayered one would beat every Semi rule
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { box-sizing: border-box; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());
        const file = { type: 'file_url', file_url: { url: 'https://semi.design/a.pdf', name: 'a.pdf', size: '1KB' } };
        // The file part carries no `type` inside file_url, which the Content type requires
        const chats = [{ role: 'user', id: '1', content: [file] }] as Message[];
        const { container } = render(() => <Chat chats={chats} roleConfig={roleConfig} />);
        const card = await findEl(container, '.semi-chat-attachment-file');
        const inner = card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom);
        for (const part of card.children) {
            expect(part.getBoundingClientRect().bottom).toBeLessThanOrEqual(inner);
        }
    });

    it('删除确认框按 Escape 关闭', async () => {
        const chats = [
            { role: 'assistant', id: '1', content: 'hello' },
            { role: 'user', id: '2', content: 'hi' },
        ];
        const { container } = render(() => <Chat chats={chats} roleConfig={roleConfig} />);
        const trigger = (await findEl(container, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await userEvent.click(trigger);
        await expect.element(page.getByText('确认删除该会话吗？')).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.getByText('确认删除该会话吗？').query()).toBeNull());
    });

    it('在 Modal 中，Escape 只关闭删除确认框，Modal 保持打开且焦点回到删除按钮', async () => {
        const chats = [
            { role: 'assistant', id: '1', content: 'hello' },
            { role: 'user', id: '2', content: 'hi' },
        ];
        const onCancel = vi.fn<() => void>();
        const { baseElement } = render(() => (
            <Modal title="聊天" visible onCancel={onCancel}>
                <Chat chats={chats} roleConfig={roleConfig} />
            </Modal>
        ));
        const trigger = (await findEl(baseElement, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await expect.element(page.getByText('确认删除该会话吗？')).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.getByText('确认删除该会话吗？').query()).toBeNull());
        expect(onCancel).not.toHaveBeenCalled();
        expect(trigger).toHaveFocus();
    });

    it('消息操作栏默认不可见但可聚焦，聚焦其中的按钮后显示', async () => {
        const chats = [
            { role: 'assistant', id: '1', content: 'hello' },
            { role: 'user', id: '2', content: 'hi' },
        ];
        const { container } = render(() => <Chat chats={chats} roleConfig={roleConfig} />);
        const action = await findEl(container, '.semi-chat-chatBox-action');
        const button = action.querySelector('button') as HTMLElement;
        expect(getComputedStyle(action).opacity).toBe('0');
        // visibility: hidden would take the buttons out of the tab order
        expect(getComputedStyle(action).visibility).toBe('visible');
        await tabTo(button);
        await expect.poll(() => getComputedStyle(action).opacity).toBe('1');
    });

    it.each(['ltr', 'rtl'] as const)('%s 下发送按钮图标不旋转', async (direction) => {
        const { container } = render(() => (
            <ConfigProvider direction={direction}>
                <Chat chats={[]} roleConfig={roleConfig} />
            </ConfigProvider>
        ));
        const icon = await findEl(container, '.semi-chat-inputBox-sendButton-icon');
        expect(getComputedStyle(icon).transform).toBe('none');
    });

    it('代码块复制按钮显示主题焦点环', async () => {
        const chats = [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }];
        const { container } = render(() => <Chat chats={chats} roleConfig={roleConfig} />);
        const copy = await findEl(container, '.semi-chat-chatBox-content-code-topSlot-copy-wrapper');
        await tabTo(copy);
        expectThemeFocusRing(copy);
    });

    it('复制提示在对话区顶部居中，文案单行显示', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        onTestFinished(() => {
            vi.restoreAllMocks();
        });
        const chats = [
            { role: 'user', id: '1', content: 'hi' },
            { role: 'assistant', id: '2', content: 'hello' },
        ];
        const { container } = render(() => (
            <div style={{ width: '600px', height: '400px' }}>
                <Chat chats={chats} roleConfig={roleConfig} />
            </div>
        ));
        await findEl(container, '.semi-chat-chatBox-action');
        const copy = container.querySelectorAll<HTMLElement>('.semi-chat-chatBox-action-btn')[0];
        await userEvent.click(copy);
        const toast = await findEl(container, '.semi-chat-toast .semi-toast-content');
        const text = toast.querySelector('.semi-toast-content-text') as HTMLElement;
        expect(text.getBoundingClientRect().height).toBeLessThan(30);
        const area = (container.querySelector('.semi-chat-content') as HTMLElement).getBoundingClientRect();
        await expect.poll(() => toast.getBoundingClientRect().top).toBeGreaterThanOrEqual(area.top);
        const box = toast.getBoundingClientRect();
        expect(box.left + box.width / 2).toBeCloseTo(area.left + area.width / 2, 0);
    });

    it('提示显示主题焦点环', async () => {
        const chats = [{ role: 'assistant', id: '1', content: 'hello' }];
        const { container } = render(() => <Chat chats={chats} hints={['first']} roleConfig={roleConfig} />);
        const hint = await findEl(container, '.semi-chat-hint-item');
        await tabTo(hint);
        expectThemeFocusRing(hint);
    });

    it('带 uploadTipProps 时，从输入框 Shift+Tab 直接回到上传按钮，按钮获得提示描述', async () => {
        const chats = [{ role: 'assistant', id: '1', content: 'hello' }];
        const { container } = render(() => <Chat chats={chats} roleConfig={roleConfig} uploadTipProps={{ content: 'tip text' }} />);
        const textarea = await findEl(container, 'textarea');
        const uploadButton = await findEl(container, '.semi-chat-inputBox-uploadButton');
        await tabTo(textarea);
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(uploadButton).toHaveFocus();
        const tip = await findEl(document, '[role="tooltip"]');
        await waitFor(() => expect(uploadButton).toHaveAttribute('aria-describedby', tip.id));
    });

    it('移除附件后，焦点回到输入框而不是落到 body', async () => {
        const { container } = render(() => <Chat chats={[]} roleConfig={roleConfig} uploadProps={{ action: '/upload', uploadTrigger: 'custom' }} />);
        const textarea = await findEl(container, 'textarea');
        const data = new DataTransfer();
        data.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
        textarea.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
        const clear = await findEl(container, '.semi-chat-attachment-clear');
        await tabTo(clear);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector('.semi-chat-attachment-clear')).toBeNull());
        expect(textarea).toHaveFocus();
    });

    it('确认删除消息后，焦点交给消息列表而不是落到 body', async () => {
        const [chats, setChats] = createSignal<Message[]>([
            { role: 'user', id: '1', content: 'hi' },
            { role: 'assistant', id: '2', content: 'hello' },
        ]);
        const { container } = render(() => <Chat chats={chats()} roleConfig={roleConfig} onMessageDelete={(m) => setChats((list) => list.filter((c) => c.id !== m?.id))} />);
        const trigger = (await findEl(container, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await userEvent.click(page.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(container.querySelectorAll('.semi-chat-chatBox')).toHaveLength(1));
        await waitFor(() => expect(container.querySelector('.semi-chat-container')).toHaveFocus());
    });

    it('停止生成后焦点从停止按钮移到输入框', async () => {
        const at = (status: Message['status']): Message[] => [
            { role: 'user', id: '1', content: 'hi' },
            { role: 'assistant', id: '2', content: 'x', status },
        ];
        const [status, setStatus] = createSignal<Message['status']>('loading');
        const { container } = render(() => <Chat chats={at(status())} roleConfig={roleConfig} showStopGenerate />);
        const stop = await findEl(container, '.semi-chat-action-stop');
        await tabTo(stop);
        setStatus('complete');
        await waitFor(() => expect(container.querySelector('.semi-chat-action-stop')).toBeNull());
        expect(container.querySelector('textarea')).toHaveFocus();
    });

    it('渲染在 shadow root 内时，停止生成后焦点从停止按钮移到输入框', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const at = (status: Message['status']): Message[] => [
            { role: 'user', id: '1', content: 'hi' },
            { role: 'assistant', id: '2', content: 'x', status },
        ];
        const [status, setStatus] = createSignal<Message['status']>('loading');
        const { container } = render(() => <Chat chats={at(status())} roleConfig={roleConfig} showStopGenerate onStopGenerator={() => setStatus('complete')} />, { container: mount });
        const stop = await findEl(container, '.semi-chat-action-stop');
        stop.focus();
        expect(shadow.activeElement).toBe(stop);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector('.semi-chat-action-stop')).toBeNull());
        expect(shadow.activeElement).toBe(container.querySelector('textarea'));
    });

    it('回到底部后焦点从回到底部按钮移到输入框', async () => {
        const { container } = renderTall(streamingChats(2));
        const area = await findEl(container, '.semi-chat-container');
        await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
        area.scrollTop = area.scrollHeight;
        // scroll events fire once per frame; without the wait the two moves coalesce into one event at 0
        await nextFrame();
        area.scrollTop = 0;
        const backBottom = await findEl(container, '.semi-chat-action-backBottom');
        // tabbing through the message list would scroll it to the bottom and remove the button first
        backBottom.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull());
        expect(container.querySelector('textarea')).toHaveFocus();
    });
});

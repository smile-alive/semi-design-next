/** @jsxImportSource vue */
import { type VNode, shallowRef } from 'vue';
import { waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import Modal from '@fibrae/semi-ui-vue/modal/index';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Chat from '..';
import type { ChatMessage } from '../interface';

const text = en_US.Chat;
const roleConfig = {
    user: { name: 'User', avatar: 'https://example.com/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://example.com/assistant.png' },
};
const twoChats: ChatMessage[] = [
    { role: 'assistant', id: '1', content: 'hello' },
    { role: 'user', id: '2', content: 'hi' },
];

const find = <T extends Element = HTMLElement>(container: Element, selector: string) =>
    waitFor(() => {
        const found = container.querySelector<T>(selector);
        expect(found).not.toBeNull();
        return found as T;
    });

// Renders under en_US, so text assertions read the locale; `wrap` places the chat inside a host element
function renderChat(props: Record<string, unknown>, wrap: (chat: VNode) => VNode = (chat) => chat) {
    return render(() => <LocaleProvider locale={en_US}>{() => wrap(<Chat roleConfig={roleConfig} {...props} />)}</LocaleProvider>);
}

const streamingChats = (lines: number): ChatMessage[] => [
    ...Array.from({ length: 12 }, (_, i) => ({
        role: i % 2 ? 'assistant' : 'user',
        id: String(i),
        content: `message ${i}`,
    })),
    { role: 'assistant', id: 'last', status: 'incomplete', content: Array(lines).fill('line').join('\n\n') },
];

const distanceToBottom = (el: Element) => el.scrollHeight - el.scrollTop - el.clientHeight;

async function streamLines(container: Element, update: (chats: ChatMessage[]) => void, first: number, last: number) {
    for (let n = first; n <= last; n++) {
        update(streamingChats(n));
        await waitFor(() => expect(container.textContent?.match(/line/g)).toHaveLength(n));
    }
}

const history = (from: number, to: number): ChatMessage[] => Array.from({ length: to - from }, (_, i) => ({ role: (from + i) % 2 ? 'assistant' : 'user', id: `h${from + i}`, content: `history ${from + i}` }));

describe('Chat 浏览器', () => {
    it('在顶部加载更早的消息后，原来的第一条消息留在原位', async () => {
        const chats = history(10, 20);
        const list = shallowRef(chats);
        const { container } = render(() => (
            <div style={{ height: '400px' }}>
                <Chat chats={list.value} roleConfig={roleConfig} />
            </div>
        ));
        await waitFor(() => expect(container.textContent).toContain('history 19'));
        const area = container.querySelector('.semi-chat-container') as HTMLElement;
        area.scrollTop = 0;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const anchor = () => [...container.querySelectorAll<HTMLElement>('.semi-chat-chatBox')].find((el) => el.textContent?.includes('history 10')) as HTMLElement;
        const offset = () => anchor().getBoundingClientRect().top - area.getBoundingClientRect().top;
        const before = offset();
        list.value = [...history(7, 10), ...chats];
        await waitFor(() => expect(container.textContent).toContain('history 7'));
        expect(offset()).toBeCloseTo(before, 0);
    });

    describe('跟随流式输出', () => {
        const renderStream = (chats: ChatMessage[]) => {
            const list = shallowRef(chats);
            const { container } = render(() => (
                <div style={{ height: '400px' }}>
                    <Chat chats={list.value} roleConfig={roleConfig} />
                </div>
            ));
            return {
                container,
                update: (next: ChatMessage[]) => {
                    list.value = next;
                },
            };
        };

        it('用户停在底部时持续跟随新内容', async () => {
            const { container, update } = renderStream(streamingChats(2));
            const area = await find(container, '.semi-chat-container');
            await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
            await streamLines(container, update, 3, 8);
            expect(distanceToBottom(area)).toBeLessThan(100);
        });

        it('用户未通过滚轮离开底部时停止跟随，回到底部后恢复', async () => {
            const { container, update } = renderStream(streamingChats(2));
            const area = await find(container, '.semi-chat-container');
            await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
            await waitFor(() => expect(container.textContent?.match(/line/g)).toHaveLength(2));
            area.scrollTop = area.scrollHeight;
            // scroll events fire once per frame; without the wait the two moves coalesce into one event at 0
            await new Promise((resolve) => requestAnimationFrame(resolve));
            area.scrollTop = 0;
            await find(container, '.semi-chat-action-backBottom');
            await streamLines(container, update, 3, 6);
            expect(area.scrollTop).toBe(0);

            area.scrollTop = area.scrollHeight;
            await waitFor(() => expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull());
            await streamLines(container, update, 7, 10);
            expect(distanceToBottom(area)).toBeLessThan(100);
        });
    });

    it('在宿主的 border-box 重置下，文件附件能容纳其内容', async () => {
        // a layered host reset like the docs site's; an unlayered one would beat every Semi rule
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { box-sizing: border-box; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());
        const chats: ChatMessage[] = [
            {
                role: 'user',
                id: '1',
                content: [
                    {
                        type: 'file_url',
                        file_url: { url: 'https://semi.design/a.pdf', name: 'a.pdf', size: '1KB', type: '' },
                    },
                ],
            },
        ];
        const { container } = renderChat({ chats });
        const card = await find(container, '.semi-chat-attachment-file');
        const inner = card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom);
        for (const part of card.children) {
            expect(part.getBoundingClientRect().bottom).toBeLessThanOrEqual(inner);
        }
    });

    it('删除确认框按 Escape 关闭', async () => {
        const { container } = renderChat({ chats: twoChats });
        const trigger = (await find(container, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await userEvent.click(trigger);
        await expect.element(page.getByText(text.deleteConfirm)).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.getByText(text.deleteConfirm).query()).toBeNull());
    });

    it('在 Modal 中，Escape 只关闭删除确认框，Modal 保持打开且焦点回到删除按钮', async () => {
        const onCancel = vi.fn<() => void>();
        const { baseElement } = renderChat({ chats: twoChats }, (chat) => (
            <Modal title="Chat" visible onCancel={onCancel}>
                {() => chat}
            </Modal>
        ));
        const trigger = (await find(baseElement, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await expect.element(page.getByText(text.deleteConfirm)).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.getByText(text.deleteConfirm).query()).toBeNull());
        expect(onCancel).not.toHaveBeenCalled();
        expect(trigger).toHaveFocus();
    });

    it('消息操作栏默认不可见但可聚焦，聚焦其中的按钮后显示', async () => {
        const { container } = renderChat({ chats: twoChats });
        const action = await find(container, '.semi-chat-chatBox-action');
        const button = action.querySelector('button') as HTMLElement;
        expect(getComputedStyle(action).opacity).toBe('0');
        // visibility: hidden would take the buttons out of the tab order
        expect(getComputedStyle(action).visibility).toBe('visible');
        await tabTo(button);
        await expect.poll(() => getComputedStyle(action).opacity).toBe('1');
    });

    it.each(['ltr', 'rtl'] as const)('%s 下发送按钮图标不旋转', async (direction) => {
        const { container } = renderChat({ chats: [] }, (chat) => <ConfigProvider direction={direction}>{() => chat}</ConfigProvider>);
        const icon = await find(container, '.semi-chat-inputBox-sendButton-icon');
        expect(getComputedStyle(icon).transform).toBe('none');
    });

    it('代码块复制按钮显示主题焦点环', async () => {
        const { container } = renderChat({
            chats: [{ role: 'assistant', id: '1', content: '```js\nconst a = 1;\n```' }],
        });
        const copy = await find(container, '.semi-chat-chatBox-content-code-topSlot-copy-wrapper');
        await tabTo(copy);
        expectThemeFocusRing(copy);
    });

    it('复制提示在对话区顶部居中，文案单行显示', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        const { container } = renderChat(
            {
                chats: [
                    { role: 'user', id: '1', content: 'hi' },
                    { role: 'assistant', id: '2', content: 'hello' },
                ],
            },
            (chat) => <div style={{ width: '600px', height: '400px' }}>{chat}</div>
        );
        await find(container, '.semi-chat-chatBox-action');
        const copy = container.querySelectorAll<HTMLElement>('.semi-chat-chatBox-action-btn')[0];
        await userEvent.click(copy);
        const toast = await find(container, '.semi-chat-toast .semi-toast-content');
        const line = toast.querySelector('.semi-toast-content-text') as HTMLElement;
        expect(line).toHaveTextContent(text.copySuccess);
        expect(line.getBoundingClientRect().height).toBeLessThan(30);
        const area = (container.querySelector('.semi-chat-content') as HTMLElement).getBoundingClientRect();
        await expect.poll(() => toast.getBoundingClientRect().top).toBeGreaterThanOrEqual(area.top);
        const box = toast.getBoundingClientRect();
        expect(box.left + box.width / 2).toBeCloseTo(area.left + area.width / 2, 0);
    });

    it('提示显示主题焦点环', async () => {
        const { container } = renderChat({
            chats: [{ role: 'assistant', id: '1', content: 'hello' }],
            hints: ['first'],
        });
        const hint = await find(container, '.semi-chat-hint-item');
        await tabTo(hint);
        expectThemeFocusRing(hint);
    });

    it('带 uploadTipProps 时，从输入框 Shift+Tab 直接回到上传按钮，按钮获得提示描述', async () => {
        const { container } = renderChat({
            chats: [{ role: 'assistant', id: '1', content: 'hello' }],
            uploadTipProps: { content: 'tip text' },
        });
        const textarea = await find(container, 'textarea');
        const uploadButton = await find(container, '.semi-chat-inputBox-uploadButton');
        await tabTo(textarea);
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(uploadButton).toHaveFocus();
        const tip = await waitFor(() => {
            const el = document.querySelector('[role="tooltip"]');
            expect(el).not.toBeNull();
            return el as Element;
        });
        await waitFor(() => expect(uploadButton).toHaveAttribute('aria-describedby', tip.id));
    });

    it('移除附件后，焦点回到输入框而不是落到 body', async () => {
        const { container } = renderChat({ chats: [], uploadProps: { uploadTrigger: 'custom' } });
        const textarea = await find(container, 'textarea');
        const data = new DataTransfer();
        data.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
        textarea.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
        const clear = await find(container, '.semi-chat-attachment-clear');
        await tabTo(clear);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector('.semi-chat-attachment-clear')).toBeNull());
        expect(textarea).toHaveFocus();
    });

    it('确认删除消息后，焦点交给消息列表而不是落到 body', async () => {
        const list = shallowRef<ChatMessage[]>([...twoChats]);
        // the host drops the confirmed message, as v-model:chats does
        const { container } = render(() => <LocaleProvider locale={en_US}>{() => <Chat chats={list.value} roleConfig={roleConfig} onUpdate:chats={(next: ChatMessage[]) => (list.value = next)} />}</LocaleProvider>);
        const trigger = (await find(container, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await userEvent.click(page.getByRole('button', { name: en_US.Popconfirm.confirm }));
        await waitFor(() => expect(container.querySelectorAll('.semi-chat-chatBox')).toHaveLength(1));
        await waitFor(() => expect(container.querySelector('.semi-chat-container')).toHaveFocus());
    });

    it('停止生成后焦点从停止按钮移到输入框', async () => {
        const list = shallowRef<ChatMessage[]>([...twoChats, { role: 'assistant', id: '3', content: 'x', status: 'loading' }]);
        const { container } = render(() => <Chat chats={list.value} roleConfig={roleConfig} showStopGenerate />);
        const stop = await find(container, '.semi-chat-action-stop');
        await tabTo(stop);
        list.value = [...twoChats, { role: 'assistant', id: '3', content: 'x', status: 'complete' }];
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
        const list = shallowRef<ChatMessage[]>([...twoChats, { role: 'assistant', id: '3', content: 'x', status: 'loading' }]);
        const onStopGenerator = () => (list.value = [...twoChats, { role: 'assistant', id: '3', content: 'x', status: 'complete' }]);
        const { container } = render(() => <Chat chats={list.value} roleConfig={roleConfig} showStopGenerate onStopGenerator={onStopGenerator} />, { container: mount });
        const stop = await find(container, '.semi-chat-action-stop');
        stop.focus();
        expect(shadow.activeElement).toBe(stop);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector('.semi-chat-action-stop')).toBeNull());
        expect(shadow.activeElement).toBe(container.querySelector('textarea'));
    });

    it('回到底部后焦点从回到底部按钮移到输入框', async () => {
        const { container } = render(() => (
            <div style={{ height: '400px' }}>
                <Chat chats={streamingChats(2)} roleConfig={roleConfig} />
            </div>
        ));
        const area = await find(container, '.semi-chat-container');
        await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
        area.scrollTop = area.scrollHeight;
        // scroll events fire once per frame; without the wait the two moves coalesce into one event at 0
        await new Promise((resolve) => requestAnimationFrame(resolve));
        area.scrollTop = 0;
        const backBottom = await find(container, '.semi-chat-action-backBottom');
        // tabbing through the message list would scroll it to the bottom and remove the button first
        backBottom.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector('.semi-chat-action-backBottom')).toBeNull());
        expect(container.querySelector('textarea')).toHaveFocus();
    });
});

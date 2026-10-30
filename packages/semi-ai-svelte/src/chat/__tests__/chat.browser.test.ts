import { flushSync } from 'svelte';
import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import { tabTo } from '@test/utils/browser';
import type { ChatMessage } from '../interface';
import ChatHost, { type ChatHostStore } from './chat-host.svelte';

const text = zh_CN.Chat;
const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
const twoChats: ChatMessage[] = [
    { role: 'assistant', id: '1', content: 'hello' },
    { role: 'user', id: '2', content: 'hi' },
];

const streamingChats = (lines: number): ChatMessage[] => [...Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', id: String(i), content: `message ${i}` })), { role: 'assistant', id: 'last', status: 'incomplete', content: Array(lines).fill('line').join('\n\n') }];

const find = <T extends Element = HTMLElement>(container: Element, selector: string) =>
    waitFor(() => {
        const found = container.querySelector<T>(selector);
        expect(found).not.toBeNull();
        return found as T;
    });

function renderChat(chats: ChatMessage[], props: ChatHostStore['props'] = {}) {
    const store = createStore<ChatHostStore>({ chats, roleConfig, shown: {}, props: { style: 'height: 400px', ...props } });
    const view = render(ChatHost, { props: { store } });
    return { ...view, store };
}

describe('Chat 浏览器', () => {
    it('用户停在底部时，就地追加的流式内容持续被跟随', async () => {
        const { container, store } = renderChat(streamingChats(2));
        const area = await find(container, '.semi-chat-container');
        await waitFor(() => expect(area.scrollHeight).toBeGreaterThan(area.clientHeight));
        for (let lines = 3; lines <= 8; lines++) {
            store.chats = streamingChats(lines);
            flushSync();
            await waitFor(() => expect(container.textContent?.match(/line/g)).toHaveLength(lines));
        }
        expect(area.scrollHeight - area.scrollTop - area.clientHeight).toBeLessThan(100);
    });

    it('删除确认框按 Escape 关闭', async () => {
        const { container } = renderChat(twoChats);
        const trigger = (await find(container, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await userEvent.click(trigger);
        await expect.element(page.getByText(text.deleteConfirm)).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.getByText(text.deleteConfirm).query()).toBeNull());
    });

    it('确认删除消息后，焦点交给消息列表而不是落到 body', async () => {
        const { container } = renderChat(twoChats);
        const trigger = (await find(container, '.semi-icon-delete_stroked')).closest('button') as HTMLElement;
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await userEvent.click(page.getByRole('button', { name: zh_CN.Popconfirm.confirm }));
        await waitFor(() => expect(container.querySelectorAll('.semi-chat-chatBox')).toHaveLength(1));
        await waitFor(() => expect(container.querySelector('.semi-chat-container')).toHaveFocus());
    });

    it('停止生成后焦点从停止按钮移到输入框', async () => {
        const { container, store } = renderChat([...twoChats, { role: 'assistant', id: '3', content: 'x', status: 'loading' }], { showStopGenerate: true });
        const stop = await find(container, '.semi-chat-action-stop');
        await tabTo(stop);
        store.chats = [...twoChats, { role: 'assistant', id: '3', content: 'x', status: 'complete' }];
        flushSync();
        await waitFor(() => expect(container.querySelector('.semi-chat-action-stop')).toBeNull());
        expect(container.querySelector('textarea')).toHaveFocus();
    });
});

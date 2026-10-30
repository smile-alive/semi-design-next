import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Chat } from '../../index';
import type { ChatMessage } from '../interface';

const chats: ChatMessage[] = [
    { id: '1', role: 'user', content: 'hello' },
    { id: '2', role: 'assistant', content: 'world', status: 'loading' },
];

describe('Chat 服务端首帧', () => {
    it('输出消息、操作栏、提示与输入框，列表为 busy 的 log', () => {
        const { body } = render(Chat, { props: { chats, hints: ['next'], roleConfig: { user: { name: 'User' }, assistant: { name: 'Bot' } } } });
        expect(body).toContain('role="log"');
        expect(body).toContain('aria-busy="true"');
        expect(body).toContain(`aria-label="${zh_CN.Chat.messages}"`);
        expect(body).toContain('hello');
        expect(body).toContain('semi-chat-hint-item');
        expect(body).toContain(`aria-label="${zh_CN.Chat.copy}"`);
        expect(body).toContain(`aria-label="${zh_CN.Chat.input}"`);
        expect(body).toContain(`aria-label="${zh_CN.Chat.send}"`);
    });

    it('没有消息时只输出输入框，不输出消息与提示', () => {
        const { body } = render(Chat, { props: {} });
        expect(body).toContain('semi-chat-inputBox');
        expect(body).not.toContain('semi-chat-chatBox"');
        expect(body).not.toContain('semi-chat-hints');
    });
});

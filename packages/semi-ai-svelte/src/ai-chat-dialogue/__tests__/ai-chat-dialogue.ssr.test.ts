import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { AIChatDialogue } from '../../index';
import type { Message } from '../interface';

const chats: Message[] = [
    { id: '1', role: 'user', content: 'hello', status: 'completed' },
    { id: '2', role: 'assistant', content: [{ type: 'reasoning', status: 'completed', summary: [{ text: 'thought' }] }], status: 'in_progress' },
];

describe('AIChatDialogue 服务端首帧', () => {
    it('输出消息、markdown 正文、操作栏与提示，列表为 busy 的 log', () => {
        const { body } = render(AIChatDialogue, { props: { chats, hints: ['next'], roleConfig: { user: { name: 'User' }, assistant: { name: 'Bot' } } } });
        expect(body).toContain('role="log"');
        expect(body).toContain('aria-busy="true"');
        expect(body).toContain(`aria-label="${zh_CN.AIChatDialogue.messages}"`);
        expect(body).toContain('hello');
        expect(body).toContain(zh_CN.AIChatDialogue.reasoning.completed);
        expect(body).toContain('semi-ai-chat-dialogue-hint-item');
        expect(body).toContain(`aria-label="${zh_CN.AIChatDialogue.copy}"`);
    });
});

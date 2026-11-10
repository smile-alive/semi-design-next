import { describe, expect, it } from 'vite-plus/test';
import DialogueFoundation from '../foundation';

describe('DialogueFoundation.getContentClass', () => {
    it.each([
        ['assistant', 'completed', 'bubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-bubble'],
        ['user', 'completed', 'bubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-bubble semi-ai-chat-dialogue-content-user'],
        ['assistant', 'completed', 'userBubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-no-bubble'],
        ['user', 'completed', 'userBubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-userBubble semi-ai-chat-dialogue-content-user'],
        ['user', 'completed', 'noBubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-no-bubble semi-ai-chat-dialogue-content-user'],
        ['assistant', 'failed', 'bubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-bubble semi-ai-chat-dialogue-content-error'],
        ['assistant', 'failed', 'noBubble', 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-no-bubble'],
        ['assistant', undefined, undefined, 'semi-ai-chat-dialogue-content semi-ai-chat-dialogue-content-no-bubble'],
    ])('%s / %s / %s', (role, status, mode, className) => {
        expect(DialogueFoundation.getContentClass(role, status, mode)).toBe(className);
    });
});

describe('DialogueFoundation.getMarkdownRaw', () => {
    it('只在 escapeHtml 开启时转义用户消息', () => {
        expect(DialogueFoundation.getMarkdownRaw('<b>x</b>', 'user', true)).not.toBe('<b>x</b>');
        expect(DialogueFoundation.getMarkdownRaw('<b>x</b>', 'user', false)).toBe('<b>x</b>');
        expect(DialogueFoundation.getMarkdownRaw('<b>x</b>', 'assistant', true)).toBe('<b>x</b>');
    });
});

describe('DialogueFoundation.mergeMarkdownComponents', () => {
    it('自定义组件覆盖内置组件，值为 undefined 的项不覆盖', () => {
        expect(DialogueFoundation.mergeMarkdownComponents({ code: 'builtin', img: 'builtin' }, { code: undefined, img: 'custom', a: 'custom' })).toEqual({ code: 'builtin', img: 'custom', a: 'custom' });
        expect(DialogueFoundation.mergeMarkdownComponents({ code: 'builtin' }, undefined)).toEqual({ code: 'builtin' });
    });
});

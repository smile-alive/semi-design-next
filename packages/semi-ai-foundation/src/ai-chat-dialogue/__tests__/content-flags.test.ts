import { describe, expect, it } from 'vite-plus/test';
import DialogueFoundation from '../foundation';

describe('DialogueFoundation.getContentFlags', () => {
    it.each([
        ['assistant', 'completed', 'bubble', { bubble: true, user: false, error: false }],
        ['user', 'completed', 'bubble', { bubble: true, user: true, error: false }],
        ['assistant', 'completed', 'userBubble', { bubble: false, user: false, error: false }],
        ['user', 'completed', 'userBubble', { bubble: true, user: true, error: false }],
        ['user', 'completed', 'noBubble', { bubble: false, user: true, error: false }],
        ['assistant', 'failed', 'bubble', { bubble: true, user: false, error: true }],
        ['assistant', 'failed', 'noBubble', { bubble: false, user: false, error: false }],
        ['assistant', undefined, undefined, { bubble: false, user: false, error: false }],
    ])('%s / %s / %s', (role, status, mode, flags) => {
        expect(DialogueFoundation.getContentFlags(role, status, mode)).toEqual(flags);
    });
});

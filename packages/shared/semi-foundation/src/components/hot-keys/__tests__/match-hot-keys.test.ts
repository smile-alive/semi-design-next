import { describe, expect, it } from 'vite-plus/test';
import { assertHotKeys, matchHotKeys } from '../foundation';

const keydown = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

describe('assertHotKeys', () => {
    it('需要恰好一个普通键', () => {
        expect(() => assertHotKeys(['Control', 'k'])).not.toThrow();
        expect(() => assertHotKeys(['Control', 'Shift'])).toThrow('one common key');
        expect(() => assertHotKeys(['a', 'b'])).toThrow('one common key');
        expect(() => assertHotKeys(['Control', 'NotAKey'])).toThrow('notakey is not a valid key');
    });
});

describe('matchHotKeys', () => {
    it('普通键按物理位置匹配，修饰键必须完全一致', () => {
        expect(matchHotKeys(['Control', 'k'], keydown({ code: 'KeyK', ctrlKey: true }))).toBe(true);
        expect(matchHotKeys(['Control', 'k'], keydown({ code: 'KeyK', ctrlKey: true, shiftKey: true }))).toBe(false);
        expect(matchHotKeys(['Control', 'k'], keydown({ code: 'KeyK' }))).toBe(false);
        expect(matchHotKeys(['Control', 'k'], keydown({ code: 'KeyJ', ctrlKey: true }))).toBe(false);
    });
});

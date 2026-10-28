import { describe, expect, it } from 'vite-plus/test';
import { isSecondaryPress } from '../pointer';

describe('isSecondaryPress', () => {
    it.each<[string, number, boolean]>([
        ['mouse', 0, false],
        ['touch', 0, false],
        ['pen', 0, false],
        ['mouse', 1, true],
        ['mouse', 2, true],
        ['pen', 2, true],
        ['pen', 5, true],
    ])('%s 按下 button %i 时为 %s', (pointerType, button, expected) => {
        const press: Pick<PointerEvent, 'pointerType' | 'button'> = { pointerType, button };
        expect(isSecondaryPress(press)).toBe(expected);
    });
});

import { describe, expect, it } from 'vite-plus/test';
import { canRoleCarryPopupState, isBlockDisplay, wrapsSpecialTrigger } from '../constants';

describe('触发器规则', () => {
    it('只有可带弹层状态的角色返回 true', () => {
        expect(canRoleCarryPopupState('button')).toBe(true);
        expect(canRoleCarryPopupState('gridcell')).toBe(true);
        expect(canRoleCarryPopupState('img')).toBe(false);
    });

    it('块级 display 需要撑满包裹元素', () => {
        expect(isBlockDisplay('flex')).toBe(true);
        expect(isBlockDisplay('inline-block')).toBe(false);
        expect(isBlockDisplay(undefined)).toBe(false);
    });

    it('特殊状态的触发器：custom 不包裹，loading 总是包裹，disabled 只在 click 与 contextMenu 包裹', () => {
        expect(wrapsSpecialTrigger('custom', true)).toBe(false);
        expect(wrapsSpecialTrigger('hover', true)).toBe(true);
        expect(wrapsSpecialTrigger('hover', false)).toBe(false);
        expect(wrapsSpecialTrigger('click', false)).toBe(true);
        expect(wrapsSpecialTrigger('contextMenu', false)).toBe(true);
    });
});

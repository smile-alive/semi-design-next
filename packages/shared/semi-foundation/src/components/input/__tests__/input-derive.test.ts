import { describe, expect, it, vi } from 'vite-plus/test';
import InputFoundation, { type InputAdapter } from '../foundation';
import TextEntryFoundation from '../text-entry-foundation';
import TextAreaFoundation from '../textarea-foundation';

describe('TextEntryFoundation.getNativeMaxLength', () => {
    it('有 getValueLength 时不设原生 maxLength，由它负责限制', () => {
        expect(TextEntryFoundation.getNativeMaxLength({ maxLength: 5 })).toBe(5);
        expect(TextEntryFoundation.getNativeMaxLength({ maxLength: 5, getValueLength: (value) => value.length })).toBeUndefined();
    });
});

describe('InputFoundation.getLabelA11y', () => {
    const base = { shown: true, generatedId: 'g' };

    it('显示 inset 标签时用生成的 id 命名输入框，调用方的 aria-label 或 aria-labelledby 优先', () => {
        expect(InputFoundation.getLabelA11y(base)).toEqual({ labelId: 'g-inset-label', ariaInvalid: undefined, ariaLabelledby: 'g-inset-label' });
        expect(InputFoundation.getLabelA11y({ ...base, insetLabelId: 'mine' })).toMatchObject({ labelId: 'mine', ariaLabelledby: 'mine' });
        expect(InputFoundation.getLabelA11y({ ...base, ariaLabel: 'x' }).ariaLabelledby).toBeUndefined();
        expect(InputFoundation.getLabelA11y({ ...base, ariaLabelledby: 'other' }).ariaLabelledby).toBe('other');
    });

    it('inset 标签让位给 prefix 时没有 id；validateStatus 为 error 时标记无效', () => {
        expect(InputFoundation.getLabelA11y({ ...base, shown: false })).toMatchObject({ labelId: undefined, ariaLabelledby: undefined });
        expect(InputFoundation.getLabelA11y({ ...base, validateStatus: 'error', ariaInvalid: 'false' }).ariaInvalid).toBe('true');
        expect(InputFoundation.getLabelA11y({ ...base, ariaInvalid: 'grammar' }).ariaInvalid).toBe('grammar');
    });
});

describe('InputFoundation 清除按钮', () => {
    const setup = () => {
        const adapter = { getProps: () => ({}), isControlledComponent: () => true, setState: vi.fn<() => void>(), notifyChange: vi.fn<() => void>(), notifyClear: vi.fn<() => void>(), focusInput: vi.fn<() => void>() };
        return { adapter, foundation: new InputFoundation(adapter as unknown as InputAdapter) };
    };

    it('主键 mousedown 清除并阻止失焦，其他键只阻止失焦', () => {
        const { adapter, foundation } = setup();
        const preventDefault = vi.fn<() => void>();
        foundation.handleClearMouseDown({ button: 2, preventDefault });
        expect(adapter.notifyClear).not.toHaveBeenCalled();
        foundation.handleClearMouseDown({ button: 0, preventDefault });
        expect(adapter.notifyClear).toHaveBeenCalledTimes(1);
        expect(preventDefault).toHaveBeenCalledTimes(2);
    });

    it('只有 detail 为 0 的 click（键盘激活）清除，并把焦点还给输入框', () => {
        const { adapter, foundation } = setup();
        foundation.handleClearClick({ detail: 1 });
        expect(adapter.notifyClear).not.toHaveBeenCalled();
        foundation.handleClearClick({ detail: 0 });
        expect(adapter.notifyClear).toHaveBeenCalledTimes(1);
        expect(adapter.focusInput).toHaveBeenCalledTimes(1);
    });
});

describe('InputFoundation 焦点边界', () => {
    it('只在焦点跨出或跨入包装元素时报告', () => {
        const adapter = { getState: () => 'v', getStates: () => ({ value: 'v' }), setState: vi.fn<() => void>(), notifyBlur: vi.fn<() => void>(), notifyFocus: vi.fn<() => void>() };
        const foundation = new InputFoundation(adapter as unknown as InputAdapter);
        const wrapper = document.createElement('div');
        const button = wrapper.appendChild(document.createElement('button'));
        foundation.handleBlur({ currentTarget: wrapper, relatedTarget: button });
        foundation.handleFocus({ currentTarget: wrapper, relatedTarget: button });
        expect(adapter.notifyBlur).not.toHaveBeenCalled();
        expect(adapter.notifyFocus).not.toHaveBeenCalled();
        foundation.handleBlur({ currentTarget: wrapper, relatedTarget: null });
        foundation.handleFocus({ currentTarget: wrapper, relatedTarget: null });
        expect(adapter.notifyBlur).toHaveBeenCalledTimes(1);
        expect(adapter.notifyFocus).toHaveBeenCalledTimes(1);
    });
});

describe('TextAreaFoundation.getSizeStyle', () => {
    it('autosize 固定 resize 为 none，行数边界写成 CSS 变量，最小行数缺省取 rows', () => {
        expect(TextAreaFoundation.getSizeStyle({ autosize: { minRows: 2, maxRows: 6 } })).toEqual({ resize: 'none', '--semi-input-textarea-min-rows': '2', '--semi-input-textarea-max-rows': '6' });
        expect(TextAreaFoundation.getSizeStyle({ autosize: true, rows: 3 })).toEqual({ resize: 'none', '--semi-input-textarea-min-rows': '3' });
    });

    it('没有 autosize 时只在传入 resize 后才设置', () => {
        expect(TextAreaFoundation.getSizeStyle({})).toEqual({});
        expect(TextAreaFoundation.getSizeStyle({ resize: 'vertical' })).toEqual({ resize: 'vertical' });
    });
});

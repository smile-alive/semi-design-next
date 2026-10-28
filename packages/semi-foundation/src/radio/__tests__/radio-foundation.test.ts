import { describe, expect, it, vi } from 'vite-plus/test';
import RadioFoundation, { type RadioAdapter, type RadioBaseProps, type RadioChangeEvent, type RadioContextView } from '../radio-foundation';

const source = () => ({ stopPropagation: vi.fn<() => void>(), preventDefault: vi.fn<() => void>() });

function setup(props: RadioBaseProps, context: RadioContextView | null = null, checked = false) {
    const adapter = {
        getProps: () => props,
        getStates: () => ({ checked }),
        getContexts: () => context,
        setChecked: vi.fn<(checked: boolean) => void>(),
        notifyGroupChange: vi.fn<(e: RadioChangeEvent) => void>(),
        notifyChange: vi.fn<(e: RadioChangeEvent) => void>(),
        getInput: () => null,
    };
    return { adapter, foundation: new RadioFoundation(adapter as unknown as RadioAdapter) };
}

describe('RadioFoundation', () => {
    describe('getInitialState', () => {
        it('布尔的 checked 优先于 defaultChecked，包括 false', () => {
            expect(RadioFoundation.getInitialState({ checked: false, defaultChecked: true })).toEqual({ checked: false });
            expect(RadioFoundation.getInitialState({ checked: true, defaultChecked: false })).toEqual({ checked: true });
        });

        it('checked 不是布尔值时取 defaultChecked', () => {
            expect(RadioFoundation.getInitialState({ defaultChecked: true })).toEqual({ checked: true });
            expect(RadioFoundation.getInitialState({})).toEqual({ checked: false });
        });
    });

    describe('deriveView', () => {
        it('组外的单选框按自身 props 与 state 推导', () => {
            const view = RadioFoundation.deriveView({ type: 'pureCard', mode: 'advanced' }, { checked: true }, null);
            expect(view).toMatchObject({
                inGroup: false,
                checked: true,
                mode: 'advanced',
                isButtonRadio: false,
                isCardRadio: true,
                isPureCardRadio: true,
            });
            expect(RadioFoundation.deriveView({ type: 'button' }, {}, null).isButtonRadio).toBe(true);
        });

        it('受控的 checked 在当次渲染就生效', () => {
            expect(RadioFoundation.deriveView({ checked: false }, { checked: true }, null).checked).toBe(false);
            expect(RadioFoundation.deriveView({ checked: true }, { checked: false }, null).checked).toBe(true);
        });

        it('组内的单选框由组的 value、disabled 与外观决定', () => {
            const context = {
                mode: 'advanced',
                radioGroup: { value: 'a', disabled: true, isCardRadio: true, buttonSize: 'small', prefixCls: 'g' },
            };
            expect(RadioFoundation.deriveView({ value: 'a', type: 'button' }, {}, context)).toMatchObject({
                inGroup: true,
                checked: true,
                disabled: true,
                mode: 'advanced',
                isButtonRadio: false,
                isCardRadio: true,
                buttonSize: 'small',
                prefixCls: 'g',
            });
            expect(RadioFoundation.deriveView({ value: 'b' }, {}, context).checked).toBe(false);
        });

        it('组内没有 value 的单选框不会被选中', () => {
            const context = { radioGroup: { value: undefined } };
            expect(RadioFoundation.deriveView({}, {}, context).checked).toBe(false);
        });
    });

    describe('handleChange', () => {
        it('依次通知组、写入非受控的 checked、通知自身', () => {
            const { adapter, foundation } = setup({ value: 'a' });
            const calls: string[] = [];
            adapter.notifyGroupChange.mockImplementation(() => calls.push('group'));
            adapter.setChecked.mockImplementation(() => calls.push('set'));
            adapter.notifyChange.mockImplementation(() => calls.push('own'));
            foundation.handleChange(true, source());
            expect(calls).toEqual(['group', 'set', 'own']);
            expect(adapter.setChecked).toHaveBeenCalledWith(true);
        });

        it('受控时不写入 checked', () => {
            const { adapter, foundation } = setup({ value: 'a', checked: false });
            foundation.handleChange(true, source());
            expect(adapter.setChecked).not.toHaveBeenCalled();
            expect(adapter.notifyChange).toHaveBeenCalledTimes(1);
        });

        it('事件的 target 带上全部 props，名称与禁用状态取组的决定', () => {
            const context = { radioGroup: { value: 'x', disabled: true, name: 'g' } };
            const { adapter, foundation } = setup({ value: 'a', prefixCls: 'p' }, context);
            const e = source();
            foundation.handleChange(true, e);
            const event = adapter.notifyChange.mock.calls[0][0];
            expect(event.target).toMatchObject({
                value: 'a',
                checked: true,
                name: 'g',
                disabled: true,
                prefixCls: 'p',
            });
            event.stopPropagation();
            event.preventDefault();
            expect(e.stopPropagation).toHaveBeenCalled();
            expect(e.preventDefault).toHaveBeenCalled();
        });
    });

    describe('handleKeyUp', () => {
        it('advanced 模式下已选中的单选框按空格，报告取消选中', () => {
            const { adapter, foundation } = setup({ value: 'a', mode: 'advanced' }, null, true);
            foundation.handleKeyUp({ ...source(), key: ' ' });
            expect(adapter.notifyChange.mock.calls[0][0].target.checked).toBe(false);
        });

        it('其他按键、未选中或非 advanced 模式时不报告', () => {
            const other = setup({ value: 'a', mode: 'advanced' }, null, true);
            other.foundation.handleKeyUp({ ...source(), key: 'Enter' });
            const unchecked = setup({ value: 'a', mode: 'advanced' }, null, false);
            unchecked.foundation.handleKeyUp({ ...source(), key: ' ' });
            const plain = setup({ value: 'a' }, null, true);
            plain.foundation.handleKeyUp({ ...source(), key: ' ' });
            expect(other.adapter.notifyChange).not.toHaveBeenCalled();
            expect(unchecked.adapter.notifyChange).not.toHaveBeenCalled();
            expect(plain.adapter.notifyChange).not.toHaveBeenCalled();
        });
    });

    describe('handleClick', () => {
        it('advanced 模式下点击已选中的单选框，报告取消选中', () => {
            const { adapter, foundation } = setup({ value: 'a', mode: 'advanced' }, null, true);
            foundation.handleClick(source());
            expect(adapter.notifyChange.mock.calls[0][0].target.checked).toBe(false);
        });

        it('未选中或非 advanced 模式时不报告', () => {
            const unchecked = setup({ value: 'a', mode: 'advanced' }, null, false);
            unchecked.foundation.handleClick(source());
            const plain = setup({ value: 'a' }, null, true);
            plain.foundation.handleClick(source());
            expect(unchecked.adapter.notifyChange).not.toHaveBeenCalled();
            expect(plain.adapter.notifyChange).not.toHaveBeenCalled();
        });

        it('组内的 advanced 模式取自组', () => {
            const context = { mode: 'advanced', radioGroup: { value: 'a' } };
            const { adapter, foundation } = setup({ value: 'a' }, context);
            foundation.handleClick(source());
            expect(adapter.notifyGroupChange.mock.calls[0][0].target.checked).toBe(false);
        });
    });
});

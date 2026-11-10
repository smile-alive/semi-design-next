import { describe, expect, it, vi } from 'vite-plus/test';
import CheckboxFoundation, { type BaseCheckboxProps, type BasicCheckboxEvent, type CheckboxAdapter, type CheckboxContextView, type CheckboxGroupView } from '../checkbox-foundation';

const group: CheckboxGroupView = {
    value: ['a'],
    disabled: false,
    name: 'g',
    isCardType: true,
    isPureCardType: false,
    ariaInvalid: true,
    ariaErrormessage: 'err',
};

describe('CheckboxFoundation', () => {
    describe('deriveView', () => {
        it('组外的复选框按自身 props 与 state 推导', () => {
            expect(CheckboxFoundation.deriveView({ type: 'pureCard', name: 'n', 'aria-invalid': 'true' }, { checked: true }, null)).toEqual({
                inGroup: false,
                checked: true,
                disabled: false,
                name: 'n',
                isCardType: true,
                isPureCardType: true,
                ariaInvalid: 'true',
                ariaErrormessage: undefined,
            });
        });

        it('布尔的 checked 优先于 state', () => {
            expect(CheckboxFoundation.deriveView({ checked: false }, { checked: true }).checked).toBe(false);
            expect(CheckboxFoundation.deriveView({ checked: 'x' }, { checked: true }).checked).toBe(true);
        });

        it('组内有 value 的复选框取组的值、名称、卡片类型与 aria', () => {
            expect(CheckboxFoundation.deriveView({ value: 'a', name: 'own' }, { checked: false }, group)).toEqual({
                inGroup: true,
                checked: true,
                disabled: false,
                name: 'g',
                isCardType: true,
                isPureCardType: false,
                ariaInvalid: true,
                ariaErrormessage: 'err',
            });
            expect(CheckboxFoundation.deriveView({ value: 'a', 'aria-invalid': false }, { checked: false }, group).ariaInvalid).toBe(false);
            expect(CheckboxFoundation.deriveView({ value: 'a', disabled: true }, { checked: false }, group).disabled).toBe(true);
            expect(CheckboxFoundation.deriveView({ value: 'a' }, { checked: false }, { ...group, disabled: true }).disabled).toBe(true);
        });

        it('组内没有 value 的复选框不属于该组，也不继承组的 aria', () => {
            const view = CheckboxFoundation.deriveView({}, { checked: false }, group);
            expect(view).toMatchObject({ inGroup: false, name: undefined, isCardType: false, ariaInvalid: undefined, ariaErrormessage: undefined });
        });
    });

    describe('handleChange', () => {
        const source = () => ({ stopPropagation: vi.fn<() => void>(), preventDefault: vi.fn<() => void>() });

        const input = document.createElement('input');
        document.body.append(input);

        const setup = (props: BaseCheckboxProps & { name?: string }, context: CheckboxContextView | null = null, checked = false) => {
            const adapter = {
                getProps: () => props,
                getProp: (key: keyof BaseCheckboxProps) => props[key],
                getStates: () => ({ checked }),
                getState: () => checked,
                getContexts: () => context,
                isControlledComponent: () => false,
                setState: vi.fn<(state: object) => void>(),
                getInput: () => input,
                notifyChange: vi.fn<(e: BasicCheckboxEvent) => void>(),
                notifyGroupChange: vi.fn<(e: BasicCheckboxEvent) => void>(),
            };
            return { adapter, foundation: new CheckboxFoundation(adapter as unknown as CheckboxAdapter) };
        };

        it('组外切换自身状态，事件的 target 只有 checked、value、name、disabled', () => {
            const { adapter, foundation } = setup({ value: 'v', name: 'n', id: 'i' });
            foundation.handleChange(source());
            expect(adapter.setState.mock.calls[0][0]).toEqual({ checked: true });
            expect(adapter.notifyChange.mock.calls[0][0].target).toEqual({ value: 'v', name: 'n', disabled: false, checked: true });
            expect(adapter.notifyGroupChange).not.toHaveBeenCalled();
        });

        it('组内按组的 value 切换，事件的 name 取组名，并同时通知组', () => {
            const { adapter, foundation } = setup({ value: 'a' }, { checkboxGroup: group }, false);
            foundation.handleChange(source());
            expect(adapter.notifyChange.mock.calls[0][0].target).toMatchObject({ value: 'a', name: 'g', checked: false });
            expect(adapter.notifyGroupChange).toHaveBeenCalledWith(adapter.notifyChange.mock.calls[0][0]);
            expect(adapter.setState).not.toHaveBeenCalled();
        });

        it('组被禁用时只聚焦，不通知', () => {
            const { adapter, foundation } = setup({ value: 'a' }, { checkboxGroup: { ...group, disabled: true } });
            foundation.handleChange(source());
            expect(document.activeElement).toBe(input);
            expect(adapter.notifyChange).not.toHaveBeenCalled();
        });

        it('nativeEvent 取合成事件携带的原生事件，没有时取事件自身', () => {
            const { adapter, foundation } = setup({});
            const native = { stopImmediatePropagation: vi.fn<() => void>() };
            foundation.handleChange({ ...source(), nativeEvent: native });
            const self = { ...source(), stopImmediatePropagation: vi.fn<() => void>() };
            foundation.handleChange(self);
            expect(adapter.notifyChange.mock.calls[0][0].nativeEvent).toBe(native);
            expect(adapter.notifyChange.mock.calls[1][0].nativeEvent).toBe(self);
        });
    });

    describe('isInnerInteractiveClick', () => {
        const root = document.createElement('span');
        root.innerHTML = '<input type="checkbox"><div><a href="#">link</a><b>text</b></div>';
        const input = root.querySelector('input') as HTMLInputElement;
        const link = root.querySelector('a') as HTMLAnchorElement;
        const text = root.querySelector('b') as HTMLElement;

        it('点在内部的链接上为 true，点在文本或自身的 input 上为 false', () => {
            expect(CheckboxFoundation.isInnerInteractiveClick(link, root, input)).toBe(true);
            expect(CheckboxFoundation.isInnerInteractiveClick(text, root, input)).toBe(false);
            expect(CheckboxFoundation.isInnerInteractiveClick(input, root, input)).toBe(false);
        });

        it('根元素外的交互元素不算', () => {
            const outer = document.createElement('a');
            outer.append(root);
            expect(CheckboxFoundation.isInnerInteractiveClick(text, root, input)).toBe(false);
        });
    });
});

import { describe, expect, it } from 'vite-plus/test';
import CheckboxFoundation, { type CheckboxGroupView } from '../checkbox-foundation';

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

import { describe, expect, it } from 'vite-plus/test';
import { hasClickListener, isAriaKey, isClickListenerKey, isNativeInputKey, isNotClassOrStyle, splitControlAttrs } from '../control-attrs';

describe('control-attrs', () => {
    it.each(['onClick', 'onClickOnce', 'onClickCapture', 'onClickPassive', 'onClickCaptureOnce', 'onClickOncePassive'])('%s 是 click 监听键', (key) => {
        expect(isClickListenerKey(key)).toBe(true);
    });
    it.each(['onClickX', 'onclick', 'onDblclick', 'onClickOutside', 'click'])('%s 不是 click 监听键', (key) => {
        expect(isClickListenerKey(key)).toBe(false);
    });
    it('hasClickListener 只认有值的 click 监听', () => {
        const fn = () => {};
        expect(hasClickListener({ onClick: fn })).toBe(true);
        expect(hasClickListener({ onClickOnce: fn })).toBe(true);
        expect(hasClickListener({ onClick: undefined })).toBe(false);
        expect(hasClickListener({ onDblclick: fn, 'aria-label': 'a' })).toBe(false);
    });
    it('isNotClassOrStyle 把 class 与 style 留在根元素', () => {
        const { root, control } = splitControlAttrs({ class: 'a', style: 'color: red', id: 'x', onInput: () => {} }, isNotClassOrStyle);
        expect(Object.keys(root)).toEqual(['class', 'style']);
        expect(Object.keys(control)).toEqual(['id', 'onInput']);
    });
    it('isAriaKey 只认 aria-*', () => {
        expect(isAriaKey('aria-label')).toBe(true);
        expect(isAriaKey('role')).toBe(false);
        expect(isAriaKey('data-aria')).toBe(false);
    });
    it('isNativeInputKey 认 aria-*、标识与焦点相关的键', () => {
        for (const key of ['aria-describedby', 'id', 'name', 'tabindex', 'tabIndex', 'autofocus', 'onFocus', 'onBlur']) expect(isNativeInputKey(key)).toBe(true);
        for (const key of ['class', 'style', 'onClick', 'data-id', 'role']) expect(isNativeInputKey(key)).toBe(false);
    });
});

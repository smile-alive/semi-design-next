import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import InputGroup from '../input-group.svelte';
import GroupCase from './group-case.svelte';
import GroupLabel from './group-label.svelte';

type Case = NonNullable<Parameters<typeof GroupCase>[1]>['store'];

const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const labelCls = `${BASE_CLASS_PREFIX}-form-field-label`;
const byPlaceholder = (text: string) => screen.getByPlaceholderText(text);

function setup(initial: Case = {}) {
    const store = createStore<Case>({ group: {}, ...initial });
    const view = render(GroupCase, { props: { store } });
    return { store, view };
}

describe('Svelte InputGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('子项自带的 disabled 优先于组的值，未写的子项取组的值', () => {
        const { store } = setup({ group: { disabled: true } });
        expect(byPlaceholder('own-enabled')).toBeEnabled();
        expect(byPlaceholder('shorthand')).toBeDisabled();
        expect(byPlaceholder('inherit')).toBeDisabled();
        store.group = { disabled: false };
        flushSync();
        expect(byPlaceholder('own-enabled')).toBeEnabled();
        expect(byPlaceholder('shorthand')).toBeDisabled();
        expect(byPlaceholder('inherit')).toBeEnabled();
    });

    it('onFocus 与 onBlur 在分组元素上各触发一次，不下发给子项', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const onChildFocus = vi.fn<() => void>();
        setup({ group: { onFocus, onBlur }, onChildFocus });
        await userEvent.click(byPlaceholder('own-enabled'));
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
        expect(onChildFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
    });

    it('size 与 disabled 传给组内任意深度的控件，自己显式传的值优先', () => {
        setup({ group: { disabled: true, size: 'small' } });
        const group = screen.getByRole('group');
        expect(group).not.toHaveAttribute('aria-disabled');
        expect(group).toHaveClass(`${prefixCls}-group`, `${prefixCls}-small`);
        for (const placeholder of ['shorthand', 'inherit', 'deep']) {
            expect(byPlaceholder(placeholder)).toBeDisabled();
            expect(byPlaceholder(placeholder)).toHaveClass(`${prefixCls}-small`);
        }
        expect(byPlaceholder('own-enabled')).toBeEnabled();
        expect(byPlaceholder('own-size')).toHaveClass(`${prefixCls}-large`);
        expect(byPlaceholder('own-size')).not.toHaveClass(`${prefixCls}-small`);
    });

    it('TextArea 读取组的 disabled，自己显式传的值优先', () => {
        const { store } = setup({ group: { disabled: true } });
        expect(byPlaceholder('area')).toBeDisabled();
        store.group = { disabled: false };
        flushSync();
        expect(byPlaceholder('area')).toBeEnabled();
    });

    it('未声明属性只落在分组元素，class 与 style 也在其上，子项不接收', () => {
        setup({ group: { class: 'g', style: 'color: red', 'data-group': '1', 'aria-describedby': 'hint' } });
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', zh_CN.Input.group);
        expect(group).toHaveAttribute('data-group', '1');
        expect(group).toHaveAttribute('aria-describedby', 'hint');
        expect(group).toHaveClass('g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        for (const control of document.querySelectorAll('input, textarea')) {
            expect(control).not.toHaveAttribute('data-group');
            expect(control).not.toHaveAttribute('aria-describedby');
            expect(control).not.toHaveClass('g');
        }
        expect(document.querySelectorAll('[data-group]')).toHaveLength(1);
    });

    it('使用方传入的 role、aria-label 与 aria-labelledby 优先于内置值', () => {
        const first = setup({ group: { role: 'region', 'aria-label': 'custom' } });
        expect(screen.getByRole('region', { name: 'custom' })).toBeInTheDocument();
        expect(screen.queryByRole('group', { name: zh_CN.Input.group })).toBeNull();
        first.view.unmount();
        setup({ group: { 'aria-labelledby': 'external' } });
        expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby', 'external');
    });

    it('带 label 时未声明属性落在分组元素，外层容器不接收', () => {
        setup({ group: { label: { text: 'Scores' }, 'data-group': '1' } });
        const group = screen.getByRole('group', { name: 'Scores' });
        expect(group).toHaveAttribute('data-group', '1');
        expect(group.closest(`.${prefixCls}-group-wrapper`)).not.toHaveAttribute('data-group');
    });

    it('原样渲染文本子节点', () => {
        const { view } = setup({ text: '-2' });
        expect(screen.getAllByRole('textbox')).toHaveLength(6);
        expect(view.container).toHaveTextContent('-2');
    });

    it('size 属性同时作用于分组与未指定 size 的子项', () => {
        setup({ group: { size: 'large' } });
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        for (const input of document.querySelectorAll('input')) {
            expect(input).toHaveClass(`${prefixCls}-large`);
        }
    });

    it('组未指定 size 时，子项取自己的值，其次全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'small' } };
        setup();
        expect(byPlaceholder('inherit')).toHaveClass(`${prefixCls}-small`);
        expect(byPlaceholder('own-size')).toHaveClass(`${prefixCls}-large`);
    });

    it('带 label 的分组：label 文本、位置类名，分组以 aria-labelledby 引用 label', () => {
        render(GroupLabel);
        const [top, left] = document.querySelectorAll(`.${prefixCls}-group-wrapper`);
        expect(top).toHaveClass(`${prefixCls}-group-wrapper-with-top-label`);
        expect(left).toHaveClass(`${prefixCls}-group-wrapper-with-left-label`);
        const score = screen.getByRole('group', { name: 'Score' });
        expect(score).toHaveClass('g');
        expect(score).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(score).not.toHaveAttribute('aria-label');
        expect(top).not.toHaveClass('g');
        const [scoreLabel, slotLabel] = document.querySelectorAll(`.${labelCls}`);
        expect(scoreLabel).toHaveTextContent('Score');
        expect(score).toHaveAttribute('aria-labelledby', scoreLabel.id);
        expect(scoreLabel).not.toHaveAttribute('for');
        expect(byPlaceholder('score')).not.toHaveAttribute('labelposition');
        const slotted = screen.getByRole('group', { name: 'Slot label extra' });
        expect(slotted).toHaveAttribute('aria-labelledby', slotLabel.id);
    });

    it('labelExtra snippet 渲染在 label 的 extra 区域', () => {
        render(GroupLabel);
        expect(document.querySelector(`.${labelCls}-extra`)).toHaveTextContent('extra');
        expect(document.querySelectorAll(`.${labelCls}-with-extra`)).toHaveLength(1);
    });

    it('同页多个带 label 的分组，group id 与 label id 都不重复', () => {
        render(GroupLabel);
        const ids = [...screen.getAllByRole('group'), ...document.querySelectorAll(`.${labelCls}`)].map((el) => el.id);
        expect(ids.every(Boolean)).toBe(true);
        expect(new Set(ids).size).toBe(6);
    });

    it('label.name 作为分组 id，label.id 作为 label 的 id', () => {
        render(GroupLabel);
        const group = screen.getByRole('group', { name: 'Named' });
        expect(group).toHaveAttribute('id', 'named');
        expect(group).toHaveAttribute('aria-labelledby', 'named-label');
        expect(document.getElementById('named-label')).toHaveTextContent('Named');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { InputGroup: { size: 'large' } };
        setup();
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        expect(byPlaceholder('inherit')).toHaveClass(`${prefixCls}-large`);
    });
});

describe('Svelte InputGroup 使用方监听', () => {
    it('传入 onfocusin、onfocusout 时与 onFocus、onBlur 同时触发', async () => {
        const onfocusin = vi.fn<() => void>();
        const onfocusout = vi.fn<() => void>();
        const onFocus = vi.fn<() => void>();
        const onBlur = vi.fn<() => void>();
        render(InputGroup, { props: { onfocusin, onfocusout, onFocus, onBlur } });
        const group = screen.getByRole('group');
        await fireEvent.focusIn(group);
        await fireEvent.focusOut(group);
        expect([onfocusin, onfocusout, onFocus, onBlur].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1, 1]);
    });
});

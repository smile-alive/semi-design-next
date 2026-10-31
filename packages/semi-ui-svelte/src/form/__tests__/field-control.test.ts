import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import FieldControlFixture from './field-control-fixture.svelte';

describe('Svelte Form 字段的 getControl', () => {
    it('FormInput 的 getControl() 返回 Input 实例，focus 让输入框获得焦点', () => {
        const { component } = render(FieldControlFixture);
        const input = component.getInput();
        expect(document.activeElement).not.toBe(screen.getByRole('textbox'));
        input?.getControl()?.focus();
        flushSync();
        expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('FormSelect 的 getControl().open() 展开下拉，close() 收起', () => {
        const { component } = render(FieldControlFixture);
        const select = component.getSelect();
        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        select?.getControl()?.open();
        flushSync();
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        select?.getControl()?.close();
        flushSync();
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });
});

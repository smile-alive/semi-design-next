/** @jsxImportSource vue */
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Select from '..';

const settle = () => new Promise((resolve) => setTimeout(resolve));
const getSelectionText = () => document.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`);

async function renderSelect(props: Record<string, unknown>) {
    const view = render(Select, { props: { motion: false, ...props } });
    await settle();
    return async (next: Record<string, unknown>) => {
        await view.rerender(next);
        await settle();
    };
}

describe('Select 的 optionList 与 modelValue 变化', () => {
    it('受控值不变、optionList 改了该项的 label 时，触发器显示新 label', async () => {
        const rerender = await renderSelect({ modelValue: 'abc', optionList: [{ value: 'abc', label: 'Abc' }] });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await rerender({ optionList: [{ value: 'abc', label: 'Abc 2' }] });
        expect(getSelectionText()).toHaveTextContent(/^Abc 2$/);
    });

    it('非受控 defaultValue 的选项晚到时，触发器从值换成 label', async () => {
        const rerender = await renderSelect({ defaultValue: 'abc', optionList: [] });
        expect(getSelectionText()).toHaveTextContent(/^abc$/);
        await rerender({ optionList: [{ value: 'abc', label: 'Abc' }] });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
    });

    it('受控值与 optionList 同时变化时，触发器显示新值在新列表中的 label', async () => {
        const rerender = await renderSelect({ modelValue: 'abc', optionList: [{ value: 'abc', label: 'Abc' }] });
        await rerender({ modelValue: 'new', optionList: [{ value: 'new', label: 'New' }] });
        expect(getSelectionText()).toHaveTextContent(/^New$/);
    });
});

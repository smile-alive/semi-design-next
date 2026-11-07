/** @jsxImportSource vue */
import { defineComponent, shallowRef } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import Input from '..';

const Demo = defineComponent(() => {
    const value = shallowRef('');
    return () => (
        <>
            <Input aria-label="lazy" modelValue={value.value} modelModifiers={{ lazy: true }} onUpdate:modelValue={(next: string) => (value.value = next)} />
            <button type="button">outside</button>
            <span data-testid="bound">{JSON.stringify(value.value)}</span>
        </>
    );
});

describe('Input v-model.lazy', () => {
    it('点击外部失焦，原生 change 先于 focusout，绑定值更新且输入框保留内容', async () => {
        render(Demo);
        await userEvent.click(screen.getByRole('textbox', { name: 'lazy' }));
        await userEvent.keyboard('semi');
        expect(screen.getByTestId('bound')).toHaveTextContent('""');
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        expect(screen.getByTestId('bound')).toHaveTextContent('"semi"');
        expect(screen.getByRole('textbox', { name: 'lazy' })).toHaveValue('semi');
    });

    it('按 Enter 触发原生 change，更新绑定值', async () => {
        render(Demo);
        await userEvent.click(screen.getByRole('textbox', { name: 'lazy' }));
        await userEvent.keyboard('semi');
        expect(screen.getByTestId('bound')).toHaveTextContent('""');
        await userEvent.keyboard('{Enter}');
        expect(screen.getByTestId('bound')).toHaveTextContent('"semi"');
    });
});

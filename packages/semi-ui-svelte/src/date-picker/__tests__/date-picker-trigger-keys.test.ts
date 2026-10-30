import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import { getPopup } from './date-picker-dom-utils';
import TriggerKeysFixture, { type TriggerKeysFixtureStore } from './date-picker-trigger-keys-fixture.svelte';
import { settle } from './test-utils';

async function mountTrigger(variant: TriggerKeysFixtureStore['variant']) {
    const store = createStore<TriggerKeysFixtureStore>({ variant, presses: 0 });
    render(TriggerKeysFixture, { props: { store } });
    await settle();
    return store;
}

describe('Svelte DatePicker trigger snippet 的键盘', () => {
    it.each(['{Enter}', ' ', '{ArrowDown}'])('trigger 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const store = await mountTrigger('inner');

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        await settle();
        expect(store.presses).toBe(key === '{ArrowDown}' ? 0 : 1);
        expect(getPopup()).toBeNull();
    });

    it.each(['{Enter}', ' '])('trigger 自带可聚焦按钮时，Tab 到按钮后按 %j 打开面板', async (key) => {
        await mountTrigger('pick');

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'pick' })).toHaveFocus();
        await userEvent.keyboard(key);
        await settle();
        expect(getPopup()).not.toBeNull();
    });
});

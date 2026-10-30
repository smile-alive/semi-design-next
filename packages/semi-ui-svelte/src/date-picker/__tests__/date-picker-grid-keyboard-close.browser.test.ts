import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './date-picker-fixture.svelte';
import { dp } from './test-utils';

function setup(init: Partial<Omit<FixtureStore, 'props'>> = {}) {
    const store = createStore<FixtureStore>({ target: 'value', mode: 'one-way', accept: true, log: [], ...init, props: { motion: false } });
    render(Fixture, { props: { store } });
    flushSync();
    return store;
}

const getInput = () => document.querySelector<HTMLInputElement>(`.${dp} input`) as HTMLInputElement;
const changes = (store: FixtureStore) => store.log.filter((entry) => entry.startsWith('change'));

describe('Svelte DatePicker 日历网格键盘关闭面板（浏览器）', () => {
    it('用 Enter 选择日期后关闭面板，焦点返回输入框', async () => {
        setup({ value: new Date(2019, 8, 11), open: true });
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{ArrowRight}{Enter}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        expect(getInput()).toHaveValue('2019-09-12');
        expect(getInput()).toHaveFocus();
    });

    it('Esc 关闭面板且不选择，焦点返回输入框', async () => {
        const store = setup({ value: new Date(2019, 8, 11), open: true });
        await tabTo(await screen.findByRole('grid'));
        await userEvent.keyboard('{ArrowRight}{Escape}');
        await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
        expect(getInput()).toHaveValue('2019-09-11');
        expect(getInput()).toHaveFocus();
        expect(changes(store)).toEqual([]);
    });
});

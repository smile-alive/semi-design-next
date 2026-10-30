import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import SplitCase from './split-case.svelte';

const button = (name: string) => screen.getByText(name).closest('button') as HTMLButtonElement;

describe('Svelte SplitButtonGroup', () => {
    it('根元素为 role="group"，aria-label 命名，使用方 role 不覆盖 group', () => {
        render(SplitCase, { props: { store: createStore({ labels: ['a'] }) } });
        expect(screen.getByRole('group', { name: 'split' })).toHaveClass('semi-button-split');
    });

    it('标记首尾按钮，增减按钮后同样生效', async () => {
        const store = createStore({ labels: ['a', 'b'] });
        render(SplitCase, { props: { store } });
        await waitFor(() => expect(button('b')).toHaveClass('semi-button-last'));
        expect(button('a')).toHaveClass('semi-button-first');
        store.labels = ['a', 'b', 'c'];
        flushSync();
        await waitFor(() => expect(button('c')).toHaveClass('semi-button-last'));
        expect(button('b')).not.toHaveClass('semi-button-last');
        store.labels = ['a', 'b'];
        flushSync();
        await waitFor(() => expect(button('b')).toHaveClass('semi-button-last'));
        expect(button('a')).toHaveClass('semi-button-first');
    });
});

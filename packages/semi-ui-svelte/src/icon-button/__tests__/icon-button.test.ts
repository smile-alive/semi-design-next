import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import ButtonCase from '../../button/__tests__/button-case.svelte';
import GroupCase from '../../button/__tests__/group-case.svelte';

type Case = NonNullable<Parameters<typeof ButtonCase>[1]>['store'];
type GroupStore = NonNullable<Parameters<typeof GroupCase>[1]>['store'];

describe('Svelte IconButton', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('渲染单个原生 button，icon 与 children 都渲染', () => {
        const { container } = render(ButtonCase, { props: { store: createStore<Case>({ kind: 'icon-button', props: { 'aria-label': 'edit' }, icon: 'edit', text: 'text' }) } });
        expect(container.firstElementChild).toBe(screen.getByRole('button', { name: 'edit' }));
        expect(container.querySelectorAll('.semi-icon-edit')).toHaveLength(1);
        expect(screen.getByText('text')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveClass('semi-button-with-icon');
    });

    it('读 IconButton 全局键，自身值与组值优先于全局值', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { type: 'danger', theme: 'solid' } };
        const view = render(ButtonCase, { props: { store: createStore<Case>({ kind: 'icon-button', props: { 'aria-label': 'a' }, icon: 'edit' }) } });
        expect(screen.getByRole('button')).toHaveClass('semi-button-danger', 'semi-button-solid');
        view.unmount();
        render(GroupCase, { props: { store: createStore<GroupStore>({ group: { type: 'warning' }, items: [{ kind: 'icon-button', label: 'a', props: { theme: 'light' } }] }) } });
        expect(screen.getByRole('button')).toHaveClass('semi-button-warning', 'semi-button-light');
    });
});

import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSelectSpec, type TreeSelectSpecProps } from '@test/specs/tree-select';
import TreeSelectSpecFixture from './tree-select-spec-fixture.svelte';

const mount: SpecMount<TreeSelectSpecProps> = (props) => {
    const store = createStore<TreeSelectSpecProps>(props);
    const view = render(TreeSelectSpecFixture, { props: { store } });
    flushSync();
    return {
        container: view.container,
        update: async (next) => {
            Object.assign(store, next);
            flushSync();
        },
        unmount: view.unmount,
    };
};

treeSelectSpec(mount);

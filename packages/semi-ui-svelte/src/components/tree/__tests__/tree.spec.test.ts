import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSpec, type TreeSpecProps } from '@test/specs/tree';
import TreeSpecFixture from './tree-spec-fixture.svelte';

const mount: SpecMount<TreeSpecProps> = (props) => {
    const store = createStore<TreeSpecProps>(props);
    const view = render(TreeSpecFixture, { props: { store } });
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

treeSpec(mount);

import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { paginationSpec, type PaginationSpecProps } from '@test/specs/pagination';
import type { SpecMount } from '@test/specs/shared/define-spec';
import PaginationSpecFixture from './pagination-spec-fixture.svelte';

const mount: SpecMount<PaginationSpecProps> = (props) => {
    const store = createStore<PaginationSpecProps>(props);
    const view = render(PaginationSpecFixture, { props: { store } });
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

paginationSpec(mount);

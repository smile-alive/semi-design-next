import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { collapseSpec, type CollapseSpecProps } from '@test/specs/collapse';
import type { SpecMount } from '@test/specs/shared/define-spec';
import CollapseSpecFixture from './collapse-spec-fixture.svelte';

const mount: SpecMount<CollapseSpecProps> = (props) => {
    const store = createStore<CollapseSpecProps>(props);
    const view = render(CollapseSpecFixture, { props: { store } });
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

collapseSpec(mount);

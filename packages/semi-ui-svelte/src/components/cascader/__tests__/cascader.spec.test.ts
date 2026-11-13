import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { cascaderSpec, type CascaderSpecProps } from '@test/specs/cascader';
import type { SpecMount } from '@test/specs/shared/define-spec';
import CascaderSpecFixture from './cascader-spec-fixture.svelte';

const mount: SpecMount<CascaderSpecProps> = (props) => {
    const store = createStore<CascaderSpecProps>(props);
    const view = render(CascaderSpecFixture, { props: { store } });
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

cascaderSpec(mount);

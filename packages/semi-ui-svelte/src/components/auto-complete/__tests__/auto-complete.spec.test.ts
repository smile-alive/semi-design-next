import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { autoCompleteSpec, type AutoCompleteSpecProps } from '@test/specs/auto-complete';
import type { SpecMount } from '@test/specs/shared/define-spec';
import AutoCompleteSpecFixture from './auto-complete-spec-fixture.svelte';

const mount: SpecMount<AutoCompleteSpecProps> = (props) => {
    const store = createStore<AutoCompleteSpecProps>(props);
    const view = render(AutoCompleteSpecFixture, { props: { store } });
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

autoCompleteSpec(mount);

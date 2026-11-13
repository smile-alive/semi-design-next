import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { selectSpec, type SelectSpecProps } from '@test/specs/select';
import type { SpecMount } from '@test/specs/shared/define-spec';
import SelectSpecFixture from './select-spec-fixture.svelte';

const mount: SpecMount<SelectSpecProps> = (props) => {
    const store = createStore<SelectSpecProps>(props);
    const view = render(SelectSpecFixture, { props: { store } });
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

selectSpec(mount);

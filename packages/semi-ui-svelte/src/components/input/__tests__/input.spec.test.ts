import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { inputSpec, type InputSpecProps } from '@test/specs/input';
import type { SpecMount } from '@test/specs/shared/define-spec';
import InputSpecFixture from './input-spec-fixture.svelte';

const mount: SpecMount<InputSpecProps> = (props) => {
    const store = createStore<InputSpecProps>(props);
    const view = render(InputSpecFixture, { props: { store } });
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

inputSpec(mount);

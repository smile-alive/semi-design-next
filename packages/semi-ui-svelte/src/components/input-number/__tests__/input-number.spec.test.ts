import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { inputNumberSpec, type InputNumberSpecProps } from '@test/specs/input-number';
import type { SpecMount } from '@test/specs/shared/define-spec';
import InputNumberSpecFixture from './input-number-spec-fixture.svelte';

const mount: SpecMount<InputNumberSpecProps> = (props) => {
    const store = createStore<InputNumberSpecProps>(props);
    const view = render(InputNumberSpecFixture, { props: { store } });
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

inputNumberSpec(mount);

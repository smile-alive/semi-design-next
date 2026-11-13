import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { dropdownSpec, type DropdownSpecProps } from '@test/specs/dropdown';
import type { SpecMount } from '@test/specs/shared/define-spec';
import DropdownSpecFixture from './dropdown-spec-fixture.svelte';

const mount: SpecMount<DropdownSpecProps> = (props) => {
    const store = createStore<DropdownSpecProps>(props);
    const view = render(DropdownSpecFixture, { props: { store } });
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

dropdownSpec(mount);

import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { modalSpec, type ModalSpecProps } from '@test/specs/modal';
import type { SpecMount } from '@test/specs/shared/define-spec';
import ModalSpecFixture from './modal-spec-fixture.svelte';

const mount: SpecMount<ModalSpecProps> = (props) => {
    const store = createStore<ModalSpecProps>(props);
    const view = render(ModalSpecFixture, { props: { store } });
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

modalSpec(mount);

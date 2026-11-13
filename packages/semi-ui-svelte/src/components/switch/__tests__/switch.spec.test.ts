import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { switchSpec, type SwitchSpecProps } from '@test/specs/switch';
import SwitchSpecFixture from './switch-spec-fixture.svelte';

const mount: SpecMount<SwitchSpecProps> = (props) => {
    const store = createStore<SwitchSpecProps>(props);
    const view = render(SwitchSpecFixture, { props: { store } });
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

switchSpec(mount);

import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { popoverSpec, type PopoverSpecProps } from '@test/specs/popover';
import type { SpecMount } from '@test/specs/shared/define-spec';
import PopoverSpecFixture from './popover-spec-fixture.svelte';

const mount: SpecMount<PopoverSpecProps> = (props) => {
    const store = createStore<PopoverSpecProps>(props);
    const view = render(PopoverSpecFixture, { props: { store } });
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

popoverSpec(mount);

import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sideSheetSpec, type SideSheetSpecProps } from '@test/specs/side-sheet';
import SideSheetSpecFixture from './side-sheet-spec-fixture.svelte';

const mount: SpecMount<SideSheetSpecProps> = (props) => {
    const store = createStore<SideSheetSpecProps>(props);
    const view = render(SideSheetSpecFixture, { props: { store } });
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

sideSheetSpec(mount);

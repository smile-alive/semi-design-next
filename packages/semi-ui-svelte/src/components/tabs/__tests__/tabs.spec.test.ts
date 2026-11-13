import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tabsSpec, type TabsSpecProps } from '@test/specs/tabs';
import TabsSpecFixture from './tabs-spec-fixture.svelte';

const mount: SpecMount<TabsSpecProps> = (props) => {
    const store = createStore<TabsSpecProps>(props);
    const view = render(TabsSpecFixture, { props: { store } });
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

tabsSpec(mount);

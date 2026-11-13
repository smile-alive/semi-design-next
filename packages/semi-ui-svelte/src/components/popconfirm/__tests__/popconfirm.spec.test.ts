import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { popconfirmSpec, type PopconfirmSpecProps } from '@test/specs/popconfirm';
import type { SpecMount } from '@test/specs/shared/define-spec';
import PopconfirmSpecFixture from './popconfirm-spec-fixture.svelte';

const mount: SpecMount<PopconfirmSpecProps> = (props) => {
    const store = createStore<PopconfirmSpecProps>(props);
    const view = render(PopconfirmSpecFixture, { props: { store } });
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

popconfirmSpec(mount);

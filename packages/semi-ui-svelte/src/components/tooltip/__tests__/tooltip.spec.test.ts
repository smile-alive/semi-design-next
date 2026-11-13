import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tooltipSpec, type TooltipSpecProps } from '@test/specs/tooltip';
import TooltipSpecFixture from './tooltip-spec-fixture.svelte';

const mount: SpecMount<TooltipSpecProps> = (props) => {
    const store = createStore<TooltipSpecProps>(props);
    const view = render(TooltipSpecFixture, { props: { store } });
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

tooltipSpec(mount);

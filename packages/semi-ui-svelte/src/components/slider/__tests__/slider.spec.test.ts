import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sliderSpec, type SliderSpecProps } from '@test/specs/slider';
import SliderSpecFixture from './slider-spec-fixture.svelte';

const mount: SpecMount<SliderSpecProps> = (props) => {
    const store = createStore<SliderSpecProps>(props);
    const view = render(SliderSpecFixture, { props: { store } });
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

sliderSpec(mount);

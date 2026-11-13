import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { ratingSpec, type RatingSpecProps } from '@test/specs/rating';
import type { SpecMount } from '@test/specs/shared/define-spec';
import RatingSpecFixture from './rating-spec-fixture.svelte';

const mount: SpecMount<RatingSpecProps> = (props) => {
    const store = createStore<RatingSpecProps>(props);
    const view = render(RatingSpecFixture, { props: { store } });
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

ratingSpec(mount);

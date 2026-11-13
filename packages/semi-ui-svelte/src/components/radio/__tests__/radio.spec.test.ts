import { flushSync, type Component } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { radioSpec, type RadioGroupSpecProps, type RadioSpecProps } from '@test/specs/radio';
import type { SpecMount } from '@test/specs/shared/define-spec';
import GroupSpecFixture from './radio-group-spec-fixture.svelte';
import RadioSpecFixture from './radio-spec-fixture.svelte';

function createMount<P extends object>(Fixture: Component<{ store: P }>): SpecMount<P> {
    return (props) => {
        const store = createStore<P>(props);
        const view = render(Fixture, { props: { store } });
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
}

radioSpec(createMount<RadioSpecProps>(RadioSpecFixture), createMount<RadioGroupSpecProps>(GroupSpecFixture));

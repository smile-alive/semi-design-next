import { flushSync, type Component } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { checkboxSpec, type CheckboxGroupSpecProps, type CheckboxSpecProps } from '@test/specs/checkbox';
import type { SpecMount } from '@test/specs/shared/define-spec';
import GroupSpecFixture from './checkbox-group-spec-fixture.svelte';
import CheckboxSpecFixture from './checkbox-spec-fixture.svelte';

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

checkboxSpec(createMount<CheckboxSpecProps>(CheckboxSpecFixture), createMount<CheckboxGroupSpecProps>(GroupSpecFixture));

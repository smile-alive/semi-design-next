import { render } from '@testing-library/svelte';
import { vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FormApi } from '../interface';
import FieldsFixture, { type AnyFieldSpec, type AnyFieldsStore } from './b-fields-fixture.svelte';
import GroupFixture, { type GroupStore } from './b-group.svelte';
import WithFieldFixture, { type WithFieldStore } from './b-with-field.svelte';

function apiCollector() {
    let formApi: FormApi | undefined;
    const onApi = vi.fn<(api: FormApi) => void>((api) => {
        formApi = api;
    });
    return { onApi, api: () => formApi as FormApi };
}

/** Like renderForm, with every field type available (DatePicker and Upload included) */
export function renderAnyFields(form: Record<string, unknown>, fields: AnyFieldSpec[]) {
    const store = createStore<AnyFieldsStore>({ form, fields });
    const { onApi, api } = apiCollector();
    const view = render(FieldsFixture, { props: { store, onApi } });
    return { ...view, store, api };
}

/** A field around a custom control, through FormField */
export function renderWithField(store: WithFieldStore) {
    const state = createStore<WithFieldStore>(store);
    const { onApi, api } = apiCollector();
    const view = render(WithFieldFixture, { props: { store: state, onApi } });
    return { ...view, store: state, api };
}

export function renderGroup(store: GroupStore) {
    const state = createStore<GroupStore>(store);
    const { onApi, api } = apiCollector();
    const view = render(GroupFixture, { props: { store: state, onApi } });
    return { ...view, store: state, api };
}

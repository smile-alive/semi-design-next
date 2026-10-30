import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FormApi } from '../interface';
import FormFixture, { type FieldSpec, type FormFixtureStore } from './form-fixture.svelte';

export const prefix = 'semi-form';
export const fieldSelector = `.${prefix}-field`;
export const labelSelector = `.${prefix}-field-label`;
export const errorSelector = `.${prefix}-field-error-message`;

/** Lets the foundation's promises (validation, submit) and the effects they schedule run */
export async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
}

/** Renders a Form with the given fields; `api()` is the formApi it reported through getFormApi */
export function renderForm(form: Record<string, unknown> = {}, fields: FieldSpec[] = [], options: Omit<FormFixtureStore, 'form' | 'fields'> = {}) {
    const store = createStore<FormFixtureStore>({ form, fields, ...options });
    let formApi: FormApi | undefined;
    const onGetFormApi = vi.fn<(api: FormApi) => void>((api) => {
        formApi = api;
    });
    const view = render(FormFixture, { props: { store, onApi: onGetFormApi } });
    return { ...view, store, onGetFormApi, api: () => formApi as FormApi };
}

export const input = (field: string, props: Record<string, unknown> = {}): FieldSpec => ({ type: 'input', props: { field, ...props } });

export const businessOptions = [
    { value: 'abc', label: 'Abc' },
    { value: 'hotsoon', label: 'Hotsoon' },
    { value: 'topbuzz', label: 'TopBuzz' },
];

export const select = (props: Record<string, unknown> = {}): FieldSpec => ({ type: 'select', props: { field: 'business', label: 'business', optionList: businessOptions, ...props } });

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Input's native input inside the element matching `scope` */
export const inputIn = (scope: string) => document.querySelector<HTMLInputElement>(`${scope} input.semi-input`) as HTMLInputElement;

export function getInput(scope: ParentNode = document) {
    return scope.querySelector<HTMLInputElement>('input.semi-input') as HTMLInputElement;
}

export async function typeInto(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    await fireEvent.input(element, { target: { value } });
    flushSync();
}

export async function blur(element: Element) {
    await fireEvent.blur(element);
    await fireEvent.focusOut(element);
    flushSync();
}

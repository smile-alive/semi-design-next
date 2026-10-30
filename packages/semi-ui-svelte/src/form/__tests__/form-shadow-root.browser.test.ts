import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FormApi } from '../interface';
import FormFixture, { type FormFixtureStore } from './form-fixture.svelte';
import { input, settle } from './helpers';

const toTop = { behavior: 'auto', block: 'start' } as const;

function expectInViewport(element: Element) {
    const { top } = element.getBoundingClientRect();
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(window.innerHeight);
}

describe('Svelte Form（ShadowRoot）', () => {
    it('open ShadowRoot 内 autoScrollToError、scrollToError 与 scrollToField 滚动到字段', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        let api = {} as FormApi;
        const store = createStore<FormFixtureStore>({
            form: { autoScrollToError: toTop },
            fields: [input('spacer', { fieldStyle: 'height: 300vh' }), input('b', { rules: [{ required: true, message: 'required' }] })],
        });
        const view = render(FormFixture, { target: mount, props: { store, onApi: (formApi: FormApi) => (api = formApi) } });
        try {
            const field = shadow.querySelector('.semi-form-field[x-field-id="b"]') as Element;
            await expect(api.validate()).rejects.toBeDefined();
            await settle();
            expectInViewport(field);
            window.scrollTo(0, 0);
            api.scrollToError({ field: 'b', scrollOpts: toTop });
            expectInViewport(field);
            window.scrollTo(0, 0);
            api.scrollToField('b', toTop);
            expectInViewport(field);
        } finally {
            view.unmount();
            host.remove();
            window.scrollTo(0, 0);
        }
    });
});

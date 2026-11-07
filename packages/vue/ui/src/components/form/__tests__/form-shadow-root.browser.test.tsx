/** @jsxImportSource vue */
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, type FormApi } from '..';
import { flush, FormInput } from './fixtures/fields';

const toTop = { behavior: 'auto', block: 'start' } as const;

function expectInViewport(element: Element) {
    const { top } = element.getBoundingClientRect();
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(window.innerHeight);
}

describe('Form（ShadowRoot）', () => {
    it('open ShadowRoot 内 autoScrollToError、scrollToError 与 scrollToField 滚动到字段', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        let formApi: FormApi | undefined;
        const view = render(Form, {
            container: mount,
            props: { autoScrollToError: toTop, onGetFormApi: (api: FormApi) => (formApi = api) },
            slots: {
                default: () => (
                    <>
                        <div style={{ height: '300vh' }} />
                        <FormInput field="b" rules={[{ required: true, message: 'required' }]} />
                    </>
                ),
            },
        });
        try {
            const api = formApi as FormApi;
            const field = shadow.querySelector('.semi-form-field[x-field-id="b"]') as Element;
            await expect(api.validate()).rejects.toBeDefined();
            await flush();
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

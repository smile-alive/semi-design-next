import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

const toTop = { behavior: 'auto', block: 'start' } as const;

const expectInViewport = (element: Element) => {
    const { top } = element.getBoundingClientRect();
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(window.innerHeight);
};

describe('Form（ShadowRoot）', () => {
    it('open ShadowRoot 内 autoScrollToError、scrollToError 与 scrollToField 滚动到字段', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        let api: FormApi;
        const view = render(
            <Form autoScrollToError={toTop} getFormApi={(formApi) => (api = formApi)}>
                <div style={{ height: '300vh' }} />
                <Form.Input field="b" rules={[{ required: true, message: 'required' }]} />
            </Form>,
            { container: mount }
        );
        try {
            const field = shadow.querySelector('.semi-form-field[x-field-id="b"]');
            await act(() => expect(api.validate()).rejects.toBeDefined());
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

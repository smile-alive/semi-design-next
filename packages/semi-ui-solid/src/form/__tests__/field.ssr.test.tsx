import { describe, expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import { Form, FormInput } from '..';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

describe('不创建未插入的 JSX', () => {
    it('ErrorMessage 有 error 时不创建 helpText', async () => {
        const help = counter('help text');
        const { html, errors } = await renderServer({ render: () => <Form.ErrorMessage error="bad" helpText={<help.Counted />} /> });
        expect(errors).toEqual([]);
        expect(html).toContain('bad');
        expect(html).not.toContain('help text');
        expect(help.state.created).toBe(0);
    });

    it('ErrorMessage 的空数组 error 不创建 helpText', async () => {
        const help = counter('help text');
        const { errors } = await renderServer({ render: () => <Form.ErrorMessage error={[false, false] as never} helpText={<help.Counted />} /> });
        expect(errors).toEqual([]);
        expect(help.state.created).toBe(0);
    });

    it('noErrorMessage 时不创建 helpText', async () => {
        const help = counter('help text');
        const { html, errors } = await renderServer({
            render: () => (
                <Form>
                    <FormInput field="a" noErrorMessage helpText={<help.Counted />} />
                </Form>
            ),
        });
        expect(errors).toEqual([]);
        expect(html).not.toContain('help text');
        expect(help.state.created).toBe(0);
    });

    it('noLabel 时不创建 label', async () => {
        const label = counter('label text');
        const { html, errors } = await renderServer({
            render: () => (
                <Form>
                    <FormInput field="a" noLabel label={<label.Counted />} />
                </Form>
            ),
        });
        expect(errors).toEqual([]);
        expect(html).not.toContain('label text');
        expect(label.state.created).toBe(0);
    });

    it('pure 布局不创建 label、helpText 与 extraText', async () => {
        const label = counter('label text');
        const help = counter('help text');
        const extra = counter('extra text');
        const { errors } = await renderServer({
            render: () => (
                <Form>
                    <FormInput field="a" pure label={<label.Counted />} helpText={<help.Counted />} extraText={<extra.Counted />} />
                </Form>
            ),
        });
        expect(errors).toEqual([]);
        expect(label.state.created).toBe(0);
        expect(help.state.created).toBe(0);
        expect(extra.state.created).toBe(0);
    });

    it('未知的 extraTextPosition 不创建 extraText', async () => {
        const extra = counter('extra text');
        const { errors } = await renderServer({
            render: () => (
                <Form>
                    <FormInput field="a" extraTextPosition={'none' as never} extraText={<extra.Counted />} />
                </Form>
            ),
        });
        expect(errors).toEqual([]);
        expect(extra.state.created).toBe(0);
    });
});

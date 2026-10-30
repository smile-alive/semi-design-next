import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import CompositeFixture from './composite-fixture.svelte';
import FormFixture, { type FieldSpec, type FormFixtureStore } from './form-fixture.svelte';

function renderForm(form: Record<string, unknown>, fields: FieldSpec[]) {
    const store = createStore<FormFixtureStore>({ form, fields });
    return render(FormFixture, { props: { store, onApi: () => undefined } }).body;
}

describe('Svelte Form 服务端首帧', () => {
    it('首帧带 form id、字段初值，label 与控件互相关联', () => {
        const body = renderForm({ id: 'f', initValues: { name: 'semi' } }, [
            { type: 'input', props: { field: 'name', label: '名称' } },
            { type: 'checkbox', props: { field: 'agree', label: '同意', initValue: true } },
        ]);
        expect(body).toMatch(/<form[^>]*id="f"/);
        expect(body).toContain('x-form-id="f"');
        expect(body).toMatch(/<input[^>]*value="semi"/);
        const inputId = /<input id="([^"]+)"[^>]*value="semi"/.exec(body)?.[1];
        expect(inputId).toBeTruthy();
        expect(body).toMatch(new RegExp(`<label[^>]*for="${inputId}"[^>]*>[\\s\\S]*?名称`));
        expect(body).toMatch(/<input[^>]*checked=""[^>]*type="checkbox"/);
    });

    it('服务端渲染时在 form 元素上输出生成的 id，并写入 x-form-id', () => {
        const body = renderForm({}, [{ type: 'input', props: { field: 'name' } }]);
        const id = /<form[^>]* id="([^"]+)"/.exec(body)?.[1];
        expect(id).toBeTruthy();
        expect(body).toContain(`x-form-id="${id}"`);
    });

    it('首帧按 rules 标出必填，ArrayField 渲染 initValue 的行', () => {
        const body = renderForm({}, [{ type: 'input', props: { field: 'name', label: '名称', rules: [{ required: true }] } }]);
        expect(body).toContain('semi-form-field-label-required');
        expect(body).toContain('aria-required="true"');
        const array = render(CompositeFixture, { props: { kind: 'array' } }).body;
        expect(array.match(/data-testid="row"/g)).toHaveLength(2);
        expect(array).toMatch(/<input[^>]*value="a"/);
        expect(array).toMatch(/<input[^>]*value="b"/);
    });
});

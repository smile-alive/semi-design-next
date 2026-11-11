import { For, Show, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { type ArrayFieldChildrenProps, type FormApi, type FormProps, ArrayField, Form, FormInput } from '..';

const values = () => screen.queryAllByRole('textbox').map((input) => (input as HTMLInputElement).value);

function renderToggledField(formProps: FormProps = {}) {
    const [shown, setShown] = createSignal(true);
    let api: FormApi | undefined;
    render(() => (
        <Form getFormApi={(formApi) => (api = formApi)} {...formProps}>
            <Show when={shown()}>
                <FormInput field="name" />
            </Show>
        </Form>
    ));
    return { api: () => api!, setShown };
}

function renderRows(initRows: Array<{ name: string }>) {
    const [shown, setShown] = createSignal(true);
    let api: FormApi | undefined;
    let rows: ArrayFieldChildrenProps | undefined;
    render(() => (
        <Form getFormApi={(formApi) => (api = formApi)} initValues={{ rows: initRows }}>
            <Show when={shown()}>
                <ArrayField field="rows">
                    {(props) => {
                        rows = props;
                        return <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}.name`} />}</For>;
                    }}
                </ArrayField>
            </Show>
        </Form>
    ));
    return { api: () => api!, rows: () => rows!, setShown };
}

describe('Form keepState', () => {
    it('默认保留卸载字段的值、错误与 touched，重新挂载后恢复', () => {
        const { api, setShown } = renderToggledField();
        api().setValue('name', 'kept');
        api().setError('name', 'kept-error');
        api().setTouched('name', true);
        setShown(false);
        expect(api().getFormState()).toEqual({ values: { name: 'kept' }, errors: { name: ['kept-error'] }, touched: { name: true } });
        setShown(true);
        expect(values()).toEqual(['kept']);
        expect(screen.getByText('kept-error')).toBeInTheDocument();
    });

    it('Form 的 keepState={false} 让卸载字段清除自己的状态', () => {
        const { api, setShown } = renderToggledField({ keepState: false });
        api().setValue('name', 'gone');
        api().setError('name', 'gone-error');
        setShown(false);
        expect(api().getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        setShown(true);
        expect(values()).toEqual(['']);
    });
});

describe('ArrayField 状态保留与行操作', () => {
    it('整个 ArrayField 卸载后保留行的值，重新挂载按表单值渲染', () => {
        const { api, setShown } = renderRows([{ name: 'a' }, { name: 'b' }]);
        api().setValue('rows[1].name', 'changed');
        setShown(false);
        expect(api().getValue('rows')).toEqual([{ name: 'a' }, { name: 'changed' }]);
        setShown(true);
        expect(values()).toEqual(['a', 'changed']);
        expect(api().getValue('rows')).toEqual([{ name: 'a' }, { name: 'changed' }]);
    });

    it('删除中间行后，后续行不带回被删行的状态，新增行为空', () => {
        const { api, rows } = renderRows([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
        api().setError('rows[1].name', 'b-error');
        api().setTouched('rows[1].name', true);
        rows().arrayFields[1].remove();
        expect(values()).toEqual(['a', 'c']);
        expect(api().getError('rows[1].name')).toBeUndefined();
        expect(api().getTouched('rows[1].name')).toBeUndefined();
        expect(screen.queryByText('b-error')).toBeNull();
        rows().add();
        expect(values()).toEqual(['a', 'c', '']);
        expect(api().getError('rows[2].name')).toBeUndefined();
    });

    it('move 把行连同错误与 touched 移到目标位置，越界的下标按首尾处理', () => {
        const { api, rows } = renderRows([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
        api().setError('rows[0].name', 'a-error');
        api().setTouched('rows[0].name', true);
        rows().move(0, 2);
        expect(values()).toEqual(['b', 'c', 'a']);
        expect(api().getValue('rows')).toEqual([{ name: 'b' }, { name: 'c' }, { name: 'a' }]);
        expect(api().getError('rows[2].name')).toEqual(['a-error']);
        expect(api().getError('rows[0].name')).toBeUndefined();
        expect(api().getTouched('rows[2].name')).toBe(true);
        rows().move(5, -1);
        expect(values()).toEqual(['a', 'b', 'c']);
        expect(api().getError('rows[0].name')).toEqual(['a-error']);
    });
});

import { Index, Show } from 'solid-js';
import { Button, Form, FormInput, FormSelect, TextArea, type FormApi } from '@fibrae/semi-ui-solid';

interface Effect {
    name: string;
    type: string;
    key: number;
}

interface FormValues {
    effects: Effect[];
}

const initValues: FormValues = {
    effects: [
        { name: '脸部贴纸', type: '2D', key: 1 },
        { name: '背景贴纸', type: '3D', key: 2 },
    ],
};

export default function FormDemo() {
    let formApi: FormApi<FormValues> | undefined;
    let nextKey = 3;

    const add = () => {
        const effects = formApi?.getValue('effects') ?? [];
        formApi?.setValue('effects', [...effects, { name: '', type: '', key: nextKey++ }]);
    };

    const remove = (key: number) => {
        const effects = (formApi?.getValue('effects') ?? []).filter((effect: Effect) => key !== effect.key);
        formApi?.setValue('effects', effects.length ? effects : undefined);
    };

    return (
        <Form<FormValues> getFormApi={(api) => (formApi = api)} initValues={initValues} style={{ width: '500px' }} labelPosition="left" labelWidth="180px">
            {(form) => (
                <>
                    <Button onClick={add}>添加</Button>
                    {/* fields are bound by position, so rows are tracked by index, not by object identity */}
                    <Show when={form.values.effects}>
                        <Index each={form.values.effects}>
                            {(effect, i) => (
                                <div style={{ width: '1000px', display: 'flex' }}>
                                    <FormInput field={`effects[${i}].name`} aria-label={`特效 ${i + 1} 名称`} style={{ width: '200px', 'margin-right': '12px' }} />
                                    <FormSelect field={`effects[${i}].type`} style={{ width: '90px' }}>
                                        <FormSelect.Option value="2D">2D</FormSelect.Option>
                                        <FormSelect.Option value="3D">3D</FormSelect.Option>
                                    </FormSelect>
                                    <Button type="danger" onClick={() => remove(effect().key)} style={{ margin: '12px' }}>
                                        删除
                                    </Button>
                                </div>
                            )}
                        </Index>
                    </Show>
                    <TextArea aria-label="表单值" style={{ 'margin-top': '10px' }} value={JSON.stringify(form.formState.values)} />
                </>
            )}
        </Form>
    );
}

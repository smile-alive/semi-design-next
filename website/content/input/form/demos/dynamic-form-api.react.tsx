import { useRef } from 'react';
import { Form, FormInput, FormSelect, Button, TextArea, type FormApi } from '@fibrae/semi-ui-react';

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
    const formApiRef = useRef<FormApi<FormValues> | null>(null);
    const idRef = useRef(3);

    const add = () => {
        const effects = formApiRef.current?.getValue('effects') ?? [];
        formApiRef.current?.setValue('effects', [...effects, { name: '', type: '', key: idRef.current++ }]);
    };

    const remove = (key: number) => {
        const effects = (formApiRef.current?.getValue('effects') ?? []).filter((effect) => key !== effect.key);
        formApiRef.current?.setValue('effects', effects.length ? effects : undefined);
    };

    return (
        <Form
            getFormApi={(api) => {
                formApiRef.current = api;
            }}
            initValues={initValues}
            style={{ width: 500 }}
            labelPosition="left"
            labelWidth="180px"
        >
            {(form) => (
                <>
                    <Button onClick={add}>添加</Button>
                    {form.values.effects &&
                        form.values.effects.map((effect, i) => (
                            <div key={effect.key} style={{ width: 1000, display: 'flex' }}>
                                <FormInput field={`effects[${i}].name`} aria-label={`特效 ${i + 1} 名称`} style={{ width: 200, marginInlineEnd: 12 }} />
                                <FormSelect field={`effects[${i}].type`} style={{ width: 90 }}>
                                    <FormSelect.Option value="2D">2D</FormSelect.Option>
                                    <FormSelect.Option value="3D">3D</FormSelect.Option>
                                </FormSelect>
                                <Button type="danger" onClick={() => remove(effect.key)} style={{ margin: 12 }}>
                                    删除
                                </Button>
                            </div>
                        ))}
                    <TextArea aria-label="表单值" style={{ marginBlockStart: 10 }} value={JSON.stringify(form.formState.values)} />
                </>
            )}
        </Form>
    );
}
